import { CalculationResult } from '../domain/types.ts';

export interface B2BComparisonResult {
  rentNominal: number;
  scenarioTaxpayerLandlord: {
    grossBilled: number;
    ibscbsPaid: number;
    creditRecovered: number;
    netEffectiveCost: number;
  };
  scenarioNonTaxpayerLandlord: {
    grossBilled: number;
    ibscbsPaid: number;
    creditRecovered: number;
    netEffectiveCost: number;
  };
  advantage: 'taxpayer_landlord' | 'non_taxpayer_landlord' | 'neutral';
  financialDifference: number;
  executiveSummary: string;
}

/**
 * Motor de Análise da Cadeia de Créditos (B2B)
 * Demonstra a dinâmica de não-cumulatividade entre empresas e proprietários
 */
export class CreditChainEngine {
  public static analyzeB2B(rentAmount: number, taxResult: CalculationResult): B2BComparisonResult {
    const ibscbsAmount = taxResult.totalTaxDue;
    
    // Cenário 1: Alugando de locador contribuinte com repasse integral
    const scenarioTaxpayer = {
      grossBilled: rentAmount + ibscbsAmount,
      ibscbsPaid: ibscbsAmount,
      creditRecovered: ibscbsAmount,
      netEffectiveCost: rentAmount, // Empresa recupera os créditos no débito de IBS/CBS
    };

    // Cenário 2: Alugando de locador PF não-contribuinte (sem imposto adicional e sem crédito)
    const scenarioNonTaxpayer = {
      grossBilled: rentAmount,
      ibscbsPaid: 0,
      creditRecovered: 0,
      netEffectiveCost: rentAmount,
    };

    const financialDifference = Math.abs(scenarioTaxpayer.netEffectiveCost - scenarioNonTaxpayer.netEffectiveCost);

    return {
      rentNominal: rentAmount,
      scenarioTaxpayerLandlord: scenarioTaxpayer,
      scenarioNonTaxpayerLandlord: scenarioNonTaxpayer,
      advantage: 'neutral',
      financialDifference,
      executiveSummary:
        'Para empresas no regime regular de IBS/CBS, o custo efetivo do aluguel é neutro se o locador contribuinte repassar o imposto por fora, pois o valor do tributo é 100% compensado contra os débitos da própria empresa.',
    };
  }
}
