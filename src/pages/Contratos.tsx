import { useState, useEffect, useCallback, useMemo } from 'react'
import { FileText, Plus, Search, Eye, Pencil, Ban, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getContratos, updateContrato } from '@/services/contratos'
import { useRealtime } from '@/hooks/use-realtime'
import {
  formatCurrency,
  formatDate,
  STATUS_CONTRATO_LABELS,
  TIPO_GARANTIA_LABELS,
} from '@/lib/format'
import { ContratoFormDialog } from '@/components/contratos/ContratoFormDialog'
import { ContratoDetailDialog } from '@/components/contratos/ContratoDetailDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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

import { useAuth } from '@/hooks/use-auth'

export default function Contratos() {
  const { canEditModule } = useAuth()
  const canEdit = canEditModule('contratos')
  const [contratos, setContratos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('all')
  const [fGarantia, setFGarantia] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [selected, setSelected] = useState<any | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await getContratos()
      setContratos(data)
      setSelected((prev) => (prev ? (data.find((c) => c.id === prev.id) ?? null) : null))
    } catch {
      setError('Erro ao carregar contratos. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('contratos', () => {
    load()
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contratos.filter((c) => {
      const imovelNome = c.expand?.imovel?.nome || c.expand?.imovel?.endereco || ''
      const inquilinoNome = c.expand?.inquilino?.nome || ''
      const ms =
        !q || [c.numero, imovelNome, inquilinoNome].some((v) => (v || '').toLowerCase().includes(q))
      return (
        ms &&
        (fStatus === 'all' || c.status === fStatus) &&
        (fGarantia === 'all' || c.tipo_garantia === fGarantia)
      )
    })
  }, [contratos, search, fStatus, fGarantia])

  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const handleEdit = (c: any) => {
    setEditing(c)
    setDetailOpen(false)
    setFormOpen(true)
  }
  const handleView = (c: any) => {
    setSelected(c)
    setDetailOpen(true)
  }
  const handleEncerrar = async (c: any) => {
    try {
      await updateContrato(c.id, { status: 'encerrado' })
      toast.success('Contrato encerrado')
      load()
    } catch {
      toast.error('Erro ao encerrar contrato')
    }
  }
  const handleCancelar = async (c: any) => {
    try {
      await updateContrato(c.id, { status: 'cancelado' })
      toast.success('Contrato cancelado')
      load()
    } catch {
      toast.error('Erro ao cancelar contrato')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Contratos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Contratos de locação, reajustes e prazos
            </p>
          </div>
        </div>
        {canEdit && (
          <Button
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-1" /> Novo Contrato
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por número, imóvel ou inquilino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50/50 min-h-[44px]"
          />
        </div>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="w-full bg-slate-50/50 min-h-[44px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_CONTRATO_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fGarantia} onValueChange={setFGarantia}>
          <SelectTrigger className="w-full bg-slate-50/50 min-h-[44px]">
            <SelectValue placeholder="Garantia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as garantias</SelectItem>
            {Object.entries(TIPO_GARANTIA_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <FileText className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Nenhum contrato encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-500">{filtered.length} contrato(s)</p>
          <div className="hidden md:block rounded-lg border border-slate-200 overflow-x-auto">
            <Table className="min-w-[750px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-[160px]">Número</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[140px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-slate-50/50"
                    onClick={() => handleView(c)}
                  >
                    <TableCell className="font-medium">
                      {c.numero || '—'}
                      {c.dia_vencimento && (
                        <span className="block text-xs text-slate-400">
                          Venc. dia {c.dia_vencimento}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {c.expand?.imovel?.nome || c.expand?.imovel?.endereco || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {c.expand?.inquilino?.nome || '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="contrato" status={c.status} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(c.data_inicio)} → {formatDate(c.data_fim)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(c.valor_aluguel)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 min-h-[36px] min-w-[36px]"
                          onClick={() => handleView(c)}
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 min-h-[36px] min-w-[36px]"
                              onClick={() => handleEdit(c)}
                            >
                              <Pencil className="h-4 w-4 text-slate-500" />
                            </Button>
                            {c.status === 'ativo' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 min-h-[36px] min-w-[36px]"
                                  onClick={() => handleEncerrar(c)}
                                >
                                  <Check className="h-4 w-4 text-emerald-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 min-h-[36px] min-w-[36px]"
                                  onClick={() => handleCancelar(c)}
                                >
                                  <Ban className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">
            {filtered.map((c) => (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:bg-slate-50"
                onClick={() => handleView(c)}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {c.numero || 'Sem número'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {c.expand?.imovel?.nome || c.expand?.imovel?.endereco || '—'}
                      </p>
                    </div>
                    <StatusBadge type="contrato" status={c.status} />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inquilino:</span>
                      <span className="font-medium truncate max-w-[180px]">
                        {c.expand?.inquilino?.nome || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vigência:</span>
                      <span>
                        {formatDate(c.data_inicio)} → {formatDate(c.data_fim)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(c.valor_aluguel)}/mês
                    </span>
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 min-h-[36px] text-xs"
                            onClick={() => handleEdit(c)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-slate-500" /> Editar
                          </Button>
                          {c.status === 'ativo' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-2.5 min-h-[36px] text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                onClick={() => handleEncerrar(c)}
                                title="Encerrar contrato"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-2.5 min-h-[36px] text-red-600 hover:bg-red-50 border-red-200"
                                onClick={() => handleCancelar(c)}
                                title="Cancelar contrato"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 min-h-[36px] text-xs"
                          onClick={() => handleView(c)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> Detalhes
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <ContratoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={load}
      />
      <ContratoDetailDialog
        contrato={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => handleEdit(selected)}
        canEdit={canEdit}
      />
    </div>
  )
}
