/**
 * Harness dos testes do banco.
 *
 * Sobe um Postgres embutido (PGlite, compilado para WebAssembly — sem Docker,
 * sem psql, sem Supabase CLI), prepara o mínimo do que o Supabase entrega pronto
 * e aplica as migrações reais de `supabase/migrations/`, lidas do disco em ordem
 * alfabética. Migração nova entra sozinha na suíte: nada de SQL copiado aqui.
 *
 * Stubs do Supabase (o suficiente para as migrações rodarem e para a RLS valer
 * como em produção — não é uma reprodução do Supabase):
 *   · roles `anon`, `authenticated` e `service_role` (nologin; a troca é por
 *     `set local role`), com os privilégios padrão que o Supabase concede em
 *     `public` a tabelas, funções e sequências criadas depois;
 *   · schema `auth` com `auth.users` (só as colunas que os gatilhos leem),
 *     `auth.uid()`, `auth.role()` e `auth.jwt()` lendo `request.jwt.claim*`,
 *     como no Supabase;
 *   · schema `storage` com `storage.buckets`, `storage.objects` (RLS ligada) e
 *     `storage.foldername()`;
 *   · publicação vazia `supabase_realtime`;
 *   · schema `extensions`, onde o Supabase costuma instalar extensões;
 *   · schema `cron` com `cron.schedule()`/`cron.unschedule()` que não fazem
 *     nada: o PGlite não tem pg_cron. Um `create extension pg_cron` (ou outra
 *     extensão exclusiva do Supabase, ver EXTENSOES_DO_SUPABASE) é neutralizado
 *     na memória antes de executar a migração — o arquivo não é alterado.
 *
 * Extensões que o PGlite tem em `@electric-sql/pglite/contrib/*` (pgcrypto,
 * uuid-ossp, btree_gist, citext, pg_trgm…) são detectadas nas migrações e
 * carregadas automaticamente.
 *
 * O banco roda como `postgres` (superusuário, dono das tabelas, portanto fora
 * da RLS). Os testes trocam para `authenticated`/`anon` com `comoUsuario` e
 * `comoAnonimo`, sempre dentro de uma transação desfeita ao final.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { PGlite, type Extensions } from '@electric-sql/pglite'

const PASTA_MIGRACOES = join(import.meta.dirname, '..', 'migrations')

/** Extensões que só existem no Supabase: o `create extension` vira comentário. */
const EXTENSOES_DO_SUPABASE = [
  'pg_cron',
  'pg_net',
  'pg_graphql',
  'pgsodium',
  'supabase_vault',
  'pgjwt',
  'pg_stat_statements',
]

export type Modulo =
  | 'imoveis'
  | 'inquilinos'
  | 'fornecedores'
  | 'contratos'
  | 'receitas'
  | 'despesas'
  | 'iptu_taxas'
  | 'dashboards'
  | 'alertas'
  | 'relatorios'
  | 'importar_extrato'
  | 'classificar_transacoes'
  | 'quadro'

export type Nivel = 'sem_acesso' | 'visualizacao' | 'edicao'

/** O que os testes usam para consultar: o próprio PGlite, já dentro da transação. */
export type Consulta = Pick<PGlite, 'query' | 'exec'>

