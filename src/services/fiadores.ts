import { type OpcoesDeLista, colecao } from '@/lib/dados/cliente'
import { limparDocumento } from '@/lib/validacao/documentos'

export interface Fiador {
  id: string
  nome: string
  cpf?: string | null
  rg?: string | null
  estado_civil?: string | null
  conjuge_nome?: string | null
  conjuge_cpf?: string | null
  email?: string | null
  telefone?: string | null
  endereco_completo?: string | null
  created_by?: string | null
  updated_by?: string | null
  created?: string
  updated?: string
  expand?: Record<string, unknown>
}

export type DadosFiador = Partial<Omit<Fiador, 'id' | 'created' | 'updated'>>

/** Lista todos os fiadores ordenados por nome. */
export const getFiadores = (opcoes?: OpcoesDeLista) =>
  colecao('fiadores').getFullList<Fiador>({
    sort: 'nome',
    ...opcoes,
  })

/** Busca um fiador pelo identificador único. */
export const getFiadorById = (id: string) => colecao('fiadores').getOne<Fiador>(id)

/** Alias de getFiadorById para compatibilidade. */
export const getFiador = getFiadorById

/** Busca fiador pelo CPF (aceita documento com ou sem pontuação). */
export const getFiadorByCpf = async (cpf: string): Promise<Fiador | null> => {
  const limpo = limparDocumento(cpf)
  if (!limpo) return null

  // Tenta encontrar pelo formato limpo ou original
  const lista = await colecao('fiadores').getFullList<Fiador>({
    where: [['cpf', '=', cpf]],
  })

  if (lista.length > 0) return lista[0]

  // Se não achou e o cpf passado tinha máscara ou não, busca todos e compara normalizado
  const todos = await colecao('fiadores').getFullList<Fiador>()
  return todos.find((f) => f.cpf && limparDocumento(f.cpf) === limpo) ?? null
}

/** Cadastra um novo fiador com dados civis e outorga conjugal. */
export const createFiador = (data: DadosFiador | FormData | Record<string, unknown>) =>
  colecao('fiadores').create<Fiador>(data)

/** Atualiza dados do fiador cadastrado. */
export const updateFiador = (
  id: string,
  data: DadosFiador | FormData | Record<string, unknown>,
) => colecao('fiadores').update<Fiador>(id, data)

/** Remove fiador se não estiver vinculado a contratos ativos. */
export const deleteFiador = (id: string) => colecao('fiadores').delete(id)
