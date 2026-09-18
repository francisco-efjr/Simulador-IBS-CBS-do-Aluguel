import { useState, useEffect, useCallback, useMemo } from 'react'
import { Users, Plus, Search, Eye, Pencil, Ban, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getInquilinos, updateInquilino } from '@/services/inquilinos'
import { useRealtime } from '@/hooks/use-realtime'
import { TIPO_PESSOA_LABELS } from '@/lib/format'
import { InquilinoFormDialog } from '@/components/inquilinos/InquilinoFormDialog'
import { InquilinoDetailDialog } from '@/components/inquilinos/InquilinoDetailDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { ConfirmarAcao } from '@/components/shared/ConfirmarAcao'
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

export default function Inquilinos() {
  const { canEditModule } = useAuth()
  const canEdit = canEditModule('inquilinos')
  const [inquilinos, setInquilinos] = useState<any[]>([])
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
      const data = await getInquilinos()
      setInquilinos(data)
      setSelected((prev) => (prev ? (data.find((iq) => iq.id === prev.id) ?? null) : null))
    } catch {
      setError('Erro ao carregar inquilinos. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('inquilinos', () => {
    load()
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return inquilinos.filter((iq) => {
      const doc = iq.tipo_pessoa === 'pj' ? iq.cnpj : iq.cpf
      const ms = !q || [iq.nome, doc, iq.email].some((v) => (v || '').toLowerCase().includes(q))
      return (
        ms &&
        (fTipo === 'all' || iq.tipo_pessoa === fTipo) &&
        (fStatus === 'all' || iq.status === fStatus)
      )
    })
  }, [inquilinos, search, fTipo, fStatus])

  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const handleEdit = (iq: any) => {
    setEditing(iq)
    setDetailOpen(false)
    setFormOpen(true)
  }
  const handleView = (iq: any) => {
    setSelected(iq)
    setDetailOpen(true)
  }
  const handleInactivate = async (iq: any) => {
    try {
      await updateInquilino(iq.id, { status: 'inativo' })
      toast.success('Inquilino marcado como inativo.')
      load()
    } catch {
      toast.error('Não foi possível inativar o inquilino. Tente novamente.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Inquilinos
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Cadastro de locatários, históricos de ocupação e dados de contato
            </p>
          </div>
        </div>
        {canEdit && (
          <Button
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-1" /> Novo Inquilino
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <Input
            aria-label="Buscar por nome, CPF/CNPJ ou e-mail"
            placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
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
            {Object.entries(TIPO_PESSOA_LABELS).map(([v, l]) => (
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
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
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
            <Users className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-600">Nenhum inquilino encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-600">{filtered.length} inquilino(s)</p>
          <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table className="min-w-[650px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-[220px]">Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="w-[120px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((iq) => (
                  <TableRow
                    key={iq.id}
                    className="cursor-pointer hover:bg-slate-50/50"
                    onClick={() => handleView(iq)}
                  >
                    <TableCell className="font-medium">
                      {iq.nome || '—'}
                      {iq.email && <span className="block text-xs text-slate-600">{iq.email}</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {TIPO_PESSOA_LABELS[iq.tipo_pessoa] || '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="geral" status={iq.status} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {iq.tipo_pessoa === 'pj' ? iq.cnpj : iq.cpf || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{iq.telefone || '—'}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Ver detalhes"
                          title="Ver detalhes"
                          className="h-11 w-11 min-h-[44px] min-w-[44px]"
                          onClick={() => handleView(iq)}
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Editar"
                              title="Editar"
                              className="h-11 w-11 min-h-[44px] min-w-[44px]"
                              onClick={() => handleEdit(iq)}
                            >
                              <Pencil className="h-4 w-4 text-slate-600" />
                            </Button>
                            {iq.status !== 'inativo' && (
                              <ConfirmarAcao
                                titulo="Inativar este inquilino?"
                                descricao="O inquilino sai das listas ativas e deixa de aparecer para novos contratos. O histórico continua guardado e o status pode ser revertido pela edição."
                                rotuloConfirmar="Sim, inativar o inquilino"
                                onConfirmar={() => handleInactivate(iq)}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Inativar"
                                  title="Inativar"
                                  className="h-11 w-11 min-h-[44px] min-w-[44px]"
                                >
                                  <Ban className="h-4 w-4 text-red-600" />
                                </Button>
                              </ConfirmarAcao>
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
            {filtered.map((iq) => (
              <Card
                key={iq.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:bg-slate-50"
                onClick={() => handleView(iq)}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {iq.nome || '—'}
                      </p>
                      <p className="text-xs text-slate-600">
                        {TIPO_PESSOA_LABELS[iq.tipo_pessoa] || '—'}
                      </p>
                    </div>
                    <StatusBadge type="geral" status={iq.status} />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">CPF/CNPJ:</span>
                      <span className="font-medium">
                        {iq.tipo_pessoa === 'pj' ? iq.cnpj : iq.cpf || '—'}
                      </span>
                    </div>
                    {iq.email && (
                      <div className="flex justify-between truncate">
                        <span className="text-slate-600">E-mail:</span>
                        <span className="truncate ml-2">{iq.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-600">{iq.telefone || 'Sem telefone'}</span>
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 px-3 min-h-[44px] text-sm"
                            onClick={() => handleEdit(iq)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-slate-600" /> Editar
                          </Button>
                          {iq.status !== 'inativo' && (
                            <ConfirmarAcao
                              titulo="Inativar este inquilino?"
                              descricao="O inquilino sai das listas ativas e deixa de aparecer para novos contratos. O histórico continua guardado e o status pode ser revertido pela edição."
                              rotuloConfirmar="Sim, inativar o inquilino"
                              onConfirmar={() => handleInactivate(iq)}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-11 px-3 min-h-[44px] text-red-600 hover:bg-red-50 border-red-200"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            </ConfirmarAcao>
                          )}
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 px-3 min-h-[44px] text-sm"
                          onClick={() => handleView(iq)}
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

      <InquilinoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={load}
      />
      <InquilinoDetailDialog
        inquilino={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => handleEdit(selected)}
        canEdit={canEdit}
      />
    </div>
  )
}
