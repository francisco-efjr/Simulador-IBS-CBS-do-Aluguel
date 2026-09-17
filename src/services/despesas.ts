import { colecao } from '@/lib/dados/cliente'

export const getDespesas = () =>
  colecao('despesas').getFullList({
    sort: '-created',
    expand: 'imovel,fornecedor,categoria',
  })

export const getDespesa = (id: string) =>
  colecao('despesas').getOne(id, { expand: 'imovel,fornecedor,categoria' })

export const createDespesa = (data: Record<string, any>) => colecao('despesas').create(data)

export const updateDespesa = (id: string, data: Record<string, any>) =>
  colecao('despesas').update(id, data)

export const deleteDespesa = (id: string) => colecao('despesas').delete(id)
