import { Check, ChevronDown, CircleDashed, Hammer } from 'lucide-react'
import {
  entregaDoMomento,
  formatarDataPorExtenso,
  resumoDasFrentes,
  type EntradaFeed,
  type ProgressoDasEntregas,
  type Situacao,
  type SituacaoDaEtapa,
  type TipoAtualizacao,
} from '@/data/andamento'
import { Badge, badgeVariants, type BadgeProps } from '@/components/ui/badge'
import { Card, cantoOrganico } from '@/components/ui/card'
import { CartaoDestaque } from '@/components/organico'
import { cn } from '@/lib/utils'

/**
 * Corpo da página pública de andamento (seção 10 do handoff Fase 2): cartão de
 * progresso, lista de etapas e "Novidades" em cartões. O conteúdo é o real —
 * `andamento.json` e `feed.json` —, nada vem do protótipo.
 */

type Tom = NonNullable<BadgeProps['variant']>

const ETAPA: Record<
  SituacaoDaEtapa,
  { rotulo: string; tom: Tom; icone: typeof Check; icone_cor: string; linha: string }
> = {
  pronta: {
    rotulo: 'Pronto',
    tom: 'ok',
    icone: Check,
    icone_cor: 'bg-primary text-primary-foreground',
    linha: '',
  },
  andamento: {
    rotulo: 'Em andamento',
    tom: 'warn',
    icone: Hammer,
    icone_cor: 'bg-secondary/25 text-warning-ink',
    linha: 'bg-secondary/10',
  },
  'a-seguir': {
    rotulo: 'A seguir',
    tom: 'neutral',
    icone: CircleDashed,
    icone_cor: 'bg-muted text-muted-foreground',
    linha: '',
  },
}

