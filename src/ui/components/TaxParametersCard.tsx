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
  const [isOpen, setIsOpen] = useState(true);

  const handleReset = () => {
    onChange({ ...DEFAULT_TAX_PARAMETERS });
  };

  const calculatedEffectiveRate = (params.referenceRate * (1 - params.realEstateDiscountPercent / 100)).toFixed(2);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
      {/* Alert banner */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-xs text-amber-200/90 leading-relaxed">
        <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold text-amber-300">Parâmetros de referência da LC 214/2025:</span> Os valores abaixo (alíquota padrão, redução de 70%, Redutor Social de R$ 600 e limites de enquadramento da PF) refletem as regras aprovadas na regulamentação da reforma tributária. Você pode ajustá-los livremente para simular cenários alternativos.
        </div>
      </div>

      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-800 text-emerald-400 rounded-lg">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Parâmetros usados no cálculo</h3>
            <p className="text-xs text-slate-400">
              Alíquota efetiva base: <span className="text-emerald-400 font-semibold">{calculatedEffectiveRate}%</span> ({params.referenceRate}% com {params.realEstateDiscountPercent}% de redução)
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
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Restaurar padrões oficiais da LC 214/2025"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Padrões LC 214/2025</span>
          </button>
          <div className="text-slate-400 p-1">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-4 pt-4 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Alíquota Referência (IBS+CBS) (%)
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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Redução Locação Imóveis (%)
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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Redutor Social Residencial (R$/mês)
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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Teto de Imóveis (Locador PF)
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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Teto Receita Anual PF (R$)
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
          </div>
        </div>
      )}
    </div>
  );
};
