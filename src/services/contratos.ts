import pb from '@/lib/pocketbase/client'

export const getContratos = () =>
  pb.collection('contratos').getFullList({
    sort: '-created',
    expand: 'imovel,inquilino',
  })

export const getContrato = (id: string) =>
  pb.collection('contratos').getOne(id, { expand: 'imovel,inquilino' })

export const createContrato = (data: Record<string, any> | FormData) =>
  pb.collection('contratos').create(data)

export const updateContrato = (id: string, data: Record<string, any> | FormData) =>
  pb.collection('contratos').update(id, data)

export const deleteContrato = (id: string) => pb.collection('contratos').delete(id)
