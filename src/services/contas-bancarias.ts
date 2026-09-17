import { colecao } from '@/lib/dados/cliente'

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
  colecao('contas_bancarias').getFullList<ContaBancaria>({
    where: onlyActive ? [['ativo', '=', true]] : [],
    sort: 'nome',
  })

export const getContaBancaria = (id: string) =>
  colecao('contas_bancarias').getOne<ContaBancaria>(id)

export const createContaBancaria = (data: Partial<ContaBancaria>) =>
  colecao('contas_bancarias').create<ContaBancaria>(data)

export const updateContaBancaria = (id: string, data: Partial<ContaBancaria>) =>
  colecao('contas_bancarias').update<ContaBancaria>(id, data)

export const deleteContaBancaria = (id: string) => colecao('contas_bancarias').delete(id)
