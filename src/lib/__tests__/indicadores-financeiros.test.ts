import { describe, expect, it } from 'vitest'
import {
  dataDeRealizacao,
  estaVencido,
  hojeLocalISO,
  resumirFinanceiro,
  saldoEmAberto,
  totaisDeReceitas,
  valorRealizado,
  type LancamentoFinanceiro,
} from '../indicadores-financeiros'

/** Mesma massa da semente local usada pelo QA (hoje = 06/10/2026). */
const HOJE = '2026-10-06'

const receita = (
  vencimento: string,
  previsto: number,
  recebido: number | null,
  dataRecebimento: string | null,
  status: string,
): LancamentoFinanceiro => ({
  valor: previsto,
  valor_previsto: previsto,
  valor_recebido: recebido,
  data: vencimento,
  data_vencimento: vencimento,
  data_recebimento: dataRecebimento,
  status_financeiro: status,
})

const despesa = (
  vencimento: string,
  previsto: number,
  pago: number | null,
  dataPagamento: string | null,
  status: string,
): LancamentoFinanceiro => ({
  valor: previsto,
  valor_previsto: previsto,
  valor_pago: pago,
  data: vencimento,
  data_vencimento: vencimento,
  data_pagamento: dataPagamento,
  status_financeiro: status,
})

const receitas = [
  receita('2026-08-05', 2800, 2800, '2026-08-05', 'recebido'),
  receita('2026-09-05', 2800, 2800, '2026-09-05', 'recebido'),
  receita('2026-10-05', 2800, null, null, 'em_atraso'),
  receita('2026-08-10', 4500, 4500, '2026-08-10', 'recebido'),
  receita('2026-09-10', 4500, null, null, 'em_atraso'),
  receita('2026-10-10', 4500, 2250, '2026-10-06', 'parcial'),
  receita('2026-11-10', 4500, null, null, 'previsto'),
]

const despesas = [
  despesa('2026-08-08', 650, 650, '2026-08-08', 'pago'),
  despesa('2026-09-08', 650, 650, '2026-09-08', 'pago'),
  despesa('2026-10-08', 650, null, null, 'previsto'),
  despesa('2026-09-20', 480, 480, '2026-09-20', 'pago'),
  despesa('2026-10-01', 350, null, null, 'em_atraso'),
  despesa('2026-10-02', 120, 120, '2026-10-02', 'pago'),
  despesa('2026-11-12', 190, null, null, 'previsto'),
]

describe('valorRealizado e saldo', () => {
  it('conta a receita parcial pelo que foi de fato recebido', () => {
    const parcial = receitas[5]
    expect(valorRealizado(parcial, 'receita')).toBe(2250)
    expect(saldoEmAberto(parcial, 'receita')).toBe(2250)
    expect(dataDeRealizacao(parcial, 'receita')).toBe('2026-10-06')
  })

  it('não soma nada de quem não recebeu nem pagou', () => {
    expect(valorRealizado(receitas[2], 'receita')).toBe(0)
    expect(valorRealizado(despesas[2], 'despesa')).toBe(0)
  })

  it('despesa parcial também entra pelo valor pago', () => {
    const parcial = despesa('2026-10-03', 1000, 400, '2026-10-03', 'parcial')
    expect(valorRealizado(parcial, 'despesa')).toBe(400)
    expect(saldoEmAberto(parcial, 'despesa')).toBe(600)
  })

  it('registro antigo quitado que só tem o campo legado "valor" continua valendo', () => {
    const antiga: LancamentoFinanceiro = {
      valor: 1500,
      data: '2026-05-10',
      status_financeiro: 'recebido',
    }
    expect(valorRealizado(antiga, 'receita')).toBe(1500)
    expect(saldoEmAberto(antiga, 'receita')).toBe(0)
  })

  it('excedente (recebeu mais que o previsto) não gera saldo negativo', () => {
    const l = receita('2026-10-05', 1000, 1500, '2026-10-05', 'recebido')
    expect(saldoEmAberto(l, 'receita')).toBe(0)
  })

  it('evita erro de ponto flutuante nos centavos', () => {
    const l = receita('2026-10-05', 0.3, 0.1, '2026-10-05', 'parcial')
    expect(saldoEmAberto(l, 'receita')).toBe(0.2)
  })

  it('vencida = com saldo e vencimento antes de hoje, mesmo sendo parcial', () => {
    const parcialVencida = receita('2026-09-30', 4500, 2250, '2026-09-30', 'parcial')
    expect(estaVencido(parcialVencida, 'receita', HOJE)).toBe(true)
    expect(estaVencido(receitas[5], 'receita', HOJE)).toBe(false)
    expect(estaVencido(receitas[0], 'receita', HOJE)).toBe(false) // quitada
  })
})

describe('resumirFinanceiro com a massa da semente do QA', () => {
  it('mês atual: recebido inclui a parcial e o resultado fica positivo', () => {
    const r = resumirFinanceiro(receitas, despesas, {
      inicio: '2026-10-01',
      fim: '2026-10-31',
      hoje: HOJE,
    })
    expect(r.receitasRecebidas).toBe(2250)
    expect(r.despesasPagas).toBe(120)
    expect(r.resultadoLiquido).toBe(2130)
    expect(r.quantidadeReceitasRecebidas).toBe(1)
    // saldo a receber = previsto − recebido; vencida = aluguel de 05/10 sem pagamento
    expect(r.receitasAReceber).toBe(2250)
    expect(r.receitasVencidas).toBe(2800)
    expect(r.despesasAPagar).toBe(650)
    expect(r.despesasVencidas).toBe(350)
  })

  it('últimos 3 meses / ano: 12.350 recebido, não 10.100', () => {
    const r = resumirFinanceiro(receitas, despesas, {
      inicio: '2026-08-01',
      fim: '2026-10-31',
      hoje: HOJE,
    })
    expect(r.receitasRecebidas).toBe(12350)
    const ano = resumirFinanceiro(receitas, despesas, {
      inicio: '2026-01-01',
      fim: '2026-12-31',
      hoje: HOJE,
    })
    expect(ano.receitasRecebidas).toBe(12350)
  })

  it('parcial vencida entra na inadimplência pelo saldo', () => {
    const r = resumirFinanceiro([receita('2026-09-30', 4500, 2250, '2026-09-30', 'parcial')], [], {
      hoje: HOJE,
    })
    expect(r.receitasRecebidas).toBe(2250)
    expect(r.receitasVencidas).toBe(2250)
    expect(r.receitasAReceber).toBe(0)
  })

  it('sem período definido considera tudo; período vazio dá zero', () => {
    expect(resumirFinanceiro(receitas, despesas, { hoje: HOJE }).receitasRecebidas).toBe(12350)
    const vazio = resumirFinanceiro(receitas, despesas, {
      inicio: '2027-01-01',
      fim: '2027-01-31',
      hoje: HOJE,
    })
    expect(vazio.receitasRecebidas).toBe(0)
    expect(vazio.resultadoLiquido).toBe(0)
  })
})

describe('totaisDeReceitas (Início)', () => {
  it('separa recebido, previsto e saldo em vez de somar tudo junto', () => {
    const t = totaisDeReceitas(receitas)
    expect(t.recebido).toBe(12350)
    expect(t.previsto).toBe(2800 * 3 + 4500 * 4)
    expect(t.saldo).toBe(t.previsto - t.recebido)
  })
})

describe('hojeLocalISO', () => {
  it('usa a data local, não a UTC', () => {
    const d = new Date(2026, 9, 6, 21, 30)
    expect(hojeLocalISO(d)).toBe('2026-10-06')
  })
})
