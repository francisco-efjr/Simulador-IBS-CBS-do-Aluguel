import pb from '@/lib/pocketbase/client'

export const getImoveis = () => pb.collection('imoveis').getFullList({ sort: '-created' })
export const getImovel = (id: string) => pb.collection('imoveis').getOne(id)
export const createImovel = (data: Record<string, any>) => pb.collection('imoveis').create(data)
export const updateImovel = (id: string, data: Record<string, any> | FormData) =>
  pb.collection('imoveis').update(id, data)
export const deleteImovel = (id: string) => pb.collection('imoveis').delete(id)
