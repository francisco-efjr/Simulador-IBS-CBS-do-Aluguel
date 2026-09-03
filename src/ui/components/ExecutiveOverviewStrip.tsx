import React from 'react';
import { Scale, Home, Calendar, Receipt } from 'lucide-react';

export const ExecutiveOverviewStrip: React.FC = () => {
  const pillars = [
    {
      icon: Scale,
      label: 'Art. 142 da LC 214/2025',
      title: 'Redutor de 60% para Imóveis',
      desc: 'Alíquota de locação reduzida a 40% da alíquota padrão de referência nacional.',
      accent: 'emerald',
    },
    {
      icon: Home,
      label: 'Locação Residencial PF',
      title: 'Redutor Social de R$ 600/mês',
      desc: 'Dedução direta da base de cálculo para pessoas físicas com até 3 imóveis locados.',
      accent: 'blue',
    },
    {
      icon: Calendar,
      label: 'Ano-Calendário 2026',
      title: 'Fase de Teste (1,0%)',
      desc: 'CBS de 0,9% e IBS de 0,1% recolhidos com compensação em tributos federais.',
      accent: 'amber',
    },
    {
      icon: Receipt,
      label: 'Locatário PJ Corporativo',
      title: 'Não Cumulatividade Plena',
      desc: 'Empresas locatárias aproveitam 100% do IBS e CBS pagos como crédito tributário.',
      accent: 'purple',
    },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-5 border-b border-[#E5E0D8] dark:border-[#222733] bg-[#F7F4EE]/50 dark:bg-[#0C0E12]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-white dark:bg-[#14171F] border border-[#E2DDD3] dark:border-[#222733] flex items-start gap-3 transition-colors"
              >
                <div className="p-2 rounded-lg bg-[#FAF8F5] dark:bg-[#1A1E27] border border-[#E8E3DA] dark:border-[#2A303D] text-[#161616] dark:text-[#E2E8F0] shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#787570] dark:text-[#8C94A0] block">
                    {item.label}
                  </span>
                  <h3 className="text-xs sm:text-sm font-semibold text-[#161616] dark:text-[#F3F4F6] leading-snug mt-0.5">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-[#6B6864] dark:text-[#94A3B8] leading-tight mt-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
