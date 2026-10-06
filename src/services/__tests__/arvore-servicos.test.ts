import { beforeEach, describe, expect, it, vi } from 'vitest'

const getFullList = vi.fn()
const getOne = vi.fn()
const create = vi.fn()
const update = vi.fn()
const del = vi.fn()

const mockColecao = vi.fn((_tabela?: string) => ({
  getFullList,
  getOne,
  create,
  update,
  delete: del,
}))

vi.mock('@/lib/dados/cliente', () => ({
  colecao: (tabela: string) => mockColecao(tabela),
}))

const rpc = vi.fn()
const from = vi.fn()

vi.mock('@/lib/dados/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
    from: (...args: unknown[]) => from(...args),
  },
}))

import {
  createLocador,
  getLocadorById,
  getLocadores,
  inactivateLocador,
  updateLocador,
} from '../locadores'
import {
  createFiador,
  getFiadorByCpf,
  getFiadorById,
  getFiadores,
  updateFiador,
} from '../fiadores'
import {
  createUnidade,
  getUnidadeById,
  getUnidades,
  getUnidadesPorImovel,
  inactivateUnidade,
  updateUnidade,
} from '../unidades'
import { contarImoveisAtivos, getImoveis } from '../imoveis'
import { getContratos, obterProximoNumeroContrato } from '../contratos'

describe('Serviço de Locadores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getLocadores chama colecao com ordenacao padrao por nome_razao_social', async () => {
    getFullList.mockResolvedValueOnce([{ id: '1', nome_razao_social: 'Holding Aguiar' }])
    const res = await getLocadores()
    expect(mockColecao).toHaveBeenCalledWith('locadores')
    expect(getFullList).toHaveBeenCalledWith({ sort: 'nome_razao_social' })
    expect(res).toHaveLength(1)
  })

  it('getLocadorById busca pelo identificador', async () => {
    getOne.mockResolvedValueOnce({ id: 'loc-1', nome_razao_social: 'Ana Silva' })
    const res = await getLocadorById('loc-1')
    expect(mockColecao).toHaveBeenCalledWith('locadores')
    expect(getOne).toHaveBeenCalledWith('loc-1')
    expect(res.id).toBe('loc-1')
  })

  it('createLocador e updateLocador persistem os dados', async () => {
    create.mockResolvedValueOnce({ id: 'loc-novo', nome_razao_social: 'Novo' })
    update.mockResolvedValueOnce({ id: 'loc-1', status: 'inativo' })

    await createLocador({ nome_razao_social: 'Novo', tipo_pessoa: 'pf', status: 'ativo' })
    expect(create).toHaveBeenCalled()

    await updateLocador('loc-1', { telefone: '11999999999' })
    expect(update).toHaveBeenCalledWith('loc-1', { telefone: '11999999999' })

    await inactivateLocador('loc-1')
    expect(update).toHaveBeenCalledWith('loc-1', { status: 'inativo' })
  })
})

describe('Serviço de Fiadores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getFiadores lista fiadores ordenados por nome', async () => {
    getFullList.mockResolvedValueOnce([{ id: 'fia-1', nome: 'Carlos' }])
    const res = await getFiadores()
    expect(mockColecao).toHaveBeenCalledWith('fiadores')
    expect(getFullList).toHaveBeenCalledWith({ sort: 'nome' })
    expect(res[0].nome).toBe('Carlos')
  })

  it('getFiadorById busca pelo identificador', async () => {
    getOne.mockResolvedValueOnce({ id: 'fia-1', nome: 'Carlos' })
    const res = await getFiadorById('fia-1')
    expect(getOne).toHaveBeenCalledWith('fia-1')
    expect(res.id).toBe('fia-1')
  })

  it('createFiador e updateFiador manipulam fiadores', async () => {
    create.mockResolvedValueOnce({ id: 'fia-novo', nome: 'Fiador Novo' })
    update.mockResolvedValueOnce({ id: 'fia-1', nome: 'Fiador Editado' })

    await createFiador({ nome: 'Fiador Novo' })
    expect(create).toHaveBeenCalled()

    await updateFiador('fia-1', { nome: 'Fiador Editado' })
    expect(update).toHaveBeenCalledWith('fia-1', { nome: 'Fiador Editado' })
  })

  it('getFiadorByCpf encontra fiador por documento limpo ou mascarado', async () => {
    // 1. Encontra direto pelo filtro
    getFullList.mockResolvedValueOnce([{ id: 'fia-1', cpf: '529.982.247-25' }])
    const direto = await getFiadorByCpf('529.982.247-25')
    expect(direto?.id).toBe('fia-1')

    // 2. Encontra via normalização se passado sem máscara
    getFullList.mockResolvedValueOnce([]) // filtro direto vazio
    getFullList.mockResolvedValueOnce([{ id: 'fia-2', cpf: '123.456.789-09' }]) // lista completa
    const normalizado = await getFiadorByCpf('12345678909')
    expect(normalizado?.id).toBe('fia-2')
  })
})

