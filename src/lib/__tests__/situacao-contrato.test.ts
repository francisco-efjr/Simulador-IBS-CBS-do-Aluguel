import { describe, expect, it } from 'vitest'
import { ehFiltroSituacao, situacaoDoContrato } from '@/lib/situacao-contrato'

const HOJE = '2026-10-07'

describe('situacaoDoContrato', () => {
  it('separa vigente, vencendo e vencido pelo fim do contrato', () => {
    expect(situacaoDoContrato({ status: 'ativo', data_fim: '2027-03-31' }, HOJE)).toEqual({
      grupo: 'vigentes',
      rotulo: 'Vigente',
      tom: 'ok',
    })
    expect(situacaoDoContrato({ status: 'ativo', data_fim: '2026-10-31' }, HOJE)).toEqual({
      grupo: 'vencendo',
      rotulo: 'Vence em 24 dias',
      tom: 'warn',
    })
    expect(situacaoDoContrato({ status: 'ativo', data_fim: '2026-10-08' }, HOJE).rotulo).toBe(
      'Vence em 1 dia',
    )
    expect(situacaoDoContrato({ status: 'ativo', data_fim: '2026-10-07' }, HOJE).rotulo).toBe(
      'Vence hoje',
    )
    expect(situacaoDoContrato({ status: 'ativo', data_fim: '2026-10-01' }, HOJE)).toEqual({
      grupo: 'vencendo',
      rotulo: 'Venceu há 6 dias',
      tom: 'danger',
    })
  })

  it('agrupa encerrados e cancelados, sem esconder a diferença', () => {
    expect(situacaoDoContrato({ status: 'encerrado', data_fim: '2026-08-31' }, HOJE)).toMatchObject(
      {
        grupo: 'encerrados',
        rotulo: 'Encerrado',
      },
    )
    expect(situacaoDoContrato({ status: 'cancelado' }, HOJE)).toMatchObject({
      grupo: 'encerrados',
      rotulo: 'Cancelado',
      tom: 'danger',
    })
  })

  it('aceita só filtros conhecidos vindos da URL', () => {
    expect(ehFiltroSituacao('vencendo')).toBe(true)
    expect(ehFiltroSituacao('qualquer')).toBe(false)
    expect(ehFiltroSituacao(null)).toBe(false)
  })
})
