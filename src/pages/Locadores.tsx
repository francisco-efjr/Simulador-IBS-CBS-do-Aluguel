import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { semAcento, termoDeBusca } from '@/lib/busca'
import {
  AlertCircle,
  Ban,
  Building2,
  ChevronDown,
  Pencil,
  Plus,
  Search,
  SearchX,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { getLocadores, inactivateLocador, type Locador } from '@/services/locadores'
import { getContratos } from '@/services/contratos'
import { useRealtime } from '@/hooks/use-realtime'
import { formatarCpfCnpj, formatarTelefone } from '@/lib/format'
import {
  resumoDoLocador,
  resumoPorLocador,
  totalDeFiadores,
  type FiadorDoLocador,
} from '@/lib/fiadores-do-locador'
import { LocadorFormDialog } from '@/components/locadores/LocadorFormDialog'
import { FiadorFormDialog } from '@/components/fiadores/FiadorFormDialog'
import { EstadoVazio, IconeTile } from '@/components/organico'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmarAcao } from '@/components/shared/ConfirmarAcao'
import { Input } from '@/components/ui/input'
import { Card, cantoOrganico } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
const rotuloDoDocumento = (loc: Locador) => (loc.tipo_pessoa === 'pj' ? 'CNPJ' : 'CPF')

