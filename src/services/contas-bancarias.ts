import pb from '@/lib/pocketbase/client'

export interface ContaBancaria {
  id: string
  nome: string
  banco: string
  agencia: string
  conta: string
  tipo: 'Conta Corrente' | 'Conta Poupança' | 'Conta Investimento' | 'Outros'
  saldo_inicial: number
  ativo: boolean
  created?: string
  updated?: string
}

export const getContasBancarias = (onlyActive = false) =>
  pb.collection('contas_bancarias').getFullList<ContaBancaria>({
    filter: onlyActive ? 'ativo = true' : '',
    sort: 'nome',
  })

export const getContaBancaria = (id: string) =>
  pb.collection('contas_bancarias').getOne<ContaBancaria>(id)

export const createContaBancaria = (data: Partial<ContaBancaria>) =>
  pb.collection('contas_bancarias').create<ContaBancaria>(data)

export const updateContaBancaria = (id: string, data: Partial<ContaBancaria>) =>
  pb.collection('contas_bancarias').update<ContaBancaria>(id, data)

export const deleteContaBancaria = (id: string) => pb.collection('contas_bancarias').delete(id)
