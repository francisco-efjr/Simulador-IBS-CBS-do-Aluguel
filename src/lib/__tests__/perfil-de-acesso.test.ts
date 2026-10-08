import { describe, expect, it } from 'vitest'
import { MODULES_LIST, MODULOS_DO_GRATUITO, nivelDoPerfil, type ModuloPermissao } from '../constants'

const TODOS: ModuloPermissao[] = [
  'imoveis',
  'inquilinos',
  'locadores',
  'fornecedores',
  'contratos',
  'receitas',
  'despesas',
  'iptu_taxas',
  'dashboards',
  'alertas',
  'relatorios',
  'importar_extrato',
  'classificar_transacoes',
  'quadro',
]

describe('perfil de acesso', () => {
  it('administrador edita todos os módulos, sem exceção', () => {
    expect(TODOS.every((m) => nivelDoPerfil('administrador', m) === 'edicao')).toBe(true)
  })

  it('gratuito edita Imóveis, Inquilinos, Locadores e fiadores e Contratos — e nada mais', () => {
    const comAcesso = TODOS.filter((m) => nivelDoPerfil('gratuito', m) !== 'sem_acesso')
    expect(comAcesso).toEqual(['imoveis', 'inquilinos', 'locadores', 'contratos'])
    expect(comAcesso.every((m) => nivelDoPerfil('gratuito', m) === 'edicao')).toBe(true)
    expect([...MODULOS_DO_GRATUITO].sort()).toEqual([...comAcesso].sort())
  })

  it('o menu do gratuito tem só Início e os quatro módulos', () => {
    const visiveis = MODULES_LIST.filter(
      (item) => !item.adminOnly && (!item.modulo || nivelDoPerfil('gratuito', item.modulo) !== 'sem_acesso'),
    ).map((item) => item.title)
    expect(visiveis).toEqual(['Início', 'Imóveis', 'Inquilinos', 'Locadores e fiadores', 'Contratos'])
  })
})
