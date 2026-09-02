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

const INITIAL_PORTFOLIO: PortfolioItem[] = [
  { id: '1', name: 'Apartamento Jardins', propertyType: 'residential', monthlyRent: 3500, condominiumFee: 800, iptuAmount: 220, tenantType: 'pf' },
  { id: '2', name: 'Studio Pinheiros', propertyType: 'residential', monthlyRent: 2800, condominiumFee: 550, iptuAmount: 140, tenantType: 'pf' },
  { id: '3', name: 'Apartamento Moema', propertyType: 'residential', monthlyRent: 4200, condominiumFee: 950, iptuAmount: 310, tenantType: 'pf' },
  { id: '4', name: 'Sala Comercial Paulista', propertyType: 'commercial', monthlyRent: 5500, condominiumFee: 1200, iptuAmount: 450, tenantType: 'pj' },
  { id: '5', name: 'Galpão Logístico', propertyType: 'commercial', monthlyRent: 12000, condominiumFee: 0, iptuAmount: 1100, tenantType: 'pj' },
];

export const PortfolioSimulationTab: React.FC<PortfolioSimulationTabProps> = ({ params }) => {
  const [properties, setProperties] = useState<PortfolioItem[]>(INITIAL_PORTFOLIO);
  const [isPJ, setIsPJ] = useState<boolean>(false);

  // Formulário para novo imóvel
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<PropertyType>('residential');
  const [newRent, setNewRent] = useState<number>(3000);
  const [newCondo, setNewCondo] = useState<number>(500);
  const [newIptu, setNewIptu] = useState<number>(150);
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
    setNewRent(3000);
    setNewCondo(500);
    setNewIptu(150);
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
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Simulador de Carteira de Imóveis</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {properties.length} ativos
            </span>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
              Ano: {params.transitionYear}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analise o impacto consolidado de IBS/CBS, teste o enquadramento de PF e separe aluguel de encargos.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium pl-2">Perfil do Titular:</span>
          <button
            type="button"
            onClick={() => setIsPJ(false)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              !isPJ
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pessoa Física (PF)
          </button>
          <button
            type="button"
            onClick={() => setIsPJ(true)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              isPJ
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Holding (PJ)
          </button>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Aluguéis Brutos</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {formatBRL(summary.totalMonthlyRent)} <span className="text-xs text-slate-500 font-sans">/mês</span>
          </div>
          <div className="text-xs text-slate-400">
            {formatBRL(summary.totalAnnualRent)} ao ano
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Redutores Sociais</span>
            <TrendingDown className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-400 font-mono">
            - {formatBRL(summary.totalMonthlySocialDeduction)} <span className="text-xs text-slate-500 font-sans">/mês</span>
          </div>
          <div className="text-xs text-slate-400">
            {summary.residentialCount} imóveis residenciais
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>IBS + CBS Consolidado</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono">
            {formatBRL(summary.totalMonthlyIBSCBS)} <span className="text-xs text-slate-500 font-sans">/mês</span>
          </div>
          <div className="text-xs text-slate-400">
            {formatBRL(summary.totalAnnualIBSCBS)} ao ano
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Alíquota Efetiva Média</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 font-mono">
            {summary.effectiveAverageRate}%
          </div>
          <div className="text-xs text-slate-400">
            Sobre o aluguel bruto da carteira
          </div>
        </div>
      </div>

      {/* Alerta de Enquadramento da Carteira */}
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
          summary.isLandlordTaxpayer
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-slate-900/80 border-slate-700/80 text-slate-300'
        }`}
      >
        {summary.isLandlordTaxpayer ? (
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed">
          <span className="font-bold text-sm block mb-0.5">
            {summary.isLandlordTaxpayer
              ? 'Status da Carteira: CONTRIBUINTE ENQUADRADO'
              : 'Status da Carteira: NÃO CONTRIBUINTE (ISENTO DE IBS/CBS)'}
          </span>
          {summary.enquadramentoReason}
        </div>
      </div>

      {/* Grid Principal: Lista de Imóveis e Formulário */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Imóveis */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center justify-between">
            <span>Detalhamento por Imóvel</span>
            <span className="text-xs font-normal text-slate-500 lowercase font-sans">
              encargos separados da base
            </span>
          </h3>

          {properties.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl space-y-3">
              <Building className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">Nenhum imóvel na carteira</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Adicione um imóvel pelo formulário ao lado ou restaure os exemplos padrão para simular a apuração agregada.
              </p>
              <button
                type="button"
                onClick={() => setProperties(INITIAL_PORTFOLIO)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
              >
                Restaurar Imóveis de Exemplo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2.5 font-sans font-semibold">Imóvel</th>
                    <th className="pb-2.5 font-sans font-semibold">Tipo</th>
                    <th className="pb-2.5 font-sans font-semibold">Aluguel</th>
                    <th className="pb-2.5 font-sans font-semibold">Redutor</th>
                    <th className="pb-2.5 font-sans font-semibold">Base Calc.</th>
                    <th className="pb-2.5 font-sans font-semibold text-right">IBS/CBS</th>
                    <th className="pb-2.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {summary.propertyBreakdowns.map(({ item, calculation }) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-sans font-medium text-slate-200">
                        <div>{item.name}</div>
                        {((item.condominiumFee ?? 0) > 0 || (item.iptuAmount ?? 0) > 0) && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Condo: {formatBRL(item.condominiumFee ?? 0)} | IPTU: {formatBRL(item.iptuAmount ?? 0)}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans ${
                            item.propertyType === 'residential'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                              : 'bg-blue-950/80 text-blue-300 border border-blue-800/50'
                          }`}
                        >
                          {item.propertyType === 'residential' ? <Home className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                          {item.propertyType === 'residential' ? 'Residencial' : 'Comercial'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-100">{formatBRL(item.monthlyRent)}</td>
                      <td className="py-3 text-emerald-400">
                        {calculation.socialDeductionApplied > 0 ? `-${formatBRL(calculation.socialDeductionApplied)}` : '-'}
                      </td>
                      <td className="py-3 text-slate-300">{formatBRL(calculation.taxableBase)}</td>
                      <td className="py-3 text-right font-bold text-amber-400">
                        {formatBRL(calculation.totalTaxDue)}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleRemoveProperty(item.id)}
                          className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                          title="Remover imóvel"
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

        {/* Formulário para Adicionar Novo Imóvel */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            Adicionar Imóvel à Carteira
          </h3>

          <form onSubmit={handleAddProperty} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Identificação do Imóvel</label>
              <input
                type="text"
                placeholder="Ex: Apartamento 402 - Moema"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Destinação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewType('residential')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium ${
                    newType === 'residential'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Residencial
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('commercial')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium ${
                    newType === 'commercial'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Comercial
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Aluguel Base (R$)</label>
              <BRLInput
                prefix="R$"
                value={newRent}
                onChange={setNewRent}
                placeholder="0,00"
                min={0}
                className="text-emerald-400 font-bold"
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
              <label className="block text-slate-400 font-medium mb-1">Perfil do Inquilino</label>
              <select
                value={newTenantType}
                onChange={(e) => setNewTenantType(e.target.value as PersonType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="pf">Pessoa Física</option>
                <option value="pj">Pessoa Jurídica (Empresa)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              + Incluir Imóvel na Carteira
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
