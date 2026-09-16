import pb from '@/lib/pocketbase/client'

export const getDespesas = () =>
  pb.collection('despesas').getFullList({
    sort: '-created',
    expand: 'imovel,fornecedor,categoria',
  })

export const getDespesa = (id: string) =>
  pb.collection('despesas').getOne(id, { expand: 'imovel,fornecedor,categoria' })

export const createDespesa = (data: Record<string, any>) => pb.collection('despesas').create(data)

export const updateDespesa = (id: string, data: Record<string, any>) =>
  pb.collection('despesas').update(id, data)

export const deleteDespesa = (id: string) => pb.collection('despesas').delete(id)
