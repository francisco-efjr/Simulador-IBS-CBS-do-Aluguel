import React from 'react';
import { BookOpen, CheckCircle, HelpCircle, Shield, Building } from 'lucide-react';
import { LEGAL_REFERENCES } from '../../core/domain/constants.ts';

export const LegalReferencesModal: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Guia Jurídico e Fundamentação Legal
            </h2>
            <p className="text-xs text-slate-400">
              {LEGAL_REFERENCES.LC_NUMBER} &bull; {LEGAL_REFERENCES.CONSTITUTIONAL_AMENDMENT}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Fato Gerador e Regime Específico */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Building className="w-4 h-4" />
              <span>Regime Específico de Bens Imóveis (Arts. 248 a 265)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A locação, sublocação, arrendamento e cessão onerosa de bens imóveis passam expressamente a ser fatos geradores do IBS e da CBS.
              A lei unificou o tratamento das operações imobiliárias sob um regime diferenciado.
            </p>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">Art. 265:</span> Obrigatoriedade de registro dos imóveis no Cadastro de Identificação de Bens Imóveis (CIB) integrado ao Sinter.
            </div>
          </div>

          {/* Card 2: Redução de 70% na Alíquota */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Redução de 70% na Alíquota (Art. 260)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Para evitar elevação excessiva nos custos de moradia e locação, a legislação concedeu um benefício de <strong>70% de desconto</strong> sobre a alíquota-padrão de referência.
            </p>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">Fórmula:</span> Alíquota Efetiva = Alíquota Referência (ex: 26,5%) &times; (1 - 0,70) = <strong className="text-slate-200">7,95%</strong>.
            </div>
          </div>

          {/* Card 3: Redutor Social Residencial */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Redutor Social de R$ 600/mês (Art. 260)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nas locações de imóveis exclusivamente <strong>residenciais</strong>, é deduzido o valor fixo de R$ 600,00 por mês por imóvel da base de cálculo antes da aplicação das alíquotas.
            </p>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">Exemplo:</span> Aluguel de R$ 2.000 $\rightarrow$ Base: R$ 1.400 $\rightarrow$ Tributo (7,95%): R$ 111,30 (alíquota real de 5,56%).
            </div>
          </div>

          {/* Card 4: Enquadramento da Pessoa Física */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>Critérios de Habitualidade da PF</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A pessoa física proprietária só será considerada contribuinte do IBS e da CBS se cumprir <strong>cumulativamente</strong>:
            </p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>Possuir mais de 3 imóveis alugados no ano (&gt; 3);</li>
              <li>Receita anual com aluguéis superior a R$ 240.000,00.</li>
            </ul>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              Caso não atinja ambos os requisitos, a PF é não-contribuinte, pagando apenas IRPF.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
