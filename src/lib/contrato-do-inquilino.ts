/**
 * Contrato e unidade de cada inquilino para a lista de Inquilinos (seção 12 do
 * handoff Fase 2): a pílula "Vigente / Vence em N dias / Sem contrato" e a
 * unidade que ele ocupa. Funções puras; "hoje" entra como parâmetro.
 */
import { situacaoDoContrato, type TomSituacao } from '@/lib/situacao-contrato'

export type FiltroContratoDoInquilino = 'todos' | 'com' | 'sem'

export const FILTROS_DE_CONTRATO_DO_INQUILINO: {
  valor: FiltroContratoDoInquilino
  rotulo: string
}[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'com', rotulo: 'Com contrato' },
  { valor: 'sem', rotulo: 'Sem contrato' },
]

export const ehFiltroContratoDoInquilino = (v: string | null): v is FiltroContratoDoInquilino =>
  FILTROS_DE_CONTRATO_DO_INQUILINO.some((f) => f.valor === v)

/** Parte do contrato de que a lista precisa (o contrato real traz muito mais). */
export interface ContratoParaInquilino {
  inquilino?: string | null
  status?: string | null
  data_fim?: string | null
  expand?: {
    imovel?: { nome?: string | null; endereco?: string | null }
    unidade_id?: { identificador?: string | null }
  }
}

export interface SituacaoDoInquilino {
  temContrato: boolean
  rotulo: string
  tom: TomSituacao
  /** "Sala 101 · Edifício Aguiar"; "Sem unidade" quando não há contrato ativo. */
  unidade: string
}

const SEM_CONTRATO: SituacaoDoInquilino = {
  temContrato: false,
  rotulo: 'Sem contrato',
  tom: 'neutral',
  unidade: 'Sem unidade',
}

const PESO_DO_TOM: Record<TomSituacao, number> = { danger: 0, warn: 1, ok: 2, neutral: 3 }

function unidadeDoContrato(c: ContratoParaInquilino): string {
  const imovel = c.expand?.imovel?.nome || c.expand?.imovel?.endereco || ''
  const unidade = c.expand?.unidade_id?.identificador
  return [unidade, imovel].filter(Boolean).join(' · ') || 'Unidade não informada'
}

/**
 * Situação do inquilino a partir dos contratos dele. Só contratos ativos contam
 * ("Sem contrato" inclui quem só tem contrato encerrado ou cancelado). Com mais
 * de um contrato ativo, a pílula mostra o que pede mais atenção (vencido, depois
 * vencendo) e a unidade ganha " +N" para as demais.
 */
export function situacaoDoInquilino(
  contratos: ContratoParaInquilino[],
  hoje?: string,
): SituacaoDoInquilino {
  const ativos = contratos
    .filter((c) => c.status === 'ativo')
    .map((c) => ({ c, sit: situacaoDoContrato(c, hoje) }))
    .sort((a, b) => PESO_DO_TOM[a.sit.tom] - PESO_DO_TOM[b.sit.tom])
  if (ativos.length === 0) return SEM_CONTRATO
  const [primeiro, ...demais] = ativos
  return {
    temContrato: true,
    rotulo: primeiro.sit.rotulo,
    tom: primeiro.sit.tom,
    unidade: unidadeDoContrato(primeiro.c) + (demais.length ? ` +${demais.length}` : ''),
  }
}

/** Agrupa os contratos pelo id do inquilino. */
export function contratosPorInquilino<T extends ContratoParaInquilino>(
  contratos: T[],
): Map<string, T[]> {
  const mapa = new Map<string, T[]>()
  for (const c of contratos) {
    if (!c.inquilino) continue
    const lista = mapa.get(c.inquilino) ?? []
    lista.push(c)
    mapa.set(c.inquilino, lista)
  }
  return mapa
}
