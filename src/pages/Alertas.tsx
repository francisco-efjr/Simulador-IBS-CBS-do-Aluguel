import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  Receipt,
  TrendingUp,
  TrendingDown,
  Building2,
  RefreshCw,
  Filter,
  ExternalLink,
  ChevronRight,
  Eye,
  ArrowUpDown,
  Search,
} from 'lucide-react'
import dados from '@/lib/dados/cliente'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, formatDate } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import { ContratoDetailDialog } from '@/components/contratos/ContratoDetailDialog'
import { ContratoFormDialog } from '@/components/contratos/ContratoFormDialog'
import { ReceitaDetailDialog } from '@/components/receitas/ReceitaDetailDialog'
import { ReceitaFormDialog } from '@/components/receitas/ReceitaFormDialog'
import { DespesaDetailDialog } from '@/components/despesas/DespesaDetailDialog'
import { DespesaFormDialog } from '@/components/despesas/DespesaFormDialog'
import { IptuTaxaDetailDialog } from '@/components/iptu-taxas/IptuTaxaDetailDialog'
import { IptuTaxaFormDialog } from '@/components/iptu-taxas/IptuTaxaFormDialog'
import { deleteReceita } from '@/services/receitas'
import { deleteDespesa } from '@/services/despesas'
import { deleteIptuTaxa } from '@/services/iptu-taxas'
import { toast } from 'sonner'

export type AlertType =
  | 'contrato_termino'
  | 'contrato_reajuste'
  | 'iptu_vencimento'
  | 'receita_vencimento'
  | 'despesa_vencimento'
  | 'receita_vencida'
  | 'despesa_vencida'
  | 'iptu_vencido'

export interface AlertItem {
  id: string
  tipo: AlertType
  categoriaAba: 'contratos' | 'iptu' | 'receitas' | 'despesas'
  titulo: string
  descricao: string
  imovelId?: string
  imovelNome: string
  imovelCodigo?: string
  dataVencimento: string
  diasRestantes: number // negativo = vencido, positivo = a vencer
  isVencido: boolean
  valor?: number
  rawRecord: any
  linkRota: string
}

