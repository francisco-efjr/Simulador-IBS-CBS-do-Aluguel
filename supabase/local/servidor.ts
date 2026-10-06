/**
 * Supabase local para testar as telas logadas sem tocar em produção.
 *
 * Um servidor HTTP que fala o subconjunto do protocolo Supabase que a aplicação
 * usa (Auth, PostgREST, RPC e Storage) sobre o PGlite do harness dos testes de
 * banco: as migrações são as reais e a RLS vale, porque cada requisição roda
 * numa transação sob `set local role anon|authenticated` com os claims do JWT.
 *
 * Fora do escopo: tempo real (o WebSocket é recusado), RLS do storage e envio de
 * e-mail. Ver supabase/local/README.md.
 *
 *   node supabase/local/servidor.ts          (PORT muda a porta; padrão 54321)
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { criarBancoDeTeste, type BancoDeTeste } from '../tests/harness.ts'
import {
  assinar,
  verificar,
  guardarSenha,
  conferirSenha,
  senhaDaConta,
  CHAVE_ANONIMA,
} from './chaves.ts'
import { CONTAS, semear } from './semente.ts'

const PORTA = Number(process.env.PORT ?? 54321)
const ARQUIVO_DE_CONTAS = join(import.meta.dirname, '.contas-locais.json')

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

interface Fk {
  nome: string
  tabela: string
  coluna: string
  ref_tabela: string
  ref_coluna: string
}
interface Papel {
  role: 'anon' | 'authenticated'
  claims: Record<string, any>
}

let banco: BancoDeTeste
let tabelas = new Set<string>()
let fks: Fk[] = []
let buckets = new Set<string>()
const arquivos = new Map<string, { dados: Buffer; tipo: string }>()
const emails: { para: string; link: string; quando: string }[] = []

/** O PGlite tem uma conexão só: toda ida ao banco entra nesta fila. */
let fila: Promise<unknown> = Promise.resolve()
function serializar<T>(tarefa: () => Promise<T>): Promise<T> {
  const resultado = fila.then(tarefa)
  fila = resultado.catch(() => {})
  return resultado
}

/** Erro que vira resposta HTTP no formato do PostgREST. */
class ErroHttp extends Error {
  status: number
  corpo: unknown
  constructor(status: number, corpo: unknown) {
    super(String((corpo as { message?: string })?.message ?? status))
    this.status = status
    this.corpo = corpo
  }
}
const pgrst = (
  status: number,
  code: string,
  message: string,
  details: string | null = null,
  hint: string | null = null,
) => new ErroHttp(status, { code, message, details, hint })

/** Sobe o banco, aplica a semente, grava as contas e lê o catálogo (tabelas, FKs, buckets). */
async function iniciar() {
  banco = await criarBancoDeTeste()
  // A senha mora em auth.users, como no Supabase. O stub do harness não tem a coluna.
  await banco.db.exec(`alter table auth.users add column encrypted_password text`)
  const ids = await semear(banco)

  const contas = []
  for (const conta of CONTAS) {
    const senha = senhaDaConta(conta.email)
    await banco.db.query(`update auth.users set encrypted_password = $2 where id = $1`, [
      ids[conta.email],
      guardarSenha(senha),
    ])
    contas.push({ email: conta.email, senha, perfil: conta.perfil, ativo: conta.ativo })
  }
  // Fora do git (ver .gitignore): quem for testar lê as senhas daqui.
  writeFileSync(
    ARQUIVO_DE_CONTAS,
    JSON.stringify({ contas, convite_pendente: 'convite-local-0001' }, null, 2),
    { mode: 0o600 },
  )

  tabelas = new Set(
    (
      await banco.db.query<{ nome: string }>(
        `select c.relname as nome from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p')`,
      )
    ).rows.map((r) => r.nome),
  )
  fks = (
    await banco.db.query<Fk>(
      `select k.conname as nome, k.conrelid::regclass::text as tabela, a.attname as coluna,
            k.confrelid::regclass::text as ref_tabela, b.attname as ref_coluna
       from pg_constraint k
       join pg_attribute a on a.attrelid = k.conrelid and a.attnum = k.conkey[1]
       join pg_attribute b on b.attrelid = k.confrelid and b.attnum = k.confkey[1]
      where k.contype = 'f' and cardinality(k.conkey) = 1
        and k.connamespace = 'public'::regnamespace and k.confrelid::regclass::text !~ '\\.'`,
    )
  ).rows
  buckets = new Set(
    (await banco.db.query<{ id: string }>(`select id from storage.buckets`)).rows.map((r) => r.id),
  )
  arquivos.clear()
  emails.length = 0
}

// ---------------------------------------------------------------------------
// Banco: uma transação por requisição, sob o papel de quem chamou
// ---------------------------------------------------------------------------

interface Saida {
  status: number
  corpo?: string
  cabecalhos?: Record<string, string>
  desfazer?: boolean
}

async function comoPapel(
  papel: Papel,
  fn: (db: BancoDeTeste['db']) => Promise<Saida>,
): Promise<Saida> {
  return serializar(async () => {
    const { db } = banco
    await db.exec('begin')
    try {
      await db.exec(`set local role ${papel.role}`)
      await db.query(
        `select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true),
                set_config('request.jwt.claim.role', $3, true)`,
        [JSON.stringify(papel.claims), papel.claims.sub ?? '', papel.role],
      )
      const saida = await fn(db)
      await db.exec(saida.desfazer ? 'rollback' : 'commit')
      return saida
    } catch (erro) {
      await db.exec('rollback').catch(() => {})
      throw erro
    }
  })
}

