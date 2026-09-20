import {
  OBJETIVOS,
  progressoDasEntregas,
  resumoCurtoDaSaude,
  resumoDaSaude,
  textoDeHoje,
  type Andamento,
  type Auditoria,
  type Indicador,
} from '../andamento'

/**
 * `objetivos.json` é escrito à mão a partir da documentação de produto
 * (docs/08-produto). Estes testes pegam o erro de digitação antes que ele vire
 * uma tela quebrada — e travam a regra que não pode se perder: indicador sem
 * medição não ganha número inventado.
 */

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/
const SITUACOES = ['no-caminho', 'atencao', 'parado', 'nao-medido']

describe('objetivos.json — objetivo do produto', () => {
  it('tem a frase do objetivo e um prazo válido', () => {
    expect(OBJETIVOS.objetivo.frase.trim()).not.toBe('')
    expect(OBJETIVOS.objetivo.prazo).toMatch(DATA_ISO)
    expect(Number.isNaN(Date.parse(OBJETIVOS.objetivo.prazo))).toBe(false)
    expect(OBJETIVOS.objetivo.prazoPorExtenso.trim()).not.toBe('')
  })

  it('tem pelo menos um indicador', () => {
    expect(OBJETIVOS.indicadores.length).toBeGreaterThan(0)
  })

  it.each(OBJETIVOS.indicadores.map((indicador) => [indicador.nome, indicador]))(
    '"%s" diz como se mede, onde está hoje e a meta',
    (_nome, indicador) => {
      expect(indicador.nome.trim()).not.toBe('')
      expect(indicador.comoSeMede.trim()).not.toBe('')
      expect(indicador.meta.trim()).not.toBe('')
      expect(SITUACOES).toContain(indicador.situacao)
      // Ou existe medição, ou o indicador se declara "nao-medido".
      if (indicador.situacao === 'nao-medido') expect(indicador.hoje).toBeNull()
      else expect(indicador.hoje?.trim()).not.toBe('')
    },
  )

  it('não repete o nome do indicador (é a chave da lista)', () => {
    const nomes = OBJETIVOS.indicadores.map((i) => i.nome)
    expect(new Set(nomes).size).toBe(nomes.length)
  })

  it('tem de 3 a 5 próximos passos, com código do backlog, título e detalhe', () => {
    expect(OBJETIVOS.proximosPassos.length).toBeGreaterThanOrEqual(3)
    expect(OBJETIVOS.proximosPassos.length).toBeLessThanOrEqual(5)
    for (const passo of OBJETIVOS.proximosPassos) {
      expect(passo.codigo).toMatch(/^B-\d+[a-z]?$/)
      expect(passo.titulo.trim()).not.toBe('')
      expect(passo.detalhe.trim()).not.toBe('')
    }
    const codigos = OBJETIVOS.proximosPassos.map((p) => p.codigo)
    expect(new Set(codigos).size).toBe(codigos.length)
  })
})

describe('textoDeHoje — como o indicador aparece na tela', () => {
  const base: Indicador = {
    nome: 'Exemplo',
    comoSeMede: 'Exemplo.',
    hoje: 'Metade dos contratos',
    meta: 'Todos',
    situacao: 'atencao',
  }

  it('mostra o que a documentação afirma', () => {
    expect(textoDeHoje(base)).toBe('Metade dos contratos')
  })

  it('diz "ainda não medido" em vez de inventar número', () => {
    expect(textoDeHoje({ ...base, hoje: null, situacao: 'nao-medido' })).toBe('ainda não medido')
    // Mesmo que alguém marque outra situação, texto vazio não vira número.
    expect(textoDeHoje({ ...base, hoje: '   ' })).toBe('ainda não medido')
  })
})

describe('progressoDasEntregas — a conta que as duas telas mostram', () => {
  const quadro: Andamento = {
    frentes: [
      {
        nome: 'Frente A',
        entregas: [
          { titulo: 'a', detalhe: 'a', situacao: 'pronto' },
          { titulo: 'b', detalhe: 'b', situacao: 'pronto' },
          { titulo: 'c', detalhe: 'c', situacao: 'andamento' },
        ],
      },
      {
        nome: 'Frente B',
        entregas: [{ titulo: 'd', detalhe: 'd', situacao: 'pendente' }],
      },
    ],
    pendencias: { introducao: '', itens: [] },
  }

  it('soma as entregas de todas as frentes', () => {
    const progresso = progressoDasEntregas(quadro)
    expect(progresso.total).toBe(4)
    expect(progresso.contagem).toEqual({ pronto: 2, andamento: 1, pendente: 1 })
    expect(progresso.percentualPronto).toBe(50)
  })

  it('arredonda o percentual para inteiro', () => {
    const tres: Andamento = {
      frentes: [{ nome: 'F', entregas: quadro.frentes[0].entregas }],
      pendencias: { introducao: '', itens: [] },
    }
    expect(progressoDasEntregas(tres).percentualPronto).toBe(67)
  })

  it('sem entrega nenhuma, mostra 0% e não "NaN%"', () => {
    const vazio: Andamento = { frentes: [], pendencias: { introducao: '', itens: [] } }
    const progresso = progressoDasEntregas(vazio)
    expect(progresso.total).toBe(0)
    expect(progresso.percentualPronto).toBe(0)
  })

  it('confere com o quadro publicado', () => {
    const progresso = progressoDasEntregas()
    const soma =
      progresso.contagem.pronto + progresso.contagem.andamento + progresso.contagem.pendente
    expect(soma).toBe(progresso.total)
    expect(progresso.total).toBeGreaterThan(0)
  })
})

describe('resumo da saúde do sistema', () => {
  const auditoria = (situacoes: Auditoria['verificacoes'][number]['situacao'][]): Auditoria => ({
    geradoEm: '2026-09-20T04:16:44.807Z',
    commit: 'abc1234',
    verificacoes: situacoes.map((situacao, indice) => ({
      id: `v${indice}`,
      nome: `Verificação ${indice}`,
      descricao: '',
      situacao,
      detalhe: 'detalhe',
    })),
  })

  it('a frase longa da página pública não mudou', () => {
    expect(resumoDaSaude(auditoria(['ok', 'ok', 'ok']))).toEqual({
      situacao: 'ok',
      frase: 'Tudo em ordem: as 3 conferências automáticas passaram.',
    })
    expect(resumoDaSaude(auditoria(['ok', 'atencao', 'falha']))).toEqual({
      situacao: 'falha',
      frase: '1 de 3 conferências em ordem, 1 pede atenção e 1 precisa de correção.',
    })
    expect(resumoDaSaude(auditoria([]))).toBeNull()
  })

  it('a linha curta da tela Início diz quantas passaram e quando', () => {
    expect(resumoCurtoDaSaude(auditoria(['ok', 'ok', 'ok']))).toEqual({
      situacao: 'ok',
      frase: 'Última conferência automática: 3 de 3 em ordem, em 20 de setembro de 2026.',
    })
  })

  it('a linha curta não esconde o que ficou de fora', () => {
    expect(resumoCurtoDaSaude(auditoria(['ok', 'atencao']))).toEqual({
      situacao: 'atencao',
      frase: 'Última conferência automática: 1 de 2 em ordem, em 20 de setembro de 2026.',
    })
    expect(resumoCurtoDaSaude(auditoria([]))).toBeNull()
  })
})
