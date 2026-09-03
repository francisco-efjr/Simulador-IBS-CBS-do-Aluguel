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
  const [rent, setRent] = useState<number>(0);
  const [propertyType, setPropertyType] = useState<PropertyType>('residential');
  const [personType, setPersonType] = useState<PersonType>('pf');
  const [propertiesCount, setPropertiesCount] = useState<number>(0);
  const [annualIncome, setAnnualIncome] = useState<number>(0);
  const [managementFee, setManagementFee] = useState<number>(0);

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
      <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Diagnóstico Comparativo de Regimes Tributários
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulação comparativa entre a estrutura tributária vigente e o modelo IBS/CBS da LC 214/2025
            </p>
          </div>
          <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full font-mono flex items-center gap-1.5 self-start sm:self-auto shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            Ano-Base: {params.transitionYear}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1.5">Aluguel Mensal (R$)</label>
            <BRLInput
              prefix="R$"
              value={rent}
              onChange={setRent}
              placeholder="0,00"
              min={0}
              className="py-1.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1.5">Taxa de Administração (%)</label>
            <BRLInput
              suffix="%"
              decimals={1}
              value={managementFee}
              onChange={setManagementFee}
              placeholder="0,0"
              min={0}
              max={100}
              className="py-1.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1.5">Destinação do Imóvel</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPropertyType('residential')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  propertyType === 'residential'
                    ? 'bg-white/10 border-white/20 text-white shadow-sm'
                    : 'bg-slate-950/50 border-white/[0.06] text-slate-400 hover:border-white/15 hover:text-slate-200'
                }`}
              >
                Residencial
              </button>
              <button
                type="button"
                onClick={() => setPropertyType('commercial')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  propertyType === 'commercial'
                    ? 'bg-white/10 border-white/20 text-white shadow-sm'
                    : 'bg-slate-950/50 border-white/[0.06] text-slate-400 hover:border-white/15 hover:text-slate-200'
                }`}
              >
                Comercial
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1.5">Titularidade Patrimonial</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPersonType('pf')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  personType === 'pf'
                    ? 'bg-white/10 border-white/20 text-white shadow-sm'
                    : 'bg-slate-950/50 border-white/[0.06] text-slate-400 hover:border-white/15 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Pessoa Física</span>
              </button>
              <button
                type="button"
                onClick={() => setPersonType('pj')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  personType === 'pj'
                    ? 'bg-white/10 border-white/20 text-white shadow-sm'
                    : 'bg-slate-950/50 border-white/[0.06] text-slate-400 hover:border-white/15 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Holding (PJ)</span>
              </button>
            </div>
          </div>
        </div>

        {personType === 'pf' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/[0.06]">
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">
                Volume de Imóveis Locados da PF (limite habitualidade &gt; {params.pfPropertyThreshold})
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
              <label className="block text-xs text-slate-300 font-medium mb-1">
                Receita Anual Consolidada da PF (limite habitualidade &gt; {formatBRL(params.pfAnnualIncomeThreshold)})
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

      {/* Comparação Lado a Lado ou Estado Zerado */}
      {rent === 0 ? (
        <div className="p-8 border border-dashed border-white/[0.12] rounded-2xl text-center space-y-4 my-2 bg-slate-900/40 backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Scale className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-100">Simulação Comparativa Zerada</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Informe o valor do <strong className="text-slate-200">Aluguel Mensal</strong> no painel acima para comparar a carga tributária do regime atual (Carnê-Leão / Lucro Presumido) com o novo modelo IBS/CBS da LC 214/2025.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2 text-xs text-slate-400 font-mono">
            <span className="bg-slate-950/60 px-3 py-1 rounded-lg border border-white/[0.06]">IRPF Carnê-Leão</span>
            <span className="bg-slate-950/60 px-3 py-1 rounded-lg border border-white/[0.06]">Holding Lucro Presumido</span>
            <span className="bg-emerald-950/60 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-800/40">IBS/CBS ({params.transitionYear})</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Sistema Atual (Pré-Reforma) */}
          <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Regime Atual Vigente</span>
                <h3 className="text-base font-bold text-slate-100 tracking-tight">{comparison.preReform.systemName}</h3>
              </div>
              <span className="px-2.5 py-1 bg-white/[0.06] border border-white/10 text-slate-300 text-xs font-mono rounded-lg">
                Pré-Reforma
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="font-sans text-slate-400">Receita Bruta Faturada:</span>
                <span className="font-semibold text-slate-100 tabular-nums">{formatBRL(comparison.monthlyRent)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="font-sans text-slate-400">Carga Tributária Efetiva:</span>
                <span className="text-rose-400 font-bold tabular-nums">{comparison.preReform.estimatedTaxRate}%</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="font-sans text-slate-400">Tributos Mensais Incidentes:</span>
                <span className="text-rose-400 font-bold tabular-nums">{formatBRL(comparison.preReform.estimatedTaxAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-200 border-t border-white/[0.08] pt-2 text-sm sm:text-base font-bold">
                <span className="font-sans">Resultado Líquido (após tributos e taxa):</span>
                <span className="text-emerald-400 tabular-nums">{formatBRL(comparison.preReform.netIncome)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-white/[0.06] leading-relaxed">
              {comparison.preReform.notes}
            </p>
          </div>

          {/* Card Novo Sistema (Pós-Reforma LC 214/2025) */}
          <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Novo Regime (LC 214/2025)</span>
                <h3 className="text-base font-bold text-slate-100 tracking-tight">IBS + CBS (Ano {comparison.transitionYear})</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-lg">
                Pós-Reforma
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="font-sans text-slate-400">Enquadramento Legal:</span>
                <span className="font-semibold text-slate-200">
                  {comparison.postReform.isTaxpayer ? 'Contribuinte de IBS/CBS' : 'Não Contribuinte (Isento)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="font-sans text-slate-400">IBS/CBS Efetivo Apurado:</span>
                <span className="text-emerald-400 font-bold tabular-nums">{formatBRL(comparison.postReform.ibscbsAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="font-sans text-slate-400">Carga Tributária Total Estimada:</span>
                <span className="text-slate-100 font-bold tabular-nums">{formatBRL(comparison.postReform.totalTaxEstimated)}</span>
              </div>
              <div className="flex justify-between text-slate-200 border-t border-white/[0.08] pt-2 text-sm sm:text-base font-bold">
                <span className="font-sans">Resultado Líquido (se absorvido):</span>
                <span className="text-emerald-400 tabular-nums">{formatBRL(comparison.postReform.netIncomeIfAbsorbed)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-white/[0.06] leading-relaxed">
              {comparison.postReform.notes}
            </p>
          </div>
        </div>
      )}

      {/* Parecer Técnico de Planejamento Patrimonial e Transição */}
      <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 backdrop-blur-md">
        <div className="border-b border-white/[0.08] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-400" />
            Parecer Técnico de Planejamento Tributário &amp; Sucessório
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Orientações estratégicas sobre estrutura societária e cláusulas contratuais de repasse
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-white/[0.06] space-y-2">
            <span className="font-bold text-slate-100 block text-sm">Pessoa Física vs Holding Imobiliária:</span>
            <p className="text-slate-400">
              &bull; <strong className="text-slate-200">Locadores PF (&le; 3 imóveis e &le; R$ 240k/ano):</strong> A manutenção do patrimônio em nome da Pessoa Física preserva o regime de não incidência de IBS/CBS, mantendo a tributação unicamente restrita ao IRPF Carnê-Leão.
            </p>
            <p className="text-slate-400">
              &bull; <strong className="text-slate-200">Holdings Imobiliárias:</strong> A pessoa jurídica possui a faculdade de apropriar créditos de IBS/CBS sobre serviços de intermediação ({managementFee}%), manutenção e reformas prediais, amortecendo a incidência sobre o aluguel bruto.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-white/[0.06] space-y-2">
            <span className="font-bold text-slate-100 block text-sm">Impacto do Cronograma de Transição ({params.transitionYear}):</span>
            <p className="text-slate-400">
              &bull; Em <strong className="text-slate-200">2026</strong>, a alíquota da locação é fixada em <strong className="text-slate-200">0,30%</strong> (fase de teste), evoluindo para <strong className="text-slate-200">2,64%</strong> em 2027 e atingindo o patamar pleno de <strong className="text-slate-200">7,95%</strong> apenas em 2033.
            </p>
            <p className="text-slate-400">
              &bull; O período de transição permite aos gestores de contratos pactuar cláusulas de reajuste gradual e neutralizar fricções comerciais com locatários.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
