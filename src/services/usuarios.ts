import { colecao } from '@/lib/dados/cliente'
import type { PerfilUsuario } from '@/lib/constants'

export type Perfil = PerfilUsuario

export interface UsuarioRecord {
  id: string
  name: string
  email: string
  perfil: Perfil
  ativo: boolean
  avatar?: string
  created: string
  updated: string
}

/**
 * O que se muda numa conta. O acesso vem só do perfil (migração
 * 20261008120001): não há permissão por módulo para gravar.
 */
export interface UpdateUsuarioData {
  name?: string
  perfil?: Perfil
  ativo?: boolean
}

export const getUsuarios = (): Promise<UsuarioRecord[]> =>
  colecao('users').getFullList<UsuarioRecord>({ sort: '-created' })

export const getUsuarioById = (id: string): Promise<UsuarioRecord> => colecao('users').getOne<UsuarioRecord>(id)

export const updateUsuario = async (id: string, data: UpdateUsuarioData) => {
  if (Object.keys(data).length > 0) {
    await colecao('users').update(id, { ...data })
  }
  return getUsuarioById(id)
}

/**
 * Remove o perfil de aplicação. A credencial em si continua no Supabase Auth,
 * mas sem perfil nenhuma política de RLS concede leitura ou escrita: o acesso
 * acaba na prática. Para apagar também o login, use Authentication → Users no
 * painel do Supabase.
 */
export const deleteUsuario = (id: string) => colecao('users').delete(id)
