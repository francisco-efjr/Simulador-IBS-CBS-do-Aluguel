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
      <div className="bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0ECE5] pb-4 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-medium text-[#161616] tracking-tight flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#161616]" />
              Diagnóstico Comparativo de Regimes Tributários
            </h2>
            <p className="text-xs text-[#6B6864] mt-0.5">
              Simulação comparativa entre a estrutura tributária vigente e o modelo IBS/CBS da LC 214/2025
            </p>
          </div>
          <span className="text-xs text-[#161616] bg-[#FAF8F5] border border-[#E5E0D8] px-3.5 py-1 rounded-full font-mono flex items-center gap-1.5 self-start sm:self-auto shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#787570]" />
            Ano-Base: {params.transitionYear}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-[#161616] font-medium mb-1.5">Aluguel Mensal (R$)</label>
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
            <label className="block text-xs text-[#161616] font-medium mb-1.5">Taxa de Administração (%)</label>
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
            <label className="block text-xs text-[#161616] font-medium mb-1.5">Destinação do Imóvel</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPropertyType('residential')}
                className={`py-2 px-3 rounded-full border text-xs font-semibold transition-all ${
                  propertyType === 'residential'
                    ? 'bg-[#161616] border-[#161616] text-white shadow-sm'
                    : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#6B6864] hover:border-[#161616] hover:text-[#161616]'
                }`}
              >
                Residencial
              </button>
              <button
                type="button"
                onClick={() => setPropertyType('commercial')}
                className={`py-2 px-3 rounded-full border text-xs font-semibold transition-all ${
                  propertyType === 'commercial'
                    ? 'bg-[#161616] border-[#161616] text-white shadow-sm'
                    : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#6B6864] hover:border-[#161616] hover:text-[#161616]'
                }`}
              >
                Comercial
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#161616] font-medium mb-1.5">Titularidade Patrimonial</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPersonType('pf')}
                className={`py-2 px-3 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  personType === 'pf'
                    ? 'bg-[#161616] border-[#161616] text-white shadow-sm'
                    : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#6B6864] hover:border-[#161616] hover:text-[#161616]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Pessoa Física</span>
              </button>
              <button
                type="button"
                onClick={() => setPersonType('pj')}
                className={`py-2 px-3 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  personType === 'pj'
                    ? 'bg-[#161616] border-[#161616] text-white shadow-sm'
                    : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#6B6864] hover:border-[#161616] hover:text-[#161616]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Holding (PJ)</span>
              </button>
            </div>
          </div>
        </div>

        {personType === 'pf' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#F0ECE5]">
            <div>
              <label className="block text-xs text-[#6B6864] font-medium mb-1">
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
              <label className="block text-xs text-[#6B6864] font-medium mb-1">
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
        <div className="p-8 border border-dashed border-[#E5E0D8] rounded-2xl sm:rounded-3xl text-center space-y-4 my-2 bg-[#FAF8F5]/50">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E0D8] text-[#161616] flex items-center justify-center mx-auto shadow-sm">
            <Scale className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-serif font-medium text-[#161616]">Simulação Comparativa Zerada</h3>
            <p className="text-xs text-[#6B6864] max-w-md mx-auto leading-relaxed">
              Informe o valor do <strong className="text-[#161616]">Aluguel Mensal</strong> no painel acima para comparar a carga tributária do regime atual (Carnê-Leão / Lucro Presumido) com o novo modelo IBS/CBS da LC 214/2025.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2 text-xs text-[#6B6864] font-mono">
            <span className="bg-white px-3 py-1 rounded-full border border-[#E5E0D8] shadow-sm">IRPF Carnê-Leão</span>
            <span className="bg-white px-3 py-1 rounded-full border border-[#E5E0D8] shadow-sm">Holding Lucro Presumido</span>
            <span className="bg-[#EAF4EC] text-[#1E6B2C] px-3 py-1 rounded-full border border-[#D4E8D7] font-semibold">IBS/CBS ({params.transitionYear})</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Sistema Atual (Pré-Reforma) */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0ECE5] pb-3">
              <div>
                <span className="text-xs text-[#787570] font-medium uppercase tracking-wider">Regime Atual Vigente</span>
                <h3 className="text-base sm:text-lg font-serif font-medium text-[#161616] tracking-tight">{comparison.preReform.systemName}</h3>
              </div>
              <span className="px-3 py-1 bg-[#FAF8F5] border border-[#E5E0D8] text-[#6B6864] text-xs font-mono rounded-full">
                Pré-Reforma
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-mono">
              <div className="flex justify-between text-[#161616]">
                <span className="font-sans text-[#6B6864]">Receita Bruta Faturada:</span>
                <span className="font-semibold text-[#161616] tabular-nums">{formatBRL(comparison.monthlyRent)}</span>
              </div>
              <div className="flex justify-between text-[#161616]">
                <span className="font-sans text-[#6B6864]">Carga Tributária Efetiva:</span>
                <span className="text-rose-600 font-bold tabular-nums">{comparison.preReform.estimatedTaxRate}%</span>
              </div>
              <div className="flex justify-between text-[#161616]">
                <span className="font-sans text-[#6B6864]">Tributos Mensais Incidentes:</span>
                <span className="text-rose-600 font-bold tabular-nums">{formatBRL(comparison.preReform.estimatedTaxAmount)}</span>
              </div>
              <div className="flex justify-between text-[#161616] border-t border-[#E5E0D8] pt-2.5 text-sm sm:text-base font-bold">
                <span className="font-sans">Resultado Líquido (após tributos e taxa):</span>
                <span className="text-[#1E6B2C] tabular-nums">{formatBRL(comparison.preReform.netIncome)}</span>
              </div>
            </div>

            <p className="text-xs text-[#6B6864] bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E0D8] leading-relaxed">
              {comparison.preReform.notes}
            </p>
          </div>

          {/* Card Novo Sistema (Pós-Reforma LC 214/2025) */}
          <div className="bg-white border-2 border-[#161616] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0ECE5] pb-3">
              <div>
                <span className="text-xs text-[#1E6B2C] font-semibold uppercase tracking-wider">Novo Regime (LC 214/2025)</span>
                <h3 className="text-base sm:text-lg font-serif font-medium text-[#161616] tracking-tight">IBS + CBS (Ano {comparison.transitionYear})</h3>
              </div>
              <span className="px-3 py-1 bg-[#EAF4EC] border border-[#D4E8D7] text-[#1E6B2C] text-xs font-mono font-semibold rounded-full">
                Pós-Reforma
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-mono">
              <div className="flex justify-between text-[#161616]">
                <span className="font-sans text-[#6B6864]">Enquadramento Legal:</span>
                <span className="font-semibold text-[#161616]">
                  {comparison.postReform.isTaxpayer ? 'Contribuinte de IBS/CBS' : 'Não Contribuinte (Isento)'}
                </span>
              </div>
              <div className="flex justify-between text-[#161616]">
                <span className="font-sans text-[#6B6864]">IBS/CBS Efetivo Apurado:</span>
                <span className="text-[#1E6B2C] font-bold tabular-nums">{formatBRL(comparison.postReform.ibscbsAmount)}</span>
              </div>
              <div className="flex justify-between text-[#161616]">
                <span className="font-sans text-[#6B6864]">Carga Tributária Total Estimada:</span>
                <span className="text-[#161616] font-bold tabular-nums">{formatBRL(comparison.postReform.totalTaxEstimated)}</span>
              </div>
              <div className="flex justify-between text-[#161616] border-t border-[#E5E0D8] pt-2.5 text-sm sm:text-base font-bold">
                <span className="font-sans">Resultado Líquido (se absorvido):</span>
                <span className="text-[#1E6B2C] tabular-nums">{formatBRL(comparison.postReform.netIncomeIfAbsorbed)}</span>
              </div>
            </div>

            <p className="text-xs text-[#6B6864] bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E0D8] leading-relaxed">
              {comparison.postReform.notes}
            </p>
          </div>
        </div>
      )}

      {/* Parecer Técnico de Planejamento Patrimonial e Transição */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="border-b border-[#F0ECE5] pb-3">
          <h3 className="text-sm sm:text-base font-serif font-medium text-[#161616] flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#161616]" />
            Parecer Técnico de Planejamento Tributário &amp; Sucessório
          </h3>
          <p className="text-xs text-[#6B6864] mt-0.5">
            Orientações estratégicas sobre estrutura societária e cláusulas contratuais de repasse
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#6B6864] leading-relaxed">
          <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5E0D8] space-y-2">
            <span className="font-serif font-medium text-[#161616] block text-sm sm:text-base">Pessoa Física vs Holding Imobiliária:</span>
            <p className="text-[#6B6864]">
              &bull; <strong className="text-[#161616]">Locadores PF (&le; 3 imóveis e &le; R$ 240k/ano):</strong> A manutenção do patrimônio em nome da Pessoa Física preserva o regime de não incidência de IBS/CBS, mantendo a tributação unicamente restrita ao IRPF Carnê-Leão.
            </p>
            <p className="text-[#6B6864]">
              &bull; <strong className="text-[#161616]">Holdings Imobiliárias:</strong> A pessoa jurídica possui a faculdade de apropriar créditos de IBS/CBS sobre serviços de intermediação ({managementFee}%), manutenção e reformas prediais, amortecendo a incidência sobre o aluguel bruto.
            </p>
          </div>

          <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5E0D8] space-y-2">
            <span className="font-serif font-medium text-[#161616] block text-sm sm:text-base">Impacto do Cronograma de Transição ({params.transitionYear}):</span>
            <p className="text-[#6B6864]">
              &bull; Em <strong className="text-[#161616]">2026</strong>, a alíquota da locação é fixada em <strong className="text-[#161616]">0,30%</strong> (fase de teste), evoluindo para <strong className="text-[#161616]">2,64%</strong> em 2027 e atingindo o patamar pleno de <strong className="text-[#161616]">7,95%</strong> apenas em 2033.
            </p>
            <p className="text-[#6B6864]">
              &bull; O período de transição permite aos gestores de contratos pactuar cláusulas de reajuste gradual e neutralizar fricções comerciais com locatários.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
