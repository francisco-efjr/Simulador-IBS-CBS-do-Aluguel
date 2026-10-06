import { type OpcoesDeLista, colecao } from '@/lib/dados/cliente'
import { supabase } from '@/lib/dados/supabase'
import type { Imovel } from './imoveis'
import type { ImovelUnidade } from './unidades'
import type { Locador } from './locadores'
import type { Fiador } from './fiadores'

export interface Contrato {
  id: string
  numero?: string | null
  imovel: string
  unidade_id?: string | null
  locador_id?: string | null
  fiador_id?: string | null
  inquilino: string
  data_inicio: string
  data_fim: string
  valor_aluguel: number
  dia_vencimento?: number | null
  indice_reajuste?: string | null
  periodicidade_reajuste?: string | null
  proxima_data_reajuste?: string | null
  tipo_garantia?: string | null
  valor_garantia?: number | null
  status: 'ativo' | 'encerrado' | 'cancelado'
  observacoes?: string | null
  documento?: string | null
  created?: string
  updated?: string
  created_by?: string | null
  updated_by?: string | null
  expand?: {
    imovel?: Imovel
    inquilino?: Record<string, unknown>
    unidade_id?: ImovelUnidade
    locador_id?: Locador
    fiador_id?: Fiador
    [chave: string]: unknown
  }
}

export type DadosContrato = Partial<Omit<Contrato, 'id' | 'created' | 'updated'>>

const EXPAND_PADRAO = 'imovel,inquilino,unidade_id,locador_id,fiador_id'

export const getContratos = (opcoes?: OpcoesDeLista) =>
  colecao('contratos').getFullList<Contrato>({
    sort: '-created',
    expand: EXPAND_PADRAO,
    ...opcoes,
  })

export const getContrato = (id: string, opcoes?: OpcoesDeLista) =>
  colecao('contratos').getOne<Contrato>(id, {
    expand: EXPAND_PADRAO,
    ...opcoes,
  })

export const createContrato = (data: DadosContrato | FormData | Record<string, unknown>) =>
  colecao('contratos').create<Contrato>(data)

export const updateContrato = (
  id: string,
  data: DadosContrato | FormData | Record<string, unknown>,
) => colecao('contratos').update<Contrato>(id, data)

export const deleteContrato = (id: string) => colecao('contratos').delete(id)

/**
 * Consulta o próximo número sequencial de contrato para o ano informado no formato 001/AAAA.
 * Chama a função RPC segura public.proximo_numero_contrato no banco.
 */
export async function obterProximoNumeroContrato(ano?: number): Promise<string> {
  const anoAlvo = ano ?? new Date().getFullYear()
  const { data, error } = await supabase.rpc('proximo_numero_contrato', { p_ano: anoAlvo })
  if (error || !data) {
    return `001/${anoAlvo}`
  }
  return String(data)
}
