import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calculator, 
  Layers, 
  Scale, 
  BookOpen, 
  Code2, 
  Menu, 
  X, 
  Sun, 
  Moon 
} from 'lucide-react';

export type ActiveTab = 'single' | 'portfolio' | 'comparative' | 'legal' | 'api';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedTheme = window.localStorage ? window.localStorage.getItem('theme') : null;
        const isDark = document.documentElement.classList.contains('dark') || storedTheme === 'dark';
        setTheme(isDark ? 'dark' : 'light');
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('theme', nextTheme);
      }
    } catch (e) {}
  };

  const navItems = [
    { id: 'single' as ActiveTab, label: 'Contrato Individual', shortLabel: 'Individual', icon: Calculator },
    { id: 'portfolio' as ActiveTab, label: 'Gestão de Portfólio', shortLabel: 'Portfólio', icon: Layers },
    { id: 'comparative' as ActiveTab, label: 'Cenário Comparativo', shortLabel: 'Comparativo', icon: Scale },
    { id: 'legal' as ActiveTab, label: 'Dossiê Jurídico', shortLabel: 'Jurídico', icon: BookOpen },
    { id: 'api' as ActiveTab, label: 'Integração & Cronograma', shortLabel: 'API', icon: Code2 },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-[#E5E0D8] dark:border-[#222733] bg-[#FAF8F5]/95 dark:bg-[#0B0D11]/95 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Barra Superior Institucional */}
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
          
          {/* Logo & Identidade Institucional */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 sm:p-2.5 bg-[#161616] dark:bg-white text-white dark:text-[#161616] rounded-xl shadow-xs flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#1E6B2C] dark:text-[#4ADE80] bg-[#EAF4EC] dark:bg-[#0E2416] border border-[#D4E8D7] dark:border-[#184227] px-2 py-0.5 rounded-full font-mono">
                  LC 214/2025
                </span>
                <span className="text-[11px] text-[#787570] dark:text-[#9CA3AF] font-medium hidden sm:inline">
                  Reforma Tributária do Consumo
                </span>
              </div>
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-[#161616] dark:text-[#F3F4F6] tracking-tight leading-tight mt-0.5">
                Simulador Tributário Imobiliário
              </h1>
            </div>
          </div>

          {/* Ações Direitas: Seletor Dia/Noite e Menu Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Botão Dia e Noite */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[#E0DBD2] dark:border-[#2C3240] bg-white dark:bg-[#161922] text-[#403E3B] dark:text-[#CBD5E1] hover:bg-[#F0ECE5] dark:hover:bg-[#1E2330] transition-colors flex items-center gap-1.5 text-xs font-medium focus-visible:outline-none shrink-0"
              title={theme === 'dark' ? 'Alternar para Modo Claro (Dia)' : 'Alternar para Modo Escuro (Noite)'}
              aria-label="Alternar modo claro ou escuro"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                  <span className="hidden sm:inline">Modo Escuro</span>
                </>
              )}
            </button>

            {/* Menu Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#6B6864] dark:text-[#9CA3AF] hover:bg-[#F0ECE5] dark:hover:bg-[#1A1E27] md:hidden transition-colors"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Barra de Abas do Simulador (estilo executivo limpo) */}
        <div className="py-2 border-t border-[#EAE6DE] dark:border-[#202530] flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1 sm:gap-1.5 w-full" aria-label="Navegação Principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 select-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none ${
                    isActive
                      ? 'bg-[#161616] dark:bg-white text-white dark:text-[#161616] shadow-xs font-semibold'
                      : 'text-[#6B6864] dark:text-[#9CA3AF] hover:text-[#161616] dark:hover:text-white hover:bg-[#F0ECE5] dark:hover:bg-[#1A1E27] border border-transparent'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white dark:text-[#161616]' : 'text-[#8C8882] dark:text-[#6B7280]'}`} />
                  <span className="hidden md:inline">{item.label}</span>
                  <span className="md:hidden">{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Menu Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E0D8] dark:border-[#222733] bg-white dark:bg-[#13161D] px-4 py-3 space-y-1 shadow-lg animate-in fade-in duration-150">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                  isActive
                    ? 'bg-[#161616] text-white font-semibold'
                    : 'text-[#403E3B] dark:text-[#CBD5E1] hover:bg-[#FAF8F5] dark:hover:bg-[#1A1E27]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
