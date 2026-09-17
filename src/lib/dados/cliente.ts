import { supabase } from './supabase'
import { ARQUIVOS, RELACOES, chaveEstrangeira } from './esquema'
import { enviarArquivo } from './arquivos'

/**
 * Camada de dados da aplicação.
 *
 * Fala com o Supabase e devolve o registro no formato que as telas já
 * conhecem: relação embutida em `expand`, coluna de relação com o id, data em
 * `created`/`updated`. Assim a troca de banco não obrigou a reescrever as 23
 * telas — só o caminho por onde o dado entra.
 */

export type Operador = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contem' | 'em'

/** Um filtro é uma tripla coluna/operador/valor — nunca um texto concatenado. */
export type Filtro = [coluna: string, operador: Operador, valor: unknown]

export interface OpcoesDeLista {
  /** Ordenação no formato do PocketBase: 'nome' ou '-created', separados por vírgula. */
  sort?: string
  /** Relações a trazer junto, separadas por vírgula. Aceita um nível aninhado: 'importacao.conta_bancaria'. */
  expand?: string
  /** Filtros combinados com E. */
  where?: Filtro[]
  /** Alternativa em OU, na sintaxe do PostgREST. Usada só onde a busca é textual. */
  ou?: string
  /** Colunas a trazer, separadas por vírgula. Sem isso vem a linha inteira. */
  fields?: string
}

export interface Registro {
  id: string
  // As telas leem colunas que variam de tabela para tabela; tipar cada uma aqui
  // duplicaria o esquema do banco em TypeScript sem ninguém para mantê-lo.
  [chave: string]: any
  expand?: Record<string, any>
}

export interface Pagina<T> {
  items: T[]
  page: number
  perPage: number
  totalItems: number
  totalPages: number
}

const PREFIXO = 'exp__'

/**
 * Monta o `select` do PostgREST a partir do `expand`.
 *
 * A relação embutida ganha um apelido com prefixo para não encobrir a coluna
 * do id: sem isso, `imovel` viria como objeto e a tela perderia o id que usa
 * para editar.
 */
function montarSelect(tabela: string, expand?: string, fields?: string): string {
  if (!expand) return fields || '*'

  const partes = expand
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  const embutidos = partes.map((caminho) => {
    const [campo, subcampo] = caminho.split('.')
    const alvo = RELACOES[tabela]?.[campo]
    if (!alvo) return ''

    const fk = chaveEstrangeira(tabela, campo)

    if (!subcampo) return `${PREFIXO}${campo}:${alvo}!${fk}(*)`

    const subAlvo = RELACOES[alvo]?.[subcampo]
    if (!subAlvo) return `${PREFIXO}${campo}:${alvo}!${fk}(*)`

    const subFk = chaveEstrangeira(alvo, subcampo)
    return `${PREFIXO}${campo}:${alvo}!${fk}(*, ${PREFIXO}${subcampo}:${subAlvo}!${subFk}(*))`
  })

  return ['*', ...embutidos.filter(Boolean)].join(', ')
}

/** Devolve o registro ao formato do PocketBase: relações sob `expand`. */
function normalizar<T>(linha: Record<string, unknown> | null): T {
  if (!linha) return linha as T

  const registro: Record<string, unknown> = {}
  const expand: Record<string, unknown> = {}

  for (const [chave, valor] of Object.entries(linha)) {
    if (!chave.startsWith(PREFIXO)) {
      registro[chave] = valor
      continue
    }
    const campo = chave.slice(PREFIXO.length)
    expand[campo] =
      valor && typeof valor === 'object' ? normalizar(valor as Record<string, unknown>) : valor
  }

  if (Object.keys(expand).length > 0) registro.expand = expand
  return registro as T
}

/** O construtor de consulta do PostgREST, sem depender do tipo interno do pacote. */
type Consulta = ReturnType<ReturnType<typeof supabase.from>['select']>

function aplicarFiltros(consulta: Consulta, opcoes: OpcoesDeLista): Consulta {
  let q = consulta

  for (const [coluna, operador, valor] of opcoes.where ?? []) {
    switch (operador) {
      case '=':
        q = valor === null ? q.is(coluna, null) : q.eq(coluna, valor as never)
        break
      case '!=':
        q = valor === null ? q.not(coluna, 'is', null) : q.neq(coluna, valor as never)
        break
      case '>':
        q = q.gt(coluna, valor as never)
        break
      case '>=':
        q = q.gte(coluna, valor as never)
        break
      case '<':
        q = q.lt(coluna, valor as never)
        break
      case '<=':
        q = q.lte(coluna, valor as never)
        break
      case 'contem':
        q = q.ilike(coluna, `%${String(valor)}%`)
        break
      case 'em':
        q = q.in(coluna, valor as never[])
        break
    }
  }

  if (opcoes.ou) q = q.or(opcoes.ou)

  return q
}

