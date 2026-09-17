import {
  ComparativeResult,
  LandlordProfile,
  PropertyType,
  TaxParameters,
  TransitionYear,
} from '../domain/types.ts'
import { DEFAULT_TAX_PARAMETERS } from '../domain/constants.ts'
import { FinancialMath } from '../domain/FinancialMath.ts'
import { calculateMonthlyIRPF, getIRPFTable } from '../domain/irpfTable.ts'
import { TaxCalculatorEngine } from './TaxCalculatorEngine.ts'

/**
 * Despesas do mês dedutíveis da base do Carnê-Leão quando suportadas pelo locador
 */
export interface DeductibleCharges {
  condominiumFee?: number
  iptuAmount?: number
}

/**
 * Motor de Análise Comparativa Pré-Reforma vs Pós-Reforma
 * Ajustado com as deduções legais autênticas (taxa imobiliária, condomínio e IPTU
 * suportados pelo locador, IBS/CBS dedutível no IRPF)
 */
export class ComparativeEngine {
  /**
   * Calcula o IRPF mensal estimado pela tabela progressiva vigente no ano-calendário.
   * As faixas vivem em `domain/irpfTable.ts` e são atualizadas por lei a cada ano.
   */
  public static calculateMonthlyIRPF(
    grossIncome: number,
    legalDeductions: number = 0,
    year: number = new Date().getFullYear(),
  ): number {
    return calculateMonthlyIRPF(grossIncome, legalDeductions, year)
  }

  /**
   * Calcula a tributação de PJ no Lucro Presumido (Pré-Reforma)
   * PIS (0,65%) + COFINS (3,00%) + IRPJ (4,8% + adicional) + CSLL (2,88%)
   */
  public static calculateLucroPresumidoPreReform(monthlyRevenue: number): number {
    const pis = FinancialMath.percentage(monthlyRevenue, 0.65)
    const cofins = FinancialMath.percentage(monthlyRevenue, 3.0)
    const basePresumida = FinancialMath.percentage(monthlyRevenue, 32.0)
    const csll = FinancialMath.percentage(basePresumida, 9.0)
    const irpjBase = FinancialMath.percentage(basePresumida, 15.0)
    const irpjAdicional = Math.max(
      0,
      FinancialMath.percentage(Math.max(0, basePresumida - 20000), 10.0),
    )
    return FinancialMath.round(pis + cofins + csll + irpjBase + irpjAdicional)
  }

