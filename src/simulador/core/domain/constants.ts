import { TaxParameters } from './types.ts';

/**
 * Parâmetros Oficiais de Referência da Reforma Tributária (LC 214/2025 / EC 132/2023)
 */
export const DEFAULT_TAX_PARAMETERS: TaxParameters = {
  // Alíquota de referência padrão nacional estimada (~26,5%)
  referenceRate: 26.5,
  // Distribuição estimada entre CBS (União) e IBS (Estados e Municípios)
  cbsShare: 8.8,
  ibsShare: 17.7,
  // Redução legal de 70% na alíquota de locação de bens imóveis (Art. 260)
  realEstateDiscountPercent: 70.0,
  // Redutor social por imóvel residencial ao mês (Art. 260)
  socialDeductionResidential: 600.0,
  // Critérios de habitualidade para enquadramento da Pessoa Física
  pfPropertyThreshold: 3, // Acima de 3 imóveis locados (> 3)
  pfAnnualIncomeThreshold: 240000.0, // Receita anual de locação acima de R$ 240.000,00
  // Ano de transição padrão para simulação (2033 = regime pleno, mas pode ser 2026, 2027...)
  transitionYear: 2033,
};

/**
 * Citações e Artigos da Legislação de Apoio
 */
export const LEGAL_REFERENCES = {
  LC_NUMBER: 'Lei Complementar nº 214/2025 (originada do PLP 68/2024)',
  CONSTITUTIONAL_AMENDMENT: 'Emenda Constitucional nº 132/2023',
  REAL_ESTATE_REGIME: {
    name: 'Regime Específico de Operações com Bens Imóveis',
    articles: 'Arts. 248 a 265 da LC 214/2025',
    discountArticle: 'Art. 260 da LC 214/2025 (Redução de 70% na alíquota de locação)',
    socialDeductionArticle: 'Art. 260 da LC 214/2025 (Redutor Social de R$ 600,00/mês para imóveis residenciais)',
    exclusionsArticle: 'Arts. 255 e 260 da LC 214/2025 (Exclusão de IPTU e taxas condominiais da base)',
    cibArticle: 'Art. 265 da LC 214/2025 (Cadastro de Identificação de Bens Imóveis - CIB)',
  },
  ENQUADRAMENTO_PF: {
    description: 'A PF só se torna contribuinte se possuir mais de 3 imóveis alugados E receita anual com locações superior a R$ 240 mil.',
    rule: 'Cumulativo: (Imóveis > 3) E (Receita Anual > R$ 240.000)',
    legalArticle: 'Art. 249 e seguintes da LC 214/2025',
  },
  NON_CUMULATIVITY: {
    description: 'Não-cumulatividade plena: Débito da locação deduzido dos créditos sobre insumos (imobiliária, manutenção) e aproveitamento de 100% pelo locatário PJ no regime regular.',
    legalArticle: 'Art. 4º da LC 214/2025 e Art. 156-A da CF',
  },
  TRANSITION_SCHEDULE: {
    '2026': 'Ano Teste: CBS 0,9% + IBS 0,1% (alíquota efetiva de locação: 0,30%).',
    '2027-2028': 'CBS plena (alíquota efetiva de locação: 2,64%). Extinção de PIS/COFINS.',
    '2029-2032': 'Transição progressiva do IBS (10% a 40% do total).',
    '2033': 'Regime pleno definitivo: CBS + IBS (alíquota efetiva de locação: 7,95%).',
  }
};
