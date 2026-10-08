import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { semAcento, termoDeBusca } from '@/lib/busca'
import { AlertCircle, Phone, Plus, Search, SearchX, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { getInquilinos, updateInquilino } from '@/services/inquilinos'
import { getContratos } from '@/services/contratos'
import { useRealtime } from '@/hooks/use-realtime'
import { formatarCpfCnpj, formatarTelefone } from '@/lib/format'
import {
  contratosPorInquilino,
  ehFiltroContratoDoInquilino,
  FILTROS_DE_CONTRATO_DO_INQUILINO,
  situacaoDoInquilino,
  type FiltroContratoDoInquilino,
  type SituacaoDoInquilino,
} from '@/lib/contrato-do-inquilino'
import { InquilinoFormDialog } from '@/components/inquilinos/InquilinoFormDialog'
import { InquilinoDetailDialog } from '@/components/inquilinos/InquilinoDetailDialog'
import { EstadoVazio, FiltroChips } from '@/components/organico'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, cantoOrganico } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

/** Depois de tantos inquilinos a lista pede "Mostrar mais" (desenho, seção 12). */
const LIMITE_INICIAL = 5

/**
 * "Se não cabe, vira cartão": a tabela só entra quando a área da lista tem esta
 * largura (em `em`, então cresce junto com o tamanho da letra escolhido). Abaixo
 * disso a lista é de cartões, com o botão de ligar.
 */
const MOSTRA_NA_TABELA = '[@container(min-width:52em)]:block'
const ESCONDE_NA_TABELA = '[@container(min-width:52em)]:hidden'

const SEM_SITUACAO: SituacaoDoInquilino = {
  temContrato: false,
  rotulo: '—',
  tom: 'neutral',
  unidade: '—',
}

const documentoDe = (iq: any) => (iq.tipo_pessoa === 'pj' ? iq.cnpj : iq.cpf)
const rotuloDoDocumento = (iq: any) => (iq.tipo_pessoa === 'pj' ? 'CNPJ' : 'CPF')
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

interface Linha {
  iq: any
  situacao: SituacaoDoInquilino
}

