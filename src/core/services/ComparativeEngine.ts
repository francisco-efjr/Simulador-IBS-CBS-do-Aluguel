import { ComparativeResult, LandlordProfile, PropertyType, TaxParameters, TransitionYear } from '../domain/types.ts';
import { DEFAULT_TAX_PARAMETERS } from '../domain/constants.ts';
import { FinancialMath } from '../domain/FinancialMath.ts';
import { TaxCalculatorEngine } from './TaxCalculatorEngine.ts';

/**
 * Motor de Análise Comparativa Pré-Reforma vs Pós-Reforma
 * Ajustado com as deduções legais autênticas (taxa imobiliária, IBS/CBS dedutível no IRPF)
 */
export class ComparativeEngine {
  /**
   * Calcula o IRPF mensal estimado (Tabela Progressiva Carnê-Leão)
   * Dedução simplificada legal considerada quando vantajosa (isenção até R$ 2.824,00)
   */
  public static calculateMonthlyIRPF(taxableIncome: number): number {
    if (taxableIncome <= 2259.20) return 0;
    // Com dedução simplificada mensal de R$ 564,80, a base líquida de até R$ 2.824 é isenta
    if (taxableIncome <= 2824.00) return 0;
    if (taxableIncome <= 3751.05) return Math.max(0, FinancialMath.round(taxableIncome * 0.15 - 381.44));
    if (taxableIncome <= 4664.68) return Math.max(0, FinancialMath.round(taxableIncome * 0.225 - 662.77));
    return Math.max(0, FinancialMath.round(taxableIncome * 0.275 - 896.00));
  }

  /**
   * Calcula a tributação de PJ no Lucro Presumido (Pré-Reforma)
   * PIS (0,65%) + COFINS (3,00%) + IRPJ (4,8% + adicional) + CSLL (2,88%)
   */
  public static calculateLucroPresumidoPreReform(monthlyRevenue: number): number {
    const pis = FinancialMath.percentage(monthlyRevenue, 0.65);
    const cofins = FinancialMath.percentage(monthlyRevenue, 3.0);
    const basePresumida = FinancialMath.percentage(monthlyRevenue, 32.0);
    const csll = FinancialMath.percentage(basePresumida, 9.0);
    const irpjBase = FinancialMath.percentage(basePresumida, 15.0);
    const irpjAdicional = Math.max(0, FinancialMath.percentage(Math.max(0, basePresumida - 20000), 10.0));
    return FinancialMath.round(pis + cofins + csll + irpjBase + irpjAdicional);
  }

