import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { LogoSistema } from '@/components/organico'

export type ActiveTab = 'single' | 'portfolio' | 'comparative' | 'legal' | 'api'

interface NavbarProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

/**
 * Navegação pública do simulador (tela 05 do handoff): pílula flutuante com a
 * marca, os atalhos da página e o botão Entrar. Link comum (não do roteador):
 * o simulador também roda solto, nos testes, sem roteador por perto.
 */
export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className="sticky top-3 z-50 px-4 pt-3 sm:px-6">
      <nav
        aria-label="Simulador"
        className="mx-auto flex max-w-[1000px] items-center gap-2 rounded-full border border-sim-border/60 bg-surface/75 py-1.5 pl-2.5 pr-1.5 shadow-soft backdrop-blur-md sm:gap-4 sm:py-2 sm:pl-4 sm:pr-2"
      >
        <a href="#simulador" className="flex min-w-0 flex-1 items-center gap-2.5 no-underline">
          <LogoSistema tamanho="sm" />
          <span className="truncate font-serif text-lg font-bold text-text-primary sm:text-xl">
            Simulador IBS/CBS
          </span>
        </a>
        <a
          href="#como-funciona"
          className="hidden min-h-11 items-center px-2.5 text-base font-bold text-text-primary no-underline hover:underline md:flex"
        >
          Como funciona
        </a>
        <button
          onClick={onToggleTheme}
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-accent-bg/10"
          aria-pressed={theme === 'dark'}
          aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        <a
          href="/login"
          className="flex h-11 shrink-0 items-center rounded-full bg-accent-bg px-5 text-base font-extrabold text-accent-fg no-underline shadow-soft transition-transform duration-300 hover:scale-105 active:scale-95 sm:h-12 sm:px-7"
        >
          Entrar
        </a>
      </nav>
    </header>
  )
}
