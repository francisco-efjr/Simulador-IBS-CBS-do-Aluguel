import {
  CalculationResult,
  LandlordProfile,
  PortfolioItem,
  TaxParameters,
  TransitionYear,
} from '../domain/types.ts';
import { DEFAULT_TAX_PARAMETERS } from '../domain/constants.ts';
import { FinancialMath } from '../domain/FinancialMath.ts';
import { TaxCalculatorEngine } from './TaxCalculatorEngine.ts';

export interface PortfolioSummary {
  totalProperties: number;
  totalUnits: number;
  residentialCount: number;
  residentialUnitsCount: number;
  commercialCount: number;
  commercialUnitsCount: number;
  transitionYear: TransitionYear;
  totalMonthlyRent: number;
  totalAnnualRent: number;
  totalMonthlyExcludedCharges: number;
  isLandlordTaxpayer: boolean;
  enquadramentoReason: string;
  totalMonthlySocialDeduction: number;
  totalMonthlyTaxableBase: number;
  totalMonthlyIBSCBS: number;
  totalAnnualIBSCBS: number;
  totalNetIfPassed: number;
  totalNetIfAbsorbed: number;
  effectiveAverageRate: number;
  propertyBreakdowns: Array<{
    item: PortfolioItem;
    calculation: CalculationResult;
  }>;
}

/**
 * Motor de Simulação de Portfólio Imobiliário
 * Avalia carteiras completas sob a ótica da LC 214/2025
 */
export class PortfolioEngine {
  public static evaluatePortfolio(
    items: PortfolioItem[],
    isPJ: boolean = false,
    params: TaxParameters = DEFAULT_TAX_PARAMETERS,
    year?: TransitionYear
  ): PortfolioSummary {
    const totalProperties = items.length;
    const transitionYear = year ?? params.transitionYear ?? 2033;

    if (totalProperties === 0) {
      return {
        totalProperties: 0,
        totalUnits: 0,
        residentialCount: 0,
        residentialUnitsCount: 0,
        commercialCount: 0,
        commercialUnitsCount: 0,
        transitionYear,
        totalMonthlyRent: 0,
        totalAnnualRent: 0,
        totalMonthlyExcludedCharges: 0,
        isLandlordTaxpayer: false,
        enquadramentoReason: 'Carteira vazia. Adicione ao menos um imóvel para apurar o IBS/CBS.',
        totalMonthlySocialDeduction: 0,
        totalMonthlyTaxableBase: 0,
        totalMonthlyIBSCBS: 0,
        totalAnnualIBSCBS: 0,
        totalNetIfPassed: 0,
        totalNetIfAbsorbed: 0,
        effectiveAverageRate: 0,
        propertyBreakdowns: [],
      };
    }

    const getItemUnits = (item: PortfolioItem) => (item.unitsCount && item.unitsCount > 0 ? item.unitsCount : 1);
    const totalUnits = items.reduce((acc, item) => acc + getItemUnits(item), 0);
    const residentialCount = items.filter((i) => i.propertyType === 'residential').length;
    const residentialUnitsCount = items
      .filter((i) => i.propertyType === 'residential')
      .reduce((acc, item) => acc + getItemUnits(item), 0);
    const commercialCount = items.filter((i) => i.propertyType === 'commercial').length;
    const commercialUnitsCount = items
      .filter((i) => i.propertyType === 'commercial')
      .reduce((acc, item) => acc + getItemUnits(item), 0);

    const totalMonthlyRent = FinancialMath.round(items.reduce((acc, item) => acc + item.monthlyRent, 0));
    const totalAnnualRent = FinancialMath.round(totalMonthlyRent * 12);
    const totalMonthlyExcludedCharges = FinancialMath.round(
      items.reduce((acc, item) => acc + (item.condominiumFee ?? 0) + (item.iptuAmount ?? 0), 0)
    );

    const landlordProfile: LandlordProfile = {
      personType: isPJ ? 'pj' : 'pf',
      totalPropertiesRented: totalUnits,
      totalAnnualRentalIncome: totalAnnualRent,
      managementFeePercent: 10.0,
    };

    let totalMonthlySocialDeduction = 0;
    let totalMonthlyTaxableBase = 0;
    let totalMonthlyIBSCBS = 0;

    const propertyBreakdowns = items.map((item) => {
      const calculation = TaxCalculatorEngine.calculateContract(
        {
          baseRent: item.monthlyRent,
          propertyType: item.propertyType,
          condominiumFee: item.condominiumFee ?? 0,
          iptuAmount: item.iptuAmount ?? 0,
          transitionYear,
          landlord: landlordProfile,
          tenant: { personType: item.tenantType },
          unitsCount: getItemUnits(item),
        },
        params
      );

      totalMonthlySocialDeduction = FinancialMath.sum(totalMonthlySocialDeduction, calculation.socialDeductionApplied);
      totalMonthlyTaxableBase = FinancialMath.sum(totalMonthlyTaxableBase, calculation.taxableBase);
      totalMonthlyIBSCBS = FinancialMath.sum(totalMonthlyIBSCBS, calculation.totalTaxDue);

      return {
        item,
        calculation,
      };
    });

    const isLandlordTaxpayer = propertyBreakdowns[0]?.calculation.enquadramento.isTaxpayer ?? false;
    const enquadramentoReason = propertyBreakdowns[0]?.calculation.enquadramento.reason ?? '';
    const totalAnnualIBSCBS = FinancialMath.round(totalMonthlyIBSCBS * 12);
    const totalNetIfPassed = totalMonthlyRent;
    const totalNetIfAbsorbed = FinancialMath.subtract(totalMonthlyRent, totalMonthlyIBSCBS);
    const effectiveAverageRate = totalMonthlyRent > 0
      ? FinancialMath.round((totalMonthlyIBSCBS / totalMonthlyRent) * 100)
      : 0;

    return {
      totalProperties,
      totalUnits,
      residentialCount,
      residentialUnitsCount,
      commercialCount,
      commercialUnitsCount,
      transitionYear,
      totalMonthlyRent,
      totalAnnualRent,
      totalMonthlyExcludedCharges,
      isLandlordTaxpayer,
      enquadramentoReason,
      totalMonthlySocialDeduction,
      totalMonthlyTaxableBase,
      totalMonthlyIBSCBS,
      totalAnnualIBSCBS,
      totalNetIfPassed,
      totalNetIfAbsorbed,
      effectiveAverageRate,
      propertyBreakdowns,
    };
  }
}
