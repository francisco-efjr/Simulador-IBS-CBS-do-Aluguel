import { ESCALAS, useEscalaLeitura } from '@/hooks/use-escala-leitura'
import { cn } from '@/lib/utils'

const ROTULOS = {
  normal: { curto: 'A', tamanho: 'text-[15px]' },
  grande: { curto: 'A+', tamanho: 'text-[17px]' },
  maior: { curto: 'A++', tamanho: 'text-[19px]' },
} as const

/**
 * Controle de tamanho da letra (FontScaleToggle do handoff): grupo segmentado
 * em pílula, um botão por tamanho com `aria-pressed`.
 *
 * Três passos apenas — normal, grande e maior. Mais opções que isso viram
 * decisão a tomar, e a pessoa que precisa do recurso quer resolver, não
 * escolher. O menor passo é o tamanho normal: o sistema nunca fica com letra
 * abaixo do piso de 14px.
 */
export function ControleDeFonte({ className }: { className?: string }) {
  const { escala, definirEscala } = useEscalaLeitura()

  return (
    <div
      role="group"
      aria-label="Tamanho da letra"
      className={cn('inline-flex shrink-0 gap-1 rounded-full bg-muted p-1', className)}
    >
      {ESCALAS.map((e) => {
        const ativo = e.id === escala
        return (
          <button
            key={e.id}
            type="button"
            aria-pressed={ativo}
            aria-label={`Letra ${e.rotulo.toLowerCase()}`}
            onClick={() => definirEscala(e.id)}
            className={cn(
              'h-11 min-w-12 rounded-full px-3 font-extrabold leading-none text-foreground transition-all duration-300',
              ROTULOS[e.id].tamanho,
              ativo ? 'bg-card shadow-soft' : 'hover:bg-primary/10',
            )}
          >
            {ROTULOS[e.id].curto}
          </button>
        )
      })}
    </div>
  )
}
