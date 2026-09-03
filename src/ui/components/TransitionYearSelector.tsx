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
    <section className="bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#F0ECE5] pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-[#FAF8F5] border border-[#E5E0D8] text-[#161616] rounded-full shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-serif font-medium text-[#161616] tracking-tight">
              Cronograma Constitucional de Transição (EC 132/2023 &amp; LC 214/2025)
            </h2>
            <p className="text-xs text-[#6B6864] mt-0.5">
              Ano-calendário de apuração para simulação do escalonamento fiscal da reforma
            </p>
          </div>
        </div>

        {/* Seletor Segmentado de Anos em Pílulas Bronn */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0" role="group" aria-label="Ano da Transição">
          {years.map((yr) => {
            const isSelected = selectedYear === yr;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => onSelectYear(yr)}
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all shrink-0 select-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none cursor-pointer ${
                  isSelected
                    ? 'bg-[#161616] dark:bg-white text-white dark:text-[#161616] font-semibold shadow-sm'
                    : 'bg-[#FAF8F5] dark:bg-[#1A1E27] border border-[#E5E0D8] dark:border-[#2C3240] text-[#6B6864] dark:text-[#94A3B8] hover:text-[#161616] dark:hover:text-white hover:border-[#161616] dark:hover:border-white'
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
      <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-[#161616] shrink-0 mt-1" />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#161616]">
                {currentRates.label}
              </span>
              <span className="text-[11px] text-[#A09C96]">&bull;</span>
              <span className="text-xs text-[#6B6864]">
                CBS <span className="font-mono font-medium text-[#161616] bg-[#EEF3FA] text-[#1D528F] border border-[#D8E5F5] px-2 py-0.5 rounded-full">{currentRates.effectiveCbsRate}%</span> + IBS <span className="font-mono font-medium text-[#161616] bg-[#EEF3FA] text-[#1D528F] border border-[#D8E5F5] px-2 py-0.5 rounded-full">{currentRates.effectiveIbsRate}%</span>
              </span>
            </div>
            <p className="text-xs text-[#6B6864] leading-relaxed max-w-2xl">
              {currentRates.description}
            </p>
          </div>
        </div>

        <div className="flex md:flex-col items-baseline md:items-end justify-between border-t border-[#E5E0D8] md:border-t-0 pt-3 md:pt-0 shrink-0">
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-[#787570]">
            Alíquota Efetiva de Locação
          </span>
          <span className="text-3xl sm:text-4xl font-serif text-[#161616] font-normal tracking-tight tabular-nums">
            {currentRates.effectiveTotalRate}%
          </span>
        </div>
      </div>
    </section>
  );
};
