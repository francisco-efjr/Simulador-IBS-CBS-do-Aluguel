import React from 'react';
import { Calendar, Info } from 'lucide-react';
import { TransitionYear } from '../../core/domain/types.ts';
import { TransitionCalendar } from '../../core/services/TransitionCalendar.ts';

interface TransitionYearSelectorProps {
  selectedYear: TransitionYear;
  onSelectYear: (year: TransitionYear) => void;
  referenceRate: number;
  cbsShare: number;
  ibsShare: number;
  discountPercent: number;
}

export const TransitionYearSelector: React.FC<TransitionYearSelectorProps> = ({
  selectedYear,
  onSelectYear,
  referenceRate,
  cbsShare,
  ibsShare,
  discountPercent,
}) => {
  const years: TransitionYear[] = [2026, 2027, 2029, 2031, 2033];
  const currentRates = TransitionCalendar.getRatesForYear(
    selectedYear,
    referenceRate,
    cbsShare,
    ibsShare,
    discountPercent
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-800 text-emerald-400 rounded-lg">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Cronograma de Transição Tributária (2026 – 2033)
            </h3>
            <p className="text-xs text-slate-400">
              Selecione o ano-calendário da locação para simular o escalonamento oficial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {years.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => onSelectYear(yr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                selectedYear === yr
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {yr === 2026 ? '2026 (Teste)' : yr === 2033 ? '2033 (Pleno)' : yr}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-200">
            {currentRates.label} — Alíquota Efetiva de Locação:{' '}
            <span className="text-emerald-400 font-bold font-mono text-sm">
              {currentRates.effectiveTotalRate}%
            </span>{' '}
            (CBS {currentRates.effectiveCbsRate}% + IBS {currentRates.effectiveIbsRate}%)
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {currentRates.description}
          </p>
        </div>
      </div>
    </div>
  );
};
