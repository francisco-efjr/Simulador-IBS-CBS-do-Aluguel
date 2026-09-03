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
    <section className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-white/[0.05] border border-white/[0.08] text-emerald-400 rounded-xl shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-tight">
              Cronograma Constitucional de Transição (EC 132/2023 &amp; LC 214/2025)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ano-calendário de apuração para simulação do escalonamento fiscal da reforma
            </p>
          </div>
        </div>

        {/* Seletor Segmentado de Anos */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0" role="group" aria-label="Ano da Transição">
          {years.map((yr) => {
            const isSelected = selectedYear === yr;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => onSelectYear(yr)}
                className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 select-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:outline-none ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950/70 border border-white/[0.08] text-slate-400 hover:text-slate-100 hover:border-white/20'
                }`}
                aria-pressed={isSelected}
              >
                {yr === 2026 ? '2026 (Ano Teste)' : yr === 2033 ? '2033 (Regime Pleno)' : yr}
              </button>
            );
          })}
        </div>
      </div>

      {/* Destaque Tipográfico Executivo da Alíquota do Ano */}
      <div className="bg-slate-950/70 border border-white/[0.08] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {currentRates.label}
              </span>
              <span className="text-[11px] text-slate-500">&bull;</span>
              <span className="text-xs text-slate-400">
                CBS <span className="font-mono text-slate-200">{currentRates.effectiveCbsRate}%</span> + IBS <span className="font-mono text-slate-200">{currentRates.effectiveIbsRate}%</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              {currentRates.description}
            </p>
          </div>
        </div>

        <div className="flex md:flex-col items-baseline md:items-end justify-between border-t border-white/[0.06] md:border-t-0 pt-2 md:pt-0 shrink-0">
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-400">
            Alíquota Efetiva de Locação
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            {currentRates.effectiveTotalRate}%
          </span>
        </div>
      </div>
    </section>
  );
};
