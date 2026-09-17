import { describe, it, expect } from 'vitest'
import {
  TaxCalculatorEngine,
  EnquadramentoEngine,
  PortfolioEngine,
  ValidationEngine,
  DomainValidationError,
  LandlordProfile,
  TenantProfile,
  DEFAULT_TAX_PARAMETERS,
} from '../core/index.ts'

describe('Engenharia de Qualidade - Fluxos de Exceção e Casos de Borda (QA)', () => {
  const tenantPF: TenantProfile = { personType: 'pf' }

  describe('FE-01: Validação e Sanitização de Entradas Inválidas', () => {
    const validLandlord: LandlordProfile = {
      personType: 'pf',
      totalPropertiesRented: 5,
      totalAnnualRentalIncome: 300000,
    }

    it('deve rejeitar aluguel com valor negativo lançando DomainValidationError', () => {
      expect(() => {
        TaxCalculatorEngine.calculateContract({
          baseRent: -1500,
          propertyType: 'residential',
          landlord: validLandlord,
          tenant: tenantPF,
        })
      }).toThrow(DomainValidationError)

      const validation = ValidationEngine.validateLeaseInput({
        baseRent: -1500,
        propertyType: 'residential',
        landlord: validLandlord,
        tenant: tenantPF,
      })
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some((e) => e.code === 'NEGATIVE_RENT')).toBe(true)
    })

    it('deve rejeitar condomínio com valor negativo', () => {
      expect(() => {
        TaxCalculatorEngine.calculateContract({
          baseRent: 2000,
          condominiumFee: -200,
          propertyType: 'residential',
          landlord: validLandlord,
          tenant: tenantPF,
        })
      }).toThrow(DomainValidationError)
    })

    it('deve rejeitar IPTU com valor negativo', () => {
      expect(() => {
        TaxCalculatorEngine.calculateContract({
          baseRent: 2000,
          iptuAmount: -100,
          propertyType: 'residential',
          landlord: validLandlord,
          tenant: tenantPF,
        })
      }).toThrow(DomainValidationError)
    })

    it('deve rejeitar taxa de imobiliária maior que 100% ou menor que 0%', () => {
      expect(() => {
        TaxCalculatorEngine.calculateContract({
          baseRent: 2000,
          propertyType: 'residential',
          landlord: { ...validLandlord, managementFeePercent: 120 },
          tenant: tenantPF,
        })
      }).toThrow(DomainValidationError)

      expect(() => {
        TaxCalculatorEngine.calculateContract({
          baseRent: 2000,
          propertyType: 'residential',
          landlord: { ...validLandlord, managementFeePercent: -5 },
          tenant: tenantPF,
        })
      }).toThrow(DomainValidationError)
    })
  })

  describe('FE-02: Casos Limítrofes de Habitualidade da PF (Boundary Testing)', () => {
    it('Limite estrito: 3 imóveis e R$ 240.000,00 -> NÃO CONTRIBUINTE (precisa exceder ambos)', () => {
      const landlord: LandlordProfile = {
        personType: 'pf',
        totalPropertiesRented: 3,
        totalAnnualRentalIncome: 240000,
      }
      const result = EnquadramentoEngine.evaluate(landlord, DEFAULT_TAX_PARAMETERS)
      expect(result.isTaxpayer).toBe(false)
      expect(result.criteria.exceedsPropertyLimit).toBe(false)
      expect(result.criteria.exceedsIncomeLimit).toBe(false)
    })

    it('Limite estrito: 4 imóveis e exatamente R$ 240.000,00 -> NÃO CONTRIBUINTE (receita não é superior)', () => {
      const landlord: LandlordProfile = {
        personType: 'pf',
        totalPropertiesRented: 4,
        totalAnnualRentalIncome: 240000,
      }
      const result = EnquadramentoEngine.evaluate(landlord, DEFAULT_TAX_PARAMETERS)
      expect(result.isTaxpayer).toBe(false)
      expect(result.criteria.exceedsPropertyLimit).toBe(true)
      expect(result.criteria.exceedsIncomeLimit).toBe(false)
    })

    it('Limite estrito: 3 imóveis e R$ 240.000,01 -> NÃO CONTRIBUINTE (imóveis não são superiores a 3)', () => {
      const landlord: LandlordProfile = {
        personType: 'pf',
        totalPropertiesRented: 3,
        totalAnnualRentalIncome: 240000.01,
      }
      const result = EnquadramentoEngine.evaluate(landlord, DEFAULT_TAX_PARAMETERS)
      expect(result.isTaxpayer).toBe(false)
      expect(result.criteria.exceedsPropertyLimit).toBe(false)
      expect(result.criteria.exceedsIncomeLimit).toBe(true)
    })

    it('Limite estrito: 4 imóveis e R$ 240.000,01 -> CONTRIBUINTE ENQUADRADO', () => {
      const landlord: LandlordProfile = {
        personType: 'pf',
        totalPropertiesRented: 4,
        totalAnnualRentalIncome: 240000.01,
      }
      const result = EnquadramentoEngine.evaluate(landlord, DEFAULT_TAX_PARAMETERS)
      expect(result.isTaxpayer).toBe(true)
      expect(result.criteria.exceedsPropertyLimit).toBe(true)
      expect(result.criteria.exceedsIncomeLimit).toBe(true)
    })
  })

  describe('FE-03: Casos Limítrofes do Redutor Social de R$ 600,00', () => {
    const taxpayerLandlord: LandlordProfile = {
      personType: 'pf',
      totalPropertiesRented: 5,
      totalAnnualRentalIncome: 300000,
    }

    it('Aluguel exatamente R$ 600,00 -> Base zero e imposto zero', () => {
      const calc = TaxCalculatorEngine.calculateContract({
        baseRent: 600,
        propertyType: 'residential',
        landlord: taxpayerLandlord,
        tenant: tenantPF,
      })

      expect(calc.socialDeductionApplied).toBe(600)
      expect(calc.taxableBase).toBe(0)
      expect(calc.totalTaxDue).toBe(0)
    })

    it('Aluguel R$ 500,00 (inferior ao redutor) -> Base protegida de valor negativo', () => {
      const calc = TaxCalculatorEngine.calculateContract({
        baseRent: 500,
        propertyType: 'residential',
        landlord: taxpayerLandlord,
        tenant: tenantPF,
      })

      expect(calc.socialDeductionApplied).toBe(500)
      expect(calc.taxableBase).toBe(0)
      expect(calc.totalTaxDue).toBe(0)
    })

    it('Aluguel R$ 600,01 -> Base R$ 0,01 sem quebra de precisão', () => {
      const calc = TaxCalculatorEngine.calculateContract({
        baseRent: 600.01,
        propertyType: 'residential',
        landlord: taxpayerLandlord,
        tenant: tenantPF,
      })

      expect(calc.socialDeductionApplied).toBe(600)
      expect(calc.taxableBase).toBe(0.01)
      expect(calc.totalTaxDue).toBe(0) // 0.01 * 7.95% = 0.000795 -> 0.00
      expect(calc.cbsAmount + calc.ibsAmount).toBe(calc.totalTaxDue)
    })
  })

  describe('FE-04: Inconsistência Cadastral e Warnings', () => {
    it('deve emitir warning quando a receita anual declarada for menor que a projeção do próprio imóvel', () => {
      const landlord: LandlordProfile = {
        personType: 'pf',
        totalPropertiesRented: 1,
        totalAnnualRentalIncome: 20000, // 20k no ano
      }
      // Aluguel mensal de 5.000 (daria 60k/ano)
      const calc = TaxCalculatorEngine.calculateContract({
        baseRent: 5000,
        propertyType: 'residential',
        landlord,
        tenant: tenantPF,
      })

      expect(calc.validationWarnings.length).toBeGreaterThan(0)
      expect(calc.validationWarnings[0]).toContain('Inconsistência cadastral')
    })
  })

  describe('FE-05: Resiliência de Carteira Vazia', () => {
    it('deve tratar carteira com zero imóveis sem divisão por zero ou exceção não tratada', () => {
      const summary = PortfolioEngine.evaluatePortfolio([], false)
      expect(summary.totalProperties).toBe(0)
      expect(summary.totalMonthlyRent).toBe(0)
      expect(summary.effectiveAverageRate).toBe(0)
      expect(summary.propertyBreakdowns).toHaveLength(0)
      expect(summary.enquadramentoReason).toContain('Carteira vazia')
    })
  })
})
