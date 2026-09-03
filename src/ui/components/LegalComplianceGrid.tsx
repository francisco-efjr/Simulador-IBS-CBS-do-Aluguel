import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const LegalComplianceGrid: React.FC = () => {
  const norms = [
    { name: 'LC nº 214/2025', desc: 'Lei Geral do IBS, CBS e Regimes Diferenciados' },
    { name: 'EC nº 132/2023', desc: 'Emenda Constitucional da Reforma Tributária' },
    { name: 'Redutor de 60% (Art. 142)', desc: 'Redução na alíquota base para operações com bens imóveis' },
    { name: 'Redutor Social R$ 600,00', desc: 'Dedução mensal para locação residencial por Pessoa Física' },
    { name: 'Alíquotas-Teste 2026', desc: 'CBS de 0,9% e IBS de 0,1% com compensação tributária' },
    { name: 'Extinção PIS/COFINS (2027)', desc: 'Substituição das contribuições pela CBS federal plena' },
    { name: 'Transição Federativa (2029-32)', desc: 'Redução gradual do ICMS/ISS e ampliação do IBS estadual' },
    { name: 'Alíquota Plena 2033', desc: 'Vigência definitiva do modelo dual IBS/CBS sem cumulatividade' },
    { name: 'Dedução Taxa Imobiliária', desc: 'Exclusão da taxa de administração da base de cálculo' },
    { name: 'Crédito Locatário PJ', desc: 'Não cumulatividade plena para locatários comerciais' },
    { name: 'Critério de Habitualidade', desc: 'Regra de descaracterização de PF com mais de 3 imóveis' },
    { name: 'RIR / Carnê-Leão (PF)', desc: 'Tabela progressiva IRPF de até 27,5% para confronto' },
  ];

  return (
    <section id="legislacao" className="px-4 sm:px-6 lg:px-8 py-10 border-b border-[#E5E0D8] dark:border-[#222733] bg-white dark:bg-[#0B0D11] transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-[#EAE6DE] dark:border-[#1E2330]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E6B2C] dark:text-[#4ADE80] font-bold block">
              Quadro de Fundamentação Legal
            </span>
            <h2 className="text-base sm:text-lg font-serif font-semibold text-[#161616] dark:text-[#F3F4F6] mt-0.5">
              Normas e Diretrizes da Reforma Tributária
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#787570] dark:text-[#8C94A0] hidden sm:inline">
            12 dispositivos ativos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {norms.map((n, i) => (
            <div 
              key={i} 
              className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#14171F] border border-[#E0DBD2] dark:border-[#222733] hover:border-[#161616] dark:hover:border-[#3B4252] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1E6B2C] dark:text-[#4ADE80] shrink-0" />
                <span className="text-xs font-semibold text-[#161616] dark:text-[#F3F4F6] leading-tight line-clamp-1">
                  {n.name}
                </span>
              </div>
              <p className="text-[11px] text-[#6B6864] dark:text-[#94A3B8] leading-tight">
                {n.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
