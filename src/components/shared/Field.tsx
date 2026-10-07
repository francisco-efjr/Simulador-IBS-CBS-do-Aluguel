import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface FieldProps {
  label: string
  error?: string
  children: ReactNode
  className?: string
  /** Texto de apoio abaixo do campo (formato esperado, exemplo, unidade). */
  hint?: string
  /**
   * Campo que pode ficar em branco. Campos sem marcação são obrigatórios; os
   * outros levam "(opcional)" no rótulo (sem asterisco, como no guia de estilo).
   */
  opcional?: boolean
  /** Identificação fixa do controle, para o resumo de erros apontar para ele. */
  id?: string
  /**
   * O erro é anunciado ao aparecer (`role="alert"`). Desligue quando o formulário
   * tem `ResumoDeErros`, que já anuncia e leva o foco: evita ler tudo duas vezes.
   */
  anunciar?: boolean
}

/** Elementos que podem receber o `id` e responder por `label[for]`. */
const CONTROLES_NATIVOS = new Set(['input', 'select', 'textarea'])

function pareceControle(node: ReactElement): 'nativo' | 'combobox' | null {
  if (typeof node.type === 'string') {
    return CONTROLES_NATIVOS.has(node.type) ? 'nativo' : null
  }
  // Componentes encaminham as props ao elemento real; identificamos pelo nome
  // porque é o único dado estável que o React expõe sobre eles.
  const nome =
    (node.type as { displayName?: string; name?: string })?.displayName ||
    (node.type as { name?: string })?.name ||
    ''
  if (/Trigger/i.test(nome)) return 'combobox'
  // `Select` sozinho é a raiz do Radix, que não vira nada no DOM: parar nela
  // deixaria o gatilho sem nome. Quem responde pelo campo é o Trigger.
  if (/(Input|Textarea)$/i.test(nome)) return 'nativo'
  return null
}

/**
 * Percorre a árvore até achar o controle e injeta a identificação nele.
 *
 * O caso que obriga a busca em profundidade é o `Select` do Radix: o filho
 * direto do campo é a raiz do componente, que não vira elemento no DOM — quem
 * recebe o foco (e precisa do nome acessível) é o `SelectTrigger` lá dentro.
 */
function identificarControle(
  node: ReactNode,
  ids: { campo: string; rotulo: string; descricao?: string },
  invalido: boolean,
  profundidade = 0,
): ReactNode {
  if (profundidade > 4 || !isValidElement(node)) return node

  const tipo = pareceControle(node)
  if (tipo) {
    const props: Record<string, unknown> = {
      id: ids.campo,
      'aria-invalid': invalido || undefined,
      'aria-describedby': ids.descricao,
    }
    // `combobox` não recebe nome do próprio conteúdo (regra da ARIA), então o
    // rótulo precisa ser apontado explicitamente — sem isso o leitor de tela
    // anuncia "caixa de combinação" e nada mais.
    if (tipo === 'combobox') props['aria-labelledby'] = `${ids.rotulo} ${ids.campo}`
    return cloneElement(node, props)
  }

  const filhos = (node.props as { children?: ReactNode })?.children
  if (!filhos) return node

  let injetado = false
  const novosFilhos = Array.isArray(filhos)
    ? filhos.map((filho) => {
        if (injetado) return filho
        const resultado = identificarControle(filho, ids, invalido, profundidade + 1)
        if (resultado !== filho) injetado = true
        return resultado
      })
    : identificarControle(filhos, ids, invalido, profundidade + 1)

  return cloneElement(node, undefined, novosFilhos)
}

/**
 * Campo de formulário com rótulo, apoio e erro ligados ao controle.
 *
 * A associação é programática, não apenas visual: `label[for]` dá nome ao campo
 * para o leitor de tela e faz o toque no rótulo focar o controle — área de
 * acerto maior para quem tem menos precisão no gesto. O erro entra em
 * `aria-describedby` e é anunciado assim que aparece.
 */
export function Field({ label, error, children, className, hint, opcional, id, anunciar = true }: FieldProps) {
  const gerado = useId()
  const idCampo = id ?? `campo-${gerado}`
  const idRotulo = `rotulo-${gerado}`
  const idErro = `erro-${gerado}`
  const idHint = `apoio-${gerado}`

  const descricao = [hint ? idHint : null, error ? idErro : null].filter(Boolean).join(' ')

  return (
    <div className={`space-y-1.5 w-full ${className || ''}`}>
      <Label
        id={idRotulo}
        htmlFor={idCampo}
        className="text-base font-bold leading-snug text-foreground"
      >
        {label}
        {opcional && <span className="ml-1.5 font-semibold text-accent-foreground">(opcional)</span>}
      </Label>
      <div className="w-full">
        {identificarControle(
          children,
          { campo: idCampo, rotulo: idRotulo, descricao: descricao || undefined },
          Boolean(error),
        )}
      </div>
      {hint && (
        <p id={idHint} className="text-sm text-accent-foreground">
          {hint}
        </p>
      )}
      {error && (
        <MensagemDeErro id={idErro} anunciar={anunciar}>
          {error}
        </MensagemDeErro>
      )}
    </div>
  )
}

/**
 * Mensagem de erro do campo: ícone + texto na cor siena (5,0:1), nunca só cor.
 * Fica ligada ao campo por `aria-describedby`; o aviso na hora do envio vem do
 * resumo de erros no topo do formulário.
 */
export function MensagemDeErro({
  id,
  children,
  className = '',
  anunciar = true,
}: {
  id?: string
  children: ReactNode
  className?: string
  anunciar?: boolean
}) {
  return (
    <p
      id={id}
      role={anunciar ? 'alert' : undefined}
      className={`flex items-start gap-2 text-sm font-bold text-destructive ${className}`}
    >
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
