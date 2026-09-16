import { useState, useEffect, useCallback, useMemo } from 'react'
import { Building2, Plus, Search, Eye, Pencil, Ban, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getImoveis, updateImovel } from '@/services/imoveis'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, TIPO_IMOVEL_LABELS, STATUS_IMOVEL_LABELS } from '@/lib/format'
import { ImovelFormDialog } from '@/components/imoveis/ImovelFormDialog'
import { ImovelDetailDialog } from '@/components/imoveis/ImovelDetailDialog'
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

export default function Imoveis() {
  const { canEditModule } = useAuth()
  const canEdit = canEditModule('imoveis')
  const [imoveis, setImoveis] = useState<any[]>([])
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
      const data = await getImoveis()
      setImoveis(data)
      setSelected((prev) => (prev ? (data.find((im) => im.id === prev.id) ?? null) : null))
    } catch {
      setError('Erro ao carregar imóveis. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('imoveis', () => {
    load()
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return imoveis.filter((im) => {
      const ms =
        !q || [im.codigo, im.nome, im.endereco].some((v) => (v || '').toLowerCase().includes(q))
      return (
        ms && (fTipo === 'all' || im.tipo === fTipo) && (fStatus === 'all' || im.status === fStatus)
      )
    })
  }, [imoveis, search, fTipo, fStatus])

  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const handleEdit = (im: any) => {
    setEditing(im)
    setDetailOpen(false)
    setFormOpen(true)
  }
  const handleView = (im: any) => {
    setSelected(im)
    setDetailOpen(true)
  }
  const handleInactivate = async (im: any) => {
    try {
      await updateImovel(im.id, { status: 'inativo' })
      toast.success('Imóvel inativado')
      load()
    } catch {
      toast.error('Erro ao inativar imóvel')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Imóveis</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Gestão de edifícios, casas e salas comerciais
            </p>
          </div>
        </div>
        {canEdit && (
          <Button
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-1" /> Novo Imóvel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por código, nome ou endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50/50 min-h-[44px]"
          />
        </div>
        <Select value={fTipo} onValueChange={setFTipo}>
          <SelectTrigger className="w-full bg-slate-50/50 min-h-[44px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(TIPO_IMOVEL_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="w-full bg-slate-50/50 min-h-[44px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_IMOVEL_LABELS).map(([v, l]) => (
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
            <Building2 className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Nenhum imóvel encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-500">{filtered.length} imóvel(is)</p>
          <div className="hidden md:block rounded-lg border border-slate-200 overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-[200px]">Identificação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[120px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((im) => (
                  <TableRow
                    key={im.id}
                    className="cursor-pointer hover:bg-slate-50/50"
                    onClick={() => handleView(im)}
                  >
                    <TableCell className="font-medium">
                      {im.nome || im.codigo || '—'}
                      {im.codigo && (
                        <span className="block text-xs text-slate-400">{im.codigo}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{TIPO_IMOVEL_LABELS[im.tipo] || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge type="imovel" status={im.status} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {im.endereco}
                      {im.numero ? `, ${im.numero}` : ''}
                      {im.bairro && (
                        <span className="block text-xs text-slate-400">{im.bairro}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(im.valor_estimado)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 min-h-[36px] min-w-[36px]"
                          onClick={() => handleView(im)}
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 min-h-[36px] min-w-[36px]"
                              onClick={() => handleEdit(im)}
                            >
                              <Pencil className="h-4 w-4 text-slate-500" />
                            </Button>
                            {im.status !== 'inativo' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 min-h-[36px] min-w-[36px]"
                                onClick={() => handleInactivate(im)}
                              >
                                <Ban className="h-4 w-4 text-red-500" />
                              </Button>
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
            {filtered.map((im) => (
              <Card
                key={im.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:bg-slate-50"
                onClick={() => handleView(im)}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {im.nome || im.codigo || '—'}
                      </p>
                      <p className="text-xs text-slate-400">{TIPO_IMOVEL_LABELS[im.tipo] || '—'}</p>
                    </div>
                    <StatusBadge type="imovel" status={im.status} />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    {im.endereco && (
                      <p className="text-slate-500 truncate">
                        {im.endereco}
                        {im.numero ? `, ${im.numero}` : ''}
                        {im.bairro ? ` - ${im.bairro}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(im.valor_estimado)}
                    </span>
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 min-h-[36px] text-xs"
                            onClick={() => handleEdit(im)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-slate-500" /> Editar
                          </Button>
                          {im.status !== 'inativo' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-2.5 min-h-[36px] text-red-600 hover:bg-red-50 border-red-200"
                              onClick={() => handleInactivate(im)}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 min-h-[36px] text-xs"
                          onClick={() => handleView(im)}
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

      <ImovelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={load}
      />
      <ImovelDetailDialog
        imovel={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => handleEdit(selected)}
        onRefresh={load}
        canEdit={canEdit}
      />
    </div>
  )
}
