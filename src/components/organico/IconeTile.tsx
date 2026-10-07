import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const TONS = {
  musgo: 'bg-primary/15 text-success-ink',
  argila: 'bg-secondary/20 text-warning-ink',
  siena: 'bg-destructive/15 text-red-800',
  neutro: 'bg-primary/10 text-primary',
} as const

/** Ícone em ladrilho (IconTile do handoff). `blob` troca o canto por forma orgânica. */
export function IconeTile({
  icone: Icone,
  tom = 'neutro',
  blob,
  tamanho = 'md',
  className,
}: {
  icone: LucideIcon
  tom?: keyof typeof TONS
  blob?: 1 | 2 | 3 | 4
  tamanho?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center transition-colors duration-300',
        tamanho === 'md' ? 'h-14 w-14' : 'h-12 w-12',
        blob ? `blob-${blob}` : 'rounded-2xl',
        TONS[tom],
        className,
      )}
    >
      <Icone className={tamanho === 'md' ? 'h-6 w-6' : 'h-[22px] w-[22px]'} strokeWidth={2} />
    </span>
  )
}
