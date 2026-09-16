import pb from '@/lib/pocketbase/client'

export const getInquilinos = () => pb.collection('inquilinos').getFullList({ sort: '-created' })
export const getInquilino = (id: string) => pb.collection('inquilinos').getOne(id)
export const createInquilino = (data: Record<string, any>) =>
  pb.collection('inquilinos').create(data)
export const updateInquilino = (id: string, data: Record<string, any>) =>
  pb.collection('inquilinos').update(id, data)
export const deleteInquilino = (id: string) => pb.collection('inquilinos').delete(id)
