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
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
      case 'ISENTO':
        return 'bg-blue-500/15 border-blue-500/40 text-blue-300';
      case 'ALERTA':
      default:
        return 'bg-amber-500/15 border-amber-500/40 text-amber-300';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/[0.05] border border-white/[0.08] text-emerald-400 rounded-xl shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Parecer de Auditoria Fiscal &amp; Compliance LC 214/2025
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Trilha de verificação regulatória e conformidade legal automatizada
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border uppercase tracking-wider self-start sm:self-auto ${getBadgeColor()}`}>
          {report.complianceStatus}
        </span>
      </div>

      {/* Resumo Executivo */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
        <span className="font-semibold text-emerald-400 block mb-1 uppercase tracking-wider text-[10px]">
          Síntese do Laudo Técnico
        </span>
        {report.executiveSummary}
      </div>

      {/* Tabela de Checkpoints Auditados */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Checkpoints Normativos Auditados:
        </span>
        <div className="grid grid-cols-1 gap-2 text-xs">
          {report.findings.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-950/50 rounded-xl border border-white/[0.06] flex items-start gap-3 hover:border-white/[0.12] transition-colors"
            >
              {item.status === 'passed' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : item.status === 'alert' ? (
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200">{item.ruleName}</span>
                  <span className="text-[10px] text-slate-400 font-mono bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08] shrink-0">
                    {item.articleReference}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                  {item.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Base Legal Citada */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-slate-400">
        <Landmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Bases regulatórias: {report.legalBasis.join(' • ')}</span>
      </div>
    </div>
  );
};
