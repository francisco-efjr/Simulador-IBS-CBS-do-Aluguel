import { Suspense, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { TelaCarregando } from '@/components/TelaCarregando'
import { SidebarContent } from '@/components/SidebarContent'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Blob } from '@/components/organico'
import { useTituloDaPagina } from '@/hooks/use-titulo-da-pagina'

interface LayoutProps {
  /**
   * Conteúdo a renderizar no lugar do <Outlet />. Usado por rotas que não são
   * filhas do Layout mas ainda precisam do shell — hoje, o /simulador, que é
   * público e só ganha sidebar quando há sessão aberta.
   */
  children?: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  useTituloDaPagina()

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      {/* Primeira parada do teclado: pular o menu inteiro e cair no conteúdo.
          Sem isso, cada troca de tela custa uma dezena de tabulações. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-6 focus:py-3 focus:text-base focus:font-extrabold focus:text-primary-foreground"
      >
        Ir para o conteúdo
      </a>

      {/* Computador (≥ 1024px): menu lateral fixo de 288px com rolagem própria. */}
      <aside className="hidden w-72 shrink-0 border-r border-border/60 bg-sunken px-4 py-7 lg:flex">
        <SidebarContent />
      </aside>

      {/* Celular e tablet: gaveta à esquerda. Foco preso, Esc fecha e o foco
          volta ao botão do menu (Radix); fecha também ao navegar. */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="flex w-[min(330px,85vw)] flex-col bg-background px-4 py-6 sm:max-w-none"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu principal</SheetTitle>
            <SheetDescription>Navegação entre as telas do sistema</SheetDescription>
          </SheetHeader>
          <SidebarContent emGaveta onItemClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main
          id="conteudo"
          tabIndex={-1}
          className="relative flex-1 overflow-y-auto overflow-x-hidden focus:outline-none"
        >
          <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
          {/* Mancha de fundo, uma por tela interna (decorativa). */}
          {/* A moldura recorta a mancha: sem ela a largura rolável do <main> cresce. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden"
          >
            <Blob
              forma={1}
              cor="secondary"
              className="-right-24 top-10 h-[400px] w-[460px] opacity-[0.14] blur-[70px]"
            />
          </div>
          {/* Em monitor largo o conteúdo fica numa faixa central de 1.280px. */}
          <div className="relative mx-auto w-full max-w-[1376px] px-4 pb-14 pt-5 lg:px-12 lg:pt-4">
            <Suspense fallback={<TelaCarregando variante="conteudo" />}>
              {children ?? <Outlet />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
