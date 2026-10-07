import { describe, expect, it } from 'vitest'
import {
  contratoSchema,
  despesaSchema,
  imovelSchema,
  iptuTaxaSchema,
  receitaSchema,
  unidadeSchema,
  validarFormulario,
} from '../esquemas'

// Valores digitados à brasileira passam em todos os formulários com dinheiro (CAD-02, FIN-05).
const contrato = {
  imovel: 'im1',
  inquilino: 'iq1',
  data_inicio: '2026-01-01',
  data_fim: '2027-01-01',
  valor_aluguel: '1.234,56',
}

describe('dinheiro nos esquemas', () => {
  it.each(['1.234,56', '1234,56', '1234.56', 'R$ 1.234,56', '0', '0,01', '9.999.999,99'])(
    'contrato aceita valor do aluguel %s',
    (v) => {
      expect(validarFormulario(contratoSchema, { ...contrato, valor_aluguel: v })).toEqual({})
    },
  )

  it.each(['abc', '1,234', '1.2.3,4', '-5'])('contrato recusa valor do aluguel %s', (v) => {
    expect(validarFormulario(contratoSchema, { ...contrato, valor_aluguel: v }).valor_aluguel).toBeDefined()
  })

  it('a mensagem de 3 casas diz o que fazer', () => {
    expect(validarFormulario(contratoSchema, { ...contrato, valor_aluguel: '1,234' }).valor_aluguel).toMatch(
      /2 casas depois da vírgula/,
    )
  })

  it('receita, despesa, IPTU e imóvel entendem 1.234,56', () => {
    expect(
      validarFormulario(receitaSchema, {
        imovel: 'im1',
        categoria: 'c1',
        competencia: '2026-10',
        data_vencimento: '2026-10-10',
        valor_previsto: '1.234,56',
        valor_recebido: '1234.56',
      }),
    ).toEqual({})
    expect(validarFormulario(despesaSchema, { valor: '1.234,56' }).valor).toBeUndefined()
    expect(validarFormulario(iptuTaxaSchema, { valor: '1.234,56' }).valor).toBeUndefined()
    expect(validarFormulario(imovelSchema, { valor_imovel: '1.234.567,89' }).valor_imovel).toBeUndefined()
    expect(validarFormulario(unidadeSchema, { taxa_poco: '30,00' }).taxa_poco).toBeUndefined()
  })
})

describe('garantia por fiador (CAD-04)', () => {
  it('recusa garantia por fiador sem fiador', () => {
    const erros = validarFormulario(contratoSchema, { ...contrato, tipo_garantia: 'fiador' })
    expect(erros.fiador_id).toMatch(/fiador/)
  })

  it('aceita garantia por fiador com fiador escolhido', () => {
    expect(
      validarFormulario(contratoSchema, { ...contrato, tipo_garantia: 'fiador', fiador_id: 'f1' }),
    ).toEqual({})
  })

  it('outros tipos de garantia não pedem fiador', () => {
    for (const tipo of ['caução', 'sem garantia', 'seguro-fiança']) {
      expect(validarFormulario(contratoSchema, { ...contrato, tipo_garantia: tipo })).toEqual({})
    }
  })
})

