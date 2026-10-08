import { describe, expect, it } from 'vitest'
import {
  resumoDoLocador,
  resumoPorLocador,
  totalDeFiadores,
  type ContratoParaLocador,
} from '@/lib/fiadores-do-locador'

const contrato = (extra: Partial<ContratoParaLocador> = {}): ContratoParaLocador => ({
  id: 'c1',
  numero: '003/2026',
  status: 'ativo',
  locador_id: 'l1',
  fiador_id: 'f1',
  imovel: 'im1',
  expand: {
    inquilino: { nome: 'Padaria Pão Quente' },
    imovel: { nome: 'Edifício Aguiar' },
    unidade_id: { identificador: 'Sala 01' },
    fiador_id: { id: 'f1', nome: 'Pedro Alves', cpf: '111.444.777-35' },
  },
  ...extra,
})

describe('resumoPorLocador', () => {
  it('liga o fiador ao locador pelo contrato ativo e diz de quem ele é fiador', () => {
    const r = resumoDoLocador(resumoPorLocador([contrato()]), 'l1')
    expect(r.imoveis).toBe(1)
    expect(r.fiadores).toEqual([
      {
        chave: 'f1:c1',
        fiadorId: 'f1',
        nome: 'Pedro Alves',
        cpf: '111.444.777-35',
        vinculo: 'Fiador de Padaria Pão Quente · Sala 01 · Edifício Aguiar',
        codigo: '003/2026',
      },
    ])
  })

  it('ignora contratos encerrados, cancelados e sem locador', () => {
    const r = resumoPorLocador([
      contrato({ status: 'encerrado' }),
      contrato({ id: 'c2', status: 'cancelado' }),
      contrato({ id: 'c3', locador_id: null }),
    ])
    expect(r.size).toBe(0)
  })

  it('conta imóveis distintos e mantém um cartão por contrato garantido', () => {
    const r = resumoDoLocador(
      resumoPorLocador([contrato(), contrato({ id: 'c2', numero: '004/2026' })]),
      'l1',
    )
    expect(r.imoveis).toBe(1)
    expect(r.fiadores.map((f) => f.codigo)).toEqual(['003/2026', '004/2026'])
  })

  it('contrato sem fiador conta o imóvel mas não cria fiador', () => {
    const r = resumoDoLocador(resumoPorLocador([contrato({ fiador_id: null })]), 'l1')
    expect(r).toEqual({ imoveis: 1, fiadores: [] })
  })

  it('locador sem contrato devolve um resumo vazio', () => {
    expect(resumoDoLocador(new Map(), 'qualquer')).toEqual({ imoveis: 0, fiadores: [] })
  })

  it('total de fiadores conta cada pessoa uma vez, mesmo em dois locadores', () => {
    const resumos = resumoPorLocador([
      contrato(),
      contrato({ id: 'c2', locador_id: 'l2' }),
      contrato({
        id: 'c3',
        fiador_id: 'f2',
        expand: { fiador_id: { id: 'f2', nome: 'Ana Costa', cpf: null } },
      }),
    ])
    expect(totalDeFiadores(resumos, ['l1', 'l2'])).toBe(2)
  })
})
