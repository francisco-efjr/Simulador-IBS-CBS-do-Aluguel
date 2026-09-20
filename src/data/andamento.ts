import andamentoJson from './andamento.json'
import auditoriaJson from './auditoria.json'
import feedJson from './feed.json'
import objetivosJson from './objetivos.json'

/**
 * Dados do andamento do produto, usados pela página pública (`/`) e pela seção
 * "Onde o sistema está" da tela Início (`/inicio`).
 *
 * O conteúdo mora em JSON para ser editado sem mexer em tela nenhuma:
 *
 * - `andamento.json` — o quadro de entregas por frente e as pendências;
 * - `feed.json`      — a lista "Últimas atualizações", mais recente primeiro.
 *                      Regra de processo: toda entrega acrescenta uma entrada
 *                      aqui no mesmo PR (ver docs/07-auditor.md);
 * - `objetivos.json` — o objetivo do produto, seus indicadores e o que vem a
 *                      seguir. Vem da documentação de produto (docs/08-produto):
 *                      o Product Goal do README e o topo do backlog. Número aqui
 *                      só entra se a documentação o afirmar; indicador sem
 *                      medição fica `nao-medido`;
 * - `auditoria.json` — GERADO pelo `scripts/auditor.mjs` a cada build. Não
 *                      edite à mão: o build da Vercel o reescreve.
 *
 * Este módulo só dá tipo aos JSONs e oferece as derivações que as telas usam.
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

/**
 * Como está cada indicador do objetivo:
 *
 * - `no-caminho`  — anda na direção da meta;
 * - `atencao`     — já acontece, mas longe do que a meta pede;
 * - `parado`      — ainda em zero: o que faz o número subir não existe;
 * - `nao-medido`  — ninguém mede ainda. A tela diz "ainda não medido" e não
 *                   inventa número.
 */
export type SituacaoIndicador = 'no-caminho' | 'atencao' | 'parado' | 'nao-medido'

export interface Indicador {
  nome: string
  /** O que o número quer dizer, em uma frase, sem jargão. */
  comoSeMede: string
  /** Onde está hoje. `null` quando ninguém mede ainda. */
  hoje: string | null
  /** Onde precisa chegar até o prazo do objetivo. */
  meta: string
  situacao: SituacaoIndicador
}

export interface ProximoPasso {
  /** Código do item no backlog (ex.: "B-03"), para conferir na documentação. */
  codigo: string
  titulo: string
  detalhe: string
}

export interface Objetivos {
  objetivo: {
    /** O objetivo do produto em uma frase. */
    frase: string
    /** AAAA-MM-DD. */
    prazo: string
    /** O mesmo prazo escrito por extenso, como aparece na tela. */
    prazoPorExtenso: string
  }
  indicadores: Indicador[]
  proximosPassos: ProximoPasso[]
}

export const ANDAMENTO = andamentoJson as Andamento
export const FEED = feedJson as EntradaFeed[]
export const AUDITORIA = auditoriaJson as Auditoria
export const OBJETIVOS = objetivosJson as Objetivos

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

/** Quebra um instante ISO nas partes do relógio de Brasília. */
function partesEmBrasilia(iso: string): Record<string, string> | null {
  const momento = new Date(iso)
  if (Number.isNaN(momento.getTime())) return null
  return Object.fromEntries(
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
}

/** Instante ISO → "19 de setembro de 2026, às 12:14", no horário de Brasília. */
export function formatarMomentoBrasilia(iso: string): string {
  const partes = partesEmBrasilia(iso)
  if (!partes) return iso
  const mes = MESES[Number(partes.month) - 1]
  return `${Number(partes.day)} de ${mes} de ${partes.year}, às ${partes.hour}:${partes.minute}`
}

/** Instante ISO → "19 de setembro de 2026", no calendário de Brasília. */
export function formatarDiaEmBrasilia(iso: string): string {
  const partes = partesEmBrasilia(iso)
  if (!partes) return iso
  const mes = MESES[Number(partes.month) - 1]
  return `${Number(partes.day)} de ${mes} de ${partes.year}`
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

export interface ProgressoDasEntregas {
  total: number
  contagem: Record<Situacao, number>
  /** Inteiro de 0 a 100. Sem entrega nenhuma, 0 — nunca "NaN%" na tela. */
  percentualPronto: number
}

/**
 * Quantas entregas estão prontas, em andamento e pendentes, somando todas as
 * frentes. Serve ao "Resumo" da página pública e à seção "Onde o sistema está"
 * da tela Início, para que os dois nunca contem diferente.
 */
export function progressoDasEntregas(andamento: Andamento = ANDAMENTO): ProgressoDasEntregas {
  const entregas = andamento.frentes.flatMap((frente) => frente.entregas)
  const contagem: Record<Situacao, number> = {
    pronto: entregas.filter((e) => e.situacao === 'pronto').length,
    andamento: entregas.filter((e) => e.situacao === 'andamento').length,
    pendente: entregas.filter((e) => e.situacao === 'pendente').length,
  }
  const total = entregas.length
  return {
    total,
    contagem,
    percentualPronto: total ? Math.round((contagem.pronto / total) * 100) : 0,
  }
}

/**
 * O "hoje" de um indicador, pronto para a tela. Indicador que ninguém mede não
 * ganha número inventado: diz que ainda não é medido.
 */
export function textoDeHoje(indicador: Indicador): string {
  if (indicador.situacao === 'nao-medido' || !indicador.hoje?.trim()) return 'ainda não medido'
  return indicador.hoje.trim()
}

/** Frase-resumo da saúde do sistema, para o cabeçalho e o topo da seção. */
export function resumoDaSaude(
  auditoria: Auditoria = AUDITORIA,
): { situacao: SituacaoVerificacao; frase: string } | null {
  const verificacoes = auditoria.verificacoes
  if (!verificacoes.length) return null
  const total = verificacoes.length
  const falhas = verificacoes.filter((v) => v.situacao === 'falha').length
  const atencoes = verificacoes.filter((v) => v.situacao === 'atencao').length
  if (!falhas && !atencoes) {
    return {
      situacao: 'ok',
      frase: `Tudo em ordem: as ${total} conferências automáticas passaram.`,
    }
  }
  const partes = [`${total - falhas - atencoes} de ${total} conferências em ordem`]
  if (atencoes) partes.push(`${atencoes} ${atencoes === 1 ? 'pede' : 'pedem'} atenção`)
  if (falhas) partes.push(`${falhas} ${falhas === 1 ? 'precisa' : 'precisam'} de correção`)
  return {
    situacao: falhas ? 'falha' : 'atencao',
    frase: partes.join(', ').replace(/, ([^,]*)$/, ' e $1') + '.',
  }
}

/**
 * A mesma saúde em uma linha só, para a tela Início: lá o painel completo não
 * se repete, basta saber que a última conferência passou e quando.
 */
export function resumoCurtoDaSaude(
  auditoria: Auditoria = AUDITORIA,
): { situacao: SituacaoVerificacao; frase: string } | null {
  const verificacoes = auditoria.verificacoes
  if (!verificacoes.length) return null
  const total = verificacoes.length
  const falhas = verificacoes.filter((v) => v.situacao === 'falha').length
  const atencoes = verificacoes.filter((v) => v.situacao === 'atencao').length
  const emOrdem = total - falhas - atencoes
  return {
    situacao: falhas ? 'falha' : atencoes ? 'atencao' : 'ok',
    frase: `Última conferência automática: ${emOrdem} de ${total} em ordem, em ${formatarDiaEmBrasilia(auditoria.geradoEm)}.`,
  }
}