/** Traduz o erro do Postgres para o status e o corpo que o PostgREST devolveria. */
function traduzir(erro: any, papel?: Papel): ErroHttp {
  if (erro instanceof ErroHttp) return erro
  const code: string = erro?.code ?? ''
  const corpo = {
    code,
    message: erro?.message ?? String(erro),
    details: erro?.detail ?? null,
    hint: erro?.hint ?? null,
  }
  let status = 400
  if (code === '42501') status = papel?.role === 'anon' ? 401 : 403
  else if (['23505', '23503', '23P01'].includes(code)) status = 409
  else if (['42P01', '42883'].includes(code)) status = 404
  else if (!code || code.startsWith('XX')) status = 500
  return new ErroHttp(status, corpo)
}

// ---------------------------------------------------------------------------
// PostgREST: identificadores, select, filtros, ordem
// ---------------------------------------------------------------------------

const IDENTIFICADOR = /^[a-z_][a-z0-9_]*$/
const ALIAS = /^[A-Za-z_][A-Za-z0-9_]*$/

/** Identificador entre aspas — nunca texto da requisição direto no SQL. */
function id(nome: string, regra = IDENTIFICADOR): string {
  if (!regra.test(nome)) throw pgrst(400, 'PGRST100', `Identificador inválido: "${nome}"`)
  return `"${nome}"`
}

/** Valores sempre viajam como parâmetros ($1…); o contador de alias dos embeds também mora aqui. */
interface Consulta {
  params: unknown[]
  n: number
}
const parametro = (q: Consulta, valor: unknown) => (q.params.push(valor), `$${q.params.length}`)

/** Divide em vírgulas de primeiro nível, respeitando parênteses e aspas. */
function dividir(texto: string): string[] {
  const partes: string[] = []
  let profundidade = 0,
    aspas = false,
    atual = ''
  for (const c of texto) {
    if (c === '"') aspas = !aspas
    if (!aspas && c === '(') profundidade++
    if (!aspas && c === ')') profundidade--
    if (!aspas && profundidade === 0 && c === ',') (partes.push(atual), (atual = ''))
    else atual += c
  }
  partes.push(atual)
  return partes.filter((p) => p !== '')
}

type Item =
  | { tipo: 'estrela' }
  | { tipo: 'coluna'; nome: string; alias?: string }
  | { tipo: 'embed'; alias?: string; tabela: string; dicas: string[]; filhos: Item[] }

function lerSelect(texto: string): Item[] {
  return dividir(texto).map((parte): Item => {
    if (parte === '*') return { tipo: 'estrela' }
    const embed = parte.match(/^(?:(\w+):)?(\w+)((?:![\w]+)*)\((.*)\)$/s)
    if (embed)
      return {
        tipo: 'embed',
        alias: embed[1],
        tabela: embed[2],
        dicas: embed[3].split('!').filter(Boolean),
        filhos: lerSelect(embed[4]),
      }
    const coluna = parte.match(/^(?:(\w+):)?(\w+)$/)
    if (coluna) return { tipo: 'coluna', nome: coluna[2], alias: coluna[1] }
    throw pgrst(400, 'PGRST100', `Não entendi o parâmetro select: "${parte}"`)
  })
}

/** Acha a chave estrangeira entre as duas tabelas, no catálogo, como o PostgREST faz. */
function relacao(pai: string, alvo: string, dicas: string[]) {
  const dica = dicas.filter((d) => d !== 'inner' && d !== 'left')[0]
  const candidatas = fks
    .filter((f) => !dica || f.nome === dica || f.coluna === dica)
    .flatMap((f) => [
      ...(f.tabela === pai && f.ref_tabela === alvo
        ? [{ muitos: false, pai: f.coluna, alvo: f.ref_coluna }]
        : []),
      ...(f.tabela === alvo && f.ref_tabela === pai
        ? [{ muitos: true, pai: f.ref_coluna, alvo: f.coluna }]
        : []),
    ])
  if (candidatas.length === 1) return candidatas[0]
  if (candidatas.length > 1)
    throw pgrst(
      300,
      'PGRST201',
      `Mais de uma relação entre '${pai}' e '${alvo}'`,
      null,
      'Informe a chave estrangeira: tabela!<nome_da_fk>(...)',
    )
  throw pgrst(
    400,
    'PGRST200',
    `Could not find a relationship between '${pai}' and '${alvo}' in the schema cache`,
    `Searched for a foreign key relationship between '${pai}' and '${alvo}'${dica ? ` using the hint '${dica}'` : ''} in the schema 'public', but no matches were found.`,
  )
}

