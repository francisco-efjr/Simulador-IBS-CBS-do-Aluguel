import pb from '@/lib/pocketbase/client'

export type Perfil = 'administrador' | 'usuario'

import type { PermissaoModulo } from '@/lib/constants'

export interface UsuarioRecord {
  id: string
  name: string
  email: string
  perfil: Perfil
  ativo: boolean
  avatar?: string
  permissoes?: PermissaoModulo[] | null
  created: string
  updated: string
}

export interface CreateUsuarioData {
  name: string
  email: string
  password: string
  passwordConfirm: string
  perfil: Perfil
  permissoes?: PermissaoModulo[]
}

export interface UpdateUsuarioData {
  name?: string
  perfil?: Perfil
  ativo?: boolean
  permissoes?: PermissaoModulo[]
}

export const getUsuarios = (): Promise<UsuarioRecord[]> =>
  pb.collection('users').getFullList<UsuarioRecord>({ sort: '-created' })

export const getUsuarioById = (id: string): Promise<UsuarioRecord> =>
  pb.collection('users').getOne<UsuarioRecord>(id)

export const createUsuario = (data: CreateUsuarioData) =>
  pb.collection('users').create({ ...data, ativo: true })

export const updateUsuario = (id: string, data: UpdateUsuarioData) =>
  pb.collection('users').update(id, data)

export const deleteUsuario = (id: string) => pb.collection('users').delete(id)
