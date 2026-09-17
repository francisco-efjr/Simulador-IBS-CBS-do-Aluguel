import React, { useMemo, useState } from 'react'
import { Scale, Building2, User } from 'lucide-react'
import {
  PropertyType,
  PersonType,
  TaxParameters,
  LandlordProfile,
} from '../../core/domain/types.ts'
import { ComparativeEngine } from '../../core/services/ComparativeEngine.ts'
import { BRLInput } from './BRLInput.tsx'
import { SegmentedControl } from './SegmentedControl.tsx'

interface ComparativeAnalysisTabProps {
  params: TaxParameters
}

const formatBRL = (val: number) =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const ComparativeAnalysisTab: React.FC<ComparativeAnalysisTabProps> = ({ params }) => {
  const [rent, setRent] = useState<number>(0)
  const [propertyType, setPropertyType] = useState<PropertyType>('residential')
  const [personType, setPersonType] = useState<PersonType>('pf')
  const [propertiesCount, setPropertiesCount] = useState<number>(0)
  const [annualIncome, setAnnualIncome] = useState<number>(0)
  const [managementFee, setManagementFee] = useState<number>(0)

  const comparison = useMemo(() => {
    const landlord: LandlordProfile = {
      personType,
      totalPropertiesRented: propertiesCount,
      totalAnnualRentalIncome: annualIncome,
      managementFeePercent: managementFee,
    }
    return ComparativeEngine.compare(rent, propertyType, landlord, params, params.transitionYear)
  }, [rent, propertyType, personType, propertiesCount, annualIncome, managementFee, params])

  const difference = comparison.postReform.differenceAmount
  const isIncrease = difference > 0

  return (
    <div className="space-y-6">
      <section className="bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <h2 className="flex items-center gap-3 text-lg sm:text-xl font-semibold text-text-primary tracking-tight border-b border-sim-border pb-4 mb-5">
          <Scale className="w-6 h-6 shrink-0" aria-hidden="true" />
          Antes e depois da reforma
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <BRLInput label="Aluguel mensal" prefix="R$" value={rent} onChange={setRent} min={0} />

          <BRLInput
            label="Taxa da imobiliária"
            suffix="%"
            decimals={1}
            value={managementFee}
            onChange={setManagementFee}
            placeholder="0,0"
            min={0}
            max={100}
          />

          <SegmentedControl
            legend="Tipo do imóvel"
            value={propertyType}
            onChange={setPropertyType}
            options={[
              { value: 'residential', label: 'Residencial' },
              { value: 'commercial', label: 'Comercial' },
            ]}
          />

          <SegmentedControl
            legend="Quem é o dono"
            value={personType}
            onChange={setPersonType}
            options={[
              { value: 'pf', label: 'Pessoa Física', icon: User },
              { value: 'pj', label: 'Empresa', icon: Building2 },
            ]}
          />
        </div>

        {personType === 'pf' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 pt-5 border-t border-sim-border">
            <BRLInput
              label="Quantos imóveis você aluga"
              decimals={0}
              value={propertiesCount}
              onChange={setPropertiesCount}
              placeholder="0"
              min={0}
            />
            <BRLInput
              label="Total recebido de aluguel no ano"
              prefix="R$"
              value={annualIncome}
              onChange={setAnnualIncome}
              min={0}
            />
          </div>
        )}
      </section>

      <div aria-live="polite">
        {rent === 0 ? (
          <p className="p-8 border-2 border-dashed border-sim-border-strong rounded-2xl sm:rounded-3xl text-center text-lg font-medium text-text-secondary bg-surface-muted">
            Informe o aluguel mensal para ver a comparação.
          </p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="border-b border-sim-border pb-3">
                  <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                    Hoje
                  </p>
                  <h3 className="text-lg font-semibold text-text-primary tracking-tight">
                    {comparison.preReform.systemName}
                  </h3>
                </div>

                <dl className="space-y-3 text-base">
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Imposto por mês</dt>
                    <dd className="font-bold tabular-nums text-text-primary">
                      {formatBRL(comparison.preReform.estimatedTaxAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-sim-border pt-3">
                    <dt className="font-semibold text-text-primary">Sobra no bolso</dt>
                    <dd className="text-xl font-bold tabular-nums text-positive-text">
                      {formatBRL(comparison.preReform.netIncome)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="bg-surface border-2 border-accent-bg rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="border-b border-sim-border pb-3">
                  <p className="text-sm font-semibold uppercase tracking-wider text-positive-text">
                    Em {comparison.transitionYear}
                  </p>
                  <h3 className="text-lg font-semibold text-text-primary tracking-tight">
                    {comparison.postReform.isTaxpayer ? 'Com IBS e CBS' : 'Sem IBS e CBS'}
                  </h3>
                </div>

                <dl className="space-y-3 text-base">
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Imposto por mês</dt>
                    <dd className="font-bold tabular-nums text-text-primary">
                      {formatBRL(comparison.postReform.totalTaxEstimated)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-sim-border pt-3">
                    <dt className="font-semibold text-text-primary">Sobra no bolso</dt>
                    <dd className="text-xl font-bold tabular-nums text-positive-text">
                      {formatBRL(comparison.postReform.netIncomeIfAbsorbed)}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>

            <section
              className={`rounded-2xl sm:rounded-3xl p-6 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isIncrease
                  ? 'bg-warning-bg border-warning-border'
                  : 'bg-positive-bg border-positive-border'
              }`}
            >
              <h3 className="text-lg sm:text-xl font-semibold text-text-primary tracking-tight">
                {isIncrease
                  ? 'Você vai pagar a mais'
                  : difference < 0
                    ? 'Você vai pagar a menos'
                    : 'Não muda nada'}
              </h3>
              <p className="text-3xl sm:text-4xl font-bold tabular-nums text-text-primary">
                {formatBRL(Math.abs(difference))}
                <span className="text-lg font-semibold text-text-secondary"> /mês</span>
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