  /**
   * Compara o cenário Atual vs Novo Regime considerando ano de transição e deduções legais
   */
  public static compare(
    monthlyRent: number,
    propertyType: PropertyType,
    landlord: LandlordProfile,
    params: TaxParameters = DEFAULT_TAX_PARAMETERS,
    transitionYear?: TransitionYear,
    deductibleCharges: DeductibleCharges = {},
  ): ComparativeResult {
    const isPF = landlord.personType === 'pf'
    const year = transitionYear ?? params.transitionYear ?? 2033
    const mgmtPercent = landlord.managementFeePercent ?? 10.0
    const mgmtFee = FinancialMath.percentage(monthlyRent, mgmtPercent)

    // Condomínio e IPTU são dedutíveis do Carnê-Leão quando suportados pelo locador
    const landlordBorneCharges = FinancialMath.sum(
      deductibleCharges.condominiumFee ?? 0,
      deductibleCharges.iptuAmount ?? 0,
    )
    const preDeductions = FinancialMath.sum(mgmtFee, landlordBorneCharges)

    // 1. Pré-Reforma
    let preTaxAmount = 0
    let preSystemName = ''
    let preNotes = ''

    if (isPF) {
      preSystemName = 'Pessoa Física (Carnê-Leão / IRPF)'
      // No Carnê-Leão, a taxa de administração da imobiliária é dedução legal expressa (Art. 22 da Lei 7.739/89)
      preTaxAmount = this.calculateMonthlyIRPF(monthlyRent, preDeductions, year)
      const tableLabel = getIRPFTable(year).label
      preNotes = `Tributação pelo IRPF (${tableLabel}) após deduções legais de R$ ${preDeductions.toFixed(2)}. Sem PIS/COFINS ou ISS.`
    } else {
      preSystemName = 'Pessoa Jurídica (Holding Lucro Presumido)'
      preTaxAmount = this.calculateLucroPresumidoPreReform(monthlyRent)
      preNotes =
        'Tributação de 11,33% a 14,53% (PIS 0,65%, COFINS 3,00%, IRPJ 4,80% + adicional e CSLL 2,88%). Sem ISS.'
    }

    const preEffectiveRate =
      monthlyRent > 0 ? FinancialMath.round((preTaxAmount / monthlyRent) * 100) : 0
    const preNetIncome = FinancialMath.round(monthlyRent - preTaxAmount - mgmtFee)
    let irpfEstimatedAmount: number | undefined

    // 2. Pós-Reforma (IBS/CBS)
    const mockTenant = { personType: 'pf' as const }
    const taxCalc = TaxCalculatorEngine.calculateContract(
      {
        baseRent: monthlyRent,
        propertyType,
        transitionYear: year,
        landlord,
        tenant: mockTenant,
      },
      params,
    )

    const ibscbsAmount = taxCalc.totalTaxDue
    const isTaxpayer = taxCalc.enquadramento.isTaxpayer

    let postTotalTax = 0
    let postNotes = ''

    if (isPF) {
      if (!isTaxpayer) {
        // Não enquadrado: continua pagando apenas IRPF
        postTotalTax = preTaxAmount
        irpfEstimatedAmount = preTaxAmount
        postNotes =
          'Não enquadrado como contribuinte de IBS/CBS. Continua recolhendo unicamente IRPF (Carnê-Leão).'
      } else {
        // Enquadrado: paga IBS/CBS + IRPF sobre base deduzida do IBS/CBS e das demais despesas legais
        const postDeductions = FinancialMath.sum(preDeductions, ibscbsAmount)
        const adjustedIRPF = this.calculateMonthlyIRPF(monthlyRent, postDeductions, year)
        irpfEstimatedAmount = adjustedIRPF
        postTotalTax = FinancialMath.round(ibscbsAmount + adjustedIRPF)
        postNotes = `Enquadrado no IBS/CBS (${year}): recolhe IBS/CBS (R$ ${ibscbsAmount.toFixed(2)}) + IRPF ajustado (R$ ${adjustedIRPF.toFixed(2)}) após deduzir o tributo e as despesas legais da base.`
      }
    } else {
      // PJ: PIS/COFINS substituídos por IBS/CBS com direito a crédito sobre a imobiliária
      const netIbsCbsPJ = taxCalc.landlordCredits.netTaxToPay
      const basePresumida = FinancialMath.percentage(monthlyRent, 32.0)
      const csll = FinancialMath.percentage(basePresumida, 9.0)
      const irpjBase = FinancialMath.percentage(basePresumida, 15.0)
      const irpjAdicional = Math.max(
        0,
        FinancialMath.percentage(Math.max(0, basePresumida - 20000), 10.0),
      )
      const irpjCsll = FinancialMath.round(csll + irpjBase + irpjAdicional)

      postTotalTax = FinancialMath.round(netIbsCbsPJ + irpjCsll)
      postNotes = `Ano ${year}: Substituição de PIS/COFINS pelo IBS/CBS líquido de créditos da imobiliária (R$ ${netIbsCbsPJ.toFixed(2)}) + manutenção do IRPJ/CSLL (R$ ${irpjCsll.toFixed(2)}).`
    }

    const netIncomeIfAbsorbed = FinancialMath.round(monthlyRent - postTotalTax - mgmtFee)
    const netIncomeIfPassed = FinancialMath.round(
      monthlyRent - (postTotalTax - ibscbsAmount) - mgmtFee,
    )
    const differenceAmount = FinancialMath.subtract(postTotalTax, preTaxAmount)
    const percentageVariation =
      preTaxAmount > 0 ? FinancialMath.round((differenceAmount / preTaxAmount) * 100) : 0

    return {
      monthlyRent,
      propertyType,
      transitionYear: year,
      preReform: {
        systemName: preSystemName,
        estimatedTaxRate: preEffectiveRate,
        estimatedTaxAmount: preTaxAmount,
        netIncome: preNetIncome,
        hasPISCofins: !isPF,
        hasISS: false,
        notes: preNotes,
      },
      postReform: {
        isTaxpayer,
        ibscbsRate: taxCalc.effectiveRate,
        ibscbsAmount,
        irpfEstimatedAmount,
        totalTaxEstimated: postTotalTax,
        netIncomeIfAbsorbed,
        netIncomeIfPassed,
        differenceAmount,
        percentageVariation,
        notes: postNotes,
      },
    }
  }
}
