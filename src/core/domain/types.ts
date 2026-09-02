/**
 * Tipos e Estruturas de Dados do Domínio Tributário
 * Lei Complementar nº 214/2025 (Reforma Tributária sobre o Consumo)
 */

export type PropertyType = 'residential' | 'commercial';

export type PersonType = 'pf' | 'pj';

export type TaxRegimePJ = 'lucro_presumido' | 'lucro_real' | 'simples_nacional';

export type TransitionYear = 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033;

/**
 * Perfil do Locador (Proprietário)
 */
export interface LandlordProfile {
  personType: PersonType;
  // Campos específicos para Pessoa Física (PF)
  totalPropertiesRented?: number; // Quantidade de imóveis locados no ano
  totalAnnualRentalIncome?: number; // Receita bruta anual de aluguéis (R$)
  // Campos específicos para Pessoa Jurídica (PJ)
  pjTaxRegime?: TaxRegimePJ;
  // Despesas operacionais com destaque de IBS/CBS (ex: taxa da imobiliária)
  managementFeePercent?: number; // Percentual pago à imobiliária (ex: 8% a 10%)
}

/**
 * Perfil do Locatário (Inquilino)
 */
export interface TenantProfile {
  personType: PersonType;
  pjTaxRegime?: TaxRegimePJ;
  canTakeCredits?: boolean; // Se PJ no regime regular pode se creditar integralmente
}

/**
 * Dados Financeiros e Encargos da Operação de Locação
 */
export interface LeaseContractInput {
  baseRent: number; // Aluguel estrito do imóvel (R$)
  propertyType: PropertyType;
  condominiumFee?: number; // Despesa condominial (isenta de IBS/CBS - Art. 255)
  iptuAmount?: number; // IPTU do imóvel (isento de IBS/CBS - Art. 255)
  transitionYear?: TransitionYear; // Ano fiscal de apuração (2026 a 2033)
  landlord: LandlordProfile;
  tenant: TenantProfile;
}

/**
 * Parâmetros Tributários Globais (configuráveis pelo usuário / simulador)
 */
export interface TaxParameters {
  referenceRate: number; // Alíquota padrão total de referência (ex: 26.5%)
  cbsShare: number; // Parcela estimada da CBS (ex: 8.8%)
  ibsShare: number; // Parcela estimada do IBS (ex: 17.7%)
  realEstateDiscountPercent: number; // Redução de alíquota para locação (art. 260 da LC 214/2025 = 70%)
  socialDeductionResidential: number; // Redutor social mensal por imóvel residencial (ex: R$ 600,00)
  pfPropertyThreshold: number; // Limite de imóveis para enquadramento da PF (ex: 3)
  pfAnnualIncomeThreshold: number; // Limite de receita anual para enquadramento da PF (ex: R$ 240.000,00)
  transitionYear: TransitionYear; // Ano de apuração selecionado
}

/**
 * Resultado da Análise de Enquadramento
 */
export interface EnquadramentoResult {
  isTaxpayer: boolean; // Se é considerado contribuinte formal de IBS/CBS
  reason: string; // Explicação detalhada da regra jurídica aplicada
  legalArticle: string;
  criteria: {
    exceedsPropertyLimit: boolean;
    exceedsIncomeLimit: boolean;
    bothRequiredForPF: boolean;
    isPJ: boolean;
  };
}

/**
 * Créditos Tributários do Locador PJ (Insumos da Locação)
 */
export interface LandlordCreditAnalysis {
  hasRightToCredits: boolean;
  managementFeeAmount: number; // Valor da comissão da imobiliária (R$)
  managementFeeIbsCbsCredit: number; // Crédito gerado pela nota fiscal da imobiliária
  netTaxToPay: number; // Débito de IBS/CBS - Créditos operacionais
  creditExplanation: string;
}

/**
 * Laudo e Trilha de Auditoria Fiscal (Audit Trail)
 */
