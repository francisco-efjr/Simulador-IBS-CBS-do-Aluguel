import { afterEach, describe, expect, it, vi } from 'vitest'
import { descreverPrazo, modeloDaMinuta, prazoDoContrato } from '../minuta'

describe('modeloDaMinuta (CAD-06)', () => {
  it('segue a garantia do contrato', () => {
    expect(modeloDaMinuta({ tipo_garantia: 'fiador' })).toBe('residencial_fiador')
    expect(modeloDaMinuta({ tipo_garantia: 'caução' })).toBe('residencial_caucao')
    expect(modeloDaMinuta({ tipo_garantia: 'caucao' })).toBe('residencial_caucao')
    expect(modeloDaMinuta({ tipo_garantia: 'sem garantia' })).toBe('residencial_sem_garantia')
    expect(modeloDaMinuta({ tipo_garantia: 'seguro-fiança' })).toBe('residencial_sem_garantia')
    expect(modeloDaMinuta({ tipo_garantia: 'outros' })).toBe('residencial_sem_garantia')
  })

  it('sem contrato ou sem garantia informada não inventa caução nem fiador', () => {
    expect(modeloDaMinuta(null)).toBe('residencial_sem_garantia')
    expect(modeloDaMinuta({ tipo_garantia: null })).toBe('residencial_sem_garantia')
    expect(modeloDaMinuta({})).toBe('residencial_sem_garantia')
  })

  it('imóvel ou unidade comercial abre nos modelos comerciais', () => {
    expect(modeloDaMinuta({ tipo_garantia: 'fiador' }, { tipo: 'sala_comercial' })).toBe(
      'comercial_fiador',
    )
    expect(modeloDaMinuta({ tipo_garantia: 'caução' }, { tipo: 'loja' })).toBe('comercial_caucao')
    expect(modeloDaMinuta({ tipo_garantia: 'fiador' }, { tipo: 'apartamento' }, { tipo_unidade: 'sala' })).toBe(
      'comercial_fiador',
    )
    expect(modeloDaMinuta({ tipo_garantia: 'fiador' }, { tipo: 'casa' })).toBe('residencial_fiador')
  })
})

describe('prazo do contrato (CAD-08)', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('01/03/2070 a 28/02/2071 são 12 meses em qualquer fuso', () => {
    for (const fuso of ['UTC', 'America/Sao_Paulo', 'Pacific/Auckland', 'America/Los_Angeles']) {
      vi.stubEnv('TZ', fuso)
      expect(descreverPrazo('2070-03-01', '2071-02-28')).toBe('12 meses')
    }
  })

  it.each([
    ['2026-01-01', '2026-12-31', '12 meses'],
    ['2026-01-15', '2027-01-14', '12 meses'],
    ['2026-01-01', '2028-12-31', '36 meses'],
    ['2026-01-01', '2026-01-31', '1 mês'],
    ['2026-01-01', '2026-01-15', '15 dias'],
    ['2026-01-01', '2026-01-01', '1 dia'],
    ['2026-01-01', '2026-07-10', '6 meses e 10 dias'],
    ['2026-01-01', '2026-07-01', '6 meses e 1 dia'],
    ['2026-01-31', '2026-03-30', '2 meses'],
    ['2026-01-31', '2026-02-27', '28 dias'],
    ['2026-03-01T00:00:00.000Z', '2027-02-28 00:00:00', '12 meses'],
  ])('%s a %s: %s', (inicio, fim, esperado) => {
    expect(descreverPrazo(inicio, fim)).toBe(esperado)
  })

  it('sem datas ou com término antes do início não inventa prazo', () => {
    expect(descreverPrazo('', '2026-12-31')).toBe('')
    expect(descreverPrazo(null, null)).toBe('')
    expect(descreverPrazo('2026-12-31', '2026-01-01')).toBe('')
    expect(prazoDoContrato('lixo', '2026-01-01')).toBeNull()
  })
})
