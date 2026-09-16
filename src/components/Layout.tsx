import { useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { SidebarContent } from '@/components/SidebarContent'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { useTituloDaPagina } from '@/hooks/use-titulo-da-pagina'
import { cn } from '@/lib/utils'

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
  const isMobile = useIsMobile()
  useTituloDaPagina()

  const desktopSidebar = (
    <aside className="hidden lg:flex w-64 shrink-0">
      <SidebarContent />
    </aside>
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-navy-950">
      {/* Primeira parada do teclado: pular o menu inteiro e cair no conteúdo.
          Sem isso, cada troca de tela custa uma dezena de tabulações. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-gold-500 focus:px-5 focus:py-3 focus:text-base focus:font-bold focus:text-navy-950"
      >
        Ir para o conteúdo
      </a>

      {desktopSidebar}

      {/* Mobile & Tablet Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 sm:w-80 border-none p-0 bg-navy-800">
          <SheetHeader className="sr-only">
            <h2>Navegação Holding Aguiar</h2>
          </SheetHeader>
          <SidebarContent onItemClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main
          id="conteudo"
          tabIndex={-1}
          className="flex-1 overflow-y-auto bg-slate-50 focus:outline-none"
        >
          {/* Em monitor largo, conteúdo esticado de ponta a ponta obriga o olho
              a atravessar a tela para ligar o começo da linha ao fim. A faixa
              central resolve isso sem desperdiçar espaço: 1.600px comporta a
              tabela inteira com folga e mantém a linha em comprimento legível. */}
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}
