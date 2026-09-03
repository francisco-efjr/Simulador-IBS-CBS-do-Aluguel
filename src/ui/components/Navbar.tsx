import React from 'react';
import { Building2, Calculator, Layers, Scale, BookOpen, Code2 } from 'lucide-react';

export type ActiveTab = 'single' | 'portfolio' | 'comparative' | 'legal' | 'api';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'single' as ActiveTab, label: 'Contrato Individual', shortLabel: 'Individual', icon: Calculator },
    { id: 'portfolio' as ActiveTab, label: 'Gestão de Portfólio', shortLabel: 'Portfólio', icon: Layers },
    { id: 'comparative' as ActiveTab, label: 'Cenário Comparativo', shortLabel: 'Comparativo', icon: Scale },
    { id: 'legal' as ActiveTab, label: 'Dossiê Jurídico', shortLabel: 'Jurídico', icon: BookOpen },
    { id: 'api' as ActiveTab, label: 'Integração & Cronograma', shortLabel: 'API', icon: Code2 },
  ];

  return (
    <header className="border-b border-white/[0.08] bg-[#090d14]/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Identidade Institucional */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shadow-sm">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
                  LC 214/2025
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Reforma Tributária do Consumo
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-tight mt-0.5">
                Simulador Tributário Imobiliário
              </h1>
            </div>
          </div>

          {/* Navegação Executiva (Tabs com rolagem horizontal suave no mobile) */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-2 -my-2" aria-label="Navegação Principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 select-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:outline-none ${
                    isActive
                      ? 'bg-white/10 text-white shadow-sm border border-white/15 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="hidden md:inline">{item.label}</span>
                  <span className="md:hidden">{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
