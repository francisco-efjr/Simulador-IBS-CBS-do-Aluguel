/* Cartão (shadcn/ui) no visual orgânico: 32px com um canto de 64px (exposes Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cantoOrganico) */
import * as React from 'react'

import { cn } from '@/lib/utils'

const CANTOS = {
  tr: 'rounded-organic-tr',
  tl: 'rounded-organic-tl',
  br: 'rounded-organic-br',
  bl: 'rounded-organic-bl',
} as const

export type CantoOrganico = keyof typeof CANTOS

/** Canto de 64px que gira por índice, para listas de cartões não ficarem iguais. */
export const cantoOrganico = (indice: number): CantoOrganico =>
  (['tr', 'tl', 'br', 'bl'] as const)[((indice % 4) + 4) % 4]

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { canto?: CantoOrganico }
>(({ className, canto = 'tr', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'border border-border/60 bg-card text-card-foreground shadow-soft',
      CANTOS[canto],
      className,
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

/**
 * Título do cartão.
 *
 * Renderiza um cabeçalho de verdade (`<h3>` por omissão) em vez de um `<div>`
 * estilizado: é o cabeçalho que permite pular de seção em seção com leitor de
 * tela. Telas cujo cartão é o assunto principal — as de acesso, por exemplo —
 * passam `as="h1"`.
 */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2' | 'h3' | 'h4' }
>(({ className, as: Tag = 'h3', ...props }, ref) => (
  <Tag
    ref={ref}
    className={cn('font-serif text-xl font-bold leading-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-accent-foreground', className)} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
