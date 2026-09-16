import pb from '@/lib/pocketbase/client'

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
export const getConvites = async (): Promise<ConviteRecord[]> => {
  return pb.collection('convites').getFullList<ConviteRecord>({
    sort: '-created',
    expand: 'criado_por',
  })
}

/**
 * Retorna contagem de convites pendentes e não expirados
 */
export const countConvitesPendentes = async (): Promise<number> => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const result = await pb.collection('convites').getList(1, 1, {
      filter: `status = 'pendente' && data_expiracao >= '${today}'`,
      fields: 'id',
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
): Promise<{ success: boolean; convite?: any; message?: string }> => {
  try {
    const response = await pb.send<{
      success: boolean
      convite: any
      message?: string
    }>('/backend/v1/convites/enviar', {
      method: 'POST',
      body: data,
    })
    return response
  } catch (err: any) {
    // Fallback: se o endpoint der erro ou não estiver acessível, criar direto na coleção
    if (err?.status === 403 || err?.status === 400) {
      throw err
    }
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const record = await pb.collection('convites').create({
      email: data.email.trim().toLowerCase(),
      token,
      perfil: data.perfil,
      status: 'pendente',
      data_expiracao: expDate,
      criado_por: pb.authStore.record?.id,
    })
    return { success: true, convite: record }
  }
}

/**
 * Reenvia um convite (gera novo token e renova expiração por mais 7 dias)
 */
export const reenviarConvite = async (conviteId: string): Promise<ConviteRecord> => {
  try {
    const response = await pb.send<{ success: boolean; convite: ConviteRecord }>(
      '/backend/v1/convites/reenviar',
      {
        method: 'POST',
        body: { id: conviteId },
      },
    )
    if (response?.convite) {
      return response.convite
    }
  } catch (err: any) {
    // Se o backend retornou erro 400 ou 403 (ex: usuário já ativo), propague
    if (err?.status === 400 || err?.status === 403) {
      throw err
    }
  }

  // Fallback: se o endpoint dedicado falhar, renova direto na coleção
  const expDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const novoToken = Math.random().toString(36).substring(2) + Date.now().toString(36)

  return pb.collection('convites').update<ConviteRecord>(conviteId, {
    status: 'pendente',
    token: novoToken,
    data_expiracao: expDate,
  })
}

/**
 * Cancela um convite pendente
 */
export const cancelarConvite = async (conviteId: string): Promise<ConviteRecord> => {
  return pb.collection('convites').update<ConviteRecord>(conviteId, {
    status: 'cancelado',
  })
}

/**
 * Remove definitivamente um convite
 */
export const deleteConvite = async (conviteId: string): Promise<boolean> => {
  return pb.collection('convites').delete(conviteId)
}

/**
 * Valida um token de convite no backend
 */
export const validarConviteToken = async (token: string): Promise<ValidarConviteResponse> => {
  if (!token) {
    return { valid: false, message: 'Token não informado.' }
  }

  try {
    const res = await pb.send<ValidarConviteResponse>(
      `/backend/v1/convites/validar?token=${encodeURIComponent(token)}`,
      { method: 'GET' },
    )
    return res
  } catch {
    // Fallback de consulta via filtro caso o hook de rota não responda
    try {
      const records = await pb.collection('convites').getFullList<ConviteRecord>({
        filter: `token = '${token.replace(/'/g, "''")}'`,
        sort: '-created',
        requestKey: null,
      })

      if (records.length === 0) {
        return { valid: false, message: 'Convite não encontrado.' }
      }

      const c = records[0]
      if (c.status !== 'pendente') {
        return {
          valid: false,
          status: c.status,
          message: `Este convite não está mais pendente (${c.status}).`,
        }
      }

      const today = new Date().toISOString().slice(0, 10)
      if (c.data_expiracao && c.data_expiracao < today) {
        return { valid: false, status: 'expirado', message: 'Este convite expirou.' }
      }

      return {
        valid: true,
        email: c.email,
        perfil: c.perfil,
        expiracao: c.data_expiracao,
      }
    } catch {
      return { valid: false, message: 'Não foi possível verificar o convite no momento.' }
    }
  }
}
