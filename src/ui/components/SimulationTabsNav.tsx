import React from 'react';
import { 
  Calculator, 
  Layers, 
  Scale, 
  BookOpen, 
  Code2 
} from 'lucide-react';
import { ActiveTab } from './Navbar.tsx';

interface SimulationTabsNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const SimulationTabsNav: React.FC<SimulationTabsNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'single' as ActiveTab, label: 'Contrato Individual', icon: Calculator },
    { id: 'portfolio' as ActiveTab, label: 'Gestão de Portfólio', icon: Layers },
    { id: 'comparative' as ActiveTab, label: 'Cenário Comparativo', icon: Scale },
    { id: 'legal' as ActiveTab, label: 'Dossiê Jurídico', icon: BookOpen },
    { id: 'api' as ActiveTab, label: 'Integração & Cronograma', icon: Code2 },
  ];

  return (
    <div className="bg-white dark:bg-[#14171F] border border-[#E0DBD2] dark:border-[#222733] rounded-2xl p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sticky top-16 z-30 backdrop-blur-md bg-white/95 dark:bg-[#14171F]/95 transition-colors">
      <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar" aria-label="Módulos de Simulação">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none whitespace-nowrap ${
                isActive
                  ? 'bg-[#161616] dark:bg-white text-white dark:text-[#161616] shadow-xs font-semibold'
                  : 'text-[#6B6864] dark:text-[#9CA3AF] hover:text-[#161616] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#1A1E27]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-white dark:text-[#161616]' : 'text-[#8C8882] dark:text-[#6B7280]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