describe('Serviço de Unidades', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getUnidades lista todas as unidades', async () => {
    getFullList.mockResolvedValueOnce([{ id: 'u-1', identificador: 'Apto 101' }])
    const res = await getUnidades()
    expect(mockColecao).toHaveBeenCalledWith('imovel_unidades')
    expect(getFullList).toHaveBeenCalledWith({
      sort: 'identificador',
      expand: 'inquilino_atual',
    })
    expect(res).toHaveLength(1)
  })

  it('getUnidadeById busca unidade com expansao', async () => {
    getOne.mockResolvedValueOnce({ id: 'u-1', identificador: 'Apto 101' })
    const res = await getUnidadeById('u-1')
    expect(getOne).toHaveBeenCalledWith('u-1', { expand: 'imovel_id,inquilino_atual' })
    expect(res.id).toBe('u-1')
  })

  it('createUnidade e updateUnidade gravam dados', async () => {
    create.mockResolvedValueOnce({ id: 'u-nova', identificador: 'Sala 01' })
    update.mockResolvedValueOnce({ id: 'u-1', taxa_poco: 30 })

    await createUnidade({ imovel_id: 'im-1', identificador: 'Sala 01' })
    expect(create).toHaveBeenCalled()

    await updateUnidade('u-1', { taxa_poco: 30 })
    expect(update).toHaveBeenCalledWith('u-1', { taxa_poco: 30 })
  })

  it('getUnidadesPorImovel filtra pelo imovel_id', async () => {
    getFullList.mockResolvedValueOnce([{ id: 'u-1', imovel_id: 'im-10', identificador: 'Apto 101' }])
    const res = await getUnidadesPorImovel('im-10')
    expect(mockColecao).toHaveBeenCalledWith('imovel_unidades')
    expect(getFullList).toHaveBeenCalledWith({
      where: [['imovel_id', '=', 'im-10']],
      sort: 'identificador',
      expand: 'inquilino_atual',
    })
    expect(res[0].identificador).toBe('Apto 101')
  })

  it('inactivateUnidade atualiza o status para inativo', async () => {
    update.mockResolvedValueOnce({ id: 'u-1', status: 'inativo' })
    await inactivateUnidade('u-1')
    expect(update).toHaveBeenCalledWith('u-1', { status: 'inativo' })
  })
})

describe('Serviço de Imóveis — Contagem e Limite', () => {
  it('getImoveis busca lista de imoveis', async () => {
    getFullList.mockResolvedValueOnce([{ id: 'im-1', endereco: 'Rua A' }])
    const res = await getImoveis()
    expect(getFullList).toHaveBeenCalledWith({ sort: '-created' })
    expect(res).toHaveLength(1)
  })

  it('contarImoveisAtivos consulta a contagem exata no Supabase ignorando inativos', async () => {
    const neq = vi.fn().mockResolvedValueOnce({ count: 2, error: null })
    const select = vi.fn(() => ({ neq }))
    from.mockReturnValueOnce({ select })

    const total = await contarImoveisAtivos()
    expect(from).toHaveBeenCalledWith('imoveis')
    expect(select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
    expect(neq).toHaveBeenCalledWith('status', 'inativo')
    expect(total).toBe(2)
  })
})

describe('Serviço de Contratos — Expansão e Sequencial', () => {
  it('getContratos expande unidade_id, locador_id e fiador_id', async () => {
    getFullList.mockResolvedValueOnce([{ id: 'c-1', numero: '001/2026' }])
    await getContratos()
    expect(mockColecao).toHaveBeenCalledWith('contratos')
    expect(getFullList).toHaveBeenCalledWith({
      sort: '-created',
      expand: 'imovel,inquilino,unidade_id,locador_id,fiador_id',
    })
  })

  it('obterProximoNumeroContrato chama a RPC proximo_numero_contrato', async () => {
    rpc.mockResolvedValueOnce({ data: '005/2026', error: null })
    const num = await obterProximoNumeroContrato(2026)
    expect(rpc).toHaveBeenCalledWith('proximo_numero_contrato', { p_ano: 2026 })
    expect(num).toBe('005/2026')
  })

  it('obterProximoNumeroContrato devolve fallback caso ocorra erro na RPC', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'falha' } })
    const fallback = await obterProximoNumeroContrato(2026)
    expect(fallback).toBe('001/2026')
  })
})
