import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, LogOut, ShieldCheck } from 'lucide-react'
import dados from '@/lib/dados/cliente'
import { MODULES_LIST } from '@/lib/constants'
import { useAuth } from '@/hooks/use-auth'
import { NOME_DO_SISTEMA } from '@/lib/marca'
import { cn } from '@/lib/utils'
import { ControleDeFonte } from '@/components/ControleDeFonte'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  onOpenMobileSidebar: () => void
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [alertasCount, setAlertasCount] = useState<number>(0)

  // Realtime alerts count check for the header badge
  useEffect(() => {
    const calcDaysDiff = (dateStr: string): number => {
      if (!dateStr) return 999
      const target = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      target.setHours(0, 0, 0, 0)
      return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    const checkAlerts = async () => {
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
        contratos.forEach((c) => {
          if (c.status === 'ativo' && c.data_fim && calcDaysDiff(c.data_fim) <= 30) count++
          if (
            c.status === 'ativo' &&
            c.proxima_data_reajuste &&
            calcDaysDiff(c.proxima_data_reajuste) <= 30
          )
            count++
        })
        iptuTaxas.forEach((taxa) => {
          if (
            taxa.status !== 'pago' &&
            (taxa.status === 'vencido' || calcDaysDiff(taxa.vencimento) <= 30)
          )
            count++
        })
        receitas.forEach((rec) => {
          if (
            rec.status_financeiro !== 'recebido' &&
            (rec.status_financeiro === 'em_atraso' ||
              calcDaysDiff(rec.data_vencimento || rec.data) <= 30)
          )
            count++
        })
        despesas.forEach((desp) => {
          if (
            desp.status_financeiro !== 'pago' &&
            (desp.status_financeiro === 'em_atraso' ||
              calcDaysDiff(desp.data_vencimento || desp.data) <= 30)
          )
            count++
        })
        setAlertasCount(count)
      } catch {
        // ignore
      }
    }

    checkAlerts()
  }, [location.pathname])

  const currentModule = MODULES_LIST.find((m) => location.pathname.startsWith(m.path))
  const pageTitle = currentModule ? currentModule.title : NOME_DO_SISTEMA

  const getUserInitials = () => {
    if (!user) return 'HA'
    if (user.name) {
      const parts = user.name.trim().split(' ')
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      return user.name.substring(0, 2).toUpperCase()
    }
    if (user.email) return user.email.substring(0, 2).toUpperCase()
    return 'HA'
  }

  const nomeDoUsuario = user?.name || 'Administrador'

  const menuDaConta = (tamanho: 'h-11 w-11' | 'h-12 w-12') => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Minha conta: ${nomeDoUsuario}`}
          className={cn(
            'blob-1 flex shrink-0 items-center justify-center bg-accent font-extrabold text-accent-foreground transition-transform duration-300 hover:scale-105',
            tamanho,
          )}
        >
          {getUserInitials()}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1 p-1">
            <p className="text-base font-extrabold leading-tight">{nomeDoUsuario}</p>
            {user?.email && <p className="truncate text-sm text-accent-foreground">{user.email}</p>}
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Sócio / Gestor
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={signOut}
          className="cursor-pointer gap-2 font-bold text-red-800 focus:bg-destructive/10 focus:text-red-800"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Sair da conta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      {/* Celular e tablet: cabeçalho flutuante em pílula. */}
      <header className="sticky top-3 z-30 mx-4 mt-3 flex items-center gap-2.5 rounded-full border border-border/60 bg-card/75 p-1.5 shadow-soft backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label={alertasCount > 0 ? `Abrir menu (${alertasCount} alertas)` : 'Abrir menu'}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
          {alertasCount > 0 && (
            <span
              aria-hidden="true"
              className="numero absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-1 text-xs font-extrabold text-destructive-foreground ring-2 ring-card"
            >
              {alertasCount > 99 ? '99+' : alertasCount}
            </span>
          )}
        </button>
        <p className="min-w-0 flex-1 truncate font-serif text-lg font-bold">{pageTitle}</p>
        {menuDaConta('h-11 w-11')}
      </header>

      {/* Computador: tamanho da letra e conta no alto, à direita. */}
      <div className="hidden items-center justify-end gap-3 px-12 pt-6 lg:flex">
        <ControleDeFonte />
        {menuDaConta('h-12 w-12')}
      </div>
    </>
  )
}
