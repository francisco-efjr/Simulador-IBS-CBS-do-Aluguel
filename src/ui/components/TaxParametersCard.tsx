import React, { useState } from 'react';
import { Sliders, ChevronDown, ChevronUp, RotateCcw, Info } from 'lucide-react';
import { TaxParameters } from '../../core/domain/types.ts';
import { DEFAULT_TAX_PARAMETERS } from '../../core/domain/constants.ts';
import { BRLInput } from './BRLInput.tsx';

interface TaxParametersCardProps {
  params: TaxParameters;
  onChange: (params: TaxParameters) => void;
}

export const TaxParametersCard: React.FC<TaxParametersCardProps> = ({ params, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = () => {
    onChange({ ...DEFAULT_TAX_PARAMETERS });
  };

  const calculatedEffectiveRate = (params.referenceRate * (1 - params.realEstateDiscountPercent / 100)).toFixed(2);

  return (
    <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm transition-all backdrop-blur-md">
      <div 
        className="flex items-center justify-between cursor-pointer select-none" 
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen); } }}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/[0.05] border border-white/[0.08] text-emerald-400 rounded-xl">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                Premissas Econômico-Fiscais &amp; Parâmetros Regulatórios
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10 hidden sm:inline">
                LC 214/2025
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Alíquota-base de referência: <span className="font-mono text-slate-200">{params.referenceRate}%</span> &bull; Redução setorial: <span className="font-mono text-slate-200">{params.realEstateDiscountPercent}%</span> &bull; Alíquota efetiva base: <span className="text-emerald-400 font-bold font-mono">{calculatedEffectiveRate}%</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            title="Restaurar parâmetros oficiais da LC 214/2025"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline font-medium">Restaurar Padrões Oficiais</span>
          </button>
          <div className="text-slate-400 p-1.5 hover:text-slate-200 rounded-lg">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-4">
          {/* Alerta de Governança Fiscal */}
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200/90 leading-relaxed">
            <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-amber-300">Premissas Regulatórias Oficiais:</span> Os parâmetros abaixo refletem as diretrizes da Lei Complementar nº 214/2025 (alíquota-padrão de 26,5%, redução específica de 70% para locação, Redutor Social de R$ 600/mês para moradia e tetos de imunidade/isenção para pessoa física). Ajuste-os conforme necessário para modelagem de cenários e sensibilidade econômica.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-slate-950/40 p-3 rounded-xl border border-white/[0.05]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Alíquota Referência (IBS+CBS)
              </label>
              <BRLInput
                suffix="%"
                decimals={1}
                value={params.referenceRate}
                onChange={(val) => onChange({ ...params, referenceRate: val })}
                placeholder="0,0"
                min={0}
                max={100}
                className="py-1 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Teto sugerido: 26,5%</span>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-white/[0.05]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Redução Setorial Locação
              </label>
              <BRLInput
                suffix="%"
                decimals={0}
                value={params.realEstateDiscountPercent}
                onChange={(val) => onChange({ ...params, realEstateDiscountPercent: val })}
                placeholder="0"
                min={0}
                max={100}
                className="py-1 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Art. 260 LC 214/2025: 70%</span>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-white/[0.05]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Redutor Social Residencial
              </label>
              <BRLInput
                prefix="R$"
                decimals={2}
                value={params.socialDeductionResidential}
                onChange={(val) => onChange({ ...params, socialDeductionResidential: val })}
                placeholder="0,00"
                min={0}
                className="py-1 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Dedução mensal: R$ 600,00</span>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-white/[0.05]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Teto Imóveis (Locador PF)
              </label>
              <BRLInput
                suffix="un"
                decimals={0}
                value={params.pfPropertyThreshold}
                onChange={(val) => onChange({ ...params, pfPropertyThreshold: val })}
                placeholder="0"
                min={1}
                className="py-1 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Limite legal: até 3 imóveis</span>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-white/[0.05]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Teto Receita Anual PF
              </label>
              <BRLInput
                prefix="R$"
                decimals={2}
                value={params.pfAnnualIncomeThreshold}
                onChange={(val) => onChange({ ...params, pfAnnualIncomeThreshold: val })}
                placeholder="0,00"
                min={0}
                className="py-1 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Limite MEI/Simples: R$ 240k</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
