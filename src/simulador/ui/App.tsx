import React, { useEffect, useState } from 'react'
import { Navbar, ActiveTab } from './components/Navbar.tsx'
import { Footer } from './components/Footer.tsx'
import { ComoFunciona } from './components/ComoFunciona.tsx'
import { Blob } from '@/components/organico'

import { TransitionYearSelector } from './components/TransitionYearSelector.tsx'
import { TaxParametersCard } from './components/TaxParametersCard.tsx'
import { SimulationTabsNav, PUBLIC_TABS } from './components/SimulationTabsNav.tsx'
import { SingleSimulationTab } from './components/SingleSimulationTab.tsx'
import { PortfolioSimulationTab } from './components/PortfolioSimulationTab.tsx'
import { ComparativeAnalysisTab } from './components/ComparativeAnalysisTab.tsx'
import { LegalReferencesModal } from './components/LegalReferencesModal.tsx'
import { TransitionApiExplorer } from './components/TransitionApiExplorer.tsx'
import { ProfessionalModeBar } from './components/ProfessionalModeBar.tsx'
import { useProfessionalMode } from './useProfessionalMode.ts'
import { DEFAULT_TAX_PARAMETERS } from '../core/domain/constants.ts'
import { TransitionCalendar } from '../core/services/TransitionCalendar.ts'
import { TaxParameters, TransitionYear } from '../core/domain/types.ts'

const THEME_STORAGE_KEY = 'simulador-theme'

interface AppProps {
  /**
   * Embutido no shell do Gestão de imóveis (sidebar + header já na tela).
   * Nesse modo o simulador não desenha cabeçalho, rodapé nem ocupa a altura
   * toda — quem manda no scroll é o <main> do Layout.
   */
  embedded?: boolean
}

export const App: React.FC<AppProps> = ({ embedded = false }) => {
  const { isProfessional, exitProfessionalMode } = useProfessionalMode()
  const [activeTab, setActiveTab] = useState<ActiveTab>('single')

  // O tema do simulador é dele: a classe `dark` entra na própria raiz do
  // módulo, então alternar aqui não repinta o resto do sistema.
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'dark' || stored === 'light') return stored
    } catch {
      /* localStorage indisponível (modo privado, cookies bloqueados) */
    }
    return 'light'
  })

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* preferência não persiste, mas a sessão atual segue no tema escolhido */
    }
  }

  // Sem o seletor à vista, a interface pública apura pelo ano corrente da
  // transição — é o número que vale para quem abre o site hoje.
  const [params, setParams] = useState<TaxParameters>({
    ...DEFAULT_TAX_PARAMETERS,
    transitionYear: TransitionCalendar.getCurrentTransitionYear(),
  })

  // Sair do modo profissional não pode deixar o usuário preso numa aba reservada.
  useEffect(() => {
    if (!isProfessional && !PUBLIC_TABS.includes(activeTab)) {
      setActiveTab('single')
    }
  }, [isProfessional, activeTab])

  const handleYearChange = (year: TransitionYear) => {
    setParams((prev) => ({ ...prev, transitionYear: year }))
  }

  const rootClass = [
    'simulador-theme',
    theme === 'dark' ? 'dark' : '',
    embedded ? 'w-full' : 'relative min-h-screen flex flex-col overflow-x-hidden',
    'bg-canvas text-text-primary transition-colors',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <SimulationTabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isProfessional={isProfessional}
      />

      <div
        id={`painel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`aba-${activeTab}`}
        tabIndex={-1}
      >
        {activeTab === 'single' && (
          <SingleSimulationTab params={params} isProfessional={isProfessional} />
        )}
        {activeTab === 'portfolio' && <PortfolioSimulationTab params={params} />}
        {activeTab === 'comparative' && <ComparativeAnalysisTab params={params} />}
        {isProfessional && activeTab === 'legal' && <LegalReferencesModal />}
        {isProfessional && activeTab === 'api' && <TransitionApiExplorer params={params} />}
      </div>

      {isProfessional && (
        <div className="pt-2 space-y-6">
          <TransitionYearSelector
            selectedYear={params.transitionYear}
            onSelectYear={handleYearChange}
            referenceRate={params.referenceRate}
            cbsShare={params.cbsShare}
            ibsShare={params.ibsShare}
            discountPercent={params.realEstateDiscountPercent}
          />
          <TaxParametersCard params={params} onChange={setParams} />
        </div>
      )}
    </>
  )

  if (embedded) {
    return (
      <div className={rootClass}>
        {isProfessional && <ProfessionalModeBar onExit={exitProfessionalMode} />}
        <div id="simulador" className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className={rootClass}>
      <a
        href="#simulador"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-accent-bg focus:px-4 focus:py-3 focus:text-base focus:font-semibold focus:text-accent-fg"
      >
        Ir para a simulação
      </a>

      {/* Duas manchas de fundo no simulador público (decorativas). */}
      <Blob
        forma={1}
        cor="primary"
        className="-left-28 -top-16 h-[480px] w-[520px] opacity-[0.16] blur-[80px]"
      />
      <Blob
        forma={2}
        cor="secondary"
        className="-right-36 top-60 h-[440px] w-[480px] opacity-[0.18] blur-[80px]"
      />

      <Navbar theme={theme} onToggleTheme={toggleTheme} />

      {isProfessional && <ProfessionalModeBar onExit={exitProfessionalMode} />}

      <main
        id="simulador"
        className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-12 space-y-8"
      >
        <div className="flex max-w-3xl flex-col gap-4 px-2 sm:gap-5 sm:px-0">
          <span className="self-start rounded-full bg-accent-bg/10 px-4 py-2 text-sm font-extrabold text-positive-text">
            Reforma tributária na locação
          </span>
          <h1 className="text-[2.125rem] leading-[1.1] text-text-primary sm:text-5xl lg:text-6xl lg:leading-[1.04]">
            Quanto a reforma tributária pesa no seu aluguel?
          </h1>
          <p className="max-w-[540px] text-base leading-relaxed text-text-secondary sm:text-xl">
            Informe o valor mensal e veja uma estimativa do IBS e da CBS, já com o redutor de 70% da
            locação.
          </p>
        </div>
        {content}
        <ComoFunciona />
      </main>

      <Footer onSelectTab={setActiveTab} isProfessional={isProfessional} />
    </div>
  )
}
