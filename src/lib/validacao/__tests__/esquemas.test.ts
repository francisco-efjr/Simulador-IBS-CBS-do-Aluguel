import { describe, expect, it } from 'vitest'
import {
  contratoSchema,
  despesaSchema,
  emailValido,
  fornecedorSchema,
  imovelSchema,
  inquilinoSchema,
  iptuTaxaSchema,
  receitaSchema,
  validarFormulario,
} from '../esquemas'

const CPF = '529.982.247-25'
const CNPJ = '11.222.333/0001-81'

describe('validarFormulario', () => {
  it('devolve objeto vazio quando está tudo certo', () => {
    expect(validarFormulario(imovelSchema, { endereco: 'Rua A' })).toEqual({})
  })

  it('devolve uma mensagem por campo, indexada pelo nome da coluna', () => {
    const erros = validarFormulario(imovelSchema, { endereco: '', area: '-1' })
    expect(Object.keys(erros).sort()).toEqual(['area', 'endereco'])
    expect(erros.endereco).toMatch(/endereço/i)
  })

  it('trata nulo e campo ausente como vazio, sem erro de tipo', () => {
    expect(validarFormulario(imovelSchema, { endereco: 'Rua A', area: null })).toEqual({})
  })
})

describe('emailValido', () => {
  it.each(['ana@exemplo.com', 'jose.silva+aluguel@empresa.com.br'])('aceita %s', (e) => {
    expect(emailValido(e)).toBe(true)
  })

  it.each(['ana', 'ana@', 'ana@exemplo', '@exemplo.com', 'ana @exemplo.com', 'ana@@exemplo.com'])(
    'recusa %s',
    (e) => {
      expect(emailValido(e)).toBe(false)
    },
  )
})

describe('imovelSchema', () => {
  it('exige endereço (not null no banco), inclusive quando só tem espaços', () => {
    expect(validarFormulario(imovelSchema, { endereco: '   ' }).endereco).toBeDefined()
  })

  it('aceita valores zero e deixa os opcionais em branco', () => {
    expect(
      validarFormulario(imovelSchema, {
        endereco: 'Rua A',
        area: '0',
        quartos: '0',
        banheiros: '0',
        vagas: '0',
        valor_estimado: '0',
        estado: '',
      }),
    ).toEqual({})
  })

  it('recusa valor estimado negativo', () => {
    expect(
      validarFormulario(imovelSchema, { endereco: 'Rua A', valor_estimado: '-0.01' })
        .valor_estimado,
    ).toMatch(/negativo/)
  })

  it('recusa quantidade negativa ou fracionada', () => {
    const erros = validarFormulario(imovelSchema, {
      endereco: 'Rua A',
      quartos: '-1',
      banheiros: '1.5',
    })
    expect(erros.quartos).toMatch(/negativo/)
    expect(erros.banheiros).toMatch(/inteiro/)
  })

  it('exige a sigla do estado com duas letras', () => {
    expect(validarFormulario(imovelSchema, { endereco: 'Rua A', estado: 'SP' })).toEqual({})
    expect(validarFormulario(imovelSchema, { endereco: 'Rua A', estado: 'S' }).estado).toBeDefined()
    expect(validarFormulario(imovelSchema, { endereco: 'Rua A', estado: '12' }).estado).toBeDefined()
  })

  it('recusa valor acima do que cabe em numeric(14,2)', () => {
    expect(
      validarFormulario(imovelSchema, { endereco: 'Rua A', valor_estimado: '1000000000000' })
        .valor_estimado,
    ).toMatch(/limite/)
  })
})