export default function Alertas() {
  const navigate = useNavigate()

  // Filters state
  const [selectedTab, setSelectedTab] = useState<string>('todos')
  const [filterPeriodo, setFilterPeriodo] = useState<string>('30') // '7', '15', '30', 'todos'
  const [filterImovel, setFilterImovel] = useState<string>('all')
  const [filterTipoAlerta, setFilterTipoAlerta] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Data state
  const [contratos, setContratos] = useState<any[]>([])
  const [iptuTaxas, setIptuTaxas] = useState<any[]>([])
  const [receitas, setReceitas] = useState<any[]>([])
  const [despesas, setDespesas] = useState<any[]>([])
  const [imoveis, setImoveis] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Dialog details state
  const [selectedContrato, setSelectedContrato] = useState<any | null>(null)
  const [editingContrato, setEditingContrato] = useState<any | null>(null)
  const [showContratoDetail, setShowContratoDetail] = useState(false)
  const [showContratoForm, setShowContratoForm] = useState(false)

  const [selectedReceita, setSelectedReceita] = useState<any | null>(null)
  const [editingReceita, setEditingReceita] = useState<any | null>(null)
  const [showReceitaDetail, setShowReceitaDetail] = useState(false)
  const [showReceitaForm, setShowReceitaForm] = useState(false)

  const [selectedDespesa, setSelectedDespesa] = useState<any | null>(null)
  const [editingDespesa, setEditingDespesa] = useState<any | null>(null)
  const [showDespesaDetail, setShowDespesaDetail] = useState(false)
  const [showDespesaForm, setShowDespesaForm] = useState(false)

  const [selectedIptu, setSelectedIptu] = useState<any | null>(null)
  const [editingIptu, setEditingIptu] = useState<any | null>(null)
  const [showIptuDetail, setShowIptuDetail] = useState(false)
  const [showIptuForm, setShowIptuForm] = useState(false)

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [imoveisData, contratosData, iptuData, receitasData, despesasData] = await Promise.all([
        dados.colecao('imoveis').getFullList({ sort: 'nome,codigo,endereco' }),
        dados.colecao('contratos').getFullList({ sort: '-created', expand: 'imovel,inquilino' }),
        dados.colecao('iptu_taxas').getFullList({ sort: '-created', expand: 'imovel' }),
        dados.colecao('receitas').getFullList({
          sort: '-created',
          expand: 'imovel,inquilino,categoria,contrato',
        }),
        dados.colecao('despesas').getFullList({
          sort: '-created',
          expand: 'imovel,fornecedor,categoria',
        }),
      ])

      setImoveis(imoveisData)
      setContratos(contratosData)
      setIptuTaxas(iptuData)
      setReceitas(receitasData)
      setDespesas(despesasData)
    } catch (err) {
      console.error('Erro ao carregar alertas:', err)
      toast.error('Erro ao buscar dados de alertas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime
  useRealtime('imoveis', loadData)
  useRealtime('contratos', loadData)
  useRealtime('iptu_taxas', loadData)
  useRealtime('receitas', loadData)
  useRealtime('despesas', loadData)

  // Helpers
  const getImovelName = useCallback(
    (imovelId?: string, expandImovel?: any) => {
      if (expandImovel?.nome) return expandImovel.nome
      if (expandImovel?.endereco) return expandImovel.endereco
      if (imovelId) {
        const found = imoveis.find((im) => im.id === imovelId)
        if (found) return found.nome || found.endereco || `Imóvel #${found.codigo || found.id}`
      }
      return 'Imóvel não identificado'
    },
    [imoveis],
  )

  const calcDaysDiff = (dateStr: string): number => {
    if (!dateStr) return 999
    const target = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Parse all raw records into standardized AlertItem objects
  const allAlerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = []

    // 1. Contratos - Término nos próximos dias (status = 'ativo')
    contratos.forEach((c) => {
      if (c.status !== 'ativo' || !c.data_fim) return
      const dias = calcDaysDiff(c.data_fim)
      // Exibir se já venceu ou vence no futuro
      const isVencido = dias < 0
      const imNome = getImovelName(c.imovel, c.expand?.imovel)
      const numContrato = c.numero ? `Contrato Nº ${c.numero}` : `Contrato #${c.id.slice(0, 6)}`
      const inqNome = c.expand?.inquilino?.nome ? ` (${c.expand.inquilino.nome})` : ''

      list.push({
        id: `ct_term_${c.id}`,
        tipo: 'contrato_termino',
        categoriaAba: 'contratos',
        titulo: isVencido ? 'Término de Contrato Vencido' : 'Término de Contrato Próximo',
        descricao: `${numContrato}${inqNome} — Término da vigência`,
        imovelId: c.imovel,
        imovelNome: imNome,
        imovelCodigo: c.expand?.imovel?.codigo,
        dataVencimento: c.data_fim,
        diasRestantes: dias,
        isVencido,
        valor: c.valor_aluguel,
        rawRecord: c,
        linkRota: '/contratos',
      })
    })

    // 2. Contratos - Reajuste nos próximos dias (status = 'ativo')
    contratos.forEach((c) => {
      if (c.status !== 'ativo' || !c.proxima_data_reajuste) return
      const dias = calcDaysDiff(c.proxima_data_reajuste)
      const isVencido = dias < 0
      const imNome = getImovelName(c.imovel, c.expand?.imovel)
      const numContrato = c.numero ? `Contrato Nº ${c.numero}` : `Contrato #${c.id.slice(0, 6)}`
      const indice = c.indice_reajuste ? ` (${c.indice_reajuste})` : ''

      list.push({
        id: `ct_reaj_${c.id}`,
        tipo: 'contrato_reajuste',
        categoriaAba: 'contratos',
        titulo: isVencido ? 'Reajuste de Contrato Pendente' : 'Próximo Reajuste Contratual',
        descricao: `${numContrato} — Reajuste programado${indice}`,
        imovelId: c.imovel,
        imovelNome: imNome,
        imovelCodigo: c.expand?.imovel?.codigo,
        dataVencimento: c.proxima_data_reajuste,
        diasRestantes: dias,
        isVencido,
        valor: c.valor_aluguel,
        rawRecord: c,
        linkRota: '/contratos',
      })
    })

    // 3. IPTU e Taxas a vencer (status != 'pago' e não vencido) ou Vencidos (status == 'vencido' ou dias < 0)
    iptuTaxas.forEach((taxa) => {
      if (taxa.status === 'pago') return
      const dt = taxa.vencimento
      if (!dt) return
      const dias = calcDaysDiff(dt)
      const isVencido = taxa.status === 'vencido' || dias < 0
      const imNome = getImovelName(taxa.imovel, taxa.expand?.imovel)

      list.push({
        id: `iptu_${taxa.id}`,
        tipo: isVencido ? 'iptu_vencido' : 'iptu_vencimento',
        categoriaAba: 'iptu',
        titulo: isVencido ? 'IPTU / Taxa Vencida' : 'IPTU / Taxa a Vencer',
        descricao: taxa.descricao || 'Obrigação / Tributo imobiliário',
        imovelId: taxa.imovel,
        imovelNome: imNome,
        imovelCodigo: taxa.expand?.imovel?.codigo,
        dataVencimento: dt,
        diasRestantes: dias,
        isVencido,
        valor: taxa.valor,
        rawRecord: taxa,
        linkRota: '/iptu-taxas',
      })
    })

    // 4. Receitas a vencer (previsto) e Vencidas (em_atraso ou dias < 0)
    receitas.forEach((rec) => {
      if (rec.status_financeiro === 'recebido') return
      const dt = rec.data_vencimento || rec.data
      if (!dt) return
      const dias = calcDaysDiff(dt)
      const isVencido = rec.status_financeiro === 'em_atraso' || dias < 0
      const imNome = getImovelName(rec.imovel, rec.expand?.imovel)
      const inqNome = rec.expand?.inquilino?.nome ? ` • ${rec.expand.inquilino.nome}` : ''

      list.push({
        id: `rec_${rec.id}`,
        tipo: isVencido ? 'receita_vencida' : 'receita_vencimento',
        categoriaAba: 'receitas',
        titulo: isVencido ? 'Receita em Atraso (Inadimplência)' : 'Receita / Aluguel a Vencer',
        descricao: `${rec.descricao || 'Receita de locação'}${inqNome}`,
        imovelId: rec.imovel,
        imovelNome: imNome,
        imovelCodigo: rec.expand?.imovel?.codigo,
        dataVencimento: dt,
        diasRestantes: dias,
        isVencido,
        valor: rec.valor_previsto || rec.valor,
        rawRecord: rec,
        linkRota: '/receitas',
      })
    })

    // 5. Despesas a vencer (previsto) e Vencidas (em_atraso ou dias < 0)
    despesas.forEach((desp) => {
      if (desp.status_financeiro === 'pago') return
      const dt = desp.data_vencimento || desp.data
      if (!dt) return
      const dias = calcDaysDiff(dt)
      const isVencido = desp.status_financeiro === 'em_atraso' || dias < 0
      const imNome = getImovelName(desp.imovel, desp.expand?.imovel)
      const fornNome = desp.expand?.fornecedor?.nome ? ` • ${desp.expand.fornecedor.nome}` : ''

      list.push({
        id: `desp_${desp.id}`,
        tipo: isVencido ? 'despesa_vencida' : 'despesa_vencimento',
        categoriaAba: 'despesas',
        titulo: isVencido ? 'Despesa Vencida em Aberto' : 'Despesa / Conta a Vencer',
        descricao: `${desp.descricao || 'Despesa operacional'}${fornNome}`,
        imovelId: desp.imovel,
        imovelNome: imNome,
        imovelCodigo: desp.expand?.imovel?.codigo,
        dataVencimento: dt,
        diasRestantes: dias,
        isVencido,
        valor: desp.valor_previsto || desp.valor,
        rawRecord: desp,
        linkRota: '/despesas',
      })
    })

    // Sort by urgent first (vencidos first, then closest upcoming)
    list.sort((a, b) => a.diasRestantes - b.diasRestantes)

    return list
  }, [contratos, iptuTaxas, receitas, despesas, getImovelName])

  // Top summary KPI metrics (before applying the period filter, or based on all active alerts)
  const summaryKpis = useMemo(() => {
    let total = 0
    let vencidos = 0
    let aVencer7d = 0
    let aVencer30d = 0

    allAlerts.forEach((a) => {
      total++
      if (a.isVencido || a.diasRestantes < 0) {
        vencidos++
      } else if (a.diasRestantes <= 7) {
        aVencer7d++
      } else if (a.diasRestantes <= 30) {
        aVencer30d++
      }
    })

    return { total, vencidos, aVencer7d, aVencer30d }
  }, [allAlerts])

  // Filtered alerts list based on active filters
  const filteredAlerts = useMemo(() => {
    return allAlerts.filter((alert) => {
      // 1. Tab filter
      if (selectedTab !== 'todos' && alert.categoriaAba !== selectedTab) {
        return false
      }

      // 2. Period filter
      if (filterPeriodo === '7') {
        if (!alert.isVencido && alert.diasRestantes > 7) return false
      } else if (filterPeriodo === '15') {
        if (!alert.isVencido && alert.diasRestantes > 15) return false
      } else if (filterPeriodo === '30') {
        if (!alert.isVencido && alert.diasRestantes > 30) return false
      } else if (filterPeriodo === 'vencidos') {
        if (!alert.isVencido) return false
      }

      // 3. Imovel filter
      if (filterImovel !== 'all' && alert.imovelId !== filterImovel) {
        return false
      }

      // 4. Tipo de alerta filter
      if (filterTipoAlerta !== 'all' && alert.tipo !== filterTipoAlerta) {
        return false
      }

      // 5. Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchesTitulo = alert.titulo.toLowerCase().includes(term)
        const matchesDesc = alert.descricao.toLowerCase().includes(term)
        const matchesImovel = alert.imovelNome.toLowerCase().includes(term)
        if (!matchesTitulo && !matchesDesc && !matchesImovel) return false
      }

      return true
    })
  }, [allAlerts, selectedTab, filterPeriodo, filterImovel, filterTipoAlerta, searchTerm])

  // Quick Action Click: Open Record Detail Modal
  const handleItemClick = (alert: AlertItem) => {
    if (alert.categoriaAba === 'contratos') {
      setSelectedContrato(alert.rawRecord)
      setShowContratoDetail(true)
    } else if (alert.categoriaAba === 'receitas') {
      setSelectedReceita(alert.rawRecord)
      setShowReceitaDetail(true)
    } else if (alert.categoriaAba === 'despesas') {
      setSelectedDespesa(alert.rawRecord)
      setShowDespesaDetail(true)
    } else if (alert.categoriaAba === 'iptu') {
      setSelectedIptu(alert.rawRecord)
      setShowIptuDetail(true)
    }
  }

  // Deletion handlers
  const handleDeleteReceita = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return
    try {
      await deleteReceita(id)
      toast.success('Receita excluída!')
      setShowReceitaDetail(false)
      loadData()
    } catch {
      toast.error('Erro ao excluir receita')
    }
  }

  const handleDeleteDespesa = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return
    try {
      await deleteDespesa(id)
      toast.success('Despesa excluída!')
      setShowDespesaDetail(false)
      loadData()
    } catch {
      toast.error('Erro ao excluir despesa')
    }
  }

  const handleDeleteIptu = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta taxa/IPTU?')) return
    try {
      await deleteIptuTaxa(id)
      toast.success('Obrigação excluída!')
      setShowIptuDetail(false)
      loadData()
    } catch {
      toast.error('Erro ao excluir obrigação')
    }
  }

  // Helper Badge for days remaining
  const renderDaysBadge = (dias: number, isVencido: boolean) => {
    if (isVencido || dias < 0) {
      const absDays = Math.abs(dias)
      return (
        <Badge
          variant="outline"
          className="bg-rose-500/15 text-rose-700 border-rose-300 font-bold hover:bg-rose-500/25 transition-colors text-xs px-2.5 py-0.5"
        >
          {dias === 0 ? 'Vence hoje' : `Vencido há ${absDays} dia(s)`}
        </Badge>
      )
    }

    if (dias === 0) {
      return (
        <Badge
          variant="outline"
          className="bg-rose-500/15 text-rose-700 border-rose-300 font-bold hover:bg-rose-500/25 text-xs px-2.5 py-0.5"
        >
          Vence hoje!
        </Badge>
      )
    }

    if (dias <= 7) {
      return (
        <Badge
          variant="outline"
          className="bg-red-500/10 text-red-700 border-red-300 font-semibold hover:bg-red-500/20 text-xs px-2.5 py-0.5"
        >
          {dias} dia(s) restante(s)
        </Badge>
      )
    }

    if (dias <= 15) {
      return (
        <Badge
          variant="outline"
          className="bg-amber-500/15 text-amber-700 border-amber-300 font-semibold hover:bg-amber-500/25 text-xs px-2.5 py-0.5"
        >
          {dias} dias restantes
        </Badge>
      )
    }

    return (
      <Badge
        variant="outline"
        className="bg-emerald-500/15 text-emerald-700 border-emerald-300 font-medium hover:bg-emerald-500/25 text-xs px-2.5 py-0.5"
      >
        {dias} dias restantes
      </Badge>
    )
  }

  // Alert Icon & Type Badge
  const getAlertIcon = (tipo: AlertType) => {
    switch (tipo) {
      case 'contrato_termino':
        return <FileText className="h-5 w-5 text-amber-700" />
      case 'contrato_reajuste':
        return <RefreshCw className="h-5 w-5 text-indigo-600" />
      case 'iptu_vencimento':
      case 'iptu_vencido':
        return <Receipt className="h-5 w-5 text-gold-600" />
      case 'receita_vencimento':
      case 'receita_vencida':
        return <TrendingUp className="h-5 w-5 text-emerald-700" />
      case 'despesa_vencimento':
      case 'despesa_vencida':
        return <TrendingDown className="h-5 w-5 text-rose-700" />
    }
  }

  const getAlertIconBg = (tipo: AlertType) => {
    switch (tipo) {
      case 'contrato_termino':
        return 'bg-amber-50 border-amber-200/80 text-amber-700'
      case 'contrato_reajuste':
        return 'bg-indigo-50 border-indigo-200/80 text-indigo-700'
      case 'iptu_vencimento':
      case 'iptu_vencido':
        return 'bg-amber-50/80 border-gold-300 text-gold-700'
      case 'receita_vencimento':
      case 'receita_vencida':
        return 'bg-emerald-50 border-emerald-200/80 text-emerald-700'
      case 'despesa_vencimento':
      case 'despesa_vencida':
        return 'bg-rose-50 border-rose-200/80 text-rose-700'
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800 text-gold-400 shadow-md border border-gold-500/20">
            <Bell className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Central de Alertas & Vencimentos
              </h1>
              {summaryKpis.total > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy-800 text-gold-400 border border-gold-500/30">
                  {summaryKpis.total} ativos
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-0.5">
              Monitoramento centralizado e em tempo real de contratos, receitas, despesas e IPTU
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Alertas
          </Button>
        </div>
      </div>

      {/* 1. CARDS DE RESUMO NO TOPO */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total de Alertas */}
          <Card
            onClick={() => {
              setFilterPeriodo('todos')
              setSelectedTab('todos')
            }}
            className="border border-slate-200 bg-white shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-gold-500/40"
          >
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Total de Alertas
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {summaryKpis.total}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                  <Bell className="h-3 w-3 text-gold-500 shrink-0" /> Todas as pendências
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-navy-800 text-gold-400 border border-gold-500/30 shrink-0">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Vencidos */}
          <Card
            onClick={() => setFilterPeriodo('vencidos')}
            className={`border shadow-sm hover:shadow-md cursor-pointer transition-all ${
              summaryKpis.vencidos > 0
                ? 'border-rose-300 bg-rose-50/40 hover:border-rose-500'
                : 'border-slate-200 bg-white'
            }`}
          >
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 truncate block">
                  Itens Vencidos
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-rose-700">
                  {summaryKpis.vencidos}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
                  <AlertTriangle className="h-3 w-3 shrink-0" /> Atenção imediata
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: A Vencer (7 dias) */}
          <Card
            onClick={() => setFilterPeriodo('7')}
            className="border border-slate-200 bg-white shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-amber-400"
          >
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 truncate block">
                  A Vencer (7 dias)
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-700">
                  {summaryKpis.aVencer7d}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                  <Clock className="h-3 w-3 shrink-0" /> Próxima semana
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: A Vencer (30 dias) */}
          <Card
            onClick={() => setFilterPeriodo('30')}
            className="border border-slate-200 bg-white shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-indigo-400"
          >
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 truncate block">
                  A Vencer (30 dias)
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                  {summaryKpis.aVencer30d}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                  <Calendar className="h-3 w-3 shrink-0" /> Próximo mês
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. FILTROS & ABAS */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Abas por categoria */}
            {/* Filtro por categoria.
                Não é um conjunto de abas: não há painel por categoria, e sim
                uma lista única que muda de conteúdo. Como grupo de botões com
                `aria-pressed`, o leitor de tela anuncia o estado certo — e o
                `aria-controls` das abas deixa de apontar para painel nenhum. */}
            <div
              role="group"
              aria-label="Filtrar alertas por categoria"
              className="flex w-full items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1 lg:w-auto"
            >
              {[
                { id: 'todos', rotulo: 'Todos', total: allAlerts.length },
                {
                  id: 'contratos',
                  rotulo: 'Contratos',
                  total: allAlerts.filter((a) => a.categoriaAba === 'contratos').length,
                },
                {
                  id: 'receitas',
                  rotulo: 'Receitas',
                  total: allAlerts.filter((a) => a.categoriaAba === 'receitas').length,
                },
                {
                  id: 'despesas',
                  rotulo: 'Despesas',
                  total: allAlerts.filter((a) => a.categoriaAba === 'despesas').length,
                },
                {
                  id: 'iptu',
                  rotulo: 'IPTU/Taxas',
                  total: allAlerts.filter((a) => a.categoriaAba === 'iptu').length,
                },
              ].map((categoria) => {
                const ativo = selectedTab === categoria.id
                return (
                  <button
                    key={categoria.id}
                    type="button"
                    onClick={() => setSelectedTab(categoria.id)}
                    aria-pressed={ativo}
                    className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-800 ${
                      ativo
                        ? 'bg-white text-navy-900 shadow-xs'
                        : 'text-slate-700 hover:bg-white/70 hover:text-navy-900'
                    }`}
                  >
                    {categoria.rotulo} ({categoria.total})
                  </button>
                )
              })}
            </div>

            {/* Quick Period selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs font-semibold text-slate-600 mr-1 shrink-0">Período:</span>
              {[
                { id: '7', label: '7 dias' },
                { id: '15', label: '15 dias' },
                { id: '30', label: '30 dias' },
                { id: 'vencidos', label: 'Só Vencidos' },
                { id: 'todos', label: 'Todos' },
              ].map((p) => {
                const isActive = filterPeriodo === p.id
                return (
                  <Button
                    key={p.id}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterPeriodo(p.id)}
                    className={`text-xs h-7 px-2.5 rounded-md transition-colors ${
                      isActive
                        ? 'bg-navy-800 text-gold-400 hover:bg-navy-900 border-navy-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
              <Input
                aria-label="Buscar por descrição, imóvel"
                placeholder="Buscar por descrição, imóvel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50/50"
              />
            </div>

            {/* Imóvel Selector */}
            <div>
              <Select value={filterImovel} onValueChange={setFilterImovel}>
                <SelectTrigger
                  aria-label="Filtrar por imóvel"
                  className="h-9 text-xs bg-slate-50/50"
                >
                  <SelectValue placeholder="Filtrar por imóvel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os imóveis</SelectItem>
                  {imoveis.map((im) => (
                    <SelectItem key={im.id} value={im.id}>
                      {im.nome || (im.codigo ? `Cód. ${im.codigo} - ${im.endereco}` : im.endereco)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Alerta Selector */}
            <div>
              <Select value={filterTipoAlerta} onValueChange={setFilterTipoAlerta}>
                <SelectTrigger aria-label="Tipo de alerta" className="h-9 text-xs bg-slate-50/50">
                  <SelectValue placeholder="Tipo de alerta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="contrato_termino">Término de Contrato</SelectItem>
                  <SelectItem value="contrato_reajuste">Reajuste de Contrato</SelectItem>
                  <SelectItem value="receita_vencimento">Receita a Vencer</SelectItem>
                  <SelectItem value="receita_vencida">Receita Vencida</SelectItem>
                  <SelectItem value="despesa_vencimento">Despesa a Vencer</SelectItem>
                  <SelectItem value="despesa_vencida">Despesa Vencida</SelectItem>
                  <SelectItem value="iptu_vencimento">IPTU / Taxa a Vencer</SelectItem>
                  <SelectItem value="iptu_vencido">IPTU / Taxa Vencida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. LISTA DE ALERTAS */}
      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Lista de Alertas ({filteredAlerts.length} registro(s) encontrado(s))
            </span>
            <span className="text-xs text-slate-600">
              Clique em qualquer item para ver detalhes
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-600">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-3">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Nenhum alerta pendente!</h3>
              <p className="text-xs text-slate-600 max-w-sm mt-1">
                Todas as obrigações, contratos, receitas e despesas estão em dia no período
                selecionado.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleItemClick(alert)}
                  className={`p-4 sm:px-6 hover:bg-slate-50/80 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                    alert.isVencido ? 'border-l-4 border-l-rose-500 bg-rose-50/20' : ''
                  }`}
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border shrink-0 transition-transform group-hover:scale-105 shadow-xs ${getAlertIconBg(
                        alert.tipo,
                      )}`}
                    >
                      {getAlertIcon(alert.tipo)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                          {alert.titulo}
                        </span>
                        {renderDaysBadge(alert.diasRestantes, alert.isVencido)}
                      </div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-navy-800 transition-colors truncate">
                        {alert.descricao}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="h-3.5 w-3.5 text-slate-600" />
                          {alert.imovelNome}
                          {alert.imovelCodigo ? ` (${alert.imovelCodigo})` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-600" />
                          Vencimento:{' '}
                          <strong className="text-slate-700">
                            {formatDate(alert.dataVencimento)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Value and Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:pl-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    {alert.valor != null && alert.valor > 0 ? (
                      <div className="text-left sm:text-right">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                          Valor envolvido
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            alert.tipo.includes('receita')
                              ? 'text-emerald-700'
                              : alert.tipo.includes('despesa') || alert.tipo.includes('iptu')
                                ? 'text-rose-700'
                                : 'text-slate-900'
                          }`}
                        >
                          {formatCurrency(alert.valor)}
                        </span>
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs font-semibold text-navy-800 group-hover:bg-navy-800 group-hover:text-gold-400 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Ver detalhes
                      </Button>
                      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-navy-800 group-hover:translate-x-0.5 transition-transform hidden sm:block" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOGS FOR FAST RECORD INTERACTION */}

      {/* Contrato Detail & Edit */}
      {selectedContrato && (
        <ContratoDetailDialog
          contrato={selectedContrato}
          open={showContratoDetail}
          onOpenChange={setShowContratoDetail}
          onEdit={() => {
            setEditingContrato(selectedContrato)
            setShowContratoDetail(false)
            setShowContratoForm(true)
          }}
        />
      )}
      <ContratoFormDialog
        open={showContratoForm}
        onOpenChange={setShowContratoForm}
        editing={editingContrato}
        onSaved={loadData}
      />

      {/* Receita Detail & Edit */}
      {selectedReceita && (
        <ReceitaDetailDialog
          receita={selectedReceita}
          open={showReceitaDetail}
          onOpenChange={setShowReceitaDetail}
          onEdit={() => {
            setEditingReceita(selectedReceita)
            setShowReceitaDetail(false)
            setShowReceitaForm(true)
          }}
          onDelete={() => handleDeleteReceita(selectedReceita.id)}
        />
      )}
      <ReceitaFormDialog
        open={showReceitaForm}
        onOpenChange={setShowReceitaForm}
        editing={editingReceita}
        onSaved={loadData}
      />

      {/* Despesa Detail & Edit */}
      {selectedDespesa && (
        <DespesaDetailDialog
          despesa={selectedDespesa}
          open={showDespesaDetail}
          onOpenChange={setShowDespesaDetail}
          onEdit={() => {
            setEditingDespesa(selectedDespesa)
            setShowDespesaDetail(false)
            setShowDespesaForm(true)
          }}
          onDelete={() => handleDeleteDespesa(selectedDespesa.id)}
        />
      )}
      <DespesaFormDialog
        open={showDespesaForm}
        onOpenChange={setShowDespesaForm}
        editing={editingDespesa}
        onSaved={loadData}
      />

      {/* IPTU / Taxa Detail & Edit */}
      {selectedIptu && (
        <IptuTaxaDetailDialog
          iptuTaxa={selectedIptu}
          open={showIptuDetail}
          onOpenChange={setShowIptuDetail}
          onEdit={() => {
            setEditingIptu(selectedIptu)
            setShowIptuDetail(false)
            setShowIptuForm(true)
          }}
          onDelete={() => handleDeleteIptu(selectedIptu.id)}
        />
      )}
      <IptuTaxaFormDialog
        open={showIptuForm}
        onOpenChange={setShowIptuForm}
        editing={editingIptu}
        onSaved={loadData}
      />
    </div>
  )
}
