import { describe, expect, it } from 'vitest'
import {
  lerValorEmReais,
  mensagemDeValor,
  paraNumeroEmReais,
  valorParaCampo,
} from '../dinheiro'

const ok = (texto: string) => {
  const leitura = lerValorEmReais(texto)
  return leitura.ok ? leitura.valor : leitura.motivo
}

describe('lerValorEmReais', () => {
  it.each([
    ['0', 0],
    ['0,00', 0],
    ['0,01', 0.01],
    ['0.01', 0.01],
    ['1500', 1500],
    ['1500,5', 1500.5],
    ['1234,56', 1234.56],
    ['1234.56', 1234.56],
    ['1.234,56', 1234.56],
    ['R$ 1.234,56', 1234.56],
    ['r$1.234,56', 1234.56],
    ['  1 234,56 ', 1234.56],
    ['9.999.999,99', 9999999.99],
    ['9999999.99', 9999999.99],
    ['1.234', 1234],
    ['12.345.678', 12345678],
    [',5', 0.5],
    ['5,', 5],
  ])('lê %s como %d', (texto, esperado) => {
    expect(ok(texto)).toBe(esperado)
  })

  it('lê valor negativo (quem recusa é a regra do campo, não o leitor)', () => {
    expect(ok('-10')).toBe(-10)
    expect(ok('-1.234,56')).toBe(-1234.56)
    expect(ok('-0')).toBe(0)
    expect(Object.is(paraNumeroEmReais('-0'), -0)).toBe(false)
  })

  it('1234.56 e 1.234,56 dão o mesmo número (CAD-02, FIN-05)', () => {
    expect(paraNumeroEmReais('1234.56')).toBe(paraNumeroEmReais('1.234,56'))
    expect(paraNumeroEmReais('1.234,56')).toBe(1234.56)
  })

  it('recusa vazio, texto e símbolos soltos', () => {
    expect(ok('')).toBe('vazio')
    expect(ok('   ')).toBe('vazio')
    expect(ok('R$')).toBe('vazio')
    expect(ok('abc')).toBe('formato')
    expect(ok('12abc')).toBe('formato')
    expect(ok('1e3')).toBe('formato')
    expect(ok('.')).toBe('formato')
    expect(ok(',')).toBe('formato')
    expect(ok('NaN')).toBe('formato')
    expect(ok('Infinity')).toBe('formato')
  })

  it('recusa 3 casas depois da vírgula em vez de arredondar ou mudar a ordem de grandeza', () => {
    expect(ok('1,234')).toBe('casas')
    expect(ok('10,005')).toBe('casas')
    expect(ok('0.123')).toBe('casas')
    expect(ok('1234.567')).toBe('casas')
    expect(ok('1.234,567')).toBe('casas')
  })

  it('recusa separadores incoerentes (valor inventado)', () => {
    expect(ok('1.2.3,4')).toBe('formato')
    expect(ok('1,2,3')).toBe('formato')
    expect(ok('1,234.56')).toBe('formato')
    expect(ok('12.34.56')).toBe('formato')
    expect(ok('1..234')).toBe('formato')
    expect(ok('1.23,4,5')).toBe('formato')
  })

  it('aceita número já convertido', () => {
    expect(lerValorEmReais(1234.56)).toEqual({ ok: true, valor: 1234.56 })
    expect(lerValorEmReais(Number.NaN).motivo).toBe('formato')
  })

  it('com 0 casas só passa inteiro', () => {
    expect(lerValorEmReais('10', 0)).toEqual({ ok: true, valor: 10 })
    expect(lerValorEmReais('1.000', 0)).toEqual({ ok: true, valor: 1000 })
    expect(lerValorEmReais('10,5', 0).motivo).toBe('casas')
  })
})

describe('paraNumeroEmReais', () => {
  it('devolve NaN para o que não é valor', () => {
    expect(paraNumeroEmReais('abc')).toBeNaN()
    expect(paraNumeroEmReais('')).toBeNaN()
    expect(paraNumeroEmReais(null)).toBeNaN()
    expect(paraNumeroEmReais(undefined)).toBeNaN()
  })
})

describe('valorParaCampo', () => {
  it('escreve do jeito que se digita no Brasil', () => {
    expect(valorParaCampo(1234.56)).toBe('1.234,56')
    expect(valorParaCampo('2800')).toBe('2.800,00')
    expect(valorParaCampo(0)).toBe('0,00')
    expect(valorParaCampo(9999999.99)).toBe('9.999.999,99')
  })

  it('devolve vazio para nulo, vazio e lixo', () => {
    expect(valorParaCampo(null)).toBe('')
    expect(valorParaCampo(undefined)).toBe('')
    expect(valorParaCampo('')).toBe('')
    expect(valorParaCampo('abc')).toBe('')
  })

  it('o que o campo mostra é lido de volta sem mudar de valor', () => {
    for (const n of [0, 0.01, 1234.56, 9999999.99, 1500.5]) {
      expect(paraNumeroEmReais(valorParaCampo(n))).toBe(n)
    }
  })
})

describe('mensagemDeValor', () => {
  it('diz o que corrigir', () => {
    expect(mensagemDeValor('O valor', 'formato')).toMatch(/apenas números/)
    expect(mensagemDeValor('O valor', 'casas')).toMatch(/2 casas depois da vírgula/)
    expect(mensagemDeValor('Quartos', 'casas', 0)).toMatch(/inteiro/)
  })
})
