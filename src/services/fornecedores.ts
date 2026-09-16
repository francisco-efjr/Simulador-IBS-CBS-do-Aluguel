import pb from '@/lib/pocketbase/client'

export const getFornecedores = () => pb.collection('fornecedores').getFullList({ sort: '-created' })
export const getFornecedor = (id: string) => pb.collection('fornecedores').getOne(id)
export const createFornecedor = (data: Record<string, any>) =>
  pb.collection('fornecedores').create(data)
export const updateFornecedor = (id: string, data: Record<string, any>) =>
  pb.collection('fornecedores').update(id, data)
export const deleteFornecedor = (id: string) => pb.collection('fornecedores').delete(id)
