import { describe, expect, it } from 'vitest'
import { semAcento, termoDeBusca } from '../busca'

describe('busca sem acento', () => {
  it('"joao" acha "João" e "pao quente" acha "Pão Quente"', () => {
    expect(semAcento('PIX RECEBIDO JOÃO da Silva').includes(termoDeBusca('joao'))).toBe(true)
    expect(semAcento('Padaria Pão Quente').includes(termoDeBusca('pao quente'))).toBe(true)
  })

  it('o contrário também vale: digitar com acento acha texto sem acento', () => {
    expect(semAcento('Condominio').includes(termoDeBusca('Condomínio'))).toBe(true)
  })

  it('ignora espaços nas pontas e aceita vazio/nulo', () => {
    expect(termoDeBusca('  Conceição ')).toBe('conceicao')
    expect(semAcento(null)).toBe('')
    expect(semAcento(undefined)).toBe('')
  })
})
