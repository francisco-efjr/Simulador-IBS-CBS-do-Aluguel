import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  History,
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  ArrowRight,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Landmark,
  ListChecks,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getImportacoes,
  deleteImportacao,
  getTransacoesImportadas,
  type Importacao,
} from '@/services/importacoes'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

export default function HistoricoImportacoes() {
  const navigate = useNavigate()
  const [importacoes, setImportacoes] = useState<Importacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real statistics per import
  const [statsMap, setStatsMap] = useState<
    Record<string, { total: number; classificadas: number; ignoradas: number; pendentes: number }>
  >({})

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getImportacoes()
      setImportacoes(data)

      // Fetch accurate real-time transaction count for each import
      const stats: Record<
        string,
        { total: number; classificadas: number; ignoradas: number; pendentes: number }
      > = {}

      for (const imp of data) {
        try {
          const txs = await getTransacoesImportadas(imp.id, false)
          const total = txs.length
          const classificadas = txs.filter((t) => t.classificada).length
          const ignoradas = txs.filter((t) => t.ignorada).length
          const pendentes = txs.filter((t) => !t.classificada && !t.ignorada).length
          stats[imp.id] = { total, classificadas, ignoradas, pendentes }
        } catch {
          stats[imp.id] = {
            total: imp.total_transacoes || 0,
            classificadas: imp.transacoes_classificadas || 0,
            ignoradas: imp.transacoes_ignoradas || 0,
            pendentes: 0,
          }
        }
      }

      setStatsMap(stats)
    } catch {
      setError('Erro ao carregar histórico de importações.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (imp: Importacao) => {
    if (
      confirm(
        `Tem certeza que deseja remover o registro da importação "${imp.arquivo_nome}" e todas as suas transações não classificadas?`,
      )
    ) {
      try {
        await deleteImportacao(imp.id)
        toast.success('Importação excluída com sucesso.')
        load()
      } catch {
        toast.error('Não foi possível excluir a importação. Tente novamente.')
      }
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400 shadow-sm border border-gold-500/20">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Histórico de Importações
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Acompanhe todos os arquivos importados, taxas de classificação e continue pendências a
              qualquer momento
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/importar-extrato')}
            className="bg-navy-800 hover:bg-navy-900 text-white font-medium"
          >
            <UploadCloud className="h-4 w-4 mr-1.5 text-gold-400" /> Nova Importação
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      ) : importacoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <History className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">
              Nenhuma importação realizada ainda
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mt-1 mb-4">
              Envie seu primeiro arquivo de extrato bancário (OFX ou CSV) para começar o controle
              automatizado.
            </p>
            <Button
              onClick={() => navigate('/importar-extrato')}
              className="bg-navy-800 hover:bg-navy-900 text-white"
            >
              <UploadCloud className="h-4 w-4 mr-1.5 text-gold-400" /> Fazer Primeira Importação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900">
              Arquivos de Extrato Processados ({importacoes.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Clique em &quot;Classificar&quot; em qualquer lote para continuar a conciliação das
              transações pendentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100">
              {importacoes.map((imp) => {
                const stat = statsMap[imp.id] || {
                  total: imp.total_transacoes || 0,
                  classificadas: imp.transacoes_classificadas || 0,
                  ignoradas: imp.transacoes_ignoradas || 0,
                  pendentes: 0,
                }
                const processedCount = stat.classificadas + stat.ignoradas
                const total = stat.total || 1
                const percent = Math.min(100, Math.round((processedCount / total) * 100))
                const isDone = stat.pendentes === 0 && total > 0

                return (
                  <div key={imp.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-100 text-navy-800 shrink-0">
                          {imp.formato === 'ofx' ? (
                            <FileCode className="h-4 w-4" />
                          ) : (
                            <FileSpreadsheet className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {imp.arquivo_nome}
                          </p>
                          <p className="text-xs text-slate-600">
                            {imp.expand?.conta_bancaria?.nome || 'Conta Bancária'} •{' '}
                            {formatDate(imp.data_importacao || imp.created)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="uppercase font-mono text-xs shrink-0">
                        {imp.formato}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>
                          {stat.classificadas} lançadas / {total} tot.
                        </span>
                        <span className="font-semibold text-slate-800">{percent}%</span>
                      </div>
                      <Progress
                        value={percent}
                        className={`h-2 ${isDone ? '[&>div]:bg-emerald-600' : ''}`}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {isDone ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-700" /> Concluída
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" /> {stat.pendentes} pendente(s)
                        </Badge>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/classificar-transacoes?importacao=${imp.id}`)}
                          className="min-h-[40px] text-xs bg-navy-800 hover:bg-navy-900 text-white font-medium"
                        >
                          <ListChecks className="h-3.5 w-3.5 mr-1 text-gold-400" />
                          {stat.pendentes > 0 ? 'Classificar' : 'Ver Fila'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(imp)}
                          className="h-10 w-10 text-slate-600 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="min-w-[750px]">
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="w-[120px]">Data Envio</TableHead>
                    <TableHead>Arquivo & Conta Bancária</TableHead>
                    <TableHead className="w-[100px] text-center">Formato</TableHead>
                    <TableHead className="w-[220px]">Progresso de Classificação</TableHead>
                    <TableHead className="w-[130px] text-center">Status</TableHead>
                    <TableHead className="w-[160px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importacoes.map((imp) => {
                    const stat = statsMap[imp.id] || {
                      total: imp.total_transacoes || 0,
                      classificadas: imp.transacoes_classificadas || 0,
                      ignoradas: imp.transacoes_ignoradas || 0,
                      pendentes: 0,
                    }

                    const processedCount = stat.classificadas + stat.ignoradas
                    const total = stat.total || 1
                    const percent = Math.min(100, Math.round((processedCount / total) * 100))
                    const isDone = stat.pendentes === 0 && total > 0

                    return (
                      <TableRow key={imp.id} className="hover:bg-slate-50/60">
                        <TableCell className="text-xs font-medium text-slate-700 whitespace-nowrap">
                          {formatDate(imp.data_importacao || imp.created)}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-100 text-navy-800 shrink-0">
                              {imp.formato === 'ofx' ? (
                                <FileCode className="h-5 w-5" />
                              ) : (
                                <FileSpreadsheet className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">
                                {imp.arquivo_nome}
                              </div>
                              <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                                <Landmark className="h-3.5 w-3.5 text-slate-600" />
                                <span>{imp.expand?.conta_bancaria?.nome || 'Conta Bancária'}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className="uppercase font-mono text-xs font-bold"
                          >
                            {imp.formato}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-slate-600">
                              <span>
                                <strong>{stat.classificadas}</strong> lançadas
                                {stat.ignoradas > 0 && ` • ${stat.ignoradas} ignoradas`}
                              </span>
                              <span className="font-semibold text-slate-800">
                                {processedCount}/{total} ({percent}%)
                              </span>
                            </div>
                            <Progress
                              value={percent}
                              className={`h-2 ${isDone ? '[&>div]:bg-emerald-600' : ''}`}
                            />
                          </div>
                        </TableCell>

                        <TableCell className="text-center whitespace-nowrap">
                          {isDone ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-700" /> Concluída
                            </Badge>
                          ) : stat.classificadas > 0 ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Parcial ({stat.pendentes} pend.)
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200"
                            >
                              <Clock className="h-3 w-3 mr-1" /> Pendente
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() =>
                                navigate(`/classificar-transacoes?importacao=${imp.id}`)
                              }
                              className="h-8 text-xs bg-navy-800 hover:bg-navy-900 text-white font-medium"
                            >
                              <ListChecks className="h-3.5 w-3.5 mr-1 text-gold-400" />
                              {stat.pendentes > 0 ? 'Classificar' : 'Ver Fila'}
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(imp)}
                              className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                              title="Excluir histórico de importação"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
    </div>
  )
}
