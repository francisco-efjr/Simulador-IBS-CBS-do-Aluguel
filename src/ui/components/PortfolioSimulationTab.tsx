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
  const [newUnitsCount, setNewUnitsCount] = useState<number | undefined>(undefined);
  const [rentPricingMode, setRentPricingMode] = useState<'per_unit' | 'total'>('total');
  const [newRent, setNewRent] = useState<number>(0);
  const [newCondo, setNewCondo] = useState<number>(0);
  const [newIptu, setNewIptu] = useState<number>(0);
  const [newTenantType, setNewTenantType] = useState<PersonType>('pf');

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newRent <= 0) return;

    const units = newUnitsCount && newUnitsCount > 1 ? newUnitsCount : 1;
    const finalMonthlyRent = units > 1 && rentPricingMode === 'per_unit'
      ? newRent * units
      : newRent;

    const newItem: PortfolioItem = {
      id: Date.now().toString(),
      name: newName.trim(),
      propertyType: newType,
      monthlyRent: finalMonthlyRent,
      condominiumFee: newCondo,
      iptuAmount: newIptu,
      tenantType: newTenantType,
      unitsCount: units > 1 ? units : undefined,
    };

    setProperties([...properties, newItem]);
    setNewName('');
    setNewUnitsCount(undefined);
    setRentPricingMode('total');
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
      <div className="bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-serif font-medium text-[#161616] tracking-tight">
              Gestão de Portfólio Imobiliário &amp; Apuração Consolidada
            </h2>
            <span className="text-xs bg-[#FAF8F5] border border-[#E5E0D8] text-[#6B6864] px-3 py-0.5 rounded-full font-mono">
              {properties.length} {properties.length === 1 ? 'ativo' : 'ativos'}
              {summary.totalUnits > properties.length && ` • ${summary.totalUnits} unidades`}
            </span>
          </div>
          <p className="text-xs text-[#6B6864] mt-1">
            Projeção agregada de carga fiscal de IBS/CBS, teste de habitualidade da PF e dedução de encargos não tributáveis
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1.5 rounded-full border border-[#E5E0D8] shrink-0">
          <span className="text-xs text-[#787570] font-medium pl-2 hidden sm:inline">Titularidade:</span>
          <button
            type="button"
            onClick={() => setIsPJ(false)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !isPJ
                ? 'bg-[#161616] text-white shadow-sm'
                : 'text-[#6B6864] hover:text-[#161616]'
            }`}
          >
            Pessoa Física (PF)
          </button>
          <button
            type="button"
            onClick={() => setIsPJ(true)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isPJ
                ? 'bg-[#161616] text-white shadow-sm'
                : 'text-[#6B6864] hover:text-[#161616]'
            }`}
          >
            Holding Patrimonial (PJ)
          </button>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas (Estilo Bronn: Números Grandes e Confiantes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[#787570] text-xs font-semibold uppercase tracking-wider">
            <span>Receita Mensal Bruta</span>
            <Wallet className="w-4 h-4 text-[#161616]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#161616] font-normal tracking-tight tabular-nums">
            {formatBRL(summary.totalMonthlyRent)}
          </div>
          <div className="text-xs text-[#6B6864] font-mono">
            {formatBRL(summary.totalAnnualRent)} <span className="text-[#8C8882] font-sans">ao ano</span>
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[#787570] text-xs font-semibold uppercase tracking-wider">
            <span>Redutores Sociais</span>
            <TrendingDown className="w-4 h-4 text-[#1D528F]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#1D528F] font-normal tracking-tight tabular-nums">
            - {formatBRL(summary.totalMonthlySocialDeduction)}
          </div>
          <div className="text-xs text-[#6B6864]">
            {summary.residentialUnitsCount} {summary.residentialUnitsCount === 1 ? 'imóvel residencial' : 'unidades residenciais'}
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[#787570] text-xs font-semibold uppercase tracking-wider">
            <span>IBS + CBS Consolidado</span>
            <Coins className="w-4 h-4 text-[#1E6B2C]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#1E6B2C] font-normal tracking-tight tabular-nums">
            {formatBRL(summary.totalMonthlyIBSCBS)}
          </div>
          <div className="text-xs text-[#6B6864] font-mono">
            {formatBRL(summary.totalAnnualIBSCBS)} <span className="text-[#8C8882] font-sans">ao ano</span>
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[#787570] text-xs font-semibold uppercase tracking-wider">
            <span>Alíquota Efetiva Média</span>
            <Percent className="w-4 h-4 text-[#161616]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#161616] font-normal tracking-tight tabular-nums">
            {summary.effectiveAverageRate}%
          </div>
          <div className="text-xs text-[#6B6864]">
            Ponderada sobre o portfólio
          </div>
        </div>
      </div>

      {/* Alerta Executivo de Enquadramento da Carteira */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 transition-all ${
          properties.length === 0
            ? 'bg-[#FAF8F5] border-[#E5E0D8] text-[#6B6864]'
            : summary.isLandlordTaxpayer
            ? 'bg-[#EAF4EC] border-[#D4E8D7] text-[#1E6B2C]'
            : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#161616]'
        }`}
      >
        {properties.length === 0 ? (
          <Building className="w-5 h-5 text-[#8C8882] shrink-0 mt-0.5" />
        ) : summary.isLandlordTaxpayer ? (
          <ShieldCheck className="w-5 h-5 text-[#1E6B2C] shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-[#8C8882] shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed space-y-0.5">
          <div className="font-serif font-medium text-sm sm:text-base tracking-tight text-[#161616]">
            {properties.length === 0
              ? 'Status da Carteira: AGUARDANDO ATIVOS • CARTEIRA ZERADA'
              : summary.isLandlordTaxpayer
              ? 'Status da Carteira: CONTRIBUINTE ENQUADRADO NO IBS/CBS'
              : 'Status da Carteira: NÃO CONTRIBUINTE (REGIME DE ISENÇÃO PF)'}
          </div>
          <p className="text-[#6B6864] text-xs">
            {properties.length === 0
              ? 'Cadastre os contratos de locação no formulário para apurar o enquadramento consolidado e calcular o IBS/CBS.'
              : summary.enquadramentoReason}
          </p>
        </div>
      </div>

      {/* Grid Principal: Lista de Ativos e Formulário */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Imóveis */}
        <div className="lg:col-span-8 bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between border-b border-[#F0ECE5] pb-4 mb-4">
            <h3 className="text-sm sm:text-base font-serif font-medium text-[#161616]">
              Detalhamento de Ativos por Contrato
            </h3>
            <span className="text-xs text-[#787570] font-mono">
              Encargos expurgados da base tributável
            </span>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-[#E5E0D8] rounded-2xl space-y-3 bg-[#FAF8F5]/50">
              <Building className="w-10 h-10 text-[#8C8882] mx-auto" />
              <div className="text-sm sm:text-base font-serif font-medium text-[#161616]">Nenhum ativo cadastrado no portfólio</div>
              <p className="text-xs text-[#6B6864] max-w-sm mx-auto leading-relaxed">
                Cadastre contratos de locação pelo formulário ao lado para consultar a apuração agregada, enquadramento de habitualidade e projeção de carga tributária.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#E5E0D8] text-[#787570]">
                    <th className="pb-3 font-sans font-semibold">Ativo Imobiliário</th>
                    <th className="pb-3 font-sans font-semibold">Destinação</th>
                    <th className="pb-3 font-sans font-semibold">Aluguel Base</th>
                    <th className="pb-3 font-sans font-semibold">Redutor Social</th>
                    <th className="pb-3 font-sans font-semibold">Base Efetiva</th>
                    <th className="pb-3 font-sans font-semibold text-right">IBS + CBS</th>
                    <th className="pb-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE5]">
                  {summary.propertyBreakdowns.map(({ item, calculation }) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 font-sans font-medium text-[#161616]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-[#161616]">{item.name}</span>
                          {item.unitsCount && item.unitsCount > 1 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FAF8F5] border border-[#E5E0D8] text-[#161616]">
                              {item.unitsCount} {item.propertyType === 'residential' ? 'apartamentos' : 'unidades'}
                            </span>
                          )}
                        </div>
                        {((item.condominiumFee ?? 0) > 0 || (item.iptuAmount ?? 0) > 0) && (
                          <div className="text-[10px] text-[#787570] font-mono mt-0.5">
                            Cond.: {formatBRL(item.condominiumFee ?? 0)} &bull; IPTU: {formatBRL(item.iptuAmount ?? 0)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold border ${
                            item.propertyType === 'residential'
                              ? 'bg-[#EAF4EC] text-[#1E6B2C] border-[#D4E8D7]'
                              : 'bg-[#EEF3FA] text-[#1D528F] border-[#D8E5F5]'
                          }`}
                        >
                          {item.propertyType === 'residential' ? <Home className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                          {item.propertyType === 'residential' ? 'Residencial' : 'Comercial'}
                        </span>
                      </td>
                      <td className="py-3.5 text-[#161616] tabular-nums font-semibold">{formatBRL(item.monthlyRent)}</td>
                      <td className="py-3.5 text-[#1D528F] tabular-nums">
                        {calculation.socialDeductionApplied > 0 ? (
                          <div>
                            <span className="font-semibold">-{formatBRL(calculation.socialDeductionApplied)}</span>
                            {item.unitsCount && item.unitsCount > 1 && (
                              <div className="text-[9px] text-[#787570] font-sans">
                                {item.unitsCount}&times; redutor social
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 text-[#6B6864] tabular-nums">{formatBRL(calculation.taxableBase)}</td>
                      <td className="py-3.5 text-right font-bold text-[#1E6B2C] tabular-nums">
                        {formatBRL(calculation.totalTaxDue)}
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => handleRemoveProperty(item.id)}
                          className="text-[#8C8882] hover:text-red-600 p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/50"
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
        <div className="lg:col-span-4 bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="border-b border-[#F0ECE5] pb-3">
            <h3 className="text-sm sm:text-base font-serif font-medium text-[#161616] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#161616]" />
              Cadastrar Ativo no Portfólio
            </h3>
            <p className="text-[11px] text-[#6B6864] mt-0.5">
              Adicione unidades para recalcular o enquadramento consolidado
            </p>
          </div>

          <form onSubmit={handleAddProperty} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[#161616] font-medium mb-1">Identificação da Unidade / Condomínio</label>
              <input
                type="text"
                placeholder="Ex: Sala Comercial 1201 - Paulista"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-[#161616] placeholder-[#A09C96] focus:outline-none focus:border-[#161616] focus-visible:ring-2 focus-visible:ring-black/10"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[#161616] font-medium">
                  Quantidade de Apartamentos / Unidades
                </label>
                <span className="text-[10px] text-[#787570] font-mono bg-[#FAF8F5] border border-[#E5E0D8] px-2 py-0.5 rounded-full">
                  Opcional
                </span>
              </div>
              <input
                type="number"
                min={1}
                step={1}
                placeholder="1 (Padrão para imóvel individual)"
                value={newUnitsCount !== undefined ? newUnitsCount : ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setNewUnitsCount(val && val > 0 ? val : undefined);
                }}
                className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-[#161616] placeholder-[#A09C96] focus:outline-none focus:border-[#161616] focus-visible:ring-2 focus-visible:ring-black/10 font-mono text-xs"
              />
              <p className="text-[11px] text-[#6B6864] mt-1">
                Para condomínios, prédios residenciais ou blocos de quitinetes locadas.
              </p>
            </div>

            {newUnitsCount && newUnitsCount > 1 && (
              <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E5E0D8] space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="font-semibold text-[#161616] text-[11px]">
                    Critério de Aluguel ({newUnitsCount} unidades):
                  </span>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#E5E0D8] shrink-0">
                    <button
                      type="button"
                      onClick={() => setRentPricingMode('per_unit')}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                        rentPricingMode === 'per_unit'
                          ? 'bg-[#161616] text-white shadow-sm'
                          : 'text-[#6B6864] hover:text-[#161616]'
                      }`}
                    >
                      Por Apartamento
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentPricingMode('total')}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                        rentPricingMode === 'total'
                          ? 'bg-[#161616] text-white shadow-sm'
                          : 'text-[#6B6864] hover:text-[#161616]'
                      }`}
                    >
                      Total Consolidado
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-[#6B6864] font-mono pt-1 border-t border-[#E5E0D8]">
                  {rentPricingMode === 'per_unit' ? (
                    <span>
                      Receita total consolidada: <strong className="text-[#161616]">{formatBRL(newRent * newUnitsCount)}</strong> ({newUnitsCount} aptos &times; {formatBRL(newRent)})
                    </span>
                  ) : (
                    <span>
                      Aluguel médio por unidade: <strong className="text-[#161616]">{formatBRL(newUnitsCount > 0 ? newRent / newUnitsCount : 0)}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[#161616] font-medium mb-1">Destinação do Imóvel</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewType('residential')}
                  className={`py-2 px-3 rounded-full border text-xs font-semibold transition-all ${
                    newType === 'residential'
                      ? 'bg-[#161616] border-[#161616] text-white shadow-sm'
                      : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#6B6864] hover:border-[#161616] hover:text-[#161616]'
                  }`}
                >
                  Residencial
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('commercial')}
                  className={`py-2 px-3 rounded-full border text-xs font-semibold transition-all ${
                    newType === 'commercial'
                      ? 'bg-[#161616] border-[#161616] text-white shadow-sm'
                      : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#6B6864] hover:border-[#161616] hover:text-[#161616]'
                  }`}
                >
                  Comercial
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#161616] font-medium mb-1">
                {newUnitsCount && newUnitsCount > 1
                  ? rentPricingMode === 'per_unit'
                    ? 'Aluguel Base por Apartamento / Quitinete (R$)'
                    : 'Aluguel Base Total Consolidado (R$)'
                  : 'Aluguel Base Mensal (R$)'}
              </label>
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
                <label className="block text-[#6B6864] font-medium mb-1">Condomínio (R$)</label>
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
                <label className="block text-[#6B6864] font-medium mb-1">IPTU (R$)</label>
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
              <label className="block text-[#161616] font-medium mb-1">Perfil do Inquilino</label>
              <select
                value={newTenantType}
                onChange={(e) => setNewTenantType(e.target.value as PersonType)}
                className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-[#161616] focus:outline-none focus:border-[#161616]"
              >
                <option value="pf">Pessoa Física</option>
                <option value="pj">Pessoa Jurídica (Empresa)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#161616] hover:bg-black text-white font-semibold rounded-full transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-black/20 flex items-center justify-center gap-1.5"
            >
              <span>Adicionar ao Portfólio</span>
              <span className="text-xs">&rarr;</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
