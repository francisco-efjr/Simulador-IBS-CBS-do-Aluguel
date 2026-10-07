import { useState, useEffect, useCallback, useMemo } from 'react'
import { semAcento, termoDeBusca } from '@/lib/busca'
import { useSearchParams } from 'react-router-dom'
import {
  FileText,
  FileDown,
  Plus,
  Search,
  Eye,
  Pencil,
  Ban,
  Check,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { getContratos, updateContrato } from '@/services/contratos'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, formatDate, TIPO_GARANTIA_LABELS } from '@/lib/format'
import {
  ehFiltroSituacao,
  FILTROS_DE_SITUACAO,
  situacaoDoContrato,
  type FiltroSituacao,
} from '@/lib/situacao-contrato'
import { ContratoFormDialog } from '@/components/contratos/ContratoFormDialog'
import { ContratoDetailDialog } from '@/components/contratos/ContratoDetailDialog'
import { MinutaContratoDialog } from '@/components/contratos/MinutaContratoDialog'
import { Badge } from '@/components/ui/badge'
import { FiltroChips, IconeTile } from '@/components/organico'
import { Button } from '@/components/ui/button'
import { ConfirmarAcao } from '@/components/shared/ConfirmarAcao'
import { Input } from '@/components/ui/input'
import { Card, cantoOrganico } from '@/components/ui/card'
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