  /**
   * Compara o cenário Atual vs Novo Regime considerando ano de transição e deduções legais
   */
  public static compare(
    monthlyRent: number,
    propertyType: PropertyType,
    landlord: LandlordProfile,
    params: TaxParameters = DEFAULT_TAX_PARAMETERS,
    transitionYear?: TransitionYear
  ): ComparativeResult {
    const isPF = landlord.personType === 'pf';
    const year = transitionYear ?? params.transitionYear ?? 2033;
    const mgmtPercent = landlord.managementFeePercent ?? 10.0;
    const mgmtFee = FinancialMath.percentage(monthlyRent, mgmtPercent);

    // 1. Pré-Reforma
    let preTaxAmount = 0;
    let preSystemName = '';
    let preNotes = '';

    if (isPF) {
      preSystemName = 'Pessoa Física (Carnê-Leão / IRPF)';
      // No Carnê-Leão, a taxa de administração da imobiliária é dedução legal expressa (Art. 22 da Lei 7.739/89)
      const taxablePrePF = Math.max(0, FinancialMath.subtract(monthlyRent, mgmtFee));
      preTaxAmount = this.calculateMonthlyIRPF(taxablePrePF);
      preNotes = `Tributação pelo IRPF na tabela progressiva após dedução legal da taxa de imobiliária (R$ ${mgmtFee.toFixed(2)}). Sem PIS/COFINS ou ISS.`;
    } else {
      preSystemName = 'Pessoa Jurídica (Holding Lucro Presumido)';
      preTaxAmount = this.calculateLucroPresumidoPreReform(monthlyRent);
      preNotes = 'Tributação de 11,33% a 14,53% (PIS 0,65%, COFINS 3,00%, IRPJ 4,80% + adicional e CSLL 2,88%). Sem ISS.';
    }

    const preEffectiveRate = monthlyRent > 0 ? FinancialMath.round((preTaxAmount / monthlyRent) * 100) : 0;
    const preNetIncome = FinancialMath.round(monthlyRent - preTaxAmount - mgmtFee);

    // 2. Pós-Reforma (IBS/CBS)
    const mockTenant = { personType: 'pf' as const };
    const taxCalc = TaxCalculatorEngine.calculateContract(
      {
        baseRent: monthlyRent,
        propertyType,
        transitionYear: year,
        landlord,
        tenant: mockTenant,
      },
      params
    );

    const ibscbsAmount = taxCalc.totalTaxDue;
    const isTaxpayer = taxCalc.enquadramento.isTaxpayer;

    let postTotalTax = 0;
    let postNotes = '';

    if (isPF) {
      if (!isTaxpayer) {
        // Não enquadrado: continua pagando apenas IRPF
        postTotalTax = preTaxAmount;
        postNotes = 'Não enquadrado como contribuinte de IBS/CBS. Continua recolhendo unicamente IRPF (Carnê-Leão).';
      } else {
        // Enquadrado: paga IBS/CBS + IRPF sobre base deduzida do IBS/CBS e da taxa de imobiliária
        const netBaseForIRPF = Math.max(0, FinancialMath.subtract(monthlyRent, FinancialMath.sum(ibscbsAmount, mgmtFee)));
        const adjustedIRPF = this.calculateMonthlyIRPF(netBaseForIRPF);
        postTotalTax = FinancialMath.round(ibscbsAmount + adjustedIRPF);
        postNotes = `Enquadrado no IBS/CBS (${year}): recolhe IBS/CBS (R$ ${ibscbsAmount.toFixed(2)}) + IRPF ajustado (R$ ${adjustedIRPF.toFixed(2)}) após deduzir o tributo e a imobiliária da base.`;
      }
    } else {
      // PJ: PIS/COFINS substituídos por IBS/CBS com direito a crédito sobre a imobiliária
      const netIbsCbsPJ = taxCalc.landlordCredits.netTaxToPay;
      const basePresumida = FinancialMath.percentage(monthlyRent, 32.0);
      const csll = FinancialMath.percentage(basePresumida, 9.0);
      const irpjBase = FinancialMath.percentage(basePresumida, 15.0);
      const irpjAdicional = Math.max(0, FinancialMath.percentage(Math.max(0, basePresumida - 20000), 10.0));
      const irpjCsll = FinancialMath.round(csll + irpjBase + irpjAdicional);

      postTotalTax = FinancialMath.round(netIbsCbsPJ + irpjCsll);
      postNotes = `Ano ${year}: Substituição de PIS/COFINS pelo IBS/CBS líquido de créditos da imobiliária (R$ ${netIbsCbsPJ.toFixed(2)}) + manutenção do IRPJ/CSLL (R$ ${irpjCsll.toFixed(2)}).`;
    }

    const netIncomeIfAbsorbed = FinancialMath.round(monthlyRent - postTotalTax - mgmtFee);
    const netIncomeIfPassed = FinancialMath.round(monthlyRent - (postTotalTax - ibscbsAmount) - mgmtFee);
    const differenceAmount = FinancialMath.subtract(postTotalTax, preTaxAmount);
    const percentageVariation = preTaxAmount > 0
      ? FinancialMath.round(((differenceAmount) / preTaxAmount) * 100)
      : 0;

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
        totalTaxEstimated: postTotalTax,
        netIncomeIfAbsorbed,
        netIncomeIfPassed,
        differenceAmount,
        percentageVariation,
        notes: postNotes,
      },
    };
  }
}
