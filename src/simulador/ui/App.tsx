import React, { useEffect, useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';

import { TransitionYearSelector } from './components/TransitionYearSelector.tsx';
import { TaxParametersCard } from './components/TaxParametersCard.tsx';
import { SimulationTabsNav, PUBLIC_TABS } from './components/SimulationTabsNav.tsx';
import { SingleSimulationTab } from './components/SingleSimulationTab.tsx';
import { PortfolioSimulationTab } from './components/PortfolioSimulationTab.tsx';
import { ComparativeAnalysisTab } from './components/ComparativeAnalysisTab.tsx';
import { LegalReferencesModal } from './components/LegalReferencesModal.tsx';
import { TransitionApiExplorer } from './components/TransitionApiExplorer.tsx';
import { ProfessionalModeBar } from './components/ProfessionalModeBar.tsx';
import { useProfessionalMode } from './useProfessionalMode.ts';
import { DEFAULT_TAX_PARAMETERS } from '../core/domain/constants.ts';
import { TransitionCalendar } from '../core/services/TransitionCalendar.ts';
import { TaxParameters, TransitionYear } from '../core/domain/types.ts';

const THEME_STORAGE_KEY = 'simulador-theme';

interface AppProps {
  /**
   * Embutido no shell do Controle de Imóveis (sidebar + header já na tela).
   * Nesse modo o simulador não desenha cabeçalho, rodapé nem ocupa a altura
   * toda — quem manda no scroll é o <main> do Layout.
   */
  embedded?: boolean;
}

export const App: React.FC<AppProps> = ({ embedded = false }) => {
  const { isProfessional, exitProfessionalMode } = useProfessionalMode();
  const [activeTab, setActiveTab] = useState<ActiveTab>('single');

  // O tema do simulador é dele: a classe `dark` entra na própria raiz do
  // módulo, então alternar aqui não repinta o resto do sistema.
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      /* localStorage indisponível (modo privado, cookies bloqueados) */
    }
    return 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* preferência não persiste, mas a sessão atual segue no tema escolhido */
    }
  };

  // Sem o seletor à vista, a interface pública apura pelo ano corrente da
  // transição — é o número que vale para quem abre o site hoje.
  const [params, setParams] = useState<TaxParameters>({
    ...DEFAULT_TAX_PARAMETERS,
    transitionYear: TransitionCalendar.getCurrentTransitionYear(),
  });

  // Sair do modo profissional não pode deixar o usuário preso numa aba reservada.
  useEffect(() => {
    if (!isProfessional && !PUBLIC_TABS.includes(activeTab)) {
      setActiveTab('single');
    }
  }, [isProfessional, activeTab]);

  const handleYearChange = (year: TransitionYear) => {
    setParams((prev) => ({ ...prev, transitionYear: year }));
  };

  const rootClass = [
    'simulador-theme',
    theme === 'dark' ? 'dark' : '',
    embedded ? 'w-full' : 'min-h-screen flex flex-col',
    'bg-canvas text-text-primary transition-colors',
  ]
    .filter(Boolean)
    .join(' ');

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
  );

  if (embedded) {
    return (
      <div className={rootClass}>
        {isProfessional && <ProfessionalModeBar onExit={exitProfessionalMode} />}
        <div id="simulador" className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <a
        href="#simulador"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-accent-bg focus:px-4 focus:py-3 focus:text-base focus:font-semibold focus:text-accent-fg"
      >
        Ir para a simulação
      </a>

      <Navbar theme={theme} onToggleTheme={toggleTheme} />

      {isProfessional && <ProfessionalModeBar onExit={exitProfessionalMode} />}

      <main
        id="simulador"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
      >
        {content}
      </main>

      <Footer onSelectTab={setActiveTab} isProfessional={isProfessional} />
    </div>
  );
};
