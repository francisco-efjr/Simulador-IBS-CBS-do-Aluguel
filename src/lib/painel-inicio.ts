/**
 * Números do painel de Início (tela 02 do handoff do visual orgânico).
 *
 * Funções puras: recebem as listas já carregadas e a data de hoje, e devolvem
 * o que a tela mostra. O valor de cada lançamento segue as regras de
 * `indicadores-financeiros` — recebido é o que entrou, não o que estava previsto.
 */
import {
  dataDeVencimento,
  hojeLocalISO,
  resumirFinanceiro,
  saldoEmAberto,
  type LancamentoFinanceiro,
} from '@/lib/indicadores-financeiros'

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const pad = (n: number) => String(n).padStart(2, '0')

/** Primeiro e último dia (AAAA-MM-DD) do mês `deslocamento` meses antes de `hoje`. */
export function limitesDoMes(hoje: string, deslocamento: number) {
  const [ano, mes] = hoje.split('-').map(Number)
  const base = new Date(ano, mes - 1 - deslocamento, 1)
  const a = base.getFullYear()
  const m = base.getMonth() + 1
  const ultimo = new Date(a, m, 0).getDate()
  return { inicio: `${a}-${pad(m)}-01`, fim: `${a}-${pad(m)}-${pad(ultimo)}`, nome: MESES[m - 1] }
}

export interface ResultadoDoMes {
  /** Nome do mês fechado, em minúsculas ("setembro"). */
  mes: string
  receitas: number
  despesas: number
  resultado: number
  /** Variação do resultado sobre o mês anterior, em %; `null` quando não dá para comparar. */
  variacao: number | null
}

/** Resultado do último mês fechado (o anterior ao de hoje): recebido menos pago. */
export function resultadoDoUltimoMes(
  receitas: LancamentoFinanceiro[],
  despesas: LancamentoFinanceiro[],
  hoje: string = hojeLocalISO(),
): ResultadoDoMes {
  const fechado = limitesDoMes(hoje, 1)
  const anterior = limitesDoMes(hoje, 2)
  const atual = resumirFinanceiro(receitas, despesas, { ...fechado, hoje })
  const antes = resumirFinanceiro(receitas, despesas, { ...anterior, hoje })
  const variacao =
    antes.resultadoLiquido > 0
      ? Math.round(
          ((atual.resultadoLiquido - antes.resultadoLiquido) / antes.resultadoLiquido) * 100,
        )
      : null
  return {
    mes: fechado.nome,
    receitas: atual.receitasRecebidas,
    despesas: atual.despesasPagas,
    resultado: atual.resultadoLiquido,
    variacao,
  }
}

export interface Ocupacao {
  ocupadas: number
  total: number
  /** Percentual inteiro; `null` sem unidades. */
  percentual: number | null
}

/** Unidades alugadas sobre as unidades em uso (inativas não contam). */
export function ocupacaoDasUnidades(unidades: { status?: string | null }[]): Ocupacao {
  const emUso = unidades.filter((u) => u.status !== 'inativo')
  const ocupadas = emUso.filter((u) => u.status === 'alugado').length
  const total = emUso.length
  return { ocupadas, total, percentual: total ? Math.round((ocupadas / total) * 100) : null }
}

export interface ProximoRecebimento {
  id: string
  data: string
  quem: string
  valor: number
}

type ReceitaDoPainel = LancamentoFinanceiro & {
  id: string
  descricao?: string | null
  expand?: { inquilino?: { nome?: string | null } | null } | null
}

/** Próximas receitas com saldo em aberto, a partir de hoje, em ordem de data. */
export function proximosRecebimentos(
  receitas: ReceitaDoPainel[],
  hoje: string = hojeLocalISO(),
  limite = 4,
): ProximoRecebimento[] {
  return receitas
    .map((r) => ({ r, data: dataDeVencimento(r), saldo: saldoEmAberto(r, 'receita') }))
    .filter(({ data, saldo }) => saldo > 0 && data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, limite)
    .map(({ r, data, saldo }) => ({
      id: r.id,
      data,
      quem: r.expand?.inquilino?.nome || r.descricao || 'Receita prevista',
      valor: saldo,
    }))
}

export type TomDoAlerta = 'argila' | 'siena' | 'musgo'

export interface AlertaDoPainel {
  id: string
  titulo: string
  detalhe: string
  tom: TomDoAlerta
  tipo: 'contrato' | 'iptu' | 'receita' | 'transacoes'
  /** Dias até o vencimento (negativo = vencido). Ordena a lista. */
  dias: number
}

