import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Blob } from './Blob'

interface PaginaDeErroProps {
  /** Rótulo em caixa alta acima do título ("Erro 404"). */
  codigo: string
  /** Título da página (único `<h1>`). */
  titulo: string
  descricao: ReactNode
  icone: LucideIcon
  /** `musgo` para "não encontrada"; `argila` para falha do sistema. */
  tom?: 'musgo' | 'argila'
  /** Botões: o primeiro é a ação principal. */
  acoes: ReactNode
}

/**
 * Página inteira de erro (seção 08 do handoff): 404 e falha do sistema.
 * Celular: coluna centrada com ícone em blob. Computador: duas colunas, com o
 * ícone grande à esquerda. Sem menu: serve também a quem ainda não entrou.
 */
export function PaginaDeErro({
  codigo,
  titulo,
  descricao,
  icone: Icone,
  tom = 'musgo',
  acoes,
}: PaginaDeErroProps) {
  const argila = tom === 'argila'
  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden bg-background px-7 py-10 lg:px-24 lg:py-16">
      <Blob
        forma={argila ? 2 : 1}
        cor={argila ? 'secondary' : 'primary'}
        className={cn(
          argila ? '-left-24 top-14' : '-right-20 top-20',
          'h-[280px] w-[300px] opacity-[.16] blur-[50px] lg:-bottom-28 lg:left-[-5rem] lg:top-auto lg:h-[460px] lg:w-[520px] lg:opacity-[.14] lg:blur-[80px]',
        )}
      />
      <div className="relative mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-2 lg:items-center lg:gap-16">
        <span
          aria-hidden="true"
          className={cn(
            'flex h-24 w-24 items-center justify-center lg:h-[300px] lg:w-[300px] lg:justify-self-center',
            argila
              ? 'blob-2 rotate-[5deg] bg-secondary/20 text-warning-ink'
              : 'blob-1 -rotate-6 bg-primary/[.12] text-primary',
          )}
        >
          <Icone className="h-11 w-11 lg:h-[120px] lg:w-[120px]" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-5">
          <p className="text-sm font-extrabold uppercase tracking-[.08em] text-muted-foreground">
            {codigo}
          </p>
          <h1 className="text-balance text-[2rem] leading-[1.15] lg:text-[3.25rem] lg:leading-[1.05]">
            {titulo}
          </h1>
          <p className="text-[1.0625rem] leading-normal text-accent-foreground lg:text-[1.1875rem] lg:leading-relaxed">
            {descricao}
          </p>
          <div className="mt-2 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3 [&>*]:min-h-14 [&>*]:whitespace-nowrap [&>*]:text-lg sm:[&>*]:px-8">
            {acoes}
          </div>
        </div>
      </div>
    </main>
  )
}
