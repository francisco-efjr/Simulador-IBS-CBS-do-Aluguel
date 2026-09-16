import pb from '@/lib/pocketbase/client'

export const getIptuTaxas = () =>
  pb.collection('iptu_taxas').getFullList({
    sort: '-created',
    expand: 'imovel',
  })

export const getIptuTaxa = (id: string) =>
  pb.collection('iptu_taxas').getOne(id, { expand: 'imovel' })

export const createIptuTaxa = (data: Record<string, any> | FormData) =>
  pb.collection('iptu_taxas').create(data)

export const updateIptuTaxa = (id: string, data: Record<string, any> | FormData) =>
  pb.collection('iptu_taxas').update(id, data)

export const deleteIptuTaxa = (id: string) => pb.collection('iptu_taxas').delete(id)
