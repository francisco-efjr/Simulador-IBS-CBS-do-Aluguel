import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleHelp,
  Clock,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { Situacao, SituacaoIndicador, SituacaoVerificacao } from '@/data/andamento'

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
