import andamentoJson from './andamento.json'
import auditoriaJson from './auditoria.json'
import feedJson from './feed.json'

/**
 * Dados da página pública de andamento (`/`).
 *
 * O conteúdo mora em JSON para ser editado sem mexer em tela nenhuma:
 *
 * - `andamento.json` — o quadro de entregas por frente e as pendências;
 * - `feed.json`      — a lista "Últimas atualizações", mais recente primeiro.
 *                      Regra de processo: toda entrega acrescenta uma entrada
 *                      aqui no mesmo PR (ver docs/07-auditor.md);
 * - `auditoria.json` — GERADO pelo `scripts/auditor.mjs` a cada build. Não
 *                      edite à mão: o build da Vercel o reescreve.
 *
 * Este módulo só dá tipo aos JSONs e oferece as derivações que a tela usa.
 */

export type Situacao = 'pronto' | 'andamento' | 'pendente'

export interface Entrega {
  titulo: string
  detalhe: string
  situacao: Situacao
}

export interface Frente {
  nome: string
  entregas: Entrega[]
}

export interface Pendencia {
  codigo: string
  titulo: string
  detalhe: string
}

export interface Andamento {
  frentes: Frente[]
  pendencias: {
    introducao: string
    itens: Pendencia[]
  }
}

export type TipoAtualizacao = 'entrega' | 'correcao' | 'seguranca' | 'infra'

export interface EntradaFeed {
  /** AAAA-MM-DD, no calendário de Brasília. */
  data: string
  titulo: string
  texto: string
  tipo: TipoAtualizacao
  /** Ex.: "PR #2". Opcional. */
  referencia?: string
}

export type SituacaoVerificacao = 'ok' | 'atencao' | 'falha'

export interface Verificacao {
  id: string
  /** Nome para leigo, mostrado na tela. */
  nome: string
  descricao: string
  situacao: SituacaoVerificacao
  /** Resultado em linguagem simples, mostrado na tela. */
  detalhe: string
}

export interface Auditoria {
  /** ISO 8601 (UTC). */
  geradoEm: string
  commit: string | null
  verificacoes: Verificacao[]
}

export const ANDAMENTO = andamentoJson as Andamento
export const FEED = feedJson as EntradaFeed[]
export const AUDITORIA = auditoriaJson as Auditoria

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

/**
 * "2026-09-18" → "18 de setembro de 2026".
 *
 * Montado à mão, sem `Date`, para o fuso de quem abre a página não empurrar a
 * data para o dia anterior.
 */
export function formatarDataPorExtenso(data: string): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  if (!ano || !mes || !dia || mes < 1 || mes > 12) return data
  return `${dia} de ${MESES[mes - 1]} de ${ano}`
}

/** Instante ISO → "19 de setembro de 2026, às 12:14", no horário de Brasília. */
export function formatarMomentoBrasilia(iso: string): string {
  const momento = new Date(iso)
  if (Number.isNaN(momento.getTime())) return iso
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(momento)
      .map((parte) => [parte.type, parte.value]),
  )
  const mes = MESES[Number(partes.month) - 1]
  return `${Number(partes.day)} de ${mes} de ${partes.year}, às ${partes.hour}:${partes.minute}`
}

/**
 * Data do quadro: a da atualização mais recente do feed. Assim o "Atualizado
 * em" nunca fica para trás de uma novidade anunciada.
 */
export function dataDaUltimaAtualizacao(feed: EntradaFeed[] = FEED): string | null {
  return feed.reduce<string | null>(
    (maisRecente, entrada) =>
      maisRecente === null || entrada.data > maisRecente ? entrada.data : maisRecente,
    null,
  )
}
