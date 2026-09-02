import { describe, it, expect } from 'vitest';
import {
  EnquadramentoEngine,
  TaxCalculatorEngine,
  ComparativeEngine,
  PortfolioEngine,
  TransitionCalendar,
  DEFAULT_TAX_PARAMETERS,
  FinancialMath,
  LandlordProfile,
  TenantProfile,
} from '../core/index.ts';

describe('Auditoria Tributária da Locação de Imóveis (LC 214/2025)', () => {
  describe('1. Enquadramento e Habitualidade', () => {
    it('deve classificar PF como NÃO contribuinte se tiver até 3 imóveis, mesmo com receita alta', () => {
      const landlord: LandlordProfile = {
        personType: 'pf',
        totalPropertiesRented: 2,
        totalAnnualRentalIncome: 500000,
      };
      const result = EnquadramentoEngine.evaluate(landlord);
      expect(result.isTaxpayer).toBe(false);
      expect(result.criteria.exceedsPropertyLimit).toBe(false);
      expect(result.criteria.exceedsIncomeLimit).toBe(true);
    });

    it('deve classificar PF como NÃO contribuinte se tiver mais de 3 imóveis mas receita até R$ 240.000', () => {
      const landlord: LandlordProfile = {
        personType: 'pf',
        totalPropertiesRented: 5,
        totalAnnualRentalIncome: 180000,
      };
      const result = EnquadramentoEngine.evaluate(landlord);
      expect(result.isTaxpayer).toBe(false);
      expect(result.criteria.exceedsPropertyLimit).toBe(true);
      expect(result.criteria.exceedsIncomeLimit).toBe(false);
    });

    it('deve classificar PF como CONTRIBUINTE quando exceder cumulativamente ambos os limites', () => {
      const landlord: LandlordProfile = {
        personType: 'pf',
        totalPropertiesRented: 4,
        totalAnnualRentalIncome: 250000,
      };
      const result = EnquadramentoEngine.evaluate(landlord);
      expect(result.isTaxpayer).toBe(true);
      expect(result.criteria.exceedsPropertyLimit).toBe(true);
      expect(result.criteria.exceedsIncomeLimit).toBe(true);
    });

    it('deve classificar PJ sempre como CONTRIBUINTE no regime de bens imóveis', () => {
      const landlord: LandlordProfile = { personType: 'pj' };
      const result = EnquadramentoEngine.evaluate(landlord);
      expect(result.isTaxpayer).toBe(true);
    });
  });

  describe('2. Exclusão de Encargos Acessórios e Base de Cálculo (Arts. 255 e 260)', () => {
    const taxpayerLandlord: LandlordProfile = {
      personType: 'pf',
      totalPropertiesRented: 5,
      totalAnnualRentalIncome: 300000,
    };
    const tenantPF: TenantProfile = { personType: 'pf' };

    it('deve expurgar Condomínio e IPTU da base de cálculo do IBS/CBS', () => {
      const calc = TaxCalculatorEngine.calculateContract({
        baseRent: 3000,
        condominiumFee: 600,
        iptuAmount: 200,
        propertyType: 'residential',
        transitionYear: 2033,
        landlord: taxpayerLandlord,
        tenant: tenantPF,
      });

      expect(calc.baseRent).toBe(3000);
      expect(calc.excludedCharges).toBe(800);
      expect(calc.totalTenantReceipt).toBe(3800);
      // Base = 3000 - 600 (redutor) = 2400 (IPTU e Condomínio não entram!)
      expect(calc.taxableBase).toBe(2400);
    });

    it('deve abater o Redutor Social de R$ 600 em locações residenciais', () => {
      const calc = TaxCalculatorEngine.calculate(2000, 'residential', taxpayerLandlord, tenantPF);
      expect(calc.socialDeductionApplied).toBe(600);
      expect(calc.taxableBase).toBe(1400);
      expect(calc.totalTaxDue).toBe(111.3);
    });

    it('NÃO deve aplicar Redutor Social em locação comercial', () => {
      const calc = TaxCalculatorEngine.calculate(2000, 'commercial', taxpayerLandlord, tenantPF);
      expect(calc.socialDeductionApplied).toBe(0);
      expect(calc.taxableBase).toBe(2000);
      expect(calc.totalTaxDue).toBe(159.0);
    });
  });

  describe('3. Cronograma de Transição Constitucional (2026 a 2033)', () => {
    const taxpayerLandlord: LandlordProfile = {
      personType: 'pj',
      managementFeePercent: 10,
    };
    const tenantPF: TenantProfile = { personType: 'pf' };

    it('deve aplicar alíquota de teste em 2026 (0,30% efetivo)', () => {
      const calc = TaxCalculatorEngine.calculateContract({
        baseRent: 10000,
        propertyType: 'commercial',
        transitionYear: 2026,
        landlord: taxpayerLandlord,
        tenant: tenantPF,
      });
      // 2026: nominal 1,0% c/ 70% desconto = 0,30% efetivo
      expect(calc.effectiveRate).toBe(0.3);
      expect(calc.totalTaxDue).toBe(30); // 10000 * 0.30%
    });

    it('deve aplicar CBS plena em 2027 (2,64% efetivo)', () => {
      const calc = TaxCalculatorEngine.calculateContract({
        baseRent: 10000,
        propertyType: 'commercial',
        transitionYear: 2027,
        landlord: taxpayerLandlord,
        tenant: tenantPF,
      });
      // 2027: CBS 8,8% c/ 70% desconto = 2,64% efetivo
      expect(calc.effectiveRate).toBe(2.64);
      expect(calc.effectiveIbsRate).toBe(0);
      expect(calc.totalTaxDue).toBe(264);
    });

    it('deve aplicar alíquota plena em 2033 (7,95% efetivo)', () => {
      const calc = TaxCalculatorEngine.calculateContract({
        baseRent: 10000,
        propertyType: 'commercial',
        transitionYear: 2033,
        landlord: taxpayerLandlord,
        tenant: tenantPF,
      });
      expect(calc.effectiveRate).toBe(7.95);
      expect(calc.totalTaxDue).toBe(795);
    });
  });

  describe('4. Consistência Matemática e Precisão Contábil', () => {
    it('deve garantir que CBS + IBS seja RIGOROSAMENTE IGUAL ao TotalTaxDue em centavos', () => {
      const oddValues = [153.25, 876.43, 1234.56, 999.99, 15432.17];
      const landlordPJ: LandlordProfile = { personType: 'pj' };
      const tenantPF: TenantProfile = { personType: 'pf' };

      for (const val of oddValues) {
        const calc = TaxCalculatorEngine.calculateContract({
          baseRent: val,
          propertyType: 'commercial',
          transitionYear: 2033,
          landlord: landlordPJ,
          tenant: tenantPF,
        });

        const sumSplit = FinancialMath.round(calc.cbsAmount + calc.ibsAmount);
        expect(sumSplit).toBe(calc.totalTaxDue);
        expect(calc.auditReport.findings.find(f => f.ruleName.includes('Integridade Contábil'))?.status).toBe('passed');
      }
    });
  });

  describe('5. Créditos Operacionais do Locador PJ e Cadeia B2B', () => {
    it('deve apurar crédito sobre taxa de imobiliária para Locador PJ', () => {
      const landlordPJ: LandlordProfile = {
        personType: 'pj',
        managementFeePercent: 10,
      };
      const tenantPJ: TenantProfile = { personType: 'pj', pjTaxRegime: 'lucro_real' };

      const calc = TaxCalculatorEngine.calculateContract({
        baseRent: 10000,
        propertyType: 'commercial',
        transitionYear: 2033,
        landlord: landlordPJ,
        tenant: tenantPJ,
      });

      expect(calc.landlordCredits.hasRightToCredits).toBe(true);
      expect(calc.landlordCredits.managementFeeAmount).toBe(1000); // 10% de 10.000
      expect(calc.landlordCredits.managementFeeIbsCbsCredit).toBe(79.5); // 1000 * 7.95%
      expect(calc.landlordCredits.netTaxToPay).toBe(715.5); // 795 - 79.50
      expect(calc.creditAnalysis.eligibleForCredit).toBe(true);
      expect(calc.creditAnalysis.creditAmount).toBe(795);
    });
  });

  describe('6. Comparativo Pré vs Pós com Deduções Reais e Auditoria', () => {
    it('deve gerar laudo de auditoria fiscal completo e comparativo com Carnê-Leão', () => {
      const landlord: LandlordProfile = {
        personType: 'pf',
        totalPropertiesRented: 5,
        totalAnnualRentalIncome: 300000,
        managementFeePercent: 10,
      };

      const calc = TaxCalculatorEngine.calculateContract({
        baseRent: 5000,
        propertyType: 'residential',
        transitionYear: 2033,
        landlord,
        tenant: { personType: 'pf' },
      });

      expect(calc.auditReport.complianceStatus).toBe('CONFORME');
      expect(calc.auditReport.findings.length).toBeGreaterThan(3);

      const comp = ComparativeEngine.compare(5000, 'residential', landlord, DEFAULT_TAX_PARAMETERS, 2033);
      expect(comp.preReform.systemName).toContain('Pessoa Física');
      expect(comp.postReform.isTaxpayer).toBe(true);
      expect(comp.postReform.ibscbsAmount).toBe(calc.totalTaxDue);
    });
  });

  describe('7. Consolidação de Carteira de Imóveis', () => {
    it('deve consolidar portfólio com encargos excluídos e redutores sociais', () => {
      const items = [
        { id: '1', name: 'Apt 1', propertyType: 'residential' as const, monthlyRent: 3000, condominiumFee: 500, iptuAmount: 150, tenantType: 'pf' as const },
        { id: '2', name: 'Sala 1', propertyType: 'commercial' as const, monthlyRent: 5000, condominiumFee: 800, iptuAmount: 250, tenantType: 'pj' as const },
      ];

      const summary = PortfolioEngine.evaluatePortfolio(items, false, DEFAULT_TAX_PARAMETERS, 2033);
      expect(summary.totalProperties).toBe(2);
      expect(summary.totalMonthlyRent).toBe(8000);
      expect(summary.totalMonthlyExcludedCharges).toBe(1700);
      expect(summary.totalMonthlySocialDeduction).toBe(600);
    });
  });

  describe('8. API e Payload do Cronograma de Transição (GET)', () => {
    it('deve retornar o cronograma completo (2026–2033) com metadados e alíquotas oficiais válidas', () => {
      const schedule = TransitionCalendar.getFullSchedule();

      expect(schedule.metadata.status).toBe('VIGENTE_E_VALIDADO');
      expect(schedule.metadata.legalBasis).toContain('214/2025');
      expect(schedule.years).toHaveLength(8);

      // Ano 2026 (Teste)
      const y2026 = schedule.years.find(y => y.year === 2026);
      expect(y2026?.isTestPhase).toBe(true);
      expect(y2026?.nominalTotalRate).toBe(1.0);
      expect(y2026?.effectiveTotalRate).toBe(0.30); // 1.0 * 30%

      // Ano 2033 (Pleno)
      const y2033 = schedule.years.find(y => y.year === 2033);
      expect(y2033?.isFullPhase).toBe(true);
      expect(y2033?.nominalTotalRate).toBe(26.5);
      expect(y2033?.effectiveTotalRate).toBe(7.95); // 26.5 * 30%
    });
  });
});
