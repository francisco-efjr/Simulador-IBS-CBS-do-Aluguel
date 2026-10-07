import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/utils'

export interface OpcaoDaPilula {
  valor: string
  rotulo: string
  icone: LucideIcon
}

interface GrupoDePilulasProps {
  /** Pergunta que o grupo responde; vira a legenda do `fieldset`. */
  legenda: string
  opcoes: OpcaoDaPilula[]
  valor: string
  onValorChange: (valor: string) => void
  className?: string
}

/**
 * Escolha entre poucas opções, em pílulas (ex.: tipo de garantia do contrato).
 *
 * É um grupo de rádio de verdade (`role="radiogroup"`, setas do teclado, uma
 * opção marcada por vez), só que com cara de botão grande. A opção marcada
 * muda de cor e ganha um "✓", então não depende só da cor.
 */
export function GrupoDePilulas({
  legenda,
  opcoes,
  valor,
  onValorChange,
  className,
}: GrupoDePilulasProps) {
  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-2', className)}>
      <legend className="mb-2 text-base font-bold">{legenda}</legend>
      <RadioGroupPrimitive.Root
        value={valor}
        onValueChange={onValorChange}
        aria-label={legenda}
        className="flex flex-wrap gap-2"
      >
        {opcoes.map(({ valor: v, rotulo, icone: Icone }) => (
          <RadioGroupPrimitive.Item
            key={v}
            value={v}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-input bg-transparent px-4 text-base font-bold text-foreground transition-colors duration-300 hover:bg-primary/10 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          >
            <Icone className="h-5 w-5 shrink-0" aria-hidden="true" />
            {rotulo}
            <RadioGroupPrimitive.Indicator asChild>
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            </RadioGroupPrimitive.Indicator>
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
    </fieldset>
  )
}
