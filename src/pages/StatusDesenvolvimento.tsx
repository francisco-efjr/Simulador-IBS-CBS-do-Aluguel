import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Calculator, LogIn, ShieldAlert } from 'lucide-react'
import {
  ANDAMENTO,
  AUDITORIA,
  FEED,
  dataDaUltimaAtualizacao,
  formatarDataPorExtenso,
  formatarMomentoBrasilia,
  progressoDasEntregas,
  resumoDaSaude,
  type TipoAtualizacao,
} from '@/data/andamento'
import {
  APARENCIA_DA_ENTREGA,
  APARENCIA_DA_VERIFICACAO,
} from '@/components/produto/aparencia'
import { ResumoDasEntregas } from '@/components/produto/ResumoDasEntregas'
import { useAuth } from '@/hooks/use-auth'
import { useTituloDaPagina } from '@/hooks/use-titulo-da-pagina'

/**
 * Painel de fase de desenvolvimento — tela pública em `/`.
 *
 * TEMPORÁRIA. Existe para que quem abre o endereço durante a construção veja,
 * numa página só, o que já funciona e o que ainda falta, sem precisar de
 * credencial. Quando o sistema for publicado de verdade:
 *
 *   1. apague este arquivo;
 *   2. em `src/App.tsx`, devolva a rota `/` para o `<Index />` dentro do
 *      `<ProtectedRoute>` (hoje ela aponta para cá e o painel vive em `/inicio`);
 *   3. em `src/lib/constants.ts`, devolva o item "Início" para o caminho `/`.
 *
 * O conteúdo não mora aqui: o quadro está em `src/data/andamento.json`, as
 * novidades em `src/data/feed.json` e a saúde do sistema em
 * `src/data/auditoria.json`, este último gerado pelo auditor a cada build
 * (ver docs/07-auditor.md). Para atualizar a página, mexa nos dados.
 */

const { frentes: FRENTES, pendencias: PENDENCIAS } = ANDAMENTO

/** Quantas novidades aparecem abertas; as mais antigas ficam num "ver mais". */
const NOVIDADES_VISIVEIS = 6

/** Rótulo para leigo de cada tipo de novidade. */
const APARENCIA_TIPO: Record<TipoAtualizacao, { rotulo: string; estilo: string; ponto: string }> = {
  entrega: {
    rotulo: 'Novidade',
    estilo: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    ponto: 'bg-emerald-600',
  },
  correcao: {
    rotulo: 'Correção',
    estilo: 'border-sky-200 bg-sky-50 text-sky-900',
    ponto: 'bg-sky-600',
  },
  seguranca: {
    rotulo: 'Segurança',
    estilo: 'border-indigo-200 bg-indigo-50 text-indigo-900',
    ponto: 'bg-indigo-600',
  },
  infra: {
    rotulo: 'Bastidores',
    estilo: 'border-slate-200 bg-slate-50 text-slate-700',
    ponto: 'bg-slate-500',
  },
}

