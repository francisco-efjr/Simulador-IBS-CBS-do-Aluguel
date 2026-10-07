/**
 * Cálculo único dos indicadores financeiros (receitas e despesas).
 *
 * Regra de negócio (FIN-02):
 *  - "Recebido"/"pago" = soma de `valor_recebido`/`valor_pago` de TODA linha com valor
 *    maior que zero, inclusive a parcial, na data de recebimento/pagamento.
 *  - "Saldo" = previsto − recebido (nunca negativo).
 *  - "A receber/pagar" = saldo das linhas ainda dentro do prazo; "vencido" = saldo das
 *    linhas com vencimento anterior a hoje. Parcial vencida entra pelo saldo.
 *  - O texto do `status_financeiro` não decide nada: quem manda são os valores e as datas.
 *
 * Usada pelos dois dashboards, pelo Início e pelos relatórios (PDF e Excel).
 */

export type TipoLancamento = 'receita' | 'despesa'

export interface LancamentoFinanceiro {
  valor?: number | string | null
  valor_previsto?: number | string | null
  valor_recebido?: number | string | null
  valor_pago?: number | string | null
  data?: string | null
  data_vencimento?: string | null
  data_recebimento?: string | null
  data_pagamento?: string | null
  status_financeiro?: string | null
}

/** Converte para número, tratando vazio, texto e NaN como zero. */
export function numero(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Arredonda para centavos, evitando 0,1 + 0,2 = 0,30000000000000004. */
export function centavos(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100
}

/** Data local de hoje em AAAA-MM-DD (não UTC: às 21h em Manaus o UTC já é amanhã). */
export function hojeLocalISO(agora: Date = new Date()): string {
  const y = agora.getFullYear()
  const m = String(agora.getMonth() + 1).padStart(2, '0')
  const d = String(agora.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Extrai AAAA-MM-DD de uma data ou de um carimbo ISO; vazio se não houver. */
export function dataISO(v: string | null | undefined): string {
  if (!v || v.length < 10) return ''
  return v.substring(0, 10)
}

export function valorPrevisto(l: LancamentoFinanceiro): number {
  return numero(l.valor_previsto) || numero(l.valor)
}

/**
 * Valor efetivamente recebido/pago (inclusive parcial). Registros antigos quitados que só
 * têm o campo legado `valor` continuam valendo esse valor.
 */
export function valorRealizado(l: LancamentoFinanceiro, tipo: TipoLancamento): number {
  const campo = tipo === 'receita' ? l.valor_recebido : l.valor_pago
  const v = numero(campo)
  if (v > 0) return v
  const quitado = tipo === 'receita' ? 'recebido' : 'pago'
  if (l.status_financeiro === quitado) return numero(l.valor)
  return 0
}

/** Quanto ainda falta receber/pagar. */
export function saldoEmAberto(l: LancamentoFinanceiro, tipo: TipoLancamento): number {
  return Math.max(centavos(valorPrevisto(l) - valorRealizado(l, tipo)), 0)
}

export function dataDeRealizacao(l: LancamentoFinanceiro, tipo: TipoLancamento): string {
  const principal = tipo === 'receita' ? l.data_recebimento : l.data_pagamento
  return dataISO(principal || l.data)
}

export function dataDeVencimento(l: LancamentoFinanceiro): string {
  return dataISO(l.data_vencimento || l.data)
}

/** Vencido = ainda tem saldo e o vencimento é anterior a hoje. */
export function estaVencido(
  l: LancamentoFinanceiro,
  tipo: TipoLancamento,
  hoje: string = hojeLocalISO(),
): boolean {
  if (saldoEmAberto(l, tipo) <= 0) return false
  const venc = dataDeVencimento(l)
  if (venc) return venc < hoje
  return l.status_financeiro === 'em_atraso'
}

export interface FiltroPeriodo {
  /** Início inclusivo, AAAA-MM-DD (vazio = sem limite). */
  inicio?: string
  /** Fim inclusivo, AAAA-MM-DD (vazio = sem limite). */
  fim?: string
  /** Data de hoje, para decidir o que está vencido (padrão: hoje local). */
  hoje?: string
}

export function dentroDoPeriodo(data: string, inicio?: string, fim?: string): boolean {
  if (!data) return false
  if (inicio && data < inicio) return false
  if (fim && data > fim) return false
  return true
}

export interface ResumoFinanceiro {
  receitasRecebidas: number
  despesasPagas: number
  resultadoLiquido: number
  quantidadeReceitasRecebidas: number
  quantidadeDespesasPagas: number
  /** Saldo de receitas ainda dentro do prazo (vencimento no período). */
  receitasAReceber: number
  /** Saldo de receitas com vencimento anterior a hoje (vencimento no período). */
  receitasVencidas: number
  despesasAPagar: number
  despesasVencidas: number
  /** Total previsto no período (por vencimento), recebido ou não. */
  receitasPrevistas: number
  despesasPrevistas: number
}

/** Resume um conjunto de receitas e despesas para o período. Função pura. */
export function resumirFinanceiro(
  receitas: LancamentoFinanceiro[],
  despesas: LancamentoFinanceiro[],
  periodo: FiltroPeriodo = {},
): ResumoFinanceiro {
  const hoje = periodo.hoje || hojeLocalISO()
  const { inicio, fim } = periodo

  let receitasRecebidas = 0
  let despesasPagas = 0
  let quantidadeReceitasRecebidas = 0
  let quantidadeDespesasPagas = 0
  let receitasAReceber = 0
  let receitasVencidas = 0
  let despesasAPagar = 0
  let despesasVencidas = 0
  let receitasPrevistas = 0
  let despesasPrevistas = 0

  const processar = (lista: LancamentoFinanceiro[], tipo: TipoLancamento) => {
    for (const l of lista) {
      const realizado = valorRealizado(l, tipo)
      if (realizado > 0 && dentroDoPeriodo(dataDeRealizacao(l, tipo), inicio, fim)) {
        if (tipo === 'receita') {
          receitasRecebidas += realizado
          quantidadeReceitasRecebidas++
        } else {
          despesasPagas += realizado
          quantidadeDespesasPagas++
        }
      }

      if (!dentroDoPeriodo(dataDeVencimento(l), inicio, fim)) continue
      const previsto = valorPrevisto(l)
      const saldo = saldoEmAberto(l, tipo)
      if (tipo === 'receita') receitasPrevistas += previsto
      else despesasPrevistas += previsto
      if (saldo <= 0) continue
      const vencido = estaVencido(l, tipo, hoje)
      if (tipo === 'receita') {
        if (vencido) receitasVencidas += saldo
        else receitasAReceber += saldo
      } else if (vencido) {
        despesasVencidas += saldo
      } else {
        despesasAPagar += saldo
      }
    }
  }

  processar(receitas, 'receita')
  processar(despesas, 'despesa')

  return {
    receitasRecebidas: centavos(receitasRecebidas),
    despesasPagas: centavos(despesasPagas),
    resultadoLiquido: centavos(receitasRecebidas - despesasPagas),
    quantidadeReceitasRecebidas,
    quantidadeDespesasPagas,
    receitasAReceber: centavos(receitasAReceber),
    receitasVencidas: centavos(receitasVencidas),
    despesasAPagar: centavos(despesasAPagar),
    despesasVencidas: centavos(despesasVencidas),
    receitasPrevistas: centavos(receitasPrevistas),
    despesasPrevistas: centavos(despesasPrevistas),
  }
}

/** Totais das receitas do Início: recebido e previsto separados e rotulados (FIN-07). */
export interface TotaisReceitas {
  recebido: number
  previsto: number
  saldo: number
}

export function totaisDeReceitas(receitas: LancamentoFinanceiro[]): TotaisReceitas {
  let recebido = 0
  let previsto = 0
  let saldo = 0
  for (const r of receitas) {
    recebido += valorRealizado(r, 'receita')
    previsto += valorPrevisto(r)
    saldo += saldoEmAberto(r, 'receita')
  }
  return { recebido: centavos(recebido), previsto: centavos(previsto), saldo: centavos(saldo) }
}
