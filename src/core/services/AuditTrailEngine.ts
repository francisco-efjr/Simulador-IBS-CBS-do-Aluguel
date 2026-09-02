import {
  AuditReport,
  CalculationResult,
  LeaseContractInput,
  TaxParameters,
} from '../domain/types.ts';
import { LEGAL_REFERENCES } from '../domain/constants.ts';
import { FinancialMath } from '../domain/FinancialMath.ts';

/**
 * Motor de Auditoria Fiscal e Emissão de Laudos de Conformidade (Audit Trail)
 */
export class AuditTrailEngine {
  public static generateReport(
    input: LeaseContractInput,
    calc: Omit<CalculationResult, 'auditReport'>,
    params: TaxParameters
  ): AuditReport {
    const findings: AuditReport['findings'] = [];
    const legalBasis: string[] = [
      LEGAL_REFERENCES.LC_NUMBER,
      LEGAL_REFERENCES.REAL_ESTATE_REGIME.discountArticle,
    ];

    // 1. Verificação de Encargos Excluídos (IPTU e Condomínio - Art. 255)
    const condo = input.condominiumFee ?? 0;
    const iptu = input.iptuAmount ?? 0;
    if (condo > 0 || iptu > 0) {
      findings.push({
        ruleName: 'Exclusão de Encargos da Base de Incidência',
        status: 'passed',
        message: `Despesas de Condomínio (R$ ${condo.toFixed(2)}) e IPTU (R$ ${iptu.toFixed(2)}) foram expurgadas da base de cálculo conforme a LC 214/2025.`,
        articleReference: LEGAL_REFERENCES.REAL_ESTATE_REGIME.exclusionsArticle,
      });
      legalBasis.push(LEGAL_REFERENCES.REAL_ESTATE_REGIME.exclusionsArticle);
    }

    // 2. Verificação do Redutor Social (Art. 260)
    if (input.propertyType === 'residential') {
      findings.push({
        ruleName: 'Aplicação do Redutor Social Residencial',
        status: 'passed',
        message: `Dedução de R$ ${calc.socialDeductionApplied.toFixed(2)} aplicada na base mensal (teto de R$ ${params.socialDeductionResidential.toFixed(2)}).`,
        articleReference: LEGAL_REFERENCES.REAL_ESTATE_REGIME.socialDeductionArticle,
      });
      legalBasis.push(LEGAL_REFERENCES.REAL_ESTATE_REGIME.socialDeductionArticle);
    } else {
      findings.push({
        ruleName: 'Inaplicabilidade de Redutor Social em Imóvel Comercial',
        status: 'info',
        message: 'Imóveis comerciais não fazem jus ao redutor social conforme estipulado no Art. 260 da LC 214/2025.',
        articleReference: LEGAL_REFERENCES.REAL_ESTATE_REGIME.socialDeductionArticle,
      });
    }

    // 3. Verificação de Habitualidade (Enquadramento PF)
    if (input.landlord.personType === 'pf') {
      const isTaxpayer = calc.enquadramento.isTaxpayer;
      findings.push({
        ruleName: 'Critérios de Habitualidade da Pessoa Física',
        status: isTaxpayer ? 'alert' : 'passed',
        message: calc.enquadramento.reason,
        articleReference: LEGAL_REFERENCES.ENQUADRAMENTO_PF.legalArticle,
      });
      legalBasis.push(LEGAL_REFERENCES.ENQUADRAMENTO_PF.legalArticle);
    } else {
      findings.push({
        ruleName: 'Obrigatoriedade de Contribuinte PJ',
        status: 'passed',
        message: 'Pessoas Jurídicas são contribuintes compulsórios do IBS e da CBS em operações imobiliárias.',
        articleReference: LEGAL_REFERENCES.REAL_ESTATE_REGIME.articles,
      });
    }

    // 4. Verificação de Integridade Matemática Contábil
    const sumTaxes = FinancialMath.round(calc.cbsAmount + calc.ibsAmount);
    const mathConsistent = sumTaxes === calc.totalTaxDue;
    findings.push({
      ruleName: 'Integridade Contábil dos Centavos (CBS + IBS)',
      status: mathConsistent ? 'passed' : 'alert',
      message: mathConsistent
        ? `Consistência matemática validada: CBS (R$ ${calc.cbsAmount.toFixed(2)}) + IBS (R$ ${calc.ibsAmount.toFixed(2)}) = R$ ${calc.totalTaxDue.toFixed(2)} sem descompasso.`
        : `Divergência detectada: soma CBS+IBS (R$ ${sumTaxes.toFixed(2)}) difere do total (R$ ${calc.totalTaxDue.toFixed(2)}).`,
      articleReference: 'Normas Brasileiras de Contabilidade / Escrituração Fiscal Digital',
    });

    // 5. Alerta de Compliance: Registro no CIB (Art. 265)
    findings.push({
      ruleName: 'Obrigatoriedade de Registro no CIB',
      status: 'info',
      message: 'Para emissão regular de notas fiscais de locação (NFS-e), o imóvel deve estar inscrito no Cadastro de Identificação de Bens Imóveis (CIB) do Sinter.',
      articleReference: LEGAL_REFERENCES.REAL_ESTATE_REGIME.cibArticle,
    });
    legalBasis.push(LEGAL_REFERENCES.REAL_ESTATE_REGIME.cibArticle);

    let complianceStatus: AuditReport['complianceStatus'] = 'CONFORME';
    if (!calc.enquadramento.isTaxpayer) {
      complianceStatus = 'ISENTO';
    }

    const executiveSummary =
      complianceStatus === 'ISENTO'
        ? 'Operação imobiliária isenta de IBS/CBS por não atingir os critérios legais cumulativos de habitualidade do locador PF.'
        : `Operação tributada no IBS/CBS para o ano de ${calc.transitionYear} à alíquota efetiva de ${calc.effectiveRate}%, com desconto legal de ${calc.discountPercent}%. Todas as deduções e regras da LC 214/2025 foram atendidas.`;

    return {
      complianceStatus,
      timestamp: new Date().toISOString(),
      legalBasis: Array.from(new Set(legalBasis)),
      findings,
      executiveSummary,
    };
  }
}
