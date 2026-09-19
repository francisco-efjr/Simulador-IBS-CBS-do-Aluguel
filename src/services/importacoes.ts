import { colecao, type Filtro } from '@/lib/dados/cliente'
import { supabase } from '@/lib/dados/supabase'
import type { ContaBancaria } from './contas-bancarias'

export interface Importacao {
  id: string
  conta_bancaria: string
  arquivo_nome: string
  formato: 'csv' | 'ofx'
  data_importacao: string
  total_transacoes: number
  transacoes_classificadas: number
  transacoes_ignoradas: number
  status: 'pendente' | 'concluida' | 'parcial'
  created?: string
  updated?: string
  expand?: {
    conta_bancaria?: ContaBancaria
  }
}

export interface TransacaoImportada {
  id: string
  importacao: string
  data: string
  descricao: string
  valor: number
  tipo: 'credito' | 'debito'
  saldo?: number
  classificada: boolean
  ignorada: boolean
  duplicata_detectada?: boolean
  duplicata_ids?: string[]
  sugestao_categoria?: string
  sugestao_categoria_id?: string
  sugestao_imovel?: string
  sugestao_imovel_id?: string
  sugestao_tipo?: 'receita' | 'despesa'
  sugestao_confianca?: number
  sugestao_origem?: string
  categoria_classificada?: string
  imovel_classificado?: string
  receita_gerada?: string
  despesa_gerada?: string
  created?: string
  updated?: string
  expand?: {
    importacao?: Importacao
  }
}

export const getImportacoes = () =>
  colecao('importacoes').getFullList<Importacao>({
    sort: '-created',
    expand: 'conta_bancaria',
  })

export const getImportacao = (id: string) =>
  colecao('importacoes').getOne<Importacao>(id, {
    expand: 'conta_bancaria',
  })

export const createImportacao = (data: Partial<Importacao>) =>
  colecao('importacoes').create<Importacao>(data)

/** Teto de linhas por chamada; o mesmo número está em importar_extrato, no banco. */
export const LIMITE_TRANSACOES_POR_IMPORTACAO = 5000

/** Cabeçalho do lote: data, contadores e status são decididos pelo banco. */
export type NovaImportacao = Pick<Importacao, 'conta_bancaria' | 'arquivo_nome' | 'formato'>

/** O que o motor do navegador sabe de cada linha: dado do extrato, duplicata e sugestão. */
export type NovaTransacaoImportada = Pick<
  TransacaoImportada,
  | 'data'
  | 'descricao'
  | 'valor'
  | 'tipo'
  | 'saldo'
  | 'duplicata_detectada'
  | 'duplicata_ids'
  | 'sugestao_tipo'
  | 'sugestao_categoria'
  | 'sugestao_categoria_id'
  | 'sugestao_imovel'
  | 'sugestao_imovel_id'
  | 'sugestao_confianca'
>

/**
 * Grava a importação e todas as suas transações de uma vez só.
 *
 * Antes eram 1 + N requisições, e uma queda de conexão no meio deixava uma
 * importação pela metade. A função `importar_extrato` roda tudo numa única
 * transação do Postgres, com a RLS de quem chama: ou o lote inteiro entra, ou
 * nada entra. Devolve o id da importação criada.
 *
 * O erro sai como veio do banco; quem chama traduz com `getErrorMessage`.
 */
export async function importarExtrato(
  importacao: NovaImportacao,
  transacoes: NovaTransacaoImportada[],
): Promise<string> {
  const { data, error } = await supabase.rpc('importar_extrato', {
    p_importacao: importacao,
    p_transacoes: transacoes,
  })

  if (error) throw new Error(error.message)
  if (typeof data !== 'string') {
    throw new Error('A importação foi enviada, mas o banco não devolveu o número dela.')
  }
  return data
}

export const updateImportacao = (id: string, data: Partial<Importacao>) =>
  colecao('importacoes').update<Importacao>(id, data)

// As transações do lote caem junto: a chave estrangeira é ON DELETE CASCADE,
// então a limpeza é do banco e não de um laço no navegador que pode parar no meio.
export const deleteImportacao = (id: string) => colecao('importacoes').delete(id)

export const getTransacoesImportadas = (importacaoId?: string, onlyUnclassified = false) => {
  const where: Filtro[] = []
  if (importacaoId) where.push(['importacao', '=', importacaoId])
  if (onlyUnclassified) where.push(['classificada', '=', false], ['ignorada', '=', false])

  return colecao('transacoes_importadas').getFullList<TransacaoImportada>({
    where,
    sort: '-data,created',
    expand: 'importacao.conta_bancaria',
  })
}

export const getHistoricoTransacoesClassificadas = () =>
  colecao('transacoes_importadas').getFullList<TransacaoImportada>({
    where: [['classificada', '=', true]],
    sort: '-created',
  })

export const getAllTransacoesImportadas = () =>
  colecao('transacoes_importadas').getFullList<TransacaoImportada>({
    sort: '-data',
  })

export const createTransacaoImportada = (data: Partial<TransacaoImportada>) =>
  colecao('transacoes_importadas').create<TransacaoImportada>(data)

export const updateTransacaoImportada = (id: string, data: Partial<TransacaoImportada>) =>
  colecao('transacoes_importadas').update<TransacaoImportada>(id, data)

export const deleteTransacaoImportada = (id: string) => colecao('transacoes_importadas').delete(id)
