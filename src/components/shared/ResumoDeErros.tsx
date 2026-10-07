import { useEffect, useRef } from 'react'
import { CircleAlert } from 'lucide-react'

export interface ErroDoResumo {
  /** `id` do controle que tem o problema (o mesmo `id` passado ao `Field`). */
  campo: string
  /** Nome do campo, para o item dizer onde está o erro. */
  rotulo?: string
  mensagem: string
}

interface ResumoDeErrosProps {
  erros: ErroDoResumo[]
  /**
   * Conta de envios. Cada vez que sobe, e há erros, o resumo recebe o foco: o
   * leitor de tela anuncia o que houve e a pessoa vai direto ao primeiro item.
   * Não use o texto digitado como gatilho: o foco não pode sair do campo
   * enquanto a pessoa corrige.
   */
  tentativa: number
  className?: string
}

/** Leva o foco ao campo apontado, rolando até ele sem depender do endereço da página. */
function irParaCampo(id: string) {
  const alvo = document.getElementById(id)
  if (!alvo) return
  alvo.scrollIntoView({ block: 'center', behavior: 'auto' })
  alvo.focus({ preventScroll: true })
}

/**
 * Resumo de erros no topo do formulário (guia de estilo, seção 07).
 *
 * "Confira N campo(s)" com um link por campo. É `role="alert"`, então o leitor
 * de tela lê assim que aparece, e recebe o foco ao enviar. Cada link leva ao
 * controle, que traz a mensagem completa embaixo.
 */
export function ResumoDeErros({ erros, tentativa, className = '' }: ResumoDeErrosProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tentativa > 0 && erros.length > 0) ref.current?.focus()
    // O foco depende só do envio; mudar a lista enquanto a pessoa digita não rouba o foco.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativa])

  // Só depois de uma tentativa de envio: o aviso no campo, ao sair dele, basta até lá.
  if (tentativa === 0 || erros.length === 0) return null

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className={`flex gap-3 rounded-3xl border-2 border-destructive bg-destructive/10 px-5 py-4 ${className}`}
    >
      <CircleAlert className="mt-0.5 h-6 w-6 shrink-0 text-destructive" aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <strong className="text-base font-extrabold text-foreground">
          {erros.length === 1 ? 'Confira 1 campo' : `Confira ${erros.length} campos`}
        </strong>
        <ul className="flex flex-col gap-1">
          {erros.map((erro) => (
            <li key={erro.campo}>
              <a
                href={`#${erro.campo}`}
                onClick={(evento) => {
                  evento.preventDefault()
                  irParaCampo(erro.campo)
                }}
                className="inline-flex min-h-11 items-center text-base font-bold text-destructive underline"
              >
                {erro.rotulo ? `${erro.rotulo}: ${erro.mensagem}` : erro.mensagem}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
