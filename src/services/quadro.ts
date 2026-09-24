import { supabase } from '@/lib/dados/supabase'

/**
 * Quadro de histórias: as histórias de usuário do sistema, com critérios de
 * aceitação em BDD e atividades, em cinco colunas.
 *
 * Mora nas tabelas `historias` e `historias_atividades`
 * (supabase/migrations/20260923120002_quadro_de_historias.sql). Quem vê e quem
 * edita segue o módulo de permissão "quadro"; a regra de homologação vive no
 * banco e está espelhada em `destinosPermitidos()` só para a tela não oferecer
 * o que o banco vai recusar.
 */

export type ColunaDoQuadro = 'backlog' | 'desenvolvimento' | 'teste' | 'homologacao' | 'concluido'

export const COLUNAS_DO_QUADRO: ColunaDoQuadro[] = [
  'backlog',
  'desenvolvimento',
  'teste',
  'homologacao',
  'concluido',
]

export interface AtividadeDaHistoria {
  id: string
  historia: string
  titulo: string
  concluida: boolean
  ordem: number
}

export interface HistoriaDoQuadro {
  id: string
  numero: number
  titulo: string
  tag: string | null
  eu: string
  quero: string
  para: string
  criterios: string
  observacoes: string
  coluna: ColunaDoQuadro
  /** Última gravação da história; ordena a coluna Concluído. */
  updated: string
  atividades: AtividadeDaHistoria[]
}

export type DadosDaHistoria = Pick<
  HistoriaDoQuadro,
  'titulo' | 'tag' | 'eu' | 'quero' | 'para' | 'criterios' | 'observacoes' | 'coluna'
>

export const HISTORIA_EM_BRANCO: DadosDaHistoria = {
  titulo: '',
  tag: null,
  eu: '',
  quero: '',
  para: '',
  criterios: '',
  observacoes: '',
  coluna: 'backlog',
}

/** "H-07": o número da história com dois dígitos, como na documentação. */
export function codigoDaHistoria(numero: number): string {
  return `H-${String(numero).padStart(2, '0')}`
}

export function contagemDeAtividades(atividades: AtividadeDaHistoria[]): {
  feitas: number
  total: number
} {
  return { feitas: atividades.filter((a) => a.concluida).length, total: atividades.length }
}

/**
 * Para onde uma pessoa logada pode levar a história que está em `de`. Espelha
 * a regra RN-QDR-02 do banco: Concluído só a partir de Homologação.
 */
export function destinosPermitidos(de: ColunaDoQuadro): ColunaDoQuadro[] {
  return COLUNAS_DO_QUADRO.filter(
    (coluna) => coluna !== de && (coluna !== 'concluido' || de === 'homologacao'),
  )
}

/** Quantos cartões a coluna Concluído mostra antes do "Mostrar mais". */
export const LIMITE_DE_CONCLUIDAS = 15

/**
 * As histórias de uma coluna, na ordem do quadro: pelo número, e em Concluído
 * as mais recentes primeiro — é a coluna que só cresce, e o que importa nela é
 * o que acabou de ser aceito.
 */
export function historiasDaColuna(
  historias: HistoriaDoQuadro[],
  coluna: ColunaDoQuadro,
): HistoriaDoQuadro[] {
  const daColuna = historias.filter((h) => h.coluna === coluna)
  if (coluna !== 'concluido') return daColuna.sort((a, b) => a.numero - b.numero)
  return daColuna.sort(
    (a, b) => b.updated.localeCompare(a.updated) || b.numero - a.numero,
  )
}

/** As etiquetas em uso, sem repetir, em ordem alfabética. */
export function etiquetasDoQuadro(historias: Pick<HistoriaDoQuadro, 'tag'>[]): string[] {
  const etiquetas = new Set<string>()
  for (const { tag } of historias) if (tag?.trim()) etiquetas.add(tag.trim())
  return [...etiquetas].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

const COLUNAS_DA_HISTORIA =
  'id, numero, titulo, tag, eu, quero, para, criterios, observacoes, coluna, updated, atividades:historias_atividades(id, historia, titulo, concluida, ordem)'

function falhou(contexto: string, erro: { message: string } | null): asserts erro is null {
  if (erro) throw new Error(`${contexto}: ${erro.message}`)
}

function normalizar(linha: HistoriaDoQuadro): HistoriaDoQuadro {
  return {
    ...linha,
    atividades: [...(linha.atividades ?? [])].sort((a, b) => a.ordem - b.ordem),
  }
}

function limpar(dados: Partial<DadosDaHistoria>): Partial<DadosDaHistoria> {
  const limpos: Partial<DadosDaHistoria> = { ...dados }
  if (typeof limpos.titulo === 'string') limpos.titulo = limpos.titulo.trim()
  if ('tag' in limpos) limpos.tag = limpos.tag?.trim() || null
  return limpos
}

export async function listarHistorias(): Promise<HistoriaDoQuadro[]> {
  const { data, error } = await supabase
    .from('historias')
    .select(COLUNAS_DA_HISTORIA)
    .order('numero', { ascending: true })
  falhou('Falha ao carregar o quadro', error)
  return ((data ?? []) as unknown as HistoriaDoQuadro[]).map(normalizar)
}

export async function criarHistoria(dados: DadosDaHistoria): Promise<HistoriaDoQuadro> {
  const { data, error } = await supabase
    .from('historias')
    .insert(limpar(dados))
    .select(COLUNAS_DA_HISTORIA)
    .single()
  falhou('Falha ao criar a história', error)
  return normalizar(data as unknown as HistoriaDoQuadro)
}

export async function atualizarHistoria(id: string, dados: Partial<DadosDaHistoria>): Promise<void> {
  const { error } = await supabase.from('historias').update(limpar(dados)).eq('id', id)
  falhou('Falha ao salvar a história', error)
}

export async function moverHistoria(id: string, coluna: ColunaDoQuadro): Promise<void> {
  await atualizarHistoria(id, { coluna })
}

export async function criarAtividade(
  historia: string,
  titulo: string,
  ordem: number,
): Promise<AtividadeDaHistoria> {
  const { data, error } = await supabase
    .from('historias_atividades')
    .insert({ historia, titulo: titulo.trim(), ordem })
    .select('id, historia, titulo, concluida, ordem')
    .single()
  falhou('Falha ao incluir a atividade', error)
  return data as AtividadeDaHistoria
}

export async function atualizarAtividade(
  id: string,
  dados: Partial<Pick<AtividadeDaHistoria, 'titulo' | 'concluida'>>,
): Promise<void> {
  const limpos = typeof dados.titulo === 'string' ? { ...dados, titulo: dados.titulo.trim() } : dados
  const { error } = await supabase.from('historias_atividades').update(limpos).eq('id', id)
  falhou('Falha ao salvar a atividade', error)
}

export async function excluirAtividade(id: string): Promise<void> {
  const { error } = await supabase.from('historias_atividades').delete().eq('id', id)
  falhou('Falha ao excluir a atividade', error)
}
