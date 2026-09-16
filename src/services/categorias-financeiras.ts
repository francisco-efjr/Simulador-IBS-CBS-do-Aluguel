import pb from '@/lib/pocketbase/client'

export const getCategoriasFinanceiras = () =>
  pb.collection('categorias_financeiras').getFullList({ sort: 'nome' })

export const getCategoriasReceita = () =>
  pb.collection('categorias_financeiras').getFullList({
    filter: 'tipo = "receita" && status = "ativo"',
    sort: 'nome',
  })

export const getCategoriasDespesa = () =>
  pb.collection('categorias_financeiras').getFullList({
    filter: 'tipo = "despesa" && status = "ativo"',
    sort: 'nome',
  })

export const getCategoriaFinanceira = (id: string) =>
  pb.collection('categorias_financeiras').getOne(id)

export const createCategoriaFinanceira = (data: Record<string, any>) =>
  pb.collection('categorias_financeiras').create(data)

export const updateCategoriaFinanceira = (id: string, data: Record<string, any>) =>
  pb.collection('categorias_financeiras').update(id, data)

export const deleteCategoriaFinanceira = (id: string) =>
  pb.collection('categorias_financeiras').delete(id)