const diasEntre = (de: string, ate: string) =>
  Math.round((Date.parse(`${ate}T00:00:00`) - Date.parse(`${de}T00:00:00`)) / 86_400_000)

const dataCurta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

const quando = (dias: number) =>
  dias < 0
    ? `venceu há ${-dias} ${-dias === 1 ? 'dia' : 'dias'}`
    : dias === 0
      ? 'vence hoje'
      : `vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`

interface EntradaDosAlertas {
  contratos: {
    id: string
    status?: string | null
    data_fim?: string | null
    numero?: string | null
    expand?: {
      inquilino?: { nome?: string | null } | Record<string, unknown> | null
      unidade_id?: { identificador?: string | null } | null
      imovel?: { nome?: string | null } | null
    } | null
  }[]
  iptu: {
    id: string
    status?: string | null
    vencimento?: string | null
    descricao?: string | null
    expand?: { imovel?: { nome?: string | null } | null } | null
  }[]
  receitas: ReceitaDoPainel[]
  transacoesParaClassificar: number
  hoje?: string
}

/**
 * O que "pede atenção" no Início: contratos que terminam em 30 dias, IPTU e
 * taxas vencendo ou vencidos, aluguéis em atraso e a fila do extrato. Os mais
 * urgentes primeiro; a tela mostra até 3 e leva para Alertas.
 */
export function alertasDoPainel({
  contratos,
  iptu,
  receitas,
  transacoesParaClassificar,
  hoje = hojeLocalISO(),
}: EntradaDosAlertas): AlertaDoPainel[] {
  const alertas: AlertaDoPainel[] = []

  for (const c of contratos) {
    if (c.status !== 'ativo' || !c.data_fim) continue
    const dias = diasEntre(hoje, c.data_fim.slice(0, 10))
    if (dias > 30) continue
    const inquilino = (c.expand?.inquilino as { nome?: string | null } | null)?.nome
    const onde =
      c.expand?.unidade_id?.identificador || c.expand?.imovel?.nome || c.numero || 'contrato'
    alertas.push({
      id: `contrato-${c.id}`,
      tipo: 'contrato',
      tom: dias < 0 ? 'siena' : 'argila',
      dias,
      titulo: `Contrato de ${onde} ${quando(dias)}`,
      detalhe: [inquilino, dataCurta(c.data_fim)].filter(Boolean).join(' · '),
    })
  }

  for (const t of iptu) {
    if (t.status === 'pago' || !t.vencimento) continue
    const dias = diasEntre(hoje, t.vencimento.slice(0, 10))
    if (dias > 30 && t.status !== 'vencido') continue
    alertas.push({
      id: `iptu-${t.id}`,
      tipo: 'iptu',
      tom: 'siena',
      dias,
      titulo: [t.descricao || 'IPTU e taxas', t.expand?.imovel?.nome].filter(Boolean).join(' · '),
      detalhe: `${quando(dias).replace(/^./, (l) => l.toUpperCase())}, ${dataCurta(t.vencimento)}`,
    })
  }

  for (const r of receitas) {
    const saldo = saldoEmAberto(r, 'receita')
    const venc = dataDeVencimento(r)
    if (saldo <= 0 || !venc || venc >= hoje) continue
    const dias = diasEntre(hoje, venc)
    alertas.push({
      id: `receita-${r.id}`,
      tipo: 'receita',
      tom: 'siena',
      dias,
      titulo: `Aluguel em atraso: ${r.expand?.inquilino?.nome || r.descricao || 'receita'}`,
      detalhe: `Venceu em ${dataCurta(venc)}`,
    })
  }

  alertas.sort((a, b) => a.dias - b.dias)

  if (transacoesParaClassificar > 0) {
    // A fila do extrato não tem data; entra depois dos vencimentos da semana.
    const item: AlertaDoPainel = {
      id: 'transacoes',
      tipo: 'transacoes',
      tom: 'musgo',
      dias: 7,
      titulo: `${transacoesParaClassificar} ${transacoesParaClassificar === 1 ? 'transação' : 'transações'} para classificar`,
      detalhe: 'Extrato importado aguardando revisão',
    }
    const posicao = alertas.findIndex((a) => a.dias > 7)
    alertas.splice(posicao === -1 ? alertas.length : posicao, 0, item)
  }

  return alertas
}
