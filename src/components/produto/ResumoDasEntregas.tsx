import type { ProgressoDasEntregas, Situacao } from '@/data/andamento'
import { APARENCIA_DA_ENTREGA } from './aparencia'

const SITUACOES: Situacao[] = ['pronto', 'andamento', 'pendente']

interface Props {
  progresso: ProgressoDasEntregas
  /**
   * Versão enxuta, para a tela Início: mesma conta, mesmas palavras, ocupando
   * poucas linhas. A página pública usa a versão inteira.
   */
  compacto?: boolean
}

/**
 * Quantas entregas já estão prontas, com a barra de progresso e a contagem por
 * situação.
 *
 * Usado pelo "Resumo" da página pública (`/`) e pela seção "Onde o sistema
 * está" da tela Início (`/inicio`) — a conta vem de `progressoDasEntregas()`,
 * uma só, para os dois nunca divergirem. Quem chama põe a moldura (o cartão).
 */
export function ResumoDasEntregas({ progresso, compacto = false }: Props) {
  const { total, contagem, percentualPronto } = progresso

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={`font-bold text-slate-900 ${compacto ? 'text-base' : 'text-lg'}`}>
          {contagem.pronto} de {total} entregas concluídas
        </p>
        <p className={`font-bold text-emerald-700 ${compacto ? 'text-base' : 'text-lg'}`}>
          {percentualPronto}%
        </p>
      </div>

      <div
        className={`mt-3 w-full overflow-hidden rounded-full bg-slate-200 ${compacto ? 'h-3' : 'h-4'}`}
        role="img"
        aria-label={`${percentualPronto} por cento das entregas concluídas`}
      >
        <div
          className="h-full rounded-full bg-emerald-600"
          style={{ width: `${percentualPronto}%` }}
        />
      </div>

      {compacto ? (
        <dl className="mt-4 flex flex-wrap gap-2">
          {SITUACOES.map((situacao) => {
            const estilo = APARENCIA_DA_ENTREGA[situacao]
            const Icone = estilo.icone
            return (
              <div
                key={situacao}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${estilo.caixa}`}
              >
                <Icone className={`h-4 w-4 shrink-0 ${estilo.texto}`} aria-hidden="true" />
                <dt className={`text-sm font-semibold ${estilo.texto}`}>{estilo.rotulo}:</dt>
                <dd className="text-sm font-bold text-slate-900">{contagem[situacao]}</dd>
              </div>
            )
          })}
        </dl>
      ) : (
        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SITUACOES.map((situacao) => {
            const estilo = APARENCIA_DA_ENTREGA[situacao]
            const Icone = estilo.icone
            return (
              <div
                key={situacao}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${estilo.caixa}`}
              >
                <Icone className={`h-6 w-6 shrink-0 ${estilo.texto}`} aria-hidden="true" />
                <div>
                  <dt className={`text-sm font-semibold ${estilo.texto}`}>{estilo.rotulo}</dt>
                  <dd className="text-2xl font-bold text-slate-900">{contagem[situacao]}</dd>
                </div>
              </div>
            )
          })}
        </dl>
      )}
    </>
  )
}