/** Lista de colunas do SELECT; cada embed vira um sub-select (a RLS vale nele também). */
function colunas(q: Consulta, tabela: string, itens: Item[], a: string): string {
  return itens
    .map((item) => {
      if (item.tipo === 'estrela') return `${a}.*`
      if (item.tipo === 'coluna')
        return `${a}.${id(item.nome)}${item.alias ? ` as ${id(item.alias, ALIAS)}` : ''}`
      if (!tabelas.has(item.tabela))
        throw pgrst(
          400,
          'PGRST200',
          `Could not find a relationship between '${tabela}' and '${item.tabela}' in the schema cache`,
        )
      const r = relacao(tabela, item.tabela, item.dicas)
      const e = `e${++q.n}`,
        x = `x${q.n}`
      const interior = `select ${colunas(q, item.tabela, item.filhos, e)} from public.${id(item.tabela)} ${e} where ${e}.${id(r.alvo)} = ${a}.${id(r.pai)}`
      const apelido = id(item.alias ?? item.tabela, ALIAS)
      return r.muitos
        ? `(select coalesce(json_agg(${x}), '[]'::json) from (${interior}) ${x}) as ${apelido}`
        : `(select to_json(${x}) from (${interior}) ${x}) as ${apelido}`
    })
    .join(', ')
}

const OPERADORES: Record<string, string> = {
  eq: '=',
  neq: '<>',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'like',
  ilike: 'ilike',
  cs: '@>',
  cd: '<@',
  ov: '&&',
  isdistinct: 'is distinct from',
  match: '~',
  imatch: '~*',
}

