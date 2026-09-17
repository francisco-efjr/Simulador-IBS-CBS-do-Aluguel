import { colecao } from '@/lib/dados/cliente'

export const getReceitas = () =>
  colecao('receitas').getFullList({
    sort: '-created',
    expand: 'imovel,contrato,inquilino,categoria',
  })

export const getReceita = (id: string) =>
  colecao('receitas').getOne(id, { expand: 'imovel,contrato,inquilino,categoria' })

export const createReceita = (data: Record<string, any>) => colecao('receitas').create(data)

export const updateReceita = (id: string, data: Record<string, any>) =>
  colecao('receitas').update(id, data)

export const deleteReceita = (id: string) => colecao('receitas').delete(id)
