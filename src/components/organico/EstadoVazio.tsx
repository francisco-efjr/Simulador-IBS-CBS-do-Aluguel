import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Blob } from './Blob'

/**
 * Estado vazio (seção 15 do handoff Fase 2): ícone em blob, frase, motivo e uma
 * ação. Serve para "ainda não há nada" e para "a busca não achou". O título é
 * `h2` — a tela já tem o seu `h1`.
 */
export function EstadoVazio({
  icone: Icone,
  titulo,
  descricao,
  acoes,
  className,
}: {
  icone: LucideIcon
  titulo: string
  descricao: ReactNode
  /** Botões (um primário e, no máximo, um secundário). */
  acoes?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-4 overflow-hidden px-5 py-9 text-center sm:px-10 sm:py-14',
        className,
      )}
    >
      <Blob forma={1} className="left-1/2 top-2 h-[200px] w-[240px] -translate-x-1/2 opacity-[.14] sm:h-[260px] sm:w-[320px]" />
      <span
        aria-hidden="true"
        className="blob-1 relative flex h-24 w-24 -rotate-6 items-center justify-center bg-primary/[.12] text-primary sm:h-[120px] sm:w-[120px]"
      >
        <Icone className="h-11 w-11 sm:h-[52px] sm:w-[52px]" strokeWidth={1.75} />
      </span>
      <h2 className="relative text-balance font-display text-[26px] font-bold leading-tight sm:text-[30px]">
        {titulo}
      </h2>
      <p className="relative max-w-[420px] text-base leading-normal text-accent-foreground">{descricao}</p>
      {acoes && (
        <div className="relative mt-1 flex flex-col items-center gap-3 sm:flex-row">{acoes}</div>
      )}
    </div>
  )
}
