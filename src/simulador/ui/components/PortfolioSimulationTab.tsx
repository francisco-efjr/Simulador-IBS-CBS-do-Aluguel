import React, { useMemo, useState } from 'react'
import {
  Plus,
  Trash2,
  Building,
  Home,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Coins,
  Percent,
  TrendingDown,
} from 'lucide-react'
import { PortfolioItem, TaxParameters, PropertyType, PersonType } from '../../core/domain/types.ts'
import { PortfolioEngine } from '../../core/services/PortfolioEngine.ts'
import { BRLInput } from './BRLInput.tsx'
import { SegmentedControl } from './SegmentedControl.tsx'

interface PortfolioSimulationTabProps {
  params: TaxParameters
}

const INITIAL_PORTFOLIO: PortfolioItem[] = []

export const PortfolioSimulationTab: React.FC<PortfolioSimulationTabProps> = ({ params }) => {
  const [properties, setProperties] = useState<PortfolioItem[]>(INITIAL_PORTFOLIO)
  const [isPJ, setIsPJ] = useState<boolean>(false)

  // Formulário para novo imóvel (inicia zerado)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<PropertyType>('residential')
  const [newUnitsCount, setNewUnitsCount] = useState<number | undefined>(undefined)
  const [rentPricingMode, setRentPricingMode] = useState<'per_unit' | 'total'>('total')
  const [newRent, setNewRent] = useState<number>(0)
  const [newCondo, setNewCondo] = useState<number>(0)
  const [newIptu, setNewIptu] = useState<number>(0)
  const [newTenantType, setNewTenantType] = useState<PersonType>('pf')

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || newRent <= 0) return

    const units = newUnitsCount && newUnitsCount > 1 ? newUnitsCount : 1
    const finalMonthlyRent = units > 1 && rentPricingMode === 'per_unit' ? newRent * units : newRent

    const newItem: PortfolioItem = {
      id: Date.now().toString(),
      name: newName.trim(),
      propertyType: newType,
      monthlyRent: finalMonthlyRent,
      condominiumFee: newCondo,
      iptuAmount: newIptu,
      tenantType: newTenantType,
      unitsCount: units > 1 ? units : undefined,
    }

    setProperties([...properties, newItem])
    setNewName('')
    setNewUnitsCount(undefined)
    setRentPricingMode('total')
    setNewRent(0)
    setNewCondo(0)
    setNewIptu(0)
  }

  const handleRemoveProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id))
  }

  // A carteira inteira é reavaliada a cada tecla no formulário sem esta memoização.
  const summary = useMemo(
    () => PortfolioEngine.evaluatePortfolio(properties, isPJ, params, params.transitionYear),
    [properties, isPJ, params],
  )

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Portfólio com Toggle PF / PJ */}
      <div className="bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-serif font-medium text-text-primary tracking-tight">
              Gestão de Portfólio Imobiliário &amp; Apuração Consolidada
            </h2>
            <span className="text-xs bg-surface-muted border border-sim-border text-text-secondary px-3 py-0.5 rounded-full font-sim-mono">
              {properties.length} {properties.length === 1 ? 'ativo' : 'ativos'}
              {summary.totalUnits > properties.length && ` • ${summary.totalUnits} unidades`}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Projeção agregada de carga fiscal de IBS/CBS, teste de habitualidade da PF e dedução de
            encargos não tributáveis
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-surface-muted p-1.5 rounded-full border border-sim-border shrink-0">
          <span className="text-xs text-text-muted font-medium pl-2 hidden sm:inline">
            Titularidade:
          </span>
          <button
            type="button"
            onClick={() => setIsPJ(false)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !isPJ
                ? 'bg-accent-bg text-accent-fg shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Pessoa Física (PF)
          </button>
          <button
            type="button"
            onClick={() => setIsPJ(true)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isPJ
                ? 'bg-accent-bg text-accent-fg shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Holding Patrimonial (PJ)
          </button>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas (Estilo Bronn: Números Grandes e Confiantes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-sim-border rounded-2xl p-5 space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Receita Mensal Bruta</span>
            <Wallet className="w-4 h-4 text-text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-text-primary font-normal tracking-tight tabular-nums">
            {formatBRL(summary.totalMonthlyRent)}
          </div>
          <div className="text-xs text-text-secondary font-sim-mono">
            {formatBRL(summary.totalAnnualRent)}{' '}
            <span className="text-text-muted font-sim">ao ano</span>
          </div>
        </div>

        <div className="bg-surface border border-sim-border rounded-2xl p-5 space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Redutores Sociais</span>
            <TrendingDown className="w-4 h-4 text-info-text" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-info-text font-normal tracking-tight tabular-nums">
            - {formatBRL(summary.totalMonthlySocialDeduction)}
          </div>
          <div className="text-xs text-text-secondary">
            {summary.residentialUnitsCount}{' '}
            {summary.residentialUnitsCount === 1 ? 'imóvel residencial' : 'unidades residenciais'}
          </div>
        </div>

        <div className="bg-surface border border-sim-border rounded-2xl p-5 space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-text-muted text-xs font-semibold uppercase tracking-wider">
            <span>IBS + CBS Consolidado</span>
            <Coins className="w-4 h-4 text-positive-text" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-positive-text font-normal tracking-tight tabular-nums">
            {formatBRL(summary.totalMonthlyIBSCBS)}
          </div>
          <div className="text-xs text-text-secondary font-sim-mono">
            {formatBRL(summary.totalAnnualIBSCBS)}{' '}
            <span className="text-text-muted font-sim">ao ano</span>
          </div>
        </div>

        <div className="bg-surface border border-sim-border rounded-2xl p-5 space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Alíquota Efetiva Média</span>
            <Percent className="w-4 h-4 text-text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-text-primary font-normal tracking-tight tabular-nums">
            {summary.effectiveAverageRate}%
          </div>
          <div className="text-xs text-text-secondary">Ponderada sobre o portfólio</div>
        </div>
      </div>

      {/* Alerta Executivo de Enquadramento da Carteira */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 transition-all ${
          properties.length === 0
            ? 'bg-surface-muted border-sim-border text-text-secondary'
            : summary.isLandlordTaxpayer
              ? 'bg-positive-bg border-positive-border text-positive-text'
              : 'bg-surface-muted border-sim-border text-text-primary'
        }`}
      >
        {properties.length === 0 ? (
          <Building className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
        ) : summary.isLandlordTaxpayer ? (
          <ShieldCheck className="w-5 h-5 text-positive-text shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed space-y-0.5">
          <div className="font-serif font-medium text-sm sm:text-base tracking-tight text-text-primary">
            {properties.length === 0
              ? 'Status da Carteira: AGUARDANDO ATIVOS • CARTEIRA ZERADA'
              : summary.isLandlordTaxpayer
                ? 'Status da Carteira: CONTRIBUINTE ENQUADRADO NO IBS/CBS'
                : 'Status da Carteira: NÃO CONTRIBUINTE (REGIME DE ISENÇÃO PF)'}
          </div>
          <p className="text-text-secondary text-xs">
            {properties.length === 0
              ? 'Cadastre os contratos de locação no formulário para apurar o enquadramento consolidado e calcular o IBS/CBS.'
              : summary.enquadramentoReason}
          </p>
        </div>
      </div>

      {/* Grid Principal: Lista de Ativos e Formulário */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Imóveis */}
        <div className="lg:col-span-8 bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between border-b border-sim-border pb-4 mb-4">
            <h3 className="text-sm sm:text-base font-serif font-medium text-text-primary">
              Detalhamento de Ativos por Contrato
            </h3>
            <span className="text-xs text-text-muted font-sim-mono">
              Encargos expurgados da base tributável
            </span>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-sim-border rounded-2xl space-y-3 bg-surface-muted/50">
              <Building className="w-10 h-10 text-text-muted mx-auto" />
              <div className="text-sm sm:text-base font-serif font-medium text-text-primary">
                Nenhum ativo cadastrado no portfólio
              </div>
              <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                Cadastre contratos de locação pelo formulário ao lado para consultar a apuração
                agregada, enquadramento de habitualidade e projeção de carga tributária.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs font-sim-mono">
                <thead>
                  <tr className="border-b border-sim-border text-text-muted">
                    <th className="pb-3 font-sim font-semibold">Ativo Imobiliário</th>
                    <th className="pb-3 font-sim font-semibold">Destinação</th>
                    <th className="pb-3 font-sim font-semibold">Aluguel Base</th>
                    <th className="pb-3 font-sim font-semibold">Redutor Social</th>
                    <th className="pb-3 font-sim font-semibold">Base Efetiva</th>
                    <th className="pb-3 font-sim font-semibold text-right">IBS + CBS</th>
                    <th className="pb-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sim-border">
                  {summary.propertyBreakdowns.map(({ item, calculation }) => (
                    <tr key={item.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3.5 font-sim font-medium text-text-primary">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-text-primary">{item.name}</span>
                          {item.unitsCount && item.unitsCount > 1 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-sim-mono font-semibold bg-surface-muted border border-sim-border text-text-primary">
                              {item.unitsCount}{' '}
                              {item.propertyType === 'residential' ? 'apartamentos' : 'unidades'}
                            </span>
                          )}
                        </div>
                        {((item.condominiumFee ?? 0) > 0 || (item.iptuAmount ?? 0) > 0) && (
                          <div className="text-[10px] text-text-muted font-sim-mono mt-0.5">
                            Cond.: {formatBRL(item.condominiumFee ?? 0)} &bull; IPTU:{' '}
                            {formatBRL(item.iptuAmount ?? 0)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sim font-semibold border ${
                            item.propertyType === 'residential'
                              ? 'bg-positive-bg text-positive-text border-positive-border'
                              : 'bg-info-bg text-info-text border-info-border'
                          }`}
                        >
                          {item.propertyType === 'residential' ? (
                            <Home className="w-3 h-3" />
                          ) : (
                            <Building className="w-3 h-3" />
                          )}
                          {item.propertyType === 'residential' ? 'Residencial' : 'Comercial'}
                        </span>
                      </td>
                      <td className="py-3.5 text-text-primary tabular-nums font-semibold">
                        {formatBRL(item.monthlyRent)}
                      </td>
                      <td className="py-3.5 text-info-text tabular-nums">
                        {calculation.socialDeductionApplied > 0 ? (
                          <div>
                            <span className="font-semibold">
                              -{formatBRL(calculation.socialDeductionApplied)}
                            </span>
                            {item.unitsCount && item.unitsCount > 1 && (
                              <div className="text-[9px] text-text-muted font-sim">
                                {item.unitsCount}&times; redutor social
                              </div>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 text-text-secondary tabular-nums">
                        {formatBRL(calculation.taxableBase)}
                      </td>
                      <td className="py-3.5 text-right font-bold text-positive-text tabular-nums">
                        {formatBRL(calculation.totalTaxDue)}
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => handleRemoveProperty(item.id)}
                          className="text-text-muted hover:text-danger-text p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/50"
                          title="Remover imóvel da carteira"
                          aria-label={`Remover ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulário para Cadastrar Ativo */}
        <div className="lg:col-span-4 bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="border-b border-sim-border pb-3">
            <h3 className="text-sm sm:text-base font-serif font-medium text-text-primary flex items-center gap-2">
              <Plus className="w-4 h-4 text-text-primary" />
              Cadastrar Ativo no Portfólio
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Adicione unidades para recalcular o enquadramento consolidado
            </p>
          </div>

          <form onSubmit={handleAddProperty} className="space-y-3.5 text-xs">
            <div>
              <label
                htmlFor="novo-imovel-nome"
                className="block text-base font-semibold text-text-primary mb-2"
              >
                Nome do imóvel
              </label>
              <input
                id="novo-imovel-nome"
                type="text"
                placeholder="Ex: Apartamento 101"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full min-h-[52px] bg-surface-muted border border-sim-border-strong rounded-xl px-3.5 text-lg font-semibold text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-bg focus-visible:ring-4 focus-visible:ring-accent-bg/40"
                required
              />
            </div>

            <div>
              <label
                htmlFor="novo-imovel-unidades"
                className="block text-base font-semibold text-text-primary mb-2"
              >
                Quantas unidades
              </label>
              <input
                id="novo-imovel-unidades"
                type="number"
                min={1}
                step={1}
                placeholder="1"
                value={newUnitsCount !== undefined ? newUnitsCount : ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined
                  setNewUnitsCount(val && val > 0 ? val : undefined)
                }}
                className="w-full min-h-[52px] bg-surface-muted border border-sim-border-strong rounded-xl px-3.5 text-lg font-semibold tabular-nums text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-bg focus-visible:ring-4 focus-visible:ring-accent-bg/40"
              />
            </div>

            {newUnitsCount && newUnitsCount > 1 && (
              <div className="bg-surface-muted p-3 rounded-2xl border border-sim-border space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="font-semibold text-text-primary text-[11px]">
                    Critério de Aluguel ({newUnitsCount} unidades):
                  </span>
                  <div className="flex items-center gap-1 bg-surface p-1 rounded-full border border-sim-border shrink-0">
                    <button
                      type="button"
                      onClick={() => setRentPricingMode('per_unit')}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                        rentPricingMode === 'per_unit'
                          ? 'bg-accent-bg text-accent-fg shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Por Apartamento
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentPricingMode('total')}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                        rentPricingMode === 'total'
                          ? 'bg-accent-bg text-accent-fg shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Total Consolidado
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-text-secondary font-sim-mono pt-1 border-t border-sim-border">
                  {rentPricingMode === 'per_unit' ? (
                    <span>
                      Receita total consolidada:{' '}
                      <strong className="text-text-primary">
                        {formatBRL(newRent * newUnitsCount)}
                      </strong>{' '}
                      ({newUnitsCount} aptos &times; {formatBRL(newRent)})
                    </span>
                  ) : (
                    <span>
                      Aluguel médio por unidade:{' '}
                      <strong className="text-text-primary">
                        {formatBRL(newUnitsCount > 0 ? newRent / newUnitsCount : 0)}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <SegmentedControl
                legend="Tipo do imóvel"
                value={newType}
                onChange={setNewType}
                options={[
                  { value: 'residential', label: 'Residencial' },
                  { value: 'commercial', label: 'Comercial' },
                ]}
              />
            </div>

            <div>
              <BRLInput
                label={
                  newUnitsCount && newUnitsCount > 1
                    ? rentPricingMode === 'per_unit'
                      ? 'Aluguel de cada unidade'
                      : 'Aluguel somado de todas'
                    : 'Aluguel por mês'
                }
                prefix="R$"
                value={newRent}
                onChange={setNewRent}
                min={0}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <BRLInput
                label="Condomínio"
                prefix="R$"
                value={newCondo}
                onChange={setNewCondo}
                min={0}
              />
              <BRLInput label="IPTU" prefix="R$" value={newIptu} onChange={setNewIptu} min={0} />
            </div>

            <div>
              <SegmentedControl
                legend="Quem aluga"
                value={newTenantType}
                onChange={setNewTenantType}
                options={[
                  { value: 'pf', label: 'Pessoa Física' },
                  { value: 'pj', label: 'Empresa' },
                ]}
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[52px] bg-accent-bg hover:bg-accent-bg/90 text-accent-fg text-lg font-semibold rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-bg/40 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Adicionar imóvel
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
