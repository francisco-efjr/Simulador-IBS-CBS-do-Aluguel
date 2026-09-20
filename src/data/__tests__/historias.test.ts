import {
  DECISOES_DO_DONO,
  HISTORIAS,
  ORDEM_DAS_COLUNAS,
  colunaDaSituacao,
  epicosDoQuadro,
  historiasFiltradas,
  resumoDoQuadro,
  type ColunaDoQuadro,
  type Historia,
} from '../historias'

/**
 * `historias.json` é derivado à mão de `docs/08-produto/historias-e-cenarios.md`.
 * O auditor confere se ele continua fiel ao documento (verificação
 * `historias-conferem`); estes testes conferem o que o auditor não vê: que o
 * arquivo tem a forma que a tela espera e que a regra de coluna não se perde.
 */

const COLUNAS: ColunaDoQuadro[] = ['a-fazer', 'em-ajuste', 'concluida']

const historia = (partes: Partial<Historia> = {}): Historia => ({
  id: 'H-99',
  titulo: 'Exemplo',
  epico: 'Cadastros',
  persona: 'Helena, sócia-administradora',
  comoQueroPara: 'Como Helena, quero um exemplo, para testar.',
  coluna: 'concluida',
  regras: [],
  backlog: [],
  cenarios: { total: 1, implementados: 1, propostos: 0, lacunas: 0, defeitos: 0 },
  resumo: 'Um exemplo. Serve ao teste.',
  ...partes,
})

