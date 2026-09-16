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
import { applyLiveBRLMask } from '../core/utils/formatUtils.ts';

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
      expect(summary.totalUnits).toBe(2);
      expect(summary.totalMonthlyRent).toBe(8000);
      expect(summary.totalMonthlyExcludedCharges).toBe(1700);
      expect(summary.totalMonthlySocialDeduction).toBe(600);
    });

    it('deve calcular corretamente condomínios/quitinetes com múltiplas unidades e redutores escalonados', () => {
      // Condomínio de 5 quitinetes de R$ 5.000,00 cada (total R$ 25.000/mês = R$ 300.000/ano > R$ 240.000)
      const kitnetCondo = [
        {
          id: 'kitnets-1',
          name: 'Vila de Quitinetes Centro',
          propertyType: 'residential' as const,
          monthlyRent: 25000,
          unitsCount: 5, // 5 unidades
          condominiumFee: 0,
          iptuAmount: 200,
          tenantType: 'pf' as const,
        },
      ];

      const summary = PortfolioEngine.evaluatePortfolio(kitnetCondo, false, DEFAULT_TAX_PARAMETERS, 2033);
      expect(summary.totalProperties).toBe(1);
      expect(summary.totalUnits).toBe(5);
      expect(summary.residentialUnitsCount).toBe(5);

      // Redutor social: 5 unidades x R$ 600,00 = R$ 3.000,00
      expect(summary.totalMonthlySocialDeduction).toBe(3000);

      // Base tributável: 25.000 - 3.000 = R$ 22.000,00
      expect(summary.totalMonthlyTaxableBase).toBe(22000);

      // Imposto: 7.95% de R$ 22.000 = R$ 1.749,00
      expect(summary.totalMonthlyIBSCBS).toBe(1749.0);

      // Habitualidade: 5 unidades alugadas excede o limite de 3 imóveis e R$ 300k > R$ 240k
      expect(summary.propertyBreakdowns[0].calculation.enquadramento.criteria.exceedsPropertyLimit).toBe(true);
      expect(summary.propertyBreakdowns[0].calculation.enquadramento.criteria.exceedsIncomeLimit).toBe(true);
      expect(summary.isLandlordTaxpayer).toBe(true);
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

  describe('9. Máscara Monetária Progressiva Brasileira (Centavos ao Vivo)', () => {
    it('deve aplicar deslocamento progressivo de centavos (1 -> 0,01, 10 -> 0,10, etc.)', () => {
      // 1. Digita "1" -> 0,01
      const step1 = applyLiveBRLMask('1', 2);
      expect(step1.display).toBe('0,01');
      expect(step1.value).toBe(0.01);

      // 2. Digita "0" a seguir ("0,010") -> 0,10
      const step2 = applyLiveBRLMask('0,010', 2);
      expect(step2.display).toBe('0,10');
      expect(step2.value).toBe(0.10);

      // 3. Digita "0" a seguir ("0,100") -> 1,00
      const step3 = applyLiveBRLMask('0,100', 2);
      expect(step3.display).toBe('1,00');
      expect(step3.value).toBe(1.00);

      // 4. Digita "0" a seguir ("1,000") -> 10,00
      const step4 = applyLiveBRLMask('1,000', 2);
      expect(step4.display).toBe('10,00');
      expect(step4.value).toBe(10.00);

      // 5. Digita "0" a seguir ("10,000") -> 100,00
      const step5 = applyLiveBRLMask('10,000', 2);
      expect(step5.display).toBe('100,00');
      expect(step5.value).toBe(100.00);

      // 6. Digita "0" a seguir ("100,000") -> 1.000,00
      const step6 = applyLiveBRLMask('100,000', 2);
      expect(step6.display).toBe('1.000,00');
      expect(step6.value).toBe(1000.00);
    });

    it('deve recuar dígitos progressivamente ao apagar (backspace)', () => {
      // De 1.000,00 apagou último 0 ("1.000,0") -> 100,00
      const b1 = applyLiveBRLMask('1.000,0', 2);
      expect(b1.display).toBe('100,00');
      expect(b1.value).toBe(100.00);

      // De 0,01 apagou o 1 ("0,0") -> vazio / zerado
      const b2 = applyLiveBRLMask('0,0', 2);
      expect(b2.display).toBe('');
      expect(b2.value).toBe(0);
    });

    it('deve suportar valores negativos e inteiros (decimals = 0)', () => {
      const neg = applyLiveBRLMask('-2000', 2);
      expect(neg.display).toBe('-20,00');
      expect(neg.value).toBe(-20);

      const intVal = applyLiveBRLMask('15', 0);
      expect(intVal.display).toBe('15');
      expect(intVal.value).toBe(15);
    });
  });
});
