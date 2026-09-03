import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Building,
  Home,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Coins,
  Percent,
  TrendingDown,
} from 'lucide-react';
import {
  PortfolioItem,
  TaxParameters,
  PropertyType,
  PersonType,
} from '../../core/domain/types.ts';
import { PortfolioEngine } from '../../core/services/PortfolioEngine.ts';
import { BRLInput } from './BRLInput.tsx';

interface PortfolioSimulationTabProps {
  params: TaxParameters;
}

const INITIAL_PORTFOLIO: PortfolioItem[] = [];

export const PortfolioSimulationTab: React.FC<PortfolioSimulationTabProps> = ({ params }) => {
  const [properties, setProperties] = useState<PortfolioItem[]>(INITIAL_PORTFOLIO);
  const [isPJ, setIsPJ] = useState<boolean>(false);

  // Formulário para novo imóvel (inicia zerado)
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<PropertyType>('residential');
  const [newRent, setNewRent] = useState<number>(0);
  const [newCondo, setNewCondo] = useState<number>(0);
  const [newIptu, setNewIptu] = useState<number>(0);
  const [newTenantType, setNewTenantType] = useState<PersonType>('pf');

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newRent <= 0) return;

    const newItem: PortfolioItem = {
      id: Date.now().toString(),
      name: newName.trim(),
      propertyType: newType,
      monthlyRent: newRent,
      condominiumFee: newCondo,
      iptuAmount: newIptu,
      tenantType: newTenantType,
    };

    setProperties([...properties, newItem]);
    setNewName('');
    setNewRent(0);
    setNewCondo(0);
    setNewIptu(0);
  };

  const handleRemoveProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id));
  };

  const summary = PortfolioEngine.evaluatePortfolio(properties, isPJ, params, params.transitionYear);

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Portfólio com Toggle PF / PJ */}
      <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              Gestão de Portfólio Imobiliário &amp; Apuração Consolidada
            </h2>
            <span className="text-xs bg-white/[0.06] border border-white/10 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
              {properties.length} {properties.length === 1 ? 'ativo' : 'ativos'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Projeção agregada de carga fiscal de IBS/CBS, teste de habitualidade da PF e dedução de encargos não tributáveis
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-white/[0.08] shrink-0">
          <span className="text-xs text-slate-400 font-medium pl-2 hidden sm:inline">Titularidade:</span>
          <button
            type="button"
            onClick={() => setIsPJ(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isPJ
                ? 'bg-white/10 text-white shadow-sm border border-white/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pessoa Física (PF)
          </button>
          <button
            type="button"
            onClick={() => setIsPJ(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isPJ
                ? 'bg-white/10 text-white shadow-sm border border-white/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Holding Patrimonial (PJ)
          </button>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas (Estilo Shopify: Números Grandes e Confiantes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Receita Mensal Bruta</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight tabular-nums">
            {formatBRL(summary.totalMonthlyRent)}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {formatBRL(summary.totalAnnualRent)} <span className="text-slate-500 font-sans">ao ano</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Redutores Sociais</span>
            <TrendingDown className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono tracking-tight tabular-nums">
            - {formatBRL(summary.totalMonthlySocialDeduction)}
          </div>
          <div className="text-xs text-slate-400">
            {summary.residentialCount} {summary.residentialCount === 1 ? 'imóvel residencial' : 'imóveis residenciais'}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>IBS + CBS Consolidado</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight tabular-nums">
            {formatBRL(summary.totalMonthlyIBSCBS)}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {formatBRL(summary.totalAnnualIBSCBS)} <span className="text-slate-500 font-sans">ao ano</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Alíquota Efetiva Média</span>
            <Percent className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight tabular-nums">
            {summary.effectiveAverageRate}%
          </div>
          <div className="text-xs text-slate-400">
            Ponderada sobre o portfólio
          </div>
        </div>
      </div>

      {/* Alerta Executivo de Enquadramento da Carteira */}
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
          properties.length === 0
            ? 'bg-slate-900/80 border-white/[0.08] text-slate-400'
            : summary.isLandlordTaxpayer
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : 'bg-slate-900/80 border-white/[0.08] text-slate-300'
        }`}
      >
        {properties.length === 0 ? (
          <Building className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        ) : summary.isLandlordTaxpayer ? (
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed space-y-0.5">
          <div className="font-bold text-sm tracking-tight text-slate-100">
            {properties.length === 0
              ? 'Status da Carteira: AGUARDANDO ATIVOS • CARTEIRA ZERADA'
              : summary.isLandlordTaxpayer
              ? 'Status da Carteira: CONTRIBUINTE ENQUADRADO NO IBS/CBS'
              : 'Status da Carteira: NÃO CONTRIBUINTE (REGIME DE ISENÇÃO PF)'}
          </div>
          <p className="text-slate-400 text-xs">
            {properties.length === 0
              ? 'Cadastre os contratos de locação no formulário para apurar o enquadramento consolidado e calcular o IBS/CBS.'
              : summary.enquadramentoReason}
          </p>
        </div>
      </div>

      {/* Grid Principal: Lista de Ativos e Formulário */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Imóveis */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Detalhamento de Ativos por Contrato
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Encargos expurgados da base tributável
            </span>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-white/[0.1] rounded-xl space-y-3">
              <Building className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-200">Nenhum ativo cadastrado no portfólio</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Cadastre contratos de locação pelo formulário ao lado para consultar a apuração agregada, enquadramento de habitualidade e projeção de carga tributária.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400">
                    <th className="pb-3 font-sans font-semibold">Ativo Imobiliário</th>
                    <th className="pb-3 font-sans font-semibold">Destinação</th>
                    <th className="pb-3 font-sans font-semibold">Aluguel Base</th>
                    <th className="pb-3 font-sans font-semibold">Redutor Social</th>
                    <th className="pb-3 font-sans font-semibold">Base Efetiva</th>
                    <th className="pb-3 font-sans font-semibold text-right">IBS + CBS</th>
                    <th className="pb-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {summary.propertyBreakdowns.map(({ item, calculation }) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 font-sans font-medium text-slate-200">
                        <div className="font-semibold text-slate-100">{item.name}</div>
                        {((item.condominiumFee ?? 0) > 0 || (item.iptuAmount ?? 0) > 0) && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Cond.: {formatBRL(item.condominiumFee ?? 0)} &bull; IPTU: {formatBRL(item.iptuAmount ?? 0)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold border ${
                            item.propertyType === 'residential'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                              : 'bg-blue-950/60 text-blue-300 border-blue-800/40'
                          }`}
                        >
                          {item.propertyType === 'residential' ? <Home className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                          {item.propertyType === 'residential' ? 'Residencial' : 'Comercial'}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-200 tabular-nums">{formatBRL(item.monthlyRent)}</td>
                      <td className="py-3.5 text-blue-400 tabular-nums">
                        {calculation.socialDeductionApplied > 0 ? `-${formatBRL(calculation.socialDeductionApplied)}` : '—'}
                      </td>
                      <td className="py-3.5 text-slate-300 tabular-nums">{formatBRL(calculation.taxableBase)}</td>
                      <td className="py-3.5 text-right font-bold text-emerald-400 tabular-nums">
                        {formatBRL(calculation.totalTaxDue)}
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => handleRemoveProperty(item.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/50"
                          title="Remover imóvel da carteira"
                          aria-label={`Remover ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulário para Cadastrar Ativo */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 backdrop-blur-md">
          <div className="border-b border-white/[0.08] pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Cadastrar Ativo no Portfólio
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Adicione unidades para recalcular o enquadramento consolidado
            </p>
          </div>

          <form onSubmit={handleAddProperty} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Identificação da Unidade</label>
              <input
                type="text"
                placeholder="Ex: Sala Comercial 1201 - Paulista"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/[0.1] rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/80 focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Destinação do Imóvel</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewType('residential')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    newType === 'residential'
                      ? 'bg-white/10 border-white/20 text-white shadow-sm'
                      : 'bg-slate-950/50 border-white/[0.06] text-slate-400 hover:border-white/15 hover:text-slate-200'
                  }`}
                >
                  Residencial
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('commercial')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    newType === 'commercial'
                      ? 'bg-white/10 border-white/20 text-white shadow-sm'
                      : 'bg-slate-950/50 border-white/[0.06] text-slate-400 hover:border-white/15 hover:text-slate-200'
                  }`}
                >
                  Comercial
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Aluguel Base Mensal (R$)</label>
              <BRLInput
                prefix="R$"
                value={newRent}
                onChange={setNewRent}
                placeholder="0,00"
                min={0}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Condomínio (R$)</label>
                <BRLInput
                  prefix="R$"
                  value={newCondo}
                  onChange={setNewCondo}
                  placeholder="0,00"
                  min={0}
                  className="py-1 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">IPTU (R$)</label>
                <BRLInput
                  prefix="R$"
                  value={newIptu}
                  onChange={setNewIptu}
                  placeholder="0,00"
                  min={0}
                  className="py-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Perfil do Inquilino</label>
              <select
                value={newTenantType}
                onChange={(e) => setNewTenantType(e.target.value as PersonType)}
                className="w-full bg-slate-950/80 border border-white/[0.1] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500/80"
              >
                <option value="pf">Pessoa Física</option>
                <option value="pj">Pessoa Jurídica (Empresa)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              Adicionar ao Portfólio
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
