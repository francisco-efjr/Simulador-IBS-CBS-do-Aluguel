import { LandlordProfile, EnquadramentoResult, TaxParameters } from '../domain/types.ts'
import { DEFAULT_TAX_PARAMETERS, LEGAL_REFERENCES } from '../domain/constants.ts'

/**
 * Motor de Avaliação de Enquadramento Tributário
 * Conforme critérios de habitualidade da LC 214/2025
 */
export class EnquadramentoEngine {
  /**
   * Avalia se o locador é considerado contribuinte formal de IBS e CBS
   */
  public static evaluate(
    landlord: LandlordProfile,
    params: TaxParameters = DEFAULT_TAX_PARAMETERS,
  ): EnquadramentoResult {
    // 1. Caso Pessoa Jurídica (PJ)
    if (landlord.personType === 'pj') {
      return {
        isTaxpayer: true,
        reason:
          'Pessoa Jurídica é contribuinte obrigatória de IBS/CBS nas operações de locação e cessão de bens imóveis.',
        legalArticle: LEGAL_REFERENCES.REAL_ESTATE_REGIME.articles,
        criteria: {
          exceedsPropertyLimit: true,
          exceedsIncomeLimit: true,
          bothRequiredForPF: false,
          isPJ: true,
        },
      }
    }

    // 2. Caso Pessoa Física (PF)
    const propertyCount = landlord.totalPropertiesRented ?? 0
    const annualIncome = landlord.totalAnnualRentalIncome ?? 0

    const exceedsPropertyLimit = propertyCount > params.pfPropertyThreshold
    const exceedsIncomeLimit = annualIncome > params.pfAnnualIncomeThreshold

    // A regra da LC 214/2025 é CUMULATIVA: precisa exceder os dois limites
    const isTaxpayer = exceedsPropertyLimit && exceedsIncomeLimit

    let reason = ''
    if (isTaxpayer) {
      reason = `Contribuinte enquadrado por habitualidade: possui ${propertyCount} imóveis locados (> ${params.pfPropertyThreshold}) E receita anual de R$ ${annualIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (> R$ ${params.pfAnnualIncomeThreshold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Sujeito à emissão de NFS-e e recolhimento de IBS/CBS.`
    } else {
      const missingConditions: string[] = []
      if (!exceedsPropertyLimit) {
        missingConditions.push(
          `possui até ${params.pfPropertyThreshold} imóveis alugados (${propertyCount})`,
        )
      }
      if (!exceedsIncomeLimit) {
        missingConditions.push(
          `receita anual (R$ ${annualIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) não atinge o teto de R$ ${params.pfAnnualIncomeThreshold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        )
      }
      reason = `Não Contribuinte de IBS/CBS: ${missingConditions.join(' e ')}. Isento de IBS/CBS na locação, mantendo tributação exclusiva pelo IRPF (Carnê-Leão).`
    }

    return {
      isTaxpayer,
      reason,
      legalArticle: LEGAL_REFERENCES.ENQUADRAMENTO_PF.legalArticle,
      criteria: {
        exceedsPropertyLimit,
        exceedsIncomeLimit,
        bothRequiredForPF: true,
        isPJ: false,
      },
    }
  }
}
