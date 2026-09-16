import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  ListChecks,
  Sparkles,
  Check,
  Pencil,
  Trash2,
  Building,
  UploadCloud,
  History,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getTransacoesImportadas,
  updateTransacaoImportada,
  getImportacoes,
  getImportacao,
  updateImportacao,
  type TransacaoImportada,
  type Importacao,
} from '@/services/importacoes'
import { getImoveis } from '@/services/imoveis'
import { getInquilinos } from '@/services/inquilinos'
import { getContratos } from '@/services/contratos'
import { getFornecedores } from '@/services/fornecedores'
import { getCategoriasFinanceiras } from '@/services/categorias-financeiras'
import { createReceita } from '@/services/receitas'
import { createDespesa } from '@/services/despesas'
import { formatCurrency, formatDate } from '@/lib/format'
import { ClassificarTransacaoDialog } from '@/components/extratos/ClassificarTransacaoDialog'
import { ClassificarLoteDialog } from '@/components/extratos/ClassificarLoteDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
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

export default function ClassificarTransacoes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const importacaoIdParam = searchParams.get('importacao') || 'all'

  // Reference data
  const [importacoes, setImportacoes] = useState<Importacao[]>([])
  const [imoveis, setImoveis] = useState<any[]>([])
  const [inquilinos, setInquilinos] = useState<any[]>([])
  const [contratos, setContratos] = useState<any[]>([])
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])

  // Queue data
  const [transacoes, setTransacoes] = useState<TransacaoImportada[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedImportacao, setSelectedImportacao] = useState<string>(importacaoIdParam)
  const [statusFilter, setStatusFilter] = useState<
    'pendentes' | 'classificadas' | 'ignoradas' | 'todas'
  >('pendentes')
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'credito' | 'debito'>('todos')
  const [search, setSearch] = useState('')

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Dialogs
  const [dialogItem, setDialogItem] = useState<TransacaoImportada | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loteDialogOpen, setLoteDialogOpen] = useState(false)

  // Load all reference catalogs and transactions
  const loadData = useCallback(async () => {
    try {
      setError(null)
      const [imps, ims, inqs, cts, fors, cats] = await Promise.all([
        getImportacoes(),
        getImoveis(),
        getInquilinos(),
        getContratos(),
        getFornecedores(),
        getCategoriasFinanceiras(),
      ])

      setImportacoes(imps)
      setImoveis(ims)
      setInquilinos(inqs)
      setContratos(cts)
      setFornecedores(fors)
      setCategorias(cats)

      // Fetch transactions
      const targetImpId = selectedImportacao !== 'all' ? selectedImportacao : undefined
      const txs = await getTransacoesImportadas(targetImpId, false)
      setTransacoes(txs)
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar fila de transações.')
    } finally {
      setLoading(false)
    }
  }, [selectedImportacao])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Sync state when URL param changes
  useEffect(() => {
    if (importacaoIdParam && importacaoIdParam !== selectedImportacao) {
      setSelectedImportacao(importacaoIdParam)
    }
  }, [importacaoIdParam])

  const handleImportacaoSelect = (id: string) => {
    setSelectedImportacao(id)
    if (id === 'all') {
      searchParams.delete('importacao')
      setSearchParams(searchParams)
    } else {
      setSearchParams({ importacao: id })
    }
  }

  // Filtered transactions
  const filteredTransacoes = useMemo(() => {
    const q = search.toLowerCase()
    return transacoes.filter((t) => {
      // Status filter
      if (statusFilter === 'pendentes' && (t.classificada || t.ignorada)) return false
      if (statusFilter === 'classificadas' && !t.classificada) return false
      if (statusFilter === 'ignoradas' && !t.ignorada) return false

      // Flow type filter
      if (tipoFilter !== 'todos' && t.tipo !== tipoFilter) return false

      // Text search
      if (q) {
        const descMatch = t.descricao.toLowerCase().includes(q)
        const catMatch = (t.sugestao_categoria || t.categoria_classificada || '')
          .toLowerCase()
          .includes(q)
        const imovMatch = (t.sugestao_imovel || t.imovel_classificado || '')
          .toLowerCase()
          .includes(q)
        if (!descMatch && !catMatch && !imovMatch) return false
      }

      return true
    })
  }, [transacoes, statusFilter, tipoFilter, search])

  // Statistics
  const totalGeral = transacoes.length
  const totalClassificadas = transacoes.filter((t) => t.classificada).length
  const totalIgnoradas = transacoes.filter((t) => t.ignorada).length
  const totalPendentes = transacoes.filter((t) => !t.classificada && !t.ignorada).length
  const progressoPercent =
    totalGeral > 0 ? Math.round(((totalClassificadas + totalIgnoradas) / totalGeral) * 100) : 100

  // Quick Action: Accept Suggestion directly
  const handleAcceptSuggestion = async (t: TransacaoImportada) => {
    // Determine category ID and Imóvel ID from suggestion or fallback
    let catId = t.sugestao_categoria_id
    if (!catId && t.sugestao_categoria) {
      const found = categorias.find(
        (c) => c.nome.toLowerCase() === t.sugestao_categoria?.toLowerCase(),
      )
      if (found) catId = found.id
    }

    let imovId = t.sugestao_imovel_id
    if (!imovId && t.sugestao_imovel) {
      const found = imoveis.find(
        (im) =>
          im.nome?.toLowerCase() === t.sugestao_imovel?.toLowerCase() ||
          im.endereco?.toLowerCase() === t.sugestao_imovel?.toLowerCase(),
      )
      if (found) imovId = found.id
    }

    // If suggestion lacks category or imovel, open modal to let user complete
    if (!catId || !imovId) {
      setDialogItem(t)
      setDialogOpen(true)
      return
    }

    try {
      const isReceita =
        (t.sugestao_tipo || (t.tipo === 'credito' ? 'receita' : 'despesa')) === 'receita'
      const dataStr = t.data.substring(0, 10)
      const comp = dataStr.substring(0, 7)

      let createdId = ''
      if (isReceita) {
        const rec = await createReceita({
          imovel: imovId,
          categoria: catId,
          descricao: t.descricao,
          data: dataStr,
          data_vencimento: dataStr,
          data_recebimento: dataStr,
          valor: t.valor,
          valor_previsto: t.valor,
          valor_recebido: t.valor,
          competencia: comp,
          status_financeiro: 'recebido',
          forma_recebimento: 'pix',
          status: 'ativo',
          transacao_importada_id: t.id,
          observacoes: `Lançado via importação de extrato. Ref: ${t.descricao}`,
        })
        createdId = rec.id
      } else {
        const desp = await createDespesa({
          imovel: imovId,
          categoria: catId,
          descricao: t.descricao,
          data: dataStr,
          data_vencimento: dataStr,
          data_pagamento: dataStr,
          valor: t.valor,
          valor_previsto: t.valor,
          valor_pago: t.valor,
          competencia: comp,
          status_financeiro: 'pago',
          forma_pagamento: 'pix',
          status: 'ativo',
          transacao_importada_id: t.id,
          observacoes: `Lançado via importação de extrato. Ref: ${t.descricao}`,
        })
        createdId = desp.id
      }

      // Mark transaction as classified
      const catObj = categorias.find((c) => c.id === catId)
      const imovObj = imoveis.find((im) => im.id === imovId)

      await updateTransacaoImportada(t.id, {
        classificada: true,
        ignorada: false,
        categoria_classificada: catObj?.nome || t.sugestao_categoria,
        imovel_classificado: imovObj?.nome || imovObj?.endereco || t.sugestao_imovel,
        receita_gerada: isReceita ? createdId : '',
        despesa_gerada: !isReceita ? createdId : '',
      })

      toast.success(
        `Transação lançada como ${isReceita ? 'Receita' : 'Despesa'} (${catObj?.nome || 'Geral'})!`,
      )
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao aceitar sugestão e gerar lançamento financeiro.')
    }
  }

  // Action: Ignore Transaction
  const handleIgnoreTransaction = async (t: TransacaoImportada) => {
    try {
      await updateTransacaoImportada(t.id, {
        ignorada: true,
        classificada: false,
      })
      toast.info('Transação ignorada e não será contabilizada.')
      loadData()
    } catch {
      toast.error('Erro ao ignorar transação.')
    }
  }

  // Action: Reopen / Restore Transaction
  const handleRestoreTransaction = async (t: TransacaoImportada) => {
    try {
      await updateTransacaoImportada(t.id, {
        ignorada: false,
        classificada: false,
      })
      toast.success('Transação reaberta para classificação.')
      loadData()
    } catch {
      toast.error('Erro ao reabrir transação.')
    }
  }

  // Confirm manual classification from Dialog
  const handleConfirmManualClassification = async (data: {
    tipo: 'receita' | 'despesa'
    imovel: string
    contrato?: string
    inquilino?: string
    fornecedor?: string
    categoria: string
    competencia: string
    valor: number
    data: string
    forma: string
    observacoes?: string
    descricao: string
  }) => {
    if (!dialogItem) return

    const t = dialogItem
    const isReceita = data.tipo === 'receita'

    let createdId = ''
    if (isReceita) {
      const rec = await createReceita({
        imovel: data.imovel,
        contrato: data.contrato || '',
        inquilino: data.inquilino || '',
        categoria: data.categoria,
        descricao: data.descricao || t.descricao,
        data: data.data,
        data_vencimento: data.data,
        data_recebimento: data.data,
        valor: data.valor,
        valor_previsto: data.valor,
        valor_recebido: data.valor,
        competencia: data.competencia,
        status_financeiro: 'recebido',
        forma_recebimento: data.forma,
        status: 'ativo',
        transacao_importada_id: t.id,
        observacoes: data.observacoes || '',
      })
      createdId = rec.id
    } else {
      const desp = await createDespesa({
        imovel: data.imovel,
        fornecedor: data.fornecedor || '',
        categoria: data.categoria,
        descricao: data.descricao || t.descricao,
        data: data.data,
        data_vencimento: data.data,
        data_pagamento: data.data,
        valor: data.valor,
        valor_previsto: data.valor,
        valor_pago: data.valor,
        competencia: data.competencia,
        status_financeiro: 'pago',
        forma_pagamento: data.forma,
        status: 'ativo',
        transacao_importada_id: t.id,
        observacoes: data.observacoes || '',
      })
      createdId = desp.id
    }

    const catObj = categorias.find((c) => c.id === data.categoria)
    const imovObj = imoveis.find((im) => im.id === data.imovel)

    await updateTransacaoImportada(t.id, {
      classificada: true,
      ignorada: false,
      categoria_classificada: catObj?.nome || '',
      imovel_classificado: imovObj?.nome || imovObj?.endereco || '',
      receita_gerada: isReceita ? createdId : '',
      despesa_gerada: !isReceita ? createdId : '',
    })

    toast.success(`Lançamento realizado com sucesso como ${isReceita ? 'Receita' : 'Despesa'}!`)
    loadData()
  }

  // Batch Classification Confirm
  const handleConfirmBatch = async (data: {
    tipo: 'receita' | 'despesa'
    imovel: string
    categoria: string
    fornecedor?: string
    forma: string
    competencia?: string
  }) => {
    const isReceita = data.tipo === 'receita'
    const catObj = categorias.find((c) => c.id === data.categoria)
    const imovObj = imoveis.find((im) => im.id === data.imovel)

    const selectedTransactions = transacoes.filter((t) => selectedIds.includes(t.id))

    let successCount = 0
    for (const t of selectedTransactions) {
      try {
        const dataStr = t.data.substring(0, 10)
        const comp = data.competencia || dataStr.substring(0, 7)

        let createdId = ''
        if (isReceita) {
          const rec = await createReceita({
            imovel: data.imovel,
            categoria: data.categoria,
            descricao: t.descricao,
            data: dataStr,
            data_vencimento: dataStr,
            data_recebimento: dataStr,
            valor: t.valor,
            valor_previsto: t.valor,
            valor_recebido: t.valor,
            competencia: comp,
            status_financeiro: 'recebido',
            forma_recebimento: data.forma,
            status: 'ativo',
            transacao_importada_id: t.id,
            observacoes: `Classificação em lote via extrato. Ref: ${t.descricao}`,
          })
          createdId = rec.id
        } else {
          const desp = await createDespesa({
            imovel: data.imovel,
            categoria: data.categoria,
            fornecedor: data.fornecedor || '',
            descricao: t.descricao,
            data: dataStr,
            data_vencimento: dataStr,
            data_pagamento: dataStr,
            valor: t.valor,
            valor_previsto: t.valor,
            valor_pago: t.valor,
            competencia: comp,
            status_financeiro: 'pago',
            forma_pagamento: data.forma,
            status: 'ativo',
            transacao_importada_id: t.id,
            observacoes: `Classificação em lote via extrato. Ref: ${t.descricao}`,
          })
          createdId = desp.id
        }

        await updateTransacaoImportada(t.id, {
          classificada: true,
          ignorada: false,
          categoria_classificada: catObj?.nome || '',
          imovel_classificado: imovObj?.nome || imovObj?.endereco || '',
          receita_gerada: isReceita ? createdId : '',
          despesa_gerada: !isReceita ? createdId : '',
        })

        successCount++
      } catch (err) {
        console.error(err)
      }
    }

    toast.success(`${successCount} transações classificadas com sucesso em lote!`)
    setSelectedIds([])
    loadData()
  }

  // Batch Toggle Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredTransacoes.map((t) => t.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
    }
  }

  // Batch Ignore
  const handleBatchIgnore = async () => {
    if (confirm(`Deseja ignorar as ${selectedIds.length} transações selecionadas?`)) {
      try {
        for (const id of selectedIds) {
          await updateTransacaoImportada(id, { ignorada: true, classificada: false })
        }
        toast.info(`${selectedIds.length} transações foram ignoradas.`)
        setSelectedIds([])
        loadData()
      } catch {
        toast.error('Erro ao ignorar transações em lote.')
      }
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400 shadow-sm border border-gold-500/20">
            <ListChecks className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Classificação de Transações
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Revise, aprove sugestões inteligentes com 1 clique ou classifique em lote no fluxo de
              receitas e despesas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/historico-importacoes')}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <History className="h-4 w-4 mr-1.5 text-navy-800" /> Histórico de Importações
          </Button>
          <Button
            onClick={() => navigate('/importar-extrato')}
            className="bg-navy-800 hover:bg-navy-900 text-white font-medium"
          >
            <UploadCloud className="h-4 w-4 mr-1.5 text-gold-400" /> Importar Novo Extrato
          </Button>
        </div>
      </div>

      {/* Progress & Summary Bar */}
      <Card className="border-slate-200 shadow-xs bg-gradient-to-r from-slate-50 to-white">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold">
                Progresso Geral da Fila
              </p>
              <h3 className="text-xl font-bold text-navy-950 mt-0.5">
                {totalClassificadas + totalIgnoradas} de {totalGeral} transações processadas (
                {progressoPercent}%)
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-200 text-xs px-2.5 py-1"
              >
                <Clock className="h-3.5 w-3.5 mr-1" /> {totalPendentes} Pendentes
              </Badge>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-2.5 py-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-700" /> {totalClassificadas}{' '}
                Classificadas
              </Badge>
              <Badge
                variant="outline"
                className="bg-slate-100 text-slate-600 border-slate-200 text-xs px-2.5 py-1"
              >
                <XCircle className="h-3.5 w-3.5 mr-1 text-slate-600" /> {totalIgnoradas} Ignoradas
              </Badge>
            </div>
          </div>

          <Progress value={progressoPercent} className="h-2.5 bg-slate-200" />
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <Input
            aria-label="Buscar por descrição, imóvel ou categoria sugerida"
            placeholder="Buscar por descrição, imóvel ou categoria sugerida..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50/70 border-slate-300 w-full"
          />
        </div>

        <div className="w-full">
          <Select value={selectedImportacao} onValueChange={handleImportacaoSelect}>
            <SelectTrigger
              aria-label="Filtrar por Importação..."
              className="bg-slate-50/70 border-slate-300 w-full"
            >
              <SelectValue placeholder="Filtrar por Importação..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Importações</SelectItem>
              {importacoes.map((imp) => (
                <SelectItem key={imp.id} value={imp.id}>
                  {imp.arquivo_nome} ({formatDate(imp.data_importacao || imp.created)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger
              aria-label="Status"
              className="bg-slate-50/70 border-slate-300 w-full sm:flex-1"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendentes">Pendentes de Classificação</SelectItem>
              <SelectItem value="classificadas">Já Classificadas</SelectItem>
              <SelectItem value="ignoradas">Ignoradas</SelectItem>
              <SelectItem value="todas">Todas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoFilter} onValueChange={(v: any) => setTipoFilter(v)}>
            <SelectTrigger
              aria-label="Tipo"
              className="bg-slate-50/70 border-slate-300 w-full sm:w-[110px]"
            >
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="credito">Créditos</SelectItem>
              <SelectItem value="debito">Débitos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Batch Actions Toolbar if any selected */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-navy-900 text-white shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-navy-950 text-xs font-bold">
              {selectedIds.length}
            </span>
            <span>transações selecionadas</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchIgnore}
              className="border-slate-600 text-slate-200 hover:bg-navy-800 hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1 text-slate-600" /> Ignorar Selecionadas
            </Button>
            <Button
              size="sm"
              onClick={() => setLoteDialogOpen(true)}
              className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold"
            >
              <Layers className="h-3.5 w-3.5 mr-1" /> Classificar em Lote ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      ) : filteredTransacoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <ListChecks className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">Nenhuma transação encontrada</h3>
            <p className="text-xs text-slate-600 max-w-sm mt-1">
              {statusFilter === 'pendentes'
                ? 'Todas as transações do filtro selecionado já foram classificadas ou ignoradas!'
                : 'Nenhum lançamento corresponde aos filtros atuais.'}
            </p>
            {statusFilter === 'pendentes' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter('todas')}
                className="mt-4"
              >
                Ver Todas as Transações
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="w-[44px] text-center">
                      <Checkbox
                        checked={
                          selectedIds.length === filteredTransacoes.length &&
                          filteredTransacoes.length > 0
                        }
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Selecionar todas"
                      />
                    </TableHead>
                    <TableHead className="w-[105px]">Data</TableHead>
                    <TableHead className="min-w-[220px]">Descrição no Extrato</TableHead>
                    <TableHead className="text-right w-[120px]">Valor (R$)</TableHead>
                    <TableHead className="min-w-[260px]">
                      Sugestão Automática / Classificação
                    </TableHead>
                    <TableHead className="w-[120px] text-center">Status</TableHead>
                    <TableHead className="w-[180px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransacoes.map((t) => {
                    const isSelected = selectedIds.includes(t.id)
                    const hasValidSuggestion = Boolean(t.sugestao_categoria || t.sugestao_imovel)

                    return (
                      <TableRow
                        key={t.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isSelected ? 'bg-gold-50/40' : ''
                        } ${t.classificada ? 'bg-emerald-50/15' : ''} ${
                          t.ignorada ? 'opacity-60 bg-slate-50/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOne(t.id, Boolean(checked))}
                            aria-label={`Selecionar ${t.descricao}`}
                          />
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                          {formatDate(t.data)}
                        </TableCell>

                        {/* Description */}
                        <TableCell>
                          <div className="font-semibold text-slate-900 text-sm">{t.descricao}</div>
                          {t.expand?.importacao && (
                            <div className="text-xs text-slate-600 truncate max-w-xs">
                              Arquivo: {t.expand.importacao.arquivo_nome}
                              {t.expand.importacao.expand?.conta_bancaria && (
                                <> • {t.expand.importacao.expand.conta_bancaria.nome}</>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Value */}
                        <TableCell className="text-right font-bold whitespace-nowrap">
                          <span
                            className={t.tipo === 'credito' ? 'text-emerald-700' : 'text-slate-900'}
                          >
                            {t.tipo === 'credito' ? '+' : '-'} {formatCurrency(t.valor)}
                          </span>
                        </TableCell>

                        {/* Suggestion / Classified Details */}
                        <TableCell>
                          {t.classificada ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-medium text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-700" />
                                {t.receita_gerada ? 'Receita' : 'Despesa'}:{' '}
                                {t.categoria_classificada || 'Geral'}
                              </Badge>
                              {t.imovel_classificado && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-slate-700 bg-white"
                                >
                                  <Building className="h-3 w-3 mr-1 text-slate-600" />
                                  {t.imovel_classificado}
                                </Badge>
                              )}
                              {t.receita_gerada && (
                                <Link
                                  to="/receitas"
                                  className="text-xs text-indigo-600 hover:underline inline-flex items-center"
                                >
                                  Ver em Receitas <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
                                </Link>
                              )}
                              {t.despesa_gerada && (
                                <Link
                                  to="/despesas"
                                  className="text-xs text-indigo-600 hover:underline inline-flex items-center"
                                >
                                  Ver em Despesas <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
                                </Link>
                              )}
                            </div>
                          ) : t.ignorada ? (
                            <span className="text-xs text-slate-600 italic">
                              Transação ignorada
                            </span>
                          ) : hasValidSuggestion ? (
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="bg-gold-50 text-navy-950 border-gold-300 font-semibold text-xs py-0.5"
                                >
                                  <Sparkles className="h-3 w-3 mr-1 text-gold-600" />
                                  Sugestão: {t.sugestao_tipo === 'receita'
                                    ? 'Receita'
                                    : 'Despesa'}{' '}
                                  — {t.sugestao_categoria || 'Geral'}
                                </Badge>
                                {t.sugestao_imovel && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-slate-700 bg-slate-50"
                                  >
                                    <Building className="h-3 w-3 mr-1 text-slate-600" />
                                    {t.sugestao_imovel}
                                  </Badge>
                                )}
                              </div>
                              {t.sugestao_origem && (
                                <p className="text-xs text-slate-600">
                                  Baseado em: {t.sugestao_origem}
                                  {t.sugestao_confianca && (
                                    <> • Confiança: {Math.round(t.sugestao_confianca * 100)}%</>
                                  )}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 italic">
                              Sem histórico prévio — ajuste manualmente
                            </span>
                          )}
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="text-center whitespace-nowrap">
                          {t.classificada ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              Lançada
                            </Badge>
                          ) : t.ignorada ? (
                            <Badge variant="secondary" className="text-slate-600">
                              Ignorada
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200"
                            >
                              Pendente
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right whitespace-nowrap">
                          {!t.classificada && !t.ignorada ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Accept button */}
                              <Button
                                size="sm"
                                onClick={() => handleAcceptSuggestion(t)}
                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-2.5 shadow-xs"
                                title="Aceitar sugestão e criar lançamento"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> Aceitar
                              </Button>

                              {/* Manual Adjust */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDialogItem(t)
                                  setDialogOpen(true)
                                }}
                                className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 px-2"
                                title="Ajustar classificação manualmente"
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1 text-slate-600" /> Ajustar
                              </Button>

                              {/* Ignore */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleIgnoreTransaction(t)}
                                className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                                title="Ignorar transação"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : t.ignorada ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreTransaction(t)}
                              className="h-7 text-xs text-slate-600"
                            >
                              Reabrir
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDialogItem(t)
                                setDialogOpen(true)
                              }}
                              className="h-7 text-xs text-slate-600"
                            >
                              <Pencil className="h-3 w-3 mr-1" /> Editar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Classification Dialog */}
      <ClassificarTransacaoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transacao={dialogItem}
        imoveis={imoveis}
        inquilinos={inquilinos}
        contratos={contratos}
        fornecedores={fornecedores}
        categorias={categorias}
        onConfirm={handleConfirmManualClassification}
      />

      {/* Batch Classification Dialog */}
      <ClassificarLoteDialog
        open={loteDialogOpen}
        onOpenChange={setLoteDialogOpen}
        selectedCount={selectedIds.length}
        imoveis={imoveis}
        categorias={categorias}
        fornecedores={fornecedores}
        onConfirm={handleConfirmBatch}
      />
    </div>
  )
}
