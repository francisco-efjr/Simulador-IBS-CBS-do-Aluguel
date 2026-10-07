import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  contratoSchema,
  fiadorSchema,
  locadorSchema,
  unidadeSchema,
  validarFormulario,
} from '@/lib/validacao/esquemas'

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
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'u-1' } } } }),
    },
  },
}))

import {
  createLocador,
  getLocadorById,
  getLocadores,
  updateLocador,
  inactivateLocador,
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
  getUnidadesPorImovel,
  updateUnidade,
  inactivateUnidade,
} from '../unidades'
import { contarImoveisAtivos } from '../imoveis'
import { getContratos, obterProximoNumeroContrato } from '../contratos'

describe('Fluxo Integrado Águia Systems (Fase 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Fluxo 1: Locadores e Holding', () => {
    it('valida e cadastra locador pessoa jurídica com dados bancários', async () => {
      const dadosLocador = {
        nome_razao_social: 'Aguiar Empreendimentos LTDA',
        tipo_pessoa: 'pj' as const,
        cpf_cnpj: '12.ABC.345/01DE-35',
        email: 'financeiro@aguiar.com.br',
        telefone: '(11) 98765-4321',
        dados_bancarios: 'Banco Itaú - Ag 1234 CC 56789-0 - Chave PIX: financeiro@aguiar.com.br',
        status: 'ativo' as const,
      }

      // 1. Validação com o schema de locador
      const erros = validarFormulario(locadorSchema, dadosLocador)
      expect(erros).toEqual({})

      // 2. Criação através do serviço
      create.mockResolvedValueOnce({ id: 'loc-1', ...dadosLocador })
      const criado = await createLocador(dadosLocador)
      expect(mockColecao).toHaveBeenCalledWith('locadores')
      expect(create).toHaveBeenCalledWith(dadosLocador)
      expect(criado.id).toBe('loc-1')

      // 3. Consulta por ID e atualização
      getOne.mockResolvedValueOnce({ id: 'loc-1', ...dadosLocador })
      const consultado = await getLocadorById('loc-1')
      expect(consultado.nome_razao_social).toBe('Aguiar Empreendimentos LTDA')

      update.mockResolvedValueOnce({ ...dadosLocador, telefone: '(11) 99999-8888' })
      const atualizado = await updateLocador('loc-1', { telefone: '(11) 99999-8888' })
      expect(update).toHaveBeenCalledWith('loc-1', { telefone: '(11) 99999-8888' })
      expect(atualizado.telefone).toBe('(11) 99999-8888')

      // 4. Listagem de locadores
      getFullList.mockResolvedValueOnce([{ id: 'loc-1', ...dadosLocador }])
      const todos = await getLocadores()
      expect(todos).toHaveLength(1)
      expect(todos[0].nome_razao_social).toBe('Aguiar Empreendimentos LTDA')
    })

    it('inativa locador preservando integridade cadastral', async () => {
      update.mockResolvedValueOnce({ id: 'loc-1', status: 'inativo' })
      const inativado = await inactivateLocador('loc-1')
      expect(mockColecao).toHaveBeenCalledWith('locadores')
      expect(update).toHaveBeenCalledWith('loc-1', { status: 'inativo' })
      expect(inativado.status).toBe('inativo')
    })
  })

  describe('Fluxo 2: Imóvel Macro, Unidades e Taxas Customizáveis', () => {
    it('valida unidade com taxas de condomínio, poço artesiano e concessionárias', () => {
      const dadosUnidade = {
        imovel_id: 'imovel-edificio-central',
        identificador: 'Apartamento 302',
        complemento: 'Bloco B - 3º Andar',
        codigo_energia: 'EN-10928374',
        codigo_agua: 'AG-99887766',
        tem_condominio: true,
        valor_condominio: '480,50',
        taxa_poco: '45,00',
        taxas_extras: '20,00',
      }

      const erros = validarFormulario(unidadeSchema, dadosUnidade)
      expect(erros).toEqual({})
    })

    it('cria, busca, atualiza e inativa unidades filhas pertencentes a um imóvel macro', async () => {
      const payload = {
        imovel_id: 'imovel-edificio-central',
        identificador: 'Apto 101',
        codigo_energia: 'EN-001',
        codigo_agua: 'AG-001',
        tem_condominio: true,
        valor_condominio: 350,
        taxa_poco: 30,
        taxas_extras: 15,
      }

      create.mockResolvedValueOnce({ id: 'uni-1', ...payload, status: 'vago' })
      const unidadeCriada = await createUnidade(payload)
      expect(mockColecao).toHaveBeenCalledWith('imovel_unidades')
      expect(create).toHaveBeenCalledWith(payload)
      expect(unidadeCriada.id).toBe('uni-1')

      getFullList.mockResolvedValueOnce([{ id: 'uni-1', ...payload }])
      const unidades = await getUnidadesPorImovel('imovel-edificio-central')
      expect(mockColecao).toHaveBeenCalledWith('imovel_unidades')
      expect(getFullList).toHaveBeenCalledWith({
        where: [['imovel_id', '=', 'imovel-edificio-central']],
        sort: 'identificador',
        expand: 'inquilino_atual',
      })
      expect(unidades).toHaveLength(1)
      expect(unidades[0].identificador).toBe('Apto 101')

      update.mockResolvedValueOnce({ id: 'uni-1', taxa_poco: 40 })
      await updateUnidade('uni-1', { taxa_poco: 40 })
      expect(update).toHaveBeenCalledWith('uni-1', { taxa_poco: 40 })

      update.mockResolvedValueOnce({ id: 'uni-1', status: 'inativo' })
      await inactivateUnidade('uni-1')
      expect(update).toHaveBeenCalledWith('uni-1', { status: 'inativo' })
    })
  })

  describe('Fluxo 3: Fiadores e Outorga Conjugal', () => {
    it('bloqueia fiador casado sem cônjuge e aceita após preenchimento da outorga', () => {
      const fiadorIncompleto = {
        nome: 'Roberto Silveira',
        cpf: '529.982.247-25',
        estado_civil: 'Casado',
        email: 'roberto@fiador.com',
      }

      const erros = validarFormulario(fiadorSchema, fiadorIncompleto)
      expect(erros.conjuge_nome).toMatch(/outorga conjugal/)
      expect(erros.conjuge_cpf).toMatch(/outorga conjugal/)

      const fiadorCompleto = {
        ...fiadorIncompleto,
        conjuge_nome: 'Fernanda Silveira',
        conjuge_cpf: '111.444.777-35',
      }
      const errosCompletos = validarFormulario(fiadorSchema, fiadorCompleto)
      expect(errosCompletos).toEqual({})
    })

    it('gerencia fiadores (criação, consulta, atualização e busca por CPF)', async () => {
      const novoFiador = {
        nome: 'Roberto Silveira',
        cpf: '529.982.247-25',
        email: 'roberto@fiador.com',
      }

      create.mockResolvedValueOnce({ id: 'fia-1', ...novoFiador })
      const criado = await createFiador(novoFiador)
      expect(mockColecao).toHaveBeenCalledWith('fiadores')
      expect(criado.id).toBe('fia-1')

      getOne.mockResolvedValueOnce({ id: 'fia-1', ...novoFiador })
      const buscado = await getFiadorById('fia-1')
      expect(buscado.nome).toBe('Roberto Silveira')

      getFullList.mockResolvedValueOnce([{ id: 'fia-1', ...novoFiador }])
      const todos = await getFiadores()
      expect(todos).toHaveLength(1)

      update.mockResolvedValueOnce({ id: 'fia-1', telefone: '11999998888' })
      await updateFiador('fia-1', { telefone: '11999998888' })
      expect(update).toHaveBeenCalledWith('fia-1', { telefone: '11999998888' })

      getFullList.mockResolvedValueOnce([{ id: 'fia-1', cpf: '529.982.247-25', nome: 'Roberto' }])
      const fia = await getFiadorByCpf('52998224725')
      expect(fia?.id).toBe('fia-1')
    })
  })

  describe('Fluxo 4: Contrato com Numeração Sequencial NNN/AAAA e Vínculos Completos', () => {
    it('valida contrato associando unidade, locador e fiador', () => {
      const dadosContrato = {
        imovel: 'imovel-1',
        unidade_id: 'uni-1',
        locador_id: 'loc-1',
        fiador_id: 'fia-1',
        inquilino: 'inq-1',
        data_inicio: '2026-02-01',
        data_fim: '2027-02-01',
        valor_aluguel: '3200,00',
        dia_vencimento: '10',
      }

      const erros = validarFormulario(contratoSchema, dadosContrato)
      expect(erros).toEqual({})
    })

    it('gera numeração sequencial via RPC ou fallback coerente', async () => {
      rpc.mockResolvedValueOnce({ data: '007/2026', error: null })
      const num = await obterProximoNumeroContrato(2026)
      expect(rpc).toHaveBeenCalledWith('proximo_numero_contrato', { p_ano: 2026 })
      expect(num).toBe('007/2026')
      expect(num).toMatch(/^[0-9]{3}\/[0-9]{4}$/)
    })

    it('lista contratos com expansão das partes relacionadas', async () => {
      getFullList.mockResolvedValueOnce([
        {
          id: 'c-1',
          numero: '001/2026',
          expand: {
            locador_id: { nome_razao_social: 'Aguiar LTDA' },
            fiador_id: { nome: 'Roberto' },
            unidade_id: { identificador: 'Apto 101' },
          },
        },
      ])

      const contratos = await getContratos()
      expect(mockColecao).toHaveBeenCalledWith('contratos')
      expect(getFullList).toHaveBeenCalledWith({
        sort: '-created',
        expand: 'imovel,inquilino,unidade_id,locador_id,fiador_id',
      })
      expect(contratos).toHaveLength(1)
      expect(contratos[0].numero).toBe('001/2026')
    })
  })

  describe('Fluxo 5: Limite Comercial do Plano Gratuito (3 imóveis)', () => {
    it('calcula se a cota gratuita de 3 imóveis foi atingida', async () => {
      // Caso 1: 2 imóveis cadastrados -> dentro do limite
      const neq1 = vi.fn().mockResolvedValueOnce({ count: 2, error: null })
      const eq1 = vi.fn(() => ({ neq: neq1 }))
      const select1 = vi.fn(() => ({ eq: eq1 }))
      from.mockReturnValueOnce({ select: select1 })

      const totalAbaixo = await contarImoveisAtivos()
      expect(totalAbaixo).toBe(2)
      const limiteAtingidoAbaixo = totalAbaixo >= 3
      expect(limiteAtingidoAbaixo).toBe(false)

      // Caso 2: 3 imóveis cadastrados -> atingiu o teto
      const neq2 = vi.fn().mockResolvedValueOnce({ count: 3, error: null })
      const eq2 = vi.fn(() => ({ neq: neq2 }))
      const select2 = vi.fn(() => ({ eq: eq2 }))
      from.mockReturnValueOnce({ select: select2 })

      const totalNoTeto = await contarImoveisAtivos()
      expect(totalNoTeto).toBe(3)
      const limiteAtingidoNoTeto = totalNoTeto >= 3
      expect(limiteAtingidoNoTeto).toBe(true)
    })
  })
})
