import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleHelp,
  ClipboardCheck,
  Clock,
  FlaskConical,
  TrendingUp,
  Wrench,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { Situacao, SituacaoIndicador, SituacaoVerificacao } from '@/data/andamento'
import type { ColunaDoQuadro } from '@/services/quadro'

/**
 * Rótulo, ícone e cores de cada situação do andamento do produto.
 *
 * Fica fora das telas porque a página pública (`/`) e a seção "Onde o sistema
 * está" da tela Início (`/inicio`) precisam falar a mesma língua: "Pronto" é
 * sempre verde e "Pendente" é sempre cinza, nos dois lugares.
 */

export const APARENCIA_DA_ENTREGA: Record<
  Situacao,
  { rotulo: string; icone: LucideIcon; ponto: string; texto: string; caixa: string }
> = {
  pronto: {
    rotulo: 'Pronto',
    icone: CheckCircle2,
    ponto: 'bg-emerald-600',
    texto: 'text-emerald-800',
    caixa: 'border-emerald-200 bg-emerald-50',
  },
  andamento: {
    rotulo: 'Em andamento',
    icone: Clock,
    ponto: 'bg-amber-500',
    texto: 'text-amber-900',
    caixa: 'border-amber-200 bg-amber-50',
  },
  pendente: {
    rotulo: 'Pendente',
    icone: CircleDashed,
    ponto: 'bg-slate-400',
    texto: 'text-slate-700',
    caixa: 'border-slate-200 bg-slate-50',
  },
}

/**
 * Rótulo, ícone e cores de cada coluna do "Quadro de histórias".
 *
 * As cores conversam com as do andamento — cinza para o que nem começou, âmbar
 * para o que está em curso, verde para o que está pronto —, mas a cor nunca é o
 * único sinal: a coluna traz sempre o texto e o ícone.
 */
export const APARENCIA_DA_COLUNA: Record<
  ColunaDoQuadro,
  {
    rotulo: string
    /** O que a coluna quer dizer, em uma frase, sem jargão. */
    explicacao: string
    icone: LucideIcon
    ponto: string
    texto: string
    caixa: string
    /** Fundo da coluna inteira, atrás dos cartões. */
    coluna: string
  }
> = {
  backlog: {
    rotulo: 'Backlog',
    explicacao: 'Combinado, mas ainda não construído.',
    icone: CircleDashed,
    ponto: 'bg-slate-400',
    texto: 'text-slate-700',
    caixa: 'border-slate-200 bg-slate-50',
    coluna: 'border-slate-200 bg-slate-100/70',
  },
  desenvolvimento: {
    rotulo: 'Desenvolvimento',
    explicacao: 'Em construção: as atividades desmarcadas são o que falta.',
    icone: Wrench,
    ponto: 'bg-amber-500',
    texto: 'text-amber-900',
    caixa: 'border-amber-200 bg-amber-50',
    coluna: 'border-amber-200 bg-amber-50/60',
  },
  teste: {
    rotulo: 'Teste',
    explicacao: 'Pronto no código. Espera uma pessoa conferir e levar para a homologação.',
    icone: FlaskConical,
    ponto: 'bg-sky-600',
    texto: 'text-sky-900',
    caixa: 'border-sky-200 bg-sky-50',
    coluna: 'border-sky-200 bg-sky-50/60',
  },
  homologacao: {
    rotulo: 'Homologação',
    explicacao: 'Uma pessoa está conferindo com dado real antes de dar como pronto.',
    icone: ClipboardCheck,
    ponto: 'bg-indigo-600',
    texto: 'text-indigo-900',
    caixa: 'border-indigo-200 bg-indigo-50',
    coluna: 'border-indigo-200 bg-indigo-50/60',
  },
  concluido: {
    rotulo: 'Concluído',
    explicacao: 'Conferido e aceito por uma pessoa.',
    icone: CheckCircle2,
    ponto: 'bg-emerald-600',
    texto: 'text-emerald-800',
    caixa: 'border-emerald-200 bg-emerald-50',
    coluna: 'border-emerald-200 bg-emerald-50/60',
  },
}

export const APARENCIA_DA_VERIFICACAO: Record<
  SituacaoVerificacao,
  { rotulo: string; icone: LucideIcon; texto: string; caixa: string }
> = {
  ok: {
    rotulo: 'Em ordem',
    icone: CheckCircle2,
    texto: 'text-emerald-800',
    caixa: 'border-emerald-200 bg-emerald-50',
  },
  atencao: {
    rotulo: 'Atenção',
    icone: AlertTriangle,
    texto: 'text-amber-900',
    caixa: 'border-amber-200 bg-amber-50',
  },
  falha: {
    rotulo: 'Precisa de correção',
    icone: XCircle,
    texto: 'text-red-800',
    caixa: 'border-red-200 bg-red-50',
  },
}

export const APARENCIA_DO_INDICADOR: Record<
  SituacaoIndicador,
  { rotulo: string; icone: LucideIcon; texto: string; caixa: string }
> = {
  'no-caminho': {
    rotulo: 'No caminho',
    icone: TrendingUp,
    texto: 'text-emerald-800',
    caixa: 'border-emerald-200 bg-emerald-50',
  },
  atencao: {
    rotulo: 'Ainda longe da meta',
    icone: AlertTriangle,
    texto: 'text-amber-900',
    caixa: 'border-amber-200 bg-amber-50',
  },
  parado: {
    rotulo: 'Ainda não começou',
    icone: CircleDashed,
    texto: 'text-slate-700',
    caixa: 'border-slate-200 bg-slate-50',
  },
  'nao-medido': {
    rotulo: 'Ainda não medido',
    icone: CircleHelp,
    texto: 'text-slate-700',
    caixa: 'border-slate-200 bg-slate-50',
  },
}
