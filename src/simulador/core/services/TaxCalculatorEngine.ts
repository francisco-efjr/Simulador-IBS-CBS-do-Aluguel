import {
  CalculationResult,
  LandlordCreditAnalysis,
  LandlordProfile,
  LeaseContractInput,
  PropertyType,
  TaxParameters,
  TenantProfile,
  TransitionYear,
} from '../domain/types.ts'
import { DEFAULT_TAX_PARAMETERS } from '../domain/constants.ts'
import { FinancialMath } from '../domain/FinancialMath.ts'
import { ValidationEngine, DomainValidationError } from '../domain/ValidationEngine.ts'
import { EnquadramentoEngine } from './EnquadramentoEngine.ts'
import { TransitionCalendar } from './TransitionCalendar.ts'
import { AuditTrailEngine } from './AuditTrailEngine.ts'

/**
 * Motor Central de Cálculo de IBS e CBS para Locação de Bens Imóveis
 * Executa o Pipeline Fiscal unificado conforme a LC 214/2025
 */
export class TaxCalculatorEngine {
  /**
   * Valida entradas antes de executar o cálculo
   */
  public static validate(input: LeaseContractInput) {
    return ValidationEngine.validateLeaseInput(input)
  }

  /**
   * Executa a apuração completa a partir de um objeto LeaseContractInput
   */
  public static calculateContract(
    input: LeaseContractInput,
    params: TaxParameters = DEFAULT_TAX_PARAMETERS,
  ): CalculationResult {
    // 0. Validação de Domínio Estrita
    const validation = ValidationEngine.validateLeaseInput(input)
    if (!validation.isValid) {
      throw new DomainValidationError('Contrato de locação inválido', validation.errors)
    }

    const sanitizedInput = validation.sanitized
    const baseRent = sanitizedInput.baseRent
    const condo = sanitizedInput.condominiumFee ?? 0
    const iptu = sanitizedInput.iptuAmount ?? 0
    const propertyType = sanitizedInput.propertyType
    const transitionYear: TransitionYear =
      sanitizedInput.transitionYear ?? params.transitionYear ?? 2033
    const landlord = sanitizedInput.landlord
    const tenant = sanitizedInput.tenant

    // 1. Enquadramento Tributário
    const enquadramento = EnquadramentoEngine.evaluate(landlord, params)

    // 2. Cronograma de Transição e Alíquotas Oficiais do Ano
    const yearRates = TransitionCalendar.getRatesForYear(
      transitionYear,
      params.referenceRate,
      params.cbsShare,
      params.ibsShare,
      params.realEstateDiscountPercent,
    )

    // 3. Encargos Acessórios Excluídos da Incidência (Art. 255 e 260)
    const excludedCharges = FinancialMath.round(condo + iptu)
    const totalTenantReceipt = FinancialMath.round(baseRent + excludedCharges)

    // 4. Redutor Social Residencial (Art. 260)
    // Para condomínios ou quitinetes, o redutor de R$ 600 aplica-se por unidade/apartamento residencial
    let socialDeductionApplied = 0
    const unitsCount =
      sanitizedInput.unitsCount && sanitizedInput.unitsCount > 0 ? sanitizedInput.unitsCount : 1
    if (propertyType === 'residential') {
      const maxSocialDeduction = FinancialMath.round(params.socialDeductionResidential * unitsCount)
      socialDeductionApplied = Math.min(baseRent, maxSocialDeduction)
    }

    // 5. Base de Cálculo Tributável
    const taxableBase = Math.max(0, FinancialMath.subtract(baseRent, socialDeductionApplied))

    // 6. Cálculo dos Tributos com consistência contábil exata
    let cbsAmount = 0
    let ibsAmount = 0
    let totalTaxDue = 0

    if (enquadramento.isTaxpayer && taxableBase > 0) {
      const split = FinancialMath.splitTax(
        taxableBase,
        yearRates.effectiveCbsRate,
        yearRates.effectiveIbsRate,
      )
      cbsAmount = split.cbs
      ibsAmount = split.ibs
      totalTaxDue = split.total
    }

    // 7. Créditos de Entrada do Locador PJ (Insumos da Locação)
    let landlordCredits: LandlordCreditAnalysis
    const mgmtPercent = landlord.managementFeePercent ?? 10.0 // Default 10% de taxa imobiliária
    const mgmtAmount = FinancialMath.percentage(baseRent, mgmtPercent)

    if (landlord.personType === 'pj' && enquadramento.isTaxpayer) {
      // PJ locadora toma crédito sobre o serviço prestado pela imobiliária
      const mgmtCredit = FinancialMath.percentage(mgmtAmount, yearRates.effectiveTotalRate)
      const netTaxToPay = Math.max(0, FinancialMath.subtract(totalTaxDue, mgmtCredit))
      landlordCredits = {
        hasRightToCredits: true,
        managementFeeAmount: mgmtAmount,
        managementFeeIbsCbsCredit: mgmtCredit,
        netTaxToPay,
        creditExplanation: `PJ locadora se credita de R$ ${mgmtCredit.toFixed(2)} sobre a taxa da imobiliária (R$ ${mgmtAmount.toFixed(2)} a ${mgmtPercent}%), reduzindo o imposto a recolher para R$ ${netTaxToPay.toFixed(2)}.`,
      }
    } else {
      landlordCredits = {
        hasRightToCredits: false,
        managementFeeAmount: mgmtAmount,
        managementFeeIbsCbsCredit: 0,
        netTaxToPay: totalTaxDue,
        creditExplanation:
          landlord.personType === 'pf'
            ? 'Pessoa Física não toma créditos no IBS/CBS, mas a comissão da imobiliária é dedutível no Carnê-Leão (IRPF).'
            : 'Sem créditos de entrada apurados.',
      }
    }

    // 8. Cenários Econômicos (Repasse vs Absorção)
    const passedToTenantFinalCost = FinancialMath.round(totalTenantReceipt + totalTaxDue)
    const passedToTenantLandlordNet = FinancialMath.round(
      baseRent - landlordCredits.managementFeeAmount,
    )
    const passedTaxBurden = baseRent > 0 ? FinancialMath.round((totalTaxDue / baseRent) * 100) : 0

    const absorbedFinalCost = totalTenantReceipt
    const effectiveLandlordBurden = landlordCredits.hasRightToCredits
      ? landlordCredits.netTaxToPay
      : totalTaxDue
    const absorbedLandlordNet = FinancialMath.round(
      baseRent - effectiveLandlordBurden - landlordCredits.managementFeeAmount,
    )
    const absorbedTaxBurden =
      baseRent > 0 ? FinancialMath.round((effectiveLandlordBurden / baseRent) * 100) : 0

    // 9. Análise de Aproveitamento de Crédito pelo Inquilino (B2B)
    const eligibleForCredit =
      enquadramento.isTaxpayer &&
      tenant.personType === 'pj' &&
      (tenant.pjTaxRegime !== 'simples_nacional' || tenant.canTakeCredits === true)

    const creditAmount = eligibleForCredit ? totalTaxDue : 0
    const netCostForTenantPJ = eligibleForCredit
      ? FinancialMath.subtract(passedToTenantFinalCost, creditAmount)
      : passedToTenantFinalCost

    let creditNote = ''
    if (!enquadramento.isTaxpayer) {
      creditNote =
        'Locador não é contribuinte de IBS/CBS. Nenhum crédito tributário é gerado para o locatário.'
    } else if (tenant.personType === 'pf') {
      creditNote = 'Locatário é Pessoa Física (consumidor final), não gera crédito tributário.'
    } else if (tenant.pjTaxRegime === 'simples_nacional') {
      creditNote =
        'Locatário é PJ optante pelo Simples Nacional. Aproveitamento de créditos sujeito a regras específicas.'
    } else {
      creditNote =
        'Locatário PJ no regime regular aproveita 100% de crédito do IBS/CBS destacado na NFS-e, neutralizando o tributo.'
    }

    const partialResult: Omit<CalculationResult, 'auditReport'> = {
      baseRent,
      condominiumFee: condo,
      iptuAmount: iptu,
      totalTenantReceipt,
      propertyType,
      transitionYear,
      landlord,
      tenant,
      unitsCount,
      enquadramento,
      nominalRate: yearRates.nominalTotalRate,
      discountPercent: params.realEstateDiscountPercent,
      effectiveRate: yearRates.effectiveTotalRate,
      effectiveCbsRate: yearRates.effectiveCbsRate,
      effectiveIbsRate: yearRates.effectiveIbsRate,
      socialDeductionApplied,
      excludedCharges,
      taxableBase,
      cbsAmount,
      ibsAmount,
      totalTaxDue,
      landlordCredits,
      scenarios: {
        passedToTenant: {
          finalTenantCost: passedToTenantFinalCost,
          landlordNetIncome: passedToTenantLandlordNet,
          taxBurdenPercent: passedTaxBurden,
        },
        absorbedByLandlord: {
          finalTenantCost: absorbedFinalCost,
          landlordNetIncome: absorbedLandlordNet,
          taxBurdenPercent: absorbedTaxBurden,
        },
      },
      creditAnalysis: {
        eligibleForCredit,
        creditAmount,
        netCostForTenantPJ,
        note: creditNote,
      },
      validationWarnings: validation.warnings,
    }

    // 10. Emissão do Laudo de Auditoria Fiscal
    const auditReport = AuditTrailEngine.generateReport(input, partialResult, params)

    return {
      ...partialResult,
      auditReport,
    }
  }

  /**
   * Método de compatibilidade com chamadas simplificadas (legadas)
   */
  public static calculate(
    grossRent: number,
    propertyType: PropertyType,
    landlord: LandlordProfile,
    tenant: TenantProfile,
    params: TaxParameters = DEFAULT_TAX_PARAMETERS,
    condoFee: number = 0,
    iptu: number = 0,
  ): CalculationResult {
    return this.calculateContract(
      {
        baseRent: grossRent,
        propertyType,
        condominiumFee: condoFee,
        iptuAmount: iptu,
        transitionYear: params.transitionYear,
        landlord,
        tenant,
      },
      params,
    )
  }
}
