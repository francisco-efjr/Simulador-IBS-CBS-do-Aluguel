import { cn } from '@/lib/utils'

export interface OpcaoFiltro<T extends string> {
  valor: T
  rotulo: string
  contagem?: number
}

/**
 * Chips de filtro (FilterChips do handoff). Botões com `aria-pressed` num grupo
 * rotulado; no celular rolam na horizontal sem barra e nunca quebram linha.
 */
export function FiltroChips<T extends string>({
  rotulo,
  opcoes,
  valor,
  onChange,
  className,
}: {
  rotulo: string
  opcoes: OpcaoFiltro<T>[]
  valor: T
  onChange: (valor: T) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={rotulo}
      className={cn('sem-barra -mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5 pt-0.5', className)}
    >
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor
        return (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(opcao.valor)}
            className={cn(
              'h-11 flex-none whitespace-nowrap rounded-full border-[1.5px] px-5 text-sm font-extrabold transition-all duration-300 active:scale-95',
              ativo
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-transparent text-foreground hover:bg-primary/10',
            )}
          >
            {opcao.rotulo}
            {opcao.contagem !== undefined && <span className="numero"> · {opcao.contagem}</span>}
          </button>
        )
      })}
    </div>
  )
}
