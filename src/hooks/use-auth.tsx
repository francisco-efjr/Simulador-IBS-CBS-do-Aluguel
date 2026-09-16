import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import type { ModuloPermissao, NivelPermissao } from '@/lib/constants'

interface AuthContextType {
  user: any
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.isValid ? pb.authStore.record : null)
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
  const [loading, setLoading] = useState(true)

  const isAdministrador = user?.perfil === 'administrador' || user?.perfil === 'admin'

  /**
   * Helper function to get the permission level for a given module.
   * Rules:
   * - If user is Admin (or Administrador), always 'edicao'
   * - If user is regular and permissoes is missing or empty array -> retrocompatible: 'edicao' (full access)
   * - If user has configured permissoes -> look up the module level:
   *   - If not found in array, defaults to 'sem_acesso'
   */
  const getModulePermission = useCallback(
    (modulo: ModuloPermissao): NivelPermissao => {
      if (!user) return 'sem_acesso'
      if (isAdministrador) return 'edicao'

      const permissoes = user.permissoes
      // Backward compatibility: If no permissions array or empty array, user sees all with full edit
      if (!permissoes || !Array.isArray(permissoes) || permissoes.length === 0) {
        return 'edicao'
      }

      const match = permissoes.find((p: any) => p.modulo === modulo)
      if (!match) {
        return 'sem_acesso'
      }

      return match.nivel || 'sem_acesso'
    },
    [user, isAdministrador],
  )

  /**
   * Check if user can view a module (level 'visualizacao' or 'edicao')
   */
  const canViewModule = useCallback(
    (modulo: ModuloPermissao): boolean => {
      const level = getModulePermission(modulo)
      return level === 'visualizacao' || level === 'edicao'
    },
    [getModulePermission],
  )

  /**
   * Check if user can edit / create / delete in a module (level 'edicao')
   */
  const canEditModule = useCallback(
    (modulo: ModuloPermissao): boolean => {
      const level = getModulePermission(modulo)
      return level === 'edicao'
    },
    [getModulePermission],
  )

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(pb.authStore.isValid ? record : null)
      setIsAuthenticated(pb.authStore.isValid)
    })

    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then(() => {
          const record = pb.authStore.record as any
          if (record && record.ativo === false) {
            pb.authStore.clear()
          }
        })
        .catch(() => pb.authStore.clear())
        .finally(() => setLoading(false))
    } else {
      if (pb.authStore.record) pb.authStore.clear()
      setLoading(false)
    }
    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name: name || '',
        ativo: true,
        perfil: 'usuario',
      })
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      const record = pb.authStore.record as any
      if (record && record.ativo === false) {
        pb.authStore.clear()
        return {
          error: {
            message: 'Sua conta foi desativada. Entre em contato com o administrador.',
          },
        }
      }
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
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
