import { type OpcoesDeLista, colecao } from '@/lib/dados/cliente'

export interface Locador {
  id: string
  nome_razao_social: string
  tipo_pessoa: 'pf' | 'pj'
  cpf_cnpj?: string | null
  email?: string | null
  telefone?: string | null
  dados_bancarios?: string | null
  status: 'ativo' | 'inativo'
  created_by?: string | null
  updated_by?: string | null
  created?: string
  updated?: string
  expand?: Record<string, unknown>
}

export type DadosLocador = Partial<Omit<Locador, 'id' | 'created' | 'updated'>>

/** Lista todos os locadores com ordenação por nome/razão social. */
export const getLocadores = (opcoes?: OpcoesDeLista) =>
  colecao('locadores').getFullList<Locador>({
    sort: 'nome_razao_social',
    ...opcoes,
  })

/** Busca um locador pelo identificador único. */
export const getLocadorById = (id: string) => colecao('locadores').getOne<Locador>(id)

/** Alias de getLocadorById para compatibilidade com o padrão dos demais serviços. */
export const getLocador = getLocadorById

/** Cadastra um novo proprietário / locador. */
export const createLocador = (data: DadosLocador | FormData | Record<string, unknown>) =>
  colecao('locadores').create<Locador>(data)

/** Atualiza os dados de um locador existente. */
export const updateLocador = (
  id: string,
  data: DadosLocador | FormData | Record<string, unknown>,
) => colecao('locadores').update<Locador>(id, data)

/** Inativa o locador preservando histórico financeiro e contratual. */
export const inactivateLocador = (id: string) =>
  colecao('locadores').update<Locador>(id, { status: 'inativo' })

/** Exclui fisicamente o locador quando não houver contratos ou vínculos restritivos. */
export const deleteLocador = (id: string) => colecao('locadores').delete(id)
