import * as React from 'react'

type Manipulador = (evento: Event) => void

/**
 * Devolve o foco ao botão que abriu o diálogo ou a gaveta (WCAG 2.4.3).
 *
 * O Radix só devolve o foco a um `DialogTrigger`; aqui os diálogos abrem por
 * estado (`open={...}`), sem gatilho, e o foco cairia no `<body>`. Guardamos o
 * elemento focado na abertura e o refocamos no fechamento, compondo com os
 * manipuladores que quem chama passar (se ele já cancelou o padrão, respeitamos).
 */
export function useDevolverFoco(aoAbrir?: Manipulador, aoFechar?: Manipulador) {
  const origem = React.useRef<HTMLElement | null>(null)

  const onOpenAutoFocus = React.useCallback(
    (evento: Event) => {
      const ativo = document.activeElement
      origem.current = ativo instanceof HTMLElement && ativo !== document.body ? ativo : null
      aoAbrir?.(evento)
    },
    [aoAbrir],
  )

  const onCloseAutoFocus = React.useCallback(
    (evento: Event) => {
      aoFechar?.(evento)
      const alvo = origem.current
      origem.current = null
      if (!evento.defaultPrevented && alvo?.isConnected) {
        evento.preventDefault()
        alvo.focus()
      }
    },
    [aoFechar],
  )

  return { onOpenAutoFocus, onCloseAutoFocus }
}
