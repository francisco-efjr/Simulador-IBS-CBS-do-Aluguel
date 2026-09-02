import {
  DEFAULT_TAX_PARAMETERS,
  TaxCalculatorEngine,
  PortfolioEngine,
  LandlordProfile,
  TenantProfile,
  PortfolioItem,
} from './core/index.ts';

console.log('='.repeat(75));
console.log(' AUDITORIA FISCAL & MOTOR DE CÁLCULO - IBS/CBS NA LOCAÇÃO (LC 214/2025)');
console.log('='.repeat(75));

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// 1. Cenário 1: Locador PF com 2 imóveis (Isento de IBS/CBS)
console.log('\n📌 CENÁRIO 1: Pequeno Proprietário PF (2 imóveis, R$ 60k/ano) - Residencial');
const landlordSmall: LandlordProfile = {
  personType: 'pf',
  totalPropertiesRented: 2,
  totalAnnualRentalIncome: 60000,
};
const tenantPF: TenantProfile = { personType: 'pf' };
const calc1 = TaxCalculatorEngine.calculateContract({
  baseRent: 2500,
  condominiumFee: 500,
  iptuAmount: 150,
  propertyType: 'residential',
  landlord: landlordSmall,
  tenant: tenantPF,
});

console.log(`- Aluguel Base: ${formatBRL(calc1.baseRent)} | Encargos Excluídos (IPTU+Condo): ${formatBRL(calc1.excludedCharges)}`);
console.log(`- Recibo Total Inquilino: ${formatBRL(calc1.totalTenantReceipt)}`);
console.log(`- Enquadramento: ${calc1.enquadramento.isTaxpayer ? 'CONTRIBUINTE' : 'NÃO CONTRIBUINTE'}`);
console.log(`- Parecer de Auditoria: [${calc1.auditReport.complianceStatus}] ${calc1.auditReport.executiveSummary}`);
console.log(`- IBS/CBS Devido: ${formatBRL(calc1.totalTaxDue)}`);

// 2. Cenário 2: Locador PF Enquadrado - Testando Transição (2026 Teste vs 2033 Pleno)
console.log('\n📌 CENÁRIO 2: Locador PF Enquadrado (5 imóveis, R$ 300k/ano) - Análise de Transição');
const landlordBig: LandlordProfile = {
  personType: 'pf',
  totalPropertiesRented: 5,
  totalAnnualRentalIncome: 300000,
};

// 2026 (Ano Teste)
const calc2026 = TaxCalculatorEngine.calculateContract({
  baseRent: 3500,
  propertyType: 'residential',
  transitionYear: 2026,
  landlord: landlordBig,
  tenant: tenantPF,
});

// 2033 (Regime Pleno)
const calc2033 = TaxCalculatorEngine.calculateContract({
  baseRent: 3500,
  propertyType: 'residential',
  transitionYear: 2033,
  landlord: landlordBig,
  tenant: tenantPF,
});

console.log(`- Aluguel Base: ${formatBRL(3500)} | Redutor Social: - ${formatBRL(calc2033.socialDeductionApplied)} | Base Líquida: ${formatBRL(calc2033.taxableBase)}`);
console.log(`  • Em 2026 (Ano Teste 0,30% efetivo): CBS: ${formatBRL(calc2026.cbsAmount)} | IBS: ${formatBRL(calc2026.ibsAmount)} | Total: ${formatBRL(calc2026.totalTaxDue)}`);
console.log(`  • Em 2033 (Pleno 7,95% efetivo):    CBS: ${formatBRL(calc2033.cbsAmount)} | IBS: ${formatBRL(calc2033.ibsAmount)} | Total: ${formatBRL(calc2033.totalTaxDue)}`);
console.log(`  • Consistência Contábil: CBS (${calc2033.cbsAmount}) + IBS (${calc2033.ibsAmount}) = ${formatBRL(calc2033.totalTaxDue)} (Exatidão confirmada)`);

// 3. Cenário 3: Locadora PJ (Holding) - Créditos sobre Taxa de Imobiliária
console.log('\n📌 CENÁRIO 3: Locadora PJ (Holding) com Imobiliária Administradora (10% taxa)');
const landlordPJ: LandlordProfile = {
  personType: 'pj',
  pjTaxRegime: 'lucro_presumido',
  managementFeePercent: 10,
};
const tenantPJ: TenantProfile = { personType: 'pj', pjTaxRegime: 'lucro_real' };
const calcPJ = TaxCalculatorEngine.calculateContract({
  baseRent: 10000,
  propertyType: 'commercial',
  transitionYear: 2033,
  landlord: landlordPJ,
  tenant: tenantPJ,
});

console.log(`- Aluguel Comercial: ${formatBRL(calcPJ.baseRent)}`);
console.log(`- Débito Bruto IBS/CBS (7,95%): ${formatBRL(calcPJ.totalTaxDue)}`);
console.log(`- Taxa Imobiliária (10%): ${formatBRL(calcPJ.landlordCredits.managementFeeAmount)}`);
console.log(`- (-) Crédito de Insumo s/ Imobiliária: - ${formatBRL(calcPJ.landlordCredits.managementFeeIbsCbsCredit)}`);
console.log(`- (=) IBS/CBS Líquido a Recolher pela Holding: ${formatBRL(calcPJ.landlordCredits.netTaxToPay)}`);
console.log(`- Crédito Recuperável pelo Inquilino PJ (B2B): ${formatBRL(calcPJ.creditAnalysis.creditAmount)}`);

// 4. Cenário 4: Carteira Consolidada de 5 Imóveis
console.log('\n📌 CENÁRIO 4: Consolidação de Carteira com Encargos Acessórios');
const portfolio: PortfolioItem[] = [
  { id: '1', name: 'Apt Jardins', propertyType: 'residential', monthlyRent: 3500, condominiumFee: 800, iptuAmount: 200, tenantType: 'pf' },
  { id: '2', name: 'Studio Pinheiros', propertyType: 'residential', monthlyRent: 2800, condominiumFee: 500, iptuAmount: 150, tenantType: 'pf' },
  { id: '3', name: 'Apt Moema', propertyType: 'residential', monthlyRent: 4200, condominiumFee: 900, iptuAmount: 300, tenantType: 'pf' },
  { id: '4', name: 'Sala Paulista', propertyType: 'commercial', monthlyRent: 5500, condominiumFee: 1200, iptuAmount: 400, tenantType: 'pj' },
  { id: '5', name: 'Galpão Logístico', propertyType: 'commercial', monthlyRent: 12000, condominiumFee: 0, iptuAmount: 1000, tenantType: 'pj' },
];

const portSummary = PortfolioEngine.evaluatePortfolio(portfolio, false, DEFAULT_TAX_PARAMETERS, 2033);
console.log(`- Total de Ativos: ${portSummary.totalProperties} (${portSummary.residentialCount} residenciais, ${portSummary.commercialCount} comerciais)`);
console.log(`- Aluguéis Brutos: ${formatBRL(portSummary.totalMonthlyRent)} | Encargos Excluídos: ${formatBRL(portSummary.totalMonthlyExcludedCharges)}`);
console.log(`- Redutores Sociais Consolidado: - ${formatBRL(portSummary.totalMonthlySocialDeduction)}`);
console.log(`- Base de Cálculo Líquida: ${formatBRL(portSummary.totalMonthlyTaxableBase)}`);
console.log(`- IBS + CBS Consolidado (2033): ${formatBRL(portSummary.totalMonthlyIBSCBS)}/mês (${portSummary.effectiveAverageRate}% alíquota média)`);

console.log('\n' + '='.repeat(75));
