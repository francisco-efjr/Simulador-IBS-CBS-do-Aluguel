import { describe, expect, it } from 'vitest'
import { entregaDoMomento, resumoDasFrentes, type Andamento } from '../andamento'

const base = (...situacoes: Array<'pronto' | 'andamento' | 'pendente'>): Andamento => ({
  frentes: [
    {
      nome: 'Frente',
      entregas: situacoes.map((situacao, i) => ({
        titulo: `Entrega ${i + 1}`,
        detalhe: 'x',
        situacao,
      })),
    },
  ],
  pendencias: { introducao: '', itens: [] },
})

describe('resumoDasFrentes', () => {
  it('frente com tudo pronto é "pronta"', () => {
    expect(resumoDasFrentes(base('pronto', 'pronto'))[0]).toMatchObject({
      situacao: 'pronta',
      prontas: 2,
      total: 2,
    })
  })

  it('frente com parte pronta e parte pendente está em andamento', () => {
    expect(resumoDasFrentes(base('pronto', 'pendente'))[0].situacao).toBe('andamento')
    expect(resumoDasFrentes(base('andamento', 'pendente'))[0].situacao).toBe('andamento')
  })

  it('frente sem nada pronto nem em andamento é "a seguir"', () => {
    expect(resumoDasFrentes(base('pendente', 'pendente'))[0].situacao).toBe('a-seguir')
  })
})

describe('entregaDoMomento', () => {
  it('prefere a entrega em andamento', () => {
    expect(entregaDoMomento(base('pendente', 'andamento'))).toEqual({
      tipo: 'agora',
      titulo: 'Entrega 2',
    })
  })

  it('sem nada em andamento, aponta a primeira pendente', () => {
    expect(entregaDoMomento(base('pronto', 'pendente'))).toEqual({
      tipo: 'a-seguir',
      titulo: 'Entrega 2',
    })
  })

  it('sem pendência, devolve null', () => {
    expect(entregaDoMomento(base('pronto'))).toBeNull()
  })
})
