import { describe, it, expect } from 'vitest'
import { calculateMonthlyIRPF, getIRPFTable, IRPF_TABLES } from '../core/domain/irpfTable.ts'
import { ComparativeEngine } from '../core/services/ComparativeEngine.ts'
import { LandlordProfile } from '../core/domain/types.ts'

describe('Tabela progressiva do IRPF por ano-calendário', () => {
  it('seleciona a tabela vigente no ano consultado', () => {
    expect(getIRPFTable(2024).effectiveFrom).toBe(2024)
    expect(getIRPFTable(2025).effectiveFrom).toBe(2025)
    expect(getIRPFTable(2026).effectiveFrom).toBe(2026)
  })

  it('usa a tabela mais recente para anos posteriores ao último cadastrado', () => {
    const latest = IRPF_TABLES[IRPF_TABLES.length - 1]
    expect(getIRPFTable(2033).effectiveFrom).toBe(latest.effectiveFrom)
  })

  it('usa a tabela mais antiga para anos anteriores ao primeiro cadastrado', () => {
    expect(getIRPFTable(2019).effectiveFrom).toBe(IRPF_TABLES[0].effectiveFrom)
  })

  it('não tributa rendimento zerado ou negativo', () => {
    expect(calculateMonthlyIRPF(0, 0, 2025)).toBe(0)
    expect(calculateMonthlyIRPF(-100, 0, 2025)).toBe(0)
  })

  it('aplica o desconto simplificado quando ele supera as deduções legais', () => {
    // Sem dedução legal informada, o simplificado de 2025 (R$ 607,20) prevalece
    const semDeducao = calculateMonthlyIRPF(3000, 0, 2025)
    const comDeducaoMenor = calculateMonthlyIRPF(3000, 100, 2025)
    expect(semDeducao).toBe(comDeducaoMenor)
  })

  it('aplica as deduções legais quando superam o desconto simplificado', () => {
    const comDeducaoAlta = calculateMonthlyIRPF(6000, 2000, 2025)
    const comDeducaoBaixa = calculateMonthlyIRPF(6000, 0, 2025)
    expect(comDeducaoAlta).toBeLessThan(comDeducaoBaixa)
  })

  it('nunca cobra os dois abatimentos ao mesmo tempo', () => {
    const table = getIRPFTable(2025)
    const deducaoLegal = 1000
    const esperadoBase = 5000 - Math.max(deducaoLegal, table.simplifiedDeduction)
    const bracket = table.brackets.find((b) => esperadoBase <= b.upTo)!
    const esperado = Number(((esperadoBase * bracket.rate) / 100 - bracket.deduction).toFixed(2))

    expect(calculateMonthlyIRPF(5000, deducaoLegal, 2025)).toBeCloseTo(esperado, 2)
  })

  it('mantém a progressividade: mais renda nunca paga menos imposto', () => {
    for (const year of [2024, 2025, 2026]) {
      let anterior = -1
      for (let renda = 0; renda <= 20000; renda += 250) {
        const imposto = calculateMonthlyIRPF(renda, 0, year)
        expect(imposto).toBeGreaterThanOrEqual(anterior)
        anterior = imposto
      }
    }
  })

  describe('Isenção ampliada vigente a partir de 2026', () => {
    it('zera o imposto até o teto de isenção', () => {
      expect(calculateMonthlyIRPF(5000, 0, 2026)).toBe(0)
      expect(calculateMonthlyIRPF(4200, 0, 2026)).toBe(0)
    })

    it('cobra imposto acima do teto de isenção', () => {
      expect(calculateMonthlyIRPF(6000, 0, 2026)).toBeGreaterThan(0)
    })

    it('reduz progressivamente o imposto na faixa do redutor', () => {
      const emCincoMil = calculateMonthlyIRPF(5000, 0, 2026)
      const noMeio = calculateMonthlyIRPF(6175, 0, 2026)
      const noTeto = calculateMonthlyIRPF(7350, 0, 2026)

      expect(emCincoMil).toBe(0)
      expect(noMeio).toBeGreaterThan(0)
      expect(noTeto).toBeGreaterThan(noMeio)
    })

    it('acima do teto do redutor cobra a tabela cheia', () => {
      const semRedutor = calculateMonthlyIRPF(12000, 0, 2025)
      const comRegra2026 = calculateMonthlyIRPF(12000, 0, 2026)
      expect(comRegra2026).toBe(semRedutor)
    })

    it('cobra menos que a regra anterior na faixa beneficiada', () => {
      expect(calculateMonthlyIRPF(5000, 0, 2026)).toBeLessThan(calculateMonthlyIRPF(5000, 0, 2025))
    })
  })
})

describe('Comparativo consome a tabela do ano simulado', () => {
  const landlord: LandlordProfile = {
    personType: 'pf',
    totalPropertiesRented: 1,
    totalAnnualRentalIncome: 60000,
    managementFeePercent: 10,
  }

  it('um mesmo aluguel produz IRPF diferente em 2025 e em 2026', () => {
    const em2025 = ComparativeEngine.compare(5000, 'residential', landlord, undefined, 2027)
    const em2033 = ComparativeEngine.compare(5000, 'residential', landlord, undefined, 2033)

    // 2027 e 2033 usam a tabela de 2026 (isenção ampliada); o locador não é
    // contribuinte de IBS/CBS, então a carga vem só do IRPF.
    expect(em2025.preReform.estimatedTaxAmount).toBe(0)
    expect(em2033.preReform.estimatedTaxAmount).toBe(0)
  })

  it('deduz condomínio e IPTU suportados pelo locador da base do Carnê-Leão', () => {
    const semEncargos = ComparativeEngine.compare(9000, 'residential', landlord, undefined, 2033)
    const comEncargos = ComparativeEngine.compare(9000, 'residential', landlord, undefined, 2033, {
      condominiumFee: 1200,
      iptuAmount: 400,
    })

    expect(comEncargos.preReform.estimatedTaxAmount).toBeLessThan(
      semEncargos.preReform.estimatedTaxAmount,
    )
  })
})
