import { supabase } from '@/lib/dados/supabase'

/**
 * Recuperação de senha.
 *
 * Quem cuida disso agora é o Supabase Auth: o token vai por e-mail, num link
 * que abre esta aplicação já com uma sessão temporária. Ele nunca passa pela
 * resposta da requisição — era exatamente esse o achado S-01 da auditoria, em
 * que qualquer pessoa pedia recuperação para o e-mail alheio e recebia de
 * volta o token para trocar a senha.
 */

export interface SolicitarRecuperacaoResponse {
  success: boolean
  message: string
}

export interface ValidarTokenResetResponse {
  valid: boolean
  email?: string
  message?: string
}

export interface RedefinirSenhaResponse {
  success: boolean
  message: string
}

const DESTINO = () => `${window.location.origin}/redefinir-senha`

export async function solicitarRecuperacaoSenha(
  email: string,
): Promise<SolicitarRecuperacaoResponse> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: DESTINO(),
  })

  if (error) return { success: false, message: error.message }

  // A mesma resposta para e-mail que existe e para e-mail que não existe: dizer
  // qual é qual entregaria a lista de quem tem conta no sistema.
  return {
    success: true,
    message: 'Se houver uma conta com esse e-mail, o link de recuperação foi enviado.',
  }
}

/**
 * Confere se a pessoa chegou por um link de recuperação válido.
 *
 * O link traz a credencial no fragmento da URL, que o cliente do Supabase
 * consome ao iniciar e converte numa sessão curta — daí não haver mais token
 * para ler da query string.
 */
export async function validarLinkDeRecuperacao(): Promise<ValidarTokenResetResponse> {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session) {
    return {
      valid: false,
      message: 'O link de recuperação é inválido ou já expirou. Peça um novo.',
    }
  }

  return { valid: true, email: data.session.user.email ?? undefined }
}

export async function redefinirSenha(password: string): Promise<RedefinirSenhaResponse> {
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Senha redefinida com sucesso.' }
}
