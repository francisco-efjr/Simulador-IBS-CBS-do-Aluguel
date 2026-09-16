import pb from '@/lib/pocketbase/client'

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

  const filterParts: string[] = []

  if (usuario && usuario !== 'todos') {
    filterParts.push(`usuario = '${usuario.replace(/'/g, "''")}'`)
  }

  if (acao && acao !== 'todas') {
    filterParts.push(`acao = '${acao.replace(/'/g, "''")}'`)
  }

  if (entidade && entidade !== 'todas') {
    filterParts.push(`entidade = '${entidade.replace(/'/g, "''")}'`)
  }

  if (dataInicio) {
    filterParts.push(`created >= '${dataInicio} 00:00:00'`)
  }

  if (dataFim) {
    filterParts.push(`created <= '${dataFim} 23:59:59'`)
  }

  if (search && search.trim()) {
    const s = search.trim().replace(/'/g, "''")
    filterParts.push(`(detalhes ~ '${s}' || acao ~ '${s}' || entidade ~ '${s}')`)
  }

  const filter = filterParts.length > 0 ? filterParts.join(' && ') : ''

  const res = await pb.collection('logs_atividade').getList<LogAtividadeRecord>(page, perPage, {
    filter,
    sort: '-created',
    expand: 'usuario',
    requestKey: null,
  })

  return {
    items: res.items,
    page: res.page,
    perPage: res.perPage,
    totalItems: res.totalItems,
    totalPages: res.totalPages,
  }
}
