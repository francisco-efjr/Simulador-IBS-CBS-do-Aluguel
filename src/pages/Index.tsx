import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ChevronRight, FileText, Landmark, ListChecks, Wallet } from 'lucide-react'
import type { ModuloPermissao } from '@/lib/constants'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { FeedDeAtividades } from '@/components/inicio/FeedDeAtividades'
import { OndeOSistemaEsta } from '@/components/produto/OndeOSistemaEsta'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CartaoDestaque, IconeTile } from '@/components/organico'
import { getUnidades } from '@/services/unidades'
import { getContratos } from '@/services/contratos'
import { getReceitas } from '@/services/receitas'
import { getDespesas } from '@/services/despesas'
import { getIptuTaxas } from '@/services/iptu-taxas'
import { getTransacoesImportadas } from '@/services/importacoes'
import { totaisDeReceitas, type LancamentoFinanceiro } from '@/lib/indicadores-financeiros'
import {
  alertasDoPainel,
  ocupacaoDasUnidades,
  proximosRecebimentos,
  resultadoDoUltimoMes,
  type AlertaDoPainel,
  type Ocupacao,
  type ProximoRecebimento,
  type ResultadoDoMes,
} from '@/lib/painel-inicio'

const ESPERA_DA_RECARGA_MS = 800

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

interface Painel {
  resultado: ResultadoDoMes | null
  ocupacao: Ocupacao | null
  aReceber: { valor: number; quantidade: number } | null
  alertas: AlertaDoPainel[]
  recebimentos: ProximoRecebimento[]
}

const PAINEL_VAZIO: Painel = {
  resultado: null,
  ocupacao: null,
  aReceber: null,
  alertas: [],
  recebimentos: [],
}

const DESTINO_DO_ALERTA: Record<
  AlertaDoPainel['tipo'],
  { rota: string; modulo: ModuloPermissao; icone: typeof FileText }
> = {
  contrato: { rota: '/contratos', modulo: 'contratos', icone: FileText },
  iptu: { rota: '/iptu-taxas', modulo: 'iptu_taxas', icone: Landmark },
  receita: { rota: '/receitas', modulo: 'receitas', icone: Wallet },
  transacoes: {
    rota: '/classificar-transacoes',
    modulo: 'classificar_transacoes',
    icone: ListChecks,
  },
}

function saudacao(agora: Date) {
  const hora = agora.getHours()
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
}

function diaPorExtenso(agora: Date) {
  const semana = agora.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '')
  const dia = agora.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
  return `${semana}, ${dia}`
}

const valor = (n: number | undefined | null) =>
  n === undefined || n === null ? '—' : moeda.format(n)

/**
 * Início (tela 02 do handoff): o resultado do último mês fechado é a primeira
 * coisa e a maior da tela — pensado para quem abre o sistema uma vez por mês
 * só para saber se "fechou no azul". Depois, ocupação, o que há a receber, o
 * que pede atenção e os próximos recebimentos.
 */
