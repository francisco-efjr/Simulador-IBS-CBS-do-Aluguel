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
  Calculator,
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
  // Estado da Ficha de Operação (inicia zerado para simulação real)
  const [propertyType, setPropertyType] = useState<PropertyType>('residential');
  const [landlordType, setLandlordType] = useState<PersonType>('pf');
  const [landlordPropertiesCount, setLandlordPropertiesCount] = useState<number>(0);
  const [landlordAnnualIncome, setLandlordAnnualIncome] = useState<number>(0);
  const [landlordPjRegime, setLandlordPjRegime] = useState<TaxRegimePJ>('lucro_presumido');
  const [managementFeePercent, setManagementFeePercent] = useState<number>(0);

  // Inquilino
  const [tenantType, setTenantType] = useState<PersonType>('pf');
  const [tenantPjRegime, setTenantPjRegime] = useState<TaxRegimePJ>('lucro_real');

  // Valores financeiros (iniciam zerados)
  const [baseRent, setBaseRent] = useState<number>(0);
  const [condominiumFee, setCondominiumFee] = useState<number>(0);
  const [iptuAmount, setIptuAmount] = useState<number>(0);

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

  // Execução do Pipeline Unificado (apenas se houver valor de aluguel consultado)
  const isConsulted = baseRent > 0;
  let result = null;
  let executionError: string | null = null;
  if (isConsulted && validation.isValid) {
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
        <div className="lg:col-span-6 bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between border-b border-[#F0ECE5] pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-medium text-[#161616] tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#161616]"></span>
                Parâmetros do Contrato de Locação
              </h2>
              <p className="text-xs text-[#6B6864] mt-0.5">
                Identificação das partes, destinação do imóvel e valores contratuais
              </p>
            </div>
            <span className="text-xs font-mono text-[#161616] bg-[#FAF8F5] border border-[#E5E0D8] px-3 py-1 rounded-full shrink-0">
              Ano: {params.transitionYear}
            </span>
          </div>

          {/* 1. Destinação do Imóvel */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#161616] mb-2">
              Destinação do Imóvel
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPropertyType('residential')}
                className={`flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-3 rounded-full border text-xs sm:text-sm font-medium transition-all select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-black/20 ${
                  propertyType === 'residential'
                    ? 'bg-[#161616] dark:bg-white border-[#161616] dark:border-white text-white dark:text-[#161616] font-semibold shadow-sm'
                    : 'bg-[#FAF8F5] dark:bg-[#1A1E27] border-[#E5E0D8] dark:border-[#2C3240] text-[#6B6864] dark:text-[#94A3B8] hover:border-[#161616] dark:hover:border-white hover:text-[#161616] dark:hover:text-white'
                }`}
              >
                <Home className={`w-4 h-4 ${propertyType === 'residential' ? 'text-white dark:text-[#161616]' : 'text-[#8C8882]'}`} />
                <span>Residencial</span>
              </button>

              <button
                type="button"
                onClick={() => setPropertyType('commercial')}
                className={`flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-3 rounded-full border text-xs sm:text-sm font-medium transition-all select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-black/20 ${
                  propertyType === 'commercial'
                    ? 'bg-[#161616] dark:bg-white border-[#161616] dark:border-white text-white dark:text-[#161616] font-semibold shadow-sm'
                    : 'bg-[#FAF8F5] dark:bg-[#1A1E27] border-[#E5E0D8] dark:border-[#2C3240] text-[#6B6864] dark:text-[#94A3B8] hover:border-[#161616] dark:hover:border-white hover:text-[#161616] dark:hover:text-white'
                }`}
              >
                <Building className={`w-4 h-4 ${propertyType === 'commercial' ? 'text-white dark:text-[#161616]' : 'text-[#8C8882]'}`} />
                <span>Comercial</span>
              </button>
            </div>
            <p className="text-[11px] text-[#787570] mt-2">
              {propertyType === 'residential'
                ? `✓ Redutor Social de ${formatBRL(params.socialDeductionResidential)}/mês é aplicado diretamente na base de cálculo (Art. 260, §2º).`
                : '✕ Imóveis comerciais não fazem jus ao benefício do Redutor Social.'}
            </p>
          </div>

          {/* 2. Valores Financeiros e Encargos Acessórios */}
          <div className="border-t border-[#F0ECE5] pt-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#161616]">
                Composição Financeira da Locação
              </label>
              <span className="text-[11px] font-mono text-[#1E6B2C] bg-[#EAF4EC] border border-[#D4E8D7] px-2.5 py-0.5 rounded-full">
                Arts. 255 e 260
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#161616] mb-1.5">
                Aluguel Base Mensal (R$) <span className="text-[#1E6B2C] font-semibold">*Fato Gerador IBS/CBS</span>
              </label>
              <BRLInput
                prefix="R$"
                value={baseRent}
                onChange={setBaseRent}
                error={fieldErrors.baseRent}
                placeholder="0,00"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D8]">
              <div>
                <label className="block text-[11px] font-medium text-[#6B6864] mb-1 flex items-center justify-between">
                  <span>Condomínio Mensal</span>
                  <span className="text-[10px] text-[#8C8882]">não tributável</span>
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
                <label className="block text-[11px] font-medium text-[#6B6864] mb-1 flex items-center justify-between">
                  <span>IPTU Mensal</span>
                  <span className="text-[10px] text-[#8C8882]">não tributável</span>
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
              <div className="sm:col-span-2 text-[11px] text-[#6B6864] border-t border-[#E5E0D8] pt-2.5">
                Recibo Total do Locatário: <span className="text-[#161616] font-mono font-semibold">{formatBRL(result ? result.totalTenantReceipt : (baseRent + condominiumFee + iptuAmount))}</span> (Encargos acessórios expurgados da base de incidência).
              </div>
            </div>
          </div>

          {/* 3. Locador (Proprietário) com UX Condicional Limpa */}
          <div className="border-t border-[#F0ECE5] pt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#161616] mb-2">
              Perfil do Locador (Proprietário)
            </label>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <button
                type="button"
                onClick={() => setLandlordType('pf')}
                className={`flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-3 rounded-full border text-xs sm:text-sm font-medium transition-all select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-black/20 ${
                  landlordType === 'pf'
                    ? 'bg-[#161616] dark:bg-white border-[#161616] dark:border-white text-white dark:text-[#161616] font-semibold shadow-sm'
                    : 'bg-[#FAF8F5] dark:bg-[#1A1E27] border-[#E5E0D8] dark:border-[#2C3240] text-[#6B6864] dark:text-[#94A3B8] hover:border-[#161616] dark:hover:border-white hover:text-[#161616] dark:hover:text-white'
                }`}
              >
                <User className={`w-3.5 h-3.5 ${landlordType === 'pf' ? 'text-white dark:text-[#161616]' : 'text-[#8C8882]'}`} />
                <span>Pessoa Física</span>
              </button>

              <button
                type="button"
                onClick={() => setLandlordType('pj')}
                className={`flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-3 rounded-full border text-xs sm:text-sm font-medium transition-all select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-black/20 ${
                  landlordType === 'pj'
                    ? 'bg-[#161616] dark:bg-white border-[#161616] dark:border-white text-white dark:text-[#161616] font-semibold shadow-sm'
                    : 'bg-[#FAF8F5] dark:bg-[#1A1E27] border-[#E5E0D8] dark:border-[#2C3240] text-[#6B6864] dark:text-[#94A3B8] hover:border-[#161616] dark:hover:border-white hover:text-[#161616] dark:hover:text-white'
                }`}
              >
                <Briefcase className={`w-3.5 h-3.5 ${landlordType === 'pj' ? 'text-white dark:text-[#161616]' : 'text-[#8C8882]'}`} />
                <span>Pessoa Jurídica (Holding)</span>
              </button>
            </div>

            {landlordType === 'pf' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D8]">
                <div>
                  <label className="block text-[11px] font-medium text-[#6B6864] mb-1">
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
                  <span className="text-[10px] text-[#787570] mt-1 block">Teto habitualidade: &gt; {params.pfPropertyThreshold} unidades</span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#6B6864] mb-1">
                    Receita Anual com Aluguéis (R$)
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
                  <span className="text-[10px] text-[#787570] mt-1 block">Teto habitualidade: &gt; {formatBRL(params.pfAnnualIncomeThreshold)}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D8] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#6B6864] mb-1">
                      Regime Tributário PJ
                    </label>
                    <select
                      value={landlordPjRegime}
                      onChange={(e) => setLandlordPjRegime(e.target.value as TaxRegimePJ)}
                      className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#161616] focus:border-[#161616] focus:outline-none"
                    >
                      <option value="lucro_presumido">Lucro Presumido</option>
                      <option value="lucro_real">Lucro Real</option>
                      <option value="simples_nacional">Simples Nacional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#6B6864] mb-1">
                      Taxa de Administração Imobiliária (%)
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
                <div className="text-[11px] text-[#6B6864] border-t border-[#E5E0D8] pt-2">
                  <span className="text-[#1E6B2C] font-semibold">Crédito Financeiro sobre Insumos:</span> A PJ credita-se do IBS/CBS sobre a comissão de intermediação ({managementFeePercent}%).
                </div>
              </div>
            )}
          </div>

          {/* 4. Locatário (Inquilino) */}
          <div className="border-t border-[#F0ECE5] pt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#161616] mb-2">
              Perfil do Locatário (Inquilino)
            </label>
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <button
                type="button"
                onClick={() => setTenantType('pf')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-full border text-xs sm:text-sm font-medium transition-all select-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                  tenantType === 'pf'
                    ? 'bg-[#161616] border-[#161616] text-white font-semibold'
                    : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#6B6864] hover:border-[#161616] hover:text-[#161616]'
                }`}
              >
                <User className={`w-3.5 h-3.5 ${tenantType === 'pf' ? 'text-white' : 'text-[#8C8882]'}`} />
                <span>Pessoa Física</span>
              </button>

              <button
                type="button"
                onClick={() => setTenantType('pj')}
                className={`flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-3 rounded-full border text-xs sm:text-sm font-medium transition-all select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-black/20 ${
                  tenantType === 'pj'
                    ? 'bg-[#161616] dark:bg-white border-[#161616] dark:border-white text-white dark:text-[#161616] font-semibold shadow-sm'
                    : 'bg-[#FAF8F5] dark:bg-[#1A1E27] border-[#E5E0D8] dark:border-[#2C3240] text-[#6B6864] dark:text-[#94A3B8] hover:border-[#161616] dark:hover:border-white hover:text-[#161616] dark:hover:text-white'
                }`}
              >
                <Briefcase className={`w-3.5 h-3.5 ${tenantType === 'pj' ? 'text-white dark:text-[#161616]' : 'text-[#8C8882]'}`} />
                <span>Pessoa Jurídica</span>
              </button>
            </div>

            {tenantType === 'pj' && (
              <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#1A1E27] rounded-2xl border border-[#E5E0D8] dark:border-[#2C3240] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-[#161616] dark:text-[#EDEDED] font-medium">Regime do Locatário PJ:</span>
                <select
                  value={tenantPjRegime}
                  onChange={(e) => setTenantPjRegime(e.target.value as TaxRegimePJ)}
                  className="bg-white dark:bg-[#14171F] border border-[#E5E0D8] dark:border-[#2C3240] rounded-xl px-3 py-1.5 text-xs text-[#161616] dark:text-[#EDEDED] focus:border-[#161616] focus:outline-none cursor-pointer"
                >
                  <option value="lucro_real">Lucro Real (Crédito Integral)</option>
                  <option value="lucro_presumido">Lucro Presumido (Crédito Integral)</option>
                  <option value="simples_nacional">Simples Nacional</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO: DEMONSTRATIVO EXECUTIVO / LAUDO DE AUDITORIA */}
        <div className="lg:col-span-6 bg-white dark:bg-[#14171F] border border-[#E5E0D8] dark:border-[#222733] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6">
          <div>
            {/* Alternador de Sub-visões (Memória Fiscal vs Laudo Técnico) em Pílulas */}
            <div className="flex items-center justify-between border-b border-[#F0ECE5] dark:border-[#222733] pb-4 mb-4">
              <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] dark:bg-[#1A1E27] border border-[#E5E0D8] dark:border-[#2C3240] rounded-full">
                <button
                  type="button"
                  onClick={() => setActiveSubView('simulation')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeSubView === 'simulation'
                      ? 'bg-[#161616] dark:bg-white text-white dark:text-[#161616] shadow-sm'
                      : 'text-[#6B6864] dark:text-[#94A3B8] hover:text-[#161616] dark:hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${activeSubView === 'simulation' ? 'text-white dark:text-[#161616]' : 'text-[#8C8882]'}`} />
                  <span>Demonstrativo Fiscal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubView('audit')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeSubView === 'audit'
                      ? 'bg-[#161616] dark:bg-white text-white dark:text-[#161616] shadow-sm'
                      : 'text-[#6B6864] dark:text-[#94A3B8] hover:text-[#161616] dark:hover:text-white'
                  }`}
                >
                  <FileCheck2 className={`w-3.5 h-3.5 ${activeSubView === 'audit' ? 'text-white dark:text-[#161616]' : 'text-[#8C8882]'}`} />
                  <span>Parecer Técnico</span>
                </button>
              </div>
              <span className="text-xs font-mono text-[#787570] dark:text-[#8C94A0] hidden sm:inline">LC 214/2025</span>
            </div>

            {!isConsulted ? (
              validation.errors.length > 0 ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3 my-4">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <h4 className="text-sm font-serif font-semibold text-red-900">Parâmetros Contratuais Incorretos</h4>
                  <p className="text-xs text-red-700/80 max-w-sm mx-auto">
                    {executionError || 'Existem campos com valores incorretos no formulário ao lado. Ajuste-os para gerar o cálculo.'}
                  </p>
                  <div className="text-[11px] text-red-700 text-left bg-red-100/70 p-3 rounded-xl border border-red-200 max-w-sm mx-auto space-y-1">
                    {validation.errors.map((e, idx) => (
                      <div key={idx}>• {e.message}</div>
                    ))}
                  </div>
                </div>
              ) : activeSubView === 'audit' ? (
                <div className="p-8 border border-dashed border-[#E5E0D8] rounded-2xl text-center space-y-4 my-auto bg-[#FAF8F5]/50">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E0D8] text-[#161616] flex items-center justify-center mx-auto shadow-sm">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-serif font-medium text-[#161616]">Laudo Técnico de Auditoria</h3>
                    <p className="text-xs text-[#6B6864] max-w-md mx-auto leading-relaxed">
                      Preencha o <strong className="text-[#161616]">Aluguel Base Mensal</strong> no formulário ao lado para emitir o laudo de conformidade fiscal e trilha de auditoria normativa da LC 214/2025.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-[#E5E0D8] rounded-2xl text-center space-y-4 my-auto bg-[#FAF8F5]/50">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E0D8] text-[#161616] flex items-center justify-center mx-auto shadow-sm">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-serif font-medium text-[#161616]">Calculadora Zerada &bull; Aguardando Parâmetros</h3>
                    <p className="text-xs text-[#6B6864] max-w-md mx-auto leading-relaxed">
                      Preencha o <strong className="text-[#161616]">Aluguel Base Mensal</strong> no formulário ao lado para consultar a memória de cálculo do IBS/CBS, alíquotas da LC 214/2025, redutor social e cenários de repasse.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto pt-2 text-left">
                    <div className="bg-white p-3 rounded-xl border border-[#E5E0D8] space-y-0.5 shadow-sm">
                      <span className="text-[10px] uppercase font-semibold text-[#787570] block">Fato Gerador</span>
                      <span className="text-xs font-mono font-medium text-[#161616]">Aluguel Base</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-[#E5E0D8] space-y-0.5 shadow-sm">
                      <span className="text-[10px] uppercase font-semibold text-[#787570] block">Redutor Social</span>
                      <span className="text-xs font-mono font-medium text-[#161616]">Art. 260 LC 214</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-[#E5E0D8] space-y-0.5 shadow-sm col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-semibold text-[#787570] block">Transição</span>
                      <span className="text-xs font-mono text-[#1E6B2C] font-semibold">{params.transitionYear}</span>
                    </div>
                  </div>
                </div>
              )
            ) : !result ? (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3 my-4">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                <h4 className="text-sm font-serif font-semibold text-red-900">Parâmetros Contratuais Pendentes</h4>
                <p className="text-xs text-red-700/80 max-w-sm mx-auto">
                  {executionError || 'Existem campos com valores incorretos no formulário ao lado. Ajuste-os para gerar o cálculo.'}
                </p>
                <div className="text-[11px] text-red-700 text-left bg-red-100/70 p-3 rounded-xl border border-red-200 max-w-sm mx-auto space-y-1">
                  {validation.errors.map((e, idx) => (
                    <div key={idx}>• {e.message}</div>
                  ))}
                </div>
              </div>
            ) : activeSubView === 'audit' ? (
              <AuditReportView report={result.auditReport} />
            ) : (
              <div className="space-y-4">
                {/* Alerta de Inconsistências se houver */}
                {result.validationWarnings && result.validationWarnings.length > 0 && (
                  <div className="p-3.5 bg-[#FEF7ED] border border-[#FDE68A] rounded-2xl text-xs text-[#92400E] space-y-1">
                    {result.validationWarnings.map((w, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#92400E] shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* HERO STAT (Estilo Bronn / Nordic Accounting: Tipografia Grande com Serifa, Limpa e Confiante) */}
                <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#787570]">
                      IBS + CBS Bruto Devido
                    </span>
                    <div className="text-3xl sm:text-4xl font-serif text-[#161616] font-normal tracking-tight tabular-nums mt-1">
                      {formatBRL(result.totalTaxDue)}
                    </div>
                    <span className="text-xs text-[#6B6864] mt-1 block">
                      Alíquota efetiva apurada: <span className="font-mono text-[#161616] font-semibold">{result.effectiveRate}%</span> (ano {result.transitionYear})
                    </span>
                  </div>

                  <div className="border-t border-[#E5E0D8] sm:border-t-0 pt-3 sm:pt-0 sm:border-l sm:border-[#E5E0D8] sm:pl-5 text-left sm:text-right">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#787570] block">
                      Status Fiscal
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono uppercase tracking-wider mt-1.5 ${
                      result.enquadramento.isTaxpayer
                        ? 'bg-[#EAF4EC] border border-[#D4E8D7] text-[#1E6B2C]'
                        : 'bg-[#F5F2EB] border border-[#E5E0D8] text-[#6B6864]'
                    }`}>
                      {result.enquadramento.isTaxpayer ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Contribuinte
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Não Contribuinte
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Síntese Legal de Enquadramento */}
                <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E0D8] text-xs text-[#6B6864] leading-relaxed">
                  <span className="font-semibold text-[#161616] block mb-0.5">Fundamentação do Enquadramento:</span>
                  {result.enquadramento.reason}
                </div>

                {/* Detalhamento Contábil das Parcelas (Bronn Accounting Ledger) */}
                <div className="space-y-2.5 bg-[#FAF8F5] rounded-2xl p-5 border border-[#E5E0D8] text-xs sm:text-sm">
                  <div className="flex justify-between items-center text-[#161616]">
                    <span className="text-[#6B6864]">Aluguel Base (Fato Gerador):</span>
                    <span className="font-mono font-semibold text-[#161616] tabular-nums">{formatBRL(result.baseRent)}</span>
                  </div>

                  {result.excludedCharges > 0 && (
                    <div className="flex justify-between items-center text-[#1D528F] text-xs">
                      <span className="text-[#1D528F]">Encargos Excluídos (IPTU / Condomínio):</span>
                      <span className="font-mono tabular-nums">+ {formatBRL(result.excludedCharges)} (não tributável)</span>
                    </div>
                  )}

                  {propertyType === 'residential' && (
                    <div className="flex justify-between items-center text-[#1E6B2C] text-xs">
                      <span className="text-[#1E6B2C]">Redutor Social Residencial (Art. 260):</span>
                      <span className="font-mono tabular-nums">- {formatBRL(result.socialDeductionApplied)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[#161616] border-t border-[#E5E0D8] pt-2.5 font-semibold">
                    <span className="text-[#6B6864]">Base Efetiva Tributável:</span>
                    <span className="font-mono tabular-nums text-[#161616]">{formatBRL(result.taxableBase)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#E5E0D8] text-xs text-[#6B6864]">
                    <div>CBS ({result.effectiveCbsRate}%): <span className="font-mono text-[#161616] font-semibold tabular-nums">{formatBRL(result.cbsAmount)}</span></div>
                    <div>IBS ({result.effectiveIbsRate}%): <span className="font-mono text-[#161616] font-semibold tabular-nums">{formatBRL(result.ibsAmount)}</span></div>
                  </div>

                  {result.landlordCredits.hasRightToCredits && (
                    <div className="pt-2.5 border-t border-[#E5E0D8] text-xs space-y-1.5 text-[#161616]">
                      <div className="flex justify-between text-[#1E6B2C] font-mono">
                        <span className="font-sans">(-) Crédito Taxa de Administração PJ:</span>
                        <span className="tabular-nums">- {formatBRL(result.landlordCredits.managementFeeIbsCbsCredit)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#161616] font-mono pt-1.5 border-t border-[#E5E0D8]">
                        <span className="font-sans">IBS + CBS Líquido a Recolher:</span>
                        <span className="text-[#1E6B2C] tabular-nums">{formatBRL(result.landlordCredits.netTaxToPay)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Comparação dos Cenários de Repasse Financeiro */}
          {result && activeSubView === 'simulation' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-4 sm:p-5 space-y-1.5">
                <span className="text-[11px] font-semibold text-[#1D528F] uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#1D528F]" />
                  Cenário Repasse ao Locatário
                </span>
                <div className="text-xl font-serif font-medium text-[#161616] tabular-nums">
                  {formatBRL(result.scenarios.passedToTenant.finalTenantCost)}
                </div>
                <p className="text-[11px] text-[#6B6864] leading-relaxed">
                  Custo final assumido pelo locatário. O locador retém <span className="font-mono text-[#161616] font-semibold">{formatBRL(result.scenarios.passedToTenant.landlordNetIncome)}</span> líquidos.
                </p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-4 sm:p-5 space-y-1.5">
                <span className="text-[11px] font-semibold text-[#92400E] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#92400E]" />
                  Cenário Absorção pelo Locador
                </span>
                <div className="text-xl font-serif font-medium text-[#161616] tabular-nums">
                  {formatBRL(result.scenarios.absorbedByLandlord.landlordNetIncome)}
                </div>
                <p className="text-[11px] text-[#6B6864] leading-relaxed">
                  Receita líquida retida após absorção fiscal e operacional. Locatário desembolsa <span className="font-mono text-[#161616] font-semibold">{formatBRL(result.scenarios.absorbedByLandlord.finalTenantCost)}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Análise de Crédito Tributário B2B */}
          {result && tenantType === 'pj' && activeSubView === 'simulation' && (
            <div className="bg-[#EEF3FA] border border-[#D8E5F5] rounded-2xl p-4 text-xs text-[#1D528F] flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#1D528F] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#1D528F]">Crédito Fiscal B2B:</span> {result.creditAnalysis.note}
                {result.creditAnalysis.eligibleForCredit && (
                  <div className="mt-1 font-mono text-[#1D528F] text-[11px]">
                    Crédito recuperável: <span className="font-bold text-[#1E6B2C]">{formatBRL(result.creditAnalysis.creditAmount)}</span> &bull; Custo corporativo efetivo: <span className="font-bold text-[#161616]">{formatBRL(result.creditAnalysis.netCostForTenantPJ)}</span>
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