function LinhaDoTempo() {
  // Mais recente primeiro, mesmo que alguém acrescente fora de ordem no JSON.
  const novidades = [...FEED].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
  const visiveis = novidades.slice(0, NOVIDADES_VISIVEIS)
  const anteriores = novidades.slice(NOVIDADES_VISIVEIS)

  const lista = (itens: typeof novidades) => (
    <ol className="relative ml-2 space-y-6 border-l-2 border-slate-200 pl-6 sm:ml-3 sm:pl-8">
      {itens.map((novidade) => {
        const tipo = APARENCIA_TIPO[novidade.tipo] ?? APARENCIA_TIPO.entrega
        return (
          <li key={`${novidade.data}-${novidade.titulo}`} className="relative">
            <span
              className={`absolute -left-[33px] top-1.5 h-4 w-4 rounded-full border-2 border-white ${tipo.ponto} sm:-left-[41px]`}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <time dateTime={novidade.data} className="text-sm font-semibold text-slate-600">
                {formatarDataPorExtenso(novidade.data)}
              </time>
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-sm font-semibold ${tipo.estilo}`}
              >
                {tipo.rotulo}
              </span>
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-900">{novidade.titulo}</h3>
            <p className="mt-1 max-w-3xl text-base leading-relaxed text-slate-700">
              {novidade.texto}
            </p>
          </li>
        )
      })}
    </ol>
  )

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
      {lista(visiveis)}
      {anteriores.length > 0 && (
        <details className="group mt-6 border-t border-slate-100 pt-5">
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-1 text-base font-bold text-indigo-800 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300">
            <span className="group-open:hidden">
              Ver as {anteriores.length} atualizações anteriores
            </span>
            <span className="hidden group-open:inline">Esconder as atualizações anteriores</span>
          </summary>
          <div className="mt-5">{lista(anteriores)}</div>
        </details>
      )}
    </div>
  )
}

function SaudeDoSistema() {
  const resumo = resumoDaSaude()

  if (!resumo) {
    return (
      <p className="mt-5 rounded-xl border border-slate-200 bg-white p-6 text-base text-slate-700 shadow-xs">
        A primeira conferência automática ainda não foi feita. Ela acontece na próxima publicação.
      </p>
    )
  }

  const estiloResumo = APARENCIA_DA_VERIFICACAO[resumo.situacao]
  const IconeResumo = estiloResumo.icone

  return (
    <div className="mt-5 space-y-4">
      <div className={`flex items-start gap-3 rounded-xl border px-5 py-4 ${estiloResumo.caixa}`}>
        <IconeResumo
          className={`mt-0.5 h-6 w-6 shrink-0 ${estiloResumo.texto}`}
          aria-hidden="true"
        />
        <div>
          <p className={`text-lg font-bold ${estiloResumo.texto}`}>{resumo.frase}</p>
          <p className="mt-1 text-sm text-slate-700">
            Verificado em {formatarMomentoBrasilia(AUDITORIA.geradoEm)} (horário de Brasília)
            {AUDITORIA.commit ? `, na versão ${AUDITORIA.commit}` : ''}.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {AUDITORIA.verificacoes.map((verificacao) => {
          const estilo =
            APARENCIA_DA_VERIFICACAO[verificacao.situacao] ?? APARENCIA_DA_VERIFICACAO.atencao
          const Icone = estilo.icone
          return (
            <li
              key={verificacao.id}
              className="flex gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs"
            >
              <Icone className={`mt-0.5 h-6 w-6 shrink-0 ${estilo.texto}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900">
                  {verificacao.nome}
                  <span className="sr-only">: {estilo.rotulo}.</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{verificacao.detalhe}</p>
                {verificacao.situacao !== 'ok' && (
                  <p
                    className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-sm font-semibold ${estilo.caixa} ${estilo.texto}`}
                    aria-hidden="true"
                  >
                    {estilo.rotulo}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function StatusDesenvolvimento() {
  useTituloDaPagina('Fase de desenvolvimento')
  const { isAuthenticated } = useAuth()

  const progresso = progressoDasEntregas()
  const atualizadoEm = dataDaUltimaAtualizacao()
  const saude = resumoDaSaude()

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#quadro"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy-950 focus:px-5 focus:py-3 focus:text-base focus:font-bold focus:text-white"
      >
        Ir para o quadro de entregas
      </a>

      {/* Faixa de aviso: quem chega aqui precisa saber, na primeira linha, que
          está diante de um sistema em construção e não de um produto publicado. */}
      <div className="bg-amber-400 text-navy-950">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-bold">
            Sistema em fase de desenvolvimento. Esta página mostra o andamento e será removida na
            publicação.
          </p>
        </div>
      </div>

      <header className="bg-gradient-to-br from-navy-950 via-indigo-900 to-navy-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-200">
            Holding Aguiar
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Controle de Imóveis — andamento da construção
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-indigo-100">
            Gestão do patrimônio, dos contratos e do caixa da holding, com conciliação do extrato
            bancário e o simulador do IBS/CBS da Reforma Tributária. Abaixo, o que já funciona e o
            que ainda está sendo feito.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link
                to="/inicio"
                className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-base font-bold text-navy-950 transition-colors hover:bg-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-300"
              >
                Ir para o painel
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-base font-bold text-navy-950 transition-colors hover:bg-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-300"
              >
                <LogIn className="h-5 w-5" aria-hidden="true" />
                Entrar no sistema
              </Link>
            )}
            <Link
              to="/simulador"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white/40 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
            >
              <Calculator className="h-5 w-5" aria-hidden="true" />
              Abrir o Simulador IBS/CBS
            </Link>
          </div>

          <div className="mt-6 space-y-1 text-sm text-indigo-200">
            {atualizadoEm && (
              <p>
                Quadro atualizado em{' '}
                <time dateTime={atualizadoEm}>{formatarDataPorExtenso(atualizadoEm)}</time>.
              </p>
            )}
            {saude && (
              <p>
                {saude.frase}{' '}
                <a
                  href="#saude"
                  className="font-semibold text-white underline underline-offset-4 hover:text-indigo-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
                >
                  Ver a saúde do sistema
                </a>
              </p>
            )}
          </div>
        </div>
      </header>

      <main id="quadro" tabIndex={-1} className="focus:outline-none">
        <section aria-labelledby="titulo-resumo" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h2 id="titulo-resumo" className="text-2xl font-bold text-slate-900">
            Resumo
          </h2>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <ResumoDasEntregas progresso={progresso} />
          </div>
        </section>

        <section
          aria-labelledby="titulo-novidades"
          className="mx-auto max-w-5xl px-4 pb-10 sm:px-6"
        >
          <h2 id="titulo-novidades" className="text-2xl font-bold text-slate-900">
            Últimas atualizações
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
            O que mudou no sistema, da novidade mais recente para a mais antiga.
          </p>
          <LinhaDoTempo />
        </section>

        <section aria-labelledby="titulo-entregas" className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
          <h2 id="titulo-entregas" className="text-2xl font-bold text-slate-900">
            Entregas por frente
          </h2>

          <div className="mt-5 space-y-6">
            {FRENTES.map((frente) => (
              <article
                key={frente.nome}
                className="rounded-xl border border-slate-200 bg-white shadow-xs"
              >
                <h3 className="border-b border-slate-200 px-6 py-4 text-lg font-bold text-slate-900">
                  {frente.nome}
                  <span className="ml-2 text-sm font-medium text-slate-600">
                    {frente.entregas.filter((e) => e.situacao === 'pronto').length} de{' '}
                    {frente.entregas.length} prontas
                  </span>
                </h3>

                <ul className="divide-y divide-slate-100">
                  {frente.entregas.map((entrega) => {
                    const estilo = APARENCIA_DA_ENTREGA[entrega.situacao]
                    return (
                      <li
                        key={entrega.titulo}
                        className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                      >
                        <div className="min-w-0">
                          <p className="text-base font-bold text-slate-900">{entrega.titulo}</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            {entrega.detalhe}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3 py-1 text-sm font-semibold ${estilo.caixa} ${estilo.texto}`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${estilo.ponto}`}
                            aria-hidden="true"
                          />
                          {estilo.rotulo}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="titulo-bloqueios"
          className="mx-auto max-w-5xl px-4 pb-10 sm:px-6"
        >
          <h2 id="titulo-bloqueios" className="text-2xl font-bold text-slate-900">
            O que falta para o primeiro dado real
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
            {PENDENCIAS.introducao}
          </p>

          <ul className="mt-5 space-y-3">
            {PENDENCIAS.itens.map((pendencia) => (
              <li
                key={pendencia.codigo}
                className="flex gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4"
              >
                <ShieldAlert
                  className="mt-0.5 h-6 w-6 shrink-0 text-indigo-700"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-base font-bold text-indigo-950">
                    <span className="mr-2 rounded bg-indigo-200 px-2 py-0.5 text-sm font-bold text-indigo-950">
                      {pendencia.codigo}
                    </span>
                    {pendencia.titulo}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-indigo-950/90">
                    {pendencia.detalhe}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="saude"
          tabIndex={-1}
          aria-labelledby="titulo-saude"
          className="mx-auto max-w-5xl scroll-mt-4 px-4 pb-14 focus:outline-none sm:px-6"
        >
          <h2 id="titulo-saude" className="text-2xl font-bold text-slate-900">
            Saúde do sistema
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
            A cada nova versão, antes de ir ao ar, o próprio sistema passa por uma série de
            conferências automáticas. Este é o resultado da versão que você está vendo agora.
          </p>
          <SaudeDoSistema />
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-600 sm:px-6">
          <p>
            Holding Aguiar · Controle de Imóveis. Página de acompanhamento interno, temporária, sem
            dados de clientes.
          </p>
        </div>
      </footer>
    </div>
  )
}
