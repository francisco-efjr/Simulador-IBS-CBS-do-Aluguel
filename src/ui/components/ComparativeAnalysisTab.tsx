import React, { useState } from 'react';
import {
  Scale,
  Lightbulb,
  Building2,
  User,
  Calendar,
} from 'lucide-react';
import { PropertyType, PersonType, TaxParameters, LandlordProfile } from '../../core/domain/types.ts';
import { ComparativeEngine } from '../../core/services/ComparativeEngine.ts';
import { BRLInput } from './BRLInput.tsx';

interface ComparativeAnalysisTabProps {
  params: TaxParameters;
}

export const ComparativeAnalysisTab: React.FC<ComparativeAnalysisTabProps> = ({ params }) => {
  const [rent, setRent] = useState<number>(8000);
  const [propertyType, setPropertyType] = useState<PropertyType>('residential');
  const [personType, setPersonType] = useState<PersonType>('pf');
  const [propertiesCount, setPropertiesCount] = useState<number>(5);
  const [annualIncome, setAnnualIncome] = useState<number>(300000);
  const [managementFee, setManagementFee] = useState<number>(10);

  const landlord: LandlordProfile = {
    personType,
    totalPropertiesRented: propertiesCount,
    totalAnnualRentalIncome: annualIncome,
    managementFeePercent: managementFee,
  };

  const comparison = ComparativeEngine.compare(
    rent,
    propertyType,
    landlord,
    params,
    params.transitionYear
  );

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      {/* Controles de Configuração da Simulação Comparativa */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            Configuração do Cenário Comparativo
          </h2>
          <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Simulando Ano: {params.transitionYear}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Aluguel Mensal</label>
            <BRLInput
              prefix="R$"
              value={rent}
              onChange={setRent}
              placeholder="0,00"
              min={0}
              className="py-1 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Taxa Imobiliária (%)</label>
            <BRLInput
              suffix="%"
              decimals={1}
              value={managementFee}
              onChange={setManagementFee}
              placeholder="0,0"
              min={0}
              max={100}
              className="py-1 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Destinação</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPropertyType('residential')}
                className={`py-1.5 px-3 rounded-xl border text-xs font-semibold ${
                  propertyType === 'residential'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Residencial
              </button>
              <button
                type="button"
                onClick={() => setPropertyType('commercial')}
                className={`py-1.5 px-3 rounded-xl border text-xs font-semibold ${
                  propertyType === 'commercial'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Comercial
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Estrutura do Titular</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPersonType('pf')}
                className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  personType === 'pf'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Pessoa Física</span>
              </button>
              <button
                type="button"
                onClick={() => setPersonType('pj')}
                className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  personType === 'pj'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Holding (PJ)</span>
              </button>
            </div>
          </div>
        </div>

        {personType === 'pf' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/60">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">
                Total de Imóveis Locados da PF (teste habitualidade &gt; {params.pfPropertyThreshold})
              </label>
              <BRLInput
                decimals={0}
                value={propertiesCount}
                onChange={setPropertiesCount}
                placeholder="0"
                min={0}
                className="py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">
                Receita Anual Total de Aluguéis da PF (teste habitualidade &gt; {formatBRL(params.pfAnnualIncomeThreshold)})
              </label>
              <BRLInput
                prefix="R$"
                value={annualIncome}
                onChange={setAnnualIncome}
                placeholder="0,00"
                min={0}
                className="py-1 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Comparação Lado a Lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Sistema Atual (Pré-Reforma) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs text-slate-400 font-medium">Regime Vigente Atual</span>
              <h3 className="text-base font-bold text-slate-100">{comparison.preReform.systemName}</h3>
            </div>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-mono rounded-lg">
              Pré-Reforma
            </span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="font-sans text-slate-400">Receita Bruta:</span>
              <span className="font-semibold">{formatBRL(comparison.monthlyRent)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="font-sans text-slate-400">Carga Tributária Efetiva:</span>
              <span className="text-red-400 font-bold">{comparison.preReform.estimatedTaxRate}%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="font-sans text-slate-400">Tributos Mensais Apurados:</span>
              <span className="text-red-400 font-bold">{formatBRL(comparison.preReform.estimatedTaxAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-2 text-sm sm:text-base font-bold text-emerald-400">
              <span className="font-sans">Ganho Líquido (após impostos e taxa):</span>
              <span>{formatBRL(comparison.preReform.netIncome)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
            {comparison.preReform.notes}
          </p>
        </div>

        {/* Card Novo Sistema (Pós-Reforma LC 214/2025) */}
        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs text-emerald-400 font-medium">Novo Regime (LC 214/2025)</span>
              <h3 className="text-base font-bold text-slate-100">IBS + CBS (Ano {comparison.transitionYear})</h3>
            </div>
            <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-lg">
              Pós-Reforma
            </span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="font-sans text-slate-400">Status do Enquadramento:</span>
              <span className="font-semibold text-slate-200">
                {comparison.postReform.isTaxpayer ? 'Contribuinte de IBS/CBS' : 'Isento de IBS/CBS'}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="font-sans text-slate-400">IBS/CBS Efetivo do Período:</span>
              <span className="text-amber-400 font-bold">{formatBRL(comparison.postReform.ibscbsAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="font-sans text-slate-400">Tributação Consolidada Total:</span>
              <span className="text-red-400 font-bold">{formatBRL(comparison.postReform.totalTaxEstimated)}</span>
            </div>
            <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-2 text-sm sm:text-base font-bold text-emerald-400">
              <span className="font-sans">Ganho Líquido (se absorvido):</span>
              <span>{formatBRL(comparison.postReform.netIncomeIfAbsorbed)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
            {comparison.postReform.notes}
          </p>
        </div>
      </div>

      {/* Insights e Estratégia de Planejamento Patrimonial */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Parecer do Auditor: Estruturação Patrimonial e Transição
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-slate-100 block text-sm">Pessoa Física vs Holding Imobiliária:</span>
            <p>
              • <strong>Pequenos locadores (&le; 3 imóveis e &le; R$ 240k/ano):</strong> A permanência na PF é altamente recomendada, pois não haverá incidência de IBS/CBS.
            </p>
            <p>
              • <strong>Holdings com despesas operacionais:</strong> A holding toma créditos de IBS/CBS sobre reformas, manutenções e taxa de imobiliária ({managementFee}%), reduzindo o custo líquido tributário.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-slate-100 block text-sm">Efeito do Ano de Transição ({params.transitionYear}):</span>
            <p>
              • Em <strong>2026</strong>, a alíquota efetiva de locação é de apenas <strong>0,30%</strong> (ano de teste), subindo para <strong>2,64%</strong> em 2027 (CBS plena) e atingindo <strong>7,95%</strong> apenas em 2033.
            </p>
            <p>
              • O impacto tributário gradual permite renegociação de contratos existentes e adaptação de cláusulas de repasse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
