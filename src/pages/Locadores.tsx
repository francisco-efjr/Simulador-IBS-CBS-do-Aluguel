import { useState, useEffect, useCallback, useMemo } from 'react'
import { semAcento, termoDeBusca } from '@/lib/busca'
import { UserCheck, Plus, Search, Pencil, Ban, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getLocadores, inactivateLocador, type Locador } from '@/services/locadores'
import { useRealtime } from '@/hooks/use-realtime'
import { TIPO_PESSOA_LABELS, formatarCpfCnpj, formatarTelefone } from '@/lib/format'
import { LocadorFormDialog } from '@/components/locadores/LocadorFormDialog'
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
import { cn } from '@/lib/utils'
import { COLUNA_ACOES_CABECALHO, COLUNA_ACOES_CELULA } from '@/lib/tabela'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'

export default function Locadores() {
  const { canEditModule } = useAuth()
  const canEdit = canEditModule('locadores')

  const [locadores, setLocadores] = useState<Locador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fTipo, setFTipo] = useState('all')
  const [fStatus, setFStatus] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Locador | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await getLocadores()
      setLocadores(data)
    } catch {
      setError('Erro ao carregar locadores. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useRealtime('locadores', () => {
    load()
  })

  const filtered = useMemo(() => {
    const q = termoDeBusca(search)
    return locadores.filter((loc) => {
      const matchSearch =
        !q ||
        [loc.nome_razao_social, loc.cpf_cnpj, loc.email, loc.telefone, loc.dados_bancarios].some(
          (v) => semAcento(v || '').includes(q),
        )

      const matchTipo = fTipo === 'all' || loc.tipo_pessoa === fTipo
      const matchStatus = fStatus === 'all' || loc.status === fStatus

      return matchSearch && matchTipo && matchStatus
    })
  }, [locadores, search, fTipo, fStatus])

  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleEdit = (loc: Locador) => {
    setEditing(loc)
    setFormOpen(true)
  }

  const handleInactivate = async (loc: Locador) => {
    try {
      await inactivateLocador(loc.id)
      toast.success('Locador inativado com sucesso.')
      load()
    } catch {
      toast.error('Não foi possível inativar o locador. Tente novamente.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Locadores
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Cadastro de proprietários e repasses
            </p>
          </div>
        </div>
        {canEdit && (
          <Button
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-1" /> Novo Locador
          </Button>
        )}
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <Input
            aria-label="Buscar por nome, documento, e-mail ou telefone"
            placeholder="Buscar por nome, documento, e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50/50 min-h-[44px]"
          />
        </div>
        <Select value={fTipo} onValueChange={setFTipo}>
          <SelectTrigger aria-label="Tipo de pessoa" className="w-full bg-slate-50/50 min-h-[44px]">
            <SelectValue placeholder="Tipo de pessoa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="pf">Pessoa Física</SelectItem>
            <SelectItem value="pj">Pessoa Jurídica</SelectItem>
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

      {/* Conteúdo */}
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
            <UserCheck className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-600">Nenhum locador encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-600">{filtered.length} locador(es)</p>

          {/* Versão Desktop: Tabela */}
          <div className="hidden min-[1450px]:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-[280px]">Locador / Proprietário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Dados Bancários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className={cn('w-[100px] text-right', COLUNA_ACOES_CABECALHO)}>
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((loc) => (
                  <TableRow key={loc.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900">
                      {loc.nome_razao_social}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {TIPO_PESSOA_LABELS[loc.tipo_pessoa] || loc.tipo_pessoa}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-slate-700">
                      {formatarCpfCnpj(loc.cpf_cnpj)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <div>{loc.email || '—'}</div>
                      {loc.telefone && (
                        <div className="text-xs text-slate-600">
                          {formatarTelefone(loc.telefone)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-xs text-slate-600 max-w-[220px] truncate"
                      title={loc.dados_bancarios || undefined}
                    >
                      {loc.dados_bancarios || '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="geral" status={loc.status} />
                    </TableCell>
                    <TableCell className={cn('text-right', COLUNA_ACOES_CELULA)}>
                      {canEdit && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${loc.nome_razao_social}`}
                            title="Editar"
                            className="h-11 w-11 min-h-[44px] min-w-[44px]"
                            onClick={() => handleEdit(loc)}
                          >
                            <Pencil className="h-4 w-4 text-slate-600" />
                          </Button>
                          {loc.status !== 'inativo' && (
                            <ConfirmarAcao
                              titulo="Inativar este locador?"
                              descricao="O locador será marcado como inativo. O histórico contratual e financeiro será preservado e é possível reativá-lo a qualquer momento."
                              rotuloConfirmar="Sim, inativar locador"
                              onConfirmar={() => handleInactivate(loc)}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Inativar ${loc.nome_razao_social}`}
                                title="Inativar"
                                className="h-11 w-11 min-h-[44px] min-w-[44px]"
                              >
                                <Ban className="h-4 w-4 text-red-600" />
                              </Button>
                            </ConfirmarAcao>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Versão Mobile: Cards */}
          <div className="min-[1450px]:hidden grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((loc) => (
              <Card key={loc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {loc.nome_razao_social}
                      </p>
                      <p className="text-xs text-slate-600">
                        {TIPO_PESSOA_LABELS[loc.tipo_pessoa] || loc.tipo_pessoa} •{' '}
                        {formatarCpfCnpj(loc.cpf_cnpj)}
                      </p>
                    </div>
                    <StatusBadge type="geral" status={loc.status} />
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    {loc.email && <div>E-mail: {loc.email}</div>}
                    {loc.telefone && <div>Tel: {formatarTelefone(loc.telefone)}</div>}
                    {loc.dados_bancarios && (
                      <div className="truncate">Banco: {loc.dados_bancarios}</div>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 px-3 min-h-[44px] text-sm"
                        onClick={() => handleEdit(loc)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1 text-slate-600" /> Editar
                      </Button>
                      {loc.status !== 'inativo' && (
                        <ConfirmarAcao
                          titulo="Inativar este locador?"
                          descricao="O locador será marcado como inativo. O histórico contratual e financeiro será preservado."
                          rotuloConfirmar="Sim, inativar"
                          onConfirmar={() => handleInactivate(loc)}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 min-h-[44px] min-w-[44px] px-3 text-red-600 hover:bg-red-50 border-red-200"
                            aria-label={`Inativar ${loc.nome_razao_social}`}
                            title="Inativar"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        </ConfirmarAcao>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modal de Formulário */}
      <LocadorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={load}
      />
    </div>
  )
}
