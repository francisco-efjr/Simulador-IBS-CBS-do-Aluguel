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

  // A busca livre varre os três campos de texto. O termo vai escapado: vírgula
  // e parêntese são separadores na sintaxe do PostgREST e quebrariam a consulta.
  const termo = search
    ?.trim()
    .replace(/[,()*]/g, ' ')
    .trim()
  const ou = termo
    ? `detalhes.ilike.*${termo}*,acao.ilike.*${termo}*,entidade.ilike.*${termo}*`
    : undefined

  return colecao('logs_atividade').getList<LogAtividadeRecord>(page, perPage, {
    where,
    ou,
    sort: '-created',
    expand: 'usuario',
  })
}
