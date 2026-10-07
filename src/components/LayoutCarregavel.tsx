import { lazy, Suspense, type ComponentProps } from 'react'
import { TelaCarregando } from '@/components/TelaCarregando'

/**
 * O shell logado (menu, cabeçalho, ícones e todos os componentes de tela) vira um
 * pacote à parte: quem só abre `/`, `/login` ou o simulador deslogado não o baixa.
 */
const Layout = lazy(() => import('@/components/Layout'))

export function LayoutCarregavel(props: ComponentProps<typeof Layout>) {
  return (
    <Suspense fallback={<TelaCarregando />}>
      <Layout {...props} />
    </Suspense>
  )
}
