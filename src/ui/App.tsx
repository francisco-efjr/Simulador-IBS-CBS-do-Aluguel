import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { TransitionYearSelector } from './components/TransitionYearSelector.tsx';
import { TaxParametersCard } from './components/TaxParametersCard.tsx';
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
    <div className="min-h-screen bg-[#0b0f17] flex flex-col text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Seletor de Ano da Transição Tributária (2026 a 2033) */}
        <TransitionYearSelector
          selectedYear={params.transitionYear}
          onSelectYear={handleYearChange}
          referenceRate={params.referenceRate}
          cbsShare={params.cbsShare}
          ibsShare={params.ibsShare}
          discountPercent={params.realEstateDiscountPercent}
        />

        {/* Parâmetros Globais Configuráveis */}
        <TaxParametersCard params={params} onChange={setParams} />

        {/* Abas de Navegação e Simulação */}
        {activeTab === 'single' && <SingleSimulationTab params={params} />}
        {activeTab === 'portfolio' && <PortfolioSimulationTab params={params} />}
        {activeTab === 'comparative' && <ComparativeAnalysisTab params={params} />}
        {activeTab === 'legal' && <LegalReferencesModal />}
        {activeTab === 'api' && <TransitionApiExplorer params={params} />}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <p>
          Simulador e Auditor Fiscal &bull; Conforme Lei Complementar nº 214/2025 e Emenda Constitucional nº 132/2023 &bull; Sistema de Apuração Auditável.
        </p>
      </footer>
    </div>
  );
};
