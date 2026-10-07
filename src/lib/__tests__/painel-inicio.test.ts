import { describe, expect, it } from 'vitest'
import {
  alertasDoPainel,
  limitesDoMes,
  ocupacaoDasUnidades,
  proximosRecebimentos,
  resultadoDoUltimoMes,
} from '@/lib/painel-inicio'

const HOJE = '2026-10-07'

describe('limitesDoMes', () => {
  it('devolve o mês anterior inteiro, inclusive na virada do ano', () => {
    expect(limitesDoMes(HOJE, 1)).toEqual({
      inicio: '2026-09-01',
      fim: '2026-09-30',
      nome: 'setembro',
    })
    expect(limitesDoMes('2026-01-15', 1)).toEqual({
      inicio: '2025-12-01',
      fim: '2025-12-31',
      nome: 'dezembro',
    })
    expect(limitesDoMes('2028-03-01', 1).fim).toBe('2028-02-29')
  })
})

describe('resultadoDoUltimoMes', () => {
  it('soma só o que entrou e saiu no mês fechado e compara com o anterior', () => {
    const receitas = [
      { valor: 1000, valor_recebido: 1000, data_recebimento: '2026-09-10' },
      { valor: 500, valor_recebido: 200, data_recebimento: '2026-09-20' }, // parcial
      { valor: 800, data_vencimento: '2026-09-25' }, // não recebida
      { valor: 600, valor_recebido: 600, data_recebimento: '2026-08-05' },
      { valor: 900, valor_recebido: 900, data_recebimento: '2026-10-02' }, // mês corrente
    ]
    const despesas = [
      { valor: 300, valor_pago: 300, data_pagamento: '2026-09-15' },
      { valor: 100, valor_pago: 100, data_pagamento: '2026-08-15' },
    ]
    const r = resultadoDoUltimoMes(receitas, despesas, HOJE)
    expect(r).toMatchObject({ mes: 'setembro', receitas: 1200, despesas: 300, resultado: 900 })
    expect(r.variacao).toBe(80) // agosto 500 → setembro 900
  })

  it('não inventa comparação quando o mês anterior não teve resultado positivo', () => {
    expect(resultadoDoUltimoMes([], [], HOJE).variacao).toBeNull()
  })
})

describe('ocupacaoDasUnidades', () => {
  it('conta alugadas sobre as unidades em uso, sem as inativas', () => {
    const o = ocupacaoDasUnidades([
      { status: 'alugado' },
      { status: 'alugado' },
      { status: 'vago' },
      { status: 'em_manutencao' },
      { status: 'inativo' },
    ])
    expect(o).toEqual({ ocupadas: 2, total: 4, percentual: 50 })
    expect(ocupacaoDasUnidades([]).percentual).toBeNull()
  })
})

describe('proximosRecebimentos', () => {
  it('lista o saldo em aberto a partir de hoje, em ordem de data', () => {
    const lista = proximosRecebimentos(
      [
        {
          id: 'a',
          valor: 2400,
          data_vencimento: '2026-10-20',
          expand: { inquilino: { nome: 'Mariana' } },
        },
        {
          id: 'b',
          valor: 14800,
          data_vencimento: '2026-10-10',
          expand: { inquilino: { nome: 'Ribeiro' } },
        },
        { id: 'c', valor: 100, data_vencimento: '2026-10-01' }, // atrasada: vai para alertas
        { id: 'd', valor: 300, valor_recebido: 300, data_vencimento: '2026-10-15' }, // já recebida
      ],
      HOJE,
    )
    expect(lista.map((r) => [r.id, r.quem, r.valor])).toEqual([
      ['b', 'Ribeiro', 14800],
      ['a', 'Mariana', 2400],
    ])
  })
})

describe('alertasDoPainel', () => {
  it('reúne contratos, IPTU, atrasos e a fila do extrato, mais urgente primeiro', () => {
    const alertas = alertasDoPainel({
      hoje: HOJE,
      contratos: [
        {
          id: '1',
          status: 'ativo',
          data_fim: '2026-10-31',
          expand: {
            inquilino: { nome: 'Transportes Ribeiro' },
            unidade_id: { identificador: 'Galpão A' },
          },
        },
        { id: '2', status: 'ativo', data_fim: '2027-03-31' }, // longe
        { id: '3', status: 'encerrado', data_fim: '2026-10-10' }, // encerrado
      ],
      iptu: [
        { id: 'i', status: 'pendente', vencimento: '2026-10-10', descricao: '8ª parcela do IPTU' },
        { id: 'j', status: 'pago', vencimento: '2026-10-09' },
      ],
      receitas: [
        {
          id: 'r',
          valor: 500,
          data_vencimento: '2026-10-01',
          expand: { inquilino: { nome: 'Café' } },
        },
      ],
      transacoesParaClassificar: 14,
    })
    expect(alertas.map((a) => a.id)).toEqual(['receita-r', 'iptu-i', 'transacoes', 'contrato-1'])
    expect(alertas[3]).toMatchObject({
      titulo: 'Contrato de Galpão A vence em 24 dias',
      detalhe: 'Transportes Ribeiro · 31/10',
      tom: 'argila',
    })
    expect(alertas[1].detalhe).toBe('Vence em 3 dias, 10/10')
    expect(alertas[2].titulo).toBe('14 transações para classificar')
  })
})
