import { describe, expect, it } from 'vitest'
import {
  COLUNAS_DO_QUADRO,
  LIMITE_DE_CONCLUIDAS,
  codigoDaHistoria,
  contagemDeAtividades,
  destinosPermitidos,
  etiquetasDoQuadro,
  historiasDaColuna,
  type AtividadeDaHistoria,
  type ColunaDoQuadro,
  type HistoriaDoQuadro,
} from '../quadro'
import { tipoDaLinha } from '@/components/produto/CriteriosEmBdd'

const atividade = (concluida: boolean): AtividadeDaHistoria => ({
  id: crypto.randomUUID(),
  historia: 'h',
  titulo: 'Atividade',
  concluida,
  ordem: 1,
})

describe('codigoDaHistoria', () => {
  it.each([
    [7, 'H-07'],
    [24, 'H-24'],
    [120, 'H-120'],
  ])('%i vira %s, como na documentação', (numero, codigo) => {
    expect(codigoDaHistoria(numero)).toBe(codigo)
  })
})

describe('destinosPermitidos — espelho da RN-QDR-02', () => {
  it('as colunas são cinco, na ordem do quadro', () => {
    expect(COLUNAS_DO_QUADRO).toEqual(['backlog', 'desenvolvimento', 'teste', 'homologacao', 'concluido'])
  })

  it.each(['backlog', 'desenvolvimento', 'teste'] as const)(
    'de %s não se vai direto para Concluído',
    (de) => {
      expect(destinosPermitidos(de)).not.toContain('concluido')
      expect(destinosPermitidos(de)).toContain('homologacao')
    },
  )

  it('da Homologação se vai para Concluído, ou se volta', () => {
    expect(destinosPermitidos('homologacao')).toEqual(['backlog', 'desenvolvimento', 'teste', 'concluido'])
  })

  it('do Concluído se pode reabrir, mas não "ir" para Concluído de novo', () => {
    expect(destinosPermitidos('concluido')).toEqual(['backlog', 'desenvolvimento', 'teste', 'homologacao'])
  })
})

const historia = (numero: number, coluna: ColunaDoQuadro, updated: string): HistoriaDoQuadro => ({
  id: `h${numero}`,
  numero,
  titulo: `História ${numero}`,
  tag: null,
  eu: '',
  quero: '',
  para: '',
  criterios: '',
  observacoes: '',
  coluna,
  updated,
  atividades: [],
})

describe('historiasDaColuna', () => {
  const quadro = [
    historia(9, 'teste', '2026-09-20T10:00:00Z'),
    historia(3, 'teste', '2026-09-23T10:00:00Z'),
    historia(7, 'concluido', '2026-09-21T10:00:00Z'),
    historia(2, 'concluido', '2026-09-23T15:00:00Z'),
    historia(5, 'concluido', '2026-09-22T08:00:00Z'),
    historia(1, 'backlog', '2026-09-23T10:00:00Z'),
  ]

  it('nas colunas de trabalho, pelo número', () => {
    expect(historiasDaColuna(quadro, 'teste').map((h) => h.numero)).toEqual([3, 9])
  })

  it('em Concluído, a aceita por último vem primeiro', () => {
    expect(historiasDaColuna(quadro, 'concluido').map((h) => h.numero)).toEqual([2, 5, 7])
  })

  it('não mistura colunas nem mexe na lista de origem', () => {
    const antes = quadro.map((h) => h.numero)
    expect(historiasDaColuna(quadro, 'homologacao')).toEqual([])
    historiasDaColuna(quadro, 'concluido')
    expect(quadro.map((h) => h.numero)).toEqual(antes)
  })

  it('Concluído mostra 15 antes do "Mostrar mais"', () => {
    expect(LIMITE_DE_CONCLUIDAS).toBe(15)
  })
})

describe('contagemDeAtividades', () => {
  it('conta feitas e total', () => {
    expect(contagemDeAtividades([atividade(true), atividade(false), atividade(true)])).toEqual({
      feitas: 2,
      total: 3,
    })
  })

  it('sem atividades, zero de zero', () => {
    expect(contagemDeAtividades([])).toEqual({ feitas: 0, total: 0 })
  })
})

describe('etiquetasDoQuadro', () => {
  it('sem repetir, sem vazias, em ordem alfabética', () => {
    expect(
      etiquetasDoQuadro([
        { tag: 'Financeiro' },
        { tag: 'Cadastros' },
        { tag: ' Financeiro ' },
        { tag: null },
        { tag: '' },
        { tag: 'Acessibilidade' },
      ]),
    ).toEqual(['Acessibilidade', 'Cadastros', 'Financeiro'])
  })
})

describe('tipoDaLinha — destaque dos critérios em BDD', () => {
  it.each([
    ['Funcionalidade: Inativar imóvel', 'titulo'],
    ['  Esquema do Cenário: Conferência do CPF', 'titulo'],
    ['  Cenário: Inativar imóvel sem contrato ativo', 'titulo'],
    ['    Exemplos:', 'titulo'],
    ['    Dado que Helena está no sistema', 'passo'],
    ['    Quando Helena escolhe "Inativar"', 'passo'],
    ['    Então aparece a mensagem', 'passo'],
    ['    E a trilha registra', 'passo'],
    ['    Mas nenhuma mensagem é mostrada', 'passo'],
    ['  @implementado', 'etiqueta'],
    ['  @proposto @decisao-pendente', 'etiqueta'],
    ['# language: pt', 'comentario'],
    ['      | cpf | resultado |', 'tabela'],
    ['  Imóvel com contrato em vigor não pode sair das listas', 'texto'],
    ['    Esta linha começa com "Esta", não com "E"', 'texto'],
  ])('%s → %s', (linha, tipo) => {
    expect(tipoDaLinha(linha)).toBe(tipo)
  })
})
