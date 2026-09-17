import React, { useState, useEffect } from 'react'
import { Building2, ChevronUp, ShieldCheck } from 'lucide-react'
import { ActiveTab } from './Navbar.tsx'

interface FooterProps {
  onSelectTab?: (tab: ActiveTab) => void
  isProfessional?: boolean
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, isProfessional = false }) => {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleTabClick = (tab: ActiveTab, e: React.MouseEvent) => {
    e.preventDefault()
    if (onSelectTab) {
      onSelectTab(tab)
    }
    const el = document.getElementById('simulador')
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-surface border-t border-sim-border py-10 px-4 sm:px-6 lg:px-8 mt-auto relative transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-sim-border">
          <div className="space-y-1.5 max-w-lg">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-accent-bg text-accent-fg rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-serif font-semibold text-base text-text-primary tracking-tight">
                Plataforma Tributária Imobiliária
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Modelagem determinística para locadores PF, PJ e administradoras conforme Lei
              Complementar nº 214/2025 e EC nº 132/2023.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-text-secondary">
            <a
              href="#simulador"
              onClick={(e) => handleTabClick('single', e)}
              className="hover:text-text-primary transition-colors"
            >
              Individual
            </a>
            <span className="text-text-muted ">&bull;</span>
            <a
              href="#simulador"
              onClick={(e) => handleTabClick('portfolio', e)}
              className="hover:text-text-primary transition-colors"
            >
              Portfólio
            </a>
            <span className="text-text-muted ">&bull;</span>
            <a
              href="#simulador"
              onClick={(e) => handleTabClick('comparative', e)}
              className="hover:text-text-primary transition-colors"
            >
              Comparativo
            </a>
            {isProfessional && (
              <>
                <span className="text-text-muted ">&bull;</span>
                <a
                  href="#simulador"
                  onClick={(e) => handleTabClick('legal', e)}
                  className="hover:text-text-primary transition-colors"
                >
                  Fundamentação Jurídica
                </a>
                <span className="text-text-muted ">&bull;</span>
                <a
                  href="#simulador"
                  onClick={(e) => handleTabClick('api', e)}
                  className="hover:text-text-primary transition-colors"
                >
                  API
                </a>
              </>
            )}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-text-muted">
          <p className="text-center sm:text-left">
            &copy; 2026 &bull; Apuração Determinística &bull; Precisão Centesimal
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-sim-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-positive-text" />
            <span>Conformidade LC 214/2025</span>
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
          className="fixed bottom-6 right-6 p-2.5 rounded-full bg-accent-bg text-accent-fg shadow-md hover:bg-accent-bg/90 transition-all z-40 active:scale-95"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}
    </footer>
  )
}
