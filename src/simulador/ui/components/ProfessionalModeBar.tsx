import React from 'react';
import { KeyRound, X } from 'lucide-react';

interface ProfessionalModeBarProps {
  onExit: () => void;
}

/**
 * Faixa discreta que sinaliza a sessão em Modo Profissional.
 * Existe para que ninguém apresente a tela ao locador sem perceber que os
 * módulos técnicos estão à mostra.
 */
export const ProfessionalModeBar: React.FC<ProfessionalModeBarProps> = ({ onExit }) => (
  <div className="bg-accent-bg text-accent-fg border-b border-accent-fg/20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
      <p className="flex items-center gap-2 text-sm font-semibold tracking-tight">
        <KeyRound className="w-4 h-4 shrink-0" aria-hidden="true" />
        Modo Profissional
      </p>
      <button
        type="button"
        onClick={onExit}
 className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg text-sm font-medium text-accent-fg/80 hover:text-accent-fg hover:bg-accent-fg/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-fg/40"
      >
        <X className="w-4 h-4" aria-hidden="true" />
        Sair
      </button>
    </div>
  </div>
);
