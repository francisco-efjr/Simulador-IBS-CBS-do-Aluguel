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
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Parecer de Auditoria Fiscal (Compliance LC 214/2025)
            </h3>
            <p className="text-[11px] text-slate-400">
              Trilha de auditoria e validação automática de conformidade tributária
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getBadgeColor()}`}>
          {report.complianceStatus}
        </span>
      </div>

      {/* Resumo Executivo */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
        <span className="font-semibold text-emerald-400 block mb-1">Síntese do Laudo Técnico:</span>
        {report.executiveSummary}
      </div>

      {/* Tabela de Checkpoints Auditados */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Checkpoints Legais Validados:
        </span>
        <div className="grid grid-cols-1 gap-2 text-xs">
          {report.findings.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-start gap-2.5 hover:border-slate-700/60 transition-colors"
            >
              {item.status === 'passed' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : item.status === 'alert' ? (
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{item.ruleName}</span>
                  <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {item.articleReference}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  {item.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Base Legal Citada */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-500">
        <Landmark className="w-3.5 h-3.5 text-slate-400" />
        <span>Normas aplicadas: {report.legalBasis.join(' • ')}</span>
      </div>
    </div>
  );
};
