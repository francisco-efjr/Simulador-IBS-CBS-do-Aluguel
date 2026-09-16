import pb from '@/lib/pocketbase/client'

export interface SolicitarRecuperacaoResponse {
  success: boolean
  message: string
  token?: string
}

export interface ValidarTokenResetResponse {
  valid: boolean
  email?: string
  expires_at?: string
  status?: string
  message?: string
}

export interface RedefinirSenhaResponse {
  success: boolean
  message: string
}

/**
 * Solicita envio de email e geração de token de recuperação de senha
 */
export async function solicitarRecuperacaoSenha(
  email: string,
): Promise<SolicitarRecuperacaoResponse> {
  const res = await pb.send<SolicitarRecuperacaoResponse>(
    '/backend/v1/auth/solicitar-recuperacao',
    {
      method: 'POST',
      body: { email: email.trim().toLowerCase() },
    },
  )
  return res
}

/**
 * Valida se um token de recuperação é existente e não expirou
 */
export async function validarTokenReset(token: string): Promise<ValidarTokenResetResponse> {
  const res = await pb.send<ValidarTokenResetResponse>(
    `/backend/v1/auth/validar-token-reset?token=${encodeURIComponent(token.trim())}`,
    {
      method: 'GET',
    },
  )
  return res
}

/**
 * Redefine a senha com o token fornecido
 */
export async function redefinirSenha(
  token: string,
  password: string,
  passwordConfirm: string,
): Promise<RedefinirSenhaResponse> {
  const res = await pb.send<RedefinirSenhaResponse>('/backend/v1/auth/redefinir-senha', {
    method: 'POST',
    body: {
      token: token.trim(),
      password,
      passwordConfirm,
    },
  })
  return res
}