const ENTREGA: Record<Situacao, { rotulo: string; tom: Tom }> = {
  pronto: { rotulo: 'Pronto', tom: 'ok' },
  andamento: { rotulo: 'Em andamento', tom: 'warn' },
  pendente: { rotulo: 'Pendente', tom: 'neutral' },
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

/** "Entregas prontas 23 de 30", a barra e o que está sendo feito agora. */
export function CartaoDeProgresso({ progresso }: { progresso: ProgressoDasEntregas }) {
  const { total, contagem, percentualPronto } = progresso
  const momento = entregaDoMomento()

  return (
    <CartaoDestaque>
      <p className="text-base font-bold sm:text-[1.0625rem]">Entregas prontas</p>
      <p className="numero my-1.5 font-serif text-[clamp(2rem,13cqw,3.5rem)] font-bold leading-[1.1]">
        {contagem.pronto} de {total}
      </p>
      <div
        role="progressbar"
        aria-label="Entregas prontas"
        aria-valuenow={percentualPronto}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-3 overflow-hidden rounded-full bg-primary-foreground/25"
      >
        <span
          className="block h-full rounded-full bg-primary-foreground"
          style={{ width: `${percentualPronto}%` }}
        />
      </div>
      {momento && (
        <p className="mt-3 text-base">
          {momento.tipo === 'agora' ? 'Agora' : 'A seguir'}: {momento.titulo}
        </p>
      )}
      <p className="mt-1 text-sm">
        {plural(contagem.andamento, 'em andamento', 'em andamento')} ·{' '}
        {plural(contagem.pendente, 'pendente', 'pendentes')}
      </p>
    </CartaoDestaque>
  )
}

/**
 * As frentes do quadro como etapas: ícone, nome, quantas entregas estão prontas
 * e a pílula. Cada etapa abre e mostra as entregas dela (lista nativa
 * `details`: funciona por teclado e leitor de tela sem script).
 */
export function ListaDeEtapas({ className }: { className?: string }) {
  const etapas = resumoDasFrentes()
  return (
    <Card canto="bl" className={cn('p-3 sm:p-4', className)}>
      <h2 className="px-3 pb-2 pt-1 text-xl sm:text-2xl">Etapas</h2>
      <ol className="flex flex-col gap-1">
        {etapas.map((etapa) => {
          const aparencia = ETAPA[etapa.situacao]
          const Icone = aparencia.icone
          return (
            <li key={etapa.nome}>
              <details className="group rounded-[28px]">
                <summary
                  className={cn(
                    'flex min-h-14 cursor-pointer list-none items-center gap-3.5 rounded-[28px] p-2 pr-4 transition-colors hover:bg-primary/5 [&::-webkit-details-marker]:hidden',
                    aparencia.linha,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      aparencia.icone_cor,
                    )}
                  >
                    <Icone className="h-[22px] w-[22px]" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-base font-bold leading-snug sm:text-[1.0625rem]">
                      {etapa.nome}
                    </span>
                    <span className="text-sm text-accent-foreground">
                      {etapa.prontas} de {etapa.total}{' '}
                      {etapa.total === 1 ? 'entrega pronta' : 'entregas prontas'}
                    </span>
                    {/* No celular a pílula desce para baixo do nome; daí em diante fica à direita. */}
                    <span
                      className={cn(
                        badgeVariants({ variant: aparencia.tom }),
                        'mt-1.5 self-start sm:hidden',
                      )}
                    >
                      {aparencia.rotulo}
                    </span>
                  </span>
                  <span
                    className={cn(badgeVariants({ variant: aparencia.tom }), 'hidden sm:inline-flex')}
                  >
                    {aparencia.rotulo}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180"
                  />
                </summary>
                <ul className="flex flex-col gap-2.5 px-3 pb-3 pt-2 sm:pl-16">
                  {etapa.entregas.map((entrega) => {
                    const situacao = ENTREGA[entrega.situacao]
                    return (
                      <li key={entrega.titulo} className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <strong className="text-base">{entrega.titulo}</strong>
                          <Badge variant={situacao.tom}>{situacao.rotulo}</Badge>
                        </div>
                        <span className="text-sm leading-relaxed text-accent-foreground">
                          {entrega.detalhe}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </details>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

const TIPO: Record<TipoAtualizacao, { rotulo: string; tom: Tom }> = {
  entrega: { rotulo: 'Novidade', tom: 'ok' },
  correcao: { rotulo: 'Correção', tom: 'warn' },
  seguranca: { rotulo: 'Segurança', tom: 'outline' },
  infra: { rotulo: 'Bastidores', tom: 'neutral' },
}

function CartaoDaNovidade({ novidade, indice }: { novidade: EntradaFeed; indice: number }) {
  const tipo = TIPO[novidade.tipo] ?? TIPO.entrega
  return (
    <li>
      <Card canto={cantoOrganico(indice)} className="flex h-full flex-col gap-2.5 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <time dateTime={novidade.data} className="font-serif text-xl font-bold text-primary">
            {formatarDataPorExtenso(novidade.data)}
          </time>
          <Badge variant={tipo.tom}>{tipo.rotulo}</Badge>
        </div>
        <h3 className="text-xl leading-tight sm:text-[1.3125rem]">{novidade.titulo}</h3>
        <p className="text-base leading-relaxed text-accent-foreground">{novidade.texto}</p>
      </Card>
    </li>
  )
}

const GRADE = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4 sm:gap-7'

/** "Novidades": a mais recente primeiro; as mais antigas ficam num "ver mais". */
export function NovidadesEmCartoes({
  feed,
  visiveis = 6,
}: {
  feed: EntradaFeed[]
  visiveis?: number
}) {
  // Mais recente primeiro, mesmo que alguém acrescente fora de ordem no JSON.
  const ordenadas = [...feed].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
  const recentes = ordenadas.slice(0, visiveis)
  const anteriores = ordenadas.slice(visiveis)

  return (
    <>
      <ul className={GRADE}>
        {recentes.map((n, i) => (
          <CartaoDaNovidade key={`${n.data}-${n.titulo}`} novidade={n} indice={i} />
        ))}
      </ul>
      {anteriores.length > 0 && (
        <details className="group mt-6 border-t border-dashed border-border pt-5">
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-2 text-base font-bold text-primary underline-offset-4 hover:underline">
            <span className="group-open:hidden">
              Ver as {anteriores.length} atualizações anteriores
            </span>
            <span className="hidden group-open:inline">Esconder as atualizações anteriores</span>
          </summary>
          <ul className={cn(GRADE, 'mt-5')}>
            {anteriores.map((n, i) => (
              <CartaoDaNovidade
                key={`${n.data}-${n.titulo}`}
                novidade={n}
                indice={i + recentes.length}
              />
            ))}
          </ul>
        </details>
      )}
    </>
  )
}