describe('inquilinoSchema', () => {
  it('pessoa física: exige nome e CPF válido', () => {
    expect(validarFormulario(inquilinoSchema, { tipo_pessoa: 'pf', nome: 'Ana', cpf: CPF })).toEqual(
      {},
    )
    const erros = validarFormulario(inquilinoSchema, { tipo_pessoa: 'pf', nome: '', cpf: '' })
    expect(erros.nome).toMatch(/nome/)
    expect(erros.cpf).toMatch(/Informe o CPF/)
  })

  it('pessoa física: recusa CPF com dígito errado ou sequência repetida', () => {
    expect(
      validarFormulario(inquilinoSchema, { tipo_pessoa: 'pf', nome: 'Ana', cpf: '111.111.111-11' })
        .cpf,
    ).toMatch(/não é válido/)
    expect(
      validarFormulario(inquilinoSchema, { tipo_pessoa: 'pf', nome: 'Ana', cpf: '529.982.247-24' })
        .cpf,
    ).toMatch(/não é válido/)
  })

  it('pessoa jurídica: exige razão social e CNPJ válido, e ignora o campo de CPF', () => {
    expect(
      validarFormulario(inquilinoSchema, { tipo_pessoa: 'pj', nome: 'ACME', cnpj: CNPJ, cpf: 'x' }),
    ).toEqual({})
    const erros = validarFormulario(inquilinoSchema, { tipo_pessoa: 'pj', nome: '', cnpj: '123' })
    expect(erros.nome).toMatch(/razão social/)
    expect(erros.cnpj).toMatch(/não é válido/)
  })

  it('e-mail é opcional, mas precisa ter formato válido quando informado', () => {
    const base = { tipo_pessoa: 'pf', nome: 'Ana', cpf: CPF }
    expect(validarFormulario(inquilinoSchema, { ...base, email: '' })).toEqual({})
    expect(validarFormulario(inquilinoSchema, { ...base, email: 'ana@exemplo' }).email).toMatch(
      /e-mail/,
    )
  })

  it('mostra o erro do documento junto com o do e-mail, sem esperar um ser corrigido', () => {
    const erros = validarFormulario(inquilinoSchema, {
      tipo_pessoa: 'pf',
      nome: 'Ana',
      cpf: '123',
      email: 'errado',
    })
    expect(Object.keys(erros).sort()).toEqual(['cpf', 'email'])
  })
})

describe('fornecedorSchema', () => {
  it('exige só o nome', () => {
    expect(validarFormulario(fornecedorSchema, { nome: 'Encanador' })).toEqual({})
    expect(validarFormulario(fornecedorSchema, { nome: ' ' }).nome).toBeDefined()
  })

  it('aceita CPF ou CNPJ válidos, com ou sem máscara', () => {
    for (const doc of [CPF, '52998224725', CNPJ, '11222333000181']) {
      expect(validarFormulario(fornecedorSchema, { nome: 'X', cnpj_cpf: doc })).toEqual({})
    }
  })

  it('recusa documento inválido ou de tamanho errado', () => {
    for (const doc of ['111.111.111-11', '00.000.000/0000-00', '12345']) {
      expect(validarFormulario(fornecedorSchema, { nome: 'X', cnpj_cpf: doc }).cnpj_cpf).toMatch(
        /não é válido/,
      )
    }
  })

  it('recusa e-mail sem domínio', () => {
    expect(validarFormulario(fornecedorSchema, { nome: 'X', email: 'x@' }).email).toBeDefined()
  })
})

describe('contratoSchema', () => {
  const valido = {
    imovel: 'im1',
    inquilino: 'iq1',
    data_inicio: '2025-01-01',
    data_fim: '2026-01-01',
    valor_aluguel: '1500',
    dia_vencimento: '10',
  }

  it('aceita o contrato completo', () => {
    expect(validarFormulario(contratoSchema, valido)).toEqual({})
  })

  it('exige imóvel, inquilino, datas e valor do aluguel', () => {
    const erros = validarFormulario(contratoSchema, {})
    expect(Object.keys(erros).sort()).toEqual(
      ['data_fim', 'data_inicio', 'imovel', 'inquilino', 'valor_aluguel'].sort(),
    )
  })

  it('aceita término no mesmo dia do início (data fim ≥ data início)', () => {
    expect(
      validarFormulario(contratoSchema, { ...valido, data_fim: valido.data_inicio }),
    ).toEqual({})
  })

  it('recusa término antes do início, com o erro no campo de término', () => {
    const erros = validarFormulario(contratoSchema, { ...valido, data_fim: '2024-12-31' })
    expect(erros).toEqual({ data_fim: expect.stringMatching(/anterior/) })
  })

  it('compara só a data quando o banco devolve data com hora', () => {
    expect(
      validarFormulario(contratoSchema, {
        ...valido,
        data_inicio: '2025-01-01 00:00:00.000Z',
        data_fim: '2025-01-01',
      }),
    ).toEqual({})
  })

  it('recusa término antes do início mesmo quando outro campo também tem erro', () => {
    const erros = validarFormulario(contratoSchema, {
      ...valido,
      valor_aluguel: '-1',
      data_fim: '2024-12-31',
    })
    expect(Object.keys(erros).sort()).toEqual(['data_fim', 'valor_aluguel'])
  })

  it.each(['1', '31'])('aceita dia de vencimento %s', (d) => {
    expect(validarFormulario(contratoSchema, { ...valido, dia_vencimento: d })).toEqual({})
  })

  it.each(['0', '32', '-5', '10.5', 'dez'])('recusa dia de vencimento %s', (d) => {
    expect(
      validarFormulario(contratoSchema, { ...valido, dia_vencimento: d }).dia_vencimento,
    ).toBeDefined()
  })

  it('dia de vencimento é opcional', () => {
    expect(validarFormulario(contratoSchema, { ...valido, dia_vencimento: '' })).toEqual({})
  })

  it('aceita aluguel zero e recusa aluguel ou garantia negativos', () => {
    expect(validarFormulario(contratoSchema, { ...valido, valor_aluguel: '0' })).toEqual({})
    const erros = validarFormulario(contratoSchema, {
      ...valido,
      valor_aluguel: '-100',
      valor_garantia: '-1',
    })
    expect(erros.valor_aluguel).toMatch(/negativo/)
    expect(erros.valor_garantia).toMatch(/negativo/)
  })

  it('entende valor digitado à brasileira (1.500,50)', () => {
    expect(validarFormulario(contratoSchema, { ...valido, valor_aluguel: '1.500,50' })).toEqual({})
  })
})

