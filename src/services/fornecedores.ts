import { colecao } from '@/lib/dados/cliente'

export const getFornecedores = () => colecao('fornecedores').getFullList({ sort: '-created' })
export const getFornecedor = (id: string) => colecao('fornecedores').getOne(id)
export const createFornecedor = (data: Record<string, any>) => colecao('fornecedores').create(data)
export const updateFornecedor = (id: string, data: Record<string, any>) =>
  colecao('fornecedores').update(id, data)
export const deleteFornecedor = (id: string) => colecao('fornecedores').delete(id)
