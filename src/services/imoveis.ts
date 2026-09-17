import { colecao } from '@/lib/dados/cliente'

export const getImoveis = () => colecao('imoveis').getFullList({ sort: '-created' })
export const getImovel = (id: string) => colecao('imoveis').getOne(id)
export const createImovel = (data: Record<string, any>) => colecao('imoveis').create(data)
export const updateImovel = (id: string, data: Record<string, any> | FormData) =>
  colecao('imoveis').update(id, data)
export const deleteImovel = (id: string) => colecao('imoveis').delete(id)
