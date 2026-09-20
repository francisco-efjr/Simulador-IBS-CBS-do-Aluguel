import { Link } from 'react-router-dom'
import { ArrowUpRight, ScrollText, Target } from 'lucide-react'
import {
  OBJETIVOS,
  progressoDasEntregas,
  resumoCurtoDaSaude,
  type Objetivos,
} from '@/data/andamento'
import { APARENCIA_DA_VERIFICACAO } from './aparencia'
import { IndicadoresDoObjetivo } from './IndicadoresDoObjetivo'
import { ResumoDasEntregas } from './ResumoDasEntregas'

/** Quantos itens do "o que vem a seguir" cabem aqui; o resto fica no backlog. */
const PROXIMOS_PASSOS_VISIVEIS = 3

interface Props {
  /** O administrador ganha o atalho para o registro de atividades. */
  isAdministrador?: boolean
  /** Injetável para teste; por padrão, o que está em `objetivos.json`. */
  objetivos?: Objetivos
}

/**
 * "Onde o sistema está" — a seção da tela Início que responde, para quem entra
 * no sistema, duas perguntas: em que pé está o produto e para onde ele vai.
 *
 * O conteúdo é o mesmo que a página pública (`/`) mostra, só que enxuto: aqui
 * não se repete o quadro por frente nem o painel de saúde do sistema — há um
 * link para eles. Nada disso depende de banco: vem dos JSONs de `src/data`.
 */
export function OndeOSistemaEsta({ isAdministrador = false, objetivos = OBJETIVOS }: Props) {
  const { objetivo, indicadores, proximosPassos } = objetivos
  const progresso = progressoDasEntregas()
  const saude = resumoCurtoDaSaude()
  const proximos = proximosPassos.slice(0, PROXIMOS_PASSOS_VISIVEIS)
  const EstiloDaSaude = saude ? APARENCIA_DA_VERIFICACAO[saude.situacao] : null
  const IconeDaSaude = EstiloDaSaude?.icone

  return (
    <section aria-labelledby="titulo-onde-o-sistema-esta" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id="titulo-onde-o-sistema-esta" className="text-lg font-bold text-slate-900">
          Onde o sistema está
        </h2>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-indigo-800 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
        >
          Ver o quadro completo
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex gap-3">
          <Target className="mt-0.5 h-6 w-6 shrink-0 text-indigo-700" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-indigo-800">
              Nosso objetivo até {objetivo.prazoPorExtenso}
            </h3>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-800">
              {objetivo.frase}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-900">Progresso das entregas</h3>
          <div className="mt-3">
            <ResumoDasEntregas progresso={progresso} compacto />
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-900">Como o objetivo é medido</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            O que ainda não é medido aparece assim mesmo, sem número inventado.
          </p>
          <div className="mt-3">
            <IndicadoresDoObjetivo indicadores={indicadores} />
          </div>
        </div>

        {proximos.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-bold text-slate-900">O que vem a seguir</h3>
            <ol className="mt-3 space-y-3">
              {proximos.map((passo, indice) => (
                <li key={passo.codigo} className="flex gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-800"
                    aria-hidden="true"
                  >
                    {indice + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{passo.titulo}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                      {passo.detalhe}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
          {saude && IconeDaSaude && EstiloDaSaude ? (
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <IconeDaSaude
                className={`h-4 w-4 shrink-0 ${EstiloDaSaude.texto}`}
                aria-hidden="true"
              />
              {saude.frase}
            </p>
          ) : (
            <p className="text-sm text-slate-700">
              A primeira conferência automática ainda não foi feita.
            </p>
          )}

          {isAdministrador && (
            <Link
              to="/logs-atividade"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-indigo-800 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
            >
              <ScrollText className="h-4 w-4" aria-hidden="true" />
              Ver o registro de atividades
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
