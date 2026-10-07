import React, { useState, useEffect } from 'react'
import { ChevronUp, ShieldCheck } from 'lucide-react'
import { CreditoAguia, LogoSistema } from '@/components/organico'
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
    <footer className="relative mt-auto px-4 py-10 transition-colors sm:px-6 lg:px-16">
      <div className="mx-auto max-w-7xl border-t border-dashed border-sim-border pt-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-sim-border">
          <div className="space-y-1.5 max-w-lg">
            <div className="flex items-center gap-2.5">
              <LogoSistema tamanho="sm" />
              <span className="font-serif text-lg font-bold text-text-primary">
                Simulador IBS/CBS
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
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <p className="text-text-secondary">
              Estimativa para orientação. Confirme o enquadramento com a sua contabilidade.
            </p>
            <CreditoAguia className="text-text-secondary" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <ShieldCheck className="h-4 w-4 text-positive-text" aria-hidden="true" />
            <span>Conformidade LC 214/2025</span>
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent-bg text-accent-fg shadow-soft transition-all hover:scale-105 active:scale-95"
        >
          <ChevronUp className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </footer>
  )
}
