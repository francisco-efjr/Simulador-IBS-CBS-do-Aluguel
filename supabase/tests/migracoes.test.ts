// @vitest-environment node
/**
 * As migrações sobem do zero num banco vazio, na ordem dos arquivos, e deixam
 * o banco no formato que supabase/README.md descreve.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { criarBancoDeTeste, listarMigracoes, type BancoDeTeste } from './harness'

let banco: BancoDeTeste

beforeAll(async () => {
  banco = await criarBancoDeTeste()
}, 60_000)

afterAll(async () => {
  await banco?.fechar()
})

describe('migrações', () => {
  it('aplica todos os arquivos de supabase/migrations em ordem', () => {
    const arquivos = listarMigracoes().map((m) => m.arquivo)
    expect(arquivos.length).toBeGreaterThanOrEqual(7)
    expect(arquivos).toEqual([...arquivos].sort())
  })

  it('liga a RLS em todas as tabelas de public', async () => {
    const { rows } = await banco.db.query<{ tabela: string }>(
      `select c.relname as tabela
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    )
    expect(rows).toEqual([])
  })

  it('cria as 16 tabelas de negócio', async () => {
    const { rows } = await banco.db.query<{ total: number }>(
      `select count(*)::int as total from pg_tables where schemaname = 'public'`,
    )
    expect(rows[0].total).toBeGreaterThanOrEqual(16)
  })

  it('traz as 13 categorias financeiras de referência e nenhum outro dado', async () => {
    const categorias = await banco.db.query<{ total: number }>(
      `select count(*)::int as total from public.categorias_financeiras`,
    )
    expect(categorias.rows[0].total).toBe(13)

    const imoveis = await banco.db.query<{ total: number }>(`select count(*)::int as total from public.imoveis`)
    expect(imoveis.rows[0].total).toBe(0)
  })

  it('cria os cinco buckets, todos privados', async () => {
    const { rows } = await banco.db.query<{ id: string; public: boolean }>(
      `select id, public from storage.buckets order by id`,
    )
    expect(rows).toHaveLength(5)
    expect(rows.every((b) => b.public === false)).toBe(true)
  })

  it('a migração de correções da auditoria pode ser rodada de novo inteira (SQL Editor)', async () => {
    const correcoes = listarMigracoes().find((m) => m.arquivo === '20260919120004_correcoes_da_auditoria.sql')
    expect(correcoes).toBeDefined()
    await banco.desfazendo((q) => q.exec(correcoes!.sql))
  })

  it('publica as tabelas no canal de tempo real', async () => {
    const { rows } = await banco.db.query<{ tablename: string }>(
      `select tablename from pg_publication_tables where pubname = 'supabase_realtime'`,
    )
    expect(rows.map((r) => r.tablename)).toEqual(expect.arrayContaining(['imoveis', 'contratos', 'receitas']))
  })
})
