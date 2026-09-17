import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building,
  Building2,
  CheckCircle2,
  Clock,
  Wrench,
  Percent,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Receipt,
  FileText,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
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
import dados from '@/lib/dados/cliente'
import { formatCurrency, TIPO_IMOVEL_LABELS, STATUS_IMOVEL_LABELS } from '@/lib/format'
import { StatusBadge } from '@/components/shared/StatusBadge'
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

interface ImovelItem {
  id: string
  nome?: string
  codigo?: string
  endereco?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  tipo?: string
  status?: string
  valor?: number
  valor_estimado?: number
  inquilino_atual?: string
  created?: string
}

interface ContratoItem {
  id: string
  imovel: string
  numero?: string
  inquilino?: string
  status?: string
  data_inicio?: string
  data_fim?: string
  valor_aluguel?: number
  expand?: {
    imovel?: ImovelItem
    inquilino?: { id: string; nome?: string }
  }
}

interface ReceitaItem {
  id: string
  imovel?: string
  contrato?: string
  valor_previsto?: number
  valor_recebido?: number
  data_recebimento?: string
  data_vencimento?: string
  data?: string
  valor?: number
  status_financeiro?: string
  status?: string
  expand?: {
    imovel?: ImovelItem
  }
}

interface DespesaItem {
  id: string
  imovel?: string
  valor_previsto?: number
  valor_pago?: number
  data_pagamento?: string
  data_vencimento?: string
  data?: string
  valor?: number
  status_financeiro?: string
  status?: string
  expand?: {
    imovel?: ImovelItem
  }
}

interface IptuTaxaItem {
  id: string
  imovel?: string
  descricao?: string
  valor?: number
  vencimento?: string
  status?: 'pago' | 'pendente' | 'vencido' | string
  tipo?: string
  expand?: {
    imovel?: ImovelItem
  }
}

const MONTH_NAMES_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const STATUS_DONUT_COLORS: Record<string, string> = {
  vago: '#0284c7', // Sky Blue
  alugado: '#10b981', // Emerald Green
  em_manutencao: '#f59e0b', // Amber / Gold
  inativo: '#64748b', // Slate Gray
}