export default function Index() {
  const { user, isAdministrador, canViewModule } = useAuth()
  const primeiroNome = user?.name ? user.name.split(' ')[0] : ''

  const [painel, setPainel] = useState<Painel>(PAINEL_VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const montado = useRef(true)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  const carregar = useCallback(async () => {
    // Cada fonte pode falhar sozinha (permissão por módulo): mostra o que vier.
    const [unidades, contratos, receitas, despesas, iptu, transacoes] = await Promise.allSettled([
      getUnidades(),
      getContratos(),
      getReceitas(),
      getDespesas(),
      getIptuTaxas(),
      getTransacoesImportadas(undefined, true),
    ])
    if (!montado.current) return
    const ok = <T,>(r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? r.value : null)
    const listaDeReceitas = ok(receitas) as (LancamentoFinanceiro & { id: string })[] | null
    const listaDeDespesas = ok(despesas) as LancamentoFinanceiro[] | null
    const listaDeUnidades = ok(unidades)

    const totais = listaDeReceitas ? totaisDeReceitas(listaDeReceitas) : null
    const emAberto = listaDeReceitas?.filter((r) => totaisDeReceitas([r]).saldo > 0).length ?? 0

    setPainel({
      resultado:
        listaDeReceitas && listaDeDespesas
          ? resultadoDoUltimoMes(listaDeReceitas, listaDeDespesas)
          : null,
      ocupacao: listaDeUnidades ? ocupacaoDasUnidades(listaDeUnidades) : null,
      aReceber: totais ? { valor: totais.saldo, quantidade: emAberto } : null,
      alertas: alertasDoPainel({
        contratos: ok(contratos) ?? [],
        iptu: (ok(iptu) as Parameters<typeof alertasDoPainel>[0]['iptu']) ?? [],
        receitas: listaDeReceitas ?? [],
        transacoesParaClassificar: ok(transacoes)?.length ?? 0,
      }),
      recebimentos: listaDeReceitas ? proximosRecebimentos(listaDeReceitas) : [],
    })
    // Número velho ou inventado engana; sem o essencial, "—" e um aviso.
    setErro(!listaDeReceitas || !listaDeDespesas)
    setCarregando(false)
  }, [])

  useEffect(() => {
    montado.current = true
    carregar()
    return () => {
      montado.current = false
      if (temporizador.current) clearTimeout(temporizador.current)
    }
  }, [carregar])

  // Os números se refazem sozinhos quando alguém grava algo. Várias mudanças
  // seguidas (uma importação, por exemplo) viram uma recarga só.
  const agendarRecarga = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(carregar, ESPERA_DA_RECARGA_MS)
  }, [carregar])

  useRealtime('imovel_unidades', agendarRecarga)
  useRealtime('contratos', agendarRecarga)
  useRealtime('receitas', agendarRecarga)
  useRealtime('despesas', agendarRecarga)

  const agora = new Date()
  const { resultado, ocupacao, aReceber, recebimentos } = painel
  const alertas = painel.alertas
    .filter((a) => canViewModule(DESTINO_DO_ALERTA[a.tipo].modulo))
    .slice(0, 3)
  const noVermelho = (resultado?.resultado ?? 0) < 0
  const mesFechado = resultado?.mes ?? ''
  const titulo = resultado
    ? `${mesFechado.charAt(0).toUpperCase()}${mesFechado.slice(1)} fechou no ${noVermelho ? 'vermelho' : 'azul'}`
    : 'Início'

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="flex flex-col gap-1.5 px-2 lg:px-0">
        <p className="text-base text-accent-foreground">
          {saudacao(agora)}
          {primeiroNome && `, ${primeiroNome}`}
          <span className="hidden lg:inline"> · {diaPorExtenso(agora)}</span>
        </p>
        <h1 className="text-3xl lg:text-5xl">{titulo}</h1>
      </header>

      {erro && !carregando && (
        <p className="flex items-center gap-2 text-sm text-accent-foreground" role="status">
          <AlertCircle className="h-5 w-5 shrink-0 text-warning-ink" aria-hidden="true" />
          Não foi possível carregar os números agora. Recarregue a página em instantes.
        </p>
      )}

      <section
        aria-label="Resumo do mês"
        className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-3 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] lg:gap-6"
      >
        <CartaoDestaque tom={noVermelho ? 'alerta' : 'musgo'} className="col-span-full">
          <h2 className="font-sans text-base font-bold lg:text-lg">
            Resultado de {mesFechado || 'o último mês'}
          </h2>
          <p className="numero my-2 font-serif text-[clamp(1.875rem,13cqw,3.75rem)] font-bold leading-[1.05]">
            {carregando ? '…' : valor(resultado?.resultado)}
          </p>
          <div className="lg:hidden">
            <p className="numero text-base">Receitas {valor(resultado?.receitas)}</p>
            <p className="numero text-base">Despesas {valor(resultado?.despesas)}</p>
          </div>
          <p className="hidden text-lg lg:block">
            Receitas menos despesas
            {resultado?.variacao !== null && resultado?.variacao !== undefined && (
              <>
                {' · '}
                {Math.abs(resultado.variacao)}% {resultado.variacao >= 0 ? 'acima' : 'abaixo'} do
                mês anterior
              </>
            )}
          </p>
        </CartaoDestaque>

        <NumeroDoPainel
          canto="bl"
          rotulo="Receitas"
          valor={valor(resultado?.receitas)}
          detalhe={`Despesas ${valor(resultado?.despesas)}`}
          className="hidden lg:flex"
        />
        <NumeroDoPainel
          canto="tl"
          rotulo="Ocupação"
          valor={ocupacao?.percentual != null ? `${ocupacao.percentual}%` : '—'}
          detalhe={ocupacao ? `${ocupacao.ocupadas} de ${ocupacao.total} unidades` : ''}
        />
        <NumeroDoPainel
          canto="tr"
          rotulo="A receber"
          valor={valor(aReceber?.valor)}
          detalhe={
            aReceber
              ? `${aReceber.quantidade} ${aReceber.quantidade === 1 ? 'lançamento' : 'lançamentos'} em aberto`
              : ''
          }
        />
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-6">
        <section aria-labelledby="pede-atencao" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3 px-2 lg:px-0">
            <h2 id="pede-atencao" className="text-2xl">
              Pede atenção
            </h2>
            {canViewModule('alertas') && (
              <Link
                to="/alertas"
                className="numero min-h-11 shrink-0 py-2.5 text-sm font-bold text-primary"
              >
                Ver todos<span className="sr-only"> os alertas</span>
              </Link>
            )}
          </div>
          {alertas.length === 0 ? (
            <p className="rounded-3xl bg-muted px-5 py-4 text-base text-accent-foreground">
              {carregando ? 'Conferindo vencimentos…' : 'Nada pedindo atenção agora.'}
            </p>
          ) : (
            alertas.map((a) => {
              const destino = DESTINO_DO_ALERTA[a.tipo]
              return (
                <Link
                  key={a.id}
                  to={destino.rota}
                  className="gira-no-hover flex min-h-[76px] items-center gap-4 rounded-3xl border border-border/60 bg-card px-4 py-4 text-foreground no-underline transition-all duration-300 hover:-translate-y-0.5 hover:rotate-[0.4deg] hover:shadow-lift lg:px-5"
                >
                  <IconeTile icone={destino.icone} tom={a.tom} tamanho="sm" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <strong className="text-base leading-snug">{a.titulo}</strong>
                    <span className="text-sm text-accent-foreground">{a.detalhe}</span>
                  </span>
                  <ChevronRight
                    className="h-[22px] w-[22px] shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              )
            })
          )}
        </section>

        <section
          aria-labelledby="proximos-recebimentos"
          className="flex flex-col gap-4 rounded-organic-br bg-muted p-6 lg:p-7"
        >
          <h2 id="proximos-recebimentos" className="text-2xl">
            Próximos recebimentos
          </h2>
          {recebimentos.length === 0 ? (
            <p className="text-base text-accent-foreground">
              {carregando ? 'Carregando…' : 'Nenhum recebimento previsto daqui em diante.'}
            </p>
          ) : (
            <ul className="flex flex-col">
              {recebimentos.map((r) => {
                const data = new Date(`${r.data}T00:00:00`)
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 border-b border-dashed border-border py-2.5 last:border-0"
                  >
                    <span className="w-14 shrink-0 text-center font-serif text-[1.375rem] font-bold leading-none">
                      {data.getDate()}
                      <span className="block font-sans text-xs font-bold text-accent-foreground">
                        {data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 text-base">{r.quem}</span>
                    <strong className="numero text-base">{moeda.format(r.valor)}</strong>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <OndeOSistemaEsta isAdministrador={isAdministrador} />

      {isAdministrador && <FeedDeAtividades />}
    </div>
  )
}

function NumeroDoPainel({
  canto,
  rotulo,
  valor,
  detalhe,
  className,
}: {
  canto: 'tl' | 'tr' | 'bl' | 'br'
  rotulo: string
  valor: string
  detalhe: string
  className?: string
}) {
  return (
    <Card
      canto={canto}
      className={cn(
        'flex flex-col gap-1 p-5 transition-all duration-300 [container-type:inline-size] hover:-translate-y-1 hover:shadow-lift lg:p-7',
        className,
      )}
    >
      <h2 className="font-sans text-sm font-bold text-muted-foreground lg:text-base">{rotulo}</h2>
      <p className="numero font-serif text-[clamp(1.625rem,11cqw,2.25rem)] font-bold leading-tight">
        {valor}
      </p>
      {detalhe && <p className="text-sm text-accent-foreground lg:text-base">{detalhe}</p>}
    </Card>
  )
}
