import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Blob } from './Blob'

interface CartaoDestaqueProps extends HTMLAttributes<HTMLDivElement> {
  /** `alerta` usa siena — por exemplo, mês que fechou no vermelho. */
  tom?: 'musgo' | 'alerta'
  /** Lado da camada de papel deslocada atrás do cartão. */
  papel?: 'direita' | 'esquerda'
}

/**
 * Cartão de destaque (HighlightCard do handoff): fundo musgo, número grande.
 * Não gira — cartão com número fica reto para leitura (QA Q03); a "folha de
 * papel" deslocada atrás dele dá o ar orgânico. `@container` permite números
 * com fonte fluida (`text-[clamp(...cqw...)]`).
 */
export function CartaoDestaque({
  tom = 'musgo',
  papel = 'direita',
  className,
  children,
  ...props
}: CartaoDestaqueProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-destaque p-6 [container-type:inline-size] sm:p-8',
        tom === 'musgo'
          ? 'bg-primary text-primary-foreground'
          : 'bg-destructive text-destructive-foreground',
        papel === 'direita' ? 'shadow-papel' : 'shadow-papel-esq',
        className,
      )}
      {...props}
    >
      <Blob
        forma={1}
        cor="secondary"
        className="-bottom-20 -right-10 h-56 w-64 opacity-40 blur-2xl"
      />
      <div className="relative">{children}</div>
    </div>
  )
}
