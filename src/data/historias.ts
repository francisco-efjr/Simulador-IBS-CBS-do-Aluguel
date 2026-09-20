import historiasJson from './historias.json'

/**
 * As histórias de usuário do produto, mostradas no "Quadro de histórias" da
 * página pública (`/`).
 *
 * O conteúdo mora em `historias.json` e é **derivado da documentação de
 * produto**: `docs/08-produto/historias-e-cenarios.md` (uma entrada por
 * `### H-NN`, com a frase "Como… quero… para…", as regras, o item de backlog e
 * a contagem de cenários por etiqueta) e `docs/08-produto/backlog.md` (as
 * decisões D-01 a D-06). Quem mudar o documento mexe aqui no mesmo PR: o
 * auditor tem uma conferência (`historias-conferem`) que reprova a divergência
 * — ver docs/07-auditor.md.
 *
 * O quadro é **só leitura**: ninguém arrasta cartão. A coluna de cada história
 * vem da coluna "Situação" da tabela "Checagem INVEST" do documento, pela
 * regra de `colunaDaSituacao()`.
 */

/** Em que coluna do quadro a história aparece. */
export type ColunaDoQuadro = 'a-fazer' | 'em-ajuste' | 'concluida'

/**
 * Quantos cenários de aceitação a história tem, por etiqueta do documento.
 *
 * Cada cenário conta **uma vez**, pela primeira etiqueta — a mesma regra da
 * tabela "Totais" do documento. Por isso `total` é a soma de `implementados`,
 * `propostos` e `lacunas`. Já `defeitos` conta à parte os cenários que também
 * trazem `@defeito-provavel`: é um achado a confirmar, não uma quarta pilha.
 */
export interface ContagemDeCenarios {
  total: number
  implementados: number
  propostos: number
  lacunas: number
  defeitos: number
}

export interface Historia {
  /** Código da história no documento, ex.: "H-07". */
  id: string
  titulo: string
  /** Épico: o título `##` sob o qual a história está no documento. */
  epico: string
  /** Quem quer, com o papel por extenso: "Helena, sócia-administradora". */
  persona: string
  /** A frase inteira "Como… quero… para…". */
  comoQueroPara: string
  coluna: ColunaDoQuadro
  /** IDs das regras de negócio ligadas, ex.: ["RN-CTR-03"]. */
  regras: string[]
  /** IDs dos itens de backlog ligados, ex.: ["B-14"]. */
  backlog: string[]
  cenarios: ContagemDeCenarios
  /** O que a história entrega e, quando houver, o que ainda falta. */
  resumo: string
  /** ID da decisão do dono que a história espera, ex.: "D-01". */
  decisaoPendente?: string
}

export const HISTORIAS = historiasJson as Historia[]

/**
 * As decisões que dependem do dono, do
 * [backlog](../../docs/08-produto/backlog.md#decisões-pendentes-do-dono).
 * Ficam aqui, e não no JSON das histórias, porque uma mesma decisão trava mais
 * de uma história.
 */
export const DECISOES_DO_DONO: Record<string, string> = {
  'D-01':
    'Quando o contrato começa depois do dia de vencimento, o primeiro aluguel é proporcional aos dias ou vira um mês cheio no mês seguinte?',
  'D-02':
    'Quando o índice do ano fecha negativo, o aluguel cai junto ou fica como está até o próximo aniversário?',
  'D-03':
    'Quais modalidades de garantia ficam na lista: mantemos o título de capitalização e acrescentamos a cessão fiduciária de quotas de fundo?',
  'D-04':
    'A multa da saída antecipada é contada por mês cumprido ou por dia, e com qual percentual quando o contrato não disser?',
  'D-05':
    'O sócio vê só os painéis e relatórios ou também as telas de origem, em leitura, para os painéis não saírem vazios?',
  'D-06':
    'Quais índices de reajuste o sistema aceita: IGP-M, IPCA, INPC e IVAR, mais a opção "sem reajuste por índice"?',
}

/** A ordem em que as colunas aparecem no quadro, da esquerda para a direita. */
export const ORDEM_DAS_COLUNAS: ColunaDoQuadro[] = ['a-fazer', 'em-ajuste', 'concluida']

/**
 * Em que coluna cai uma história, a partir da coluna "Situação" da tabela
 * "Checagem INVEST" e das etiquetas dos seus cenários:
 *
 * - "proposta" → **A fazer**: nada disso funciona ainda;
 * - "implementada" com `@lacuna` ou `@defeito-provavel`, ou "implementada +
 *   proposta" → **Em ajuste**: funciona, mas falta acertar alguma coisa;
 * - "implementada" sem lacuna nem defeito → **Concluída**.
 *
 * Fica aqui, e não só na cabeça de quem escreve o JSON, para o teste poder
 * conferir a regra e para o auditor apontar a divergência.
 */
export function colunaDaSituacao(
  situacao: string,
  cenarios: Pick<ContagemDeCenarios, 'lacunas' | 'defeitos'>,
): ColunaDoQuadro {
  const texto = situacao.trim().toLowerCase()
  if (texto.startsWith('proposta')) return 'a-fazer'
  if (texto.includes('proposta')) return 'em-ajuste'
  if (cenarios.lacunas > 0 || cenarios.defeitos > 0) return 'em-ajuste'
  return 'concluida'
}

export interface ResumoDoQuadro {
  total: number
  contagem: Record<ColunaDoQuadro, number>
  /** Histórias que não estão em "Concluída": o que ainda falta. */
  falta: number
  /** Quantas esperam uma decisão do dono. */
  comDecisaoPendente: number
}

/** Quantas histórias há em cada coluna, para os cabeçalhos e a linha do total. */
export function resumoDoQuadro(historias: Historia[] = HISTORIAS): ResumoDoQuadro {
  const contagem: Record<ColunaDoQuadro, number> = {
    'a-fazer': 0,
    'em-ajuste': 0,
    concluida: 0,
  }
  for (const historia of historias) contagem[historia.coluna] += 1
  return {
    total: historias.length,
    contagem,
    falta: contagem['a-fazer'] + contagem['em-ajuste'],
    comDecisaoPendente: historias.filter((h) => h.decisaoPendente).length,
  }
}

/** Os épicos na ordem em que aparecem no documento, sem repetir. */
export function epicosDoQuadro(historias: Historia[] = HISTORIAS): string[] {
  return [...new Set(historias.map((historia) => historia.epico))]
}

/**
 * As histórias que o quadro mostra, na ordem do código (H-01, H-02, …), depois
 * dos dois filtros da tela: o épico escolhido e o "mostrar só o que falta".
 */
export function historiasFiltradas(
  { epico, soOQueFalta }: { epico: string | null; soOQueFalta: boolean },
  historias: Historia[] = HISTORIAS,
): Historia[] {
  return historias.filter(
    (historia) =>
      (epico === null || historia.epico === epico) &&
      (!soOQueFalta || historia.coluna !== 'concluida'),
  )
}