const STUBS_DO_SUPABASE = /* sql */ `
  -- Roles ---------------------------------------------------------------------
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  grant usage on schema public to anon, authenticated, service_role;

  -- Mesmos privilégios padrão do Supabase: toda tabela nova em public nasce
  -- aberta às três roles, e quem fecha é a RLS (ou um revoke da migração).
  alter default privileges in schema public
    grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on sequences to anon, authenticated, service_role;

  create schema extensions;
  grant usage on schema extensions to anon, authenticated, service_role;

  -- auth ----------------------------------------------------------------------
  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;

  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    raw_app_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create function auth.uid() returns uuid
  language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
  $$;

  create function auth.role() returns text
  language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    )
  $$;

  create function auth.jwt() returns jsonb
  language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;

  grant execute on all functions in schema auth to anon, authenticated, service_role;

  -- storage -------------------------------------------------------------------
  create schema storage;
  grant usage on schema storage to anon, authenticated, service_role;

  create table storage.buckets (
    id text primary key,
    name text not null unique,
    owner uuid,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text,
    owner uuid,
    metadata jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  alter table storage.buckets enable row level security;
  alter table storage.objects enable row level security;
  grant all on storage.buckets, storage.objects to anon, authenticated, service_role;

  create function storage.foldername(name text) returns text[]
  language plpgsql immutable as $$
  declare _parts text[];
  begin
    select string_to_array(name, '/') into _parts;
    return _parts[1:array_length(_parts, 1) - 1];
  end
  $$;

  grant execute on all functions in schema storage to anon, authenticated, service_role;

  -- Tempo real ----------------------------------------------------------------
  create publication supabase_realtime;

  -- pg_cron (stub) --------------------------------------------------------------
  -- O PGlite não tem pg_cron. As funções existem para que uma migração que
  -- agende rotina compile e rode; o agendamento simplesmente não acontece.
  create schema cron;
  create function cron.schedule(job_name text, schedule text, command text)
  returns bigint language sql as $$ select 0::bigint $$;
  create function cron.schedule(schedule text, command text)
  returns bigint language sql as $$ select 0::bigint $$;
  create function cron.unschedule(job_name text)
  returns boolean language sql as $$ select true $$;
`

/** Arquivos .sql de supabase/migrations, em ordem alfabética (= cronológica). */
export function listarMigracoes(): { arquivo: string; sql: string }[] {
  return readdirSync(PASTA_MIGRACOES)
    .filter((arquivo) => arquivo.endsWith('.sql'))
    .sort()
    .map((arquivo) => ({ arquivo, sql: readFileSync(join(PASTA_MIGRACOES, arquivo), 'utf8') }))
}

const RE_CRIAR_EXTENSAO =
  /create\s+extension\s+(?:if\s+not\s+exists\s+)?"?([a-z0-9_-]+)"?[^;]*;/gi

/** Neutraliza, só na memória, o `create extension` do que o PGlite não tem. */
function neutralizarExtensoesDoSupabase(sql: string): string {
  return sql.replace(RE_CRIAR_EXTENSAO, (trecho, nome: string) =>
    EXTENSOES_DO_SUPABASE.includes(nome.toLowerCase())
      ? `/* [harness] extensão exclusiva do Supabase ignorada: ${nome} */`
      : trecho,
  )
}

/** Carrega de @electric-sql/pglite/contrib as extensões que as migrações pedem. */
async function extensoesPedidas(sqls: string[]): Promise<Extensions> {
  const nomes = new Set<string>()
  for (const sql of sqls) {
    for (const [, nome] of sql.matchAll(RE_CRIAR_EXTENSAO)) nomes.add(nome.toLowerCase())
  }

  const extensoes: Extensions = {}
  for (const nome of nomes) {
    if (EXTENSOES_DO_SUPABASE.includes(nome) || nome === 'plpgsql') continue
    const modulo = nome.replace(/-/g, '_')
    try {
      const importado = await import(`@electric-sql/pglite/contrib/${modulo}`)
      extensoes[modulo] = importado[modulo]
    } catch {
      throw new Error(
        `A migração pede a extensão "${nome}", que o PGlite não oferece. ` +
          'Se ela só existe no Supabase, acrescente-a a EXTENSOES_DO_SUPABASE em supabase/tests/harness.ts.',
      )
    }
  }
  return extensoes
}

