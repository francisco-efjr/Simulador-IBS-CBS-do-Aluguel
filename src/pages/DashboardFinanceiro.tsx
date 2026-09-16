import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  FileCheck2,
  Receipt,
  Calendar,
  Building2,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertCircle,
  PieChart as PieIcon,
  BarChart2,
  LineChart as LineIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import pb from '@/lib/pocketbase/client'
import { formatCurrency } from '@/lib/format'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

type PeriodPreset =
  | 'current_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'current_year'
  | 'custom'

interface ReceitaItem {
  id: string
  imovel?: string
  contrato?: string
  categoria?: string
  inquilino?: string
  competencia?: string
  data_vencimento?: string
  valor_previsto?: number
  valor_recebido?: number
  data_recebimento?: string
  status_financeiro?: 'previsto' | 'recebido' | 'em_atraso' | 'parcial' | string
  forma_recebimento?: string
  observacoes?: string
  data?: string
  valor?: number
  status?: string
  expand?: {
    imovel?: { id: string; nome?: string; codigo?: string; endereco?: string }
    categoria?: { id: string; nome?: string; tipo?: string }
    contrato?: { id: string; numero?: string }
    inquilino?: { id: string; nome?: string }
  }
}

interface DespesaItem {
  id: string
  imovel?: string
  fornecedor?: string
  categoria?: string
  competencia?: string
  data_vencimento?: string
  valor_previsto?: number
  valor_pago?: number
  data_pagamento?: string
  status_financeiro?: 'previsto' | 'pago' | 'em_atraso' | 'parcial' | string
  forma_pagamento?: string
  observacoes?: string
  data?: string
  valor?: number
  status?: string
  expand?: {
    imovel?: { id: string; nome?: string; codigo?: string; endereco?: string }
    categoria?: { id: string; nome?: string; tipo?: string }
    fornecedor?: { id: string; nome?: string }
  }
}

interface ImovelItem {
  id: string
  nome?: string
  codigo?: string
  endereco?: string
  status?: string
}

interface CategoriaItem {
  id: string
  nome: string
  tipo: 'receita' | 'despesa'
  status?: string
}

const MONTH_NAMES_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const PIE_COLORS = [
  '#0284c7', // Sky
  '#d97706', // Amber / Gold
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#e11d48', // Rose
  '#64748b', // Slate
]

