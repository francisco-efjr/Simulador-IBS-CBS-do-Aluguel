import { colecao, type Filtro } from '@/lib/dados/cliente'

export interface LogAtividadeRecord {
  id: string
  usuario?: string
  acao: string
  entidade: string
  detalhes?: string
  created: string
  updated: string
  expand?: {
    usuario?: {
      id: string
      name: string
      email: string
      perfil: string
      avatar?: string
    }
  }
}

export interface GetLogsOptions {
  page?: number
  perPage?: number
  usuario?: string
  acao?: string
  entidade?: string
  dataInicio?: string
  dataFim?: string
  search?: string
}

export interface GetLogsResponse {
  items: LogAtividadeRecord[]
  page: number
  perPage: number
  totalItems: number
  totalPages: number
}

// Valores do enum `acao_auditoria`: não dá para usar `ilike` em enum (erro 42883 no Postgres),
// então a busca por ação compara o termo com os valores e filtra com `in`.
const ACOES_DA_AUDITORIA = ['criou', 'editou', 'excluiu'] as const

/**
 * Filtro "ou" da busca livre: texto em `detalhes` e `entidade` (colunas de texto) e, se o
 * termo lembrar uma ação ("criou", "edit"), as linhas dessa ação. O termo vai escapado:
 * vírgula e parêntese são separadores na sintaxe do PostgREST e quebrariam a consulta.
 */
export function montarBuscaLivre(search?: string | null): string | undefined {
  const termo = search
    ?.trim()
    .replace(/[,()*]/g, ' ')
    .trim()
  if (!termo) return undefined
  const partes = [`detalhes.ilike.*${termo}*`, `entidade.ilike.*${termo}*`]
  const minusculo = termo.toLowerCase()
  const acoes = ACOES_DA_AUDITORIA.filter((a) => a.includes(minusculo))
  if (acoes.length > 0) partes.push(`acao.in.(${acoes.join(',')})`)
  return partes.join(',')
}

/**
 * Busca logs com filtros e ordenação decrescente por created
 */
export async function getLogsAtividade(options: GetLogsOptions = {}): Promise<GetLogsResponse> {
  const { page = 1, perPage = 25, usuario, acao, entidade, dataInicio, dataFim, search } = options

  const where: Filtro[] = []

  if (usuario && usuario !== 'todos') where.push(['usuario', '=', usuario])
  if (acao && acao !== 'todas') where.push(['acao', '=', acao])
  if (entidade && entidade !== 'todas') where.push(['entidade', '=', entidade])
  if (dataInicio) where.push(['created', '>=', `${dataInicio}T00:00:00`])
  if (dataFim) where.push(['created', '<=', `${dataFim}T23:59:59`])

  const ou = montarBuscaLivre(search)

  return colecao('logs_atividade').getList<LogAtividadeRecord>(page, perPage, {
    where,
    ou,
    sort: '-created',
    expand: 'usuario',
  })
}