function aplicarOrdem(consulta: Consulta, sort?: string): Consulta {
  if (!sort) return consulta
  let q = consulta
  for (const campo of sort
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)) {
    const decrescente = campo.startsWith('-')
    q = q.order(decrescente ? campo.slice(1) : campo, {
      ascending: !decrescente,
      nullsFirst: false,
    })
  }
  return q
}

function erro(contexto: string, e: { message: string } | null): void {
  if (e) throw new Error(`${contexto}: ${e.message}`)
}

/**
 * Prepara o corpo da escrita.
 *
 * Quando a tela manda um FormData é porque há arquivo junto. O arquivo sobe
 * para o bucket e o que fica gravado na coluna é o caminho — o mesmo desenho
 * do PocketBase, que guardava o nome do arquivo.
 */
async function prepararDados(
  tabela: string,
  dados: Record<string, unknown> | FormData,
): Promise<Record<string, unknown>> {
  if (!(dados instanceof FormData)) return dados

  const campos = ARQUIVOS[tabela] ?? {}
  const saida: Record<string, unknown> = {}
  const multiplos: Record<string, unknown[]> = {}

  for (const [chave, valor] of dados.entries()) {
    const config = campos[chave]

    if (config?.varios) {
      const lista = (multiplos[chave] ??= [])
      // Texto aqui é caminho de arquivo que já está no bucket: a tela reenvia
      // a lista inteira para dizer quais ficam.
      lista.push(valor instanceof File ? await enviarArquivo(config.bucket, valor) : valor)
      continue
    }

    if (valor instanceof File) {
      if (!config) continue
      saida[chave] = await enviarArquivo(config.bucket, valor)
      continue
    }

    saida[chave] = valor
  }

  return { ...saida, ...multiplos }
}

function colecao<T extends Registro = Registro>(tabela: string) {
  return {
    async getFullList<R = T>(opcoes: OpcoesDeLista = {}): Promise<R[]> {
      const consulta = supabase
        .from(tabela)
        .select(montarSelect(tabela, opcoes.expand, opcoes.fields))
      const { data, error } = await aplicarOrdem(
        aplicarFiltros(consulta as Consulta, opcoes),
        opcoes.sort,
      )
      erro(`Falha ao listar ${tabela}`, error)
      return (data ?? []).map((linha) => normalizar<R>(linha as unknown as Record<string, unknown>))
    },

    async getList<R = T>(
      pagina = 1,
      porPagina = 30,
      opcoes: OpcoesDeLista = {},
    ): Promise<Pagina<R>> {
      const consulta = supabase
        .from(tabela)
        .select(montarSelect(tabela, opcoes.expand, opcoes.fields), { count: 'exact' })
      const inicio = (pagina - 1) * porPagina
      const { data, error, count } = await aplicarOrdem(
        aplicarFiltros(consulta as Consulta, opcoes),
        opcoes.sort,
      ).range(inicio, inicio + porPagina - 1)
      erro(`Falha ao listar ${tabela}`, error)

      const total = count ?? 0
      return {
        items: (data ?? []).map((linha) =>
          normalizar<R>(linha as unknown as Record<string, unknown>),
        ),
        page: pagina,
        perPage: porPagina,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / porPagina)),
      }
    },

    async getOne<R = T>(id: string, opcoes: OpcoesDeLista = {}): Promise<R> {
      const { data, error } = await supabase
        .from(tabela)
        .select(montarSelect(tabela, opcoes.expand, opcoes.fields))
        .eq('id', id)
        .single()
      erro(`Falha ao carregar ${tabela}`, error)
      return normalizar<R>(data as unknown as Record<string, unknown>)
    },

    async create<R = T>(dados: Record<string, unknown> | FormData): Promise<R> {
      const corpo = await prepararDados(tabela, dados)
      const { data, error } = await supabase.from(tabela).insert(corpo).select().single()
      erro(`Falha ao criar em ${tabela}`, error)
      return normalizar<R>(data as unknown as Record<string, unknown>)
    },

    async update<R = T>(id: string, dados: Record<string, unknown> | FormData): Promise<R> {
      const corpo = await prepararDados(tabela, dados)
      const { data, error } = await supabase
        .from(tabela)
        .update(corpo)
        .eq('id', id)
        .select()
        .single()
      erro(`Falha ao salvar em ${tabela}`, error)
      return normalizar<R>(data as unknown as Record<string, unknown>)
    },

    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from(tabela).delete().eq('id', id)
      erro(`Falha ao excluir de ${tabela}`, error)
      return true
    },
  }
}

export default { colecao }
export { colecao, supabase }