describe('historias.json — forma do quadro', () => {
  it('tem histórias', () => {
    expect(HISTORIAS.length).toBeGreaterThan(0)
  })

  it('não repete o código da história (é a chave da lista)', () => {
    const ids = HISTORIAS.map((h) => h.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(HISTORIAS.map((h) => [h.id, h]))(
    '%s traz todo campo obrigatório preenchido',
    (_id, h) => {
      expect(h.id).toMatch(/^H-\d{2}$/)
      expect(h.titulo.trim()).not.toBe('')
      expect(h.epico.trim()).not.toBe('')
      expect(h.persona.trim()).not.toBe('')
      expect(COLUNAS).toContain(h.coluna)
      expect(Array.isArray(h.regras)).toBe(true)
      expect(Array.isArray(h.backlog)).toBe(true)
      expect(h.resumo.trim()).not.toBe('')
    },
  )

  it.each(HISTORIAS.map((h) => [h.id, h]))('%s tem a frase "Como… quero… para…"', (_id, h) => {
    expect(h.comoQueroPara).toMatch(/^Como .+, quero .+, para .+\.$/s)
  })

  it.each(HISTORIAS.map((h) => [h.id, h]))(
    '%s resume em 2 a 4 frases, para o dono ler sem pressa',
    (_id, h) => {
      const frases = h.resumo.split(/(?<=[.!?])\s+/).filter((f) => f.trim())
      expect(frases.length).toBeGreaterThanOrEqual(2)
      expect(frases.length).toBeLessThanOrEqual(4)
    },
  )

  it.each(HISTORIAS.map((h) => [h.id, h]))('%s conta os cenários de forma coerente', (_id, h) => {
    const { total, implementados, propostos, lacunas, defeitos } = h.cenarios
    for (const numero of [total, implementados, propostos, lacunas, defeitos]) {
      expect(Number.isInteger(numero)).toBe(true)
      expect(numero).toBeGreaterThanOrEqual(0)
    }
    // Cada cenário conta uma vez, pela primeira etiqueta.
    expect(implementados + propostos + lacunas).toBe(total)
    // "defeito provável" acompanha um cenário que já foi contado.
    expect(defeitos).toBeLessThanOrEqual(total)
    expect(total).toBeGreaterThan(0)
  })

  it.each(HISTORIAS.map((h) => [h.id, h]))('%s usa IDs no formato do catálogo', (_id, h) => {
    for (const regra of h.regras) expect(regra).toMatch(/^(RN-[A-Z]+-\d+|RT-\d+)$/)
    for (const item of h.backlog) expect(item).toMatch(/^B-\d+[a-z]?$/)
    expect(new Set(h.regras).size).toBe(h.regras.length)
    expect(new Set(h.backlog).size).toBe(h.backlog.length)
  })

  it('toda decisão citada por uma história tem texto para o dono ler', () => {
    const citadas = HISTORIAS.map((h) => h.decisaoPendente).filter(Boolean) as string[]
    expect(citadas.length).toBeGreaterThan(0)
    for (const id of citadas) {
      expect(id).toMatch(/^D-\d{2}$/)
      expect(DECISOES_DO_DONO[id]?.trim()).not.toBe('')
    }
  })

  it('nenhuma história concluída fica esperando decisão ou carrega lacuna', () => {
    for (const h of HISTORIAS.filter((h) => h.coluna === 'concluida')) {
      expect(h.cenarios.lacunas).toBe(0)
      expect(h.cenarios.defeitos).toBe(0)
    }
  })

  it('história "a fazer" não tem cenário que já passe', () => {
    for (const h of HISTORIAS.filter((h) => h.coluna === 'a-fazer')) {
      expect(h.cenarios.implementados).toBe(0)
    }
  })
})

describe('colunaDaSituacao — a regra que põe a história na coluna', () => {
  const semLacuna = { lacunas: 0, defeitos: 0 }

  it('"proposta" vai para A fazer', () => {
    expect(colunaDaSituacao('proposta', semLacuna)).toBe('a-fazer')
    expect(colunaDaSituacao('Proposta', { lacunas: 1, defeitos: 0 })).toBe('a-fazer')
  })

  it('"implementada + proposta" vai para Em ajuste', () => {
    expect(colunaDaSituacao('implementada + proposta', semLacuna)).toBe('em-ajuste')
  })

  it('"implementada" com lacuna ou defeito provável vai para Em ajuste', () => {
    expect(colunaDaSituacao('implementada', { lacunas: 1, defeitos: 0 })).toBe('em-ajuste')
    expect(colunaDaSituacao('implementada, com defeito provável', { lacunas: 0, defeitos: 1 })).toBe(
      'em-ajuste',
    )
  })

  it('"implementada" sem lacuna nem defeito vai para Concluída', () => {
    expect(colunaDaSituacao('implementada', semLacuna)).toBe('concluida')
    expect(colunaDaSituacao('  Implementada  ', semLacuna)).toBe('concluida')
  })

  it('a coluna gravada no JSON é a que a regra manda', () => {
    // A situação do documento não vai para o JSON; o que dá para conferir aqui
    // é a volta: nenhuma coluna contraria a regra pelas contagens.
    for (const h of HISTORIAS) {
      if (h.cenarios.implementados === 0) expect(h.coluna).toBe('a-fazer')
      else if (h.cenarios.lacunas > 0 || h.cenarios.defeitos > 0) expect(h.coluna).toBe('em-ajuste')
    }
  })
})

describe('resumoDoQuadro — as contagens dos cabeçalhos das colunas', () => {
  const quadro: Historia[] = [
    historia({ id: 'H-01', coluna: 'a-fazer', decisaoPendente: 'D-01' }),
    historia({ id: 'H-02', coluna: 'a-fazer' }),
    historia({ id: 'H-03', coluna: 'em-ajuste', epico: 'Contratos' }),
    historia({ id: 'H-04', coluna: 'concluida' }),
  ]

  it('conta por coluna, soma o total e diz o que falta', () => {
    const resumo = resumoDoQuadro(quadro)
    expect(resumo.total).toBe(4)
    expect(resumo.contagem).toEqual({ 'a-fazer': 2, 'em-ajuste': 1, concluida: 1 })
    expect(resumo.falta).toBe(3)
    expect(resumo.comDecisaoPendente).toBe(1)
  })

  it('sem história nenhuma, mostra zeros e não some com a coluna', () => {
    const resumo = resumoDoQuadro([])
    expect(resumo.total).toBe(0)
    expect(resumo.falta).toBe(0)
    expect(Object.keys(resumo.contagem).sort()).toEqual([...ORDEM_DAS_COLUNAS].sort())
  })

  it('confere com o quadro publicado: as colunas somam o total', () => {
    const resumo = resumoDoQuadro()
    const soma = ORDEM_DAS_COLUNAS.reduce((total, coluna) => total + resumo.contagem[coluna], 0)
    expect(soma).toBe(resumo.total)
    expect(resumo.total).toBe(HISTORIAS.length)
  })
})

describe('filtros do quadro', () => {
  const quadro: Historia[] = [
    historia({ id: 'H-01', epico: 'Cadastros', coluna: 'concluida' }),
    historia({ id: 'H-02', epico: 'Cadastros', coluna: 'a-fazer' }),
    historia({ id: 'H-03', epico: 'Contratos', coluna: 'em-ajuste' }),
  ]

  it('lista os épicos na ordem do documento, sem repetir', () => {
    expect(epicosDoQuadro(quadro)).toEqual(['Cadastros', 'Contratos'])
    expect(epicosDoQuadro().length).toBeGreaterThan(1)
  })

  it('sem filtro, mostra tudo', () => {
    expect(historiasFiltradas({ epico: null, soOQueFalta: false }, quadro)).toHaveLength(3)
  })

  it('filtra por épico', () => {
    const so = historiasFiltradas({ epico: 'Cadastros', soOQueFalta: false }, quadro)
    expect(so.map((h) => h.id)).toEqual(['H-01', 'H-02'])
  })

  it('"mostrar só o que falta" tira as concluídas', () => {
    const so = historiasFiltradas({ epico: null, soOQueFalta: true }, quadro)
    expect(so.map((h) => h.id)).toEqual(['H-02', 'H-03'])
  })

  it('os dois filtros valem juntos', () => {
    const so = historiasFiltradas({ epico: 'Cadastros', soOQueFalta: true }, quadro)
    expect(so.map((h) => h.id)).toEqual(['H-02'])
  })
})