export interface BancoDeTeste {
  db: PGlite
  /** Roda `fn` como `authenticated` com `auth.uid() = id`, numa transação desfeita ao final. */
  comoUsuario<T>(id: string, fn: (q: Consulta) => Promise<T>): Promise<T>
  /** Roda `fn` como `anon` (sem sessão), numa transação desfeita ao final. */
  comoAnonimo<T>(fn: (q: Consulta) => Promise<T>): Promise<T>
  /** Roda `fn` como `postgres` (fora da RLS), numa transação desfeita ao final. */
  desfazendo<T>(fn: (q: Consulta) => Promise<T>): Promise<T>
  /** Cria login em auth.users (o gatilho cria o perfil) e grava perfil e permissões. */
  criarUsuario(opcoes?: {
    email?: string
    nome?: string
    perfil?: 'administrador' | 'usuario'
    ativo?: boolean
    permissoes?: Partial<Record<Modulo, Nivel>>
  }): Promise<string>
  fechar(): Promise<void>
}

export async function criarBancoDeTeste(): Promise<BancoDeTeste> {
  const migracoes = listarMigracoes()
  const db = await PGlite.create({ extensions: await extensoesPedidas(migracoes.map((m) => m.sql)) })

  await db.exec(STUBS_DO_SUPABASE)
  for (const { arquivo, sql } of migracoes) {
    try {
      await db.exec(neutralizarExtensoesDoSupabase(sql))
    } catch (erro) {
      throw new Error(`Falha ao aplicar a migração ${arquivo}: ${(erro as Error).message}`, {
        cause: erro,
      })
    }
  }

  /** Transação desfeita no fim, aconteça o que acontecer dentro de `fn`. */
  async function emTransacao<T>(preparo: string, fn: (q: Consulta) => Promise<T>): Promise<T> {
    await db.exec('begin')
    try {
      if (preparo) await db.exec(preparo)
      return await fn(db)
    } finally {
      await db.exec('rollback')
    }
  }

  let sequencia = 0

  return {
    db,

    comoUsuario(id, fn) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error(`id de usuário inválido: ${id}`)
      return emTransacao(
        `set local role authenticated;
         select set_config('request.jwt.claim.sub', '${id}', true);
         select set_config('request.jwt.claim.role', 'authenticated', true);`,
        fn,
      )
    },

    comoAnonimo(fn) {
      return emTransacao(
        `set local role anon;
         select set_config('request.jwt.claim.role', 'anon', true);`,
        fn,
      )
    },

    desfazendo(fn) {
      return emTransacao('', fn)
    },

    async criarUsuario({ email, nome, perfil = 'usuario', ativo = true, permissoes = {} } = {}) {
      const id = randomUUID()
      const endereco = email ?? `pessoa${++sequencia}-${id.slice(0, 8)}@teste.local`

      await db.transaction(async (tx) => {
        await tx.query(
          `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`,
          [id, endereco, JSON.stringify(nome ? { name: nome } : {})],
        )
        // Perfil e situação são protegidos por tg_proteger_privilegio, que só
        // aceita a mudança vinda de um administrador logado. Aqui é preparação
        // de cenário, não o que está sob teste: desligamos os gatilhos só
        // nesta transação.
        if (perfil !== 'usuario' || !ativo) {
          await tx.exec(`set local session_replication_role = replica`)
          await tx.query(`update public.users set perfil = $2, ativo = $3 where id = $1`, [
            id,
            perfil,
            ativo,
          ])
          await tx.exec(`set local session_replication_role = origin`)
        }
        for (const [modulo, nivel] of Object.entries(permissoes)) {
          await tx.query(`insert into public.permissoes (usuario, modulo, nivel) values ($1, $2, $3)`, [
            id,
            modulo,
            nivel,
          ])
        }
      })

      return id
    },

    fechar() {
      return db.close()
    },
  }
}

/**
 * Executa e devolve o erro do Postgres; falha se nada der errado.
 *
 * Depois de um erro a transação de comoUsuario/comoAnonimo fica abortada:
 * deixe a operação que deve falhar para o fim do bloco.
 */
export async function capturarErro(promessa: Promise<unknown>): Promise<{ code?: string; message: string }> {
  try {
    await promessa
  } catch (erro) {
    return erro as { code?: string; message: string }
  }
  throw new Error('Era esperado um erro do banco, mas a operação passou.')
}
