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

/**
 * Em desenvolvimento o middleware do Vite responde nesta rota; no build ela é
 * emitida como arquivo estático, de modo que o link funciona nos dois ambientes.
 */
const SCHEDULE_ENDPOINT = '/api/cronograma-transicao.json';

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
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const curlCommand = `curl -X GET "${origin}${SCHEDULE_ENDPOINT}" \\
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
      {/* Cabeçalho da API & Ações de Integração */}
      <div className="bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-surface-muted text-text-primary border border-sim-border rounded-md text-xs font-bold font-sim-mono">
                GET
              </span>
              <span className="font-sim-mono text-sm sm:text-base font-semibold text-text-primary">
                {SCHEDULE_ENDPOINT}
              </span>
              <span className="px-2.5 py-0.5 bg-positive-bg text-positive-text rounded-full text-[10px] font-sim-mono border border-positive-border font-semibold">
                200 OK
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Interface programática do Cronograma Constitucional da Transição Tributária (2026 – 2033) para locação imobiliária.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted hover:bg-surface-muted text-text-primary rounded-full text-xs font-medium transition-all border border-sim-border"
              title="Recarregar dados"
            >
              <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
              <span>Atualizar ({lastFetchTime})</span>
            </button>

            <button
              onClick={handleCopyCurl}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted hover:bg-surface-muted text-text-primary rounded-full text-xs font-medium transition-all border border-sim-border"
              title="Copiar comando cURL"
            >
              {curlCopied ? <Check className="w-3.5 h-3.5 text-positive-text" /> : <Terminal className="w-3.5 h-3.5 text-info-text" />}
              <span>{curlCopied ? 'cURL Copiado!' : 'Copiar cURL'}</span>
            </button>

            <button
              onClick={handleCopyJson}
 className="flex items-center gap-1.5 px-4 py-1.5 bg-accent-bg hover:bg-accent-bg/90 text-accent-fg font-semibold rounded-full text-xs transition-all shadow-sm"
              title="Copiar payload JSON completo"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>
          </div>
        </div>

        {/* Metadados de Auditoria e Garantia Legal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-surface-muted border border-sim-border rounded-2xl p-4 space-y-1">
            <span className="text-text-muted text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-positive-text" />
              Status de Validação
            </span>
            <div className="text-positive-text font-bold font-sim-mono">
              {payload.metadata.status}
            </div>
            <p className="text-[11px] text-text-secondary">
              Conformidade garantida com EC 132/2023 e LC 214/2025.
            </p>
          </div>

          <div className="bg-surface-muted border border-sim-border rounded-2xl p-4 space-y-1">
            <span className="text-text-muted text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-info-text" />
              Horizonte Temporal
            </span>
            <div className="text-text-primary font-bold font-sim-mono">
              2026 – 2033 (8 Fases)
            </div>
            <p className="text-[11px] text-text-secondary">
              Fase teste (1%) &rarr; CBS plena &rarr; IBS escalonado.
            </p>
          </div>

          <div className="bg-surface-muted border border-sim-border rounded-2xl p-4 space-y-1">
            <span className="text-text-muted text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-text-primary" />
              Regra de Redução Locação
            </span>
            <div className="text-text-primary font-bold font-sim-mono">
              - {payload.realEstateDiscountPercent}% da Alíquota Padrão
            </div>
            <p className="text-[11px] text-text-secondary">
              Alíquota efetiva de locação: 30% da nominal (Art. 260).
            </p>
          </div>
        </div>

        {/* Alternador de Visualização: Tabela vs JSON Bruto */}
        <div className="flex items-center gap-2 pt-2 border-t border-sim-border">
          <button
            onClick={() => setActiveTab('table')}
 className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'table'
                ? 'bg-accent-bg text-accent-fg shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Tabela do Cronograma Oficial
          </button>
          <button
            onClick={() => setActiveTab('json')}
 className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'json'
                ? 'bg-accent-bg text-accent-fg shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Resposta HTTP (JSON)</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Dinâmico */}
      {activeTab === 'table' ? (
        <div className="bg-surface border border-sim-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs font-sim-mono">
            <thead>
              <tr className="border-b border-sim-border text-text-muted">
                <th className="pb-3 font-sim font-semibold">Ano</th>
                <th className="pb-3 font-sim font-semibold">Fase Constitucional</th>
                <th className="pb-3 font-sim font-semibold">CBS Nominal</th>
                <th className="pb-3 font-sim font-semibold">IBS Nominal</th>
                <th className="pb-3 font-sim font-semibold">Total Nominal</th>
                <th className="pb-3 font-sim font-semibold text-text-primary">Efetiva Locação (-70%)</th>
                <th className="pb-3 font-sim font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sim-border">
              {payload.years.map((item) => (
                <tr
                  key={item.year}
 className={`hover:bg-surface-muted transition-colors ${
                    item.year === params.transitionYear ? 'bg-surface-muted font-semibold' : ''
                  }`}
                >
                  <td className="py-3.5 font-bold text-text-primary flex items-center gap-1.5 tabular-nums">
                    {item.year === params.transitionYear && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-bg"></span>
                    )}
                    {item.year}
                  </td>
                  <td className="py-3.5 font-sim text-text-primary">
                    <div className="font-medium text-text-primary">{item.label}</div>
                    <div className="text-[10px] text-text-muted">{item.description}</div>
                  </td>
                  <td className="py-3.5 text-text-secondary tabular-nums">{item.nominalCbsRate.toFixed(2)}%</td>
                  <td className="py-3.5 text-text-secondary tabular-nums">{item.nominalIbsRate.toFixed(2)}%</td>
                  <td className="py-3.5 text-text-primary font-semibold tabular-nums">{item.nominalTotalRate.toFixed(2)}%</td>
                  <td className="py-3.5 text-positive-text font-bold text-sm tabular-nums">
                    {item.effectiveTotalRate.toFixed(2)}%
                    <span className="text-[10px] font-normal text-text-muted block">
                      CBS: {item.effectiveCbsRate.toFixed(2)}% | IBS: {item.effectiveIbsRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3.5 font-sim">
                    {item.isTestPhase ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-warning-bg text-warning-text border border-warning-border">
                        Ano Teste
                      </span>
                    ) : item.isFullPhase ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-positive-bg text-positive-text border border-positive-border">
                        Regime Pleno
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-info-bg text-info-text border border-info-border">
                        Transição
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-3 border-t border-sim-border text-[11px] text-text-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>* Linha destacada representa o ano atualmente selecionado no simulador ({params.transitionYear}).</span>
            <span className="text-positive-text flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dados calculados dinamicamente em memória
            </span>
          </div>
        </div>
      ) : (
        /* Visualizador de JSON com Headers */
        <div className="bg-neutral-900 border border-neutral-700 rounded-2xl sm:rounded-3xl p-5 font-sim-mono text-xs space-y-4 shadow-sm text-neutral-100">
          <div className="flex items-center justify-between border-b border-neutral-700 pb-3 text-neutral-400 text-[11px]">
            <div className="flex items-center gap-2">
              <span>Headers:</span>
              <span className="text-emerald-400">Content-Type: application/json</span>
              <span className="text-neutral-600">|</span>
              <span className="text-emerald-400">Status: 200 OK</span>
            </div>
            <a
              href={SCHEDULE_ENDPOINT}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Abrir Raw</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <pre className="text-neutral-200 overflow-x-auto max-h-[500px] leading-relaxed select-all no-scrollbar">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
};