const semAspas = (v: string) =>
  v.startsWith('"') && v.endsWith('"') && v.length > 1 ? v.slice(1, -1).replace(/\\"/g, '"') : v

/** `[not.]operador.valor` sobre uma coluna. */
function condicao(q: Consulta, coluna: string, resto: string): string {
  const negar = resto.startsWith('not.')
  if (negar) resto = resto.slice(4)
  const ponto = resto.indexOf('.')
  const operador = resto.slice(0, ponto)
  const valor = resto.slice(ponto + 1)
  const alvo = `t.${id(coluna)}`
  let sql: string
  if (ponto < 0) throw pgrst(400, 'PGRST100', `Filtro inválido em "${coluna}": ${resto}`)
  if (operador === 'is') {
    if (!['null', 'true', 'false', 'unknown'].includes(valor))
      throw pgrst(400, 'PGRST100', `Valor inválido para is: ${valor}`)
    sql = `${alvo} is ${valor}`
  } else if (operador === 'in') {
    const itens = dividir(valor.replace(/^\(/, '').replace(/\)$/, '')).map(semAspas)
    sql = itens.length ? `${alvo} in (${itens.map((i) => parametro(q, i)).join(', ')})` : 'false'
  } else if (OPERADORES[operador]) {
    const texto = operador === 'like' || operador === 'ilike' ? valor.replaceAll('*', '%') : valor
    sql = `${alvo} ${OPERADORES[operador]} ${parametro(q, texto)}`
  } else {
    throw pgrst(400, 'PGRST100', `Operador desconhecido: "${operador}"`)
  }
  return negar ? `not (${sql})` : sql
}

/** Conteúdo de `or=(...)`/`and=(...)`, com aninhamento. */
function logica(q: Consulta, texto: string, juntar: string): string {
  return dividir(texto)
    .map((parte) => {
      const aninhado = parte.match(/^(not\.)?(and|or)\((.*)\)$/s)
      if (aninhado) return `${aninhado[1] ? 'not ' : ''}(${logica(q, aninhado[3], aninhado[2])})`
      const ponto = parte.indexOf('.')
      return condicao(q, parte.slice(0, ponto), parte.slice(ponto + 1))
    })
    .join(` ${juntar} `)
}

const RESERVADOS = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'])

function onde(q: Consulta, url: URL): string {
  const partes: string[] = []
  for (const [chave, valor] of url.searchParams) {
    if (RESERVADOS.has(chave)) continue
    if (chave === 'or' || chave === 'and')
      partes.push(`(${logica(q, valor.replace(/^\(/, '').replace(/\)$/, ''), chave)})`)
    else if (chave.includes('.'))
      throw pgrst(400, 'PGRST100', `Filtro em recurso embutido não suportado: ${chave}`)
    else partes.push(condicao(q, chave, valor))
  }
  return partes.join(' and ') || 'true'
}

function ordem(url: URL): string {
  const pedido = url.searchParams.get('order')
  if (!pedido) return ''
  const itens = dividir(pedido).map((parte) => {
    const [coluna, ...mods] = parte.split('.')
    if (mods.some((m) => !['asc', 'desc', 'nullsfirst', 'nullslast'].includes(m)))
      throw pgrst(400, 'PGRST100', `Ordem inválida: "${parte}"`)
    const nulos = mods.includes('nullsfirst')
      ? ' nulls first'
      : mods.includes('nullslast')
        ? ' nulls last'
        : ''
    return `t.${id(coluna)} ${mods.includes('desc') ? 'desc' : 'asc'}${nulos}`
  })
  return `order by ${itens.join(', ')}`
}

function inteiro(valor: string | null): number | undefined {
  if (valor === null || valor === '') return undefined
  if (!/^\d+$/.test(valor)) throw pgrst(400, 'PGRST100', `Número inválido: "${valor}"`)
  return Number(valor)
}

const preferencias = (req: IncomingMessage) =>
  String(req.headers.prefer ?? '')
    .split(/[,;]\s*/)
    .map((p) => p.trim())
const querObjeto = (req: IncomingMessage) =>
  String(req.headers.accept ?? '').includes('application/vnd.pgrst.object+json')

const erroObjeto = (n: number) =>
  pgrst(
    406,
    'PGRST116',
    'Cannot coerce the result to a single JSON object',
    `The result contains ${n} rows`,
  )

// ---------------------------------------------------------------------------
// PostgREST: GET, POST, PATCH, DELETE e RPC
// ---------------------------------------------------------------------------

function lerJson(corpo: Buffer): any {
  try {
    return JSON.parse(corpo.toString('utf8') || 'null')
  } catch {
    throw pgrst(400, 'PGRST102', 'Corpo da requisição não é um JSON válido')
  }
}

async function tabela(
  req: IncomingMessage,
  url: URL,
  papel: Papel,
  nome: string,
  corpo: Buffer,
): Promise<Saida> {
  if (!tabelas.has(nome))
    throw pgrst(404, 'PGRST205', `Could not find the table 'public.${nome}' in the schema cache`)
  const metodo = req.method === 'HEAD' ? 'GET' : req.method!
  const q: Consulta = { params: [], n: 0 }
  const itens = lerSelect(url.searchParams.get('select') || '*')
  const prefs = preferencias(req)
  const contar = prefs.some((p) => /^count=(exact|planned|estimated)$/.test(p))
  const t = id(nome)
  const json = { 'Content-Type': 'application/json; charset=utf-8' }

  // Leitura ---------------------------------------------------------------------
  if (metodo === 'GET') {
    const filtro = onde(q, url)
    const faixa = req.headers.range?.toString().match(/^(\d+)-(\d*)$/)
    let offset = inteiro(url.searchParams.get('offset')) ?? (faixa ? Number(faixa[1]) : 0)
    let limite =
      inteiro(url.searchParams.get('limit')) ??
      (faixa?.[2] ? Number(faixa[2]) - offset + 1 : undefined)
    const lista = colunas(q, nome, itens, 't')
    return comoPapel(papel, async (db) => {
      const { rows } = await db.query<{ corpo: string; n: number }>(
        `select coalesce(json_agg(s), '[]'::json)::text as corpo, count(*)::int as n
           from (select ${lista} from public.${t} t where ${filtro} ${ordem(url)}
                 ${limite !== undefined ? `limit ${limite}` : ''} offset ${offset}) s`,
        q.params,
      )
      const { n } = rows[0]
      let total: number | undefined
      if (contar)
        total = (
          await db.query<{ n: number }>(
            `select count(*)::int as n from public.${t} t where ${filtro}`,
            q.params,
          )
        ).rows[0].n
      const intervalo = `${n ? `${offset}-${offset + n - 1}` : '*'}/${total ?? '*'}`
      const cabecalhos = { ...json, 'Content-Range': intervalo }
      if (querObjeto(req)) {
        if (n !== 1) throw erroObjeto(n)
        return { status: 200, corpo: JSON.stringify(JSON.parse(rows[0].corpo)[0]), cabecalhos }
      }
      return {
        status: total !== undefined && n < total ? 206 : 200,
        corpo: rows[0].corpo,
        cabecalhos,
      }
    })
  }

  // Escrita ---------------------------------------------------------------------
  let comando: string
  if (metodo === 'POST') {
    const dados = lerJson(corpo)
    const linhas: Record<string, unknown>[] = Array.isArray(dados) ? dados : [dados]
    if (
      !linhas.length ||
      linhas.some((l) => l === null || typeof l !== 'object' || Array.isArray(l))
    )
      throw pgrst(400, 'PGRST102', 'Corpo inválido: esperado objeto ou lista de objetos')
    const cols = [...new Set(linhas.flatMap((l) => Object.keys(l)))]
    const lista = cols.map((c) => id(c)).join(', ')
    const merge = prefs.includes('resolution=merge-duplicates')
    const ignorar = prefs.includes('resolution=ignore-duplicates')
    let conflito = ''
    if (merge || ignorar) {
      const alvo =
        url.searchParams.get('on_conflict')?.split(',') ??
        (
          await serializar(() =>
            banco.db.query<{ attname: string }>(
              `select a.attname from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
            where i.indrelid = $1::regclass and i.indisprimary`,
              [`public.${t}`],
            ),
          )
        ).rows.map((r) => r.attname)
      const atualiza = cols
        .filter((c) => !alvo.includes(c))
        .map((c) => `${id(c)} = excluded.${id(c)}`)
      conflito = `on conflict (${alvo.map((c) => id(c)).join(', ')}) ${merge && atualiza.length ? `do update set ${atualiza.join(', ')}` : 'do nothing'}`
    }
    comando = cols.length
      ? `insert into public.${t} (${lista}) select ${lista} from json_populate_recordset(null::public.${t}, $1::json) ${conflito} returning *`
      : `insert into public.${t} default values returning *`
    q.params = cols.length ? [JSON.stringify(linhas)] : []
  } else if (metodo === 'PATCH' || metodo === 'DELETE') {
    const filtro = onde(q, url)
    // O Supabase hospedado recusa UPDATE/DELETE sem filtro (pg-safeupdate): aqui também.
    if (filtro === 'true')
      throw new ErroHttp(400, {
        code: '21000',
        message: `${metodo === 'PATCH' ? 'UPDATE' : 'DELETE'} requires a WHERE clause`,
        details: null,
        hint: null,
      })
    if (metodo === 'DELETE') {
      comando = `delete from public.${t} t where ${filtro} returning t.*`
    } else {
      const dados = lerJson(corpo)
      if (dados === null || typeof dados !== 'object' || Array.isArray(dados))
        throw pgrst(400, 'PGRST102', 'Corpo inválido: esperado um objeto')
      const cols = Object.keys(dados)
      if (!cols.length) return { status: 204 }
      const corpoParam = parametro(q, JSON.stringify(dados))
      comando = `update public.${t} t set ${cols.map((c) => `${id(c)} = r.${id(c)}`).join(', ')}
                 from json_populate_record(null::public.${t}, ${corpoParam}::json) r where ${filtro} returning t.*`
    }
  } else {
    throw pgrst(405, 'PGRST117', `Método não suportado: ${req.method}`)
  }

  const representacao = prefs.includes('return=representation')
  const lista = colunas(q, nome, itens, 't')
  return comoPapel(papel, async (db) => {
    const { rows } = await db.query<{ corpo: string | null; n: number }>(
      `with m as (${comando})
       select ${representacao ? `(select coalesce(json_agg(s), '[]'::json)::text from (select ${lista} from m t) s)` : 'null::text'} as corpo,
              (select count(*)::int from m) as n`,
      q.params,
    )
    const { corpo: texto, n } = rows[0]
    const cabecalhos: Record<string, string> = { ...json, 'Content-Range': `*/${contar ? n : '*'}` }
    if (representacao && querObjeto(req)) {
      if (n !== 1) throw erroObjeto(n) // a transação é desfeita pelo catch de comoPapel
      return {
        status: metodo === 'POST' ? 201 : 200,
        corpo: JSON.stringify(JSON.parse(texto!)[0]),
        cabecalhos,
      }
    }
    if (representacao) return { status: metodo === 'POST' ? 201 : 200, corpo: texto!, cabecalhos }
    return { status: metodo === 'POST' ? 201 : 204, cabecalhos }
  })
}

async function rpc(
  req: IncomingMessage,
  url: URL,
  papel: Papel,
  nome: string,
  corpo: Buffer,
): Promise<Saida> {
  const { rows } = await serializar(() =>
    banco.db.query<{ conjunto: boolean; vazio: boolean; args: { nome: string; tipo: string }[] }>(
      `select p.proretset as conjunto, t.typname = 'void' as vazio,
              coalesce((select json_agg(json_build_object('nome', p.proargnames[x.i], 'tipo', format_type(x.t, null)) order by x.i)
                          from unnest(string_to_array(nullif(p.proargtypes::text, ''), ' ')::oid[]) with ordinality as x(t, i)
                         where p.proargnames is not null), '[]'::json) as args
         from pg_proc p join pg_type t on t.oid = p.prorettype
        where p.pronamespace = 'public'::regnamespace and p.proname = $1`,
      [nome],
    ),
  )
  if (!rows.length)
    throw pgrst(404, 'PGRST202', `Could not find the function public.${nome} in the schema cache`)
  const f = rows[0]

  const dados = req.method === 'GET' ? Object.fromEntries(url.searchParams) : (lerJson(corpo) ?? {})
  const usados = f.args.filter((a) => a.nome in dados)
  const desconhecido = Object.keys(dados).find((k) => !f.args.some((a) => a.nome === k))
  if (desconhecido)
    throw pgrst(
      404,
      'PGRST202',
      `Could not find the function public.${nome}(${Object.keys(dados).join(', ')}) in the schema cache`,
    )

  // Como o PostgREST: o corpo vira record tipado, e só os argumentos enviados são passados (os demais usam o DEFAULT).
  // `r` vale para os três formatos de retorno: coluna única (escalar), linha (composto) e conjunto.
  const chamada = `public.${id(nome)}(${usados.map((a) => `${id(a.nome)} := _a.${id(a.nome)}`).join(', ')})`
  const origem = usados.length
    ? `json_to_record($1::json) as _a(${usados.map((a) => `${id(a.nome)} ${a.tipo}`).join(', ')}), lateral ${chamada} r`
    : `${chamada} r`
  const projecao = f.conjunto
    ? `select coalesce(json_agg(r), '[]'::json)::text as corpo from ${origem}`
    : f.vazio
      ? `select null::text as corpo from ${origem}`
      : `select to_json(r)::text as corpo from ${origem}`

  return comoPapel(papel, async (db) => {
    const { rows: saida } = await db.query<{ corpo: string | null }>(
      projecao,
      usados.length ? [JSON.stringify(dados)] : [],
    )
    if (f.vazio) return { status: 204 }
    return {
      status: 200,
      corpo: saida[0]?.corpo ?? 'null',
      cabecalhos: { 'Content-Type': 'application/json; charset=utf-8' },
    }
  })
}

// ---------------------------------------------------------------------------
// Auth (GoTrue)
// ---------------------------------------------------------------------------

interface LinhaAuth {
  id: string
  email: string
  raw_user_meta_data: Record<string, unknown>
  created_at: string
  updated_at: string
  encrypted_password: string | null
}

const COLUNAS_AUTH = 'id, email, raw_user_meta_data, created_at, updated_at, encrypted_password'
const usuarioPorEmail = async (email: string) =>
  (
    await serializar(() =>
      banco.db.query<LinhaAuth>(
        `select ${COLUNAS_AUTH} from auth.users where lower(email) = lower($1)`,
        [email],
      ),
    )
  ).rows[0]
const usuarioPorId = async (uid: string) =>
  (
    await serializar(() =>
      banco.db.query<LinhaAuth>(`select ${COLUNAS_AUTH} from auth.users where id = $1::uuid`, [
        uid,
      ]),
    )
  ).rows[0]

const erroAuth = (status: number, codigo: string, mensagem: string) =>
  new ErroHttp(status, {
    code: status,
    error_code: codigo,
    msg: mensagem,
    error: codigo,
    error_description: mensagem,
  })

function usuarioJson(u: LinhaAuth) {
  const quando = new Date(u.created_at).toISOString()
  return {
    id: u.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: u.email,
    email_confirmed_at: quando,
    phone: '',
    confirmed_at: quando,
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: u.raw_user_meta_data ?? {},
    identities: [],
    created_at: quando,
    updated_at: new Date(u.updated_at).toISOString(),
    is_anonymous: false,
  }
}

function sessao(u: LinhaAuth) {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 3600
  const base = { aud: 'authenticated', role: 'authenticated', sub: u.id, email: u.email, iat }
  return {
    access_token: assinar({
      ...base,
      exp,
      session_id: randomUUID(),
      app_metadata: { provider: 'email' },
      user_metadata: u.raw_user_meta_data ?? {},
    }),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    refresh_token: assinar({ ...base, typ: 'refresh', exp: iat + 30 * 86400, jti: randomUUID() }),
    user: usuarioJson(u),
  }
}

const SENHA_MINIMA = 6
const senhaFraca = () =>
  new ErroHttp(422, {
    code: 422,
    error_code: 'weak_password',
    msg: `Password should be at least ${SENHA_MINIMA} characters.`,
    weak_password: { reasons: ['length'] },
  })

async function autenticacao(
  req: IncomingMessage,
  url: URL,
  corpo: Buffer,
  origem: string,
): Promise<Saida> {
  const rota = url.pathname.slice('/auth/v1'.length)
  const json = (status: number, dados: unknown): Saida => ({
    status,
    corpo: JSON.stringify(dados),
    cabecalhos: { 'Content-Type': 'application/json', 'x-supabase-api-version': '2024-01-01' },
  })
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  const dados = ['POST', 'PUT'].includes(req.method!) ? (lerJson(corpo) ?? {}) : {}

  /** O usuário dono do access_token enviado. */
  const logado = async () => {
    const claims = verificar(bearer)
    if (!claims?.sub || claims.role !== 'authenticated')
      throw erroAuth(
        401,
        'bad_jwt',
        'invalid JWT: unable to parse or verify signature, token is invalid or expired',
      )
    const u = await usuarioPorId(claims.sub)
    if (!u) throw erroAuth(403, 'user_not_found', 'User from sub claim in JWT does not exist')
    return u
  }

  if (req.method === 'POST' && rota === '/token') {
    const tipo = url.searchParams.get('grant_type')
    if (tipo === 'password') {
      const u = await usuarioPorEmail(String(dados.email ?? ''))
      if (!u || !conferirSenha(String(dados.password ?? ''), u.encrypted_password))
        throw erroAuth(400, 'invalid_credentials', 'Invalid login credentials')
      return json(200, sessao(u))
    }
    if (tipo === 'refresh_token') {
      const claims = verificar(dados.refresh_token)
      const u = claims?.typ === 'refresh' ? await usuarioPorId(claims.sub) : undefined
      if (!u)
        throw erroAuth(
          400,
          'refresh_token_not_found',
          'Invalid Refresh Token: Refresh Token Not Found',
        )
      return json(200, sessao(u))
    }
    throw erroAuth(400, 'validation_failed', 'unsupported grant_type')
  }

  if (req.method === 'POST' && rota === '/signup') {
    const email = String(dados.email ?? '')
      .trim()
      .toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      throw erroAuth(422, 'validation_failed', 'Unable to validate email address: invalid format')
    if (String(dados.password ?? '').length < SENHA_MINIMA) throw senhaFraca()
    if (await usuarioPorEmail(email))
      throw erroAuth(422, 'user_already_exists', 'User already registered')
    // O gatilho em auth.users cria o perfil (e já aplica o perfil de um convite pendente).
    await serializar(() =>
      banco.db.query(
        `insert into auth.users (email, raw_user_meta_data, encrypted_password) values ($1, $2::jsonb, $3)`,
        [email, JSON.stringify(dados.data ?? {}), guardarSenha(String(dados.password))],
      ),
    )
    return json(200, sessao((await usuarioPorEmail(email))!))
  }

  if (req.method === 'POST' && rota === '/recover') {
    const u = await usuarioPorEmail(String(dados.email ?? ''))
    if (u) {
      // Nenhum e-mail sai daqui: o link fica em GET /__emails.
      const { access_token, refresh_token, expires_in } = sessao(u)
      const destino = url.searchParams.get('redirect_to') || origem
      emails.push({
        para: u.email,
        quando: new Date().toISOString(),
        link: `${destino}#access_token=${access_token}&expires_in=${expires_in}&refresh_token=${refresh_token}&token_type=bearer&type=recovery`,
      })
    }
    return json(200, {}) // a mesma resposta com e sem conta, como no GoTrue
  }

  if (req.method === 'GET' && rota === '/user') return json(200, usuarioJson(await logado()))

  if (req.method === 'PUT' && rota === '/user') {
    const u = await logado()
    if (dados.password !== undefined) {
      if (String(dados.password).length < SENHA_MINIMA) throw senhaFraca()
      if (conferirSenha(String(dados.password), u.encrypted_password))
        throw erroAuth(
          422,
          'same_password',
          'New password should be different from the old password.',
        )
      await serializar(() =>
        banco.db.query(
          `update auth.users set encrypted_password = $2, updated_at = now() where id = $1::uuid`,
          [u.id, guardarSenha(String(dados.password))],
        ),
      )
    }
    if (dados.data)
      await serializar(() =>
        banco.db.query(
          `update auth.users set raw_user_meta_data = $2::jsonb, updated_at = now() where id = $1::uuid`,
          [u.id, JSON.stringify(dados.data)],
        ),
      )
    return json(200, usuarioJson((await usuarioPorId(u.id))!))
  }

  if (req.method === 'POST' && rota === '/logout') return { status: 204 } // os tokens são sem estado: não há o que revogar

  if (req.method === 'GET' && rota === '/settings') {
    return json(200, {
      external: { email: true },
      disable_signup: false,
      mailer_autoconfirm: true,
      phone_autoconfirm: false,
      sms_provider: '',
      saml_enabled: false,
    })
  }

  throw erroAuth(404, 'not_found', `Rota de autenticação não suportada: ${req.method} ${rota}`)
}

// ---------------------------------------------------------------------------
// Storage (em memória, sem RLS)
// ---------------------------------------------------------------------------

const erroStorage = (status: number, erro: string, mensagem: string) =>
  new ErroHttp(status, { statusCode: String(status), error: erro, message: mensagem })

async function armazenamento(
  req: IncomingMessage,
  url: URL,
  papel: Papel,
  corpo: Buffer,
): Promise<Saida> {
  const [, , , acao, ...resto] = url.pathname.split('/').map(decodeURIComponent) // ['', 'storage', 'v1', 'object', ...]
  if (acao !== 'object') throw erroStorage(404, 'not_found', 'Rota de storage não suportada')
  const json = (status: number, dados: unknown): Saida => ({
    status,
    corpo: JSON.stringify(dados),
    cabecalhos: { 'Content-Type': 'application/json' },
  })

  // Link assinado: público, o token é a credencial.
  if (req.method === 'GET' && resto[0] === 'sign') {
    const [bucket, ...caminho] = resto.slice(1)
    const claims = verificar(url.searchParams.get('token') ?? '')
    const chave = `${bucket}/${caminho.join('/')}`
    if (!claims || claims.url !== chave)
      throw erroStorage(400, 'InvalidJWT', 'Token inválido ou expirado')
    const arquivo = arquivos.get(chave)
    if (!arquivo) throw erroStorage(404, 'not_found', 'Object not found')
    return {
      status: 200,
      corpo: arquivo.dados as any,
      cabecalhos: { 'Content-Type': arquivo.tipo },
    }
  }

  if (papel.role !== 'authenticated')
    throw erroStorage(401, 'Unauthorized', 'new row violates row-level security policy')

  if (req.method === 'POST' && resto[0] === 'sign') {
    const [bucket, ...caminho] = resto.slice(1)
    const chave = `${bucket}/${caminho.join('/')}`
    if (!arquivos.has(chave)) throw erroStorage(404, 'not_found', 'Object not found')
    const expira = Math.floor(Date.now() / 1000) + Number(lerJson(corpo)?.expiresIn ?? 3600)
    return json(200, {
      signedURL: `/object/sign/${chave}?token=${assinar({ url: chave, exp: expira })}`,
    })
  }

  if (req.method === 'DELETE') {
    const apagados = []
    for (const prefixo of lerJson(corpo)?.prefixes ?? []) {
      if (arquivos.delete(`${resto[0]}/${prefixo}`))
        apagados.push({ name: prefixo, bucket_id: resto[0] })
    }
    return json(200, apagados)
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const [bucket, ...caminho] = resto
    if (!buckets.has(bucket)) throw erroStorage(404, 'Bucket not found', 'Bucket not found')
    const chave = `${bucket}/${caminho.join('/')}`
    if (req.method === 'POST' && arquivos.has(chave) && req.headers['x-upsert'] !== 'true')
      throw erroStorage(409, 'Duplicate', 'The resource already exists')
    let dados = corpo
    let tipo = String(req.headers['content-type'] ?? 'application/octet-stream')
    if (tipo.startsWith('multipart/form-data')) {
      // O supabase-js manda o arquivo num FormData, no campo de nome vazio.
      const form = await new Response(corpo, { headers: { 'content-type': tipo } }).formData()
      const arquivo = form.get('')
      if (!(arquivo instanceof File)) throw erroStorage(400, 'InvalidRequest', 'Arquivo ausente')
      dados = Buffer.from(await arquivo.arrayBuffer())
      tipo = arquivo.type || 'application/octet-stream'
    }
    arquivos.set(chave, { dados, tipo })
    return json(200, { Id: randomUUID(), Key: chave })
  }

  throw erroStorage(404, 'not_found', 'Rota de storage não suportada')
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

const ORIGEM_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/
const CABECALHOS_PERMITIDOS =
  'authorization, apikey, content-type, prefer, range, range-unit, x-client-info, accept-profile, content-profile, x-supabase-api-version, x-upsert, cache-control, x-metadata'

function lerCorpo(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pedacos: Buffer[] = []
    req
      .on('data', (p) => pedacos.push(p))
      .on('end', () => resolve(Buffer.concat(pedacos)))
      .on('error', reject)
  })
}

