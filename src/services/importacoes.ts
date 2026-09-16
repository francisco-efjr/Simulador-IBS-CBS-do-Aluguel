import pb from '@/lib/pocketbase/client'
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
  pb.collection('importacoes').getFullList<Importacao>({
    sort: '-created',
    expand: 'conta_bancaria',
  })

export const getImportacao = (id: string) =>
  pb.collection('importacoes').getOne<Importacao>(id, {
    expand: 'conta_bancaria',
  })

export const createImportacao = (data: Partial<Importacao>) =>
  pb.collection('importacoes').create<Importacao>(data)

export const updateImportacao = (id: string, data: Partial<Importacao>) =>
  pb.collection('importacoes').update<Importacao>(id, data)

export const deleteImportacao = async (id: string) => {
  // Cascading cleanup of associated transactions
  try {
    const trans = await pb.collection('transacoes_importadas').getFullList({
      filter: `importacao = "${id}"`,
      fields: 'id',
    })
    for (const t of trans) {
      await pb
        .collection('transacoes_importadas')
        .delete(t.id)
        .catch(() => {})
    }
  } catch {
    /* intentionally ignored */
  }
  return pb.collection('importacoes').delete(id)
}

export const getTransacoesImportadas = (importacaoId?: string, onlyUnclassified = false) => {
  const filters: string[] = []
  if (importacaoId) filters.push(`importacao = "${importacaoId}"`)
  if (onlyUnclassified) filters.push(`classificada = false && ignorada = false`)

  return pb.collection('transacoes_importadas').getFullList<TransacaoImportada>({
    filter: filters.join(' && '),
    sort: '-data,created',
    expand: 'importacao.conta_bancaria',
  })
}

export const getHistoricoTransacoesClassificadas = () =>
  pb.collection('transacoes_importadas').getFullList<TransacaoImportada>({
    filter: 'classificada = true',
    sort: '-created',
  })

export const getAllTransacoesImportadas = () =>
  pb.collection('transacoes_importadas').getFullList<TransacaoImportada>({
    sort: '-data',
  })

export const createTransacaoImportada = (data: Partial<TransacaoImportada>) =>
  pb.collection('transacoes_importadas').create<TransacaoImportada>(data)

export const updateTransacaoImportada = (id: string, data: Partial<TransacaoImportada>) =>
  pb.collection('transacoes_importadas').update<TransacaoImportada>(id, data)

export const deleteTransacaoImportada = (id: string) =>
  pb.collection('transacoes_importadas').delete(id)
