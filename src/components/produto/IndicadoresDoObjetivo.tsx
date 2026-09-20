import { type Indicador, textoDeHoje } from '@/data/andamento'
import { APARENCIA_DO_INDICADOR } from './aparencia'

interface Props {
  indicadores: Indicador[]
}

/**
 * Os indicadores do objetivo, cada um com o que é medido, onde está hoje e
 * onde precisa chegar.
 *
 * Nenhum número é estimado aqui: o que ainda não é medido aparece como "ainda
 * não medido" (ver `textoDeHoje`). Melhor a tela admitir a falta do que exibir
 * um número que ninguém confere.
 */
export function IndicadoresDoObjetivo({ indicadores }: Props) {
  if (!indicadores.length) return null

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {indicadores.map((indicador) => {
        const estilo = APARENCIA_DO_INDICADOR[indicador.situacao] ?? APARENCIA_DO_INDICADOR.atencao
        const Icone = estilo.icone
        return (
          <li
            key={indicador.nome}
            className="flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <Icone className={`mt-0.5 h-5 w-5 shrink-0 ${estilo.texto}`} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                {indicador.nome}
                <span className="sr-only">: {estilo.rotulo}.</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{indicador.comoSeMede}</p>
              <dl className="mt-2 space-y-1 text-sm leading-relaxed">
                <div className="flex gap-1.5">
                  <dt className="font-semibold text-slate-700">Hoje:</dt>
                  <dd className="text-slate-700">{textoDeHoje(indicador)}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="font-semibold text-slate-700">Meta:</dt>
                  <dd className="text-slate-700">{indicador.meta}</dd>
                </div>
              </dl>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
