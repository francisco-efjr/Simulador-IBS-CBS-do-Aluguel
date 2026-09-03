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
      {/* Cabeçalho da API & Ações de Integração */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-[#FAF8F5] text-[#161616] border border-[#E5E0D8] rounded-md text-xs font-bold font-mono">
                GET
              </span>
              <span className="font-mono text-sm sm:text-base font-semibold text-[#161616]">
                /api/cronograma-transicao
              </span>
              <span className="px-2.5 py-0.5 bg-[#EAF4EC] text-[#1E6B2C] rounded-full text-[10px] font-mono border border-[#D4E8D7] font-semibold">
                200 OK
              </span>
            </div>
            <p className="text-xs text-[#6B6864] mt-1">
              Interface programática do Cronograma Constitucional da Transição Tributária (2026 – 2033) para locação imobiliária.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F0ECE5] text-[#161616] rounded-full text-xs font-medium transition-all border border-[#E5E0D8]"
              title="Recarregar dados"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#787570]" />
              <span>Atualizar ({lastFetchTime})</span>
            </button>

            <button
              onClick={handleCopyCurl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F0ECE5] text-[#161616] rounded-full text-xs font-medium transition-all border border-[#E5E0D8]"
              title="Copiar comando cURL"
            >
              {curlCopied ? <Check className="w-3.5 h-3.5 text-[#1E6B2C]" /> : <Terminal className="w-3.5 h-3.5 text-[#1D528F]" />}
              <span>{curlCopied ? 'cURL Copiado!' : 'Copiar cURL'}</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#161616] hover:bg-black text-white font-semibold rounded-full text-xs transition-all shadow-sm"
              title="Copiar payload JSON completo"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>
          </div>
        </div>

        {/* Metadados de Auditoria e Garantia Legal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-4 space-y-1">
            <span className="text-[#787570] text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1E6B2C]" />
              Status de Validação
            </span>
            <div className="text-[#1E6B2C] font-bold font-mono">
              {payload.metadata.status}
            </div>
            <p className="text-[11px] text-[#6B6864]">
              Conformidade garantida com EC 132/2023 e LC 214/2025.
            </p>
          </div>

          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-4 space-y-1">
            <span className="text-[#787570] text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1D528F]" />
              Horizonte Temporal
            </span>
            <div className="text-[#161616] font-bold font-mono">
              2026 – 2033 (8 Fases)
            </div>
            <p className="text-[11px] text-[#6B6864]">
              Fase teste (1%) &rarr; CBS plena &rarr; IBS escalonado.
            </p>
          </div>

          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-4 space-y-1">
            <span className="text-[#787570] text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#161616]" />
              Regra de Redução Locação
            </span>
            <div className="text-[#161616] font-bold font-mono">
              - {payload.realEstateDiscountPercent}% da Alíquota Padrão
            </div>
            <p className="text-[11px] text-[#6B6864]">
              Alíquota efetiva de locação: 30% da nominal (Art. 260).
            </p>
          </div>
        </div>

        {/* Alternador de Visualização: Tabela vs JSON Bruto */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#F0ECE5]">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'table'
                ? 'bg-[#161616] text-white shadow-sm'
                : 'text-[#6B6864] hover:text-[#161616]'
            }`}
          >
            Tabela do Cronograma Oficial
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'json'
                ? 'bg-[#161616] text-white shadow-sm'
                : 'text-[#6B6864] hover:text-[#161616]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Resposta HTTP (JSON)</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Dinâmico */}
      {activeTab === 'table' ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#E5E0D8] text-[#787570]">
                <th className="pb-3 font-sans font-semibold">Ano</th>
                <th className="pb-3 font-sans font-semibold">Fase Constitucional</th>
                <th className="pb-3 font-sans font-semibold">CBS Nominal</th>
                <th className="pb-3 font-sans font-semibold">IBS Nominal</th>
                <th className="pb-3 font-sans font-semibold">Total Nominal</th>
                <th className="pb-3 font-sans font-semibold text-[#161616]">Efetiva Locação (-70%)</th>
                <th className="pb-3 font-sans font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE5]">
              {payload.years.map((item) => (
                <tr
                  key={item.year}
                  className={`hover:bg-[#FAF8F5] transition-colors ${
                    item.year === params.transitionYear ? 'bg-[#FAF8F5] font-semibold' : ''
                  }`}
                >
                  <td className="py-3.5 font-bold text-[#161616] flex items-center gap-1.5 tabular-nums">
                    {item.year === params.transitionYear && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#161616]"></span>
                    )}
                    {item.year}
                  </td>
                  <td className="py-3.5 font-sans text-[#161616]">
                    <div className="font-medium text-[#161616]">{item.label}</div>
                    <div className="text-[10px] text-[#787570]">{item.description}</div>
                  </td>
                  <td className="py-3.5 text-[#6B6864] tabular-nums">{item.nominalCbsRate.toFixed(2)}%</td>
                  <td className="py-3.5 text-[#6B6864] tabular-nums">{item.nominalIbsRate.toFixed(2)}%</td>
                  <td className="py-3.5 text-[#161616] font-semibold tabular-nums">{item.nominalTotalRate.toFixed(2)}%</td>
                  <td className="py-3.5 text-[#1E6B2C] font-bold text-sm tabular-nums">
                    {item.effectiveTotalRate.toFixed(2)}%
                    <span className="text-[10px] font-normal text-[#787570] block">
                      CBS: {item.effectiveCbsRate.toFixed(2)}% | IBS: {item.effectiveIbsRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3.5 font-sans">
                    {item.isTestPhase ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF7ED] text-[#92400E] border border-[#FDE68A]">
                        Ano Teste
                      </span>
                    ) : item.isFullPhase ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF4EC] text-[#1E6B2C] border border-[#D4E8D7]">
                        Regime Pleno
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EEF3FA] text-[#1D528F] border border-[#D8E5F5]">
                        Transição
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-3 border-t border-[#F0ECE5] text-[11px] text-[#787570] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>* Linha destacada representa o ano atualmente selecionado no simulador ({params.transitionYear}).</span>
            <span className="text-[#1E6B2C] flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dados calculados dinamicamente em memória
            </span>
          </div>
        </div>
      ) : (
        /* Visualizador de JSON com Headers */
        <div className="bg-[#161616] border border-[#2E2E2E] rounded-2xl sm:rounded-3xl p-5 font-mono text-xs space-y-4 shadow-sm text-[#F5F5F5]">
          <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3 text-[#A09C96] text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-[#787570]">Headers:</span>
              <span className="text-[#34D399]">Content-Type: application/json</span>
              <span className="text-[#525252]">|</span>
              <span className="text-[#34D399]">Status: 200 OK</span>
            </div>
            <a
              href="/api/cronograma-transicao"
              target="_blank"
              rel="noreferrer"
              className="text-[#34D399] hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Abrir Raw</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <pre className="text-[#E5E0D8] overflow-x-auto max-h-[500px] leading-relaxed select-all no-scrollbar">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
};
