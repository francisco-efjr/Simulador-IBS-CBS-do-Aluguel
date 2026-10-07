/* Badge Component primitives - A component that displays a badge - from shadcn/ui (exposes Badge, badgeVariants) */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-extrabold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-accent text-accent-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'border-border text-foreground',
        // Pílulas de situação do handoff: sempre texto + cor, nunca só cor.
        ok: 'border-transparent bg-primary/15 text-success-ink',
        warn: 'border-transparent bg-secondary/20 text-warning-ink',
        neutral: 'border-transparent bg-accent text-accent-foreground',
        // Siena pura sobre o tingido dá 4,2:1; o degrau 800 garante 7:1.
        danger: 'border-transparent bg-destructive/15 text-red-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
