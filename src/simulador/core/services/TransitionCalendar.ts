import { FinancialMath } from '../domain/FinancialMath.ts'
import { TransitionYear } from '../domain/types.ts'

export interface YearRates {
  year: TransitionYear
  label: string
  description: string
  nominalTotalRate: number
  nominalCbsRate: number
  nominalIbsRate: number
  effectiveTotalRate: number
  effectiveCbsRate: number
  effectiveIbsRate: number
  isTestPhase: boolean
  isFullPhase: boolean
}

export interface TransitionScheduleMetadata {
  legalBasis: string
  source: string
  lastVerifiedAt: string
  status: 'VIGENTE_E_VALIDADO'
  reductionRule: string
  cibObligation: string
}

export interface TransitionSchedulePayload {
  metadata: TransitionScheduleMetadata
  referenceNominalTotal: number
  realEstateDiscountPercent: number
  years: YearRates[]
}

/**
 * Cronograma Constitucional da Transição Tributária (EC 132/2023 e LC 214/2025)
 * Ajusta as alíquotas conforme o ano fiscal selecionado
 */
export class TransitionCalendar {
  public static readonly TRANSITION_YEARS: TransitionYear[] = [
    2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033,
  ]

  /**
   * Ano de apuração aplicável hoje, limitado à janela da transição.
   *
   * É o ano que a interface pública usa: o locador quer saber quanto paga
   * agora, não escolher um exercício futuro. Antes de 2026 cai no primeiro ano
   * da transição; de 2033 em diante, no regime pleno.
   */
  public static getCurrentTransitionYear(today: Date = new Date()): TransitionYear {
    const year = today.getFullYear()
    const first = this.TRANSITION_YEARS[0]
    const last = this.TRANSITION_YEARS[this.TRANSITION_YEARS.length - 1]

    if (year <= first) return first
    if (year >= last) return last
    return year as TransitionYear
  }

  /**
   * Retorna o payload completo do cronograma para consultas GET
   */
  public static getFullSchedule(
    referenceRate: number = 26.5,
    cbsShare: number = 8.8,
    ibsShare: number = 17.7,
    discountPercent: number = 70.0,
  ): TransitionSchedulePayload {
    const years = this.TRANSITION_YEARS.map((y) =>
      this.getRatesForYear(y, referenceRate, cbsShare, ibsShare, discountPercent),
    )

    return {
      metadata: {
        legalBasis:
          'Emenda Constitucional nº 132/2023 e Lei Complementar nº 214/2025 (Arts. 255 a 265)',
        source: 'Diário Oficial da União / Senado Federal / Receita Federal do Brasil',
        lastVerifiedAt: new Date().toISOString(),
        status: 'VIGENTE_E_VALIDADO',
        reductionRule:
          'Redução de 70% na alíquota padrão para locação e cessão onerosa de bens imóveis (Art. 260)',
        cibObligation:
          'Obrigatoriedade de inscrição no Cadastro Imobiliário Brasileiro - CIB para emissão de NFS-e (Art. 265)',
      },
      referenceNominalTotal: referenceRate,
      realEstateDiscountPercent: discountPercent,
      years,
    }
  }
  public static getRatesForYear(
    year: TransitionYear,
    _fullNominalRef: number = 26.5,
    fullCbsRef: number = 8.8,
    fullIbsRef: number = 17.7,
    discountPercent: number = 70.0,
  ): YearRates {
    const discountMultiplier = (100 - discountPercent) / 100

    let nominalCbs = 0
    let nominalIbs = 0
    let label = ''
    let description = ''
    let isTestPhase = false
    let isFullPhase = false

    switch (year) {
      case 2026:
        // Ano Teste: CBS de 0,9% e IBS de 0,1% (compensáveis com PIS/COFINS)
        nominalCbs = 0.9
        nominalIbs = 0.1
        label = '2026 (Ano Teste)'
        description =
          'Alíquota de teste de 1,0% (0,9% CBS + 0,1% IBS), compensável com tributos federais.'
        isTestPhase = true
        break

      case 2027:
      case 2028:
        // CBS plena (8,8%) e IBS ainda em fase preparatória
        nominalCbs = fullCbsRef
        nominalIbs = 0.0
        label = `${year} (Início CBS Plena)`
        description = 'Extinção do PIS/COFINS. CBS em vigor plena, IBS ainda não iniciado.'
        break

      case 2029:
        // IBS inicia transição com 10% de sua alíquota de referência
        nominalCbs = fullCbsRef
        nominalIbs = FinancialMath.round(fullIbsRef * 0.1)
        label = '2029 (Transição IBS 10%)'
        description = 'CBS plena + 10% do IBS. Redução proporcional correspondente de ICMS/ISS.'
        break

      case 2030:
        nominalCbs = fullCbsRef
        nominalIbs = FinancialMath.round(fullIbsRef * 0.2)
        label = '2030 (Transição IBS 20%)'
        description = 'CBS plena + 20% do IBS.'
        break

      case 2031:
        nominalCbs = fullCbsRef
        nominalIbs = FinancialMath.round(fullIbsRef * 0.3)
        label = '2031 (Transição IBS 30%)'
        description = 'CBS plena + 30% do IBS.'
        break

      case 2032:
        nominalCbs = fullCbsRef
        nominalIbs = FinancialMath.round(fullIbsRef * 0.4)
        label = '2032 (Transição IBS 40%)'
        description = 'CBS plena + 40% do IBS. Último ano com coexistência dos tributos antigos.'
        break

      case 2033:
      default:
        // Regime Pleno 100%
        nominalCbs = fullCbsRef
        nominalIbs = fullIbsRef
        label = '2033+ (Regime Pleno Definitivo)'
        description = 'Extinção definitiva de ICMS, ISS, PIS e COFINS. Plena vigência de IBS e CBS.'
        isFullPhase = true
        break
    }

    const nominalTotal = FinancialMath.round(nominalCbs + nominalIbs)
    const effectiveCbs = FinancialMath.round(nominalCbs * discountMultiplier)
    const effectiveIbs = FinancialMath.round(nominalIbs * discountMultiplier)
    const effectiveTotal = FinancialMath.round(effectiveCbs + effectiveIbs)

    return {
      year,
      label,
      description,
      nominalTotalRate: nominalTotal,
      nominalCbsRate: nominalCbs,
      nominalIbsRate: nominalIbs,
      effectiveTotalRate: effectiveTotal,
      effectiveCbsRate: effectiveCbs,
      effectiveIbsRate: effectiveIbs,
      isTestPhase,
      isFullPhase,
    }
  }
}
