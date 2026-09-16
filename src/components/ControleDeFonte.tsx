import { Minus, Plus, Type } from 'lucide-react'
import { ESCALAS, useEscalaLeitura } from '@/hooks/use-escala-leitura'

/**
 * Controle de tamanho da letra, visível no cabeçalho.
 *
 * Três passos apenas — normal, grande e maior. Mais opções que isso viram
 * decisão a tomar, e a pessoa que precisa do recurso quer resolver, não
 * escolher. O estado atual é anunciado por `aria-live`, para quem não vê a
 * mudança acontecer na tela.
 */
export function ControleDeFonte() {
  const { escala, aumentar, diminuir } = useEscalaLeitura()
  const indice = ESCALAS.findIndex((e) => e.id === escala)
  const atual = ESCALAS[indice] ?? ESCALAS[0]

  const botao =
    'flex h-11 w-11 items-center justify-center rounded-lg border border-navy-600 bg-navy-900/70 text-slate-100 transition-colors hover:bg-navy-700 hover:text-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Tamanho da letra">
      <Type className="hidden h-5 w-5 text-gold-400 sm:block" aria-hidden="true" />
      <button
        type="button"
        onClick={diminuir}
        disabled={indice <= 0}
        aria-label="Diminuir o tamanho da letra"
        className={botao}
      >
        <Minus className="h-5 w-5" aria-hidden="true" />
      </button>
      <span className="sr-only" aria-live="polite">
        Tamanho da letra: {atual.rotulo}
      </span>
      <button
        type="button"
        onClick={aumentar}
        disabled={indice >= ESCALAS.length - 1}
        aria-label="Aumentar o tamanho da letra"
        className={botao}
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}
