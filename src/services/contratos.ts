import { colecao } from '@/lib/dados/cliente'

export const getContratos = () =>
  colecao('contratos').getFullList({
    sort: '-created',
    expand: 'imovel,inquilino',
  })

export const getContrato = (id: string) =>
  colecao('contratos').getOne(id, { expand: 'imovel,inquilino' })

export const createContrato = (data: Record<string, any> | FormData) =>
  colecao('contratos').create(data)

export const updateContrato = (id: string, data: Record<string, any> | FormData) =>
  colecao('contratos').update(id, data)

export const deleteContrato = (id: string) => colecao('contratos').delete(id)
