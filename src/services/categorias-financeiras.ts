import { colecao } from '@/lib/dados/cliente'

export const getCategoriasFinanceiras = () =>
  colecao('categorias_financeiras').getFullList({ sort: 'nome' })

export const getCategoriasReceita = () =>
  colecao('categorias_financeiras').getFullList({
    where: [
      ['tipo', '=', 'receita'],
      ['status', '=', 'ativo'],
    ],
    sort: 'nome',
  })

export const getCategoriasDespesa = () =>
  colecao('categorias_financeiras').getFullList({
    where: [
      ['tipo', '=', 'despesa'],
      ['status', '=', 'ativo'],
    ],
    sort: 'nome',
  })

export const getCategoriaFinanceira = (id: string) => colecao('categorias_financeiras').getOne(id)

export const createCategoriaFinanceira = (data: Record<string, any>) =>
  colecao('categorias_financeiras').create(data)

export const updateCategoriaFinanceira = (id: string, data: Record<string, any>) =>
  colecao('categorias_financeiras').update(id, data)

export const deleteCategoriaFinanceira = (id: string) =>
  colecao('categorias_financeiras').delete(id)