function responder(res: ServerResponse, saida: Saida) {
  const corpo = saida.corpo
  res.writeHead(saida.status, saida.cabecalhos)
  res.end(saida.status === 204 || corpo === undefined ? undefined : corpo)
}

async function atender(req: IncomingMessage, res: ServerResponse) {
  // Só o que deu errado vai para o log: é o que ajuda a entender uma tela que falhou.
  res.on('finish', () => {
    if (res.statusCode >= 400)
      console.log(`${res.statusCode} ${req.method} ${(req.url ?? '').slice(0, 200)}`)
  })
  const origem = req.headers.origin
  if (origem && ORIGEM_LOCAL.test(origem)) {
    res.setHeader('Access-Control-Allow-Origin', origem)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Expose-Headers', 'content-range, content-location')
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS')
    res.setHeader(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] || CABECALHOS_PERMITIDOS,
    )
    res.setHeader('Access-Control-Max-Age', '600')
    return responder(res, { status: 204 })
  }

  let papel: Papel | undefined
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    const local = /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(req.socket.remoteAddress ?? '')

    if (url.pathname === '/__saude') return responder(res, { status: 200, corpo: 'ok' })
    if (url.pathname === '/__emails' && req.method === 'GET' && local) {
      return responder(res, {
        status: 200,
        corpo: JSON.stringify(emails),
        cabecalhos: { 'Content-Type': 'application/json' },
      })
    }
    if (url.pathname === '/__reset' && req.method === 'POST') {
      if (!local)
        return responder(res, { status: 403, corpo: '{"message":"Somente de localhost"}' })
      await serializar(async () => {
        await banco.fechar()
        await iniciar()
      })
      return responder(res, {
        status: 200,
        corpo: '{"ok":true}',
        cabecalhos: { 'Content-Type': 'application/json' },
      })
    }

    // A porta de entrada do Supabase exige a chave da API em toda chamada, menos no link assinado do storage.
    const assinado = url.pathname.startsWith('/storage/v1/object/sign/') && req.method === 'GET'
    const chave = req.headers.apikey?.toString() ?? url.searchParams.get('apikey') ?? undefined
    if (!assinado && !verificar(chave)) {
      throw new ErroHttp(401, {
        message: 'Invalid API key',
        hint: 'Envie a chave anônima local no cabeçalho apikey.',
      })
    }
    const corpo = await lerCorpo(req)
    // O GoTrue confere o próprio token (um access_token vencido no logout não é erro de API).
    if (url.pathname.startsWith('/auth/v1/')) {
      return responder(
        res,
        await autenticacao(req, url, corpo, String(origem ?? `http://${req.headers.host}`)),
      )
    }

    const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? chave
    const claims = verificar(bearer)
    if (!assinado && bearer && !claims) throw pgrst(401, 'PGRST303', 'JWT expired')
    papel = {
      role: claims?.role === 'authenticated' ? 'authenticated' : 'anon',
      claims: claims ?? { role: 'anon' },
    }
    if (url.pathname.startsWith('/storage/v1/'))
      return responder(res, await armazenamento(req, url, papel, corpo))
    const rest = url.pathname.match(/^\/rest\/v1\/(rpc\/)?([^/]+)$/)
    if (rest) {
      const nome = decodeURIComponent(rest[2])
      const saida = rest[1]
        ? await rpc(req, url, papel, nome, corpo)
        : await tabela(req, url, papel, nome, corpo)
      if (req.method === 'HEAD') saida.corpo = undefined
      return responder(res, saida)
    }
    throw new ErroHttp(404, { message: 'Not Found' })
  } catch (erro) {
    const e = traduzir(erro, papel)
    responder(res, {
      status: e.status,
      corpo: JSON.stringify(e.corpo),
      cabecalhos: { 'Content-Type': 'application/json' },
    })
  }
}

