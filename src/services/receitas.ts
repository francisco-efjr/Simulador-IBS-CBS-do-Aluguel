import pb from '@/lib/pocketbase/client'

export const getReceitas = () =>
  pb.collection('receitas').getFullList({
    sort: '-created',
    expand: 'imovel,contrato,inquilino,categoria',
  })

export const getReceita = (id: string) =>
  pb.collection('receitas').getOne(id, { expand: 'imovel,contrato,inquilino,categoria' })

export const createReceita = (data: Record<string, any>) => pb.collection('receitas').create(data)

export const updateReceita = (id: string, data: Record<string, any>) =>
  pb.collection('receitas').update(id, data)

export const deleteReceita = (id: string) => pb.collection('receitas').delete(id)
