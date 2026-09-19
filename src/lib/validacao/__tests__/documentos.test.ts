import { describe, expect, it } from 'vitest'
import { cnpjValido, cpfOuCnpjValido, cpfValido, limparDocumento } from '../documentos'

describe('limparDocumento', () => {
  it('tira pontos, barra, hífen e espaços', () => {
    expect(limparDocumento(' 12.345.678/0001-95 ')).toBe('12345678000195')
  })

  it('passa letras para maiúsculas (CNPJ alfanumérico)', () => {
    expect(limparDocumento('12.abc.345/01de-35')).toBe('12ABC34501DE35')
  })
})

describe('cpfValido', () => {
  it.each(['529.982.247-25', '52998224725', '111.444.777-35', '123.456.789-09', ' 529 982 247 25 '])(
    'aceita %s',
    (cpf) => {
      expect(cpfValido(cpf)).toBe(true)
    },
  )

  it.each([
    ['primeiro dígito errado', '529.982.247-35'],
    ['segundo dígito errado', '529.982.247-26'],
    ['curto', '529.982.247-2'],
    ['longo', '529.982.247-251'],
    ['com letra', '529.982.247-2X'],
    ['com outro separador', '529,982,247-25'],
  ])('recusa CPF %s', (_caso, cpf) => {
    expect(cpfValido(cpf)).toBe(false)
  })

  it.each(['000.000.000-00', '111.111.111-11', '222.222.222-22', '999.999.999-99', '55555555555'])(
    'recusa a sequência repetida %s',
    (cpf) => {
      expect(cpfValido(cpf)).toBe(false)
    },
  )

  it.each([null, undefined, '', '   '])('recusa vazio (%s)', (cpf) => {
    expect(cpfValido(cpf)).toBe(false)
  })
})

describe('cnpjValido', () => {
  it.each(['11.222.333/0001-81', '11222333000181', '12.345.678/0001-95', '04.252.011/0001-10'])(
    'aceita %s',
    (cnpj) => {
      expect(cnpjValido(cnpj)).toBe(true)
    },
  )

  it('aceita o CNPJ alfanumérico (exemplo oficial da Receita Federal)', () => {
    expect(cnpjValido('12.ABC.345/01DE-35')).toBe(true)
    expect(cnpjValido('12abc34501de35')).toBe(true)
  })

  it.each([
    ['primeiro dígito errado', '11.222.333/0001-91'],
    ['segundo dígito errado', '11.222.333/0001-82'],
    ['curto', '11.222.333/0001-8'],
    ['longo', '11.222.333/0001-811'],
    ['letra no dígito verificador', '12.ABC.345/01DE-3A'],
    ['alfanumérico com dígito errado', '12.ABC.345/01DE-36'],
    ['caractere especial', '11.222.333/0001-8#'],
  ])('recusa CNPJ %s', (_caso, cnpj) => {
    expect(cnpjValido(cnpj)).toBe(false)
  })

  it.each(['00.000.000/0000-00', '11.111.111/1111-11', '99999999999999'])(
    'recusa a sequência repetida %s',
    (cnpj) => {
      expect(cnpjValido(cnpj)).toBe(false)
    },
  )

  it.each([null, undefined, ''])('recusa vazio (%s)', (cnpj) => {
    expect(cnpjValido(cnpj)).toBe(false)
  })
})

describe('cpfOuCnpjValido', () => {
  it('confere como CPF quando tem 11 caracteres', () => {
    expect(cpfOuCnpjValido('529.982.247-25')).toBe(true)
    expect(cpfOuCnpjValido('111.111.111-11')).toBe(false)
  })

  it('confere como CNPJ quando tem 14 caracteres', () => {
    expect(cpfOuCnpjValido('11.222.333/0001-81')).toBe(true)
    expect(cpfOuCnpjValido('11.222.333/0001-80')).toBe(false)
  })

  it('recusa qualquer outro tamanho', () => {
    expect(cpfOuCnpjValido('1234567890')).toBe(false)
    expect(cpfOuCnpjValido('123456789012')).toBe(false)
    expect(cpfOuCnpjValido('')).toBe(false)
  })
})
