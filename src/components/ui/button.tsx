/* Botão (shadcn/ui) no visual orgânico: pílula, musgo, sombra tingida (exposes Button, buttonVariants) */
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Sem `whitespace-nowrap`: com a letra no maior tamanho, um rótulo longo quebra
// dentro da pílula em vez de estourar a largura da tela.
const buttonVariants = cva(
  'inline-flex max-w-full items-center justify-center gap-2 text-center rounded-full font-extrabold ring-offset-background transition-all duration-300 ease-organic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-soft hover:scale-105 hover:shadow-lift active:scale-95',
        destructive:
          'bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90 active:scale-95',
        // Argila escura: a argila clara (#C18C5D) não aguenta texto (2,9:1).
        outline:
          'border-2 border-secondary-ink bg-transparent text-secondary-ink hover:bg-secondary-ink hover:text-white active:scale-95',
        secondary: 'bg-muted text-foreground hover:bg-accent active:scale-95',
        ghost: 'text-primary hover:bg-primary/10',
        link: 'text-primary underline underline-offset-4 decoration-2 hover:text-foreground',
      },
      // Nenhum tamanho desce abaixo de 44px, nem no desktop: é o alvo
      // recomendado para mão com menos firmeza (WCAG 2.5.5, nível AAA — o
      // mínimo AA seria 24px, insuficiente para o público deste sistema).
      size: {
        default: 'min-h-12 px-6 py-2 text-base',
        sm: 'min-h-11 px-4 text-sm',
        lg: 'min-h-14 px-8 text-lg',
        icon: 'h-12 w-12 min-h-12 min-w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
