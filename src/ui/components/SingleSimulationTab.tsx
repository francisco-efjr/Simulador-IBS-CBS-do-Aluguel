import React, { useState } from 'react';
import {
  Home,
  Building,
  User,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  CheckCircle2,
  FileSpreadsheet,
  FileCheck2,
} from 'lucide-react';
import {
  PropertyType,
  PersonType,
  TaxParameters,
  LandlordProfile,
  TenantProfile,
  TaxRegimePJ,
} from '../../core/domain/types.ts';
import { TaxCalculatorEngine } from '../../core/services/TaxCalculatorEngine.ts';
import { ValidationEngine } from '../../core/domain/ValidationEngine.ts';
import { AuditReportView } from './AuditReportView.tsx';
import { BRLInput } from './BRLInput.tsx';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface SingleSimulationTabProps {
  params: TaxParameters;
}

export const SingleSimulationTab: React.FC<SingleSimulationTabProps> = ({ params }) => {
  // Estado da Ficha de Operação
  const [propertyType, setPropertyType] = useState<PropertyType>('residential');
  const [landlordType, setLandlordType] = useState<PersonType>('pf');
  const [landlordPropertiesCount, setLandlordPropertiesCount] = useState<number>(5);
  const [landlordAnnualIncome, setLandlordAnnualIncome] = useState<number>(500000);
  const [landlordPjRegime, setLandlordPjRegime] = useState<TaxRegimePJ>('lucro_presumido');
  const [managementFeePercent, setManagementFeePercent] = useState<number>(10);

  // Inquilino
  const [tenantType, setTenantType] = useState<PersonType>('pf');
  const [tenantPjRegime, setTenantPjRegime] = useState<TaxRegimePJ>('lucro_real');

  // Valores financeiros
  const [baseRent, setBaseRent] = useState<number>(3500);
  const [condominiumFee, setCondominiumFee] = useState<number>(650);
  const [iptuAmount, setIptuAmount] = useState<number>(180);

  // Tab interna para Nota de Simulação vs Laudo de Auditoria
  const [activeSubView, setActiveSubView] = useState<'simulation' | 'audit'>('simulation');

  // Perfil montado
  const landlord: LandlordProfile = {
    personType: landlordType,
    totalPropertiesRented: landlordType === 'pf' ? landlordPropertiesCount : undefined,
    totalAnnualRentalIncome: landlordType === 'pf' ? landlordAnnualIncome : undefined,
    pjTaxRegime: landlordType === 'pj' ? landlordPjRegime : undefined,
    managementFeePercent,
  };

  const tenant: TenantProfile = {
    personType: tenantType,
    pjTaxRegime: tenantType === 'pj' ? tenantPjRegime : undefined,
  };

  const contractInput = {
    baseRent,
    propertyType,
    condominiumFee,
    iptuAmount,
    transitionYear: params.transitionYear,
    landlord,
    tenant,
  };

  // Validação estrita
  const validation = ValidationEngine.validateLeaseInput(contractInput);
  const fieldErrors = validation.errors.reduce<Record<string, string>>((acc, err) => {
    acc[err.field] = err.message;
    return acc;
  }, {});

  // Execução do Pipeline Unificado (protegido contra exceções de validação)
  let result = null;
  let executionError: string | null = null;
  if (validation.isValid) {
    try {
      result = TaxCalculatorEngine.calculateContract(contractInput, params);
    } catch (err: any) {
      executionError = err.message || 'Erro inesperado na apuração tributária';
    }
  }

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LADO ESQUERDO: FICHA DA OPERAÇÃO */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Ficha da Operação
            </h2>
            <span className="text-xs text-slate-400 font-mono">Ano: {params.transitionYear}</span>
          </div>

          {/* 1. Tipo de Imóvel */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Destinação do Imóvel
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPropertyType('residential')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                  propertyType === 'residential'
                    ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Residencial</span>
              </button>

              <button
                type="button"
                onClick={() => setPropertyType('commercial')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                  propertyType === 'commercial'
                    ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Comercial</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {propertyType === 'residential'
                ? `✓ Redutor Social de ${formatBRL(params.socialDeductionResidential)}/mês é aplicado na base de cálculo (Art. 260).`
                : '✕ Imóveis comerciais não fazem jus ao Redutor Social.'}
            </p>
          </div>

          {/* 2. Valores Financeiros e Encargos Acessórios */}
          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Composição do Contrato de Locação
              </label>
              <span className="text-[11px] text-emerald-400">Arts. 255 e 260</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Aluguel Base Mensal (R$) <span className="text-emerald-400">*incide IBS/CBS</span>
              </label>
              <BRLInput
                prefix="R$"
                value={baseRent}
                onChange={setBaseRent}
                error={fieldErrors.baseRent}
                placeholder="0,00"
                className="text-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                  <span>Condomínio Mensal</span>
                  <span className="text-[10px] text-slate-500">isento de IBS/CBS</span>
                </label>
                <BRLInput
                  prefix="R$"
                  value={condominiumFee}
                  onChange={setCondominiumFee}
                  error={fieldErrors.condominiumFee}
                  placeholder="0,00"
                  className="py-1 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                  <span>IPTU Mensal</span>
                  <span className="text-[10px] text-slate-500">isento de IBS/CBS</span>
                </label>
                <BRLInput
                  prefix="R$"
                  value={iptuAmount}
                  onChange={setIptuAmount}
                  error={fieldErrors.iptuAmount}
                  placeholder="0,00"
                  className="py-1 text-xs"
                />
              </div>
              <div className="sm:col-span-2 text-[10px] text-slate-500">
                Total bruto do recibo: <span className="text-slate-300 font-mono">{formatBRL(result ? result.totalTenantReceipt : (baseRent + condominiumFee + iptuAmount))}</span> (Encargos acessórios expurgados da base de tributação).
              </div>
            </div>
          </div>

          {/* 3. Locador (Proprietário) com UX Condicional Limpa */}
          <div className="border-t border-slate-800/80 pt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Locador (Proprietário)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setLandlordType('pf')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                  landlordType === 'pf'
                    ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Pessoa Física</span>
              </button>

              <button
                type="button"
                onClick={() => setLandlordType('pj')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                  landlordType === 'pj'
                    ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Pessoa Jurídica (Holding)</span>
              </button>
            </div>

            {landlordType === 'pf' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Nº de Imóveis Alugados
                  </label>
                  <BRLInput
                    decimals={0}
                    value={landlordPropertiesCount}
                    onChange={setLandlordPropertiesCount}
                    error={fieldErrors.totalPropertiesRented}
                    placeholder="0"
                    min={0}
                    className="py-1 text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Teto habitualidade: &gt; {params.pfPropertyThreshold} imóveis</span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Receita Anual Total (R$)
                  </label>
                  <BRLInput
                    prefix="R$"
                    value={landlordAnnualIncome}
                    onChange={setLandlordAnnualIncome}
                    error={fieldErrors.totalAnnualRentalIncome}
                    placeholder="0,00"
                    min={0}
                    className="py-1 text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Teto habitualidade: &gt; {formatBRL(params.pfAnnualIncomeThreshold)}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Regime Tributário da PJ
                    </label>
                    <select
                      value={landlordPjRegime}
                      onChange={(e) => setLandlordPjRegime(e.target.value as TaxRegimePJ)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="lucro_presumido">Lucro Presumido</option>
                      <option value="lucro_real">Lucro Real</option>
                      <option value="simples_nacional">Simples Nacional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Taxa de Imobiliária (%)
                    </label>
                    <BRLInput
                      suffix="%"
                      decimals={1}
                      value={managementFeePercent}
                      onChange={setManagementFeePercent}
                      error={fieldErrors.managementFeePercent}
                      placeholder="0,0"
                      min={0}
                      max={100}
                      className="py-1 text-xs"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-semibold">Crédito de Insumos:</span> A PJ toma crédito de IBS/CBS sobre a comissão da imobiliária ({managementFeePercent}%).
                </div>
              </div>
            )}
          </div>

          {/* 4. Locatário (Inquilino) */}
          <div className="border-t border-slate-800/80 pt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Locatário (Inquilino)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setTenantType('pf')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                  tenantType === 'pf'
                    ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Pessoa Física</span>
              </button>

              <button
                type="button"
                onClick={() => setTenantType('pj')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                  tenantType === 'pj'
                    ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Pessoa Jurídica</span>
              </button>
            </div>

            {tenantType === 'pj' && (
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Regime do Inquilino PJ:</span>
                <select
                  value={tenantPjRegime}
                  onChange={(e) => setTenantPjRegime(e.target.value as TaxRegimePJ)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  <option value="lucro_real">Lucro Real (Crédito Integral)</option>
                  <option value="lucro_presumido">Lucro Presumido (Crédito Integral)</option>
                  <option value="simples_nacional">Simples Nacional</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO: RESULTADO / NOTA DA SIMULAÇÃO / LAUDO DE AUDITORIA */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubView('simulation')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeSubView === 'simulation'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Memória de Apuração</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubView('audit')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeSubView === 'audit'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Laudo de Auditoria</span>
                </button>
              </div>
              <span className="text-xs font-mono text-slate-400">LC 214/2025</span>
            </div>

            {!result ? (
              <div className="p-6 bg-red-950/20 border border-red-500/40 rounded-2xl text-center space-y-3 my-4">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                <h4 className="text-sm font-bold text-red-200">Entrada Inválida no Contrato</h4>
                <p className="text-xs text-red-300/80 max-w-sm mx-auto">
                  {executionError || 'Existem campos com valores incorretos no formulário ao lado. Corrija-os para visualizar a memória de cálculo.'}
                </p>
                <div className="text-[11px] text-red-400 text-left bg-red-950/40 p-3 rounded-lg border border-red-900/60 max-w-sm mx-auto space-y-1">
                  {validation.errors.map((e, idx) => (
                    <div key={idx}>• {e.message}</div>
                  ))}
                </div>
              </div>
            ) : activeSubView === 'audit' ? (
              <AuditReportView report={result.auditReport} />
            ) : (
              <div className="space-y-4">
                {/* Avisos de Inconsistência Cadastral */}
                {result.validationWarnings && result.validationWarnings.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
                    {result.validationWarnings.map((w, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Badge de Status do Enquadramento */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    result.enquadramento.isTaxpayer
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-950/70 border-slate-700/80 text-slate-300'
                  }`}
                >
                  {result.enquadramento.isTaxpayer ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {result.enquadramento.isTaxpayer
                          ? '• Contribuinte — Sujeito ao IBS/CBS'
                          : '• Não Contribuinte — Isento de IBS/CBS'}
                      </span>
                    </div>
                    <p className="text-xs mt-1 text-slate-400 leading-relaxed">
                      {result.enquadramento.reason}
                    </p>
                  </div>
                </div>

                {/* Tabela de Detalhamento do Cálculo Auditado */}
                <div className="space-y-2 bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 text-xs sm:text-sm font-mono">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-sans text-slate-400">Aluguel Base (Fato Gerador):</span>
                    <span className="font-semibold text-slate-100">{formatBRL(result.baseRent)}</span>
                  </div>

                  {result.excludedCharges > 0 && (
                    <div className="flex justify-between items-center text-blue-400 text-xs">
                      <span className="font-sans text-blue-300">Encargos Excluídos (IPTU/Condo):</span>
                      <span>+ {formatBRL(result.excludedCharges)} (isento)</span>
                    </div>
                  )}

                  {propertyType === 'residential' && (
                    <div className="flex justify-between items-center text-emerald-400 text-xs">
                      <span className="font-sans text-emerald-300">Redutor Social (Art. 260):</span>
                      <span>- {formatBRL(result.socialDeductionApplied)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-2 font-bold">
                    <span className="font-sans text-slate-400">Base Tributável Líquida:</span>
                    <span className="text-slate-200">{formatBRL(result.taxableBase)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-sans text-slate-400">Alíquota Efetiva ({result.transitionYear}):</span>
                    <span className="text-slate-200 font-semibold">
                      {result.effectiveRate}%{' '}
                      <span className="text-xs text-slate-500 font-sans">
                        (c/ 70% de redução)
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                    <div>CBS ({result.effectiveCbsRate}%): <span className="text-slate-200 font-semibold">{formatBRL(result.cbsAmount)}</span></div>
                    <div>IBS ({result.effectiveIbsRate}%): <span className="text-slate-200 font-semibold">{formatBRL(result.ibsAmount)}</span></div>
                  </div>

                  <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg text-emerald-300 text-sm sm:text-base font-bold mt-2">
                    <span className="font-sans">IBS + CBS Bruto Devido:</span>
                    <span className="text-lg">{formatBRL(result.totalTaxDue)}</span>
                  </div>

                  {result.landlordCredits.hasRightToCredits && (
                    <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1 text-slate-300 font-sans">
                      <div className="flex justify-between text-emerald-400 font-mono">
                        <span>(-) Crédito Taxa Imobiliária:</span>
                        <span>- {formatBRL(result.landlordCredits.managementFeeIbsCbsCredit)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-200 font-mono">
                        <span>IBS + CBS Líquido a Recolher:</span>
                        <span className="text-amber-400">{formatBRL(result.landlordCredits.netTaxToPay)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Comparação dos Cenários de Impacto Financeiro (apenas se válido) */}
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                  Se Repassado ao Locatário
                </span>
                <div className="text-lg font-bold text-slate-100 font-mono">
                  {formatBRL(result.scenarios.passedToTenant.finalTenantCost)}
                </div>
                <p className="text-[11px] text-slate-400">
                  Inquilino assume o tributo. Locador retém {formatBRL(result.scenarios.passedToTenant.landlordNetIncome)} líquidos.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  Se Absorvido pelo Locador
                </span>
                <div className="text-lg font-bold text-slate-100 font-mono">
                  {formatBRL(result.scenarios.absorbedByLandlord.landlordNetIncome)}
                </div>
                <p className="text-[11px] text-slate-400">
                  Locador absorve tributo e taxa. Inquilino paga {formatBRL(result.scenarios.absorbedByLandlord.finalTenantCost)}.
                </p>
              </div>
            </div>
          )}

          {/* Análise de Crédito B2B */}
          {result && tenantType === 'pj' && (
            <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-blue-300">Aproveitamento de Crédito B2B:</span> {result.creditAnalysis.note}
                {result.creditAnalysis.eligibleForCredit && (
                  <div className="mt-1 font-mono text-blue-100">
                    Crédito recuperado: <span className="font-bold text-emerald-400">{formatBRL(result.creditAnalysis.creditAmount)}</span> | Custo final corporativo: <span className="font-bold">{formatBRL(result.creditAnalysis.netCostForTenantPJ)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
