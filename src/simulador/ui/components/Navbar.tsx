import React from 'react'
import { Building2, Sun, Moon } from 'lucide-react'

export type ActiveTab = 'single' | 'portfolio' | 'comparative' | 'legal' | 'api'

interface NavbarProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className="border-b border-sim-border bg-canvas/95 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barra Superior Institucional */}
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          {/* Logo & Identidade Institucional */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 bg-accent-bg text-accent-fg rounded-xl shadow-xs flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-positive-text bg-positive-bg border border-positive-border px-2 py-0.5 rounded-full font-sim-mono">
                  LC 214/2025
                </span>
                <span className="text-xs text-text-muted font-medium hidden sm:inline">
                  Reforma Tributária do Consumo
                </span>
              </div>
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-text-primary tracking-tight leading-tight mt-0.5 truncate">
                Simulador Tributário Imobiliário
              </h1>
            </div>
          </div>

          {/* Ações Direitas: Seletor Dia/Noite e Menu Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Botão Dia e Noite */}
            <button
              onClick={onToggleTheme}
              type="button"
              className="min-h-[48px] px-3 sm:px-4 rounded-xl border border-sim-border-strong bg-surface text-text-primary hover:bg-surface-muted transition-colors flex items-center gap-2 text-base font-semibold shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-bg/40"
              aria-pressed={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 text-slate-700 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Modo Escuro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
