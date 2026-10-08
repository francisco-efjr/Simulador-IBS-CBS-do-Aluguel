import { Circle, CircleCheck } from 'lucide-react'
import { regrasDaSenha } from '@/lib/senha'

/**
 * Lista de regras da senha que marca enquanto a pessoa digita (seção 11).
 *
 * Cada regra tem ícone, cor e texto, e o leitor de tela ouve "Atendido:" ou
 * "Falta:" antes dela (a marca visual sozinha não chega a quem não enxerga).
 * `aria-live="polite"` só fala quando uma regra muda de estado, não a cada letra.
 */
export function RegrasDaSenha({ senha, confirmacao }: { senha: string; confirmacao: string }) {
  return (
    <ul
      aria-live="polite"
      aria-label="Regras da senha"
      className="flex flex-col gap-2 rounded-[1.25rem_1.75rem_1.25rem_1.25rem] bg-surface-sunken px-[18px] py-3.5"
    >
      {regrasDaSenha(senha, confirmacao).map((regra) => (
        <li
          key={regra.id}
          className={`flex items-center gap-2.5 text-base font-bold ${
            regra.atendida ? 'text-success-ink' : 'text-accent-foreground'
          }`}
        >
          {regra.atendida ? (
            <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <Circle className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <span className="sr-only">{regra.atendida ? 'Atendido: ' : 'Falta: '}</span>
          {regra.texto}
        </li>
      ))}
    </ul>
  )
}
