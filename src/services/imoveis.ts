import { type OpcoesDeLista, colecao } from '@/lib/dados/cliente'
import { supabase } from '@/lib/dados/supabase'

export interface Imovel {
  id: string
  codigo?: string | null
  nome?: string | null
  tipo?: string | null
  status: 'vago' | 'alugado' | 'em_manutencao' | 'inativo'
  endereco: string
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cep?: string | null
  cidade?: string | null
  estado?: string | null
  matricula?: string | null
  cib?: string | null
  iptus?: string[]
  valor_imovel?: number | null
  inscricao_imobiliaria?: string | null
  area?: number | null
  quartos?: number | null
  banheiros?: number | null
  vagas?: number | null
  valor_estimado?: number | null
  observacoes?: string | null
  inquilino_atual?: string | null
  fotos?: string[]
  created?: string
  updated?: string
  created_by?: string | null
  updated_by?: string | null
  expand?: Record<string, unknown>
}

export type DadosImovel = Partial<Omit<Imovel, 'id' | 'created' | 'updated'>>

export const getImoveis = (opcoes?: OpcoesDeLista) =>
  colecao('imoveis').getFullList<Imovel>({ sort: '-created', ...opcoes })

export const getImovel = (id: string) => colecao('imoveis').getOne<Imovel>(id)

export const createImovel = (data: DadosImovel | FormData | Record<string, unknown>) =>
  colecao('imoveis').create<Imovel>(data)

export const updateImovel = (
  id: string,
  data: DadosImovel | FormData | Record<string, unknown>,
) => colecao('imoveis').update<Imovel>(id, data)

export const deleteImovel = (id: string) => colecao('imoveis').delete(id)

/**
 * Conta a quantidade de imóveis ativos do usuário corrente.
 * Utilizado para validação do limite comercial de até 3 imóveis ativos (HA003).
 */
export async function contarImoveisAtivos(): Promise<number> {
  const { count, error } = await supabase
    .from('imoveis')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'inativo')

  if (error) {
    throw error
  }
  return count ?? 0
}
