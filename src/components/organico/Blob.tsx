import { cn } from '@/lib/utils'

const CORES = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
} as const

interface BlobProps {
  forma?: 1 | 2 | 3 | 4
  cor?: keyof typeof CORES
  /** Classes de posição, tamanho, opacidade e desfoque (ex.: "-right-24 -top-20 h-72 w-80 opacity-20 blur-3xl"). */
  className?: string
}

/**
 * Mancha orgânica de fundo. Puramente decorativa: escondida de leitores de
 * tela e sem eventos de ponteiro. O pai precisa de `relative overflow-hidden`.
 */
export function Blob({ forma = 1, cor = 'primary', className }: BlobProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute opacity-20 blur-3xl',
        `blob-${forma}`,
        CORES[cor],
        className,
      )}
    />
  )
}
