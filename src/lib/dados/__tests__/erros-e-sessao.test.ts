import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getErrorMessage,
  mensagemDeAutenticacao,
  MENSAGEM_SESSAO_TERMINOU,
  pareceMensagemTecnica,
} from '../erros'
import {
  aoSessaoTerminar,
  erroDePermissao,
  erroDeSessaoVencida,
  guardarAvisoDeLogin,
  lerAvisoDeLogin,
  sinalizarSessaoTerminada,
} from '../sessao'

const PADRAO = 'Mensagem padrão em português.'

describe('mensagemDeAutenticacao (SEG-12, FIN-17, PRD-10)', () => {
  it.each([
    ['Invalid login credentials', /E-mail ou senha incorretos/],
    ['Email not confirmed', /ainda não foi confirmado/],
    ['User already registered', /já tem cadastro/],
    ['email rate limit exceeded', /Muitas tentativas/],
    ['For security purposes, you can only request this after 49 seconds.', /Muitas tentativas/],
    ['Password should be at least 6 characters.', /senha é curta/],
    ['New password should be different from the old password.', /diferente da senha atual/],
    ['Email link is invalid or has expired', /link venceu/],
    ['JWT expired', /sessão terminou/],
    ['Failed to fetch', /Sem conexão/],
  ])('traduz "%s"', (cru, esperado) => {
    expect(mensagemDeAutenticacao({ message: cru }, PADRAO)).toMatch(esperado)
  })

  it('mensagem desconhecida em inglês cai no padrão, sem aparecer crua', () => {
    expect(mensagemDeAutenticacao({ message: 'Unexpected failure in gotrue' }, PADRAO)).toBe(PADRAO)
    expect(mensagemDeAutenticacao(null, PADRAO)).toBe(PADRAO)
  })

  it('texto já em português passa como veio', () => {
    const msg = 'Sua conta não está ativa no sistema. Procure um administrador do Controle de Imóveis.'
    expect(mensagemDeAutenticacao({ message: msg }, PADRAO)).toBe(msg)
  })
})

describe('getErrorMessage sem mensagem crua', () => {
  it('erro do cliente de dados sem tradução vira mensagem genérica em português', () => {
    const msg = getErrorMessage(new Error('Falha ao criar em contratos: something odd in relation x'))
    expect(msg).not.toMatch(/contratos|relation/)
    expect(msg).toMatch(/Não foi possível concluir/)
  })

  it('mantém as traduções que já existiam', () => {
    expect(getErrorMessage(new Error('violates foreign key constraint "x"'))).toMatch(/ligado a outro/)
    expect(getErrorMessage(new Error('new row violates row-level security policy'))).toMatch(
      /não tem permissão/,
    )
  })

  it('texto em português escrito pelo sistema passa', () => {
    const msg = 'A importação foi enviada, mas o banco não devolveu o número dela.'
    expect(getErrorMessage(new Error(msg))).toBe(msg)
  })

  it('pareceMensagemTecnica separa banco/rede de português', () => {
    expect(pareceMensagemTecnica('duplicate key value violates unique constraint')).toBe(true)
    expect(pareceMensagemTecnica('Falha ao listar imoveis: x')).toBe(true)
    expect(pareceMensagemTecnica('Escolha o imóvel deste contrato.')).toBe(false)
  })
})

describe('sessão que terminou (FIN-13)', () => {
  afterEach(() => sessionStorage.clear())

  it('reconhece token vencido pelo status, pelo código do PostgREST e pelo texto', () => {
    expect(erroDeSessaoVencida({ status: 401 })).toBe(true)
    expect(erroDeSessaoVencida({ code: 'PGRST301', message: 'x' })).toBe(true)
    expect(erroDeSessaoVencida({ code: 'PGRST303', message: 'x' })).toBe(true)
    expect(erroDeSessaoVencida({ message: 'JWT expired' })).toBe(true)
    expect(erroDeSessaoVencida({ code: '23505', message: 'duplicate key' })).toBe(false)
    expect(erroDeSessaoVencida(null)).toBe(false)
  })

  it('recusa por RLS é permissão (a sessão é conferida à parte)', () => {
    expect(erroDePermissao({ code: '42501', message: 'x' })).toBe(true)
    expect(erroDePermissao({ message: 'new row violates row-level security policy' })).toBe(true)
    expect(erroDePermissao({ code: '23505', message: 'x' })).toBe(false)
  })

  it('avisa quem se inscreveu e deixa cancelar a inscrição', () => {
    const ouvinte = vi.fn()
    const cancelar = aoSessaoTerminar(ouvinte)
    sinalizarSessaoTerminada()
    expect(ouvinte).toHaveBeenCalledTimes(1)
    cancelar()
    sinalizarSessaoTerminada()
    expect(ouvinte).toHaveBeenCalledTimes(1)
  })

  it('o aviso da tela de entrada vale uma vez só', () => {
    expect(lerAvisoDeLogin()).toBe('')
    guardarAvisoDeLogin()
    expect(lerAvisoDeLogin()).toBe(MENSAGEM_SESSAO_TERMINOU)
    expect(lerAvisoDeLogin()).toBe('')
  })
})
