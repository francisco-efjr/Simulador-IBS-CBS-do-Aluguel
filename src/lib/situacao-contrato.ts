/**
 * Situação de um contrato para os filtros e pílulas da tela de Contratos
 * (tela 04 do handoff): Vigente, Vence em N dias, Venceu há N dias, Encerrado
 * ou Cancelado. Função pura; "hoje" entra como parâmetro.
 */
import { hojeLocalISO } from '@/lib/indicadores-financeiros'

export type FiltroSituacao = 'todos' | 'vigentes' | 'vencendo' | 'encerrados'
export type TomSituacao = 'ok' | 'warn' | 'neutral' | 'danger'

export interface SituacaoContrato {
  grupo: Exclude<FiltroSituacao, 'todos'>
  rotulo: string
  tom: TomSituacao
}

/** Janela de aviso antes do fim do contrato, a mesma dos alertas. */
export const DIAS_DE_AVISO = 30

export function situacaoDoContrato(
  contrato: { status?: string | null; data_fim?: string | null },
  hoje: string = hojeLocalISO(),
): SituacaoContrato {
  if (contrato.status === 'cancelado')
    return { grupo: 'encerrados', rotulo: 'Cancelado', tom: 'danger' }
  if (contrato.status !== 'ativo')
    return { grupo: 'encerrados', rotulo: 'Encerrado', tom: 'neutral' }
  if (!contrato.data_fim) return { grupo: 'vigentes', rotulo: 'Vigente', tom: 'ok' }
  const dias = Math.round(
    (Date.parse(`${contrato.data_fim.slice(0, 10)}T00:00:00`) - Date.parse(`${hoje}T00:00:00`)) /
      86_400_000,
  )
  if (dias < 0)
    return {
      grupo: 'vencendo',
      rotulo: `Venceu há ${-dias} ${dias === -1 ? 'dia' : 'dias'}`,
      tom: 'danger',
    }
  if (dias === 0) return { grupo: 'vencendo', rotulo: 'Vence hoje', tom: 'warn' }
  if (dias <= DIAS_DE_AVISO)
    return {
      grupo: 'vencendo',
      rotulo: `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
      tom: 'warn',
    }
  return { grupo: 'vigentes', rotulo: 'Vigente', tom: 'ok' }
}

export const FILTROS_DE_SITUACAO: { valor: FiltroSituacao; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'vigentes', rotulo: 'Vigentes' },
  { valor: 'vencendo', rotulo: 'Vencendo' },
  { valor: 'encerrados', rotulo: 'Encerrados' },
]

export const ehFiltroSituacao = (v: string | null): v is FiltroSituacao =>
  FILTROS_DE_SITUACAO.some((f) => f.valor === v)
