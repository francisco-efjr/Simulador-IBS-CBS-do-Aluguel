import { Link, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { MODULES_LIST } from '@/lib/constants'
import { useAuth } from '@/hooks/use-auth'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import darkLogo from '@/assets/chatgpt-image-aug-7-2026-061737-pm-5-f38c6.png'
import symbolLogo from '@/assets/chatgpt-image-aug-7-2026-061736-pm-2-f5529.png'

interface SidebarContentProps {
  isTabletRail?: boolean
  onItemClick?: () => void
}

export function SidebarContent({ isTabletRail = false, onItemClick }: SidebarContentProps) {
  const location = useLocation()
  const { signOut, isAdministrador, canViewModule } = useAuth()

  // Realtime alerts count for badge
  const [alertasCount, setAlertasCount] = useState<number>(0)
  // Realtime pending invites count for badge
  const [convitesPendentesCount, setConvitesPendentesCount] = useState<number>(0)

  const calcDaysDiff = (dateStr: string): number => {
    if (!dateStr) return 999
    const target = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const computeActiveAlerts = useCallback(async () => {
    try {
      const [contratos, iptuTaxas, receitas, despesas] = await Promise.all([
        pb
          .collection('contratos')
          .getFullList({ fields: 'id,status,data_fim,proxima_data_reajuste' }),
        pb.collection('iptu_taxas').getFullList({ fields: 'id,status,vencimento' }),
        pb
          .collection('receitas')
          .getFullList({ fields: 'id,status_financeiro,data_vencimento,data' }),
        pb
          .collection('despesas')
          .getFullList({ fields: 'id,status_financeiro,data_vencimento,data' }),
      ])

      let count = 0

      // 1. Contratos termino/reajuste <= 30 dias ou vencidos
      contratos.forEach((c) => {
        if (c.status === 'ativo' && c.data_fim) {
          const dias = calcDaysDiff(c.data_fim)
          if (dias <= 30) count++
        }
        if (c.status === 'ativo' && c.proxima_data_reajuste) {
          const dias = calcDaysDiff(c.proxima_data_reajuste)
          if (dias <= 30) count++
        }
      })

      // 2. IPTU
      iptuTaxas.forEach((taxa) => {
        if (taxa.status !== 'pago') {
          const dias = calcDaysDiff(taxa.vencimento)
          if (taxa.status === 'vencido' || dias <= 30) count++
        }
      })

      // 3. Receitas
      receitas.forEach((rec) => {
        if (rec.status_financeiro !== 'recebido') {
          const dt = rec.data_vencimento || rec.data
          const dias = calcDaysDiff(dt)
          if (rec.status_financeiro === 'em_atraso' || dias <= 30) count++
        }
      })

      // 4. Despesas
      despesas.forEach((desp) => {
        if (desp.status_financeiro !== 'pago') {
          const dt = desp.data_vencimento || desp.data
          const dias = calcDaysDiff(dt)
          if (desp.status_financeiro === 'em_atraso' || dias <= 30) count++
        }
      })

      setAlertasCount(count)
    } catch {
      // ignore
    }
  }, [])

  const computePendingInvites = useCallback(async () => {
    if (!isAdministrador) {
      setConvitesPendentesCount(0)
      return
    }
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await pb.collection('convites').getList(1, 1, {
        filter: `status = 'pendente' && data_expiracao >= '${today}'`,
        fields: 'id',
      })
      setConvitesPendentesCount(res.totalItems)
    } catch {
      // ignore
    }
  }, [isAdministrador])

  useEffect(() => {
    computeActiveAlerts()
    computePendingInvites()
  }, [computeActiveAlerts, computePendingInvites])

  useRealtime('contratos', computeActiveAlerts)
  useRealtime('iptu_taxas', computeActiveAlerts)
  useRealtime('receitas', computeActiveAlerts)
  useRealtime('despesas', computeActiveAlerts)
  useRealtime('convites', computePendingInvites)

  return (
    <div className="flex h-full flex-col justify-between bg-navy-800 text-slate-100 border-r border-navy-700/60 shadow-xl">
      <div>
        <div
          className={cn(
            'flex items-center border-b border-navy-700/80 px-4 py-4 transition-all',
            isTabletRail ? 'justify-center px-2 py-4' : 'px-5 py-4',
          )}
        >
          {isTabletRail ? (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 p-1.5 border border-gold-500/30 shadow-md transition-transform hover:scale-105"
                >
                  <img
                    src={symbolLogo}
                    alt="Holding Aguiar"
                    className="h-8 w-8 object-contain rounded-md"
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="font-semibold bg-navy-900 text-gold-400 border border-gold-500/30"
              >
                Holding Aguiar
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={darkLogo}
                alt="Holding Aguiar"
                className="h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
            </Link>
          )}
        </div>

        <nav className="space-y-1.5 p-3">
          {MODULES_LIST.filter((item) => {
            // Admin-only modules (Usuarios, Logs de Atividade)
            if (item.adminOnly && !isAdministrador) return false
            // Granular permission check for regular modules
            if (item.modulo && !canViewModule(item.modulo)) return false
            return true
          }).map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
            const isUsuarios = item.path === '/usuarios'
            const isAlertas = item.path === '/alertas'

            const linkContent = (
              <Link
                key={item.path}
                to={item.path}
                onClick={onItemClick}
                className={cn(
                  'group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                  isTabletRail ? 'h-11 w-11 justify-center' : 'gap-3 px-3.5 py-2.5',
                  isActive
                    ? 'bg-gold-500/15 text-gold-400 font-semibold shadow-xs border border-gold-500/20'
                    : 'text-slate-300 hover:bg-navy-700/70 hover:text-white',
                )}
              >
                {isActive && (
                  <span
                    className={cn(
                      'absolute left-0 rounded-r-full bg-gold-500 transition-all shadow-gold',
                      isTabletRail ? 'bottom-2 top-2 w-1' : 'bottom-1.5 top-1.5 w-1',
                    )}
                  />
                )}
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-gold-400' : 'text-slate-400 group-hover:text-gold-300',
                  )}
                />
                {!isTabletRail && <span className="truncate flex-1">{item.title}</span>}
                {!isTabletRail && isAlertas && alertasCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-xs">
                    {alertasCount}
                  </span>
                )}
                {isTabletRail && isAlertas && alertasCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-navy-800" />
                )}

                {!isTabletRail && isUsuarios && convitesPendentesCount > 0 && (
                  <span
                    className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full bg-gold-500 text-navy-950 shadow-xs"
                    title={`${convitesPendentesCount} convite(s) pendente(s)`}
                  >
                    {convitesPendentesCount}
                  </span>
                )}
                {isTabletRail && isUsuarios && convitesPendentesCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-gold-500 ring-2 ring-navy-800" />
                )}
              </Link>
            )

            if (isTabletRail) {
              return (
                <Tooltip key={item.path} delayDuration={100}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="font-medium bg-navy-900 text-slate-100 border border-navy-700"
                  >
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkContent
          })}
        </nav>
      </div>

      <div className="border-t border-navy-700/80 p-3">
        {isTabletRail ? (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="text-red-400 font-medium bg-navy-900 border border-red-500/20"
            >
              Sair do sistema
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/15 hover:text-red-400 active:scale-[0.98] group"
          >
            <LogOut className="h-5 w-5 text-slate-400 transition-colors group-hover:text-red-400" />
            <span>Sair do sistema</span>
          </button>
        )}
      </div>
    </div>
  )
}
