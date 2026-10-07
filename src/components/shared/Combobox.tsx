import { forwardRef, useState, type ComponentPropsWithoutRef } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

export interface OpcaoDoCombobox {
  valor: string
  /** Nome completo: no painel ele quebra linha em vez de ser cortado. */
  rotulo: string
  /** Linha de apoio abaixo do nome (documento, endereço). Também entra na busca. */
  detalhe?: string
}

interface ComboboxProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'onChange' | 'children'> {
  opcoes: OpcaoDoCombobox[]
  valor: string
  onValorChange: (valor: string) => void
  placeholder?: string
  /** Texto do campo de busca dentro do painel. */
  rotuloDaBusca?: string
  vazio?: string
}

/**
 * Seletor com busca, em painel (regra Q32 do handoff).
 *
 * O `<select>` nativo não quebra linha e cortava "Holding Aguiar Participações
 * Ltda" no celular. Lista longa (inquilinos) usa este seletor: o nome inteiro
 * aparece no painel, com o documento embaixo, e a pessoa pode digitar para
 * achar. O gatilho segue o padrão ARIA de caixa de combinação, então o `Field`
 * liga o rótulo e a mensagem de erro a ele.
 */
export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      opcoes,
      valor,
      onValorChange,
      placeholder = 'Escolha uma opção',
      rotuloDaBusca = 'Buscar',
      vazio = 'Nada encontrado. Confira a escrita.',
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [aberto, setAberto] = useState(false)
    const escolhida = opcoes.find((o) => o.valor === valor)

    return (
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            role="combobox"
            aria-expanded={aberto}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              'flex min-h-12 w-full items-center justify-between gap-2 rounded-full border-[1.5px] border-input bg-card/60 px-5 py-2 text-left text-base focus-visible:border-primary aria-[invalid=true]:border-2 aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            {...props}
          >
            <span className={cn('min-w-0 flex-1 truncate', !escolhida && 'text-muted-foreground')}>
              {escolhida ? escolhida.rotulo : placeholder}
            </span>
            <ChevronDown className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] min-w-[min(20rem,calc(100vw-2rem))] overflow-hidden p-0"
        >
          <Command className="rounded-3xl bg-transparent">
            <CommandInput placeholder={rotuloDaBusca} aria-label={rotuloDaBusca} className="h-12 text-base" />
            <CommandList className="max-h-72 p-2">
              <CommandEmpty className="px-3 py-6 text-center text-base text-accent-foreground">
                {vazio}
              </CommandEmpty>
              {opcoes.map((opcao) => (
                <CommandItem
                  key={opcao.valor}
                  value={`${opcao.rotulo} ${opcao.detalhe ?? ''}`}
                  onSelect={() => {
                    onValorChange(opcao.valor)
                    setAberto(false)
                  }}
                  className="min-h-12 items-start gap-3 rounded-2xl px-3 py-2.5 text-base data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground"
                >
                  <Check
                    className={cn(
                      '!size-5 mt-0.5 text-primary',
                      opcao.valor === valor ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-bold leading-snug">{opcao.rotulo}</span>
                    {opcao.detalhe && (
                      <span className="text-sm text-accent-foreground">{opcao.detalhe}</span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)
Combobox.displayName = 'ComboboxTrigger'
