import React, { useMemo, useState } from 'react'
import {
  Home,
  Building,
  User,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileCheck2,
} from 'lucide-react'
import {
  PropertyType,
  PersonType,
  TaxParameters,
  LandlordProfile,
  TenantProfile,
  TaxRegimePJ,
} from '../../core/domain/types.ts'
import { TaxCalculatorEngine } from '../../core/services/TaxCalculatorEngine.ts'
import { ValidationEngine } from '../../core/domain/ValidationEngine.ts'
import { AuditReportView } from './AuditReportView.tsx'
import { BRLInput } from './BRLInput.tsx'
import { SegmentedControl } from './SegmentedControl.tsx'

interface SingleSimulationTabProps {
  params: TaxParameters
  isProfessional?: boolean
}

const formatBRL = (val: number) =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const SingleSimulationTab: React.FC<SingleSimulationTabProps> = ({
  params,
  isProfessional = false,
}) => {
  const [propertyType, setPropertyType] = useState<PropertyType>('residential')
  const [landlordType, setLandlordType] = useState<PersonType>('pf')
  const [landlordPropertiesCount, setLandlordPropertiesCount] = useState<number>(0)
  const [landlordAnnualIncome, setLandlordAnnualIncome] = useState<number>(0)
  const [landlordPjRegime, setLandlordPjRegime] = useState<TaxRegimePJ>('lucro_presumido')
  const [managementFeePercent, setManagementFeePercent] = useState<number>(0)

  const [tenantType, setTenantType] = useState<PersonType>('pf')
  const [tenantPjRegime, setTenantPjRegime] = useState<TaxRegimePJ>('lucro_real')

  const [baseRent, setBaseRent] = useState<number>(0)
  const [condominiumFee, setCondominiumFee] = useState<number>(0)
  const iptuAmount = 0

  const [activeSubView, setActiveSubView] = useState<'simulation' | 'audit'>('simulation')
  const showAudit = isProfessional && activeSubView === 'audit'

  const contractInput = useMemo(() => {
    const landlord: LandlordProfile = {
      personType: landlordType,
      totalPropertiesRented: landlordType === 'pf' ? landlordPropertiesCount : undefined,
      totalAnnualRentalIncome: landlordType === 'pf' ? landlordAnnualIncome : undefined,
      pjTaxRegime: landlordType === 'pj' ? landlordPjRegime : undefined,
      managementFeePercent,
    }
    const tenant: TenantProfile = {
      personType: tenantType,
      pjTaxRegime: tenantType === 'pj' ? tenantPjRegime : undefined,
    }
    return {
      baseRent,
      propertyType,
      condominiumFee,
      iptuAmount,
      transitionYear: params.transitionYear,
      landlord,
      tenant,
    }
  }, [
    baseRent,
    propertyType,
    condominiumFee,
    landlordType,
    landlordPropertiesCount,
    landlordAnnualIncome,
    landlordPjRegime,
    managementFeePercent,
    tenantType,
    tenantPjRegime,
    params.transitionYear,
  ])

  const validation = useMemo(
    () => ValidationEngine.validateLeaseInput(contractInput),
    [contractInput],
  )

  const fieldErrors = useMemo(
    () =>
      validation.errors.reduce<Record<string, string>>((acc, err) => {
        acc[err.field] = err.message
        return acc
      }, {}),
    [validation],
  )

  const isConsulted = baseRent > 0

  const { result, executionError } = useMemo(() => {
    if (!isConsulted || !validation.isValid) return { result: null, executionError: null }
    try {
      return {
        result: TaxCalculatorEngine.calculateContract(contractInput, params),
        executionError: null,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado na apuração tributária'
      return { result: null, executionError: message }
    }
  }, [isConsulted, validation.isValid, contractInput, params])

  // Cada erro já aparece sob o seu próprio campo; aqui só o aviso de que há
  // algo a corrigir, para não repetir a mesma frase duas vezes na tela.
  const errorPanel = (
    <div className="p-6 bg-danger-bg border-2 border-danger-border rounded-2xl space-y-2">
      <h3 className="flex items-center gap-2.5 text-lg font-semibold text-danger-text">
        <AlertCircle className="w-6 h-6 shrink-0" aria-hidden="true" />
        Confira os valores
      </h3>
      {executionError && <p className="text-base text-danger-text">{executionError}</p>}
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Formulário */}
      <section className="lg:col-span-6 bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold text-text-primary tracking-tight border-b border-sim-border pb-4">
          Dados do aluguel
        </h2>

        <SegmentedControl
          legend="Tipo do imóvel"
          value={propertyType}
          onChange={setPropertyType}
          options={[
            { value: 'residential', label: 'Residencial', icon: Home },
            { value: 'commercial', label: 'Comercial', icon: Building },
          ]}
        />

        <div className="border-t border-sim-border pt-5 space-y-5">
          <BRLInput
            label="Valor do aluguel por mês"
            prefix="R$"
            value={baseRent}
            onChange={setBaseRent}
            error={fieldErrors.baseRent}
          />

          <BRLInput
            label="Condomínio por mês"
            prefix="R$"
            value={condominiumFee}
            onChange={setCondominiumFee}
            error={fieldErrors.condominiumFee}
          />
        </div>

        <div className="border-t border-sim-border pt-5 space-y-5">
          <SegmentedControl
            legend="Quem é o dono do imóvel"
            value={landlordType}
            onChange={setLandlordType}
            options={[
              { value: 'pf', label: 'Pessoa Física', icon: User },
              { value: 'pj', label: 'Empresa', icon: Briefcase },
            ]}
          />

          {landlordType === 'pf' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-surface-muted rounded-2xl border border-sim-border">
              <BRLInput
                label="Quantos imóveis aluga"
                decimals={0}
                value={landlordPropertiesCount}
                onChange={setLandlordPropertiesCount}
                error={fieldErrors.totalPropertiesRented}
                placeholder="0"
                min={0}
              />
              <BRLInput
                label="Recebido de aluguel no ano"
                prefix="R$"
                value={landlordAnnualIncome}
                onChange={setLandlordAnnualIncome}
                error={fieldErrors.totalAnnualRentalIncome}
                min={0}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-surface-muted rounded-2xl border border-sim-border">
              <div>
                <label
                  htmlFor="regime-locador"
                  className="block text-base font-semibold text-text-primary mb-2"
                >
                  Regime da empresa
                </label>
                <select
                  id="regime-locador"
                  value={landlordPjRegime}
                  onChange={(e) => setLandlordPjRegime(e.target.value as TaxRegimePJ)}
                  className="w-full min-h-[52px] bg-surface border border-sim-border-strong rounded-xl px-3.5 text-lg font-semibold text-text-primary focus:border-accent-bg focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-bg/40 cursor-pointer"
                >
                  <option value="lucro_presumido">Lucro Presumido</option>
                  <option value="lucro_real">Lucro Real</option>
                  <option value="simples_nacional">Simples Nacional</option>
                </select>
              </div>

              <BRLInput
                label="Taxa da imobiliária"
                suffix="%"
                decimals={1}
                value={managementFeePercent}
                onChange={setManagementFeePercent}
                error={fieldErrors.managementFeePercent}
                placeholder="0,0"
                min={0}
                max={100}
              />
            </div>
          )}
        </div>

        <div className="border-t border-sim-border pt-5 space-y-5">
          <SegmentedControl
            legend="Quem aluga o imóvel"
            value={tenantType}
            onChange={setTenantType}
            options={[
              { value: 'pf', label: 'Pessoa Física', icon: User },
              { value: 'pj', label: 'Empresa', icon: Briefcase },
            ]}
          />

          {tenantType === 'pj' && (
            <div>
              <label
                htmlFor="regime-locatario"
                className="block text-base font-semibold text-text-primary mb-2"
              >
                Regime de quem aluga
              </label>
              <select
                id="regime-locatario"
                value={tenantPjRegime}
                onChange={(e) => setTenantPjRegime(e.target.value as TaxRegimePJ)}
                className="w-full min-h-[52px] bg-surface border border-sim-border-strong rounded-xl px-3.5 text-lg font-semibold text-text-primary focus:border-accent-bg focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-bg/40 cursor-pointer"
              >
                <option value="lucro_real">Lucro Real</option>
                <option value="lucro_presumido">Lucro Presumido</option>
                <option value="simples_nacional">Simples Nacional</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Resultado */}
      <section className="lg:col-span-6 bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-sim-border pb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary tracking-tight">
            Resultado
          </h2>

          {isProfessional && (
            <div className="flex items-center gap-1 p-1 bg-surface-muted border border-sim-border rounded-full">
              <button
                type="button"
                onClick={() => setActiveSubView('simulation')}
                aria-pressed={activeSubView === 'simulation'}
                className={`flex items-center gap-2 px-3.5 min-h-[40px] rounded-full text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-bg/40 ${
                  activeSubView === 'simulation'
                    ? 'bg-accent-bg text-accent-fg'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                Cálculo
              </button>
              <button
                type="button"
                onClick={() => setActiveSubView('audit')}
                aria-pressed={activeSubView === 'audit'}
                className={`flex items-center gap-2 px-3.5 min-h-[40px] rounded-full text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-bg/40 ${
                  activeSubView === 'audit'
                    ? 'bg-accent-bg text-accent-fg'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <FileCheck2 className="w-4 h-4" aria-hidden="true" />
                Parecer
              </button>
            </div>
          )}
        </div>

        <div aria-live="polite" className="space-y-5">
          {validation.errors.length > 0 ? (
            errorPanel
          ) : !isConsulted ? (
            <p className="py-12 px-6 text-center text-lg font-medium text-text-secondary bg-surface-muted rounded-2xl border-2 border-dashed border-sim-border-strong">
              Informe o valor do aluguel.
            </p>
          ) : !result ? (
            errorPanel
          ) : showAudit ? (
            <AuditReportView report={result.auditReport} />
          ) : (
            <>
              {result.validationWarnings.length > 0 && (
                <div className="p-4 bg-warning-bg border-2 border-warning-border rounded-2xl text-base text-warning-text space-y-2">
                  {result.validationWarnings.map((w, idx) => (
                    <p key={idx} className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{w}</span>
                    </p>
                  ))}
                </div>
              )}

              <div className="bg-surface-muted border border-sim-border rounded-2xl p-5 sm:p-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                    Imposto por mês em {result.transitionYear}
                  </p>
                  <p className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight tabular-nums mt-1">
                    {formatBRL(result.totalTaxDue)}
                  </p>
                </div>

                <p
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-base font-semibold ${
                    result.enquadramento.isTaxpayer
                      ? 'bg-positive-bg border border-positive-border text-positive-text'
                      : 'bg-surface-muted border border-sim-border-strong text-text-secondary'
                  }`}
                >
                  {result.enquadramento.isTaxpayer ? (
                    <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                  )}
                  {result.enquadramento.isTaxpayer ? 'Paga IBS e CBS' : 'Não paga IBS e CBS'}
                </p>
              </div>

              <dl className="bg-surface-muted rounded-2xl p-5 border border-sim-border text-base space-y-3">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">Aluguel</dt>
                  <dd className="font-semibold tabular-nums text-text-primary">
                    {formatBRL(result.baseRent)}
                  </dd>
                </div>

                {result.excludedCharges > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Condomínio e IPTU (fora do imposto)</dt>
                    <dd className="font-semibold tabular-nums text-info-text">
                      {formatBRL(result.excludedCharges)}
                    </dd>
                  </div>
                )}

                {propertyType === 'residential' && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Desconto de moradia</dt>
                    <dd className="font-semibold tabular-nums text-positive-text">
                      &minus; {formatBRL(result.socialDeductionApplied)}
                    </dd>
                  </div>
                )}

                <div className="flex justify-between gap-4 border-t border-sim-border pt-3 font-semibold text-text-primary">
                  <dt>Valor sobre o qual incide o imposto</dt>
                  <dd className="tabular-nums">{formatBRL(result.taxableBase)}</dd>
                </div>

                {result.landlordCredits.hasRightToCredits && (
                  <>
                    <div className="flex justify-between gap-4 border-t border-sim-border pt-3">
                      <dt className="text-text-secondary">Crédito da taxa da imobiliária</dt>
                      <dd className="font-semibold tabular-nums text-positive-text">
                        &minus; {formatBRL(result.landlordCredits.managementFeeIbsCbsCredit)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-sim-border pt-3 text-lg font-bold text-text-primary">
                      <dt>Imposto a pagar</dt>
                      <dd className="tabular-nums">
                        {formatBRL(result.landlordCredits.netTaxToPay)}
                      </dd>
                    </div>
                  </>
                )}
              </dl>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-muted border border-sim-border rounded-2xl p-5 space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                    Se cobrar do inquilino
                  </p>
                  <p className="text-2xl font-bold text-text-primary tabular-nums">
                    {formatBRL(result.scenarios.passedToTenant.finalTenantCost)}
                  </p>
                  <p className="text-base text-text-secondary">
                    Você fica com {formatBRL(result.scenarios.passedToTenant.landlordNetIncome)}
                  </p>
                </div>

                <div className="bg-surface-muted border border-sim-border rounded-2xl p-5 space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                    Se você pagar o imposto
                  </p>
                  <p className="text-2xl font-bold text-text-primary tabular-nums">
                    {formatBRL(result.scenarios.absorbedByLandlord.landlordNetIncome)}
                  </p>
                  <p className="text-base text-text-secondary">
                    Inquilino paga {formatBRL(result.scenarios.absorbedByLandlord.finalTenantCost)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
