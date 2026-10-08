import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/dados/supabase'
import { aoSessaoTerminar, guardarAvisoDeLogin } from '@/lib/dados/sessao'
import { nivelDoPerfil, type ModuloPermissao, type NivelPermissao, type PerfilUsuario } from '@/lib/constants'

interface UsuarioLogado {
  id: string
  email: string
  name: string
  perfil: PerfilUsuario
  ativo: boolean
  avatar?: string | null
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
  signUp: (
    email: string,
    password: string,
    name?: string,
    conviteToken?: string,
  ) => Promise<{ error: any }>
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
 * Carrega o perfil de quem está na sessão. O perfil decide o acesso
 * (administrador: tudo; gratuito: MODULOS_DO_GRATUITO).
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

  return {
    id: perfil.id,
    email: perfil.email,
    name: perfil.name ?? '',
    perfil: perfil.perfil,
    ativo: perfil.ativo,
    avatar: perfil.avatar,
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UsuarioLogado | null>(null)
  const [loading, setLoading] = useState(true)

  const usuarioAtual = useRef<UsuarioLogado | null>(null)
  usuarioAtual.current = user

  const isAuthenticated = user !== null
  const isAdministrador = user?.perfil === 'administrador'

  /**
   * Nível de acesso da pessoa num módulo, decidido pelo perfil — o mesmo que
   * public.nivel_no_modulo decide no banco. Sem sessão ou conta inativa:
   * 'sem_acesso' (falha fechando, achado S-04).
   */
  const getModulePermission = useCallback(
    (modulo: ModuloPermissao): NivelPermissao => {
      if (!user || !user.ativo) return 'sem_acesso'
      return nivelDoPerfil(user.perfil, modulo)
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

    // O banco recusou por sessão vencida ou ausente: sai daqui, o ProtectedRoute leva
    // para /login guardando a rota, e a tela de entrada explica o que houve (FIN-13).
    const cancelar = aoSessaoTerminar(() => {
      if (!usuarioAtual.current) return
      guardarAvisoDeLogin()
      supabase.auth.signOut({ scope: 'local' })
      setUser(null)
    })

    return () => {
      ativo = false
      cancelar()
      assinatura.subscription.unsubscribe()
    }
  }, [])

  // O token do convite vai junto do cadastro: o banco só dá o perfil do convite e
  // ativa a conta se o token bater com o do convite pendente daquele e-mail. Sem
  // ele a conta nasce inativa e espera um administrador liberar.
  const signUp = async (email: string, password: string, name?: string, conviteToken?: string) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name || '', ...(conviteToken ? { convite_token: conviteToken } : {}) },
      },
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
            'Sua conta não está ativa. Procure um administrador do sistema.',
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
