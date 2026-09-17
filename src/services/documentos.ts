import { colecao } from '@/lib/dados/cliente'

export const getDocumentos = (entidadeTipo: string, entidadeId: string) =>
  colecao('documentos_anexos').getFullList({
    where: [
      ['entidade_tipo', '=', entidadeTipo],
      ['entidade_id', '=', entidadeId],
    ],
    sort: '-created',
  })

export const createDocumento = (data: FormData) => colecao('documentos_anexos').create(data)
export const deleteDocumento = (id: string) => colecao('documentos_anexos').delete(id)
