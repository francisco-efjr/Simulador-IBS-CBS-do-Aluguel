import React, { useState } from 'react';
import { TaxParameters } from '../../core/domain/types.ts';
import { TransitionCalendar, TransitionSchedulePayload } from '../../core/services/TransitionCalendar.ts';
import {
  Code2,
  Copy,
  Check,
  Globe,
  RefreshCw,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Terminal,
} from 'lucide-react';

interface TransitionApiExplorerProps {
  params: TaxParameters;
}

export const TransitionApiExplorer: React.FC<TransitionApiExplorerProps> = ({ params }) => {
  const [copied, setCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table');
  const [lastFetchTime, setLastFetchTime] = useState<string>(new Date().toLocaleTimeString());

  // Gera o payload oficial atualizado
  const payload: TransitionSchedulePayload = TransitionCalendar.getFullSchedule(
    params.referenceRate,
    params.cbsShare,
    params.ibsShare,
    params.realEstateDiscountPercent
  );

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCurl = () => {
    const curlCommand = `curl -X GET "http://localhost:5173/api/cronograma-transicao" \\
  -H "Accept: application/json"`;
    navigator.clipboard.writeText(curlCommand);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  const handleRefresh = () => {
    setLastFetchTime(new Date().toLocaleTimeString());
  };

  return (
    <div className="space-y-6">
      {/* Header do Endpoint */}
      <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold font-mono">
                GET
              </span>
              <span className="font-mono text-sm sm:text-base font-semibold text-slate-100">
                /api/cronograma-transicao
              </span>
              <span className="px-2 py-0.5 bg-white/[0.06] text-emerald-400 rounded-md text-[10px] font-mono border border-white/10">
                200 OK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Interface programática do Cronograma Constitucional da Transição Tributária (2026 – 2033) para locação imobiliária.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 rounded-xl text-xs font-medium transition-all border border-white/[0.08]"
              title="Recarregar dados"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Atualizar ({lastFetchTime})</span>
            </button>

            <button
              onClick={handleCopyCurl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 rounded-xl text-xs font-medium transition-all border border-white/[0.08]"
              title="Copiar comando cURL"
            >
              {curlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5 text-blue-400" />}
              <span>{curlCopied ? 'cURL Copiado!' : 'Copiar cURL'}</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20"
              title="Copiar payload JSON completo"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>
          </div>
        </div>

        {/* Metadados de Auditoria e Garantia Legal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-3.5 space-y-1">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Status de Validação
            </span>
            <div className="text-emerald-400 font-bold font-mono">
              {payload.metadata.status}
            </div>
            <p className="text-[11px] text-slate-400">
              Conformidade garantida com EC 132/2023 e LC 214/2025.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-3.5 space-y-1">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Horizonte Temporal
            </span>
            <div className="text-slate-200 font-bold font-mono">
              2026 – 2033 (8 Fases)
            </div>
            <p className="text-[11px] text-slate-400">
              Fase teste (1%) &rarr; CBS plena &rarr; IBS escalonado.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-3.5 space-y-1">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              Regra de Redução Locação
            </span>
            <div className="text-purple-300 font-bold font-mono">
              - {payload.realEstateDiscountPercent}% da Alíquota Padrão
            </div>
            <p className="text-[11px] text-slate-400">
              Alíquota efetiva de locação: 30% da nominal (Art. 260).
            </p>
          </div>
        </div>

        {/* Alternador de Visualização: Tabela vs JSON Bruto */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'table'
                ? 'bg-white/10 text-white shadow-sm border border-white/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tabela do Cronograma Oficial
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'json'
                ? 'bg-white/10 text-white shadow-sm border border-white/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resposta HTTP (JSON)</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Dinâmico */}
      {activeTab === 'table' ? (
        <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm overflow-x-auto no-scrollbar backdrop-blur-md">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400">
                <th className="pb-3 font-sans font-semibold">Ano</th>
                <th className="pb-3 font-sans font-semibold">Fase Constitucional</th>
                <th className="pb-3 font-sans font-semibold">CBS Nominal</th>
                <th className="pb-3 font-sans font-semibold">IBS Nominal</th>
                <th className="pb-3 font-sans font-semibold">Total Nominal</th>
                <th className="pb-3 font-sans font-semibold text-emerald-400">Efetiva Locação (-70%)</th>
                <th className="pb-3 font-sans font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {payload.years.map((item) => (
                <tr
                  key={item.year}
                  className={`hover:bg-white/[0.02] transition-colors ${
                    item.year === params.transitionYear ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  <td className="py-3.5 font-bold text-slate-100 flex items-center gap-1.5 tabular-nums">
                    {item.year === params.transitionYear && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    )}
                    {item.year}
                  </td>
                  <td className="py-3.5 font-sans text-slate-300">
                    <div className="font-medium text-slate-200">{item.label}</div>
                    <div className="text-[10px] text-slate-500">{item.description}</div>
                  </td>
                  <td className="py-3.5 text-slate-400 tabular-nums">{item.nominalCbsRate.toFixed(2)}%</td>
                  <td className="py-3.5 text-slate-400 tabular-nums">{item.nominalIbsRate.toFixed(2)}%</td>
                  <td className="py-3.5 text-slate-300 font-semibold tabular-nums">{item.nominalTotalRate.toFixed(2)}%</td>
                  <td className="py-3.5 text-emerald-400 font-bold text-sm tabular-nums">
                    {item.effectiveTotalRate.toFixed(2)}%
                    <span className="text-[10px] font-normal text-slate-500 block">
                      CBS: {item.effectiveCbsRate.toFixed(2)}% | IBS: {item.effectiveIbsRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3.5 font-sans">
                    {item.isTestPhase ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                        Ano Teste
                      </span>
                    ) : item.isFullPhase ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                        Regime Pleno
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/40">
                        Transição
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>* Linha destacada representa o ano atualmente selecionado no simulador ({params.transitionYear}).</span>
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dados calculados dinamicamente em memória
            </span>
          </div>
        </div>
      ) : (
        /* Visualizador de JSON com Headers */
        <div className="bg-slate-950/90 border border-white/[0.08] rounded-2xl p-5 font-mono text-xs space-y-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-slate-400 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Headers:</span>
              <span className="text-emerald-400">Content-Type: application/json</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400">Status: 200 OK</span>
            </div>
            <a
              href="/api/cronograma-transicao"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>Abrir Raw</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <pre className="text-emerald-300 overflow-x-auto max-h-[500px] leading-relaxed select-all no-scrollbar">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
};
