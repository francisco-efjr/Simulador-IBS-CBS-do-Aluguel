import { colecao } from '@/lib/dados/cliente'

export const getIptuTaxas = () =>
  colecao('iptu_taxas').getFullList({
    sort: '-created',
    expand: 'imovel',
  })

export const getIptuTaxa = (id: string) => colecao('iptu_taxas').getOne(id, { expand: 'imovel' })

export const createIptuTaxa = (data: Record<string, any> | FormData) =>
  colecao('iptu_taxas').create(data)

export const updateIptuTaxa = (id: string, data: Record<string, any> | FormData) =>
  colecao('iptu_taxas').update(id, data)

export const deleteIptuTaxa = (id: string) => colecao('iptu_taxas').delete(id)
