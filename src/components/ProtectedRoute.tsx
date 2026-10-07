import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import type { ModuloPermissao } from '@/lib/constants'
import { toast } from 'sonner'

interface ProtectedRouteProps {
  requireAdmin?: boolean
  modulo?: ModuloPermissao
}

export function ProtectedRoute({ requireAdmin = false, modulo }: ProtectedRouteProps) {
  const { isAuthenticated, isAdministrador, canViewModule, loading } = useAuth()
  const location = useLocation()

  const hasAccess = (() => {
    if (requireAdmin && !isAdministrador) return false
    if (modulo && !canViewModule(modulo)) return false
    return true
  })()

  useEffect(() => {
    if (!loading && isAuthenticated && !hasAccess) {
      toast.error('Você não tem permissão para acessar esta área. Fale com quem administra o sistema.')
    }
  }, [loading, isAuthenticated, hasAccess])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none" />
          <p className="text-sm font-bold text-accent-foreground">Carregando Gestão de imóveis…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!hasAccess) {
    return <Navigate to="/inicio" replace />
  }

  return <Outlet />
}