export default function Contratos() {
  const { canEditModule } = useAuth()
  const canEdit = canEditModule('contratos')
  const [contratos, setContratos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  // Filtro de situação na URL (?situacao=vencendo): o "voltar" e o link compartilhado mantêm.
  const [searchParams, setSearchParams] = useSearchParams()
  const situacaoNaUrl = searchParams.get('situacao')
  const situacao: FiltroSituacao = ehFiltroSituacao(situacaoNaUrl) ? situacaoNaUrl : 'todos'
  const escolherSituacao = (valor: FiltroSituacao) =>
    setSearchParams(
      (atual) => {
        const params = new URLSearchParams(atual)
        if (valor === 'todos') params.delete('situacao')
        else params.set('situacao', valor)
        return params
      },
      { preventScrollReset: true },
    )
  const [fGarantia, setFGarantia] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [minutaOpen, setMinutaOpen] = useState(false)
  const [minutaContrato, setMinutaContrato] = useState<any | null>(null)

  const handleMinuta = (c: any) => {
    setMinutaContrato(c)
    setMinutaOpen(true)
  }

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

  // Busca e garantia filtram primeiro; os chips mostram quantos sobram em cada situação.
  const buscados = useMemo(() => {
    const q = termoDeBusca(search)
    return contratos.filter((c) => {
      const imovelNome = c.expand?.imovel?.nome || c.expand?.imovel?.endereco || ''
      const inquilinoNome = c.expand?.inquilino?.nome || ''
      const ms =
        !q || [c.numero, imovelNome, inquilinoNome].some((v) => semAcento(v || '').includes(q))
      return ms && (fGarantia === 'all' || c.tipo_garantia === fGarantia)
    })
  }, [contratos, search, fGarantia])

  const contagem = useMemo(() => {
    const total: Record<FiltroSituacao, number> = {
      todos: buscados.length,
      vigentes: 0,
      vencendo: 0,
      encerrados: 0,
    }
    for (const c of buscados) total[situacaoDoContrato(c).grupo]++
    return total
  }, [buscados])

  const filtered = useMemo(
    () =>
      situacao === 'todos'
        ? buscados
        : buscados.filter((c) => situacaoDoContrato(c).grupo === situacao),
    [buscados, situacao],
  )

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
      toast.success('Contrato encerrado com sucesso.')
      load()
    } catch {
      toast.error('Não foi possível encerrar o contrato. Tente novamente.')
    }
  }
  const handleCancelar = async (c: any) => {
    try {
      await updateContrato(c.id, { status: 'cancelado' })
      toast.success('Contrato cancelado com sucesso.')
      load()
    } catch {
      toast.error('Não foi possível cancelar o contrato. Tente novamente.')
    }
  }

  const unidadeDe = (c: any) => {
    const imovel = c.expand?.imovel?.nome || c.expand?.imovel?.endereco || ''
    const unidade = c.expand?.unidade_id?.identificador
    return [unidade, imovel].filter(Boolean).join(' · ') || '—'
  }

  const acoesDeEdicao = (c: any, compacto: boolean) =>
    canEdit && (
      <>
        <Button
          variant="ghost"
          size={compacto ? 'icon' : 'sm'}
          aria-label={`Editar contrato ${c.numero ?? ''}`.trim()}
          title="Editar"
          onClick={() => handleEdit(c)}
        >
          <Pencil aria-hidden="true" />
          {!compacto && 'Editar'}
        </Button>
        {c.status === 'ativo' && (
          <>
            <ConfirmarAcao
              titulo="Encerrar este contrato?"
              descricao="O contrato passa para encerrado e para de gerar cobranças e alertas de vencimento. O histórico de receitas já lançadas permanece."
              rotuloConfirmar="Sim, encerrar o contrato"
              onConfirmar={() => handleEncerrar(c)}
            >
              <Button
                variant="ghost"
                size={compacto ? 'icon' : 'sm'}
                aria-label={`Encerrar contrato ${c.numero ?? ''}`.trim()}
                title="Encerrar contrato"
              >
                <Check aria-hidden="true" />
                {!compacto && 'Encerrar'}
              </Button>
            </ConfirmarAcao>
            <ConfirmarAcao
              titulo="Cancelar este contrato?"
              descricao="O contrato passa para cancelado e sai dos alertas e das cobranças futuras. O histórico já lançado permanece."
              rotuloConfirmar="Sim, cancelar o contrato"
              onConfirmar={() => handleCancelar(c)}
            >
              <Button
                variant="ghost"
                size={compacto ? 'icon' : 'sm'}
                className="text-red-800 hover:bg-destructive/10"
                aria-label={`Cancelar contrato ${c.numero ?? ''}`.trim()}
                title="Cancelar contrato"
              >
                <Ban aria-hidden="true" />
                {!compacto && 'Cancelar'}
              </Button>
            </ConfirmarAcao>
          </>
        )}
      </>
    )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[min(100%,280px)] flex-1 flex-col gap-1 px-2 lg:px-0">
          <p className="text-sm text-accent-foreground">Cadastros</p>
          <h1 className="text-3xl lg:text-5xl">Contratos</h1>
        </div>
        {canEdit && (
          <Button onClick={handleNew} className="w-full sm:w-auto">
            <Plus aria-hidden="true" /> Novo contrato
          </Button>
        )}
      </header>

      <FiltroChips
        rotulo="Situação do contrato"
        opcoes={FILTROS_DE_SITUACAO.map((f) => ({ ...f, contagem: contagem[f.valor] }))}
        valor={situacao}
        onChange={escolherSituacao}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.6fr)_1fr]">
        <div className="relative">
          <Search
            className="absolute left-5 top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Buscar por número, imóvel ou inquilino"
            placeholder="Buscar por número, imóvel ou inquilino"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-14 pl-14"
          />
        </div>
        <Select value={fGarantia} onValueChange={setFGarantia}>
          <SelectTrigger aria-label="Garantia" className="min-h-14">
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
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
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
          <IconeTile icone={FileText} blob={3} />
          <p className="text-base text-accent-foreground">Nenhum contrato encontrado.</p>
        </Card>
      ) : (
        <>
          <p className="px-2 text-sm text-accent-foreground lg:px-0" role="status">
            {filtered.length} {filtered.length === 1 ? 'contrato' : 'contratos'}
          </p>

          {/* Computador largo: tabela num cartão. */}
          <Card className="hidden overflow-hidden min-[1500px]:block">
            <Table className="[&_td]:py-[18px] [&_th]:px-5 [&_td]:px-5">
              <TableHeader>
                <TableRow>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Aluguel</TableHead>
                  <TableHead>Vigência até</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className={cn('text-right', COLUNA_ACOES_CABECALHO)}>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const sit = situacaoDoContrato(c)
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => handleView(c)}>
                      <TableCell>
                        <strong className="block">{c.expand?.inquilino?.nome || '—'}</strong>
                        <span className="numero text-sm text-accent-foreground">
                          {c.numero || 'Sem número'}
                        </span>
                      </TableCell>
                      <TableCell>{unidadeDe(c)}</TableCell>
                      <TableCell>
                        <strong className="numero">{formatCurrency(c.valor_aluguel)}</strong>
                      </TableCell>
                      <TableCell className="numero">{formatDate(c.data_fim)}</TableCell>
                      <TableCell>
                        <Badge variant={sit.tom}>{sit.rotulo}</Badge>
                      </TableCell>
                      <TableCell
                        className={cn('text-right', COLUNA_ACOES_CELULA)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Gerar minuta do contrato ${c.numero ?? ''}`.trim()}
                            onClick={() => handleMinuta(c)}
                          >
                            <FileDown aria-hidden="true" /> Minuta
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Ver detalhes do contrato ${c.numero ?? ''}`.trim()}
                            title="Ver detalhes"
                            onClick={() => handleView(c)}
                          >
                            <Eye aria-hidden="true" />
                          </Button>
                          {acoesDeEdicao(c, true)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Celular, tablet e computador estreito: um cartão por contrato. */}
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-3 min-[1500px]:hidden md:gap-4">
            {filtered.map((c, indice) => {
              const sit = situacaoDoContrato(c)
              return (
                <li key={c.id}>
                  <Card canto={cantoOrganico(indice)} className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-center gap-2">
                      <span className="numero flex-1 text-sm font-bold text-accent-foreground">
                        {c.numero || 'Sem número'}
                      </span>
                      <Badge variant={sit.tom}>{sit.rotulo}</Badge>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleView(c)}
                        className="self-start text-left font-serif text-xl font-bold leading-tight underline-offset-4 hover:underline"
                      >
                        {c.expand?.inquilino?.nome || 'Inquilino não informado'}
                      </button>
                      <span className="text-sm text-accent-foreground">{unidadeDe(c)}</span>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 rounded-[18px] bg-sunken px-3.5 py-3">
                      <div className="flex flex-col">
                        <dt className="text-xs text-accent-foreground">Aluguel</dt>
                        <dd className="numero text-base font-bold">
                          {formatCurrency(c.valor_aluguel)}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-xs text-accent-foreground">Vigência até</dt>
                        <dd className="numero text-base font-bold">{formatDate(c.data_fim)}</dd>
                      </div>
                    </dl>
                    <Button
                      variant="outline"
                      className="mt-auto w-full"
                      aria-label={`Minuta em PDF do contrato ${c.numero ?? ''}`.trim()}
                      onClick={() => handleMinuta(c)}
                    >
                      <FileDown aria-hidden="true" /> Minuta em PDF
                    </Button>
                    {canEdit && (
                      <div className="flex flex-wrap gap-1">{acoesDeEdicao(c, false)}</div>
                    )}
                  </Card>
                </li>
              )
            })}
          </ul>
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
        onVerMinuta={() => handleMinuta(selected)}
        canEdit={canEdit}
      />
      <MinutaContratoDialog
        contrato={minutaContrato}
        open={minutaOpen}
        onOpenChange={setMinutaOpen}
      />
    </div>
  )
}
