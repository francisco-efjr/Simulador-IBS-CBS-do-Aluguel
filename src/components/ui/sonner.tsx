/* Toaster Component - avisos do sistema (exposes Toaster) */
import './sonner.css'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Toaster as Sonner } from 'sonner'
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert, X } from 'lucide-react'

type ToasterProps = React.ComponentProps<typeof Sonner>

/** Aviso recém-criado sobrevive à troca de tela (ex.: "Contrato salvo" e volta à lista). */
const TOLERANCIA_APOS_NAVEGAR_MS = 2500

/**
 * Cuida do que o Sonner não faz sozinho (guia de estilo, seção 07):
 * - papéis certos: sucesso e informação são `status` (lidos com calma); falha
 *   é `alert` (lida na hora). O Sonner marca só a região como `aria-live`;
 * - o aviso antigo sai quando a pessoa muda de tela.
 */
function useAvisosAcessiveis() {
  const { pathname } = useLocation()
  // Horário em que cada aviso apareceu, para a troca de tela saber quais são antigos.
  const nascimento = useRef(new WeakMap<Element, number>())

  useEffect(() => {
    const marcar = (li: Element) => {
      if (!nascimento.current.has(li)) nascimento.current.set(li, Date.now())
      const falha = li.getAttribute('data-type') === 'error'
      li.setAttribute('role', falha ? 'alert' : 'status')
      li.setAttribute('aria-live', falha ? 'assertive' : 'polite')
      li.setAttribute('aria-atomic', 'true')
    }

    const varrer = () => document.querySelectorAll('li[data-sonner-toast]').forEach(marcar)
    varrer()
    const observador = new MutationObserver(varrer)
    observador.observe(document.body, { childList: true, subtree: true })
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    document.querySelectorAll('li[data-sonner-toast]').forEach((li) => {
      const criado = nascimento.current.get(li) ?? 0
      if (Date.now() - criado > TOLERANCIA_APOS_NAVEGAR_MS) {
        li.querySelector<HTMLButtonElement>('[data-close-button]')?.click()
      }
    })
  }, [pathname])
}

const Toaster = ({ ...props }: ToasterProps) => {
  useAvisosAcessiveis()

  return (
    <Sonner
      theme="light"
      className="toaster group"
      // Não somem sozinhos: ficam até a pessoa fechar (Q29, WCAG 2.2.1).
      duration={Infinity}
      closeButton
      expand
      visibleToasts={5}
      mobileOffset={16}
      icons={{
        success: <CircleCheck aria-hidden="true" className="h-6 w-6" />,
        error: <CircleAlert aria-hidden="true" className="h-6 w-6" />,
        warning: <TriangleAlert aria-hidden="true" className="h-6 w-6" />,
        info: <Info aria-hidden="true" className="h-6 w-6" />,
        loading: <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" />,
        close: <X aria-hidden="true" className="h-5 w-5" />,
      }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: 'Fechar aviso',
        classNames: {
          toast:
            'group/aviso flex w-full items-center gap-3.5 rounded-3xl border border-border/60 bg-card py-4 pl-4 pr-16 text-foreground shadow-float sm:w-[var(--width)]',
          icon: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/[.14] text-success-ink group-data-[type=error]/aviso:bg-destructive/[.14] group-data-[type=error]/aviso:text-destructive group-data-[type=warning]/aviso:bg-secondary/20 group-data-[type=warning]/aviso:text-warning-ink',
          content: 'flex min-w-0 flex-1 flex-col gap-0.5',
          title: 'text-[1.0625rem] font-extrabold leading-snug',
          description: 'text-[0.9375rem] leading-snug text-accent-foreground',
          actionButton:
            'inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-secondary-ink px-4 text-[0.9375rem] font-extrabold text-secondary-ink hover:bg-secondary-ink hover:text-white',
          cancelButton:
            'inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border-2 border-secondary-ink px-5 text-[0.9375rem] font-extrabold text-secondary-ink',
          closeButton:
            'absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-accent-foreground hover:bg-primary/10 hover:text-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
