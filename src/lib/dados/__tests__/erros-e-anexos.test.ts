import { describe, expect, it } from 'vitest'
import { extractFieldErrors, getErrorMessage } from '../erros'
import { ENTIDADES_DE_ANEXO, pastaDoAnexo } from '../esquema'

describe('pastaDoAnexo', () => {
  it('aceita os sete tipos de entidade e devolve o próprio tipo como pasta', () => {
    expect(ENTIDADES_DE_ANEXO).toHaveLength(7)
    for (const tipo of ENTIDADES_DE_ANEXO) expect(pastaDoAnexo(tipo)).toBe(tipo)
  })

  it('recusa o que o banco também recusaria', () => {
    for (const ruim of [undefined, null, '', 'contratos', '../inquilino', 'inquilino/x', 42, new File([], 'x')]) {
      expect(() => pastaDoAnexo(ruim)).toThrow('Tipo de anexo inválido.')
    }
  })
})

describe('recusas do banco que a tela traduz', () => {
  it('unidade de outro imóvel (HA004) cai no campo da unidade', () => {
    const erro = new Error('Falha ao salvar em contratos: Esta unidade não pertence ao imóvel do contrato.')
    expect(extractFieldErrors(erro)).toEqual({ unidade_id: 'Esta unidade não pertence ao imóvel do contrato.' })
  })

  it('unidade já alugada no período (restrição de exclusão) cita a unidade', () => {
    const erro = {
      message:
        'conflicting key value violates exclusion constraint "contratos_um_ativo_por_unidade"',
    }
    expect(extractFieldErrors(erro)).toEqual({
      unidade_id: 'Esta unidade já tem um contrato ativo nesse período.',
    })
  })

  it('imóvel sem unidades segue citando o imóvel', () => {
    const erro = {
      message: 'conflicting key value violates exclusion constraint "contratos_um_ativo_por_imovel"',
    }
    expect(extractFieldErrors(erro)).toEqual({ imovel: 'Este imóvel já tem um contrato ativo nesse período.' })
  })

  it('categoria de tipo errado (HA007), contrato de outro imóvel (HA008) e inquilino (HA009)', () => {
    expect(
      extractFieldErrors(new Error('Falha ao salvar em receitas: Esta categoria é de despesa e não pode ser usada em receitas.')),
    ).toEqual({ categoria: 'Esta categoria é de despesa e não pode ser usada em receitas.' })
    expect(
      extractFieldErrors(
        new Error('Falha ao salvar em receitas: Este contrato é de outro imóvel. Escolha um contrato do imóvel da receita.'),
      ),
    ).toEqual({ contrato: 'Este contrato é de outro imóvel. Escolha um contrato do imóvel da receita.' })
    expect(
      extractFieldErrors(new Error('O inquilino da receita é diferente do inquilino do contrato.')),
    ).toEqual({ inquilino: 'O inquilino da receita é diferente do inquilino do contrato.' })
  })

  it('proteção do administrador (HA005, HA006) vira mensagem, sem campo', () => {
    const eu = new Error('Falha ao salvar em users: Você não pode rebaixar, desativar nem remover a si mesmo.')
    expect(extractFieldErrors(eu)).toEqual({})
    expect(getErrorMessage(eu)).toBe('Você não pode rebaixar, desativar nem remover a si mesmo.')

    const ultimo = new Error(
      'Este é o último administrador ativo e não pode ser rebaixado, desativado nem removido.',
    )
    expect(getErrorMessage(ultimo)).toBe(
      'Este é o último administrador ativo e não pode ser rebaixado, desativado nem removido.',
    )
  })
})