export default function Locadores() {
  const { canEditModule } = useAuth()
  const canEdit = canEditModule('locadores')
  // O fiador é cadastrado e guardado junto com o contrato: a permissão é a de contratos.
  const podeAdicionarFiador = canEditModule('contratos')

  const [locadores, setLocadores] = useState<Locador[]>([])
  const [contratos, setContratos] = useState<any[]>([])
  // Sem permissão de contratos, a lista segue sem imóveis e fiadores.
  const [contratosDisponiveis, setContratosDisponiveis] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Locador | null>(null)
  const [fiadorOpen, setFiadorOpen] = useState(false)

  // Locadores abertos ficam na URL (?abertos=id1,id2): o "voltar" do navegador
  // devolve a lista como estava.
  const [searchParams, setSearchParams] = useSearchParams()
  const abertos = useMemo(
    () => new Set((searchParams.get('abertos') || '').split(',').filter(Boolean)),
    [searchParams],
  )
  const alternar = (id: string) => {
    const proximo = new Set(abertos)
    if (proximo.has(id)) proximo.delete(id)
    else proximo.add(id)
    setSearchParams(
      (atual) => {
        const params = new URLSearchParams(atual)
        if (proximo.size) params.set('abertos', [...proximo].join(','))
        else params.delete('abertos')
        return params
      },
      { preventScrollReset: true },
    )
  }

  const load = useCallback(async () => {
    try {
      setError(null)
      const [data, contratosData] = await Promise.all([
        getLocadores(),
        getContratos().then(
          (lista) => ({ lista, ok: true }),
          () => ({ lista: [], ok: false }),
        ),
      ])
      setLocadores(data)
      setContratos(contratosData.lista)
      setContratosDisponiveis(contratosData.ok)
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
  useRealtime('contratos', () => {
    load()
  })
  useRealtime('fiadores', () => {
    load()
  })

  const resumos = useMemo(() => resumoPorLocador(contratos), [contratos])

  const filtered = useMemo(() => {
    const q = termoDeBusca(search)
    if (!q) return locadores
    return locadores.filter((loc) =>
      [loc.nome_razao_social, loc.cpf_cnpj, loc.email, loc.telefone, loc.dados_bancarios].some(
        (v) => semAcento(v || '').includes(q),
      ),
    )
  }, [locadores, search])

  const nFiadores = useMemo(
    () => totalDeFiadores(resumos, locadores.map((l) => l.id)),
    [resumos, locadores],
  )

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

  const buscando = termoDeBusca(search) !== ''
  const resumo = contratosDisponiveis
    ? `${plural(locadores.length, 'locador', 'locadores')} · ${plural(nFiadores, 'fiador', 'fiadores')}`
    : plural(locadores.length, 'locador', 'locadores')

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[min(100%,280px)] flex-1 flex-col gap-1 px-2 lg:px-0">
          <p className="text-sm text-accent-foreground">Cadastros</p>
          <h1 className="text-3xl lg:text-5xl">Locadores e fiadores</h1>
          {!loading && !error && locadores.length > 0 && (
            <p className="text-base text-accent-foreground">{resumo}</p>
          )}
        </div>
        {locadores.length > 0 && (
          <div className="relative order-last w-full min-[1500px]:order-none min-[1500px]:w-[340px]">
            <Search
              className="absolute left-5 top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Buscar por nome, CPF ou CNPJ"
              placeholder="Buscar por nome, CPF ou CNPJ"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-14 pl-14"
            />
          </div>
        )}
        {canEdit && (
          <Button onClick={handleNew} className="w-full sm:w-auto">
            <Plus aria-hidden="true" /> Novo locador
          </Button>
        )}
      </header>

      {loading ? (
        <CarregandoLocadores />
      ) : error ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-3xl bg-destructive/15 px-5 py-4 text-red-800"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-base font-bold">{error}</p>
        </div>
      ) : locadores.length === 0 ? (
        <Card className="overflow-hidden">
          <EstadoVazio
            icone={UserRound}
            titulo="Ainda não há locadores"
            descricao="Cadastre o primeiro locador, o dono do imóvel, para ligar aos contratos e aos fiadores."
            acoes={
              canEdit ? (
                <Button onClick={handleNew}>
                  <Plus aria-hidden="true" /> Cadastrar locador
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : filtered.length === 0 ? (
        <>
          <p role="status" className="px-2 text-base text-accent-foreground lg:px-0">
            Nenhum resultado para “{search.trim()}”.
          </p>
          <Card className="overflow-hidden">
            <EstadoVazio
              icone={SearchX}
              titulo="Nenhum locador com esse nome"
              descricao="Confira a escrita ou busque pelo CPF ou CNPJ."
              acoes={
                <>
                  <Button variant="outline" onClick={() => setSearch('')}>
                    <X aria-hidden="true" /> Limpar busca
                  </Button>
                  {canEdit && (
                    <Button onClick={handleNew} className="hidden sm:inline-flex">
                      <Plus aria-hidden="true" /> Cadastrar locador
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
            {plural(filtered.length, 'locador', 'locadores')}
            {buscando ? ' na busca' : ''}
          </p>
          <div className="[container-type:inline-size]">
          <ul className="flex flex-col gap-4">
            {filtered.map((loc, indice) => {
              const aberto = abertos.has(loc.id)
              const idConteudo = `fiadores-${loc.id}`
              const { imoveis, fiadores } = resumoDoLocador(resumos, loc.id)
              const fiadoresTxt = plural(fiadores.length, 'fiador', 'fiadores')
              const imoveisTxt = plural(imoveis, 'imóvel', 'imóveis')
              const documento = loc.cpf_cnpj
                ? `${rotuloDoDocumento(loc)} ${formatarCpfCnpj(loc.cpf_cnpj)}`
                : 'Sem documento'
              return (
                <li key={loc.id}>
                  <Card canto={cantoOrganico(indice)} className="group overflow-hidden">
                    <button
                      type="button"
                      onClick={() => alternar(loc.id)}
                      aria-expanded={aberto}
                      aria-controls={idConteudo}
                      className={cn(
                        'flex w-full items-center gap-3.5 p-[18px] text-left',
                        contratosDisponiveis
                          ? '[@container(min-width:50em)]:grid [@container(min-width:50em)]:grid-cols-[56px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_40px]'
                          : '[@container(min-width:50em)]:grid [@container(min-width:50em)]:grid-cols-[56px_minmax(0,1fr)_40px]',
                        '[@container(min-width:50em)]:gap-5 [@container(min-width:50em)]:px-6',
                      )}
                    >
                      <IconeTile
                        icone={loc.tipo_pessoa === 'pj' ? Building2 : UserRound}
                        blob={(indice % 2 ? 2 : 1) as 1 | 2}
                        tamanho="sm"
                        className="group-hover:bg-primary group-hover:text-primary-foreground [@container(min-width:50em)]:h-14 [@container(min-width:50em)]:w-14"
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="font-serif text-lg font-bold leading-tight [@container(min-width:50em)]:text-[1.3125rem]">
                            {loc.nome_razao_social}
                          </strong>
                          {loc.status === 'inativo' && (
                            <span className={badgeVariants({ variant: 'neutral' })}>Inativo</span>
                          )}
                        </span>
                        {contratosDisponiveis && (
                          <span className="text-sm text-accent-foreground [@container(min-width:50em)]:hidden">
                            {imoveisTxt} · {fiadoresTxt}
                          </span>
                        )}
                        <span className="numero hidden text-base text-accent-foreground [@container(min-width:50em)]:block">
                          {documento}
                        </span>
                      </span>
                      {contratosDisponiveis && (
                        <>
                          <span className="hidden flex-col [@container(min-width:50em)]:flex">
                            <span className="text-sm text-accent-foreground">Imóveis</span>
                            <strong className="whitespace-nowrap text-lg">{imoveisTxt}</strong>
                          </span>
                          <span className="hidden flex-col [@container(min-width:50em)]:flex">
                            <span className="text-sm text-accent-foreground">Fiadores</span>
                            <strong className="whitespace-nowrap text-lg">{fiadoresTxt}</strong>
                          </span>
                        </>
                      )}
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          'h-6 w-6 shrink-0 text-primary transition-transform duration-400 ease-organic [@container(min-width:50em)]:h-[26px] [@container(min-width:50em)]:w-[26px]',
                          aberto && 'rotate-180',
                        )}
                      />
                    </button>

                    {aberto && (
                      <div
                        id={idConteudo}
                        className="flex flex-col gap-3 px-3.5 pb-4 [@container(min-width:50em)]:pb-5 [@container(min-width:50em)]:pl-[100px] [@container(min-width:50em)]:pr-6"
                      >
                        <p className="numero px-1 text-base text-accent-foreground [@container(min-width:50em)]:hidden">
                          {documento}
                        </p>
                        {(loc.email || loc.telefone || loc.dados_bancarios) && (
                          <dl className="grid gap-x-6 gap-y-2 px-1 text-base sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                            {loc.email && (
                              <div>
                                <dt className="text-sm text-accent-foreground">E-mail</dt>
                                <dd className="break-words font-bold">{loc.email}</dd>
                              </div>
                            )}
                            {loc.telefone && (
                              <div>
                                <dt className="text-sm text-accent-foreground">Telefone</dt>
                                <dd className="numero font-bold">
                                  {formatarTelefone(loc.telefone)}
                                </dd>
                              </div>
                            )}
                            {loc.dados_bancarios && (
                              <div>
                                <dt className="text-sm text-accent-foreground">Dados bancários</dt>
                                <dd className="break-words font-bold">{loc.dados_bancarios}</dd>
                              </div>
                            )}
                          </dl>
                        )}
                        {canEdit && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(loc)}>
                              <Pencil aria-hidden="true" /> Editar
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
                                  size="sm"
                                  className="text-red-800 hover:bg-destructive/10"
                                  aria-label={`Inativar ${loc.nome_razao_social}`}
                                >
                                  <Ban aria-hidden="true" /> Inativar
                                </Button>
                              </ConfirmarAcao>
                            )}
                          </div>
                        )}

                        {contratosDisponiveis && (
                          <>
                            <h2 className="px-1 pt-1.5 font-sans text-sm font-extrabold uppercase tracking-[.08em] text-muted-foreground">
                              Fiadores
                            </h2>
                            {fiadores.length === 0 ? (
                              <p className="px-1 text-base text-accent-foreground">
                                Nenhum fiador nos contratos ativos deste locador.
                              </p>
                            ) : (
                              <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3">
                                {fiadores.map((f) => (
                                  <CartaoDoFiador key={f.chave} fiador={f} />
                                ))}
                              </ul>
                            )}
                            {podeAdicionarFiador && (
                              <Button
                                variant="ghost"
                                className="-ml-3 self-start"
                                onClick={() => setFiadorOpen(true)}
                              >
                                <UserPlus aria-hidden="true" /> Adicionar fiador
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </Card>
                </li>
              )
            })}
          </ul>
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
      <FiadorFormDialog
        open={fiadorOpen}
        onOpenChange={setFiadorOpen}
        onSaved={(novo) => {
          if (novo)
            toast.info('O fiador aparece neste locador quando for escolhido em um contrato dele.')
        }}
      />
    </div>
  )
}

function CartaoDoFiador({ fiador }: { fiador: FiadorDoLocador }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-[20px_28px_20px_20px] bg-sunken px-4 py-3.5">
      <div className="flex items-center gap-2">
        <strong className="flex-1 text-[1.0625rem]">{fiador.nome}</strong>
        <Badge variant="neutral">Fiador</Badge>
      </div>
      {fiador.cpf && (
        <span className="numero text-sm text-accent-foreground">
          CPF {formatarCpfCnpj(fiador.cpf)}
        </span>
      )}
      <span className="text-sm text-accent-foreground">{fiador.vinculo}</span>
      {fiador.codigo && <span className="numero text-sm font-bold">{fiador.codigo}</span>}
    </li>
  )
}

/**
 * Carregando (seção 15): cartões fechados de locador no formato final. Para
 * leitor de tela, só o texto "Carregando locadores…".
 */
function CarregandoLocadores() {
  return (
    <div aria-busy="true" className="[container-type:inline-size]">
      <span role="status" className="sr-only">
        Carregando locadores…
      </span>
      <ul aria-hidden="true" className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Card canto={cantoOrganico(i)} className="flex items-center gap-3.5 p-[18px] [@container(min-width:50em)]:px-6">
              <Skeleton className="blob-1 h-12 w-12 shrink-0 rounded-none [@container(min-width:50em)]:h-14 [@container(min-width:50em)]:w-14" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-4 w-2/5" />
              </div>
              <Skeleton className="hidden h-8 w-32 [@container(min-width:50em)]:block" />
              <Skeleton className="hidden h-8 w-32 [@container(min-width:50em)]:block" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
