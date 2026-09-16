import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Landmark,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Check,
  Building,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import { getContasBancarias, type ContaBancaria } from '@/services/contas-bancarias'
import {
  createImportacao,
  createTransacaoImportada,
  getAllTransacoesImportadas,
} from '@/services/importacoes'
import { getImoveis } from '@/services/imoveis'
import { getCategoriasFinanceiras } from '@/services/categorias-financeiras'
import {
  parseCSV,
  parseOFX,
  checkDuplicates,
  generateSuggestion,
  type ParsedTransaction,
} from '@/lib/extratos-engine'
import { ContasBancariasManagerDialog } from '@/components/extratos/ContasBancariasManagerDialog'
import { ContaBancariaFormDialog } from '@/components/extratos/ContaBancariaFormDialog'
import { formatCurrency, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

export default function ImportarExtrato() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Data states
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [selectedContaId, setSelectedContaId] = useState<string>('')
  const [loadingContas, setLoadingContas] = useState(true)

  // Catalog data for duplicate check and suggestions
  const [existingTxs, setExistingTxs] = useState<any[]>([])
  const [imoveis, setImoveis] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])

  // Upload & File state
  const [file, setFile] = useState<File | null>(null)
  const [fileFormat, setFileFormat] = useState<'csv' | 'ofx'>('csv')
  const [isDragging, setIsDragging] = useState(false)
  const [parsing, setParsing] = useState(false)

  // Extracted transactions preview
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)

  // Modals for Bank Accounts
  const [managerOpen, setManagerOpen] = useState(false)
  const [newContaOpen, setNewContaOpen] = useState(false)

  // Importing progress state
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  // Load initial reference data
  const loadInitialData = async () => {
    try {
      setLoadingContas(true)
      const [contasList, txList, imovList, catList] = await Promise.all([
        getContasBancarias(false),
        getAllTransacoesImportadas(),
        getImoveis(),
        getCategoriasFinanceiras(),
      ])

      setContas(contasList)
      if (contasList.length > 0 && !selectedContaId) {
        // Auto select first active or first
        const active = contasList.find((c) => c.ativo) || contasList[0]
        setSelectedContaId(active.id)
      }

      setExistingTxs(txList)
      setImoveis(imovList)
      setCategorias(catList)
    } catch {
      toast.error('Erro ao carregar dados iniciais')
    } finally {
      setLoadingContas(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Process raw text content into structured transactions with duplicate detection & suggestions
  const processFileContent = (content: string, fileName: string, format: 'csv' | 'ofx') => {
    setParsing(true)
    try {
      let rawTxs: ParsedTransaction[] = []
      if (format === 'ofx') {
        rawTxs = parseOFX(content)
      } else {
        rawTxs = parseCSV(content)
      }

      if (rawTxs.length === 0) {
        toast.error(
          `Não foi possível extrair transações do arquivo ${fileName}. Verifique o formato.`,
        )
        setTransactions([])
        setParsing(false)
        return
      }

      // Run duplicate detection and suggestion generation for each transaction
      let dupCount = 0
      const processed: ParsedTransaction[] = rawTxs.map((tx) => {
        // Check duplicate
        const dupCheck = checkDuplicates(tx, existingTxs)
        if (dupCheck.isDuplicate) {
          dupCount++
        }

        // Generate suggestion
        const suggestion = generateSuggestion(tx, existingTxs, imoveis, categorias)

        return {
          ...tx,
          duplicata_detectada: dupCheck.isDuplicate,
          duplicata_motivo: dupCheck.reason,
          duplicata_ids: dupCheck.matchedIds,
          sugestao_tipo: suggestion.sugestao_tipo,
          sugestao_categoria: suggestion.sugestao_categoria,
          sugestao_categoria_id: suggestion.sugestao_categoria_id,
          sugestao_imovel: suggestion.sugestao_imovel,
          sugestao_imovel_id: suggestion.sugestao_imovel_id,
          sugestao_confianca: suggestion.sugestao_confianca,
          sugestao_origem: suggestion.sugestao_origem,
          // If it's a duplicate, default to keeping it unselected or alert user
          incluir: !dupCheck.isDuplicate,
        }
      })

      setTransactions(processed)
      setDuplicateCount(dupCount)

      if (dupCount > 0) {
        setDuplicateModalOpen(true)
      } else {
        toast.success(`${processed.length} transações extraídas com sucesso!`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao processar o conteúdo do arquivo.')
    } finally {
      setParsing(false)
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const ext = selectedFile.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv' && ext !== 'ofx') {
      toast.error('Formato não suportado. Por favor, envie um arquivo .CSV ou .OFX.')
      return
    }

    const fmt = ext === 'ofx' ? 'ofx' : 'csv'
    setFile(selectedFile)
    setFileFormat(fmt)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      processFileContent(content, selectedFile.name, fmt)
    }
    reader.readAsText(selectedFile, 'ISO-8859-1') // Handles Brazilian bank encodings (Latin1 / UTF-8)
  }

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (!droppedFile) return

    const ext = droppedFile.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv' && ext !== 'ofx') {
      toast.error('Apenas arquivos .CSV e .OFX são aceitos.')
      return
    }

    const fmt = ext === 'ofx' ? 'ofx' : 'csv'
    setFile(droppedFile)
    setFileFormat(fmt)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      processFileContent(content, droppedFile.name, fmt)
    }
    reader.readAsText(droppedFile, 'ISO-8859-1')
  }

  // Toggle selection of all transactions
  const handleToggleAll = (checked: boolean) => {
    setTransactions((prev) => prev.map((t) => ({ ...t, incluir: checked })))
  }

  // Toggle selection of a single transaction
  const handleToggleOne = (index: number, checked: boolean) => {
    setTransactions((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, incluir: checked } : t)),
    )
  }

  // Duplicate resolution actions
  const handleIgnoreAllDuplicates = () => {
    setTransactions((prev) =>
      prev.map((t) => (t.duplicata_detectada ? { ...t, incluir: false } : t)),
    )
    setDuplicateModalOpen(false)
    toast.info(`${duplicateCount} transação(ões) duplicada(s) foram desmarcadas.`)
  }

  const handleIncludeAllDuplicates = () => {
    setTransactions((prev) =>
      prev.map((t) => (t.duplicata_detectada ? { ...t, incluir: true } : t)),
    )
    setDuplicateModalOpen(false)
    toast.warning(`${duplicateCount} transação(ões) duplicada(s) serão importadas mesmo assim.`)
  }

  // Confirm import and save into PocketBase
  const handleConfirmImport = async () => {
    if (!selectedContaId) {
      toast.error('Selecione uma conta bancária de origem.')
      return
    }

    const selectedTxs = transactions.filter((t) => t.incluir)
    if (selectedTxs.length === 0) {
      toast.error('Nenhuma transação selecionada para importação.')
      return
    }

    setImporting(true)
    setImportProgress(10)

    try {
      // 1. Create import batch record
      const importacao = await createImportacao({
        conta_bancaria: selectedContaId,
        arquivo_nome: file ? file.name : `Extrato_${new Date().toISOString().substring(0, 10)}`,
        formato: fileFormat,
        data_importacao: new Date().toISOString(),
        total_transacoes: selectedTxs.length,
        transacoes_classificadas: 0,
        transacoes_ignoradas: 0,
        status: 'pendente',
      })

      setImportProgress(30)

      // 2. Batch insert imported transactions
      const totalToInsert = selectedTxs.length
      let insertedCount = 0

      for (const tx of selectedTxs) {
        await createTransacaoImportada({
          importacao: importacao.id,
          data: tx.data,
          descricao: tx.descricao,
          valor: tx.valor,
          tipo: tx.tipo,
          saldo: tx.saldo,
          classificada: false,
          ignorada: false,
          duplicata_detectada: tx.duplicata_detectada || false,
          duplicata_ids: tx.duplicata_ids || [],
          sugestao_categoria: tx.sugestao_categoria,
          sugestao_categoria_id: tx.sugestao_categoria_id,
          sugestao_imovel: tx.sugestao_imovel,
          sugestao_imovel_id: tx.sugestao_imovel_id,
          sugestao_tipo: tx.sugestao_tipo,
          sugestao_confianca: tx.sugestao_confianca,
        })
        insertedCount++
        setImportProgress(30 + Math.floor((insertedCount / totalToInsert) * 65))
      }

      setImportProgress(100)
      toast.success(
        `Importação de ${selectedTxs.length} transações concluída! Redirecionando para classificação...`,
      )

      setTimeout(() => {
        navigate(`/classificar-transacoes?importacao=${importacao.id}`)
      }, 700)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar as transações no banco de dados.')
      setImporting(false)
    }
  }

  // Total summary of preview
  const totalCreditos = transactions
    .filter((t) => t.incluir && t.tipo === 'credito')
    .reduce((acc, t) => acc + t.valor, 0)
  const totalDebitos = transactions
    .filter((t) => t.incluir && t.tipo === 'debito')
    .reduce((acc, t) => acc + t.valor, 0)
  const selectedCount = transactions.filter((t) => t.incluir).length

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400 shadow-sm border border-gold-500/20">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Importação de Extratos Bancários
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Envie extratos em CSV ou OFX, confira o preview com detecção de duplicatas e envie
              para classificação inteligente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setManagerOpen(true)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Landmark className="h-4 w-4 mr-1.5 text-navy-800" /> Gerenciar Contas Bancárias
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/classificar-transacoes')}
            className="bg-gold-500/10 text-navy-900 hover:bg-gold-500/20 border border-gold-500/30"
          >
            Fila de Classificação <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* Account Selector & Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Account & Instructions */}
        <Card className="border-slate-200/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-gold-600" />
              1. Selecionar Conta Bancária
            </CardTitle>
            <CardDescription className="text-xs">
              Vincule as transações extraídas a uma conta financeira da Holding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Conta de Origem</label>
              <div className="flex gap-2">
                <Select
                  value={selectedContaId}
                  onValueChange={setSelectedContaId}
                  disabled={loadingContas}
                >
                  <SelectTrigger className="bg-slate-50/70 border-slate-300">
                    <SelectValue placeholder="Selecione uma conta bancária..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} {c.banco ? `(${c.banco})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNewContaOpen(true)}
                  title="Cadastrar Nova Conta"
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 text-navy-800" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-navy-900/5 p-3.5 border border-navy-900/10 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-navy-950 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-navy-800" /> Formatos Suportados:
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-600">
                <li>
                  <strong className="text-slate-800">OFX (Open Financial Exchange):</strong> Padrão
                  bancário universal gerado por Itaú, Bradesco, Santander, Banco do Brasil, BTG,
                  etc.
                </li>
                <li>
                  <strong className="text-slate-800">CSV (Planilhas):</strong> Arquivos separados
                  por vírgula, ponto-e-vírgula ou tabulação com colunas de data, descrição e valor.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Right: Drag & Drop Upload Zone */}
        <Card className="lg:col-span-2 border-slate-200/90 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-gold-600" />
              2. Upload do Arquivo de Extrato
            </CardTitle>
            <CardDescription className="text-xs">
              Arraste seu arquivo .OFX ou .CSV ou clique no botão para selecionar do seu computador.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.ofx"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-gold-500 bg-gold-50/60 scale-[0.99]'
                  : file
                    ? 'border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/50'
                    : 'border-slate-300 hover:border-gold-500/80 hover:bg-slate-50/80'
              }`}
            >
              {parsing ? (
                <div className="flex flex-col items-center py-4 gap-2">
                  <RefreshCw className="h-8 w-8 text-navy-800 animate-spin" />
                  <p className="text-sm font-medium text-slate-700">
                    Processando e analisando transações...
                  </p>
                </div>
              ) : file ? (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs">
                    {fileFormat === 'ofx' ? (
                      <FileCode className="h-7 w-7" />
                    ) : (
                      <FileSpreadsheet className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-base">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • Formato{' '}
                      <span className="uppercase font-bold text-navy-900">{fileFormat}</span> •
                      Clique para trocar de arquivo
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {transactions.length}{' '}
                    transação(ões) lidas
                  </Badge>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-800">
                    <UploadCloud className="h-7 w-7 text-navy-800" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800 text-sm">
                      Clique para escolher ou arraste o arquivo até aqui
                    </p>
                    <p className="text-xs text-slate-400">Suporta arquivos .OFX e .CSV</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="secondary" className="text-[11px] bg-slate-100 font-medium">
                      OFX
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] bg-slate-100 font-medium">
                      CSV
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Alert if detected */}
      {transactions.length > 0 && duplicateCount > 0 && (
        <Alert className="border-amber-300 bg-amber-50/90 text-amber-900 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div className="ml-2 flex-1">
            <AlertTitle className="font-bold text-amber-950 flex items-center justify-between">
              <span>
                Atenção: {duplicateCount} transação(ões) com suspeita de duplicidade detectadas
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDuplicateModalOpen(true)}
                className="h-7 text-xs border-amber-400 text-amber-900 bg-amber-100 hover:bg-amber-200"
              >
                Gerenciar Duplicatas
              </Button>
            </AlertTitle>
            <AlertDescription className="text-xs text-amber-800 mt-1">
              Foram identificadas transações no arquivo com a mesma data, valor idêntico e descrição
              similar a lançamentos que já constam no histórico. Por padrão, elas foram desmarcadas
              para evitar duplicidade no caixa.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Preview Table & Confirmation */}
      {transactions.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Preview das Transações Extraídas</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {selectedCount} de {transactions.length} selecionadas
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Revise os lançamentos encontrados no extrato antes de gravar no sistema.
              </CardDescription>
            </div>

            {/* Metrics summary */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="px-3 py-2 sm:py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-xs flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-slate-500">
                    Créditos ({transactions.filter((t) => t.incluir && t.tipo === 'credito').length}
                    ):
                  </span>{' '}
                  <strong className="text-emerald-700 font-bold">
                    {formatCurrency(totalCreditos)}
                  </strong>
                </div>
                <div className="px-3 py-2 sm:py-1.5 rounded-lg bg-red-50 border border-red-200/80 text-xs flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-slate-500">
                    Débitos ({transactions.filter((t) => t.incluir && t.tipo === 'debito').length}):
                  </span>{' '}
                  <strong className="text-red-700 font-bold">{formatCurrency(totalDebitos)}</strong>
                </div>
              </div>
              <Button
                onClick={handleConfirmImport}
                disabled={importing || selectedCount === 0}
                className="bg-navy-800 hover:bg-navy-900 text-white shadow-sm font-semibold w-full sm:w-auto min-h-[44px]"
              >
                {importing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Importando ({importProgress}
                    %)...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5 text-gold-400" /> Confirmar e Classificar (
                    {selectedCount})
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          {importing && (
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Gravando transações no banco de dados...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2 bg-slate-200" />
            </div>
          )}

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="w-[48px] text-center">
                      <Checkbox
                        checked={selectedCount === transactions.length && transactions.length > 0}
                        onCheckedChange={(checked) => handleToggleAll(Boolean(checked))}
                        aria-label="Selecionar todas"
                      />
                    </TableHead>
                    <TableHead className="w-[110px]">Data</TableHead>
                    <TableHead>Descrição do Extrato</TableHead>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead className="text-right w-[130px]">Valor (R$)</TableHead>
                    <TableHead>Sugestão Automática</TableHead>
                    <TableHead className="w-[120px] text-center">Status / Alerta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, idx) => (
                    <TableRow
                      key={idx}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        tx.duplicata_detectada ? 'bg-amber-50/30' : ''
                      } ${!tx.incluir ? 'opacity-60 bg-slate-50/30' : ''}`}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={tx.incluir}
                          onCheckedChange={(checked) => handleToggleOne(idx, Boolean(checked))}
                          aria-label={`Selecionar transação ${idx + 1}`}
                        />
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(tx.data)}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 max-w-md">
                        <div className="truncate" title={tx.descricao}>
                          {tx.descricao}
                        </div>
                        {tx.saldo !== undefined && (
                          <span className="text-[11px] text-slate-400">
                            Saldo: {formatCurrency(tx.saldo)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.tipo === 'credito' ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-normal">
                            Crédito
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 font-normal">
                            Débito
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap">
                        <span
                          className={tx.tipo === 'credito' ? 'text-emerald-700' : 'text-slate-900'}
                        >
                          {tx.tipo === 'credito' ? '+' : '-'} {formatCurrency(tx.valor)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {tx.sugestao_categoria || tx.sugestao_imovel ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="bg-navy-900/5 text-navy-950 border-navy-900/20 text-xs font-medium flex items-center gap-1"
                            >
                              <Sparkles className="h-3 w-3 text-gold-600" />
                              {tx.sugestao_tipo === 'receita' ? 'Receita' : 'Despesa'}
                              {tx.sugestao_categoria ? `: ${tx.sugestao_categoria}` : ''}
                            </Badge>
                            {tx.sugestao_imovel && (
                              <Badge
                                variant="outline"
                                className="bg-slate-100 text-slate-700 text-xs border-slate-300 flex items-center gap-1"
                              >
                                <Building className="h-3 w-3 text-slate-500" />
                                {tx.sugestao_imovel}
                              </Badge>
                            )}
                            {tx.sugestao_confianca && tx.sugestao_confianca >= 0.7 && (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                {Math.round(tx.sugestao_confianca * 100)}% conf.
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Classificação manual pendente
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        {tx.duplicata_detectada ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-semibold gap-1"
                            title={tx.duplicata_motivo}
                          >
                            <AlertTriangle className="h-3 w-3 text-amber-600" /> Suspeita Duplicata
                          </Badge>
                        ) : tx.incluir ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-normal"
                          >
                            Pronta
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-slate-400 text-xs">
                            Ignorada
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Resolution Dialog */}
      <Dialog open={duplicateModalOpen} onOpenChange={setDuplicateModalOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Suspeita de Transações Duplicadas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-slate-600">
            <p>
              O sistema detectou <strong>{duplicateCount} transação(ões)</strong> com a mesma data,
              valor idêntico e descrição muito similar a lançamentos que já foram importados
              anteriormente.
            </p>
            <p className="text-xs bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900">
              <strong>Como você deseja proceder?</strong>
              <br />• <strong>Ignorar duplicatas (Recomendado):</strong> desmarca as transações
              suspeitas para que não sejam importadas duas vezes.
              <br />• <strong>Importar todas mesmo assim:</strong> mantém todas marcadas caso você
              saiba que são lançamentos legítimos repetidos no mesmo dia.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleIncludeAllDuplicates}
              className="text-slate-700"
            >
              Importar Mesmo Assim
            </Button>
            <Button
              type="button"
              onClick={handleIgnoreAllDuplicates}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              Ignorar Duplicatas (Recomendado)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Accounts Manager Dialog */}
      <ContasBancariasManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        onContaCreated={(c) => {
          setContas((prev) => [c, ...prev])
          setSelectedContaId(c.id)
        }}
      />

      {/* New Bank Account Dialog */}
      <ContaBancariaFormDialog
        open={newContaOpen}
        onOpenChange={setNewContaOpen}
        editing={null}
        onSaved={(c) => {
          if (c) {
            setContas((prev) => [c, ...prev])
            setSelectedContaId(c.id)
          }
          loadInitialData()
        }}
      />
    </div>
  )
}
