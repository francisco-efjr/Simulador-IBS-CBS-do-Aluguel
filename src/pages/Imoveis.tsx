import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Building2,
  Plus,
  Search,
  Eye,
  Pencil,
  Ban,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  Zap,
  Droplet,
} from 'lucide-react'
import { toast } from 'sonner'
import { getImoveis, updateImovel, contarImoveisAtivos, type Imovel } from '@/services/imoveis'
import { getUnidades, inactivateUnidade, type ImovelUnidade } from '@/services/unidades'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, TIPO_IMOVEL_LABELS, STATUS_IMOVEL_LABELS } from '@/lib/format'
import { ImovelFormDialog } from '@/components/imoveis/ImovelFormDialog'
import { ImovelDetailDialog } from '@/components/imoveis/ImovelDetailDialog'
import { UnidadeFormDialog } from '@/components/imoveis/UnidadeFormDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { ConfirmarAcao } from '@/components/shared/ConfirmarAcao'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export default function Imoveis() {
  const { canEditModule } = useAuth()
  const canEdit = canEditModule('imoveis')

  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [unidades, setUnidades] = useState<ImovelUnidade[]>([])
  const [ativosCount, setAtivosCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fTipo, setFTipo] = useState('all')
  const [fStatus, setFStatus] = useState('all')

  // Controle de expansão hierárquica
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Diálogos de Imóvel
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editing, setEditing] = useState<Imovel | null>(null)
  const [selected, setSelected] = useState<Imovel | null>(null)

  // Diálogos de Unidade
  const [unidadeModalOpen, setUnidadeModalOpen] = useState(false)
  const [unidadeEditing, setUnidadeEditing] = useState<ImovelUnidade | null>(null)
  const [unidadeImovelTarget, setUnidadeImovelTarget] = useState<{
    id: string
    nome: string
  } | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const [ims, unds, countAtivos] = await Promise.all([
        getImoveis(),
        getUnidades(),
        contarImoveisAtivos().catch(() => null),
      ])
      setImoveis(ims)
      setUnidades(unds)
      if (countAtivos != null) {
        setAtivosCount(countAtivos)
      } else {
        setAtivosCount(ims.filter((i) => i.status !== 'inativo').length)
      }
      setSelected((prev) => (prev ? (ims.find((im) => im.id === prev.id) ?? null) : null))
    } catch {
      setError('Erro ao carregar imóveis e unidades. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useRealtime('imoveis', load)
  useRealtime('imovel_unidades', load)

  // Mapa de unidades por imovel_id
  const unidadesPorImovel = useMemo(() => {
    const map = new Map<string, ImovelUnidade[]>()
    for (const u of unidades) {
      const list = map.get(u.imovel_id) || []
      list.push(u)
      map.set(u.imovel_id, list)
    }
    return map
  }, [unidades])

  const toggleExpand = (imovelId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(imovelId)) next.delete(imovelId)
      else next.add(imovelId)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return imoveis.filter((im) => {
      const matchSearch =
        !q ||
        [im.codigo, im.nome, im.endereco, im.matricula, im.cib].some((v) =>
          (v || '').toLowerCase().includes(q),
        )
      return (
        matchSearch &&
        (fTipo === 'all' || im.tipo === fTipo) &&
        (fStatus === 'all' || im.status === fStatus)
      )
    })
  }, [imoveis, search, fTipo, fStatus])

  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleEdit = (im: Imovel) => {
    setEditing(im)
    setDetailOpen(false)
    setFormOpen(true)
  }

  const handleView = (im: Imovel) => {
    setSelected(im)
    setDetailOpen(true)
  }

  const handleInactivate = async (im: Imovel) => {
    try {
      await updateImovel(im.id, { status: 'inativo' })
      toast.success('Imóvel marcado como inativo.')
      load()
    } catch {
      toast.error('Não foi possível inativar o imóvel. Tente novamente.')
    }
  }

  // Ações de Unidade
  const handleNewUnidade = (im: Imovel) => {
    setUnidadeImovelTarget({
      id: im.id,
      nome: im.nome || im.codigo || im.endereco,
    })
    setUnidadeEditing(null)
    setUnidadeModalOpen(true)
  }

  const handleEditUnidade = (u: ImovelUnidade, im: Imovel) => {
    setUnidadeImovelTarget({
      id: im.id,
      nome: im.nome || im.codigo || im.endereco,
    })
    setUnidadeEditing(u)
    setUnidadeModalOpen(true)
  }

  const handleInactivateUnidade = async (u: ImovelUnidade) => {
    try {
      await inactivateUnidade(u.id)
      toast.success('Unidade marcada como inativa.')
      load()
    } catch {
      toast.error(
        'Não foi possível inativar a unidade. Verifique se há contratos ativos vinculados.',
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Imóveis
              </h1>
              {ativosCount !== null && (
                <Badge
                  variant="outline"
                  className={
                    ativosCount >= 3
                      ? 'bg-amber-50 text-amber-800 border-amber-300 font-medium'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium'
                  }
                  title="Controle comercial da cota de até 3 imóveis ativos"
                >
                  {ativosCount} de 3 imóveis cadastrados
                  {ativosCount >= 3 && ' (Cota máxima atingida)'}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Gestão de propriedades macro e unidades locáveis filhas
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

      {/* Filtros e Busca */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <Input
            aria-label="Buscar por código, nome, endereço, matrícula ou CIB"
            placeholder="Buscar por código, nome, endereço, CIB..."
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
            {Object.entries(TIPO_IMOVEL_LABELS).map(([v, l]) => (
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
            {Object.entries(STATUS_IMOVEL_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
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
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Building2 className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-600">Nenhum imóvel encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-600">{filtered.length} imóvel(is) encontrado(s)</p>

          {/* Versão Desktop: Tabela com Linhas Expansíveis */}
          <div className="hidden lg:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table className="min-w-[850px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-[48px]"></TableHead>
                  <TableHead className="w-[280px]">Imóvel / Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="text-right">Valor Est.</TableHead>
                  <TableHead className={cn('w-[160px] text-right', COLUNA_ACOES_CABECALHO)}>
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((im) => {
                  const filhas = unidadesPorImovel.get(im.id) || []
                  const isExpanded = expandedIds.has(im.id)
                  const vagasCount = filhas.filter((u) => u.status === 'vago').length
                  const alugadasCount = filhas.filter((u) => u.status === 'alugado').length

                  return (
                    <tbody key={im.id} className="border-b border-slate-200/80">
                      <TableRow
                        className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                        onClick={() => handleView(im)}
                      >
                        {/* Botão expansor */}
                        <TableCell
                          className="w-[48px] p-2 text-center"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(im.id)
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={isExpanded ? 'Recolher unidades' : 'Expandir unidades'}
                            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>

                        <TableCell className="font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{im.nome || im.codigo || '—'}</span>
                          </div>
                          {im.codigo && (
                            <span className="block text-xs font-mono text-slate-500">
                              {im.codigo}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-sm">
                          {TIPO_IMOVEL_LABELS[im.tipo || ''] || '—'}
                        </TableCell>

                        <TableCell>
                          <StatusBadge type="imovel" status={im.status} />
                        </TableCell>

                        {/* Indicador de Unidades Filhas */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Layers className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="font-semibold text-slate-800">
                              {filhas.length} {filhas.length === 1 ? 'unidade' : 'unidades'}
                            </span>
                            {filhas.length > 0 && (
                              <span className="text-[11px] text-slate-600">
                                ({alugadasCount} alug., {vagasCount} vag.)
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-slate-600 max-w-[200px] truncate">
                          {im.endereco}
                          {im.numero ? `, ${im.numero}` : ''}
                        </TableCell>

                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(im.valor_estimado)}
                        </TableCell>

                        <TableCell
                          className={cn('text-right', COLUNA_ACOES_CELULA)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end items-center gap-1">
                            {canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                aria-label="Adicionar unidade"
                                title="Adicionar unidade a este imóvel"
                                className="h-8 px-2 text-xs text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                                onClick={() => handleNewUnidade(im)}
                              >
                                <Plus className="h-3.5 w-3.5 mr-0.5" /> Unidade
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Ver detalhes"
                              title="Ver detalhes"
                              className="h-9 w-9 min-h-[36px]"
                              onClick={() => handleView(im)}
                            >
                              <Eye className="h-4 w-4 text-slate-600" />
                            </Button>
                            {canEdit && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Editar imóvel"
                                  title="Editar imóvel"
                                  className="h-9 w-9 min-h-[36px]"
                                  onClick={() => handleEdit(im)}
                                >
                                  <Pencil className="h-4 w-4 text-slate-600" />
                                </Button>
                                {im.status !== 'inativo' && (
                                  <ConfirmarAcao
                                    titulo="Inativar este imóvel?"
                                    descricao="O imóvel sai das listas ativas e relatórios. Nada é excluído do banco."
                                    rotuloConfirmar="Sim, inativar"
                                    onConfirmar={() => handleInactivate(im)}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label="Inativar"
                                      title="Inativar"
                                      className="h-9 w-9 min-h-[36px]"
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

                      {/* Linha Expansível: Lista das Unidades Filhas */}
                      {isExpanded && (
                        <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                          <TableCell colSpan={8} className="p-3 pl-12">
                            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <Layers className="h-4 w-4 text-indigo-600" />
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Unidades de {im.nome || im.endereco}
                                  </span>
                                </div>
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                    onClick={() => handleNewUnidade(im)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Nova Unidade
                                  </Button>
                                )}
                              </div>

                              {filhas.length === 0 ? (
                                <p className="text-xs text-slate-500 py-3 text-center">
                                  Nenhuma unidade cadastrada neste imóvel. Clique em "+ Nova
                                  Unidade" para adicionar.
                                </p>
                              ) : (
                                <div className="divide-y divide-slate-100">
                                  {filhas.map((u) => (
                                    <div
                                      key={u.id}
                                      className="flex items-center justify-between py-2 text-xs"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="font-semibold text-slate-900 min-w-[120px]">
                                          {u.identificador}
                                          {u.complemento && (
                                            <span className="text-slate-500 font-normal ml-1">
                                              ({u.complemento})
                                            </span>
                                          )}
                                        </div>

                                        <StatusBadge type="imovel" status={u.status} />

                                        {/* Detalhes de Energia e Água */}
                                        <div className="hidden lg:flex items-center gap-3 text-slate-600">
                                          {u.codigo_energia && (
                                            <span className="flex items-center gap-1 text-[11px]">
                                              <Zap className="h-3 w-3 text-amber-500" />
                                              {u.codigo_energia}
                                            </span>
                                          )}
                                          {u.codigo_agua && (
                                            <span className="flex items-center gap-1 text-[11px]">
                                              <Droplet className="h-3 w-3 text-blue-500" />
                                              {u.codigo_agua}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4">
                                        {/* Taxas */}
                                        <div className="text-right text-slate-600 space-x-2">
                                          {u.tem_condominio && u.valor_condominio && (
                                            <span>Cond.: {formatCurrency(u.valor_condominio)}</span>
                                          )}
                                          {u.taxa_poco != null && (
                                            <span>Poço: {formatCurrency(u.taxa_poco)}</span>
                                          )}
                                        </div>

                                        {canEdit && (
                                          <div className="flex items-center gap-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-slate-500 hover:text-slate-900"
                                              aria-label="Editar unidade"
                                              title="Editar unidade"
                                              onClick={() => handleEditUnidade(u, im)}
                                            >
                                              <Pencil className="h-3 w-3" />
                                            </Button>
                                            {u.status !== 'inativo' && (
                                              <ConfirmarAcao
                                                titulo="Inativar unidade?"
                                                descricao="A unidade não poderá receber novos contratos enquanto estiver inativa."
                                                rotuloConfirmar="Sim, inativar"
                                                onConfirmar={() => handleInactivateUnidade(u)}
                                              >
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 text-red-500 hover:text-red-700"
                                                  aria-label="Inativar unidade"
                                                  title="Inativar unidade"
                                                >
                                                  <Ban className="h-3 w-3" />
                                                </Button>
                                              </ConfirmarAcao>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </tbody>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Versão Mobile: Cards com Unidades Integradas */}
          <div className="lg:hidden space-y-3">
            {filtered.map((im) => {
              const filhas = unidadesPorImovel.get(im.id) || []
              const isExpanded = expandedIds.has(im.id)

              return (
                <Card key={im.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {im.nome || im.codigo || '—'}
                        </p>
                        <p className="text-xs text-slate-600">
                          {TIPO_IMOVEL_LABELS[im.tipo || ''] || '—'} • {im.endereco}
                        </p>
                      </div>
                      <StatusBadge type="imovel" status={im.status} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(im.valor_estimado)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(im.id)}
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline min-h-[44px]"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>{filhas.length} unidades</span>
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Unidades expandidas no mobile */}
                    {isExpanded && (
                      <div className="rounded-lg bg-slate-50 p-2.5 space-y-2 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Unidades Filhas</span>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs text-indigo-600 border-indigo-200"
                              onClick={() => handleNewUnidade(im)}
                            >
                              <Plus className="h-3 w-3 mr-0.5" /> Nova
                            </Button>
                          )}
                        </div>

                        {filhas.length === 0 ? (
                          <p className="text-xs text-slate-500 py-1">Nenhuma unidade cadastrada.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {filhas.map((u) => (
                              <div
                                key={u.id}
                                className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-100 text-xs"
                              >
                                <div>
                                  <p className="font-semibold text-slate-900">{u.identificador}</p>
                                  {u.complemento && (
                                    <p className="text-[11px] text-slate-500">{u.complemento}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusBadge type="imovel" status={u.status} />
                                  {canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-11 w-11 min-h-[44px] min-w-[44px]"
                                      aria-label={`Editar unidade ${u.identificador}`}
                                      onClick={() => handleEditUnidade(u, im)}
                                    >
                                      <Pencil className="h-3 w-3" aria-hidden="true" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 px-3 min-h-[44px] text-sm"
                        onClick={() => handleView(im)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1 text-slate-600" /> Detalhes
                      </Button>
                      {canEdit && (
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 px-3 min-h-[44px] text-sm"
                            onClick={() => handleEdit(im)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-slate-600" /> Editar
                          </Button>
                          {im.status !== 'inativo' && (
                            <ConfirmarAcao
                              titulo="Inativar este imóvel?"
                              descricao="O imóvel sairá das listas ativas. O histórico é preservado."
                              rotuloConfirmar="Sim, inativar"
                              onConfirmar={() => handleInactivate(im)}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-11 min-h-[44px] min-w-[44px] px-3 text-red-600 hover:bg-red-50 border-red-200"
                                aria-label={`Inativar ${im.nome}`}
                              >
                                <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                            </ConfirmarAcao>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Diálogos */}
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
        onEdit={() => handleEdit(selected!)}
        onRefresh={load}
        canEdit={canEdit}
      />
      {unidadeImovelTarget && (
        <UnidadeFormDialog
          open={unidadeModalOpen}
          onOpenChange={setUnidadeModalOpen}
          imovelId={unidadeImovelTarget.id}
          imovelNome={unidadeImovelTarget.nome}
          editing={unidadeEditing}
          onSaved={load}
        />
      )}
    </div>
  )
}
