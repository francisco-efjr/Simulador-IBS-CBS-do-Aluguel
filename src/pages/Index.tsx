import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, FileText, TrendingUp, ArrowUpRight, AlertCircle } from 'lucide-react'
import { MODULES_LIST } from '@/lib/constants'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { FeedDeAtividades } from '@/components/inicio/FeedDeAtividades'
import { Card, CardContent } from '@/components/ui/card'
import { getImoveis } from '@/services/imoveis'
import { getInquilinos } from '@/services/inquilinos'
import { getContratos } from '@/services/contratos'
import { getReceitas } from '@/services/receitas'

const ESTATISTICAS_VAZIAS = {
  imoveis: '—',
  inquilinos: '—',
  contratos: '—',
  receitas: '—',
}

const ESPERA_DA_RECARGA_MS = 800

export default function Index() {
  const { user, isAdministrador, canViewModule } = useAuth()
  const userName = user?.name ? user.name.split(' ')[0] : 'Usuário'

  const [stats, setStats] = useState(ESTATISTICAS_VAZIAS)
  const [erroNasEstatisticas, setErroNasEstatisticas] = useState(false)
  const montado = useRef(true)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  const carregarEstatisticas = useCallback(async () => {
    try {
      const [ims, inqs, cts, recs] = await Promise.all([
        getImoveis(),
        getInquilinos(),
        getContratos(),
        getReceitas(),
      ])
      if (!montado.current) return
      const activeInqs = inqs.filter((i) => i.status === 'ativo').length
      const activeCts = cts.filter((c) => c.status === 'ativo').length
      const totalRec = recs.reduce(
        (acc, r) => acc + (Number(r.valor_recebido) || Number(r.valor) || 0),
        0,
      )
      setStats({
        imoveis: String(ims.length),
        inquilinos: String(activeInqs),
        contratos: String(activeCts),
        receitas: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        }).format(totalRec),
      })
      setErroNasEstatisticas(false)
    } catch (erro) {
      if (!montado.current) return
      console.error('Não foi possível carregar os números do Início.', erro)
      // Número velho ou inventado engana; melhor "—" e um aviso.
      setStats(ESTATISTICAS_VAZIAS)
      setErroNasEstatisticas(true)
    }
  }, [])

  useEffect(() => {
    montado.current = true
    carregarEstatisticas()
    return () => {
      montado.current = false
      if (temporizador.current) clearTimeout(temporizador.current)
    }
  }, [carregarEstatisticas])

  // Os números se refazem sozinhos quando alguém grava algo. Várias mudanças
  // seguidas (uma importação, por exemplo) viram uma recarga só.
  const agendarRecarga = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(carregarEstatisticas, ESPERA_DA_RECARGA_MS)
  }, [carregarEstatisticas])

  useRealtime('imoveis', agendarRecarga)
  useRealtime('inquilinos', agendarRecarga)
  useRealtime('contratos', agendarRecarga)
  useRealtime('receitas', agendarRecarga)

  const overviewCards = [
    {
      title: 'Imóveis Cadastrados',
      value: stats.imoveis,
      icon: Building2,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      title: 'Inquilinos Ativos',
      value: stats.inquilinos,
      icon: Users,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      title: 'Contratos Vigentes',
      value: stats.contratos,
      icon: FileText,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      title: 'Receitas Totais',
      value: stats.receitas,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-elevation">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur-md mb-3">
            <span>Holding Aguiar</span>
            <span>•</span>
            <span>Sistema de Gestão</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
            Bem-vindo ao Controle de Imóveis, {userName}!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-indigo-100 leading-relaxed">
            Sua plataforma centralizada para administração de patrimônio, gestão de inquilinos,
            contratos e fluxo de caixa financeiro.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      </div>

      <div className="space-y-3">
        {erroNasEstatisticas && (
          <p className="flex items-center gap-2 text-sm text-slate-700" role="status">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            Não foi possível carregar os números agora. Recarregue a página em instantes.
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <Card
                key={idx}
                className="border border-slate-200/80 bg-white transition-all hover:shadow-elevation hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">{card.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {isAdministrador && <FeedDeAtividades />}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Módulos do Sistema</h2>
          <span className="text-xs font-medium text-slate-600">
            {MODULES_LIST.length} módulos disponíveis
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES_LIST.filter((module) => {
            // O próprio Início não vira cartão dentro do Início.
            if (module.path === '/' || module.path === '/inicio') return false
            if (module.adminOnly && !isAdministrador) return false
            if (module.modulo && !canViewModule(module.modulo)) return false
            return true
          }).map((module) => {
            const Icon = module.icon
            return (
              <Link
                key={module.path}
                to={module.path}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-elevation"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-600 opacity-0 transition-all group-hover:opacity-100 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {module.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {module.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 group-hover:text-indigo-600">
                  <span>Acessar módulo</span>
                  <span>→</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
