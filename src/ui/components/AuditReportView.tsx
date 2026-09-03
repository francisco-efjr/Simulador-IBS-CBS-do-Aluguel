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
        return 'bg-[#EAF4EC] border-[#D4E8D7] text-[#1E6B2C]';
      case 'ISENTO':
        return 'bg-[#EEF3FA] border-[#D8E5F5] text-[#1D528F]';
      case 'ALERTA':
      default:
        return 'bg-[#FEF7ED] border-[#FDE68A] text-[#92400E]';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0ECE5] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FAF8F5] border border-[#E5E0D8] text-[#161616] rounded-full shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-serif font-medium text-[#161616] tracking-tight flex items-center gap-2">
              Parecer de Auditoria Fiscal &amp; Compliance LC 214/2025
            </h3>
            <p className="text-xs text-[#6B6864] mt-0.5">
              Trilha de verificação regulatória e conformidade legal automatizada
            </p>
          </div>
        </div>

        <span className={`px-3.5 py-1 rounded-full text-xs font-semibold font-mono border uppercase tracking-wider self-start sm:self-auto ${getBadgeColor()}`}>
          {report.complianceStatus}
        </span>
      </div>

      {/* Resumo Executivo */}
      <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E0D8] text-xs text-[#6B6864] leading-relaxed">
        <span className="font-semibold text-[#161616] block mb-1 uppercase tracking-wider text-[10px]">
          Síntese do Laudo Técnico
        </span>
        {report.executiveSummary}
      </div>

      {/* Tabela de Checkpoints Auditados */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-semibold text-[#161616] uppercase tracking-wider block">
          Checkpoints Normativos Auditados:
        </span>
        <div className="grid grid-cols-1 gap-2.5 text-xs">
          {report.findings.map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D8] flex items-start gap-3 hover:border-[#161616] transition-colors"
            >
              {item.status === 'passed' ? (
                <ShieldCheck className="w-4 h-4 text-[#1E6B2C] shrink-0 mt-0.5" />
              ) : item.status === 'alert' ? (
                <ShieldAlert className="w-4 h-4 text-[#92400E] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#1D528F] shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="space-y-1">
                  <div className="font-semibold text-[#161616] text-xs sm:text-sm leading-snug">
                    {item.ruleName}
                  </div>
                  <div>
                    <span className="inline-block text-[10px] text-[#787570] font-mono bg-white px-2.5 py-0.5 rounded-md border border-[#E5E0D8] shadow-sm break-words max-w-full">
                      {item.articleReference}
                    </span>
                  </div>
                </div>
                <p className="text-[#6B6864] text-[11px] leading-relaxed pt-0.5">
                  {item.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Base Legal Citada */}
      <div className="pt-3 border-t border-[#F0ECE5] space-y-2 text-[11px] text-[#787570]">
        <div className="flex items-center gap-2 font-medium text-[#161616]">
          <Landmark className="w-3.5 h-3.5 text-[#161616] shrink-0" />
          <span>Bases regulatórias e estatutárias auditadas:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {report.legalBasis.map((basis, idx) => (
            <span
              key={idx}
              className="bg-[#FAF8F5] border border-[#E5E0D8] px-2.5 py-0.5 rounded-full text-[10px] font-mono text-[#6B6864]"
            >
              {basis}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
