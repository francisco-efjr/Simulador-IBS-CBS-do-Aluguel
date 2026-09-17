import React, { useState } from 'react'
import { Sliders, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { TaxParameters } from '../../core/domain/types.ts'
import { DEFAULT_TAX_PARAMETERS } from '../../core/domain/constants.ts'
import { BRLInput } from './BRLInput.tsx'

interface TaxParametersCardProps {
  params: TaxParameters
  onChange: (params: TaxParameters) => void
}

export const TaxParametersCard: React.FC<TaxParametersCardProps> = ({ params, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleReset = () => {
    onChange({ ...DEFAULT_TAX_PARAMETERS })
  }

  const calculatedEffectiveRate = (
    params.referenceRate *
    (1 - params.realEstateDiscountPercent / 100)
  ).toFixed(2)

  return (
    <div className="bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-surface-muted border border-sim-border text-text-primary rounded-full">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-serif font-medium text-text-primary tracking-tight">
                Premissas Econômico-Fiscais &amp; Parâmetros Regulatórios
              </h3>
              <span className="text-[10px] uppercase font-sim-mono px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary border border-sim-border hidden sm:inline">
                LC 214/2025
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Alíquota-base de referência:{' '}
              <span className="font-sim-mono font-medium text-text-primary">
                {params.referenceRate}%
              </span>{' '}
              &bull; Redução setorial:{' '}
              <span className="font-sim-mono font-medium text-text-primary">
                {params.realEstateDiscountPercent}%
              </span>{' '}
              &bull; Alíquota efetiva base:{' '}
              <span className="text-positive-text font-semibold font-sim-mono">
                {calculatedEffectiveRate}%
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleReset()
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-text-primary bg-surface-muted hover:bg-surface-muted border border-sim-border rounded-full transition-all focus-visible:ring-2 focus-visible:ring-accent-bg/40"
            title="Restaurar parâmetros oficiais da LC 214/2025"
          >
            <RotateCcw className="w-3.5 h-3.5 text-text-secondary" />
            <span className="hidden sm:inline font-medium">Restaurar Padrões Oficiais</span>
          </button>
          <div className="text-text-muted p-1.5 hover:text-text-primary rounded-lg">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-sim-border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-surface-muted p-3.5 rounded-2xl border border-sim-border">
              <BRLInput
                label="Alíquota de referência (IBS + CBS)"
                suffix="%"
                decimals={1}
                value={params.referenceRate}
                onChange={(val) => onChange({ ...params, referenceRate: val })}
                placeholder="0,0"
                min={0}
                max={100}
              />
              <span className="text-xs text-text-muted mt-1.5 block">Teto sugerido: 26,5%</span>
            </div>

            <div className="bg-surface-muted p-3.5 rounded-2xl border border-sim-border">
              <BRLInput
                label="Redução setorial da locação"
                suffix="%"
                decimals={0}
                value={params.realEstateDiscountPercent}
                onChange={(val) => onChange({ ...params, realEstateDiscountPercent: val })}
                placeholder="0"
                min={0}
                max={100}
              />
              <span className="text-xs text-text-muted mt-1.5 block">
                Art. 260 LC 214/2025: 70%
              </span>
            </div>

            <div className="bg-surface-muted p-3.5 rounded-2xl border border-sim-border">
              <BRLInput
                label="Redutor social residencial"
                prefix="R$"
                decimals={2}
                value={params.socialDeductionResidential}
                onChange={(val) => onChange({ ...params, socialDeductionResidential: val })}
                placeholder="0,00"
                min={0}
              />
              <span className="text-xs text-text-muted mt-1.5 block">
                Dedução mensal: R$ 600,00
              </span>
            </div>

            <div className="bg-surface-muted p-3.5 rounded-2xl border border-sim-border">
              <BRLInput
                label="Limite de imóveis (habitualidade PF)"
                suffix="un"
                decimals={0}
                value={params.pfPropertyThreshold}
                onChange={(val) => onChange({ ...params, pfPropertyThreshold: val })}
                placeholder="0"
                min={1}
              />
              <span className="text-xs text-text-muted mt-1.5 block">
                Não-contribuinte: até 3 imóveis locados (Art. 4º, §2º)
              </span>
            </div>

            <div className="bg-surface-muted p-3.5 rounded-2xl border border-sim-border">
              <BRLInput
                label="Teto de receita anual PF"
                prefix="R$"
                decimals={2}
                value={params.pfAnnualIncomeThreshold}
                onChange={(val) => onChange({ ...params, pfAnnualIncomeThreshold: val })}
                placeholder="0,00"
                min={0}
              />
              <span className="text-xs text-text-muted mt-1.5 block">
                Limite MEI/Simples: R$ 240k
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
