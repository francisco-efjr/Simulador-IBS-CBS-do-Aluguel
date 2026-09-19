import {
  ANDAMENTO,
  AUDITORIA,
  FEED,
  dataDaUltimaAtualizacao,
  formatarDataPorExtenso,
  formatarMomentoBrasilia,
} from '../andamento'

/**
 * Os JSONs da página pública são editados à mão. Estes testes pegam o erro de
 * digitação antes que ele vire uma tela quebrada em produção.
 */

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/

describe('feed.json — Últimas atualizações', () => {
  it('tem pelo menos uma entrada', () => {
    expect(FEED.length).toBeGreaterThan(0)
  })

  it.each(FEED.map((entrada) => [entrada.titulo, entrada]))(
    '"%s" tem data, título, texto e tipo válidos',
    (_titulo, entrada) => {
      expect(entrada.data).toMatch(DATA_ISO)
      expect(Number.isNaN(Date.parse(entrada.data))).toBe(false)
      expect(entrada.titulo.trim()).not.toBe('')
      expect(entrada.texto.trim()).not.toBe('')
      expect(['entrega', 'correcao', 'seguranca', 'infra']).toContain(entrada.tipo)
      if (entrada.referencia !== undefined) expect(entrada.referencia).toMatch(/^PR #\d+$/)
    },
  )

  it('está do mais recente para o mais antigo', () => {
    const datas = FEED.map((entrada) => entrada.data)
    expect(datas).toEqual([...datas].sort().reverse())
  })
})

describe('andamento.json — quadro de entregas', () => {
  it('toda entrega tem situação conhecida e texto', () => {
    for (const frente of ANDAMENTO.frentes) {
      expect(frente.entregas.length).toBeGreaterThan(0)
      for (const entrega of frente.entregas) {
        expect(['pronto', 'andamento', 'pendente']).toContain(entrega.situacao)
        expect(entrega.titulo.trim()).not.toBe('')
        expect(entrega.detalhe.trim()).not.toBe('')
      }
    }
  })

  it('não repete título dentro da mesma frente (é a chave da lista)', () => {
    for (const frente of ANDAMENTO.frentes) {
      const titulos = frente.entregas.map((e) => e.titulo)
      expect(new Set(titulos).size).toBe(titulos.length)
    }
  })
})

describe('auditoria.json — saúde do sistema', () => {
  it('tem o formato que a tela espera', () => {
    expect(Number.isNaN(Date.parse(AUDITORIA.geradoEm))).toBe(false)
    for (const verificacao of AUDITORIA.verificacoes) {
      expect(['ok', 'atencao', 'falha']).toContain(verificacao.situacao)
      expect(verificacao.nome.trim()).not.toBe('')
      expect(verificacao.detalhe.trim()).not.toBe('')
    }
  })
})

describe('formatação de datas', () => {
  it('escreve a data por extenso sem depender do fuso de quem abre', () => {
    expect(formatarDataPorExtenso('2026-09-01')).toBe('1 de setembro de 2026')
    expect(formatarDataPorExtenso('2026-12-31')).toBe('31 de dezembro de 2026')
  })

  it('mostra o momento da verificação no horário de Brasília', () => {
    expect(formatarMomentoBrasilia('2026-09-19T15:14:00.000Z')).toBe(
      '19 de setembro de 2026, às 12:14',
    )
    expect(formatarMomentoBrasilia('2026-09-20T02:30:00.000Z')).toBe(
      '19 de setembro de 2026, às 23:30',
    )
  })

  it('"Atualizado em" é a data da novidade mais recente', () => {
    expect(
      dataDaUltimaAtualizacao([
        { data: '2026-09-02', titulo: 'a', texto: 'a', tipo: 'entrega' },
        { data: '2026-09-18', titulo: 'b', texto: 'b', tipo: 'correcao' },
      ]),
    ).toBe('2026-09-18')
    expect(dataDaUltimaAtualizacao([])).toBeNull()
  })
})
