import { type OpcoesDeLista, colecao } from '@/lib/dados/cliente'

export interface ImovelUnidade {
  id: string
  imovel_id: string
  identificador: string
  complemento?: string | null
  tipo_unidade: string
  codigo_energia?: string | null
  codigo_agua?: string | null
  tem_condominio: boolean
  valor_condominio?: number | null
  taxas_extras?: number | null
  taxa_poco?: number | null
  status: 'vago' | 'alugado' | 'em_manutencao' | 'inativo'
  inquilino_atual?: string | null
  created_by?: string | null
  updated_by?: string | null
  created?: string
  updated?: string
  expand?: {
    imovel_id?: Record<string, unknown>
    inquilino_atual?: Record<string, unknown>
    [chave: string]: unknown
  }
}

export type DadosUnidade = Partial<Omit<ImovelUnidade, 'id' | 'created' | 'updated'>>

/** Lista todas as unidades cadastradas no sistema. */
export const getUnidades = (opcoes?: OpcoesDeLista) =>
  colecao('imovel_unidades').getFullList<ImovelUnidade>({
    sort: 'identificador',
    expand: 'inquilino_atual',
    ...opcoes,
  })

/** Lista as unidades pertencentes a um imóvel macro específico. */
export const getUnidadesPorImovel = (imovelId: string, opcoes?: OpcoesDeLista) =>
  colecao('imovel_unidades').getFullList<ImovelUnidade>({
    where: [['imovel_id', '=', imovelId]],
    sort: 'identificador',
    expand: 'inquilino_atual',
    ...opcoes,
  })

/** Busca uma unidade pelo seu ID. */
export const getUnidadeById = (id: string) =>
  colecao('imovel_unidades').getOne<ImovelUnidade>(id, {
    expand: 'imovel_id,inquilino_atual',
  })

/** Alias de getUnidadeById para conformidade com a convenção do sistema. */
export const getUnidade = getUnidadeById

/** Cria uma nova unidade filha vinculada a um imóvel macro. */
export const createUnidade = (data: DadosUnidade | FormData | Record<string, unknown>) =>
  colecao('imovel_unidades').create<ImovelUnidade>(data)

/** Atualiza dados e valores de taxas de uma unidade. */
export const updateUnidade = (
  id: string,
  data: DadosUnidade | FormData | Record<string, unknown>,
) => colecao('imovel_unidades').update<ImovelUnidade>(id, data)

/** Inativa a unidade (o gatilho do banco impede se houver contrato ativo). */
export const inactivateUnidade = (id: string) =>
  colecao('imovel_unidades').update<ImovelUnidade>(id, { status: 'inativo' })

/** Remove uma unidade (sujeito a restrições de chave estrangeira). */
export const deleteUnidade = (id: string) => colecao('imovel_unidades').delete(id)
