interface TelaCarregandoProps {
  /** Texto lido pelo leitor de tela e mostrado abaixo do indicador. */
  mensagem?: string
  /** `pagina` ocupa a tela toda; `conteudo` cabe dentro do shell, ao lado do menu. */
  variante?: 'pagina' | 'conteudo'
}

/**
 * Espera enquanto o código de uma tela é baixado (React.lazy).
 *
 * `role="status"` avisa o leitor de tela sem roubar o foco, e a altura mínima
 * reserva o espaço para a tela não "pular" quando o conteúdo chegar.
 */
export function TelaCarregando({
  mensagem = 'Carregando…',
  variante = 'pagina',
}: TelaCarregandoProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        variante === 'pagina'
          ? 'flex min-h-dvh w-full items-center justify-center bg-slate-50'
          : 'flex min-h-[50vh] w-full items-center justify-center'
      }
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-600">{mensagem}</p>
      </div>
    </div>
  )
}
