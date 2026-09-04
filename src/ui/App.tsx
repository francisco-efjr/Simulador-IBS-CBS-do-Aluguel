import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';

import { TransitionYearSelector } from './components/TransitionYearSelector.tsx';
import { TaxParametersCard } from './components/TaxParametersCard.tsx';
import { SimulationTabsNav } from './components/SimulationTabsNav.tsx';
import { SingleSimulationTab } from './components/SingleSimulationTab.tsx';
import { PortfolioSimulationTab } from './components/PortfolioSimulationTab.tsx';
import { ComparativeAnalysisTab } from './components/ComparativeAnalysisTab.tsx';
import { LegalReferencesModal } from './components/LegalReferencesModal.tsx';
import { TransitionApiExplorer } from './components/TransitionApiExplorer.tsx';
import { DEFAULT_TAX_PARAMETERS } from '../core/domain/constants.ts';
import { TaxParameters, TransitionYear } from '../core/domain/types.ts';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('single');
  const [params, setParams] = useState<TaxParameters>({ ...DEFAULT_TAX_PARAMETERS });

  const handleYearChange = (year: TransitionYear) => {
    setParams((prev) => ({ ...prev, transitionYear: year }));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B0D11] flex flex-col text-[#161616] dark:text-[#EDEDED] transition-colors">
      {/* Header Institucional Limpo */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Área Central da Aplicação */}
      <main id="simulador" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Barra de Abas dos Módulos */}
        <SimulationTabsNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Seletor do Ano Constitucional de Transição (2026 a 2033) */}
        <TransitionYearSelector
          selectedYear={params.transitionYear}
          onSelectYear={handleYearChange}
          referenceRate={params.referenceRate}
          cbsShare={params.cbsShare}
          ibsShare={params.ibsShare}
          discountPercent={params.realEstateDiscountPercent}
        />

        {/* Módulo Ativo de Simulação */}
        <div>
          {activeTab === 'single' && <SingleSimulationTab params={params} />}
          {activeTab === 'portfolio' && <PortfolioSimulationTab params={params} />}
          {activeTab === 'comparative' && <ComparativeAnalysisTab params={params} />}
          {activeTab === 'legal' && <LegalReferencesModal />}
          {activeTab === 'api' && <TransitionApiExplorer params={params} />}
        </div>

        {/* Parâmetros Avançados Opcionais (Recolhidos por padrão para não sobrecarregar a tela) */}
        <div className="pt-2">
          <TaxParametersCard params={params} onChange={setParams} />
        </div>

      </main>

      {/* Rodapé Executivo */}
      <Footer onSelectTab={(tab) => setActiveTab(tab)} />
    </div>
  );
};
