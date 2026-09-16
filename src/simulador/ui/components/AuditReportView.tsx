import React from 'react';
import { ShieldCheck, ShieldAlert, AlertCircle, FileCheck, Landmark } from 'lucide-react';
import { AuditReport } from '../../core/domain/types.ts';

interface AuditReportViewProps {
  report: AuditReport;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({ report }) => {
  const getBadgeColor = () => {
    switch (report.complianceStatus) {
      case 'CONFORME':
        return 'bg-positive-bg border-positive-border text-positive-text';
      case 'ISENTO':
        return 'bg-info-bg border-info-border text-info-text';
      case 'ALERTA':
      default:
        return 'bg-warning-bg border-warning-border text-warning-text';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sim-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-surface-muted border border-sim-border text-text-primary rounded-full shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-serif font-medium text-text-primary tracking-tight flex items-center gap-2">
              Parecer de Auditoria Fiscal &amp; Compliance LC 214/2025
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Trilha de verificação regulatória e conformidade legal automatizada
            </p>
          </div>
        </div>

        <span className={`px-3.5 py-1 rounded-full text-xs font-semibold font-sim-mono border uppercase tracking-wider self-start sm:self-auto ${getBadgeColor()}`}>
          {report.complianceStatus}
        </span>
      </div>

      {/* Resumo Executivo */}
      <div className="bg-surface-muted p-4 rounded-2xl border border-sim-border text-xs text-text-secondary leading-relaxed">
        <span className="font-semibold text-text-primary block mb-1 uppercase tracking-wider text-[10px]">
          Síntese do Laudo Técnico
        </span>
        {report.executiveSummary}
      </div>

      {/* Tabela de Checkpoints Auditados */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-semibold text-text-primary uppercase tracking-wider block">
          Checkpoints Normativos Auditados:
        </span>
        <div className="grid grid-cols-1 gap-2.5 text-xs">
          {report.findings.map((item, idx) => (
            <div
              key={idx}
 className="p-4 bg-surface-muted rounded-2xl border border-sim-border flex items-start gap-3 hover:border-accent-bg transition-colors"
            >
              {item.status === 'passed' ? (
                <ShieldCheck className="w-4 h-4 text-positive-text shrink-0 mt-0.5" />
              ) : item.status === 'alert' ? (
                <ShieldAlert className="w-4 h-4 text-warning-text shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-info-text shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="space-y-1">
                  <div className="font-semibold text-text-primary text-xs sm:text-sm leading-snug">
                    {item.ruleName}
                  </div>
                  <div>
                    <span className="inline-block text-[10px] text-text-muted font-sim-mono bg-surface px-2.5 py-0.5 rounded-md border border-sim-border shadow-sm break-words max-w-full">
                      {item.articleReference}
                    </span>
                  </div>
                </div>
                <p className="text-text-secondary text-[11px] leading-relaxed pt-0.5">
                  {item.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Base Legal Citada */}
      <div className="pt-3 border-t border-sim-border space-y-2 text-[11px] text-text-muted">
        <div className="flex items-center gap-2 font-medium text-text-primary">
          <Landmark className="w-3.5 h-3.5 text-text-primary shrink-0" />
          <span>Bases regulatórias e estatutárias auditadas:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {report.legalBasis.map((basis, idx) => (
            <span
              key={idx}
 className="bg-surface-muted border border-sim-border px-2.5 py-0.5 rounded-full text-[10px] font-sim-mono text-text-secondary"
            >
              {basis}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
