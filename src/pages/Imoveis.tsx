import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { semAcento, termoDeBusca } from '@/lib/busca'
import {
  Building2,
  Building,
  Home,
  Store,
  Warehouse,
  LandPlot,
  Plus,
  Search,
  Eye,
  Pencil,
  Ban,
  AlertCircle,
  ChevronDown,
  Zap,
  Droplet,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { getImoveis, updateImovel, contarImoveisAtivos, type Imovel } from '@/services/imoveis'
import { getUnidades, inactivateUnidade, type ImovelUnidade } from '@/services/unidades'
import { getContratos, type Contrato } from '@/services/contratos'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, TIPO_IMOVEL_LABELS, STATUS_IMOVEL_LABELS } from '@/lib/format'
import { ImovelFormDialog } from '@/components/imoveis/ImovelFormDialog'
import { ImovelDetailDialog } from '@/components/imoveis/ImovelDetailDialog'
import { UnidadeFormDialog } from '@/components/imoveis/UnidadeFormDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { ConfirmarAcao } from '@/components/shared/ConfirmarAcao'
import { Input } from '@/components/ui/input'
import { Card, cantoOrganico } from '@/components/ui/card'
import { IconeTile } from '@/components/organico'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'

const ICONE_DO_TIPO: Record<string, LucideIcon> = {
  casa: Home,
  apartamento: Building,
  sala_comercial: Building2,
  loja: Store,
  galpao: Warehouse,
  terreno: LandPlot,
}

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

  // Imóveis abertos ficam na URL (?abertos=id1,id2): o "voltar" do navegador
  // devolve a lista como estava.
  const [searchParams, setSearchParams] = useSearchParams()
  const expandedIds = useMemo(
    () => new Set((searchParams.get('abertos') || '').split(',').filter(Boolean)),
    [searchParams],
  )
  const [contratosAtivos, setContratosAtivos] = useState<Contrato[]>([])

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
      // Sem permissão de contratos, a lista segue sem os aluguéis.
      getContratos({ where: [['status', '=', 'ativo']] })
        .then(setContratosAtivos)
        .catch(() => setContratosAtivos([]))
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
    const next = new Set(expandedIds)
    if (next.has(imovelId)) next.delete(imovelId)
    else next.add(imovelId)
    setSearchParams(
      (atual) => {
        const params = new URLSearchParams(atual)
        if (next.size) params.set('abertos', [...next].join(','))
        else params.delete('abertos')
        return params
      },
      { preventScrollReset: true },
    )
  }

  // Aluguel e inquilino de cada unidade vêm do contrato ativo dela.
  const contratoPorUnidade = useMemo(() => {
    const mapa = new Map<string, { valor: number; inquilino?: string }>()
    for (const c of contratosAtivos) {
      if (!c.unidade_id) continue
      mapa.set(c.unidade_id, {
        valor: Number(c.valor_aluguel) || 0,
        inquilino: (c.expand?.inquilino as { nome?: string } | undefined)?.nome,
      })
    }
    return mapa
  }, [contratosAtivos])

  const filtered = useMemo(() => {
    const q = termoDeBusca(search)
    return imoveis.filter((im) => {
      const matchSearch =
        !q ||
        [im.codigo, im.nome, im.endereco, im.matricula, im.cib].some((v) =>
          semAcento(v || '').includes(q),
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

  const resumo = useMemo(() => {
    const filhas = filtered.flatMap((im) => unidadesPorImovel.get(im.id) || [])
    const emUso = filhas.filter((u) => u.status !== 'inativo')
    return {
      unidades: emUso.length,
      ocupadas: emUso.filter((u) => u.status === 'alugado').length,
      vagas: emUso.filter((u) => u.status === 'vago').length,
    }
  }, [filtered, unidadesPorImovel])

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <header className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[min(100%,280px)] flex-1 flex-col gap-1 px-2 lg:px-0">
          <p className="text-sm text-accent-foreground">Cadastros</p>
          <h1 className="text-3xl lg:text-5xl">Imóveis</h1>
          {!loading && !error && (
            <p className="text-base text-accent-foreground">
              <span className="numero">
                {filtered.length} {filtered.length === 1 ? 'imóvel' : 'imóveis'}
              </span>
              ,{' '}
              <span className="numero">
                {resumo.unidades} {resumo.unidades === 1 ? 'unidade' : 'unidades'}
              </span>{' '}
              · <span className="numero">{resumo.ocupadas} ocupadas</span>,{' '}
              <span className="numero">
                {resumo.vagas} {resumo.vagas === 1 ? 'vaga' : 'vagas'}
              </span>
            </p>
          )}
          {ativosCount !== null && (
            <Badge
              variant={ativosCount >= 3 ? 'warn' : 'ok'}
              className="mt-1 self-start whitespace-normal"
              title="Controle comercial da cota de até 3 imóveis ativos"
            >
              {ativosCount} de 3 imóveis cadastrados
              {ativosCount >= 3 && ' (cota máxima atingida)'}
            </Badge>
          )}
        </div>

        {canEdit && (
          <Button onClick={handleNew} className="w-full sm:w-auto">
            <Plus aria-hidden="true" /> Novo imóvel
          </Button>
        )}
      </header>

      {/* Filtros e Busca */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_1fr_1fr]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search
            className="absolute left-5 top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Buscar por código, nome, endereço, matrícula ou CIB"
            placeholder="Buscar por nome, endereço, CIB..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-14 pl-14"
          />
        </div>
        <Select value={fTipo} onValueChange={setFTipo}>
          <SelectTrigger aria-label="Tipo" className="min-h-14">
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
          <SelectTrigger aria-label="Status" className="min-h-14">
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
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-organic-tr" />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-3xl bg-destructive/15 px-5 py-4 text-red-800"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-base font-bold">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed px-6 py-12 text-center">
          <IconeTile icone={Building2} blob={2} />
          <p className="text-base text-accent-foreground">Nenhum imóvel encontrado.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((im, indice) => {
            const filhas = unidadesPorImovel.get(im.id) || []
            const emUso = filhas.filter((u) => u.status !== 'inativo')
            const ocupadas = emUso.filter((u) => u.status === 'alugado').length
            const aluguel = emUso.reduce(
              (soma, u) => soma + (contratoPorUnidade.get(u.id)?.valor ?? 0),
              0,
            )
            const aberto = expandedIds.has(im.id)
            const idConteudo = `unidades-${im.id}`
            const nome = im.nome || im.codigo || im.endereco || 'Imóvel'
            const endereco = [im.endereco, im.numero].filter(Boolean).join(', ')
            const pct = emUso.length ? Math.round((ocupadas / emUso.length) * 100) : 0
            const textoOcupacao =
              emUso.length === 0
                ? 'Sem unidades'
                : ocupadas === 0
                  ? 'Vago'
                  : `${ocupadas} de ${emUso.length} ${ocupadas === 1 ? 'ocupada' : 'ocupadas'}`
            const blob = ((indice % 4) + 1) as 1 | 2 | 3 | 4

            return (
              <li key={im.id}>
                <Card canto={cantoOrganico(indice)} className="group overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleExpand(im.id)}
                    aria-expanded={aberto}
                    aria-controls={idConteudo}
                    className="flex w-full items-center gap-3.5 p-[18px] text-left lg:grid lg:grid-cols-[56px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_40px] lg:gap-5 lg:px-6"
                  >
                    <IconeTile
                      icone={ICONE_DO_TIPO[im.tipo || ''] ?? Building2}
                      blob={blob}
                      tamanho="sm"
                      className="group-hover:bg-primary group-hover:text-primary-foreground lg:h-14 lg:w-14"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <strong className="font-serif text-lg font-bold leading-tight lg:text-[1.3125rem]">
                          {nome}
                        </strong>
                        {(im.status === 'inativo' || im.status === 'em_manutencao') && (
                          <StatusBadge type="imovel" status={im.status} />
                        )}
                      </span>
                      <span className="text-sm text-accent-foreground lg:hidden">
                        {filhas.length} {filhas.length === 1 ? 'unidade' : 'unidades'} ·{' '}
                        {textoOcupacao.toLowerCase()}
                      </span>
                      <span className="hidden text-sm text-accent-foreground lg:block">
                        {endereco || TIPO_IMOVEL_LABELS[im.tipo || ''] || '—'}
                      </span>
                    </span>
                    <span className="hidden flex-col gap-1.5 lg:flex">
                      <span className="text-sm text-accent-foreground">{textoOcupacao}</span>
                      <span
                        aria-hidden="true"
                        className="h-2.5 overflow-hidden rounded-full bg-muted"
                      >
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                    </span>
                    <span className="hidden flex-col lg:flex">
                      <span className="text-sm text-accent-foreground">Aluguel mensal</span>
                      <strong className="numero text-lg">
                        {aluguel > 0 ? formatCurrency(aluguel) : 'Sem receita'}
                      </strong>
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        'h-6 w-6 shrink-0 text-primary transition-transform duration-400 ease-organic lg:h-[26px] lg:w-[26px]',
                        aberto && 'rotate-180',
                      )}
                    />
                  </button>

                  {aberto && (
                    <div
                      id={idConteudo}
                      className="flex flex-col gap-3 px-3.5 pb-4 lg:pb-5 lg:pl-[100px] lg:pr-6"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleView(im)}>
                          <Eye aria-hidden="true" /> Detalhes
                        </Button>
                        {canEdit && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(im)}>
                              <Pencil aria-hidden="true" /> Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNewUnidade(im)}
                            >
                              <Plus aria-hidden="true" /> Unidade
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
                                  size="sm"
                                  className="text-red-800 hover:bg-destructive/10"
                                  aria-label={`Inativar ${nome}`}
                                >
                                  <Ban aria-hidden="true" /> Inativar
                                </Button>
                              </ConfirmarAcao>
                            )}
                          </>
                        )}
                      </div>

                      {filhas.length === 0 ? (
                        <p className="rounded-[20px] bg-sunken px-4 py-3 text-base text-accent-foreground">
                          Nenhuma unidade cadastrada neste imóvel.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-2 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] lg:gap-3">
                          {filhas.map((u) => {
                            const contrato = contratoPorUnidade.get(u.id)
                            const inquilino =
                              (u.expand?.inquilino_atual as { nome?: string } | undefined)?.nome ||
                              contrato?.inquilino ||
                              (u.status === 'alugado' ? 'Inquilino não informado' : 'Sem inquilino')
                            return (
                              <li
                                key={u.id}
                                className="flex flex-col gap-2 rounded-[20px_28px_20px_20px] bg-sunken px-4 py-3 lg:p-4"
                              >
                                <div className="flex items-center gap-2">
                                  <strong className="min-w-0 flex-1 text-base">
                                    {u.identificador}
                                    {u.complemento && (
                                      <span className="font-normal text-accent-foreground">
                                        {' '}
                                        ({u.complemento})
                                      </span>
                                    )}
                                  </strong>
                                  <StatusBadge type="imovel" status={u.status} />
                                </div>
                                <span className="text-sm text-accent-foreground">{inquilino}</span>
                                <div className="flex items-center gap-2">
                                  <strong className="numero flex-1 text-base">
                                    {contrato?.valor
                                      ? `${formatCurrency(contrato.valor)} / mês`
                                      : u.status === 'vago'
                                        ? 'Disponível'
                                        : '—'}
                                  </strong>
                                  {canEdit && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-11 w-11 min-h-11 min-w-11"
                                        aria-label={`Editar unidade ${u.identificador}`}
                                        onClick={() => handleEditUnidade(u, im)}
                                      >
                                        <Pencil aria-hidden="true" />
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
                                            className="h-11 w-11 min-h-11 min-w-11 text-red-800 hover:bg-destructive/10"
                                            aria-label={`Inativar unidade ${u.identificador}`}
                                          >
                                            <Ban aria-hidden="true" />
                                          </Button>
                                        </ConfirmarAcao>
                                      )}
                                    </>
                                  )}
                                </div>
                                {(u.codigo_energia ||
                                  u.codigo_agua ||
                                  (u.tem_condominio && u.valor_condominio)) && (
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-accent-foreground">
                                    {u.codigo_energia && (
                                      <span className="flex items-center gap-1">
                                        <Zap
                                          className="h-4 w-4 text-warning-ink"
                                          aria-hidden="true"
                                        />
                                        <span className="sr-only">Energia:</span>
                                        {u.codigo_energia}
                                      </span>
                                    )}
                                    {u.codigo_agua && (
                                      <span className="flex items-center gap-1">
                                        <Droplet
                                          className="h-4 w-4 text-primary"
                                          aria-hidden="true"
                                        />
                                        <span className="sr-only">Água:</span>
                                        {u.codigo_agua}
                                      </span>
                                    )}
                                    {u.tem_condominio && u.valor_condominio && (
                                      <span className="numero">
                                        Cond. {formatCurrency(u.valor_condominio)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
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
