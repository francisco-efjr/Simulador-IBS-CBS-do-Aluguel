import { describe, expect, it } from 'vitest'
import {
  contratosPorInquilino,
  ehFiltroContratoDoInquilino,
  situacaoDoInquilino,
} from '@/lib/contrato-do-inquilino'

const HOJE = '2026-10-07'
const sala = (extra = {}) => ({
  inquilino: 'i1',
  status: 'ativo',
  data_fim: '2027-03-31',
  expand: { imovel: { nome: 'Edifício Aguiar' }, unidade_id: { identificador: 'Sala 101' } },
  ...extra,
})

describe('situacaoDoInquilino', () => {
  it('sem contrato ativo (nenhum, encerrado ou cancelado) fica "Sem contrato"', () => {
    const vazio = {
      temContrato: false,
      rotulo: 'Sem contrato',
      tom: 'neutral',
      unidade: 'Sem unidade',
    }
    expect(situacaoDoInquilino([], HOJE)).toEqual(vazio)
    expect(situacaoDoInquilino([sala({ status: 'encerrado' })], HOJE)).toEqual(vazio)
    expect(situacaoDoInquilino([sala({ status: 'cancelado' })], HOJE)).toEqual(vazio)
  })

  it('mostra a situação e a unidade do contrato ativo', () => {
    expect(situacaoDoInquilino([sala()], HOJE)).toEqual({
      temContrato: true,
      rotulo: 'Vigente',
      tom: 'ok',
      unidade: 'Sala 101 · Edifício Aguiar',
    })
  })

  it('com vários contratos ativos, a pílula é a de maior atenção e a unidade ganha "+N"', () => {
    const s = situacaoDoInquilino(
      [
        sala(),
        sala({ data_fim: '2026-10-31', expand: { unidade_id: { identificador: 'Sala 102' } } }),
      ],
      HOJE,
    )
    expect(s.rotulo).toBe('Vence em 24 dias')
    expect(s.unidade).toBe('Sala 102 +1')
  })

  it('agrupa contratos por inquilino e ignora contrato sem inquilino', () => {
    const mapa = contratosPorInquilino([
      sala(),
      sala({ inquilino: 'i2' }),
      sala({ inquilino: null }),
    ])
    expect(mapa.get('i1')).toHaveLength(1)
    expect(mapa.size).toBe(2)
  })

  it('aceita só filtros conhecidos vindos da URL', () => {
    expect(ehFiltroContratoDoInquilino('com')).toBe(true)
    expect(ehFiltroContratoDoInquilino('outro')).toBe(false)
  })
})
