import { useState, useEffect, useCallback, useMemo } from 'react'
import { TrendingUp, Plus, Search, Eye, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getReceitas, deleteReceita } from '@/services/receitas'
import { getCategoriasReceita } from '@/services/categorias-financeiras'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, formatDate, STATUS_RECEITA_LABELS } from '@/lib/format'
import { ReceitaFormDialog } from '@/components/receitas/ReceitaFormDialog'
import { ReceitaDetailDialog } from '@/components/receitas/ReceitaDetailDialog'
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

export default function Receitas() {
  const { canEditModule } = useAuth()
  const canEdit = canEditModule('receitas')
  const [items, setItems] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('all')
  const [fCategoria, setFCategoria] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [selected, setSelected] = useState<any | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const [data, cats] = await Promise.all([getReceitas(), getCategoriasReceita()])
      setItems(data)
      setCategorias(cats)
      setSelected((prev) => (prev ? (data.find((r) => r.id === prev.id) ?? null) : null))
    } catch {
      setError('Erro ao carregar receitas. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('receitas', () => {
    load()
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter((r) => {
      const imovelNome = r.expand?.imovel?.nome || r.expand?.imovel?.endereco || ''
      const contratoNum = r.expand?.contrato?.numero || ''
      const inquilinoNome = r.expand?.inquilino?.nome || ''
      const categoriaNome = r.expand?.categoria?.nome || ''
      const ms =
        !q ||
        [r.descricao, r.observacoes, imovelNome, contratoNum, inquilinoNome, categoriaNome].some(
          (v) => (v || '').toLowerCase().includes(q),
        )
      return (
        ms &&
        (fStatus === 'all' || r.status_financeiro === fStatus) &&
        (fCategoria === 'all' || r.categoria === fCategoria)
      )
    })
  }, [items, search, fStatus, fCategoria])

  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const handleEdit = (r: any) => {
    setEditing(r)
    setDetailOpen(false)
    setFormOpen(true)
  }
  const handleView = (r: any) => {
    setSelected(r)
    setDetailOpen(true)
  }
  const handleDelete = async (r: any) => {
    try {
      await deleteReceita(r.id)
      toast.success('Receita excluída')
      setDetailOpen(false)
      load()
    } catch {
      toast.error('Erro ao excluir receita')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Receitas
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Lançamento e baixa de aluguéis, taxas e recebíveis
            </p>
          </div>
        </div>
        {canEdit && (
          <Button
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-1" /> Nova Receita
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <Input
            aria-label="Buscar por imóvel, contrato, inquilino, categoria"
            placeholder="Buscar por imóvel, contrato, inquilino, categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50/50 min-h-[44px]"
          />
        </div>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger aria-label="Status" className="w-full bg-slate-50/50 min-h-[44px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_RECEITA_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fCategoria} onValueChange={setFCategoria}>
          <SelectTrigger aria-label="Categoria" className="w-full bg-slate-50/50 min-h-[44px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nome}
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
            <TrendingUp className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-600">Nenhuma receita encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-600">{filtered.length} receita(s)</p>
          <div className="hidden md:block rounded-lg border border-slate-200 overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-right">Previsto</TableHead>
                  <TableHead className="text-right">Recebido</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-slate-50/50"
                    onClick={() => handleView(r)}
                  >
                    <TableCell className="text-sm text-slate-600">
                      {r.expand?.imovel?.nome || r.expand?.imovel?.endereco || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {r.expand?.inquilino?.nome || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {r.expand?.categoria?.nome || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{r.competencia || '—'}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(r.valor_previsto)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(r.valor_recebido)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(r.data_vencimento)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="receita" status={r.status_financeiro} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Ver detalhes"
                          title="Ver detalhes"
                          className="h-11 w-11 min-h-[44px] min-w-[44px]"
                          onClick={() => handleView(r)}
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
                            onClick={() => handleEdit(r)}
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
            {filtered.map((r) => (
              <Card
                key={r.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:bg-slate-50"
                onClick={() => handleView(r)}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {r.expand?.imovel?.nome || r.expand?.imovel?.endereco || '—'}
                      </p>
                      <p className="text-xs text-slate-600">
                        {r.expand?.categoria?.nome || '—'} • Comp: {r.competencia || '—'}
                      </p>
                    </div>
                    <StatusBadge type="receita" status={r.status_financeiro} />
                  </div>
                  {r.expand?.inquilino?.nome && (
                    <p className="text-xs text-slate-600 truncate">
                      Inquilino: {r.expand.inquilino.nome}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold text-slate-900 block">
                        {formatCurrency(r.valor_previsto)}
                      </span>
                      {r.valor_recebido > 0 ? (
                        <span className="text-xs text-emerald-700 font-medium">
                          Recebido: {formatCurrency(r.valor_recebido)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">
                          Venc: {formatDate(r.data_vencimento)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 px-3 min-h-[44px] text-sm"
                            onClick={() => handleEdit(r)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-slate-600" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 px-3 min-h-[44px] text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => handleDelete(r)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 px-3 min-h-[44px] text-sm"
                          onClick={() => handleView(r)}
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

      <ReceitaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={load}
      />
      <ReceitaDetailDialog
        receita={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => handleEdit(selected)}
        onDelete={() => handleDelete(selected)}
        canEdit={canEdit}
      />
    </div>
  )
}
