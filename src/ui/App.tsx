import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { ExecutiveOverviewStrip } from './components/ExecutiveOverviewStrip.tsx';
import { LegalComplianceGrid } from './components/LegalComplianceGrid.tsx';
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
import { Calculator } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('single');
  const [params, setParams] = useState<TaxParameters>({ ...DEFAULT_TAX_PARAMETERS });

  const handleYearChange = (year: TransitionYear) => {
    setParams((prev) => ({ ...prev, transitionYear: year }));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B0D11] flex flex-col text-[#161616] dark:text-[#EDEDED] transition-colors">
      {/* Header Executivo com Seletor de Modo Claro/Escuro (Dia/Noite) */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Faixa Executiva de Diretrizes Normativas (Redutores e Regras-Chave) */}
      <ExecutiveOverviewStrip />

      {/* Área Central do Simulador Tributário */}
      <main id="simulador" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* BLOCO FIXO: Cabeçalho do Painel, Ano da Transição e Premissas Globais */}
        <section aria-label="Premissas Regulatórias e Ano de Transição" className="space-y-6">
          {/* Cabeçalho da Seção de Apuração */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E0D8] dark:border-[#222733]">
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-semibold text-[#161616] dark:text-[#F3F4F6] tracking-tight flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#1E6B2C] dark:text-[#4ADE80]" />
                Painel de Simulação Fiscal
              </h2>
              <p className="text-xs text-[#6B6864] dark:text-[#94A3B8] mt-0.5">
                Apuração determinística de IBS/CBS, créditos fiscais e impacto líquido conforme a LC 214/2025
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#787570] dark:text-[#8C94A0] bg-white dark:bg-[#14171F] px-3 py-1.5 rounded-lg border border-[#E0DBD2] dark:border-[#222733] shrink-0 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <span>Precisão Centesimal &bull; Em Vigor</span>
            </div>
          </div>

          {/* Seletor do Ano Constitucional de Transição (2026 a 2033) */}
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
        </section>

        {/* BLOCO VARIÁVEL DE ALTERAR: Seletor de Módulos e Conteúdo da Simulação */}
        <section aria-label="Módulos de Simulação e Apuração Contratual" className="space-y-4 pt-2">
          {/* Barra de Abas dos Módulos de Simulação */}
          <SimulationTabsNav activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Conteúdo Dinâmico do Módulo Ativo */}
          <div>
            {activeTab === 'single' && <SingleSimulationTab params={params} />}
            {activeTab === 'portfolio' && <PortfolioSimulationTab params={params} />}
            {activeTab === 'comparative' && <ComparativeAnalysisTab params={params} />}
            {activeTab === 'legal' && <LegalReferencesModal />}
            {activeTab === 'api' && <TransitionApiExplorer params={params} />}
          </div>
        </section>

      </main>

      {/* Quadro de Fundamentação Legal */}
      <LegalComplianceGrid />

      {/* Rodapé Institucional Executivo */}
      <Footer onSelectTab={(tab) => setActiveTab(tab)} />
    </div>
  );
};
