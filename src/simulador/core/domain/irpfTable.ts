import { FinancialMath } from './FinancialMath.ts'

/**
 * Tabelas Progressivas Mensais do IRPF (Carnê-Leão) por ano-calendário.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * PARÂMETROS SUJEITOS A ATUALIZAÇÃO LEGISLATIVA ANUAL.
 * Confira os valores contra a tabela oficial da Receita Federal antes de
 * publicar cada ano-calendário. Todo o resto do sistema lê exclusivamente
 * daqui — não há faixa de IRPF codificada em nenhum outro arquivo.
 * ────────────────────────────────────────────────────────────────────────────
 */

export interface IRPFBracket {
  /** Limite superior da faixa (R$/mês). Infinity na última faixa. */
  upTo: number
  /** Alíquota da faixa (%) */
  rate: number
  /** Parcela a deduzir do imposto apurado (R$) */
  deduction: number
}

export interface IRPFTable {
  /** Ano-calendário a partir do qual a tabela vigora */
  effectiveFrom: number
  label: string
  legalBasis: string
  brackets: IRPFBracket[]
  /** Desconto simplificado mensal alternativo às deduções legais (R$) */
  simplifiedDeduction: number
  /**
   * Redutor de isenção ampliada (Lei nº 15.270/2025, vigente a partir de 2026).
   * Zera o imposto até `fullExemptionUpTo` e reduz linearmente até
   * `phaseOutUpTo`, quando o redutor se extingue.
   */
  exemptionRelief?: {
    fullExemptionUpTo: number
    phaseOutUpTo: number
  }
}

/**
 * Tabelas conhecidas, em ordem crescente de vigência.
 */
export const IRPF_TABLES: IRPFTable[] = [
  {
    effectiveFrom: 2024,
    label: 'Tabela mensal 2024',
    legalBasis: 'Lei nº 14.848/2024 (conversão da MP nº 1.206/2024)',
    simplifiedDeduction: 564.8,
    brackets: [
      { upTo: 2259.2, rate: 0, deduction: 0 },
      { upTo: 2826.65, rate: 7.5, deduction: 169.44 },
      { upTo: 3751.05, rate: 15, deduction: 381.44 },
      { upTo: 4664.68, rate: 22.5, deduction: 662.77 },
      { upTo: Infinity, rate: 27.5, deduction: 896.0 },
    ],
  },
  {
    effectiveFrom: 2025,
    label: 'Tabela mensal 2025',
    legalBasis: 'Lei nº 15.191/2025 (conversão da MP nº 1.294/2025)',
    simplifiedDeduction: 607.2,
    brackets: [
      { upTo: 2428.8, rate: 0, deduction: 0 },
      { upTo: 2826.65, rate: 7.5, deduction: 182.16 },
      { upTo: 3751.05, rate: 15, deduction: 394.16 },
      { upTo: 4664.68, rate: 22.5, deduction: 675.49 },
      { upTo: Infinity, rate: 27.5, deduction: 908.73 },
    ],
  },
  {
    effectiveFrom: 2026,
    label: 'Tabela mensal 2026 (isenção ampliada)',
    legalBasis: 'Lei nº 15.270/2025 — isenção até R$ 5.000,00 e redutor até R$ 7.350,00',
    simplifiedDeduction: 607.2,
    brackets: [
      { upTo: 2428.8, rate: 0, deduction: 0 },
      { upTo: 2826.65, rate: 7.5, deduction: 182.16 },
      { upTo: 3751.05, rate: 15, deduction: 394.16 },
      { upTo: 4664.68, rate: 22.5, deduction: 675.49 },
      { upTo: Infinity, rate: 27.5, deduction: 908.73 },
    ],
    exemptionRelief: {
      fullExemptionUpTo: 5000.0,
      phaseOutUpTo: 7350.0,
    },
  },
]

/**
 * Seleciona a tabela vigente no ano-calendário informado.
 * Anos anteriores à primeira tabela usam a mais antiga conhecida;
 * anos posteriores à última usam a mais recente.
 */
export function getIRPFTable(year: number): IRPFTable {
  let selected = IRPF_TABLES[0]
  for (const table of IRPF_TABLES) {
    if (year >= table.effectiveFrom) {
      selected = table
    }
  }
  return selected
}

/**
 * Aplica a tabela progressiva sobre a base de cálculo mensal já deduzida.
 */
function applyBrackets(taxableBase: number, table: IRPFTable): number {
  if (taxableBase <= 0) return 0
  const bracket =
    table.brackets.find((b) => taxableBase <= b.upTo) ?? table.brackets[table.brackets.length - 1]
  if (bracket.rate === 0) return 0
  return Math.max(0, FinancialMath.round((taxableBase * bracket.rate) / 100 - bracket.deduction))
}

/**
 * Calcula o IRPF mensal (Carnê-Leão) do ano-calendário informado.
 *
 * @param grossIncome     Rendimento bruto de aluguel no mês (R$)
 * @param legalDeductions Deduções legais do mês — comissão de imobiliária,
 *                        condomínio e IPTU quando suportados pelo locador,
 *                        IBS/CBS recolhido (R$)
 * @param year            Ano-calendário da apuração
 */
export function calculateMonthlyIRPF(
  grossIncome: number,
  legalDeductions: number = 0,
  year: number = new Date().getFullYear(),
): number {
  if (grossIncome <= 0) return 0

  const table = getIRPFTable(year)

  // O contribuinte adota o critério mais vantajoso: deduções legais efetivas
  // ou o desconto simplificado, nunca os dois cumulativamente.
  const effectiveDeduction = Math.max(legalDeductions, table.simplifiedDeduction)
  const taxableBase = Math.max(0, FinancialMath.subtract(grossIncome, effectiveDeduction))

  const taxByBrackets = applyBrackets(taxableBase, table)
  if (taxByBrackets <= 0) return 0

  const relief = table.exemptionRelief
  if (!relief) return taxByBrackets

  // Redutor de isenção ampliada: incide sobre o rendimento bruto do mês.
  if (grossIncome <= relief.fullExemptionUpTo) return 0
  if (grossIncome >= relief.phaseOutUpTo) return taxByBrackets

  // Entre os dois tetos o redutor decresce linearmente, partindo do imposto
  // integral apurado no teto de isenção até zerar no teto do redutor.
  const range = relief.phaseOutUpTo - relief.fullExemptionUpTo
  const remainingShare = (grossIncome - relief.fullExemptionUpTo) / range
  return Math.max(0, FinancialMath.round(taxByBrackets * remainingShare))
}
