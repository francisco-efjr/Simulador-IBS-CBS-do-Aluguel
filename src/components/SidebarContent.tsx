import { Link, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { GRUPOS_MENU, MODULES_LIST } from '@/lib/constants'
import { CLIENTE, NOME_DO_SISTEMA } from '@/lib/marca'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import dados from '@/lib/dados/cliente'
import { useRealtime } from '@/hooks/use-realtime'
import { ControleDeFonte } from '@/components/ControleDeFonte'
import { CreditoAguia, LogoSistema } from '@/components/organico'

interface SidebarContentProps {
  /** Dentro da gaveta do celular: itens maiores e o controle de letra no topo. */
  emGaveta?: boolean
  onItemClick?: () => void
}

/**
 * Menu do sistema (AppShell do handoff): grupos com rótulo em caixa alta,
 * itens em pílula, item ativo em musgo com `aria-current="page"`. O mesmo
 * conteúdo serve ao menu fixo (≥ 1024px) e à gaveta do celular.
 */
export function SidebarContent({ emGaveta = false, onItemClick }: SidebarContentProps) {
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
        dados
          .colecao('contratos')
          .getFullList({ fields: 'id,status,data_fim,proxima_data_reajuste' }),
        dados.colecao('iptu_taxas').getFullList({ fields: 'id,status,vencimento' }),
        dados
          .colecao('receitas')
          .getFullList({ fields: 'id,status_financeiro,data_vencimento,data' }),
        dados
          .colecao('despesas')
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
      const today = new Date().toISOString()
      const res = await dados.colecao('convites').getList(1, 1, {
        where: [
          ['status', '=', 'pendente'],
          ['data_expiracao', '>=', today],
        ],
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

  const visiveis = MODULES_LIST.filter((item) => {
    // Módulos só de administrador (Usuários, Logs de atividade)
    if (item.adminOnly && !isAdministrador) return false
    // Permissão por módulo
    if (item.modulo && !canViewModule(item.modulo)) return false
    return true
  })

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 bg-sunken text-foreground">
      <div className={cn('flex shrink-0 items-center gap-3', emGaveta ? 'pr-14' : 'px-2')}>
        <Link
          to="/inicio"
          onClick={onItemClick}
          className="flex min-h-11 items-center gap-3 rounded-full pr-2 no-underline"
        >
          <LogoSistema />
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-bold text-foreground">{NOME_DO_SISTEMA}</span>
            <span className="text-xs font-bold text-accent-foreground">{CLIENTE}</span>
          </span>
        </Link>
      </div>

      {emGaveta && <ControleDeFonte className="self-start md:hidden" />}

      <nav
        aria-label="Menu principal"
        className="-mx-1 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-2"
      >
        {GRUPOS_MENU.map((grupo) => {
          const itens = visiveis.filter((item) => item.grupo === grupo)
          if (itens.length === 0) return null
          return (
            <div key={grupo} className="flex flex-col gap-0.5">
              <p className="px-3.5 pb-1 text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
                {grupo}
              </p>
              {itens.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.path)
                const contagem =
                  item.path === '/alertas'
                    ? alertasCount
                    : item.path === '/usuarios'
                      ? convitesPendentesCount
                      : 0
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onItemClick}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-full px-3.5 no-underline transition-colors duration-300',
                      emGaveta ? 'min-h-12 text-base' : 'min-h-11 text-sm',
                      isActive
                        ? 'bg-primary font-extrabold text-primary-foreground'
                        : 'font-semibold text-foreground hover:bg-primary/10',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.title}</span>
                    {contagem > 0 && (
                      <span
                        className={cn(
                          'numero inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-extrabold',
                          isActive
                            ? 'bg-primary-foreground text-primary'
                            : item.path === '/alertas'
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-accent text-accent-foreground',
                        )}
                      >
                        {contagem}
                        <span className="sr-only">
                          {item.path === '/alertas' ? ' alertas ativos' : ' convites pendentes'}
                        </span>
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-dashed border-border px-1 pt-3">
        <button
          type="button"
          onClick={signOut}
          className="foco-interno flex min-h-11 w-full items-center gap-3 rounded-full px-3.5 text-sm font-bold text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Sair do sistema
        </button>
        <CreditoAguia className="px-3.5" />
      </div>
    </div>
  )
}
