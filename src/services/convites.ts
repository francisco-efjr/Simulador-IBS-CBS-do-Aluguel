import { colecao } from '@/lib/dados/cliente'
import { supabase } from '@/lib/dados/supabase'

export type StatusConvite = 'pendente' | 'aceito' | 'cancelado' | 'expirado'
export type Perfil = 'administrador' | 'usuario'

export interface ConviteRecord {
  id: string
  email: string
  token: string
  perfil: Perfil
  status: StatusConvite
  data_expiracao: string
  criado_por?: string
  expand?: {
    criado_por?: {
      id: string
      name: string
      email: string
    }
  }
  created: string
  updated: string
}

export interface EnviarConvitePayload {
  email: string
  perfil: Perfil
}

export interface ValidarConviteResponse {
  valid: boolean
  email?: string
  perfil?: Perfil
  expiracao?: string
  status?: string
  message?: string
}

/**
 * Retorna todos os convites da coleção ordenados pelos mais recentes
 */
const VALIDADE_EM_DIAS = 7

const gerarToken = () => crypto.randomUUID().replace(/-/g, '')

const validadePadrao = () =>
  new Date(Date.now() + VALIDADE_EM_DIAS * 24 * 60 * 60 * 1000).toISOString()

export const getConvites = async (): Promise<ConviteRecord[]> => {
  return colecao('convites').getFullList<ConviteRecord>({
    sort: '-created',
    expand: 'criado_por',
  })
}

/**
 * Retorna contagem de convites pendentes e não expirados
 */
export const countConvitesPendentes = async (): Promise<number> => {
  try {
    const result = await colecao('convites').getList(1, 1, {
      where: [
        ['status', '=', 'pendente'],
        ['data_expiracao', '>=', new Date().toISOString()],
      ],
    })
    return result.totalItems
  } catch {
    return 0
  }
}

/**
 * Envia um novo convite via endpoint dedicado de hook ou via SDK
 */
export const enviarConvite = async (
  data: EnviarConvitePayload,
): Promise<{ success: boolean; convite?: ConviteRecord; message?: string }> => {
  const { data: sessao } = await supabase.auth.getUser()

  const convite = await colecao('convites').create<ConviteRecord>({
    email: data.email.trim().toLowerCase(),
    token: gerarToken(),
    perfil: data.perfil,
    status: 'pendente',
    data_expiracao: validadePadrao(),
    criado_por: sessao.user?.id ?? null,
  })

  return { success: true, convite }
}

/**
 * Reenvia um convite (gera novo token e renova expiração por mais 7 dias)
 */
export const reenviarConvite = async (conviteId: string): Promise<ConviteRecord> => {
  return colecao('convites').update<ConviteRecord>(conviteId, {
    status: 'pendente',
    token: gerarToken(),
    data_expiracao: validadePadrao(),
  })
}

/**
 * Cancela um convite pendente
 */
export const cancelarConvite = async (conviteId: string): Promise<ConviteRecord> => {
  return colecao('convites').update<ConviteRecord>(conviteId, {
    status: 'cancelado',
  })
}

/**
 * Remove definitivamente um convite
 */
export const deleteConvite = async (conviteId: string): Promise<boolean> => {
  return colecao('convites').delete(conviteId)
}

/**
 * Valida um token de convite no backend
 */
export const validarConviteToken = async (token: string): Promise<ValidarConviteResponse> => {
  if (!token.trim()) return { valid: false, message: 'Token não informado.' }

  // Quem abre o convite ainda não tem login, e a tabela de convites é fechada a
  // administradores. A função no banco é a única porta: recebe o token e
  // devolve só o e-mail e o perfil daquele convite, sem expor a lista.
  const { data, error } = await supabase.rpc('validar_convite', { p_token: token.trim() })

  if (error) {
    return { valid: false, message: 'Não foi possível verificar o convite no momento.' }
  }

  const resultado = (Array.isArray(data) ? data[0] : data) as
    | { valido: boolean; email: string | null; perfil: Perfil | null; situacao: string | null }
    | undefined

  if (!resultado?.valido) {
    return {
      valid: false,
      status: resultado?.situacao ?? undefined,
      message:
        resultado?.situacao === 'expirado'
          ? 'Este convite expirou. Peça um novo ao administrador.'
          : resultado?.situacao
            ? `Este convite não está mais pendente (${resultado.situacao}).`
            : 'Convite não encontrado.',
    }
  }

  return {
    valid: true,
    email: resultado.email ?? undefined,
    perfil: resultado.perfil ?? undefined,
  }
}