export default function DashboardImoveis() {
  const navigate = useNavigate()

  // Filters state
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('current_month')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  // Table sorting
  const [tableSortColumn, setTableSortColumn] = useState<
    'nome' | 'tipo' | 'status' | 'receitas' | 'despesas' | 'resultado' | 'contrato' | 'iptu'
  >('resultado')
  const [tableSortDirection, setTableSortDirection] = useState<'asc' | 'desc'>('desc')

  // Data state
  const [imoveis, setImoveis] = useState<ImovelItem[]>([])
  const [contratos, setContratos] = useState<ContratoItem[]>([])
  const [receitas, setReceitas] = useState<ReceitaItem[]>([])
  const [despesas, setDespesas] = useState<DespesaItem[]>([])
  const [iptuTaxas, setIptuTaxas] = useState<IptuTaxaItem[]>([])

  // UI state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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

  // Load all 5 collections
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [imoveisData, contratosData, receitasData, despesasData, iptuData] = await Promise.all([
        dados.colecao('imoveis').getFullList<ImovelItem>({
          sort: 'nome,codigo,endereco',
        }),
        dados.colecao('contratos').getFullList<ContratoItem>({
          sort: '-created',
          expand: 'imovel,inquilino',
        }),
        dados.colecao('receitas').getFullList<ReceitaItem>({
          sort: '-created',
          expand: 'imovel',
        }),
        dados.colecao('despesas').getFullList<DespesaItem>({
          sort: '-created',
          expand: 'imovel',
        }),
        dados.colecao('iptu_taxas').getFullList<IptuTaxaItem>({
          sort: '-created',
          expand: 'imovel',
        }),
      ])

      setImoveis(imoveisData)
      setContratos(contratosData)
      setReceitas(receitasData)
      setDespesas(despesasData)
      setIptuTaxas(iptuData)
    } catch (err: any) {
      console.error('Erro ao carregar dados do portfólio de imóveis:', err)
      setError('Erro ao carregar dados do servidor. Verifique a conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime subscriptions on all 5 collections
  useRealtime('imoveis', loadData)
  useRealtime('contratos', loadData)
  useRealtime('receitas', loadData)
  useRealtime('despesas', loadData)
  useRealtime('iptu_taxas', loadData)

  // Date helper
  const getDateStr = (val: string | undefined | null): string => {
    if (!val) return ''
    if (val.length >= 10) return val.substring(0, 10)
    return ''
  }

  const isDateInRange = (dStr: string | undefined | null): boolean => {
    const d = getDateStr(dStr)
    if (!d) return false
    if (startDateStr && d < startDateStr) return false
    if (endDateStr && d > endDateStr) return false
    return true
  }

  // Filtered properties based on global status and tipo filters
  const filteredImoveis = useMemo(() => {
    return imoveis.filter((im) => {
      const matchStatus = filterStatus === 'all' || im.status === filterStatus
      const matchTipo = filterTipo === 'all' || im.tipo === filterTipo
      return matchStatus && matchTipo
    })
  }, [imoveis, filterStatus, filterTipo])

  // Set of filtered property IDs for fast lookup
  const filteredImovelIdSet = useMemo(() => {
    return new Set(filteredImoveis.map((im) => im.id))
  }, [filteredImoveis])

  // Helper to format property display name
  const getImovelDisplayName = useCallback((im: ImovelItem | undefined) => {
    if (!im) return 'Imóvel não identificado'
    if (im.nome && im.codigo) return `${im.nome} (${im.codigo})`
    if (im.nome) return im.nome
    if (im.codigo) return `Cód. ${im.codigo}`
    if (im.endereco) {
      return `${im.endereco}${im.numero ? `, ${im.numero}` : ''}`
    }
    return `Imóvel #${im.id.substring(0, 6)}`
  }, [])

  // 1. CARDS KPI CALCULATIONS
  const kpis = useMemo(() => {
    // Total de imóveis ativos no filtro
    const totalAtivos = filteredImoveis.filter((im) => im.status !== 'inativo').length
    const alugados = filteredImoveis.filter((im) => im.status === 'alugado').length
    const vagos = filteredImoveis.filter((im) => im.status === 'vago').length
    const emManutencao = filteredImoveis.filter((im) => im.status === 'em_manutencao').length
    const inativos = filteredImoveis.filter((im) => im.status === 'inativo').length

    // Taxa de ocupação: (Alugados / Total de ativos) * 100
    const taxaOcupacao = totalAtivos > 0 ? (alugados / totalAtivos) * 100 : 0

    // Receita Total do Portfólio: soma de valor_recebido de receitas com status_financeiro = 'recebido'
    // no período e nos imóveis filtrados
    let receitaTotal = 0
    receitas.forEach((r) => {
      if (!r.imovel || !filteredImovelIdSet.has(r.imovel)) return
      if (r.status_financeiro === 'recebido') {
        const d = r.data_recebimento || r.data
        if (isDateInRange(d)) {
          receitaTotal += Number(r.valor_recebido || r.valor || 0)
        }
      }
    })

    // Despesa Total do Portfólio: soma de valor_pago de despesas com status_financeiro = 'pago'
    // no período e nos imóveis filtrados
    let despesaTotal = 0
    despesas.forEach((d) => {
      if (!d.imovel || !filteredImovelIdSet.has(d.imovel)) return
      if (d.status_financeiro === 'pago') {
        const dt = d.data_pagamento || d.data
        if (isDateInRange(dt)) {
          despesaTotal += Number(d.valor_pago || d.valor || 0)
        }
      }
    })

    const resultadoPortfolio = receitaTotal - despesaTotal

    return {
      totalAtivos,
      totalGeral: filteredImoveis.length,
      alugados,
      vagos,
      emManutencao,
      inativos,
      taxaOcupacao,
      receitaTotal,
      despesaTotal,
      resultadoPortfolio,
    }
  }, [filteredImoveis, filteredImovelIdSet, receitas, despesas, startDateStr, endDateStr])

  // 2. GRÁFICO: Receitas por Imóvel (barras horizontais)
  const receitasPorImovelData = useMemo(() => {
    const imovelMap = new Map<string, { id: string; name: string; valor: number }>()

    // Initialize with all filtered properties
    filteredImoveis.forEach((im) => {
      imovelMap.set(im.id, {
        id: im.id,
        name: getImovelDisplayName(im),
        valor: 0,
      })
    })

    receitas.forEach((r) => {
      if (!r.imovel || !imovelMap.has(r.imovel)) return
      if (r.status_financeiro === 'recebido') {
        const d = r.data_recebimento || r.data
        if (isDateInRange(d)) {
          const item = imovelMap.get(r.imovel)!
          item.valor += Number(r.valor_recebido || r.valor || 0)
        }
      }
    })

    return Array.from(imovelMap.values())
      .filter((i) => i.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10) // Top 10
  }, [filteredImoveis, receitas, startDateStr, endDateStr, getImovelDisplayName])

  // 3. GRÁFICO: Despesas por Imóvel (barras horizontais)
  const despesasPorImovelData = useMemo(() => {
    const imovelMap = new Map<string, { id: string; name: string; valor: number }>()

    filteredImoveis.forEach((im) => {
      imovelMap.set(im.id, {
        id: im.id,
        name: getImovelDisplayName(im),
        valor: 0,
      })
    })

    despesas.forEach((d) => {
      if (!d.imovel || !imovelMap.has(d.imovel)) return
      if (d.status_financeiro === 'pago') {
        const dt = d.data_pagamento || d.data
        if (isDateInRange(dt)) {
          const item = imovelMap.get(d.imovel)!
          item.valor += Number(d.valor_pago || d.valor || 0)
        }
      }
    })

    return Array.from(imovelMap.values())
      .filter((i) => i.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10) // Top 10
  }, [filteredImoveis, despesas, startDateStr, endDateStr, getImovelDisplayName])

  // 4. GRÁFICO: Distribuição de Status (gráfico de rosca)
  const statusDistributionData = useMemo(() => {
    const counts = {
      vago: 0,
      alugado: 0,
      em_manutencao: 0,
      inativo: 0,
    }

    filteredImoveis.forEach((im) => {
      const st = im.status || 'vago'
      if (st in counts) {
        counts[st as keyof typeof counts]++
      } else {
        counts.vago++
      }
    })

    return [
      {
        name: 'Alugado',
        key: 'alugado',
        value: counts.alugado,
        color: STATUS_DONUT_COLORS.alugado,
      },
      { name: 'Vago', key: 'vago', value: counts.vago, color: STATUS_DONUT_COLORS.vago },
      {
        name: 'Em manutenção',
        key: 'em_manutencao',
        value: counts.em_manutencao,
        color: STATUS_DONUT_COLORS.em_manutencao,
      },
      {
        name: 'Inativo',
        key: 'inativo',
        value: counts.inativo,
        color: STATUS_DONUT_COLORS.inativo,
      },
    ].filter((item) => item.value > 0)
  }, [filteredImoveis])

  // 5. GRÁFICO: Evolução da Ocupação (contratos ativos por mês)
  const evolucaoOcupacaoData = useMemo(() => {
    // Generate an array of 12 recent months up to current
    const now = new Date()
    const monthsArray: { key: string; label: string; dateObj: Date; count: number }[] = []

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const key = `${yyyy}-${mm}`
      const label = `${MONTH_NAMES_SHORT[d.getMonth()]}/${String(yyyy).slice(2)}`
      monthsArray.push({ key, label, dateObj: d, count: 0 })
    }

    // Filter relevant contracts associated with current filtered properties
    const relevantContratos = contratos.filter((c) => {
      if (!c.imovel) return false
      return filteredImovelIdSet.has(c.imovel)
    })

    monthsArray.forEach((m) => {
      // Month boundaries: from first day to last day of month
      const y = m.dateObj.getFullYear()
      const monthIdx = m.dateObj.getMonth()
      const monthStartStr = `${y}-${String(monthIdx + 1).padStart(2, '0')}-01`
      const lastDayOfMonth = new Date(y, monthIdx + 1, 0).getDate()
      const monthEndStr = `${y}-${String(monthIdx + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`

      // Count active contracts in that month
      let activeInMonth = 0
      relevantContratos.forEach((c) => {
        const start = getDateStr(c.data_inicio)
        const end = getDateStr(c.data_fim)

        // Contract has started on or before the end of this month
        const hasStarted = !start || start <= monthEndStr
        // Contract has not ended before the start of this month
        const hasNotEnded = !end || end >= monthStartStr
        // Contract is not explicitly canceled
        const isNotCancelled = c.status !== 'cancelado'

        if (hasStarted && hasNotEnded && isNotCancelled) {
          activeInMonth++
        }
      })

      m.count = activeInMonth
    })

    return monthsArray.map((m) => ({
      label: m.label,
      contratosAtivos: m.count,
    }))
  }, [contratos, filteredImovelIdSet])

  // 6. GRÁFICO: IPTU e Taxas por Status por Imóvel
  const iptuTaxasPorStatusData = useMemo(() => {
    const imovelMap = new Map<
      string,
      {
        name: string
        pendente: number
        pago: number
        vencido: number
        total: number
      }
    >()

    filteredImoveis.forEach((im) => {
      imovelMap.set(im.id, {
        name: getImovelDisplayName(im),
        pendente: 0,
        pago: 0,
        vencido: 0,
        total: 0,
      })
    })

    iptuTaxas.forEach((taxa) => {
      if (!taxa.imovel || !imovelMap.has(taxa.imovel)) return
      const item = imovelMap.get(taxa.imovel)!
      const val = Number(taxa.valor || 0)
      const st = taxa.status || 'pendente'

      if (st === 'pago') {
        item.pago += val
      } else if (st === 'vencido') {
        item.vencido += val
      } else {
        item.pendente += val
      }
      item.total += val
    })

    // Return properties with IPTU records or top properties
    return Array.from(imovelMap.values())
      .filter((i) => i.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Top 10
  }, [filteredImoveis, iptuTaxas, getImovelDisplayName])

  // 7. TABELA DETALHADA: Resumo por Imóvel
  const resumoPorImovelTable = useMemo(() => {
    // Map of active contracts per imovel
    const activeContractMap = new Map<string, ContratoItem>()
    contratos.forEach((c) => {
      if (c.imovel && c.status === 'ativo' && !activeContractMap.has(c.imovel)) {
        activeContractMap.set(c.imovel, c)
      }
    })

    // Map of financial totals per imovel within period
    const financeMap = new Map<
      string,
      {
        receitas: number
        despesas: number
        iptuPendente: number
      }
    >()

    filteredImoveis.forEach((im) => {
      financeMap.set(im.id, {
        receitas: 0,
        despesas: 0,
        iptuPendente: 0,
      })
    })

    receitas.forEach((r) => {
      if (!r.imovel || !financeMap.has(r.imovel)) return
      if (r.status_financeiro === 'recebido') {
        const d = r.data_recebimento || r.data
        if (isDateInRange(d)) {
          financeMap.get(r.imovel)!.receitas += Number(r.valor_recebido || r.valor || 0)
        }
      }
    })

    despesas.forEach((d) => {
      if (!d.imovel || !financeMap.has(d.imovel)) return
      if (d.status_financeiro === 'pago') {
        const dt = d.data_pagamento || d.data
        if (isDateInRange(dt)) {
          financeMap.get(d.imovel)!.despesas += Number(d.valor_pago || d.valor || 0)
        }
      }
    })

    iptuTaxas.forEach((taxa) => {
      if (!taxa.imovel || !financeMap.has(taxa.imovel)) return
      if (taxa.status === 'pendente' || taxa.status === 'vencido') {
        financeMap.get(taxa.imovel)!.iptuPendente += Number(taxa.valor || 0)
      }
    })

    const rows = filteredImoveis.map((im) => {
      const fin = financeMap.get(im.id) || { receitas: 0, despesas: 0, iptuPendente: 0 }
      const contract = activeContractMap.get(im.id)
      const resultado = fin.receitas - fin.despesas

      return {
        id: im.id,
        rawImovel: im,
        nome: getImovelDisplayName(im),
        codigo: im.codigo,
        tipo: im.tipo || 'outro',
        tipoLabel: TIPO_IMOVEL_LABELS[im.tipo || ''] || im.tipo || 'Outro',
        status: im.status || 'vago',
        statusLabel: STATUS_IMOVEL_LABELS[im.status || ''] || im.status || 'Vago',
        receitas: fin.receitas,
        despesas: fin.despesas,
        resultado,
        hasContratoAtivo: !!contract,
        contratoNumero:
          contract?.numero || (contract ? `Contrato #${contract.id.slice(0, 5)}` : null),
        inquilinoNome: contract?.expand?.inquilino?.nome,
        valorAluguel: contract?.valor_aluguel,
        iptuPendente: fin.iptuPendente,
      }
    })

    // Sort table rows
    rows.sort((a, b) => {
      let comp = 0
      if (tableSortColumn === 'nome') {
        comp = a.nome.localeCompare(b.nome)
      } else if (tableSortColumn === 'tipo') {
        comp = a.tipoLabel.localeCompare(b.tipoLabel)
      } else if (tableSortColumn === 'status') {
        comp = a.statusLabel.localeCompare(b.statusLabel)
      } else if (tableSortColumn === 'receitas') {
        comp = a.receitas - b.receitas
      } else if (tableSortColumn === 'despesas') {
        comp = a.despesas - b.despesas
      } else if (tableSortColumn === 'resultado') {
        comp = a.resultado - b.resultado
      } else if (tableSortColumn === 'contrato') {
        comp = (a.hasContratoAtivo ? 1 : 0) - (b.hasContratoAtivo ? 1 : 0)
      } else if (tableSortColumn === 'iptu') {
        comp = a.iptuPendente - b.iptuPendente
      }

      return tableSortDirection === 'asc' ? comp : -comp
    })

    return rows
  }, [
    filteredImoveis,
    contratos,
    receitas,
    despesas,
    iptuTaxas,
    startDateStr,
    endDateStr,
    tableSortColumn,
    tableSortDirection,
    getImovelDisplayName,
  ])

  // Sorting header helper
  const handleSort = (
    column:
      | 'nome'
      | 'tipo'
      | 'status'
      | 'receitas'
      | 'despesas'
      | 'resultado'
      | 'contrato'
      | 'iptu',
  ) => {
    if (tableSortColumn === column) {
      setTableSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setTableSortColumn(column)
      setTableSortDirection('desc')
    }
  }

  const formatTooltipCurrency = (val: any) => formatCurrency(Number(val) || 0)

  return (
    <div className="space-y-6 pb-12">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-800 text-gold-400 shadow-sm border border-gold-500/20">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Dashboard de Imóveis
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Visão geral e indicadores detalhados de ocupação e rentabilidade do portfólio
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
            Atualizar Dados
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/imoveis')}
            className="bg-navy-800 hover:bg-navy-900 text-gold-400 border border-gold-500/30 w-full sm:w-auto"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Gerenciar Imóveis
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 1. EIGHT KPI CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total de Imóveis */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Total de Imóveis Ativos
                </span>
                <p className="text-lg sm:text-2xl font-bold text-slate-900">{kpis.totalAtivos}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                  <Layers className="h-3 w-3 shrink-0" /> {kpis.totalGeral} cadastrados no total
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                <Building className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Imóveis Alugados */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Imóveis Alugados
                </span>
                <p className="text-xl sm:text-2xl font-bold text-emerald-700">{kpis.alugados}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3 shrink-0" /> Gerando receita de locação
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Imóveis Vagos */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Imóveis Vagos
                </span>
                <p className="text-xl sm:text-2xl font-bold text-sky-700">{kpis.vagos}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700">
                  <Clock className="h-3 w-3 shrink-0" /> Disponíveis para locação
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-200/60 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Em Manutenção */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Em Manutenção
                </span>
                <p className="text-xl sm:text-2xl font-bold text-amber-700">{kpis.emManutencao}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                  <Wrench className="h-3 w-3 shrink-0" /> Obras ou reparos ativos
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                <Wrench className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Taxa de Ocupação */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Taxa de Ocupação
                </span>
                <p className="text-xl sm:text-2xl font-bold text-indigo-600">
                  {kpis.taxaOcupacao.toFixed(1)}%
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                  <Percent className="h-3 w-3 shrink-0" /> (Alugados / Ativos) × 100
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 shrink-0">
                <Percent className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Receita Total do Portfólio */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Receita Total (Recebida)
                </span>
                <p className="text-lg sm:text-2xl font-bold text-emerald-700 truncate">
                  {formatCurrency(kpis.receitaTotal)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <TrendingUp className="h-3 w-3 shrink-0" /> Realizada no período
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 7: Despesa Total do Portfólio */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate block">
                  Despesa Total (Paga)
                </span>
                <p className="text-lg sm:text-2xl font-bold text-rose-700 truncate">
                  {formatCurrency(kpis.despesaTotal)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
                  <TrendingDown className="h-3 w-3 shrink-0" /> Paga no período
                </span>
              </div>
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 shrink-0">
                <TrendingDown className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 8: Resultado do Portfólio (Destaque Holding) */}
          <Card
            className={`border-2 shadow-sm transition-all sm:col-span-2 lg:col-span-1 ${
              kpis.resultadoPortfolio >= 0
                ? 'border-emerald-500 bg-gradient-to-br from-emerald-900 to-navy-900 text-white'
                : 'border-rose-500 bg-gradient-to-br from-rose-900 to-navy-900 text-white'
            }`}
          >
            <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold-300">
                    Resultado Portfólio
                  </span>
                  <span
                    className={`text-xs uppercase font-bold px-2 py-0.5 rounded-full ${
                      kpis.resultadoPortfolio >= 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                    }`}
                  >
                    {kpis.resultadoPortfolio >= 0 ? 'Lucro' : 'Prejuízo'}
                  </span>
                </div>
                <p className="text-lg sm:text-2xl font-extrabold tracking-tight truncate">
                  {formatCurrency(kpis.resultadoPortfolio)}
                </p>
                <p className="text-xs text-slate-300">Receitas − Despesas</p>
              </div>
              <div
                className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl shrink-0 ${
                  kpis.resultadoPortfolio >= 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. FILTROS GLOBAIS */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <CardTitle className="text-sm font-semibold text-slate-800">
              Filtros Globais do Portfólio
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Quick period buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 mr-2">Período Financeiro:</span>
            {[
              { id: 'current_month', label: 'Mês atual' },
              { id: 'last_month', label: 'Mês anterior' },
              { id: 'last_3_months', label: 'Últimos 3M' },
              { id: 'last_6_months', label: 'Últimos 6M' },
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
            {/* Status do Imóvel */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-slate-600" />
                Status do Imóvel
              </Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger aria-label="Todos os status" className="h-9 text-xs bg-slate-50/50">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="vago">Vago</SelectItem>
                  <SelectItem value="alugado">Alugado</SelectItem>
                  <SelectItem value="em_manutencao">Em manutenção</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo do Imóvel */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-600" />
                Tipo do Imóvel
              </Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger aria-label="Todos os tipos" className="h-9 text-xs bg-slate-50/50">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(TIPO_IMOVEL_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Inputs if Custom selected */}
            {periodPreset === 'custom' ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="cust-start" className="text-xs text-slate-600 font-medium">
                    Data Início
                  </Label>
                  <Input
                    id="cust-start"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cust-end" className="text-xs text-slate-600 font-medium">
                    Data Fim
                  </Label>
                  <Input
                    id="cust-end"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 flex items-center justify-end text-xs text-slate-600 pt-5">
                <span>
                  Exibindo dados de {startDateStr} até {endDateStr}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. GRÁFICOS DO PORTFÓLIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Receitas por Imóvel (Barras Horizontais) */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-700" />
              Receitas por Imóvel
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 mt-0.5">
              Valores recebidos no período selecionado ordenados do maior para o menor
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[250px] sm:h-[320px] lg:h-[350px] w-full">
              {receitasPorImovelData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-600">
                  Nenhuma receita recebida registrada para o filtro e período
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
                      width={130}
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
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Despesas por Imóvel (Barras Horizontais) */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-rose-700" />
              Despesas por Imóvel
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 mt-0.5">
              Valores pagos no período selecionado ordenados do maior para o menor
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[250px] sm:h-[320px] lg:h-[350px] w-full">
              {despesasPorImovelData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-600">
                  Nenhuma despesa paga registrada para o filtro e período
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
                      width={130}
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

        {/* Gráfico 3: Distribuição de Status (Rosca) */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-indigo-600" />
              Distribuição de Status dos Imóveis
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 mt-0.5">
              Proporção de imóveis por situação atual (Vago, Alugado, Em manutenção, Inativo)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="h-[220px] sm:h-[260px] md:h-[280px] w-full md:flex-1">
                {' '}
                {statusDistributionData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-600">
                    Nenhum imóvel encontrado
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {statusDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any, name: any) => [`${val} unidade(s)`, name]}
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
              <div className="w-full md:w-48 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-1 gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                {statusDistributionData.map((st) => (
                  <div
                    key={st.key}
                    className="flex items-center justify-between text-xs py-1 px-2 md:px-0 bg-slate-50 md:bg-transparent rounded-md md:rounded-none md:border-b md:border-slate-100 last:border-none"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: st.color }}
                      />
                      <span className="font-medium text-slate-700 truncate text-xs sm:text-xs">
                        {st.name}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 ml-1">{st.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>{' '}
        </Card>

        {/* Gráfico 4: Evolução da Ocupação (Linha de Contratos Ativos) */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <LineIcon className="h-4 w-4 text-emerald-700" />
              Evolução da Ocupação
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 mt-0.5">
              Histórico de contratos ativos por mês (baseado nas datas de vigência)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[250px] sm:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={evolucaoOcupacaoData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    formatter={(val: any) => [`${val} contratos ativos`, 'Ocupação']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    name="Contratos Ativos"
                    type="monotone"
                    dataKey="contratosAtivos"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 5: IPTU e Taxas por Status (Barras Agrupadas/Empilhadas) */}
        <Card className="border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-gold-500" />
              IPTU e Taxas por Status por Imóvel
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 mt-0.5">
              Comparativo de valores Pagos, Pendentes e Vencidos por propriedade
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[250px] sm:h-[320px] lg:h-[350px] w-full">
              {iptuTaxasPorStatusData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-600">
                  Nenhuma taxa ou IPTU cadastrado para os imóveis filtrados
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={iptuTaxasPorStatusData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
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
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                      }}
                    />
                    <RechartsLegend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Bar
                      name="Pago"
                      dataKey="pago"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={35}
                    />
                    <Bar
                      name="Pendente"
                      dataKey="pendente"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={35}
                    />
                    <Bar
                      name="Vencido"
                      dataKey="vencido"
                      fill="#e11d48"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={35}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. TABELA DETALHADA: RESUMO POR IMÓVEL */}
      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-navy-800" />
                Resumo Detalhado por Imóvel
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 mt-0.5">
                Métricas consolidadas de receitas, despesas, contratos ativos e pendências de IPTU
                por propriedade. Clique no imóvel para abrir a página de imóveis.
              </CardDescription>
            </div>
            <div className="text-xs text-slate-600 font-medium">
              {resumoPorImovelTable.length} imóvel(is) exibido(s)
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {resumoPorImovelTable.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-600">
              <Building2 className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">
                Nenhum imóvel corresponde aos filtros selecionados
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards (sm:hidden) */}
              <div className="sm:hidden divide-y divide-slate-100 p-3 space-y-3">
                {resumoPorImovelTable.map((row) => (
                  <div
                    key={row.id}
                    className="p-3.5 bg-slate-50/50 rounded-lg border border-slate-200/80 space-y-2.5 active:bg-slate-100/60"
                    onClick={() => navigate('/imoveis')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-sm truncate">
                          {row.nome}
                        </div>
                        {row.rawImovel.endereco && (
                          <div className="text-xs text-slate-600 truncate">
                            {row.rawImovel.endereco}
                          </div>
                        )}
                      </div>
                      <StatusBadge type="imovel" status={row.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-slate-600 block text-xs uppercase">Receitas</span>
                        <span className="font-semibold text-emerald-700 truncate block">
                          {formatCurrency(row.receitas)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-xs uppercase">Despesas</span>
                        <span className="font-semibold text-rose-700 truncate block">
                          {formatCurrency(row.despesas)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-600 block text-xs uppercase">Resultado</span>
                        <span
                          className={`font-bold truncate block ${
                            row.resultado > 0
                              ? 'text-emerald-700'
                              : row.resultado < 0
                                ? 'text-rose-700'
                                : 'text-slate-600'
                          }`}
                        >
                          {formatCurrency(row.resultado)}
                        </span>
                      </div>
                    </div>

                    {(row.hasContratoAtivo || row.iptuPendente > 0) && (
                      <div className="flex items-center justify-between gap-2 pt-1.5 text-xs border-t border-slate-100">
                        {row.hasContratoAtivo ? (
                          <span className="text-xs text-emerald-700 font-medium truncate">
                            Inquilino: {row.inquilinoNome || 'Locado'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">Sem contrato</span>
                        )}
                        {row.iptuPendente > 0 ? (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            IPTU: {formatCurrency(row.iptuPendente)}
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-700">IPTU em dia</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead
                        className="font-semibold text-slate-700 py-3 cursor-pointer hover:bg-slate-100/80 select-none sticky left-0 bg-slate-50/95 z-10"
                        onClick={() => handleSort('nome')}
                      >
                        <div className="inline-flex items-center gap-1">
                          <span>Imóvel</span>
                          {tableSortColumn === 'nome' &&
                            (tableSortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-navy-800" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-navy-800" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-slate-700 py-3 cursor-pointer hover:bg-slate-100/80 select-none"
                        onClick={() => handleSort('tipo')}
                      >
                        <div className="inline-flex items-center gap-1">
                          <span>Tipo</span>
                          {tableSortColumn === 'tipo' &&
                            (tableSortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-navy-800" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-navy-800" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-slate-700 py-3 cursor-pointer hover:bg-slate-100/80 select-none"
                        onClick={() => handleSort('status')}
                      >
                        <div className="inline-flex items-center gap-1">
                          <span>Status</span>
                          {tableSortColumn === 'status' &&
                            (tableSortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-navy-800" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-navy-800" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-slate-700 text-right py-3 cursor-pointer hover:bg-slate-100/80 select-none"
                        onClick={() => handleSort('receitas')}
                      >
                        <div className="inline-flex items-center gap-1 justify-end">
                          <span>Receitas</span>
                          {tableSortColumn === 'receitas' &&
                            (tableSortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-navy-800" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-navy-800" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-slate-700 text-right py-3 cursor-pointer hover:bg-slate-100/80 select-none"
                        onClick={() => handleSort('despesas')}
                      >
                        <div className="inline-flex items-center gap-1 justify-end">
                          <span>Despesas</span>
                          {tableSortColumn === 'despesas' &&
                            (tableSortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-navy-800" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-navy-800" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-slate-700 text-right py-3 cursor-pointer hover:bg-slate-100/80 select-none"
                        onClick={() => handleSort('resultado')}
                      >
                        <div className="inline-flex items-center gap-1 justify-end">
                          <span>Resultado</span>
                          {tableSortColumn === 'resultado' &&
                            (tableSortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-navy-800" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-navy-800" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-slate-700 py-3 cursor-pointer hover:bg-slate-100/80 select-none"
                        onClick={() => handleSort('contrato')}
                      >
                        <div className="inline-flex items-center gap-1">
                          <span>Contrato Ativo</span>
                          {tableSortColumn === 'contrato' &&
                            (tableSortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-navy-800" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-navy-800" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-slate-700 text-right py-3 cursor-pointer hover:bg-slate-100/80 select-none"
                        onClick={() => handleSort('iptu')}
                      >
                        <div className="inline-flex items-center gap-1 justify-end">
                          <span>IPTU Pendente</span>
                          {tableSortColumn === 'iptu' &&
                            (tableSortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-navy-800" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-navy-800" />
                            ))}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumoPorImovelTable.map((row) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                        onClick={() => navigate('/imoveis')}
                      >
                        <TableCell className="py-3 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10">
                          <div className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 flex items-center gap-1.5">
                            <span>{row.nome}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                          </div>
                          {row.rawImovel.endereco && (
                            <div className="text-xs text-slate-600 truncate max-w-[220px]">
                              {row.rawImovel.endereco}
                              {row.rawImovel.bairro ? ` - ${row.rawImovel.bairro}` : ''}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-medium">
                          {row.tipoLabel}
                        </TableCell>
                        <TableCell>
                          <StatusBadge type="imovel" status={row.status} />
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-emerald-700">
                          {formatCurrency(row.receitas)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-rose-700">
                          {formatCurrency(row.despesas)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`text-sm font-bold ${
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
                        <TableCell className="text-xs">
                          {row.hasContratoAtivo ? (
                            <div>
                              <span className="font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full inline-block">
                                {row.inquilinoNome || 'Locado'}
                              </span>
                              {row.valorAluguel ? (
                                <span className="block text-xs text-slate-600 mt-0.5">
                                  {formatCurrency(row.valorAluguel)}/mês
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-600 italic">Nenhum</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold">
                          {row.iptuPendente > 0 ? (
                            <span className="text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md inline-block">
                              {formatCurrency(row.iptuPendente)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-normal">Em dia</span>
                          )}
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