export default function Inquilinos() {
  const { canEditModule, canViewModule } = useAuth()
  // Sem permissão de contratos o banco devolve lista vazia (RLS), não erro: nem busca.
  const veContratos = canViewModule('contratos')
  const canEdit = canEditModule('inquilinos')
  const [inquilinos, setInquilinos] = useState<any[]>([])
  const [contratos, setContratos] = useState<any[]>([])
  // Sem permissão de contratos, a lista segue sem a unidade e sem a pílula.
  const [contratosDisponiveis, setContratosDisponiveis] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [selected, setSelected] = useState<any | null>(null)

  // Filtro de contrato na URL (?contrato=com): o "voltar" e o link compartilhado mantêm.
  const [searchParams, setSearchParams] = useSearchParams()
  const contratoNaUrl = searchParams.get('contrato')
  const filtro: FiltroContratoDoInquilino = ehFiltroContratoDoInquilino(contratoNaUrl)
    ? contratoNaUrl
    : 'todos'
  const escolherFiltro = (valor: FiltroContratoDoInquilino) => {
    setMostrarTodos(false)
    setSearchParams(
      (atual) => {
        const params = new URLSearchParams(atual)
        if (valor === 'todos') params.delete('contrato')
        else params.set('contrato', valor)
        return params
      },
      { preventScrollReset: true },
    )
  }

  const load = useCallback(async () => {
    try {
      setError(null)
      const [data, contratosData] = await Promise.all([
        getInquilinos(),
        veContratos
          ? getContratos().then(
              (lista) => ({ lista, ok: true }),
              () => ({ lista: [], ok: false }),
            )
          : Promise.resolve({ lista: [], ok: false }),
      ])
      setInquilinos(data)
      setContratos(contratosData.lista)
      setContratosDisponiveis(contratosData.ok)
      setSelected((prev) => (prev ? (data.find((iq) => iq.id === prev.id) ?? null) : null))
    } catch {
      setError('Erro ao carregar inquilinos. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [veContratos])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('inquilinos', () => {
    load()
  })
  useRealtime('contratos', () => {
    load()
  })

  // Busca primeiro; os chips mostram quantos sobram em cada grupo.
  const buscados = useMemo<Linha[]>(() => {
    const porInquilino = contratosPorInquilino(contratos)
    const q = termoDeBusca(search)
    return inquilinos
      .filter((iq) =>
        !q ? true : [iq.nome, iq.cpf, iq.cnpj].some((v) => semAcento(v || '').includes(q)),
      )
      .map((iq) => ({
        iq,
        situacao: contratosDisponiveis
          ? situacaoDoInquilino(porInquilino.get(iq.id) ?? [])
          : SEM_SITUACAO,
      }))
  }, [inquilinos, contratos, contratosDisponiveis, search])

  const contagem = useMemo(() => {
    const com = buscados.filter((l) => l.situacao.temContrato).length
    return { todos: buscados.length, com, sem: buscados.length - com }
  }, [buscados])

  const totais = useMemo(() => {
    const todosOsContratos = contratosPorInquilino(contratos)
    const com = inquilinos.filter(
      (iq) => situacaoDoInquilino(todosOsContratos.get(iq.id) ?? []).temContrato,
    )
    return { todos: inquilinos.length, com: com.length }
  }, [inquilinos, contratos])

  const filtradas = useMemo(
    () =>
      !contratosDisponiveis || filtro === 'todos'
        ? buscados
        : buscados.filter((l) => l.situacao.temContrato === (filtro === 'com')),
    [buscados, filtro, contratosDisponiveis],
  )
  const visiveis = mostrarTodos ? filtradas : filtradas.slice(0, LIMITE_INICIAL)
  const restantes = filtradas.length - LIMITE_INICIAL

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
      setDetailOpen(false)
      load()
    } catch {
      toast.error('Não foi possível inativar o inquilino. Tente novamente.')
    }
  }

  const buscando = termoDeBusca(search) !== ''
  const resumo = contratosDisponiveis
    ? `${plural(totais.todos, 'inquilino', 'inquilinos')} · ${totais.com} com contrato`
    : plural(totais.todos, 'inquilino', 'inquilinos')

  const botaoNovo = canEdit && (
    <Button onClick={handleNew} className="w-full sm:w-auto">
      <Plus aria-hidden="true" /> Novo inquilino
    </Button>
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[min(100%,280px)] flex-1 flex-col gap-1 px-2 lg:px-0">
          <p className="text-sm text-accent-foreground">Cadastros</p>
          <h1 className="text-3xl lg:text-5xl">Inquilinos</h1>
          {!loading && !error && inquilinos.length > 0 && (
            <p className="text-base text-accent-foreground">{resumo}</p>
          )}
        </div>
        {inquilinos.length > 0 && (
          <div className="relative order-last w-full xl:order-none xl:w-[340px]">
            <Search
              className="absolute left-5 top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Buscar por nome, CPF ou CNPJ"
              placeholder="Buscar por nome, CPF ou CNPJ"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setMostrarTodos(false)
              }}
              className="min-h-14 pl-14"
            />
          </div>
        )}
        {botaoNovo}
      </header>

      {!loading && !error && inquilinos.length > 0 && contratosDisponiveis && (
        <FiltroChips
          rotulo="Contrato do inquilino"
          opcoes={FILTROS_DE_CONTRATO_DO_INQUILINO.map((f) => ({
            ...f,
            contagem: contagem[f.valor],
          }))}
          valor={filtro}
          onChange={escolherFiltro}
        />
      )}

      {loading ? (
        <CarregandoInquilinos />
      ) : error ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-3xl bg-destructive/15 px-5 py-4 text-red-800"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-base font-bold">{error}</p>
        </div>
      ) : inquilinos.length === 0 ? (
        <Card className="overflow-hidden">
          <EstadoVazio
            icone={Users}
            titulo="Ainda não há inquilinos"
            descricao="Cadastre o primeiro inquilino para ligar a um contrato e acompanhar os recebimentos."
            acoes={
              canEdit ? (
                <Button onClick={handleNew}>
                  <Plus aria-hidden="true" /> Cadastrar inquilino
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : filtradas.length === 0 ? (
        <>
          <p role="status" className="px-2 text-base text-accent-foreground lg:px-0">
            {buscando
              ? `Nenhum resultado para “${search.trim()}”.`
              : filtro === 'com'
                ? 'Nenhum inquilino com contrato.'
                : 'Nenhum inquilino sem contrato.'}
          </p>
          <Card className="overflow-hidden">
            <EstadoVazio
              icone={SearchX}
              titulo={buscando ? 'Nenhum inquilino com esse nome' : 'Nenhum inquilino neste grupo'}
              descricao={
                buscando
                  ? 'Confira a escrita ou busque pelo CPF ou CNPJ.'
                  : 'Troque o filtro para ver os outros inquilinos.'
              }
              acoes={
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('')
                      if (filtro !== 'todos') escolherFiltro('todos')
                    }}
                  >
                    <X aria-hidden="true" /> {buscando ? 'Limpar busca' : 'Ver todos'}
                  </Button>
                  {canEdit && (
                    <Button onClick={handleNew} className="hidden sm:inline-flex">
                      <Plus aria-hidden="true" /> Cadastrar inquilino
                    </Button>
                  )}
                </>
              }
            />
          </Card>
        </>
      ) : (
        <>
          <p className="sr-only" role="status">
            {plural(filtradas.length, 'inquilino', 'inquilinos')}
            {filtro !== 'todos' || buscando ? ' na lista' : ''}
          </p>

          <div className="[container-type:inline-size]">
            {/* Computador: tabela num cartão. */}
            <Card className={cn('hidden overflow-hidden', MOSTRA_NA_TABELA)}>
              <Table className="[&_td]:px-4 [&_td]:py-4 [&_th]:px-4 [&_td:not(:nth-child(3))]:whitespace-nowrap">
                <TableHeader>
                  <TableRow>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map(({ iq, situacao }) => (
                    <TableRow key={iq.id} className="cursor-pointer" onClick={() => handleView(iq)}>
                      <TableCell>
                        <strong className="block">{iq.nome || '—'}</strong>
                        <span className="numero text-sm text-accent-foreground">
                          {rotuloDoDocumento(iq)} {formatarCpfCnpj(documentoDe(iq))}
                        </span>
                        {iq.status === 'inativo' && (
                          <Badge variant="neutral" className="ml-2">
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="numero">{formatarTelefone(iq.telefone)}</TableCell>
                      <TableCell>{situacao.unidade}</TableCell>
                      <TableCell>
                        {contratosDisponiveis ? (
                          <Badge variant={situacao.tom}>{situacao.rotulo}</Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          aria-label={`Ver ficha de ${iq.nome}`}
                          onClick={() => handleView(iq)}
                        >
                          Ver ficha
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Celular, tablet e computador estreito: um cartão por inquilino. */}
            <ul
              className={cn(
                'grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-3 md:gap-4',
                ESCONDE_NA_TABELA,
              )}
            >
              {visiveis.map(({ iq, situacao }, indice) => (
                <li key={iq.id}>
                  <Card canto={cantoOrganico(indice)} className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start gap-2.5">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <strong className="font-serif text-xl font-bold leading-tight">
                          {iq.nome || '—'}
                        </strong>
                        <span className="numero text-sm text-accent-foreground">
                          {rotuloDoDocumento(iq)} {formatarCpfCnpj(documentoDe(iq))}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {contratosDisponiveis && (
                          <Badge variant={situacao.tom}>{situacao.rotulo}</Badge>
                        )}
                        {iq.status === 'inativo' && <Badge variant="neutral">Inativo</Badge>}
                      </div>
                    </div>
                    <dl className="flex flex-col gap-2 rounded-[18px] bg-sunken px-3.5 py-3">
                      <div className="flex flex-col">
                        <dt className="text-sm text-accent-foreground">Unidade</dt>
                        <dd className="text-base font-bold">{situacao.unidade}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-sm text-accent-foreground">Telefone</dt>
                        <dd className="numero text-base font-bold">
                          {formatarTelefone(iq.telefone)}
                        </dd>
                      </div>
                    </dl>
                    <div
                      className={cn(
                        'mt-auto grid gap-2',
                        iq.telefone ? 'grid-cols-2' : 'grid-cols-1',
                      )}
                    >
                      {iq.telefone && (
                        <a
                          href={`tel:${String(iq.telefone).replace(/[^\d+]/g, '')}`}
                          aria-label={`Ligar para ${iq.nome}`}
                          className={buttonVariants({ variant: 'outline' })}
                        >
                          <Phone aria-hidden="true" /> Ligar
                        </a>
                      )}
                      <Button aria-label={`Ver ficha de ${iq.nome}`} onClick={() => handleView(iq)}>
                        Ver ficha
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </div>

          {restantes > 0 && (
            <Button
              variant="secondary"
              className="self-center border-[1.5px] border-border bg-transparent hover:bg-primary/10"
              aria-expanded={mostrarTodos}
              onClick={() => setMostrarTodos((v) => !v)}
            >
              {mostrarTodos ? 'Mostrar menos' : `Mostrar mais ${restantes}`}
            </Button>
          )}
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
        onInativar={() => handleInactivate(selected)}
        canEdit={canEdit}
      />
    </div>
  )
}

/**
 * Carregando (seção 15): blocos com pulso no formato do que vai aparecer —
 * cartões no celular, linhas da tabela no computador. Para leitor de tela, só o
 * texto "Carregando inquilinos…".
 */
function CarregandoInquilinos() {
  return (
    <div aria-busy="true" className="[container-type:inline-size]">
      <span role="status" className="sr-only">
        Carregando inquilinos…
      </span>
      <div aria-hidden="true" className={cn('flex flex-col gap-3', ESCONDE_NA_TABELA)}>
        {[0, 1, 2].map((i) => (
          <Card key={i} canto={cantoOrganico(i)} className="flex flex-col gap-3 p-5">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-6 w-[55%]" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-[45%]" />
            <Skeleton className="h-[88px] w-full rounded-[18px]" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-12 rounded-full" />
              <Skeleton className="h-12 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
      <Card aria-hidden="true" className={cn('hidden overflow-hidden', MOSTRA_NA_TABELA)}>
        <div className="grid grid-cols-[1.7fr_1fr_1.6fr_1fr_130px] gap-4 bg-muted/60 px-7 py-[18px]">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-3/5 rounded-lg" />
          ))}
          <span />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[1.7fr_1fr_1.6fr_1fr_130px] items-center gap-4 border-t border-border/60 px-7 py-5"
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-[18px] w-4/5" />
              <Skeleton className="h-3.5 w-[45%]" />
            </div>
            <Skeleton className="h-[18px] w-3/4" />
            <Skeleton className="h-[18px] w-3/5" />
            <Skeleton className="h-7 w-[110px] rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        ))}
      </Card>
    </div>
  )
}
