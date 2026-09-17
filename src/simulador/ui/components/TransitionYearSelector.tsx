import React, { useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { TransitionYear } from '../../core/domain/types.ts'
import { TransitionCalendar } from '../../core/services/TransitionCalendar.ts'

interface TransitionYearSelectorProps {
  selectedYear: TransitionYear
  onSelectYear: (year: TransitionYear) => void
  referenceRate: number
  cbsShare: number
  ibsShare: number
  discountPercent: number
}

export const TransitionYearSelector: React.FC<TransitionYearSelectorProps> = ({
  selectedYear,
  onSelectYear,
  referenceRate,
  cbsShare,
  ibsShare,
  discountPercent,
}) => {
  const currentRates = useMemo(
    () =>
      TransitionCalendar.getRatesForYear(
        selectedYear,
        referenceRate,
        cbsShare,
        ibsShare,
        discountPercent,
      ),
    [selectedYear, referenceRate, cbsShare, ibsShare, discountPercent],
  )

  return (
    <section className="bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-sim-border pb-4">
        <h2 className="flex items-center gap-3 text-lg sm:text-xl font-semibold text-text-primary tracking-tight">
          <span className="p-2.5 bg-surface-muted border border-sim-border text-text-primary rounded-full shrink-0">
            <Calendar className="w-5 h-5" aria-hidden="true" />
          </span>
          Ano da apuração
        </h2>

        <div
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0"
          role="group"
          aria-label="Ano da apuração"
        >
          {TransitionCalendar.TRANSITION_YEARS.map((yr) => {
            const isSelected = selectedYear === yr
            return (
              <button
                key={yr}
                type="button"
                onClick={() => onSelectYear(yr)}
                aria-pressed={isSelected}
                className={`px-4 min-h-[48px] rounded-full text-base font-semibold transition-colors shrink-0 select-none cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-bg/40 ${
                  isSelected
                    ? 'bg-accent-bg text-accent-fg'
                    : 'bg-surface-muted border border-sim-border-strong text-text-secondary hover:text-text-primary hover:border-accent-bg'
                }`}
              >
                {yr}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-surface-muted border border-sim-border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-base sm:text-lg font-semibold text-text-primary tracking-tight">
          {currentRates.label}
        </p>

        <div className="flex md:flex-col items-baseline md:items-end justify-between gap-3 border-t border-sim-border md:border-t-0 pt-3 md:pt-0 shrink-0">
          <span className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Alíquota do aluguel
          </span>
          <span className="text-4xl sm:text-5xl font-semibold text-text-primary tracking-tight tabular-nums">
            {currentRates.effectiveTotalRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%
          </span>
        </div>
      </div>
    </section>
  )
}