export interface AuditReport {
  complianceStatus: 'CONFORME' | 'ALERTA' | 'ISENTO';
  timestamp: string;
  legalBasis: string[];
  findings: Array<{
    ruleName: string;
    status: 'passed' | 'alert' | 'info';
    message: string;
    articleReference: string;
  }>;
  executiveSummary: string;
}

/**
 * Memória de Cálculo e Apuração da Locação Individual
 */
export interface CalculationResult {
  // Entradas da simulação
  baseRent: number;
  condominiumFee: number;
  iptuAmount: number;
  totalTenantReceipt: number; // Total bruto do recibo (Aluguel + IPTU + Condomínio)
  propertyType: PropertyType;
  transitionYear: TransitionYear;
  landlord: LandlordProfile;
  tenant: TenantProfile;

  // Status de Contribuinte
  enquadramento: EnquadramentoResult;

  // Parâmetros aplicados
  nominalRate: number; // Alíquota nominal no ano (ex: 26.5% em 2033, 1.0% em 2026)
  discountPercent: number; // Desconto legal (70%)
  effectiveRate: number; // Alíquota efetiva (ex: 7.95% em 2033, 0.30% em 2026)
  effectiveCbsRate: number;
  effectiveIbsRate: number;

  // Deduções e Base
  socialDeductionApplied: number; // R$ 600 em residenciais
  excludedCharges: number; // IPTU e Condomínio excluídos da incidência
  taxableBase: number; // Base líquida de incidência do IBS/CBS

  // Impostos calculados com consistência exata de centavos
  cbsAmount: number;
  ibsAmount: number;
  totalTaxDue: number; // Exatamente cbsAmount + ibsAmount

  // Créditos do Locador PJ (Insumos / Taxa de Imobiliária)
  landlordCredits: LandlordCreditAnalysis;

  // Cenários Financeiros
  scenarios: {
    passedToTenant: {
      finalTenantCost: number; // Aluguel + Encargos + IBS/CBS
      landlordNetIncome: number;
      taxBurdenPercent: number;
    };
    absorbedByLandlord: {
      finalTenantCost: number; // Aluguel + Encargos
      landlordNetIncome: number; // Aluguel - IBS/CBS líquido
      taxBurdenPercent: number;
    };
  };

  // Análise de Crédito Tributário do Inquilino (B2B)
  creditAnalysis: {
    eligibleForCredit: boolean;
    creditAmount: number;
    netCostForTenantPJ: number;
    note: string;
  };

  // Laudo de Auditoria Fiscal
  auditReport: AuditReport;

  // Avisos de Validação e Consistência Cadastral
  validationWarnings: string[];
}

/**
 * Estrutura para Comparativo Pré-Reforma vs Pós-Reforma
 */
export interface ComparativeResult {
  monthlyRent: number;
  propertyType: PropertyType;
  transitionYear: TransitionYear;

  // Regime Pré-Reforma (Atual)
  preReform: {
    systemName: string;
    estimatedTaxRate: number;
    estimatedTaxAmount: number;
    netIncome: number;
    hasPISCofins: boolean;
    hasISS: boolean;
    notes: string;
  };

  // Regime Pós-Reforma (LC 214/2025)
  postReform: {
    isTaxpayer: boolean;
    ibscbsRate: number;
    ibscbsAmount: number;
    irpfEstimatedAmount?: number;
    totalTaxEstimated: number;
    netIncomeIfAbsorbed: number;
    netIncomeIfPassed: number;
    differenceAmount: number;
    percentageVariation: number;
    notes: string;
  };
}

/**
 * Item de Imóvel para Simulação de Portfólio / Carteira
 */
export interface PortfolioItem {
  id: string;
  name: string;
  propertyType: PropertyType;
  monthlyRent: number;
  condominiumFee?: number;
  iptuAmount?: number;
  tenantType: PersonType;
}