describe('receitaSchema', () => {
  const valida = {
    imovel: 'im1',
    categoria: 'cat1',
    data_vencimento: '2025-06-10',
    valor_previsto: '1500',
  }

  it('aceita a receita mínima', () => {
    expect(validarFormulario(receitaSchema, valida)).toEqual({})
  })

  it('exige imóvel, categoria, vencimento e valor previsto', () => {
    expect(Object.keys(validarFormulario(receitaSchema, {})).sort()).toEqual(
      ['categoria', 'data_vencimento', 'imovel', 'valor_previsto'].sort(),
    )
  })

  it('recusa valores negativos', () => {
    const erros = validarFormulario(receitaSchema, {
      ...valida,
      valor_previsto: '-1',
      valor_recebido: '-1',
    })
    expect(erros.valor_previsto).toMatch(/negativo/)
    expect(erros.valor_recebido).toMatch(/negativo/)
  })

  it.each(['2025-06', '1999-12'])('aceita a competência %s', (c) => {
    expect(validarFormulario(receitaSchema, { ...valida, competencia: c })).toEqual({})
  })

  it.each(['2025-13', '2025-00', '06/2025', '2025-6'])('recusa a competência %s', (c) => {
    expect(validarFormulario(receitaSchema, { ...valida, competencia: c }).competencia).toMatch(
      /ano e mês/,
    )
  })
})

describe('despesaSchema', () => {
  it('exige só o imóvel (not null no banco)', () => {
    expect(validarFormulario(despesaSchema, { imovel: 'im1' })).toEqual({})
    expect(validarFormulario(despesaSchema, {})).toEqual({ imovel: expect.any(String) })
  })

  it('recusa valor, valor previsto e valor pago negativos', () => {
    const erros = validarFormulario(despesaSchema, {
      imovel: 'im1',
      valor: '-1',
      valor_previsto: '-2',
      valor_pago: '-3',
    })
    expect(Object.keys(erros).sort()).toEqual(['valor', 'valor_pago', 'valor_previsto'])
  })

  it('recusa texto no lugar do valor', () => {
    expect(validarFormulario(despesaSchema, { imovel: 'im1', valor: 'abc' }).valor).toMatch(
      /apenas números/,
    )
  })
})

describe('iptuTaxaSchema', () => {
  const valida = {
    imovel: 'im1',
    descricao: 'IPTU 2025',
    vencimento: '2025-03-10',
    valor: '800',
  }

  it('aceita a obrigação mínima', () => {
    expect(validarFormulario(iptuTaxaSchema, valida)).toEqual({})
  })

  it('exige imóvel, descrição, vencimento e valor', () => {
    expect(Object.keys(validarFormulario(iptuTaxaSchema, {})).sort()).toEqual(
      ['descricao', 'imovel', 'valor', 'vencimento'].sort(),
    )
  })

  it('recusa valor negativo', () => {
    expect(validarFormulario(iptuTaxaSchema, { ...valida, valor: '-800' }).valor).toMatch(
      /negativo/,
    )
  })

  it.each(['1900', '2025', '2200'])('aceita o ano de referência %s', (ano) => {
    expect(validarFormulario(iptuTaxaSchema, { ...valida, ano_referencia: ano })).toEqual({})
  })

  it.each(['1899', '2201', '25', '2025.5'])('recusa o ano de referência %s', (ano) => {
    expect(
      validarFormulario(iptuTaxaSchema, { ...valida, ano_referencia: ano }).ano_referencia,
    ).toBeDefined()
  })
})
