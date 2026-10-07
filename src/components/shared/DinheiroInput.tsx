import { forwardRef, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { lerValorEmReais, valorParaCampo } from '@/lib/dinheiro'

type Props = Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange' | 'inputMode'> & {
  value: string
  onValueChange: (valor: string) => void
}

/**
 * Campo de valor em reais.
 *
 * Texto com teclado numérico (e não `type="number"`): o campo numérico do
 * navegador troca vírgula por ponto conforme o idioma e transformava
 * `1.234,56` em 1,23 (FIN-05). Aqui a pessoa digita como está acostumada e,
 * ao sair do campo, o valor aparece como será gravado ("1.234,56"). Se o texto
 * não for um valor, fica como foi digitado e o formulário explica o erro.
 */
export const DinheiroInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onValueChange, onBlur, placeholder = '0,00', ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onBlur={(e) => {
        const leitura = lerValorEmReais(value)
        if (leitura.ok) onValueChange(valorParaCampo(leitura.valor))
        onBlur?.(e)
      }}
    />
  ),
)
DinheiroInput.displayName = 'DinheiroInput'
