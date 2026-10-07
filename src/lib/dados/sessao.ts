import { MENSAGEM_SESSAO_TERMINOU } from './erros'

/**
 * Sessão que terminou no meio do trabalho (achado FIN-13).
 *
 * Quando o banco recusa uma operação por token vencido ou ausente, o formulário
 * só dizia "Confira os campos". Aqui o cliente de dados avisa quem cuida da
 * sessão (`use-auth`), que sai e manda para `/login` guardando a rota, e a tela
 * de entrada explica o que houve.
 */

/** Erro do cliente de dados quando a causa é a sessão, não os campos. */
export class ErroDeSessao extends Error {
  constructor() {
    super(MENSAGEM_SESSAO_TERMINOU)
    this.name = 'ErroDeSessao'
  }
}

interface ErroDoBanco {
  code?: string
  status?: number
  message?: string
}

/** 401, PGRST301/303 (token inválido ou vencido) ou "JWT expired" no texto. */
export function erroDeSessaoVencida(e: ErroDoBanco | null | undefined): boolean {
  if (!e) return false
  if (e.status === 401) return true
  if (e.code === 'PGRST301' || e.code === 'PGRST303') return true
  return /jwt expired|invalid jwt|jwt.*(malformed|invalid)/i.test(e.message ?? '')
}

/** Recusa por permissão (RLS), que sem sessão é o jeito de o banco dizer "entre de novo". */
export function erroDePermissao(e: ErroDoBanco | null | undefined): boolean {
  return Boolean(e) && (e!.code === '42501' || /row-level security/i.test(e!.message ?? ''))
}

type Ouvinte = () => void
const ouvintes = new Set<Ouvinte>()

/** Quem cuida da sessão se inscreve aqui; devolve a função que cancela a inscrição. */
export function aoSessaoTerminar(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

export function sinalizarSessaoTerminada(): void {
  ouvintes.forEach((ouvinte) => ouvinte())
}

const CHAVE_AVISO = 'controle-imoveis:aviso-de-login'

/** Guarda o aviso para a tela de entrada mostrar depois do redirecionamento. */
export function guardarAvisoDeLogin(mensagem = MENSAGEM_SESSAO_TERMINOU): void {
  try {
    sessionStorage.setItem(CHAVE_AVISO, mensagem)
  } catch {
    /* sem armazenamento (janela privada): a tela de entrada abre sem o aviso */
  }
}

/** Lê o aviso e o apaga: ele vale uma vez só. */
export function lerAvisoDeLogin(): string {
  try {
    const mensagem = sessionStorage.getItem(CHAVE_AVISO) ?? ''
    if (mensagem) sessionStorage.removeItem(CHAVE_AVISO)
    return mensagem
  } catch {
    return ''
  }
}
