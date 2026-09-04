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
    <div className="bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all">
      <div 
        className="flex items-center justify-between cursor-pointer select-none" 
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen); } }}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FAF8F5] border border-[#E5E0D8] text-[#161616] rounded-full">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-serif font-medium text-[#161616] tracking-tight">
                Premissas Econômico-Fiscais &amp; Parâmetros Regulatórios
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#6B6864] border border-[#E5E0D8] hidden sm:inline">
                LC 214/2025
              </span>
            </div>
            <p className="text-xs text-[#6B6864] mt-0.5">
              Alíquota-base de referência: <span className="font-mono font-medium text-[#161616]">{params.referenceRate}%</span> &bull; Redução setorial: <span className="font-mono font-medium text-[#161616]">{params.realEstateDiscountPercent}%</span> &bull; Alíquota efetiva base: <span className="text-[#1E6B2C] font-semibold font-mono">{calculatedEffectiveRate}%</span>
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-[#161616] bg-[#FAF8F5] hover:bg-[#F0ECE5] border border-[#E5E0D8] rounded-full transition-all focus-visible:ring-2 focus-visible:ring-black/20"
            title="Restaurar parâmetros oficiais da LC 214/2025"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#6B6864]" />
            <span className="hidden sm:inline font-medium">Restaurar Padrões Oficiais</span>
          </button>
          <div className="text-[#787570] p-1.5 hover:text-[#161616] rounded-lg">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[#F0ECE5] space-y-4">
          {/* Alerta de Governança Fiscal em tom âmbar quente Bronn */}
          <div className="flex items-start gap-3 bg-[#FEF7ED] border border-[#FDE68A] rounded-2xl p-4 text-xs text-[#92400E] leading-relaxed">
            <Info className="w-4 h-4 text-[#92400E] mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-[#78350F]">Premissas Regulatórias Oficiais:</span> Os parâmetros abaixo refletem as diretrizes da Lei Complementar nº 214/2025 (alíquota-padrão de 26,5%, redução específica de 70% para locação, Redutor Social de R$ 600/mês para moradia e tetos de imunidade/isenção para pessoa física). Ajuste-os conforme necessário para modelagem de cenários e sensibilidade econômica.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E5E0D8]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#161616] mb-1.5">
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
              <span className="text-[10px] text-[#787570] mt-1 block">Teto sugerido: 26,5%</span>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E5E0D8]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#161616] mb-1.5">
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
              <span className="text-[10px] text-[#787570] mt-1 block">Art. 260 LC 214/2025: 70%</span>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E5E0D8]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#161616] mb-1.5">
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
              <span className="text-[10px] text-[#787570] mt-1 block">Dedução mensal: R$ 600,00</span>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E5E0D8]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#161616] mb-1.5">
                Limite de Imóveis (Não-Habitualidade PF)
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
              <span className="text-[10px] text-[#787570] mt-1 block">Não-contribuinte: até 3 imóveis locados (Art. 4º, §2º)</span>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E5E0D8]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#161616] mb-1.5">
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
              <span className="text-[10px] text-[#787570] mt-1 block">Limite MEI/Simples: R$ 240k</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