export default function DashboardFinanceiro() {
  // Filters state
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('current_month')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [selectedImovel, setSelectedImovel] = useState<string>('all')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all')

  // Data state
  const [receitas, setReceitas] = useState<ReceitaItem[]>([])
  const [despesas, setDespesas] = useState<DespesaItem[]>([])
  const [imoveis, setImoveis] = useState<ImovelItem[]>([])
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])

  // UI state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [tableSortDirection, setTableSortDirection] = useState<'asc' | 'desc'>('desc')

  // Calculate start and end dates based on current periodPreset or custom inputs
  const { startDateStr, endDateStr } = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed

    const formatDateIso = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    if (periodPreset === 'current_month') {
      const firstDay = new Date(currentYear, currentMonth, 1)
      const lastDay = new Date(currentYear, currentMonth + 1, 0)
      return { startDateStr: formatDateIso(firstDay), endDateStr: formatDateIso(lastDay) }
    }
    if (periodPreset === 'last_month') {
      const firstDay = new Date(currentYear, currentMonth - 1, 1)
      const lastDay = new Date(currentYear, currentMonth, 0)
      return { startDateStr: formatDateIso(firstDay), endDateStr: formatDateIso(lastDay) }
    }
    if (periodPreset === 'last_3_months') {
      const firstDay = new Date(currentYear, currentMonth - 2, 1)
      const lastDay = new Date(currentYear, currentMonth + 1, 0)
      return { startDateStr: formatDateIso(firstDay), endDateStr: formatDateIso(lastDay) }
    }
    if (periodPreset === 'last_6_months') {
      const firstDay = new Date(currentYear, currentMonth - 5, 1)
      const lastDay = new Date(currentYear, currentMonth + 1, 0)
      return { startDateStr: formatDateIso(firstDay), endDateStr: formatDateIso(lastDay) }
    }
    if (periodPreset === 'current_year') {
      const firstDay = new Date(currentYear, 0, 1)
      const lastDay = new Date(currentYear, 11, 31)
      return { startDateStr: formatDateIso(firstDay), endDateStr: formatDateIso(lastDay) }
    }
    if (periodPreset === 'custom') {
      return {
        startDateStr: customStartDate || '1970-01-01',
        endDateStr: customEndDate || '2099-12-31',
      }
    }
    return { startDateStr: '', endDateStr: '' }
  }, [periodPreset, customStartDate, customEndDate])

  // Initialize custom dates when switching to custom
  useEffect(() => {
    if (periodPreset === 'custom' && !customStartDate && !customEndDate) {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      setCustomStartDate(`${y}-${m}-01`)
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
      setCustomEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`)
    }
  }, [periodPreset, customStartDate, customEndDate])

  // Load static lists (imoveis and categorias) once
  const loadOptions = useCallback(async () => {
    try {
      const [imoveisData, categoriasData] = await Promise.all([
        pb.collection('imoveis').getFullList<ImovelItem>({
          sort: 'nome,codigo,endereco',
        }),
        pb.collection('categorias_financeiras').getFullList<CategoriaItem>({
          filter: 'status != "inativo"',
          sort: 'nome',
        }),
      ])
      setImoveis(imoveisData)
      setCategorias(categoriasData)
    } catch (err) {
      console.error('Erro ao carregar opções de imóveis e categorias:', err)
    }
  }, [])

  // Load main financial records
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [recData, despData] = await Promise.all([
        pb.collection('receitas').getFullList<ReceitaItem>({
          sort: '-created',
          expand: 'imovel,categoria,inquilino,contrato',
        }),
        pb.collection('despesas').getFullList<DespesaItem>({
          sort: '-created',
          expand: 'imovel,categoria,fornecedor',
        }),
      ])

      setReceitas(recData)
      setDespesas(despData)
    } catch (err: any) {
      console.error('Erro ao buscar receitas e despesas:', err)
      setError('Erro ao carregar dados financeiros do servidor. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOptions()
    loadData()
  }, [loadOptions, loadData])

  // Realtime updates
  useRealtime('receitas', () => {
    loadData()
  })
  useRealtime('despesas', () => {
    loadData()
  })
  useRealtime('imoveis', () => {
    loadOptions()
  })
  useRealtime('categorias_financeiras', () => {
    loadOptions()
  })

  // Date helper: extract YYYY-MM-DD from date string or ISO string
  const getDateStr = (val: string | undefined | null): string => {
    if (!val) return ''
    if (val.length >= 10) return val.substring(0, 10)
    return ''
  }

  // Check if a date string falls inside the selected range [startDateStr, endDateStr]
  const isDateInRange = (dStr: string | undefined | null): boolean => {
    const d = getDateStr(dStr)
    if (!d) return false
    if (startDateStr && d < startDateStr) return false
    if (endDateStr && d > endDateStr) return false
    return true
  }

  // Filter items according to global filters (imóvel, categoria)
  const matchesImovelAndCategoria = (item: { imovel?: string; categoria?: string }) => {
    if (selectedImovel !== 'all' && item.imovel !== selectedImovel) {
      return false
    }
    if (selectedCategoria !== 'all' && item.categoria !== selectedCategoria) {
      return false
    }
    return true
  }

  // 1. CARDS CALCULATION
  const kpis = useMemo(() => {
    // Receitas recebidas: status_financeiro === 'recebido', filtered by data_recebimento in range
    let receitasRecebidas = 0
    let countReceitasRecebidas = 0

    // Despesas pagas: status_financeiro === 'pago', filtered by data_pagamento in range
    let despesasPagas = 0
    let countDespesasPagas = 0

    // Receitas pendentes: status_financeiro === 'previsto', filtered by data_vencimento in range
    let receitasPendentes = 0

    // Receitas vencidas: status_financeiro === 'em_atraso', filtered by data_vencimento in range
    let receitasVencidas = 0

    // Despesas pendentes: status_financeiro === 'previsto', filtered by data_vencimento in range
    let despesasPendentes = 0

    // Despesas vencidas: status_financeiro === 'em_atraso', filtered by data_vencimento in range
    let despesasVencidas = 0

    receitas.forEach((r) => {
      if (!matchesImovelAndCategoria(r)) return

      const status = r.status_financeiro || ''
      const recDate = r.data_recebimento || r.data
      const vencDate = r.data_vencimento || r.data

      if (status === 'recebido') {
        if (isDateInRange(recDate)) {
          receitasRecebidas += Number(r.valor_recebido || r.valor || 0)
          countReceitasRecebidas++
        }
      } else if (status === 'previsto') {
        if (isDateInRange(vencDate)) {
          receitasPendentes += Number(r.valor_previsto || r.valor || 0)
        }
      } else if (status === 'em_atraso') {
        if (isDateInRange(vencDate)) {
          receitasVencidas += Number(r.valor_previsto || r.valor || 0)
        }
      }
    })

    despesas.forEach((d) => {
      if (!matchesImovelAndCategoria(d)) return

      const status = d.status_financeiro || ''
      const pagDate = d.data_pagamento || d.data
      const vencDate = d.data_vencimento || d.data

      if (status === 'pago') {
        if (isDateInRange(pagDate)) {
          despesasPagas += Number(d.valor_pago || d.valor || 0)
          countDespesasPagas++
        }
      } else if (status === 'previsto') {
        if (isDateInRange(vencDate)) {
          despesasPendentes += Number(d.valor_previsto || d.valor || 0)
        }
      } else if (status === 'em_atraso') {
        if (isDateInRange(vencDate)) {
          despesasVencidas += Number(d.valor_previsto || d.valor || 0)
        }
      }
    })

    const resultadoLiquido = receitasRecebidas - despesasPagas
    const hasData = countReceitasRecebidas > 0 || countDespesasPagas > 0

    return {
      receitasRecebidas,
      despesasPagas,
      resultadoLiquido,
      hasData,
      receitasPendentes,
      receitasVencidas,
      despesasPendentes,
      despesasVencidas,
    }
  }, [receitas, despesas, selectedImovel, selectedCategoria, startDateStr, endDateStr])

  // Helper to get imovel display label
  const getImovelDisplayName = useCallback(
    (imovelId?: string, fallbackExpand?: { nome?: string; codigo?: string; endereco?: string }) => {
      if (fallbackExpand?.nome) return fallbackExpand.nome
      if (fallbackExpand?.codigo) return `Cód. ${fallbackExpand.codigo}`
      if (fallbackExpand?.endereco) return fallbackExpand.endereco

      if (imovelId) {
        const found = imoveis.find((im) => im.id === imovelId)
        if (found) {
          return (
            found.nome || (found.codigo ? `Cód. ${found.codigo}` : '') || found.endereco || 'Imóvel'
          )
        }
      }
      return 'Imóvel não identificado'
    },
    [imoveis],
  )

  // 3. GRAPHS CALCULATION

  // a) & b) Monthly grouping (Receitas Realizadas, Despesas Realizadas & Resultado Líquido)
  const monthlyData = useMemo(() => {
    // Determine months inside [startDateStr, endDateStr]
    // If range is within 1 month, show at least the months of the year or recent 6 months to make graphs useful,
    // or strictly group by the months present in the range. Let's create an ordered array of YYYY-MM
    let startD = new Date(startDateStr + 'T00:00:00')
    let endD = new Date(endDateStr + 'T00:00:00')

    if (isNaN(startD.getTime())) startD = new Date()
    if (isNaN(endD.getTime())) endD = new Date()

    // If single month selected, let's expand the chart timeline to 6 months leading up to the end month
    // so the comparison charts (Receitas x Despesas por mês & Evolução) always give trend context!
    // Or if last_3_months / last_6_months / current_year, strictly show the range.
    let chartStartD = new Date(startD.getFullYear(), startD.getMonth(), 1)
    const chartEndD = new Date(endD.getFullYear(), endD.getMonth(), 1)

    // If period preset is current_month or last_month, show last 6 months for monthly trends
    if (periodPreset === 'current_month' || periodPreset === 'last_month') {
      chartStartD = new Date(endD.getFullYear(), endD.getMonth() - 5, 1)
    }

    const monthsMap = new Map<
      string,
      { label: string; receitas: number; despesas: number; resultado: number }
    >()

    const curr = new Date(chartStartD.getTime())
    while (
      curr <= chartEndD ||
      (curr.getFullYear() === chartEndD.getFullYear() && curr.getMonth() === chartEndD.getMonth())
    ) {
      const yyyy = curr.getFullYear()
      const mm = String(curr.getMonth() + 1).padStart(2, '0')
      const key = `${yyyy}-${mm}`
      const monthLabel = `${MONTH_NAMES_SHORT[curr.getMonth()]}/${String(yyyy).slice(2)}`
      monthsMap.set(key, { label: monthLabel, receitas: 0, despesas: 0, resultado: 0 })
      curr.setMonth(curr.getMonth() + 1)
    }

    // Populate receitas realizadas (status_financeiro = 'recebido')
    receitas.forEach((r) => {
      if (r.status_financeiro !== 'recebido') return
      if (!matchesImovelAndCategoria(r)) return

      const dStr = getDateStr(r.data_recebimento || r.data)
      if (!dStr) return
      const key = dStr.substring(0, 7) // YYYY-MM

      if (monthsMap.has(key)) {
        const item = monthsMap.get(key)!
        item.receitas += Number(r.valor_recebido || r.valor || 0)
      }
    })

    // Populate despesas realizadas (status_financeiro = 'pago')
    despesas.forEach((d) => {
      if (d.status_financeiro !== 'pago') return
      if (!matchesImovelAndCategoria(d)) return

      const dStr = getDateStr(d.data_pagamento || d.data)
      if (!dStr) return
      const key = dStr.substring(0, 7) // YYYY-MM

      if (monthsMap.has(key)) {
        const item = monthsMap.get(key)!
        item.despesas += Number(d.valor_pago || d.valor || 0)
      }
    })

    const result = Array.from(monthsMap.values()).map((m) => ({
      ...m,
      resultado: m.receitas - m.despesas,
    }))

    return result
  }, [
    receitas,
    despesas,
    selectedImovel,
    selectedCategoria,
    startDateStr,
    endDateStr,
    periodPreset,
  ])

  // c) Receitas por Imóvel (apenas realizadas)
  const receitasPorImovelData = useMemo(() => {
    const imovelMap = new Map<string, { name: string; valor: number }>()

    receitas.forEach((r) => {
      if (r.status_financeiro !== 'recebido') return
      if (!matchesImovelAndCategoria(r)) return
      if (!isDateInRange(r.data_recebimento || r.data)) return

      const imId = r.imovel || 'nao_identificado'
      const name = getImovelDisplayName(r.imovel, r.expand?.imovel)
      const val = Number(r.valor_recebido || r.valor || 0)

      const curr = imovelMap.get(imId) || { name, valor: 0 }
      curr.valor += val
      imovelMap.set(imId, curr)
    })

    return Array.from(imovelMap.values())
      .filter((i) => i.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10) // Top 10
  }, [receitas, selectedImovel, selectedCategoria, startDateStr, endDateStr, getImovelDisplayName])

  // d) Despesas por Imóvel (apenas realizadas)
  const despesasPorImovelData = useMemo(() => {
    const imovelMap = new Map<string, { name: string; valor: number }>()

    despesas.forEach((d) => {
      if (d.status_financeiro !== 'pago') return
      if (!matchesImovelAndCategoria(d)) return
      if (!isDateInRange(d.data_pagamento || d.data)) return

      const imId = d.imovel || 'nao_identificado'
      const name = getImovelDisplayName(d.imovel, d.expand?.imovel)
      const val = Number(d.valor_pago || d.valor || 0)

      const curr = imovelMap.get(imId) || { name, valor: 0 }
      curr.valor += val
      imovelMap.set(imId, curr)
    })

    return Array.from(imovelMap.values())
      .filter((i) => i.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10) // Top 10
  }, [despesas, selectedImovel, selectedCategoria, startDateStr, endDateStr, getImovelDisplayName])

  // e) Despesas por Categoria (apenas realizadas)
  const despesasPorCategoriaData = useMemo(() => {
    const catMap = new Map<string, { name: string; valor: number }>()

    despesas.forEach((d) => {
      if (d.status_financeiro !== 'pago') return
      if (!matchesImovelAndCategoria(d)) return
      if (!isDateInRange(d.data_pagamento || d.data)) return

      const catId = d.categoria || 'outros'
      let catName = d.expand?.categoria?.nome
      if (!catName && d.categoria) {
        const found = categorias.find((c) => c.id === d.categoria)
        catName = found?.nome
      }
      if (!catName) catName = 'Sem Categoria'

      const val = Number(d.valor_pago || d.valor || 0)
      const curr = catMap.get(catId) || { name: catName, valor: 0 }
      curr.valor += val
      catMap.set(catId, curr)
    })

    const list = Array.from(catMap.values()).filter((c) => c.valor > 0)
    const total = list.reduce((acc, curr) => acc + curr.valor, 0)

    return list
      .map((item) => ({
        ...item,
        percent: total > 0 ? (item.valor / total) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor)
  }, [despesas, selectedImovel, selectedCategoria, startDateStr, endDateStr, categorias])

  // 4. TABELA COMPARATIVA: Resumo por Imóvel
  const resumoPorImovelTable = useMemo(() => {
    // Map with every registered imovel (or those that match the imovel filter)
    const summaryMap = new Map<
      string,
      {
        id: string
        nome: string
        codigo?: string
        receitas: number
        despesas: number
        resultado: number
      }
    >()

    // Initialize with active imoveis
    imoveis.forEach((im) => {
      if (selectedImovel !== 'all' && im.id !== selectedImovel) return
      summaryMap.set(im.id, {
        id: im.id,
        nome: im.nome || im.endereco || `Imóvel #${im.codigo || im.id}`,
        codigo: im.codigo,
        receitas: 0,
        despesas: 0,
        resultado: 0,
      })
    })

    // Add receitas recebidas
    receitas.forEach((r) => {
      if (r.status_financeiro !== 'recebido') return
      if (!matchesImovelAndCategoria(r)) return
      if (!isDateInRange(r.data_recebimento || r.data)) return

      const imId = r.imovel || 'sem_imovel'
      if (!summaryMap.has(imId)) {
        summaryMap.set(imId, {
          id: imId,
          nome: getImovelDisplayName(r.imovel, r.expand?.imovel),
          codigo: r.expand?.imovel?.codigo,
          receitas: 0,
          despesas: 0,
          resultado: 0,
        })
      }
      const item = summaryMap.get(imId)!
      item.receitas += Number(r.valor_recebido || r.valor || 0)
    })

    // Add despesas pagas
    despesas.forEach((d) => {
      if (d.status_financeiro !== 'pago') return
      if (!matchesImovelAndCategoria(d)) return
      if (!isDateInRange(d.data_pagamento || d.data)) return

      const imId = d.imovel || 'sem_imovel'
      if (!summaryMap.has(imId)) {
        summaryMap.set(imId, {
          id: imId,
          nome: getImovelDisplayName(d.imovel, d.expand?.imovel),
          codigo: d.expand?.imovel?.codigo,
          receitas: 0,
          despesas: 0,
          resultado: 0,
        })
      }
      const item = summaryMap.get(imId)!
      item.despesas += Number(d.valor_pago || d.valor || 0)
    })

    const list = Array.from(summaryMap.values()).map((row) => ({
      ...row,
      resultado: row.receitas - row.despesas,
    }))

    // Sort by resultado
    list.sort((a, b) => {
      if (tableSortDirection === 'asc') {
        return a.resultado - b.resultado
      }
      return b.resultado - a.resultado
    })

    return list
  }, [
    imoveis,
    receitas,
    despesas,
    selectedImovel,
    selectedCategoria,
    startDateStr,
    endDateStr,
    tableSortDirection,
    getImovelDisplayName,
  ])

  // Custom tooltips for Recharts
  const formatTooltipCurrency = (val: any) => formatCurrency(Number(val) || 0)

  return (
    <div className="space-y-6 pb-12">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-800 text-gold-400 shadow-sm border border-gold-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Dashboard Financeiro
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Consolidado de receitas, despesas, fluxo de caixa e rentabilidade do portfólio
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadOptions()
            loadData()
          }}
          disabled={loading}
          className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 1. SEVEN KPI CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Receitas Recebidas */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Receitas Recebidas
                </span>
                <p className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
                  {formatCurrency(kpis.receitasRecebidas)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <FileCheck2 className="h-3 w-3 shrink-0" /> Realizadas no período
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Despesas Pagas */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Despesas Pagas
                </span>
                <p className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
                  {formatCurrency(kpis.despesasPagas)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
                  <Receipt className="h-3 w-3 shrink-0" /> Pagas no período
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 shrink-0">
                <TrendingDown className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Resultado Líquido (Destaque) */}
          <Card
            className={`border-2 sm:col-span-2 lg:col-span-2 shadow-sm transition-all ${
              kpis.resultadoLiquido >= 0
                ? 'border-emerald-500 bg-gradient-to-br from-emerald-900 to-navy-900 text-white'
                : 'border-rose-500 bg-gradient-to-br from-rose-900 to-navy-900 text-white'
            }`}
          >
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold-300">
                    Resultado Líquido
                  </span>
                  <span
                    className={`text-xs uppercase font-bold px-2 py-0.5 rounded-full ${
                      kpis.resultadoLiquido >= 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                    }`}
                  >
                    {kpis.resultadoLiquido >= 0 ? 'Superávit' : 'Déficit'}
                  </span>
                </div>
                <p className="text-xl sm:text-3xl font-extrabold tracking-tight truncate">
                  {kpis.hasData ? formatCurrency(kpis.resultadoLiquido) : '—'}
                </p>
                <p className="text-xs text-slate-300 line-clamp-1">
                  Receitas ({formatCurrency(kpis.receitasRecebidas)}) − Despesas (
                  {formatCurrency(kpis.despesasPagas)})
                </p>
              </div>
              <div
                className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl shrink-0 ${
                  kpis.resultadoLiquido >= 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Receitas Pendentes */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Receitas Pendentes
                </span>
                <p className="text-lg sm:text-2xl font-bold text-amber-700 truncate">
                  {formatCurrency(kpis.receitasPendentes)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                  <Clock className="h-3 w-3 shrink-0" /> A receber no período
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Receitas Vencidas */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Receitas Vencidas
                </span>
                <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                  {formatCurrency(kpis.receitasVencidas)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertTriangle className="h-3 w-3 shrink-0" /> Inadimplência no período
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200/60 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Despesas Pendentes */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Despesas Pendentes
                </span>
                <p className="text-lg sm:text-2xl font-bold text-slate-700 truncate">
                  {formatCurrency(kpis.despesasPendentes)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                  <Clock className="h-3 w-3 shrink-0" /> A pagar no período
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 7: Despesas Vencidas */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Despesas Vencidas
                </span>
                <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                  {formatCurrency(kpis.despesasVencidas)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertTriangle className="h-3 w-3 shrink-0" /> Em atraso no período
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200/60 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. GLOBAL FILTERS BAR */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-600" />
            <CardTitle className="text-sm font-semibold text-slate-800">
              Filtros Globais de Análise
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Quick period buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 mr-2">Período:</span>
            {[
              { id: 'current_month', label: 'Mês atual' },
              { id: 'last_month', label: 'Mês anterior' },
              { id: 'last_3_months', label: 'Últimos 3 meses' },
              { id: 'last_6_months', label: 'Últimos 6 meses' },
              { id: 'current_year', label: 'Ano atual' },
              { id: 'custom', label: 'Personalizado' },
            ].map((p) => {
              const isActive = periodPreset === p.id
              return (
                <Button
                  key={p.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriodPreset(p.id as PeriodPreset)}
                  className={`text-xs h-8 px-3 rounded-md transition-colors ${
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

          {/* Filters Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Custom Date Inputs if Custom selected */}
            {periodPreset === 'custom' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="custom-start" className="text-xs text-slate-600 font-medium">
                    Data Início
                  </Label>
                  <Input
                    id="custom-start"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="custom-end" className="text-xs text-slate-600 font-medium">
                    Data Fim
                  </Label>
                  <Input
                    id="custom-end"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
              </>
            )}

            {/* Imóvel Dropdown */}
            <div
              className={`space-y-1.5 ${
                periodPreset === 'custom' ? 'lg:col-span-1' : 'sm:col-span-1 lg:col-span-2'
              }`}
            >
              <Label className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-600" />
                Imóvel
              </Label>
              <Select value={selectedImovel} onValueChange={setSelectedImovel}>
                <SelectTrigger aria-label="Todos os imóveis" className="h-9 text-xs bg-slate-50/50">
                  <SelectValue placeholder="Todos os imóveis" />
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

            {/* Categoria Dropdown */}
            <div
              className={`space-y-1.5 ${
                periodPreset === 'custom' ? 'lg:col-span-1' : 'sm:col-span-1 lg:col-span-2'
              }`}
            >
              <Label className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-slate-600" />
                Categoria
              </Label>
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger
                  aria-label="Todas as categorias"
                  className="h-9 text-xs bg-slate-50/50"
                >
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} ({c.tipo === 'receita' ? 'Receita' : 'Despesa'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. GRAPHS SECTION (5 GRAPHS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph A: Receitas × Despesas por mês */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-indigo-600" />
                  Receitas × Despesas Realizadas
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 mt-0.5">
                  Comparação mensal entre receitas recebidas e despesas pagas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[250px] sm:h-[320px] lg:h-[350px] w-full">
              {monthlyData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-600">
                  Nenhum dado encontrado para o período selecionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      tickFormatter={(val) =>
                        `R$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                      }
                    />
                    <RechartsTooltip
                      formatter={formatTooltipCurrency}
                      labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <RechartsLegend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Bar
                      name="Receitas Realizadas"
                      dataKey="receitas"
                      fill="#0284c7"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      name="Despesas Pagas"
                      dataKey="despesas"
                      fill="#e11d48"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Graph B: Evolução do Resultado Mensal */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LineIcon className="h-4 w-4 text-emerald-700" />
                  Evolução do Resultado Mensal
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 mt-0.5">
                  Superávit ou déficit líquido apurado mês a mês
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[250px] sm:h-[320px] lg:h-[350px] w-full">
              {monthlyData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-600">
                  Nenhum dado encontrado para o período selecionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      tickFormatter={(val) =>
                        `R$ ${val >= 1000 || val <= -1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                      }
                    />
                    <RechartsTooltip
                      formatter={formatTooltipCurrency}
                      labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <RechartsLegend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Line
                      name="Resultado Líquido"
                      type="monotone"
                      dataKey="resultado"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Graph C: Receitas por Imóvel */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-sky-700" />
                Receitas por Imóvel
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 mt-0.5">
                Total recebido no período ordenado pelo maior faturamento
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[250px] sm:h-[320px] lg:h-[350px] w-full">
              {receitasPorImovelData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-600">
                  Nenhuma receita realizada para o período selecionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={receitasPorImovelData}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(val) =>
                        `R$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                      }
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11, fill: '#334155' }}
                      width={120}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      formatter={formatTooltipCurrency}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      name="Receita Recebida"
                      dataKey="valor"
                      fill="#0284c7"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Graph D: Despesas por Imóvel */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-rose-700" />
                Despesas por Imóvel
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 mt-0.5">
                Custos pagos no período por propriedade
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[250px] sm:h-[320px] lg:h-[350px] w-full">
              {despesasPorImovelData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-600">
                  Nenhuma despesa paga para o período selecionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={despesasPorImovelData}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(val) =>
                        `R$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                      }
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11, fill: '#334155' }}
                      width={120}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      formatter={formatTooltipCurrency}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                      }}
                    />
                    <Bar name="Despesa Paga" dataKey="valor" fill="#e11d48" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Graph E: Despesas por Categoria (Pie Chart spanning 2 columns on wide screen or standalone) */}
        <Card className="border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-amber-700" />
                  Distribuição de Despesas por Categoria
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 mt-0.5">
                  Composição percentual dos custos pagos no período
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="h-[250px] sm:h-[280px] md:col-span-2 w-full">
                {despesasPorCategoriaData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-600">
                    Nenhuma despesa paga com categoria para o período selecionado
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={despesasPorCategoriaData}
                        dataKey="valor"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {despesasPorCategoriaData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any, name: any) => [
                          `${formatCurrency(Number(val))}`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend list on the side */}
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
                {despesasPorCategoriaData.length === 0 ? (
                  <p className="text-xs text-slate-600">Sem dados para detalhar.</p>
                ) : (
                  despesasPorCategoriaData.map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="font-medium text-slate-700 truncate">{item.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-slate-900 block">
                          {formatCurrency(item.valor)}
                        </span>
                        <span className="text-xs text-slate-600">{item.percent.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. TABELA COMPARATIVA: RESUMO POR IMÓVEL */}
      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Resumo Financeiro por Imóvel
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 mt-0.5">
                Comparativo de receitas realizadas, despesas pagas e margem operacional por
                propriedade
              </CardDescription>
            </div>
            <div className="text-xs text-slate-600 font-medium">
              {resumoPorImovelTable.length} registro(s) listado(s)
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {resumoPorImovelTable.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-600">
              <Building2 className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">
                Nenhum dado encontrado para o período selecionado
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards (sm:hidden) */}
              <div className="sm:hidden divide-y divide-slate-100 p-3 space-y-3">
                {resumoPorImovelTable.map((row) => (
                  <div
                    key={row.id}
                    className="p-3 bg-slate-50/50 rounded-lg border border-slate-100 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{row.nome}</div>
                        {row.codigo && (
                          <div className="text-xs text-slate-600">Cód: {row.codigo}</div>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                          row.resultado > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.resultado < 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {formatCurrency(row.resultado)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                      <div>
                        <span className="text-slate-600 block text-xs uppercase">Receitas</span>
                        <span className="font-medium text-emerald-700">
                          {formatCurrency(row.receitas)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-600 block text-xs uppercase">Despesas</span>
                        <span className="font-medium text-rose-700">
                          {formatCurrency(row.despesas)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (hidden sm:block) with overflow-x-auto and sticky first column */}
              <div className="hidden sm:block overflow-x-auto">
                <Table className="min-w-[550px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-semibold text-slate-700 py-3 sticky left-0 bg-slate-50/95 z-10">
                        Imóvel
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right py-3">
                        Receitas (R$)
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right py-3">
                        Despesas (R$)
                      </TableHead>
                      <TableHead
                        className="font-semibold text-slate-700 text-right py-3 cursor-pointer hover:bg-slate-100/80 select-none transition-colors"
                        onClick={() =>
                          setTableSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                        }
                      >
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span>Resultado (R$)</span>
                          {tableSortDirection === 'desc' ? (
                            <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                          ) : (
                            <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
                          )}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumoPorImovelTable.map((row) => (
                      <TableRow key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="py-3 sticky left-0 bg-white hover:bg-slate-50/60 z-10">
                          <div className="font-medium text-slate-900 text-sm">{row.nome}</div>
                          {row.codigo && (
                            <div className="text-xs text-slate-600">Cód: {row.codigo}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-3 text-sm font-medium text-emerald-700">
                          {formatCurrency(row.receitas)}
                        </TableCell>
                        <TableCell className="text-right py-3 text-sm font-medium text-rose-700">
                          {formatCurrency(row.despesas)}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-sm font-bold ${
                              row.resultado > 0
                                ? 'text-emerald-700'
                                : row.resultado < 0
                                  ? 'text-rose-700'
                                  : 'text-slate-600'
                            }`}
                          >
                            {formatCurrency(row.resultado)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
