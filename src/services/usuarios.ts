import { colecao } from '@/lib/dados/cliente'
import { supabase } from '@/lib/dados/supabase'
import type { ModuloPermissao, NivelPermissao, PermissaoModulo } from '@/lib/constants'

export type Perfil = 'administrador' | 'usuario'

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

export interface UpdateUsuarioData {
  name?: string
  perfil?: Perfil
  ativo?: boolean
  permissoes?: PermissaoModulo[]
}

interface LinhaPermissao {
  usuario: string
  modulo: ModuloPermissao
  nivel: NivelPermissao
}

/**
 * Permissões deixaram de ser um campo JSON dentro do usuário e passaram a ser
 * uma tabela. A tela continua recebendo a mesma lista — a diferença é que agora
 * o banco também consegue lê-la, e é ela que decide o que cada pessoa acessa
 * (achado S-02 da auditoria).
 */
async function permissoesPorUsuario(): Promise<Map<string, PermissaoModulo[]>> {
  const linhas = await colecao('permissoes').getFullList<LinhaPermissao>({ sort: 'modulo' })

  const mapa = new Map<string, PermissaoModulo[]>()
  for (const linha of linhas) {
    const lista = mapa.get(linha.usuario) ?? []
    lista.push({ modulo: linha.modulo, nivel: linha.nivel })
    mapa.set(linha.usuario, lista)
  }
  return mapa
}

export const getUsuarios = async (): Promise<UsuarioRecord[]> => {
  const [usuarios, permissoes] = await Promise.all([
    colecao('users').getFullList<UsuarioRecord>({ sort: '-created' }),
    permissoesPorUsuario(),
  ])

  return usuarios.map((u) => ({ ...u, permissoes: permissoes.get(u.id) ?? [] }))
}

export const getUsuarioById = async (id: string): Promise<UsuarioRecord> => {
  const usuario = await colecao('users').getOne<UsuarioRecord>(id)
  const permissoes = await colecao('permissoes').getFullList<LinhaPermissao>({
    where: [['usuario', '=', id]],
    sort: 'modulo',
  })

  return {
    ...usuario,
    permissoes: permissoes.map(({ modulo, nivel }) => ({ modulo, nivel })),
  }
}

export const updateUsuario = async (id: string, data: UpdateUsuarioData) => {
  const { permissoes, ...cadastro } = data

  if (Object.keys(cadastro).length > 0) {
    await colecao('users').update(id, cadastro)
  }

  if (permissoes) {
    const { error } = await supabase.from('permissoes').upsert(
      permissoes.map((p) => ({ usuario: id, modulo: p.modulo, nivel: p.nivel })),
      { onConflict: 'usuario,modulo' },
    )
    if (error) throw new Error(`Falha ao salvar as permissões: ${error.message}`)
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
