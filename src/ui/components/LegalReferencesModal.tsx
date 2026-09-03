import React from 'react';
import { BookOpen, CheckCircle2, Shield, Building, Scale } from 'lucide-react';
import { LEGAL_REFERENCES } from '../../core/domain/constants.ts';

export const LegalReferencesModal: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/[0.05] border border-white/[0.08] text-emerald-400 rounded-xl shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Dossiê Jurídico &amp; Fundamentação Regulatória
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bases estatutárias da {LEGAL_REFERENCES.LC_NUMBER} e da {LEGAL_REFERENCES.CONSTITUTIONAL_AMENDMENT}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full self-start sm:self-auto">
            Regime Diferenciado Imobiliário
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Fato Gerador e Regime Específico */}
          <div className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm tracking-tight">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Regime Específico de Bens Imóveis (Arts. 248 a 265)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A locação, sublocação, arrendamento e cessão onerosa de bens imóveis passam expressamente a ser fatos geradores do IBS e da CBS. A norma unifica o tratamento das operações sob sistemática diferenciada de tributação e não cumulatividade.
            </p>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-white/[0.06] text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold font-mono">Art. 265:</span> Obrigatoriedade de integração ao Cadastro Imobiliário Brasileiro (CIB/Sinter) para fins de regularidade fiscal e escrituração eletrônica.
            </div>
          </div>

          {/* Card 2: Redução de 70% na Alíquota */}
          <div className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm tracking-tight">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Redução Setorial de 70% na Alíquota (Art. 260)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Para mitigar impactos nos custos de habitação e contratos comerciais, a legislação estabelece uma redução estrutural de <strong className="text-slate-100">70% de desconto</strong> incidente sobre a alíquota-padrão de referência da União, Estados e Municípios.
            </p>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-white/[0.06] text-[11px] text-slate-400 font-mono">
              <span className="text-emerald-400 font-semibold font-sans">Apuração:</span> Alíquota Efetiva = 26,5% &times; (1 - 0,70) = <span className="text-emerald-400 font-bold">7,95%</span>
            </div>
          </div>

          {/* Card 3: Redutor Social Residencial */}
          <div className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm tracking-tight">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Redutor Social Residencial de R$ 600,00/mês (Art. 260, §2º)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nos contratos de locação exclusivamente <strong className="text-slate-100">residenciais</strong>, deduz-se o montante de R$ 600,00 por mês por imóvel diretamente da base de cálculo tributável antes da incidência das alíquotas de IBS e CBS.
            </p>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-white/[0.06] text-[11px] text-slate-400 font-mono">
              <span className="text-emerald-400 font-semibold font-sans">Simulação:</span> Aluguel R$ 2.000 &rarr; Base R$ 1.400 &rarr; Tributo (7,95%): <span className="text-emerald-400 font-bold">R$ 111,30</span> (alíquota média de 5,56%)
            </div>
          </div>

          {/* Card 4: Enquadramento da Pessoa Física */}
          <div className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm tracking-tight">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Critérios de Habitualidade da Pessoa Física</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O locador pessoa física unicamente é equiparado a contribuinte de IBS/CBS se preencher <strong className="text-slate-100">cumulativamente</strong> os dois requisitos de habitualidade econômica:
            </p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>Possuir mais de 3 unidades imobiliárias locadas no exercício (&gt; 3);</li>
              <li>Receita anual total de locação superior a R$ 240.000,00.</li>
            </ul>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-white/[0.06] text-[11px] text-slate-400">
              Caso não atinja ambos os gatilhos, o locador PF usufrui de isenção plena de IBS/CBS, recolhendo apenas o IRPF Carnê-Leão.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