const inicio = performance.now()
await iniciar()

// Só no loopback (IPv4 e IPv6): o banco é de mentira, mas as senhas de teste são previsíveis e não devem ficar na rede.
const servidores = ['127.0.0.1', '::1'].map((endereco) => {
  const servidor = createServer(atender)
  // O tempo real (Phoenix/WebSocket) não existe aqui: recusa limpo, e o cliente tenta de novo sem derrubar nada.
  servidor.on('upgrade', (_req, socket) => {
    socket.on('error', () => {})
    socket.end('HTTP/1.1 501 Not Implemented\r\nConnection: close\r\nContent-Length: 0\r\n\r\n')
  })
  servidor.on('error', (erro: NodeJS.ErrnoException) => {
    if (erro.code === 'EADDRNOTAVAIL') return // máquina sem IPv6
    console.error(erro.code === 'EADDRINUSE' ? `A porta ${PORTA} já está em uso.` : erro.message)
    process.exit(1)
  })
  servidor.listen(PORTA, endereco)
  return servidor
})
servidores[0].on('listening', () => {
  console.log(
    `Supabase local em http://localhost:${PORTA} (pronto em ${Math.round(performance.now() - inicio)} ms)`,
  )
  console.log(`Chave anônima: ${CHAVE_ANONIMA}`)
  console.log(`Contas de teste: ${ARQUIVO_DE_CONTAS}`)
})

// Um erro que escapou de uma requisição não pode derrubar o servidor no meio de uma rodada de testes.
process.on('uncaughtException', (erro) => console.error('Erro inesperado:', erro))
process.on('unhandledRejection', (erro) => console.error('Promessa rejeitada:', erro))

for (const sinal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sinal, () => {
    servidores.forEach((servidor) => servidor.close())
    process.exit(0)
  })
}
