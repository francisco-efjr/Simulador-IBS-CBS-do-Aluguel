import pb from '@/lib/pocketbase/client'

export const getDocumentos = (entidadeTipo: string, entidadeId: string) =>
  pb.collection('documentos_anexos').getFullList({
    filter: `entidade_tipo = "${entidadeTipo}" && entidade_id = "${entidadeId}"`,
    sort: '-created',
  })

export const createDocumento = (data: FormData) => pb.collection('documentos_anexos').create(data)
export const deleteDocumento = (id: string) => pb.collection('documentos_anexos').delete(id)
