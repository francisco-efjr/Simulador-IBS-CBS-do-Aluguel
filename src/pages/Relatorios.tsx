import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Building2,
  Filter,
  CheckCircle2,
  TrendingUp,
  Building,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react'
import dados from '@/lib/dados/cliente'
import { formatCurrency, formatDate } from '@/lib/format'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import {
  exportarRelatorioFinanceiroPDF,
  exportarRelatorioFinanceiroExcel,
  exportarRelatorioImoveisPDF,
  exportarRelatorioImoveisExcel,
  exportarRelatorioContratosPDF,
  exportarRelatorioContratosExcel,
  exportarRelatorioInadimplenciaPDF,
  exportarRelatorioInadimplenciaExcel,
} from '@/lib/reports-generator'

type ReportType = 'financeiro' | 'imoveis' | 'contratos' | 'inadimplencia'
type ReportFormat = 'pdf' | 'xlsx'
type PeriodPreset =
  | 'current_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'current_year'
  | 'all_time'
  | 'custom'

export default function Relatorios() {
  // Config state
  const [reportType, setReportType] = useState<ReportType>('financeiro')
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf')
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('current_month')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [selectedImovel, setSelectedImovel] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedTipo, setSelectedTipo] = useState<string>('all')

  // Data state
  const [loading, setLoading] = useState<boolean>(true)
  const [generating, setGenerating] = useState<boolean>(false)
  const [imoveis, setImoveis] = useState<any[]>([])
  const [contratos, setContratos] = useState<any[]>([])
  const [receitas, setReceitas] = useState<any[]>([])
  const [despesas, setDespesas] = useState<any[]>([])
  const [iptuTaxas, setIptuTaxas] = useState<any[]>([])

  // Load all necessary DB data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [imoveisData, contratosData, receitasData, despesasData, iptuData] = await Promise.all([
        dados.colecao('imoveis').getFullList({ sort: 'nome,codigo,endereco' }),
        dados.colecao('contratos').getFullList({ sort: '-created', expand: 'imovel,inquilino' }),
        dados.colecao('receitas').getFullList({
          sort: '-created',
          expand: 'imovel,inquilino,categoria,contrato',
        }),
        dados.colecao('despesas').getFullList({
          sort: '-created',
          expand: 'imovel,fornecedor,categoria',
        }),
        dados.colecao('iptu_taxas').getFullList({ sort: '-created', expand: 'imovel' }),
      ])

      setImoveis(imoveisData)
      setContratos(contratosData)
      setReceitas(receitasData)
      setDespesas(despesasData)
      setIptuTaxas(iptuData)
    } catch (err) {
      console.error('Erro ao carregar dados para relatórios:', err)
      toast.error('Não foi possível carregar os dados. Atualize a página e tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Compute start and end dates
  const { startDateStr, endDateStr, periodoLabel } = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const formatDateIso = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    if (periodPreset === 'current_month') {
      const firstDay = new Date(currentYear, currentMonth, 1)
      const lastDay = new Date(currentYear, currentMonth + 1, 0)
      const startStr = formatDateIso(firstDay)
      const endStr = formatDateIso(lastDay)
      return {
        startDateStr: startStr,
        endDateStr: endStr,
        periodoLabel: `Mês Atual (${formatDate(startStr)} a ${formatDate(endStr)})`,
      }
    }

    if (periodPreset === 'last_month') {
      const firstDay = new Date(currentYear, currentMonth - 1, 1)
      const lastDay = new Date(currentYear, currentMonth, 0)
      const startStr = formatDateIso(firstDay)
      const endStr = formatDateIso(lastDay)
      return {
        startDateStr: startStr,
        endDateStr: endStr,
        periodoLabel: `Mês Anterior (${formatDate(startStr)} a ${formatDate(endStr)})`,
      }
    }

    if (periodPreset === 'last_3_months') {
      const firstDay = new Date(currentYear, currentMonth - 2, 1)
      const lastDay = new Date(currentYear, currentMonth + 1, 0)
      const startStr = formatDateIso(firstDay)
      const endStr = formatDateIso(lastDay)
      return {
        startDateStr: startStr,
        endDateStr: endStr,
        periodoLabel: `Últimos 3 Meses (${formatDate(startStr)} a ${formatDate(endStr)})`,
      }
    }

    if (periodPreset === 'last_6_months') {
      const firstDay = new Date(currentYear, currentMonth - 5, 1)
      const lastDay = new Date(currentYear, currentMonth + 1, 0)
      const startStr = formatDateIso(firstDay)
      const endStr = formatDateIso(lastDay)
      return {
        startDateStr: startStr,
        endDateStr: endStr,
        periodoLabel: `Últimos 6 Meses (${formatDate(startStr)} a ${formatDate(endStr)})`,
      }
    }

    if (periodPreset === 'current_year') {
      const firstDay = new Date(currentYear, 0, 1)
      const lastDay = new Date(currentYear, 11, 31)
      const startStr = formatDateIso(firstDay)
      const endStr = formatDateIso(lastDay)
      return {
        startDateStr: startStr,
        endDateStr: endStr,
        periodoLabel: `Ano de ${currentYear} (${formatDate(startStr)} a ${formatDate(endStr)})`,
      }
    }

    if (periodPreset === 'all_time') {
      return {
        startDateStr: '1970-01-01',
        endDateStr: '2099-12-31',
        periodoLabel: 'Todo o Histórico Cadastrado',
      }
    }

    if (periodPreset === 'custom') {
      const start = customStartDate || '1970-01-01'
      const end = customEndDate || '2099-12-31'
      return {
        startDateStr: start,
        endDateStr: end,
        periodoLabel: `Personalizado (${formatDate(start)} a ${formatDate(end)})`,
      }
    }

    return { startDateStr: '', endDateStr: '', periodoLabel: 'Geral' }
  }, [periodPreset, customStartDate, customEndDate])

  // Helper date check
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

  const getImovelDisplayName = useCallback(
    (imovelId?: string, fallbackExpand?: any) => {
      if (fallbackExpand?.nome) return fallbackExpand.nome
      if (fallbackExpand?.endereco) return fallbackExpand.endereco
      if (imovelId) {
        const found = imoveis.find((im) => im.id === imovelId)
        if (found) return found.nome || found.endereco || `Imóvel #${found.codigo || found.id}`
      }
      return 'Imóvel não identificado'
    },
    [imoveis],
  )

  const calcDaysDiff = (dateStr: string): number => {
    if (!dateStr) return 0
    const target = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Generate Report Handler
  const handleGerarRelatorio = async () => {
    try {
      setGenerating(true)
      const imovelFilterLabel =
        selectedImovel === 'all' ? 'Todos os Imóveis' : getImovelDisplayName(selectedImovel)

      // 1. RELATÓRIO FINANCEIRO
      if (reportType === 'financeiro') {
        let receitasRecebidas = 0
        let despesasPagas = 0
        let receitasPendentes = 0
        let receitasVencidas = 0
        let despesasPendentes = 0
        let despesasVencidas = 0

        receitas.forEach((r) => {
          if (selectedImovel !== 'all' && r.imovel !== selectedImovel) return
          const status = r.status_financeiro || ''
          const recDate = r.data_recebimento || r.data
          const vencDate = r.data_vencimento || r.data

          if (status === 'recebido') {
            if (isDateInRange(recDate)) {
              receitasRecebidas += Number(r.valor_recebido || r.valor || 0)
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
          if (selectedImovel !== 'all' && d.imovel !== selectedImovel) return
          const status = d.status_financeiro || ''
          const pagDate = d.data_pagamento || d.data
          const vencDate = d.data_vencimento || d.data

          if (status === 'pago') {
            if (isDateInRange(pagDate)) {
              despesasPagas += Number(d.valor_pago || d.valor || 0)
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

        // Resumo por imóvel
        const summaryMap = new Map<
          string,
          { nome: string; codigo?: string; receitas: number; despesas: number; resultado: number }
        >()

        imoveis.forEach((im) => {
          if (selectedImovel !== 'all' && im.id !== selectedImovel) return
          summaryMap.set(im.id, {
            nome: im.nome || im.endereco || `Imóvel #${im.codigo || im.id}`,
            codigo: im.codigo,
            receitas: 0,
            despesas: 0,
            resultado: 0,
          })
        })

        receitas.forEach((r) => {
          if (r.status_financeiro !== 'recebido') return
          if (selectedImovel !== 'all' && r.imovel !== selectedImovel) return
          if (!isDateInRange(r.data_recebimento || r.data)) return
          const imId = r.imovel || 'sem_imovel'
          if (!summaryMap.has(imId)) {
            summaryMap.set(imId, {
              nome: getImovelDisplayName(r.imovel, r.expand?.imovel),
              codigo: r.expand?.imovel?.codigo,
              receitas: 0,
              despesas: 0,
              resultado: 0,
            })
          }
          summaryMap.get(imId)!.receitas += Number(r.valor_recebido || r.valor || 0)
        })

        despesas.forEach((d) => {
          if (d.status_financeiro !== 'pago') return
          if (selectedImovel !== 'all' && d.imovel !== selectedImovel) return
          if (!isDateInRange(d.data_pagamento || d.data)) return
          const imId = d.imovel || 'sem_imovel'
          if (!summaryMap.has(imId)) {
            summaryMap.set(imId, {
              nome: getImovelDisplayName(d.imovel, d.expand?.imovel),
              codigo: d.expand?.imovel?.codigo,
              receitas: 0,
              despesas: 0,
              resultado: 0,
            })
          }
          summaryMap.get(imId)!.despesas += Number(d.valor_pago || d.valor || 0)
        })

        const imoveisSummary = Array.from(summaryMap.values()).map((row) => ({
          ...row,
          resultado: row.receitas - row.despesas,
        }))

        const payload = {
          periodoLabel,
          startDateStr,
          endDateStr,
          imovelFilterLabel,
          kpis: {
            receitasRecebidas,
            despesasPagas,
            resultadoLiquido,
            receitasPendentes,
            receitasVencidas,
            despesasPendentes,
            despesasVencidas,
          },
          imoveisSummary,
        }

        if (reportFormat === 'pdf') {
          await exportarRelatorioFinanceiroPDF(payload)
        } else {
          exportarRelatorioFinanceiroExcel(payload)
        }
        toast.success('Relatório financeiro gerado com sucesso.')
      }

      // 2. RELATÓRIO DE IMÓVEIS
      else if (reportType === 'imoveis') {
        const filtered = imoveis.filter((im) => {
          if (selectedStatus !== 'all' && im.status !== selectedStatus) return false
          if (selectedTipo !== 'all' && im.tipo !== selectedTipo) return false
          if (selectedImovel !== 'all' && im.id !== selectedImovel) return false
          return true
        })

        const total = filtered.length
        const alugados = filtered.filter((i) => i.status === 'alugado').length
        const vagos = filtered.filter((i) => i.status === 'vago').length
        const manutencao = filtered.filter((i) => i.status === 'em_manutencao').length
        const inativos = filtered.filter((i) => i.status === 'inativo').length
        const totalAtivos = filtered.filter((i) => i.status !== 'inativo').length
        const taxaOcupacao = totalAtivos > 0 ? (alugados / totalAtivos) * 100 : 0

        // Financial map
        const financeMap = new Map<
          string,
          { receitas: number; despesas: number; iptuPendente: number }
        >()
        filtered.forEach((im) => {
          financeMap.set(im.id, { receitas: 0, despesas: 0, iptuPendente: 0 })
        })

        receitas.forEach((r) => {
          if (!r.imovel || !financeMap.has(r.imovel)) return
          if (r.status_financeiro === 'recebido' && isDateInRange(r.data_recebimento || r.data)) {
            financeMap.get(r.imovel)!.receitas += Number(r.valor_recebido || r.valor || 0)
          }
        })

        despesas.forEach((d) => {
          if (!d.imovel || !financeMap.has(d.imovel)) return
          if (d.status_financeiro === 'pago' && isDateInRange(d.data_pagamento || d.data)) {
            financeMap.get(d.imovel)!.despesas += Number(d.valor_pago || d.valor || 0)
          }
        })

        iptuTaxas.forEach((taxa) => {
          if (!taxa.imovel || !financeMap.has(taxa.imovel)) return
          if (taxa.status === 'pendente' || taxa.status === 'vencido') {
            financeMap.get(taxa.imovel)!.iptuPendente += Number(taxa.valor || 0)
          }
        })

        // Active contracts map
        const activeContracts = new Map<string, any>()
        contratos.forEach((c) => {
          if (c.imovel && c.status === 'ativo' && !activeContracts.has(c.imovel)) {
            activeContracts.set(c.imovel, c)
          }
        })

        let receitaTotal = 0
        let despesaTotal = 0

        const imoveisDetalhados = filtered.map((im) => {
          const fin = financeMap.get(im.id)!
          receitaTotal += fin.receitas
          despesaTotal += fin.despesas
          const ct = activeContracts.get(im.id)

          return {
            nome: getImovelDisplayName(im.id, im),
            codigo: im.codigo,
            tipo: im.tipo || 'outro',
            status: im.status || 'vago',
            receitas: fin.receitas,
            despesas: fin.despesas,
            resultado: fin.receitas - fin.despesas,
            contratoAtivo: ct?.numero || (ct ? `Contrato #${ct.id.slice(0, 6)}` : ''),
            inquilinoNome: ct?.expand?.inquilino?.nome || '',
            iptuPendente: fin.iptuPendente,
          }
        })

        const payload = {
          periodoLabel,
          statusFilterLabel: selectedStatus === 'all' ? 'Todos os status' : selectedStatus,
          tipoFilterLabel: selectedTipo === 'all' ? 'Todos os tipos' : selectedTipo,
          kpis: {
            total,
            alugados,
            vagos,
            manutencao,
            inativos,
            taxaOcupacao,
            receitaTotal,
            despesaTotal,
            resultado: receitaTotal - despesaTotal,
          },
          imoveisDetalhados,
        }

        if (reportFormat === 'pdf') {
          await exportarRelatorioImoveisPDF(payload)
        } else {
          exportarRelatorioImoveisExcel(payload)
        }
        toast.success('Relatório de imóveis gerado com sucesso.')
      }

      // 3. RELATÓRIO DE CONTRATOS
      else if (reportType === 'contratos') {
        const filteredContratos = contratos.filter((c) => {
          if (selectedStatus !== 'all' && c.status !== selectedStatus) return false
          if (selectedImovel !== 'all' && c.imovel !== selectedImovel) return false
          if (periodPreset !== 'all_time') {
            // Check if contract is active within date range
            const start = getDateStr(c.data_inicio)
            const end = getDateStr(c.data_fim)
            if (start && start > endDateStr) return false
            if (end && end < startDateStr) return false
          }
          return true
        })

        const list = filteredContratos.map((c) => {
          const dias = c.data_fim ? calcDaysDiff(c.data_fim) : 999
          return {
            numero: c.numero || `Contrato #${c.id.slice(0, 6)}`,
            imovelNome: getImovelDisplayName(c.imovel, c.expand?.imovel),
            inquilinoNome: c.expand?.inquilino?.nome || 'Não informado',
            dataInicio: c.data_inicio,
            dataFim: c.data_fim,
            valorAluguel: Number(c.valor_aluguel || 0),
            status: c.status || 'ativo',
            diasRestantes: dias,
            indiceReajuste: c.indice_reajuste,
            proximoReajuste: c.proxima_data_reajuste,
          }
        })

        const payload = {
          periodoLabel,
          statusFilterLabel: selectedStatus === 'all' ? 'Todos os status' : selectedStatus,
          imovelFilterLabel,
          contratos: list,
        }

        if (reportFormat === 'pdf') {
          await exportarRelatorioContratosPDF(payload)
        } else {
          exportarRelatorioContratosExcel(payload)
        }
        toast.success('Relatório de contratos gerado com sucesso.')
      }

      // 4. RELATÓRIO DE INADIMPLÊNCIA
      else if (reportType === 'inadimplencia') {
        const receitasEmAtraso: any[] = []
        const despesasEmAtraso: any[] = []
        const iptuVencidos: any[] = []

        receitas.forEach((r) => {
          if (r.status_financeiro === 'recebido') return
          if (selectedImovel !== 'all' && r.imovel !== selectedImovel) return
          const dt = r.data_vencimento || r.data
          const dias = dt ? calcDaysDiff(dt) : 0
          if (r.status_financeiro === 'em_atraso' || dias < 0) {
            receitasEmAtraso.push({
              imovelNome: getImovelDisplayName(r.imovel, r.expand?.imovel),
              inquilinoNome: r.expand?.inquilino?.nome || '—',
              descricao: r.descricao || 'Aluguel / Taxa',
              dataVencimento: dt,
              diasAtraso: Math.abs(dias),
              valor: Number(r.valor_previsto || r.valor || 0),
            })
          }
        })

        despesas.forEach((d) => {
          if (d.status_financeiro === 'pago') return
          if (selectedImovel !== 'all' && d.imovel !== selectedImovel) return
          const dt = d.data_vencimento || d.data
          const dias = dt ? calcDaysDiff(dt) : 0
          if (d.status_financeiro === 'em_atraso' || dias < 0) {
            despesasEmAtraso.push({
              imovelNome: getImovelDisplayName(d.imovel, d.expand?.imovel),
              fornecedorNome: d.expand?.fornecedor?.nome || '—',
              descricao: d.descricao || 'Despesa em Aberto',
              dataVencimento: dt,
              diasAtraso: Math.abs(dias),
              valor: Number(d.valor_previsto || d.valor || 0),
            })
          }
        })

        iptuTaxas.forEach((taxa) => {
          if (taxa.status === 'pago') return
          if (selectedImovel !== 'all' && taxa.imovel !== selectedImovel) return
          const dt = taxa.vencimento
          const dias = dt ? calcDaysDiff(dt) : 0
          if (taxa.status === 'vencido' || dias < 0) {
            iptuVencidos.push({
              imovelNome: getImovelDisplayName(taxa.imovel, taxa.expand?.imovel),
              descricao: taxa.descricao || 'IPTU / Tributo',
              tipo: taxa.tipo || 'iptu',
              vencimento: dt,
              diasAtraso: Math.abs(dias),
              valor: Number(taxa.valor || 0),
            })
          }
        })

        const payload = {
          periodoLabel,
          imovelFilterLabel,
          receitasEmAtraso,
          despesasEmAtraso,
          iptuVencidos,
        }

        if (reportFormat === 'pdf') {
          await exportarRelatorioInadimplenciaPDF(payload)
        } else {
          exportarRelatorioInadimplenciaExcel(payload)
        }
        toast.success('Relatório de inadimplência gerado com sucesso.')
      }
    } catch (err) {
      console.error('Erro ao gerar relatório:', err)
      toast.error('Não foi possível gerar o arquivo. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800 text-gold-400 shadow-md border border-gold-500/20">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Exportação de Relatórios
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Gere relatórios executivos em PDF com layout Holding Aguiar ou planilhas Excel (XLSX)
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Banco
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: CONFIGURAÇÃO DO RELATÓRIO */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. SELETOR DE TIPO DE RELATÓRIO */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-500" />
                1. Selecione o Tipo de Relatório
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Escolha o modelo de dados consolidado que deseja exportar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Tipo A: Financeiro */}
                <div
                  onClick={() => setReportType('financeiro')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    reportType === 'financeiro'
                      ? 'border-gold-500 bg-gold-500/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                      reportType === 'financeiro'
                        ? 'bg-navy-800 text-gold-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 block">
                      Relatório Financeiro
                    </span>
                    <p className="text-xs text-slate-600">
                      7 indicadores do dashboard (receitas, despesas, superávit/déficit) e resumo
                      por imóvel.
                    </p>
                  </div>
                </div>

                {/* Tipo B: Imóveis */}
                <div
                  onClick={() => setReportType('imoveis')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    reportType === 'imoveis'
                      ? 'border-gold-500 bg-gold-500/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                      reportType === 'imoveis'
                        ? 'bg-navy-800 text-gold-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 block">
                      Relatório de Imóveis
                    </span>
                    <p className="text-xs text-slate-600">
                      Taxa de ocupação, situação, contratos ativos e balanço financeiro por
                      propriedade.
                    </p>
                  </div>
                </div>

                {/* Tipo C: Contratos */}
                <div
                  onClick={() => setReportType('contratos')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    reportType === 'contratos'
                      ? 'border-gold-500 bg-gold-500/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                      reportType === 'contratos'
                        ? 'bg-navy-800 text-gold-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 block">
                      Relatório de Contratos
                    </span>
                    <p className="text-xs text-slate-600">
                      Relação completa de locações, inquilinos, vigências, aluguéis e dias
                      restantes.
                    </p>
                  </div>
                </div>

                {/* Tipo D: Inadimplência */}
                <div
                  onClick={() => setReportType('inadimplencia')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    reportType === 'inadimplencia'
                      ? 'border-gold-500 bg-gold-500/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                      reportType === 'inadimplencia'
                        ? 'bg-navy-800 text-gold-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 block">
                      Relatório de Inadimplência
                    </span>
                    <p className="text-xs text-slate-600">
                      Receitas em atraso, despesas operacionais vencidas e tributos/IPTU pendentes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. FORMATO & FILTROS DE PERÍODO */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Filter className="h-4 w-4 text-navy-800" />
                2. Formato e Parâmetros de Filtro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Formato: PDF vs Excel */}
              <div>
                <Label className="text-xs font-semibold text-slate-600 block mb-2">
                  Formato de Exportação:
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setReportFormat('pdf')}
                    className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 transition-all ${
                      reportFormat === 'pdf'
                        ? 'border-navy-800 bg-navy-50/40 text-navy-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-100 text-rose-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Documento PDF (.pdf)</div>
                      <span className="text-xs text-slate-600 block">
                        Com timbre e layout visual executivo
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setReportFormat('xlsx')}
                    className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 transition-all ${
                      reportFormat === 'xlsx'
                        ? 'border-navy-800 bg-navy-50/40 text-navy-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Planilha Excel (.xlsx)</div>
                      <span className="text-xs text-slate-600 block">
                        Dados tabulados para análise e fórmulas
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Período */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 block">
                  Período dos Dados:
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'current_month', label: 'Mês Atual' },
                    { id: 'last_month', label: 'Mês Anterior' },
                    { id: 'last_3_months', label: 'Últimos 3M' },
                    { id: 'last_6_months', label: 'Últimos 6M' },
                    { id: 'current_year', label: 'Ano Atual' },
                    { id: 'all_time', label: 'Todo o Período' },
                    { id: 'custom', label: 'Personalizado' },
                  ].map((p) => {
                    const isActive = periodPreset === p.id
                    return (
                      <Button
                        key={p.id}
                        type="button"
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

                {periodPreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label htmlFor="rep-start" className="text-xs text-slate-600">
                        Data Inicial
                      </Label>
                      <Input
                        id="rep-start"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="h-9 text-xs bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rep-end" className="text-xs text-slate-600">
                        Data Final
                      </Label>
                      <Input
                        id="rep-end"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="h-9 text-xs bg-slate-50/50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Filtros específicos por Imóvel / Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Imóvel */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-600" />
                    Filtrar por Imóvel:
                  </Label>
                  <Select value={selectedImovel} onValueChange={setSelectedImovel}>
                    <SelectTrigger
                      aria-label="Todos os imóveis"
                      className="h-9 text-xs bg-slate-50/50"
                    >
                      <SelectValue placeholder="Todos os imóveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os imóveis do portfólio</SelectItem>
                      {imoveis.map((im) => (
                        <SelectItem key={im.id} value={im.id}>
                          {im.nome ||
                            (im.codigo ? `Cód. ${im.codigo} - ${im.endereco}` : im.endereco)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter (se aplicável ao tipo) */}
                {reportType === 'contratos' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">
                      Status do Contrato:
                    </Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger
                        aria-label="Todos os status"
                        className="h-9 text-xs bg-slate-50/50"
                      >
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="encerrado">Encerrado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {reportType === 'imoveis' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">
                      Status da Ocupação:
                    </Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger
                        aria-label="Todos os status"
                        className="h-9 text-xs bg-slate-50/50"
                      >
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="alugado">Alugado</SelectItem>
                        <SelectItem value="vago">Vago</SelectItem>
                        <SelectItem value="em_manutencao">Em manutenção</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: PRÉVIA E DOWNLOAD */}
        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white shadow-sm sticky top-6">
            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Download className="h-4 w-4 text-navy-800" />
                Resumo da Exportação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Módulo Selecionado:</span>
                  <strong className="text-slate-800 uppercase">
                    {reportType === 'financeiro' && 'Financeiro'}
                    {reportType === 'imoveis' && 'Imóveis & Ocupação'}
                    {reportType === 'contratos' && 'Contratos de Locação'}
                    {reportType === 'inadimplencia' && 'Inadimplência & Atrasos'}
                  </strong>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Formato de Saída:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs ${
                      reportFormat === 'pdf'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {reportFormat.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Período:</span>
                  <strong className="text-slate-800 text-right">{periodoLabel}</strong>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Filtro de Imóvel:</span>
                  <strong className="text-slate-800">
                    {selectedImovel === 'all' ? 'Todos' : '1 selecionado'}
                  </strong>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Origem dos dados:</span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Registros do sistema
                  </span>
                </div>
              </div>

              {/* Botão de Geração */}
              <div className="pt-2">
                <Button
                  onClick={handleGerarRelatorio}
                  disabled={generating || loading}
                  className="w-full h-11 bg-navy-800 hover:bg-navy-900 text-gold-400 font-bold border border-gold-500/30 shadow-md transition-transform active:scale-[0.99]"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando e Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2 text-gold-400" />
                      Gerar Relatório ({reportFormat.toUpperCase()})
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                <p>
                  Os relatórios são gerados dinamicamente no navegador a partir das consultas em
                  tempo real às coleções da Holding Aguiar.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
