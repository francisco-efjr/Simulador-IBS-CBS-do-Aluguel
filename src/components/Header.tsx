import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, User, LogOut, ShieldCheck } from 'lucide-react'
import dados from '@/lib/dados/cliente'
import { MODULES_LIST } from '@/lib/constants'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ControleDeFonte } from '@/components/ControleDeFonte'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import symbolLogo from '@/assets/chatgpt-image-aug-7-2026-061736-pm-2-f5529.png'

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

  const currentModule = MODULES_LIST.find((m) =>
    m.path === '/' ? location.pathname === '/' : location.pathname.startsWith(m.path),
  )

  const pageTitle = currentModule ? currentModule.title : 'Controle de Imóveis'

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

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-navy-700/50 bg-navy-800/95 px-4 text-white backdrop-blur-md transition-all sm:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative lg:hidden text-slate-200 hover:bg-navy-700 hover:text-gold-400 h-10 w-10 shrink-0"
          onClick={onOpenMobileSidebar}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
          {alertasCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-bold text-navy-950 shadow-xs ring-2 ring-navy-800">
              {alertasCount > 99 ? '99+' : alertasCount}
            </span>
          )}
        </Button>
        <div className="flex items-center gap-2.5">
          <Link to="/inicio" className="lg:hidden flex items-center shrink-0">
            <img
              src={symbolLogo}
              alt="Holding Aguiar"
              className="h-8 w-8 object-contain rounded-md"
            />
          </Link>
          {/* A barra superior identifica o sistema; o nome da tela é do
              conteúdo, onde já aparece em tamanho de título. Repetir os dois
              ocupava a faixa mais nobre da janela com a mesma palavra. */}
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white sm:text-lg">
              Holding Aguiar
            </span>
            <span className="text-xs font-medium text-slate-300 hidden sm:inline-block">
              {pageTitle}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ControleDeFonte />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Abrir menu da conta"
              className="flex min-h-[44px] items-center gap-3 rounded-full p-1 transition-colors hover:bg-navy-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-800"
            >
              <Avatar className="h-9 w-9 border-2 border-gold-500 bg-navy-900 text-gold-400 font-bold shadow-sm">
                <AvatarFallback className="bg-navy-900 text-gold-400">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col text-left md:flex">
                <span className="text-sm font-semibold text-slate-100 leading-tight">
                  {user?.name || 'Administrador'}
                </span>
                <span className="text-xs text-gold-300 font-medium truncate">
                  {user?.email || 'Holding Aguiar'}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-1 bg-navy-800 text-slate-100 border-navy-700 shadow-xl"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 p-1">
                <p className="text-sm font-semibold leading-none text-white">
                  {user?.name || 'Administrador'}
                </p>
                <p className="text-xs leading-none text-slate-300 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-xs font-medium text-gold-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Sócio / Gestor</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-navy-700" />
            <DropdownMenuItem className="cursor-pointer gap-2 text-slate-200 focus:bg-navy-700 focus:text-gold-300">
              <User className="h-4 w-4 text-gold-400" />
              <span>Perfil do Usuário</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-navy-700" />
            <DropdownMenuItem
              onClick={signOut}
              className="cursor-pointer gap-2 text-red-400 focus:bg-red-500/20 focus:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
