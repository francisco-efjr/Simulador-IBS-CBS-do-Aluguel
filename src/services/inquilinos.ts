import { colecao } from '@/lib/dados/cliente'

export const getInquilinos = () => colecao('inquilinos').getFullList({ sort: '-created' })
export const getInquilino = (id: string) => colecao('inquilinos').getOne(id)
export const createInquilino = (data: Record<string, any>) => colecao('inquilinos').create(data)
export const updateInquilino = (id: string, data: Record<string, any>) =>
  colecao('inquilinos').update(id, data)
export const deleteInquilino = (id: string) => colecao('inquilinos').delete(id)
