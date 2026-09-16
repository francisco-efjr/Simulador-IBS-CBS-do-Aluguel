import React from 'react';
import { BookOpen, CheckCircle2, Shield, Building, Scale } from 'lucide-react';
import { LEGAL_REFERENCES } from '../../core/domain/constants.ts';

export const LegalReferencesModal: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sim-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-surface-muted border border-sim-border text-text-primary rounded-full shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-medium text-text-primary tracking-tight">
                Dossiê Jurídico &amp; Fundamentação Regulatória
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Bases estatutárias da {LEGAL_REFERENCES.LC_NUMBER} e da {LEGAL_REFERENCES.CONSTITUTIONAL_AMENDMENT}
              </p>
            </div>
          </div>
          <span className="text-xs font-sim-mono text-text-primary bg-surface-muted border border-sim-border px-3.5 py-1 rounded-full self-start sm:self-auto">
            Regime Diferenciado Imobiliário
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Fato Gerador e Regime Específico */}
          <div className="bg-surface-muted border border-sim-border rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-serif font-medium text-sm sm:text-base tracking-tight">
              <Building className="w-4 h-4 text-text-primary" />
              <span>Regime Específico de Bens Imóveis (Arts. 248 a 265)</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              A locação, sublocação, arrendamento e cessão onerosa de bens imóveis passam expressamente a ser fatos geradores do IBS e da CBS. A norma unifica o tratamento das operações sob sistemática diferenciada de tributação e não cumulatividade.
            </p>
            <div className="bg-surface p-3.5 rounded-xl border border-sim-border text-[11px] text-text-secondary shadow-sm">
              <span className="text-text-primary font-semibold font-sim-mono">Art. 265:</span> Obrigatoriedade de integração ao Cadastro Imobiliário Brasileiro (CIB/Sinter) para fins de regularidade fiscal e escrituração eletrônica.
            </div>
          </div>

          {/* Card 2: Redução de 70% na Alíquota */}
          <div className="bg-surface-muted border border-sim-border rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-serif font-medium text-sm sm:text-base tracking-tight">
              <Shield className="w-4 h-4 text-text-primary" />
              <span>Redução Setorial de 70% na Alíquota (Art. 260)</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Para mitigar impactos nos custos de habitação e contratos comerciais, a legislação estabelece uma redução estrutural de <strong className="text-text-primary">70% de desconto</strong> incidente sobre a alíquota-padrão de referência da União, Estados e Municípios.
            </p>
            <div className="bg-surface p-3.5 rounded-xl border border-sim-border text-[11px] text-text-secondary font-sim-mono shadow-sm">
              <span className="text-text-primary font-semibold font-sim">Apuração:</span> Alíquota Efetiva = 26,5% &times; (1 - 0,70) = <span className="text-positive-text font-bold">7,95%</span>
            </div>
          </div>

          {/* Card 3: Redutor Social Residencial */}
          <div className="bg-surface-muted border border-sim-border rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-serif font-medium text-sm sm:text-base tracking-tight">
              <CheckCircle2 className="w-4 h-4 text-positive-text" />
              <span>Redutor Social Residencial de R$ 600,00/mês (Art. 260, §2º)</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Nos contratos de locação exclusivamente <strong className="text-text-primary">residenciais</strong>, deduz-se o montante de R$ 600,00 por mês por imóvel diretamente da base de cálculo tributável antes da incidência das alíquotas de IBS e CBS.
            </p>
            <div className="bg-surface p-3.5 rounded-xl border border-sim-border text-[11px] text-text-secondary font-sim-mono shadow-sm">
              <span className="text-text-primary font-semibold font-sim">Simulação:</span> Aluguel R$ 2.000 &rarr; Base R$ 1.400 &rarr; Tributo (7,95%): <span className="text-positive-text font-bold">R$ 111,30</span> (alíquota média de 5,56%)
            </div>
          </div>

          {/* Card 4: Enquadramento da Pessoa Física */}
          <div className="bg-surface-muted border border-sim-border rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-serif font-medium text-sm sm:text-base tracking-tight">
              <Scale className="w-4 h-4 text-text-primary" />
              <span>Critérios de Habitualidade da Pessoa Física</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              O locador pessoa física unicamente é equiparado a contribuinte de IBS/CBS se preencher <strong className="text-text-primary">cumulativamente</strong> os dois requisitos de habitualidade econômica:
            </p>
            <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
              <li>Possuir mais de 3 unidades imobiliárias locadas no exercício (&gt; 3);</li>
              <li>Receita anual total de locação superior a R$ 240.000,00.</li>
            </ul>
            <div className="bg-surface p-3.5 rounded-xl border border-sim-border text-[11px] text-text-secondary shadow-sm">
              Caso não atinja ambos os gatilhos, o locador PF usufrui de isenção plena de IBS/CBS, recolhendo apenas o IRPF Carnê-Leão.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
