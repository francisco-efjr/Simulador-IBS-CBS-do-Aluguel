import React, { useState, useEffect } from 'react';
import { Building2, ChevronUp, ShieldCheck } from 'lucide-react';
import { ActiveTab } from './Navbar.tsx';

interface FooterProps {
  onSelectTab?: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTabClick = (tab: ActiveTab, e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelectTab) {
      onSelectTab(tab);
    }
    const el = document.getElementById('simulador');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white dark:bg-[#0C0E13] border-t border-[#E5E0D8] dark:border-[#222733] py-10 px-4 sm:px-6 lg:px-8 mt-auto relative transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#EAE6DE] dark:border-[#1E2330]">
          <div className="space-y-1.5 max-w-lg">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#161616] dark:bg-white text-white dark:text-[#161616] rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-serif font-semibold text-base text-[#161616] dark:text-[#F3F4F6] tracking-tight">
                Plataforma Tributária Imobiliária
              </span>
            </div>
            <p className="text-xs text-[#6B6864] dark:text-[#94A3B8] leading-relaxed">
              Modelagem determinística para locadores PF, PJ e administradoras conforme Lei Complementar nº 214/2025 e EC nº 132/2023.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-[#6B6864] dark:text-[#94A3B8]">
            <a href="#simulador" onClick={(e) => handleTabClick('single', e)} className="hover:text-[#161616] dark:hover:text-white transition-colors">
              Individual
            </a>
            <span className="text-[#D5CFC4] dark:text-[#2A303D]">&bull;</span>
            <a href="#simulador" onClick={(e) => handleTabClick('portfolio', e)} className="hover:text-[#161616] dark:hover:text-white transition-colors">
              Portfólio
            </a>
            <span className="text-[#D5CFC4] dark:text-[#2A303D]">&bull;</span>
            <a href="#simulador" onClick={(e) => handleTabClick('comparative', e)} className="hover:text-[#161616] dark:hover:text-white transition-colors">
              Comparativo
            </a>
            <span className="text-[#D5CFC4] dark:text-[#2A303D]">&bull;</span>
            <a href="#simulador" onClick={(e) => handleTabClick('legal', e)} className="hover:text-[#161616] dark:hover:text-white transition-colors">
              Fundamentação Jurídica
            </a>
            <span className="text-[#D5CFC4] dark:text-[#2A303D]">&bull;</span>
            <a href="#simulador" onClick={(e) => handleTabClick('api', e)} className="hover:text-[#161616] dark:hover:text-white transition-colors">
              API
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#787570] dark:text-[#64748B]">
          <p className="text-center sm:text-left">
            &copy; 2026 &bull; Apuração Determinística &bull; Precisão Centesimal
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1E6B2C] dark:text-[#4ADE80]" />
            <span>Conformidade LC 214/2025</span>
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
          className="fixed bottom-6 right-6 p-2.5 rounded-full bg-[#161616] dark:bg-white text-white dark:text-[#161616] shadow-md hover:bg-black dark:hover:bg-gray-100 transition-all z-40 active:scale-95"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}
    </footer>
  );
};
