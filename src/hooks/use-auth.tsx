import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/dados/supabase'
import type { ModuloPermissao, NivelPermissao, PermissaoModulo } from '@/lib/constants'

interface UsuarioLogado {
  id: string
  email: string
  name: string
  perfil: 'administrador' | 'usuario'
  ativo: boolean
  avatar?: string | null
  permissoes: PermissaoModulo[]
}

interface AuthContextType {
  user: UsuarioLogado | null
  isAuthenticated: boolean
  isAdministrador: boolean
  temPermissao: (modulo: ModuloPermissao) => boolean
  nivelPermissao: (modulo: ModuloPermissao) => NivelPermissao
  getModulePermission: (modulo: ModuloPermissao) => NivelPermissao
  canViewModule: (modulo: ModuloPermissao) => boolean
  canEditModule: (modulo: ModuloPermissao) => boolean
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

/**
 * Carrega o perfil e as permissões de quem está na sessão.
 *
 * As mesmas regras valem no banco, em RLS: isto aqui é o que a tela usa para
 * decidir o que desenhar, não o que autoriza. Se as duas discordarem, quem
 * decide é o banco — e a tela apenas mostra um erro.
 */
async function carregarUsuario(session: Session | null): Promise<UsuarioLogado | null> {
  if (!session?.user) return null

  const { data: perfil, error } = await supabase
    .from('users')
    .select('id, email, name, perfil, ativo, avatar')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error || !perfil || perfil.ativo === false) return null

  const { data: permissoes } = await supabase
    .from('permissoes')
    .select('modulo, nivel')
    .eq('usuario', session.user.id)

  return {
    id: perfil.id,
    email: perfil.email,
    name: perfil.name ?? '',
    perfil: perfil.perfil,
    ativo: perfil.ativo,
    avatar: perfil.avatar,
    permissoes: (permissoes ?? []) as PermissaoModulo[],
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UsuarioLogado | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = user !== null
  const isAdministrador = user?.perfil === 'administrador'

  /**
   * Nível de acesso da pessoa num módulo.
   *
   * Sem permissão registrada o resultado é 'sem_acesso'. Antes era o contrário
   * — lista vazia liberava tudo —, e era o achado S-04 da auditoria: quem fosse
   * cadastrado e esquecido nascia com acesso total.
   */
  const getModulePermission = useCallback(
    (modulo: ModuloPermissao): NivelPermissao => {
      if (!user || !user.ativo) return 'sem_acesso'
      if (user.perfil === 'administrador') return 'edicao'

      return user.permissoes.find((p) => p.modulo === modulo)?.nivel ?? 'sem_acesso'
    },
    [user],
  )

  const canViewModule = useCallback(
    (modulo: ModuloPermissao): boolean => {
      const nivel = getModulePermission(modulo)
      return nivel === 'visualizacao' || nivel === 'edicao'
    },
    [getModulePermission],
  )

  const canEditModule = useCallback(
    (modulo: ModuloPermissao): boolean => getModulePermission(modulo) === 'edicao',
    [getModulePermission],
  )

  useEffect(() => {
    let ativo = true

    supabase.auth.getSession().then(async ({ data }) => {
      const carregado = await carregarUsuario(data.session)
      if (!ativo) return
      setUser(carregado)
      setLoading(false)
    })

    const { data: assinatura } = supabase.auth.onAuthStateChange(async (evento, session) => {
      // A recuperação de senha abre uma sessão de propósito curto: quem chegou
      // por ela está na tela de trocar a senha, não navegando pelo sistema.
      if (evento === 'PASSWORD_RECOVERY') return

      const carregado = await carregarUsuario(session)
      if (!ativo) return
      setUser(carregado)
      setLoading(false)
    })

    return () => {
      ativo = false
      assinatura.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name || '' } },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) return { error }

    const carregado = await carregarUsuario(data.session)
    if (!carregado) {
      await supabase.auth.signOut()
      return {
        error: {
          message:
            'Sua conta não está ativa no sistema. Procure um administrador do Controle de Imóveis.',
        },
      }
    }

    setUser(carregado)
    return { error: null }
  }

  const signOut = () => {
    supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdministrador,
        temPermissao: canViewModule,
        nivelPermissao: getModulePermission,
        getModulePermission,
        canViewModule,
        canEditModule,
        signUp,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
