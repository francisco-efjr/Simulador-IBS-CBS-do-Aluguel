import { useState, useEffect, useCallback, useMemo } from 'react'
import { Receipt, Plus, Search, Eye, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getIptuTaxas, deleteIptuTaxa } from '@/services/iptu-taxas'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, formatDate, TIPO_IPTU_LABELS, STATUS_IPTU_LABELS } from '@/lib/format'
import { IptuTaxaFormDialog } from '@/components/iptu-taxas/IptuTaxaFormDialog'
import { IptuTaxaDetailDialog } from '@/components/iptu-taxas/IptuTaxaDetailDialog'
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

export default function IptuTaxas() {
  const { canEditModule } = useAuth()
  const canEdit = canEditModule('iptu_taxas')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fTipo, setFTipo] = useState('all')
  const [fStatus, setFStatus] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [selected, setSelected] = useState<any | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await getIptuTaxas()
      setItems(data)
      setSelected((prev) => (prev ? (data.find((c) => c.id === prev.id) ?? null) : null))
    } catch {
      setError('Erro ao carregar obrigações. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('iptu_taxas', () => {
    load()
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter((c) => {
      const imovelNome = c.expand?.imovel?.nome || c.expand?.imovel?.endereco || ''
      const imovelCodigo = c.expand?.imovel?.codigo || ''
      const ms =
        !q ||
        [c.descricao, imovelNome, imovelCodigo, TIPO_IPTU_LABELS[c.tipo] || c.tipo].some((v) =>
          (v || '').toLowerCase().includes(q),
        )
      return (
        ms && (fTipo === 'all' || c.tipo === fTipo) && (fStatus === 'all' || c.status === fStatus)
      )
    })
  }, [items, search, fTipo, fStatus])

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
  const handleDelete = async (c: any) => {
    try {
      await deleteIptuTaxa(c.id)
      toast.success('Obrigação excluída')
      setDetailOpen(false)
      load()
    } catch {
      toast.error('Erro ao excluir obrigação')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              IPTU e Taxas
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              IPTU, condomínio, seguro e demais obrigações
            </p>
          </div>
        </div>
        {canEdit && (
          <Button
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-1" /> Nova Obrigação
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <Input
            aria-label="Buscar por imóvel, descrição ou tipo"
            placeholder="Buscar por imóvel, descrição ou tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50/50 min-h-[44px]"
          />
        </div>
        <Select value={fTipo} onValueChange={setFTipo}>
          <SelectTrigger aria-label="Tipo" className="w-full bg-slate-50/50 min-h-[44px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(TIPO_IPTU_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger aria-label="Status" className="w-full bg-slate-50/50 min-h-[44px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_IPTU_LABELS).map(([v, l]) => (
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
            <Receipt className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-600">Nenhuma obrigação encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-600">{filtered.length} obrigação(ões)</p>
          <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table className="min-w-[850px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[100px]">Ano</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Forma Pagto.</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-slate-50/50"
                    onClick={() => handleView(c)}
                  >
                    <TableCell className="text-sm text-slate-600">
                      {c.expand?.imovel?.nome || c.expand?.imovel?.endereco || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {TIPO_IPTU_LABELS[c.tipo] || c.tipo || '—'}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-700">
                      {c.descricao || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {c.ano_referencia || '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(c.valor)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(c.vencimento)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="iptu_taxas" status={c.status} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {c.forma_pagamento || '—'}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Ver detalhes"
                          title="Ver detalhes"
                          className="h-11 w-11 min-h-[44px] min-w-[44px]"
                          onClick={() => handleView(c)}
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Editar"
                            title="Editar"
                            className="h-11 w-11 min-h-[44px] min-w-[44px]"
                            onClick={() => handleEdit(c)}
                          >
                            <Pencil className="h-4 w-4 text-slate-600" />
                          </Button>
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
                        {c.expand?.imovel?.nome || c.expand?.imovel?.endereco || '—'}
                      </p>
                      <p className="text-xs text-slate-600">
                        {TIPO_IPTU_LABELS[c.tipo] || c.tipo} — {c.descricao || '—'}
                      </p>
                    </div>
                    <StatusBadge type="iptu_taxas" status={c.status} />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">
                        {formatCurrency(c.valor)}
                      </span>
                      <span className="text-xs text-slate-600">
                        Venc: {formatDate(c.vencimento)}
                      </span>
                    </div>
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 px-3 min-h-[44px] text-sm"
                            onClick={() => handleEdit(c)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-slate-600" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 px-3 min-h-[44px] text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => handleDelete(c)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 px-3 min-h-[44px] text-sm"
                          onClick={() => handleView(c)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-600" /> Detalhes
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

      <IptuTaxaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={load}
      />
      <IptuTaxaDetailDialog
        iptuTaxa={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => handleEdit(selected)}
        onDelete={() => handleDelete(selected)}
        canEdit={canEdit}
      />
    </div>
  )
}
