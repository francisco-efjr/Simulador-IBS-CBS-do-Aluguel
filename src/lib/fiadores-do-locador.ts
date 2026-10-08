/**
 * Fiadores de cada locador para a tela "Locadores e fiadores" (seção 13 do
 * handoff Fase 2).
 *
 * No banco o fiador não pertence ao locador: ele garante um contrato, e o
 * contrato tem um locador (`contratos.locador_id`, `contratos.fiador_id`). Então
 * "os fiadores de um locador" são os fiadores dos contratos ativos dele, cada um
 * com o contrato que explica o vínculo (de quem é fiador, em qual unidade, e o
 * número do contrato). Funções puras.
 */

export interface ContratoParaLocador {
  id: string
  numero?: string | null
  status?: string | null
  locador_id?: string | null
  fiador_id?: string | null
  imovel?: string | null
  expand?: {
    inquilino?: { nome?: string | null }
    imovel?: { nome?: string | null; endereco?: string | null }
    unidade_id?: { identificador?: string | null }
    fiador_id?: { id?: string; nome?: string | null; cpf?: string | null }
  }
}

export interface FiadorDoLocador {
  /** Um mesmo fiador pode garantir mais de um contrato: a chave é do par. */
  chave: string
  fiadorId: string
  nome: string
  cpf: string | null
  /** "Fiador de Padaria Pão Quente · Sala 01 · Edifício Aguiar Centro". */
  vinculo: string
  /** Número do contrato (ex.: "003/2026"); vazio quando o contrato não tem número. */
  codigo: string
}

export interface ResumoDoLocador {
  /** Imóveis distintos com contrato ativo deste locador. */
  imoveis: number
  fiadores: FiadorDoLocador[]
}

const VAZIO: ResumoDoLocador = { imoveis: 0, fiadores: [] }

function unidadeDoContrato(c: ContratoParaLocador): string {
  const imovel = c.expand?.imovel?.nome || c.expand?.imovel?.endereco || ''
  const unidade = c.expand?.unidade_id?.identificador
  return [unidade, imovel].filter(Boolean).join(' · ')
}

/** Resume, por id de locador, os imóveis e os fiadores dos contratos ativos. */
export function resumoPorLocador(contratos: ContratoParaLocador[]): Map<string, ResumoDoLocador> {
  const imoveisPorLocador = new Map<string, Set<string>>()
  const resumos = new Map<string, ResumoDoLocador>()

  for (const c of contratos) {
    if (c.status !== 'ativo' || !c.locador_id) continue
    const resumo = resumos.get(c.locador_id) ?? { imoveis: 0, fiadores: [] }
    resumos.set(c.locador_id, resumo)

    if (c.imovel) {
      const imoveis = imoveisPorLocador.get(c.locador_id) ?? new Set<string>()
      imoveis.add(c.imovel)
      imoveisPorLocador.set(c.locador_id, imoveis)
      resumo.imoveis = imoveis.size
    }

    const fiador = c.expand?.fiador_id
    if (c.fiador_id && fiador) {
      const inquilino = c.expand?.inquilino?.nome
      const unidade = unidadeDoContrato(c)
      resumo.fiadores.push({
        chave: `${c.fiador_id}:${c.id}`,
        fiadorId: c.fiador_id,
        nome: fiador.nome || 'Fiador sem nome',
        cpf: fiador.cpf || null,
        vinculo:
          [inquilino ? `Fiador de ${inquilino}` : 'Fiador', unidade].filter(Boolean).join(' · ') ||
          'Fiador',
        codigo: c.numero || '',
      })
    }
  }

  for (const resumo of resumos.values()) {
    resumo.fiadores.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }
  return resumos
}

export const resumoDoLocador = (
  resumos: Map<string, ResumoDoLocador>,
  locadorId: string,
): ResumoDoLocador => resumos.get(locadorId) ?? VAZIO

/** Quantos fiadores distintos aparecem nos locadores informados. */
export function totalDeFiadores(
  resumos: Map<string, ResumoDoLocador>,
  locadorIds: Iterable<string>,
): number {
  const ids = new Set<string>()
  for (const id of locadorIds) {
    for (const f of resumos.get(id)?.fiadores ?? []) ids.add(f.fiadorId)
  }
  return ids.size
}
