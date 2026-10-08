// @vitest-environment node
/**
 * Regressão da rodada de QA de 06/10/2026 (achados SEG-, PRD-, CAD- e FIN- de
 * banco). Cada `describe` leva o ID do achado e prova o que a QA provou: sem a
 * migração correspondente em supabase/migrations/, o teste falha.
 *
 *   SEG-01  20261006120001  anexos por módulo (storage)
 *   SEG-02  20261006120002  cadastro só vale com o token do convite
 *   PRD-02  20261006120002  cadastro sem convite nasce inativo
 *   CAD-03  20261006120003  um contrato ativo por unidade
 *   SEG-08  20261006120004  unidade do contrato é do imóvel do contrato (HA004)
 *   SEG-05  20261006120005  categoria financeira por tipo
 *   SEG-04  20261006120006  trilha sem dado pessoal em claro
 *   SEG-17  20261006120007  limite de 3 imóveis conta só os da pessoa
 *   SEG-10  20261006120008  privilégios mínimos
 *   FIN-14  20261006120009  receita e despesa coerentes (HA007 a HA009)
 *   FIN-15  20261006120010  nunca sem administrador ativo (HA005, HA006)
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { capturarErro, criarBancoDeTeste, listarMigracoes, type BancoDeTeste, type Consulta } from './harness'

let banco: BancoDeTeste

let admin: string
let admin2: string
let gratuito: string
let financeiro: string
let editorLimite: string
let semAcesso: string

let imovelA: string
let imovelB: string
let imovelC: string
let unidadeA1: string
let unidadeA2: string
let unidadeB1: string
let inquilino1: string
let inquilino2: string
let contratoC: string
let categoriaReceita: string
let categoriaDespesa: string

const id = async (sql: string, params: unknown[] = []) =>
  (await banco.db.query<{ id: string }>(sql, params)).rows[0].id

beforeAll(async () => {
  banco = await criarBancoDeTeste()

  admin = await banco.criarUsuario({ perfil: 'administrador', nome: 'Admin QA' })
  admin2 = await banco.criarUsuario({ perfil: 'administrador', nome: 'Admin QA 2' })
  semAcesso = await banco.criarUsuario({})
  // Perfil gratuito (20261008120001): Imóveis, Inquilinos, Locadores e
  // fiadores, Contratos. Receitas e despesas são só do administrador; quem as
  // lança aqui é o segundo administrador (um terceiro mudaria a conta do FIN-15).
  gratuito = await banco.criarUsuario({ perfil: 'gratuito' })
  financeiro = admin2
  editorLimite = await banco.criarUsuario({ perfil: 'gratuito' })

  // Cenário comum, gravado como dono do banco (fora da RLS e sem sessão).
  imovelA = await id(`insert into public.imoveis (nome, endereco) values ('Edifício QA', 'Rua A, 1') returning id`)
  imovelB = await id(`insert into public.imoveis (nome, endereco) values ('Casa QA', 'Rua B, 2') returning id`)
  imovelC = await id(`insert into public.imoveis (nome, endereco) values ('Terreno QA', 'Rua C, 3') returning id`)
  unidadeA1 = await id(
    `insert into public.imovel_unidades (imovel_id, identificador) values ($1, 'Sala 01') returning id`,
    [imovelA],
  )
  unidadeA2 = await id(
    `insert into public.imovel_unidades (imovel_id, identificador) values ($1, 'Sala 02') returning id`,
    [imovelA],
  )
  unidadeB1 = await id(
    `insert into public.imovel_unidades (imovel_id, identificador) values ($1, 'Principal') returning id`,
    [imovelB],
  )
  inquilino1 = await id(`insert into public.inquilinos (nome) values ('Inquilino Um') returning id`)
  inquilino2 = await id(`insert into public.inquilinos (nome) values ('Inquilino Dois') returning id`)
  // Imóvel sem unidades, com contrato ativo em 2030 (CAD-03 e FIN-14).
  contratoC = await id(
    `insert into public.contratos (imovel, inquilino, data_inicio, data_fim, status)
     values ($1, $2, '2030-01-01', '2030-12-31', 'ativo') returning id`,
    [imovelC, inquilino1],
  )
  categoriaReceita = await id(
    `insert into public.categorias_financeiras (nome, tipo) values ('Categoria QA receita', 'receita') returning id`,
  )
  categoriaDespesa = await id(
    `insert into public.categorias_financeiras (nome, tipo) values ('Categoria QA despesa', 'despesa') returning id`,
  )
  // Imóveis legados (sem autoria): entram na conta do limite de 3 imóveis (SEG-17).
  await banco.db.exec(
    `insert into public.imoveis (nome, endereco) values
       ('Legado 1', 'Rua L, 1'), ('Legado 2', 'Rua L, 2'), ('Legado 3', 'Rua L, 3')`,
  )
  // Anexos já gravados (SEG-01): um por módulo, mais um do tempo em que o caminho não tinha pasta.
  await banco.db.exec(
    `insert into storage.objects (bucket_id, name) values
       ('documentos-anexos', 'inquilino/aaaa-rg.pdf'),
       ('documentos-anexos', 'despesa/bbbb-recibo.pdf'),
       ('documentos-anexos', 'contrato/cccc-assinado.pdf'),
       ('documentos-anexos', 'eeee-legado.pdf'),
       ('avatars', 'avatar/foto.png')`,
  )
}, 60_000)

afterAll(async () => {
  await banco?.fechar()
})

describe('migrações da rodada de QA', () => {
  const novas = () => listarMigracoes().filter((m) => m.arquivo.startsWith('20261006'))

  it('são onze, em ordem, e cada uma pode ser rodada de novo sem erro (SQL Editor)', async () => {
    expect(novas().map((m) => m.arquivo.slice(0, 14))).toEqual(
      Array.from({ length: 11 }, (_, i) => `202610061200${String(i + 1).padStart(2, '0')}`),
    )
    for (const m of novas()) {
      await banco.desfazendo((q) => q.exec(m.sql))
    }
  })
})

/** Executa algo que deve ser recusado sem abortar a transação do teste. */
async function recusado(q: Consulta, sql: string, params: unknown[] = []) {
  await q.exec('savepoint tentativa')
  const erro = await capturarErro(q.query(sql, params))
  await q.exec('rollback to savepoint tentativa')
  return erro
}

// ---------------------------------------------------------------------------
describe('SEG-01 — anexos: a permissão vem do módulo dono do arquivo', () => {
  const nomes = async (q: Consulta) =>
    (
      await q.query<{ name: string }>(
        `select name from storage.objects where bucket_id = 'documentos-anexos' order by name`,
      )
    ).rows.map((r) => r.name)

  it('o perfil gratuito lista anexo de contrato e de inquilino, não o de despesa', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      expect(await nomes(q)).toEqual(['contrato/cccc-assinado.pdf', 'inquilino/aaaa-rg.pdf'])
    })
  })

  it('o perfil gratuito não apaga anexo de despesa, só os dos módulos dele', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      const despesa = await q.query(`delete from storage.objects where name = 'despesa/bbbb-recibo.pdf'`)
      expect(despesa.affectedRows).toBe(0)
      const contrato = await q.query(`delete from storage.objects where name = 'contrato/cccc-assinado.pdf'`)
      expect(contrato.affectedRows).toBe(1)
    })
  })

  it('não dá para "mudar" um anexo de módulo trocando o nome', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      const erro = await capturarErro(
        q.query(`update storage.objects set name = 'despesa/cccc.pdf' where name = 'contrato/cccc-assinado.pdf'`),
      )
      expect(erro.code).toBe('42501')
    })
  })

  it('o perfil gratuito anexa em inquilino/, mas não em despesa/ nem fora de pasta', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      await q.query(`insert into storage.objects (bucket_id, name) values ('documentos-anexos', 'inquilino/novo.pdf')`)
      expect(await nomes(q)).toEqual(['contrato/cccc-assinado.pdf', 'inquilino/aaaa-rg.pdf', 'inquilino/novo.pdf'])
      const outro = await recusado(
        q,
        `insert into storage.objects (bucket_id, name) values ('documentos-anexos', 'despesa/x.pdf')`,
      )
      expect(outro.code).toBe('42501')
      const semPasta = await recusado(
        q,
        `insert into storage.objects (bucket_id, name) values ('documentos-anexos', 'sem-pasta.pdf')`,
      )
      expect(semPasta.code).toBe('42501')
    })
  })

  it('objeto sem pasta (anterior à correção) fica só com o administrador; ele vê tudo', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      expect(await nomes(q)).not.toContain('eeee-legado.pdf')
    })
    await banco.comoUsuario(admin, async (q) => {
      expect(await nomes(q)).toEqual([
        'contrato/cccc-assinado.pdf',
        'despesa/bbbb-recibo.pdf',
        'eeee-legado.pdf',
        'inquilino/aaaa-rg.pdf',
      ])
    })
  })

  it('modulo_do_anexo deriva o módulo da primeira pasta e falha fechando', async () => {
    const { rows } = await banco.db.query<{ nome: string; modulo: string | null }>(
      `select n as nome, public.modulo_do_anexo(n)::text as modulo
         from unnest(array['imovel/a.pdf','inquilino/a.pdf','contrato/a.pdf','fornecedor/a.pdf',
                           'despesa/a.pdf','receita/a.pdf','iptu_taxas/a.pdf',
                           'inquilino','a.pdf','outra/a.pdf','/a.pdf','']) as n`,
    )
    expect(Object.fromEntries(rows.map((r) => [r.nome, r.modulo]))).toEqual({
      'imovel/a.pdf': 'imoveis',
      'inquilino/a.pdf': 'inquilinos',
      'contrato/a.pdf': 'contratos',
      'fornecedor/a.pdf': 'fornecedores',
      'despesa/a.pdf': 'despesas',
      'receita/a.pdf': 'receitas',
      'iptu_taxas/a.pdf': 'iptu_taxas',
      inquilino: null,
      'a.pdf': null,
      'outra/a.pdf': null,
      '/a.pdf': null,
      '': null,
    })
  })
})

// ---------------------------------------------------------------------------
describe('SEG-02 e PRD-02 — cadastro só vale com o token do convite', () => {
  async function convidar(q: Consulta, email: string, token: string, perfil = 'administrador') {
    await q.query(
      `insert into public.convites (email, token, perfil, data_expiracao)
       values ($1, $2, $3, now() + interval '2 days')`,
      [email, token, perfil],
    )
  }

  async function cadastrar(q: Consulta, email: string, token?: string) {
    const meta = token ? { name: 'Quem se cadastrou', convite_token: token } : { name: 'Quem se cadastrou' }
    const { rows } = await q.query<{ id: string }>(
      `insert into auth.users (email, raw_user_meta_data) values ($1, $2::jsonb) returning id`,
      [email, JSON.stringify(meta)],
    )
    const perfil = await q.query<{ perfil: string; ativo: boolean }>(
      `select perfil, ativo from public.users where id = $1`,
      [rows[0].id],
    )
    return { id: rows[0].id, ...perfil.rows[0] }
  }

  const statusDe = async (q: Consulta, token: string) =>
    (await q.query<{ status: string }>(`select status from public.convites where token = $1`, [token])).rows[0].status

  it('quem sabe o e-mail convidado, mas não o token, nasce gratuito inativo (pré-sequestro)', async () => {
    await banco.desfazendo(async (q) => {
      await convidar(q, 'diretor@holding.test', 'tok-secreto')
      const conta = await cadastrar(q, 'Diretor@Holding.test')
      expect(conta).toMatchObject({ perfil: 'gratuito', ativo: false })
      expect(await statusDe(q, 'tok-secreto')).toBe('pendente')
    })
  })

  it('token de outro convite não vale', async () => {
    await banco.desfazendo(async (q) => {
      await convidar(q, 'diretor@holding.test', 'tok-do-diretor')
      await convidar(q, 'outra@holding.test', 'tok-da-outra', 'gratuito')
      const conta = await cadastrar(q, 'diretor@holding.test', 'tok-da-outra')
      expect(conta).toMatchObject({ perfil: 'gratuito', ativo: false })
      expect(await statusDe(q, 'tok-do-diretor')).toBe('pendente')
      expect(await statusDe(q, 'tok-da-outra')).toBe('pendente')
    })
  })

  it('token certo com e-mail diferente do convite não vale', async () => {
    await banco.desfazendo(async (q) => {
      await convidar(q, 'diretor@holding.test', 'tok-do-diretor')
      const conta = await cadastrar(q, 'intruso@holding.test', 'tok-do-diretor')
      expect(conta).toMatchObject({ perfil: 'gratuito', ativo: false })
      expect(await statusDe(q, 'tok-do-diretor')).toBe('pendente')
    })
  })

  it('convite já aceito não vale de novo', async () => {
    await banco.desfazendo(async (q) => {
      await convidar(q, 'diretor@holding.test', 'tok-usado')
      await q.query(`update public.convites set status = 'aceito' where token = 'tok-usado'`)
      const conta = await cadastrar(q, 'diretor@holding.test', 'tok-usado')
      expect(conta).toMatchObject({ perfil: 'gratuito', ativo: false })
    })
  })

  it('token certo e e-mail certo (maiúsculas à parte): perfil do convite, conta ativa, só esse convite aceito', async () => {
    await banco.desfazendo(async (q) => {
      await convidar(q, 'Diretor@Holding.test', 'tok-certo')
      await convidar(q, 'diretor@holding.test', 'tok-outro-pendente', 'gratuito')
      const conta = await cadastrar(q, 'diretor@holding.test', 'tok-certo')
      expect(conta).toMatchObject({ perfil: 'administrador', ativo: true })
      expect(await statusDe(q, 'tok-certo')).toBe('aceito')
      expect(await statusDe(q, 'tok-outro-pendente')).toBe('pendente')
    })
  })

  it('conta sem convite lê zero linhas de todas as tabelas e nenhum arquivo, até um administrador liberar', async () => {
    await banco.desfazendo(async (q) => {
      const tabelas = (
        await q.query<{ tablename: string }>(
          `select tablename from pg_tables where schemaname = 'public'
              and tablename not in ('historias', 'historias_atividades') order by 1`,
        )
      ).rows.map((t) => t.tablename)
      expect(tabelas.length).toBeGreaterThan(15)

      const conta = await cadastrar(q, 'sem.convite@teste.local')
      expect(conta.ativo).toBe(false)

      const lerComo = async (usuario: string) => {
        await q.exec('reset role')
        await q.exec('set local role authenticated')
        await q.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.role', 'authenticated', true)`, [usuario])
        const vistas: Record<string, number> = {}
        for (const t of tabelas) {
          vistas[t] = (await q.query<{ n: number }>(`select count(*)::int as n from public."${t}"`)).rows[0].n
        }
        const arquivos = (await q.query<{ n: number }>(`select count(*)::int as n from storage.objects`)).rows[0].n
        await q.exec('reset role')
        return { vistas, arquivos }
      }

      const antes = await lerComo(conta.id)
      // A única linha que ela enxerga é o próprio perfil.
      expect(antes.vistas.users).toBe(1)
      expect({ ...antes.vistas, users: 0 }).toEqual(Object.fromEntries(tabelas.map((t) => [t, 0])))
      expect(antes.arquivos).toBe(0)

      // O administrador libera em /usuarios: agora ela lê o vocabulário compartilhado.
      await q.exec('set local role authenticated')
      await q.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.role', 'authenticated', true)`, [admin])
      await q.query(`update public.users set ativo = true where id = $1`, [conta.id])
      await q.exec('reset role')
      const depois = await lerComo(conta.id)
      expect(depois.vistas.categorias_financeiras).toBeGreaterThan(0)
    })
  })
})

// ---------------------------------------------------------------------------
describe('CAD-03 — um contrato ativo por unidade, não por imóvel', () => {
  const contrato = (
    q: Consulta,
    imovel: string,
    unidade: string | null,
    inicio: string,
    fim: string | null,
    inquilino = inquilino1,
    status = 'ativo',
  ) =>
    q.query(
      `insert into public.contratos (imovel, unidade_id, inquilino, data_inicio, data_fim, status)
       values ($1, $2, $3, $4, $5, $6)`,
      [imovel, unidade, inquilino, inicio, fim, status],
    )

  it('duas unidades do mesmo prédio podem ser alugadas ao mesmo tempo', async () => {
    await banco.desfazendo(async (q) => {
      await contrato(q, imovelA, unidadeA1, '2026-01-01', '2026-12-31')
      await contrato(q, imovelA, unidadeA2, '2026-06-01', '2027-05-31', inquilino2)
      const { rows } = await q.query<{ status: string }>(
        `select status from public.imovel_unidades where id in ($1, $2)`,
        [unidadeA1, unidadeA2],
      )
      expect(rows.map((r) => r.status)).toEqual(['alugado', 'alugado'])
    })
  })

  it('a mesma unidade não aceita dois contratos ativos que se sobrepõem', async () => {
    await banco.desfazendo(async (q) => {
      await contrato(q, imovelA, unidadeA1, '2026-01-01', '2026-12-31')
      const erro = await recusado(q, `insert into public.contratos (imovel, unidade_id, inquilino, data_inicio, data_fim, status)
        values ($1, $2, $3, '2026-12-31', '2027-12-30', 'ativo')`, [imovelA, unidadeA1, inquilino2])
      expect(erro.code).toBe('23P01')
      expect(erro.message).toContain('contratos_um_ativo_por_unidade')
    })
  })

  it('na mesma unidade vale: vigência seguinte e contrato encerrado não conflitam', async () => {
    await banco.desfazendo(async (q) => {
      await contrato(q, imovelA, unidadeA1, '2026-01-01', '2026-12-31')
      await contrato(q, imovelA, unidadeA1, '2027-01-01', '2027-12-31', inquilino2)
      await contrato(q, imovelA, unidadeA1, '2026-06-01', '2026-09-30', inquilino2, 'encerrado')
    })
  })

  it('imóvel sem unidades continua com um contrato ativo por vez (por imóvel)', async () => {
    await banco.desfazendo(async (q) => {
      const erro = await recusado(q, `insert into public.contratos (imovel, inquilino, data_inicio, data_fim, status)
        values ($1, $2, '2030-06-01', '2031-05-31', 'ativo')`, [imovelC, inquilino2])
      expect(erro.code).toBe('23P01')
      expect(erro.message).toContain('contratos_um_ativo_por_imovel')
      // Fora da vigência do contrato existente, aceita.
      await contrato(q, imovelC, null, '2031-01-01', null, inquilino2)
    })
  })
})

// ---------------------------------------------------------------------------
describe('SEG-08 — o contrato só aceita unidade do próprio imóvel (HA004)', () => {
  it('recusa unidade de outro imóvel e não mexe na unidade alheia', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      const erro = await recusado(q, `insert into public.contratos (imovel, unidade_id, inquilino, status)
        values ($1, $2, $3, 'ativo')`, [imovelA, unidadeB1, inquilino1])
      expect(erro.code).toBe('HA004')
      expect(erro.message).toBe('Esta unidade não pertence ao imóvel do contrato.')
    })
    const { rows } = await banco.db.query<{ status: string; inquilino_atual: string | null }>(
      `select status, inquilino_atual from public.imovel_unidades where id = $1`,
      [unidadeB1],
    )
    expect(rows[0]).toEqual({ status: 'vago', inquilino_atual: null })
  })

  it('recusa trocar, num contrato existente, para unidade de outro imóvel', async () => {
    await banco.desfazendo(async (q) => {
      const contratoId = await q
        .query<{ id: string }>(
          `insert into public.contratos (imovel, unidade_id, inquilino, status)
           values ($1, $2, $3, 'ativo') returning id`,
          [imovelA, unidadeA1, inquilino1],
        )
        .then((r) => r.rows[0].id)
      const erro = await recusado(q, `update public.contratos set unidade_id = $2 where id = $1`, [contratoId, unidadeB1])
      expect(erro.code).toBe('HA004')
    })
  })

  it('o perfil gratuito grava contrato com unidade do próprio imóvel', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      await q.query(
        `insert into public.contratos (imovel, unidade_id, inquilino, status) values ($1, $2, $3, 'ativo')`,
        [imovelA, unidadeA1, inquilino1],
      )
      await q.query(`insert into public.contratos (imovel, inquilino, status) values ($1, $2, 'encerrado')`, [
        imovelB,
        inquilino1,
      ])
    })
  })
})

// ---------------------------------------------------------------------------
describe('SEG-05 — categoria financeira: quem escreve é o dono do tipo', () => {
  it('o perfil gratuito lê as categorias, mas não renomeia, não apaga nem cria nenhuma', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      const { rows } = await q.query(`select 1 from public.categorias_financeiras`)
      expect(rows.length).toBeGreaterThan(0)
      for (const categoria of [categoriaReceita, categoriaDespesa]) {
        const renomeou = await q.query(`update public.categorias_financeiras set nome = 'HACK' where id = $1`, [categoria])
        expect(renomeou.affectedRows).toBe(0)
        const apagou = await q.query(`delete from public.categorias_financeiras where id = $1`, [categoria])
        expect(apagou.affectedRows).toBe(0)
      }
      for (const tipo of ['receita', 'despesa']) {
        const criou = await recusado(q, `insert into public.categorias_financeiras (nome, tipo) values ('Nova', $1)`, [tipo])
        expect(criou.code).toBe('42501')
      }
    })
  })

  it('administrador mexe nas duas', async () => {
    await banco.comoUsuario(admin, async (q) => {
      const r = await q.query(`update public.categorias_financeiras set nome = nome || ' (adm)' where id in ($1, $2)`, [
        categoriaReceita,
        categoriaDespesa,
      ])
      expect(r.affectedRows).toBe(2)
    })
  })
})

// ---------------------------------------------------------------------------
describe('SEG-04 — a trilha de auditoria não guarda dado pessoal em claro', () => {
  type Payload = Record<string, { de?: unknown; para?: unknown; alterado?: boolean }>

  async function payloadsDe(q: Consulta, entidade: string, registro: string): Promise<Payload> {
    await q.exec('reset role')
    const { rows } = await q.query<{ payload: Payload }>(
      `select payload from public.logs_atividade
        where entidade = $1 and registro_id = $2 and acao = 'editou' order by created desc limit 1`,
      [entidade, registro],
    )
    return rows[0].payload
  }

  it('locador: documento e dados bancários viram "alterado"; o nome segue com de/para', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      const locador = (
        await q.query<{ id: string }>(
          `insert into public.locadores (nome_razao_social, tipo_pessoa, cpf_cnpj, dados_bancarios)
           values ('Locador QA', 'pf', '529.982.247-25', 'Banco 001 ag 0001 cc 12345-6') returning id`,
        )
      ).rows[0].id
      await q.query(
        `update public.locadores
            set cpf_cnpj = '111.444.777-35', dados_bancarios = 'Banco 237 ag 1234 cc 98765-4',
                nome_razao_social = 'Locador QA Renomeado'
          where id = $1`,
        [locador],
      )
      const payload = await payloadsDe(q, 'locadores', locador)
      expect(payload.cpf_cnpj).toEqual({ alterado: true })
      expect(payload.dados_bancarios).toEqual({ alterado: true })
      expect(payload.nome_razao_social).toEqual({ de: 'Locador QA', para: 'Locador QA Renomeado' })
      const texto = JSON.stringify(payload)
      for (const segredo of ['529.982.247-25', '111.444.777-35', 'ag 0001', 'ag 1234', '12345-6', '98765-4']) {
        expect(texto).not.toContain(segredo)
      }
    })
  })

  it('fiador: RG, CPF e endereço viram "alterado"', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      const fiador = (
        await q.query<{ id: string }>(
          `insert into public.fiadores (nome, cpf, rg, endereco_completo)
           values ('Fiador QA', '529.982.247-25', '12.345.678-9', 'Rua Velha, 10') returning id`,
        )
      ).rows[0].id
      await q.query(
        `update public.fiadores set cpf = '111.444.777-35', rg = '98.765.432-1', endereco_completo = 'Rua Nova, 20'
          where id = $1`,
        [fiador],
      )
      const payload = await payloadsDe(q, 'fiadores', fiador)
      expect(payload).toEqual({
        cpf: { alterado: true },
        rg: { alterado: true },
        endereco_completo: { alterado: true },
      })
    })
  })

  it('inquilino: telefone, e-mail e endereço viram "alterado"', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      const inquilino = (
        await q.query<{ id: string }>(
          `insert into public.inquilinos (nome, telefone, email, endereco)
           values ('Inquilino QA', '(11) 91111-1111', 'velho@teste.local', 'Rua Velha, 1') returning id`,
        )
      ).rows[0].id
      await q.query(
        `update public.inquilinos set telefone = '(11) 92222-2222', email = 'novo@teste.local',
                                      endereco = 'Rua Nova, 2', nome = 'Inquilino QA 2'
          where id = $1`,
        [inquilino],
      )
      const payload = await payloadsDe(q, 'inquilinos', inquilino)
      expect(payload.telefone).toEqual({ alterado: true })
      expect(payload.email).toEqual({ alterado: true })
      expect(payload.endereco).toEqual({ alterado: true })
      expect(payload.nome).toEqual({ de: 'Inquilino QA', para: 'Inquilino QA 2' })
    })
  })

  it('convite reenviado não grava o token na trilha', async () => {
    await banco.comoUsuario(admin, async (q) => {
      const convite = (
        await q.query<{ id: string }>(
          `insert into public.convites (email, token, perfil, data_expiracao)
           values ('alguem@teste.local', 'tok-antigo-0001', 'gratuito', now() + interval '1 day') returning id`,
        )
      ).rows[0].id
      await q.query(`update public.convites set token = 'tok-novo-0002' where id = $1`, [convite])
      const payload = await payloadsDe(q, 'convites', convite)
      expect(payload).toEqual({ token: { alterado: true } })
    })
  })

  it('toda coluna com cara de dado pessoal das tabelas auditadas está na lista de colunas sensíveis', async () => {
    const { rows } = await banco.db.query<{ tabela: string; coluna: string }>(
      `select c.table_name as tabela, c.column_name as coluna
         from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name in (select event_object_table from information_schema.triggers
                                where trigger_name = 'registrar_log')
          and c.column_name ~ '(cpf|cnpj|^rg$|telefone|email|endereco|dados_bancarios|agencia|^conta$|token|nascimento|conjuge)'
          and c.column_name <> all (public.colunas_sensiveis_do_log())
        order by 1, 2`,
    )
    expect(rows).toEqual([])
  })

  it('a migração também mascara o que já estava gravado, preservando as demais chaves', async () => {
    const migracao = listarMigracoes().find((m) => m.arquivo === '20261006120006_trilha_sem_dado_pessoal.sql')
    expect(migracao).toBeDefined()
    await banco.desfazendo(async (q) => {
      // Linha gravada antes da correção: de/para em claro.
      await q.query(
        `insert into public.logs_atividade (acao, entidade, registro_id, detalhes, payload)
         values ('editou', 'locadores', gen_random_uuid(), 'editou locadores "Antigo"',
                 '{"cpf_cnpj":{"de":"529.982.247-25","para":"111.444.777-35"},
                   "nome_razao_social":{"de":"A","para":"B"}}'::jsonb)`,
      )
      await q.exec(migracao!.sql)
      const { rows } = await q.query<{ payload: Payload }>(
        `select payload from public.logs_atividade where detalhes = 'editou locadores "Antigo"'`,
      )
      expect(rows[0].payload).toEqual({
        cpf_cnpj: { alterado: true },
        nome_razao_social: { de: 'A', para: 'B' },
      })
    })
  })
})

// ---------------------------------------------------------------------------
describe('SEG-17 — o limite de 3 imóveis conta só os imóveis da própria pessoa', () => {
  it('imóveis legados (sem autoria) não bloqueiam o primeiro imóvel de um editor', async () => {
    await banco.comoUsuario(editorLimite, async (q) => {
      await q.query(`insert into public.imoveis (nome, endereco) values ('Meu 1', 'Rua M, 1')`)
    })
  })

  it('os próprios imóveis ativos contam: o 4º é recusado (HA003); inativar libera a vaga', async () => {
    await banco.comoUsuario(editorLimite, async (q) => {
      for (const n of [1, 2, 3]) {
        await q.query(`insert into public.imoveis (nome, endereco) values ($1, 'Rua M')`, [`Meu ${n}`])
      }
      const quarto = await recusado(q, `insert into public.imoveis (nome, endereco) values ('Meu 4', 'Rua M')`)
      expect(quarto.code).toBe('HA003')

      await q.query(`update public.imoveis set status = 'inativo' where nome = 'Meu 1'`)
      await q.query(`insert into public.imoveis (nome, endereco) values ('Meu 4', 'Rua M')`)
    })
  })

  it('administrador não tem limite', async () => {
    await banco.comoUsuario(admin, async (q) => {
      for (const n of [1, 2, 3, 4]) {
        await q.query(`insert into public.imoveis (nome, endereco) values ($1, 'Rua Adm')`, [`Adm ${n}`])
      }
    })
  })
})

// ---------------------------------------------------------------------------
describe('SEG-10 — privilégios mínimos nas tabelas e nas funções', () => {
  it('anon e authenticated não têm TRUNCATE, REFERENCES nem TRIGGER em tabela alguma de public', async () => {
    const { rows } = await banco.db.query<{ grantee: string; tabela: string; privilegio: string }>(
      `select grantee, table_name as tabela, privilege_type as privilegio
         from information_schema.role_table_grants
        where table_schema = 'public' and grantee in ('anon', 'authenticated')
          and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')
        order by 1, 2, 3`,
    )
    expect(rows).toEqual([])
  })

  it('anon só lê o quadro (historias e historias_atividades), nada mais', async () => {
    const { rows } = await banco.db.query<{ tabela: string; privilegios: string }>(
      `select table_name as tabela, string_agg(privilege_type, ',' order by privilege_type) as privilegios
         from information_schema.role_table_grants
        where table_schema = 'public' and grantee = 'anon' group by 1 order by 1`,
    )
    expect(rows).toEqual([
      { tabela: 'historias', privilegios: 'SELECT' },
      { tabela: 'historias_atividades', privilegios: 'SELECT' },
    ])
  })

  it('tabela criada depois não nasce com TRUNCATE, REFERENCES nem TRIGGER', async () => {
    await banco.desfazendo(async (q) => {
      await q.exec(`create table public.tabela_nova_qa (id int)`)
      const { rows } = await q.query<{ privilegio: string }>(
        `select privilege_type as privilegio from information_schema.role_table_grants
          where table_schema = 'public' and table_name = 'tabela_nova_qa'
            and grantee in ('anon', 'authenticated') and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')`,
      )
      expect(rows).toEqual([])
    })
  })

  it('TRUNCATE (que ignora a RLS) é recusado para quem está logado', async () => {
    await banco.comoUsuario(semAcesso, async (q) => {
      const erro = await capturarErro(q.query(`truncate public.imoveis cascade`))
      expect(erro.code).toBe('42501')
    })
  })

  it('a única função de public que o visitante (anon) executa é validar_convite, security invoker inclusa', async () => {
    const { rows } = await banco.db.query<{ nome: string }>(
      `select p.oid::regprocedure::text as nome
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prorettype <> 'trigger'::regtype
          and has_function_privilege('anon', p.oid, 'execute')
        order by 1`,
    )
    expect(rows.map((r) => r.nome)).toEqual(['validar_convite(text)'])
  })

  it('quem está logado segue validando CPF (as CHECK rodam com o privilégio de quem grava)', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      await q.query(`insert into public.inquilinos (nome, cpf) values ('CPF Valido', '529.982.247-25')`)
      const erro = await capturarErro(q.query(`insert into public.inquilinos (nome, cpf) values ('CPF Ruim', '111.111.111-11')`))
      expect(erro.message).toContain('inquilinos_cpf_valido')
    })
  })
})

// ---------------------------------------------------------------------------
describe('FIN-14 — receita e despesa só aceitam categoria, contrato e inquilino coerentes', () => {
  it('receita com categoria de despesa é recusada (HA007); com categoria de receita passa', async () => {
    await banco.comoUsuario(financeiro, async (q) => {
      const erro = await recusado(q, `insert into public.receitas (imovel, categoria) values ($1, $2)`, [imovelA, categoriaDespesa])
      expect(erro.code).toBe('HA007')
      expect(erro.message).toBe('Esta categoria é de despesa e não pode ser usada em receitas.')
      await q.query(`insert into public.receitas (imovel, categoria) values ($1, $2)`, [imovelA, categoriaReceita])
    })
  })

  it('despesa com categoria de receita é recusada (HA007); com categoria de despesa passa', async () => {
    await banco.comoUsuario(financeiro, async (q) => {
      const erro = await recusado(q, `insert into public.despesas (imovel, categoria) values ($1, $2)`, [imovelA, categoriaReceita])
      expect(erro.code).toBe('HA007')
      expect(erro.message).toBe('Esta categoria é de receita e não pode ser usada em despesas.')
      await q.query(`insert into public.despesas (imovel, categoria) values ($1, $2)`, [imovelA, categoriaDespesa])
    })
  })

  it('receita com contrato de outro imóvel é recusada (HA008)', async () => {
    await banco.comoUsuario(financeiro, async (q) => {
      const erro = await recusado(q, `insert into public.receitas (imovel, contrato) values ($1, $2)`, [imovelA, contratoC])
      expect(erro.code).toBe('HA008')
      expect(erro.message).toMatch(/^Este contrato é de outro imóvel\./)
    })
  })

  it('receita com inquilino diferente do contrato é recusada (HA009); o do contrato, ou nenhum, passa', async () => {
    await banco.comoUsuario(financeiro, async (q) => {
      const erro = await recusado(q, `insert into public.receitas (imovel, contrato, inquilino) values ($1, $2, $3)`, [
        imovelC,
        contratoC,
        inquilino2,
      ])
      expect(erro.code).toBe('HA009')
      await q.query(`insert into public.receitas (imovel, contrato, inquilino) values ($1, $2, $3)`, [imovelC, contratoC, inquilino1])
      await q.query(`insert into public.receitas (imovel, contrato) values ($1, $2)`, [imovelC, contratoC])
    })
  })

  it('trocar o imóvel de uma receita que já tem contrato também é conferido', async () => {
    await banco.comoUsuario(financeiro, async (q) => {
      const receita = (
        await q.query<{ id: string }>(`insert into public.receitas (imovel, contrato) values ($1, $2) returning id`, [imovelC, contratoC])
      ).rows[0].id
      const erro = await recusado(q, `update public.receitas set imovel = $2 where id = $1`, [receita, imovelA])
      expect(erro.code).toBe('HA008')
    })
  })

  it('linha antiga incoerente continua editável em outros campos (só se confere o que muda)', async () => {
    await banco.desfazendo(async (q) => {
      // Linha de antes da regra: gatilhos desligados só para montar o cenário.
      await q.exec('set local session_replication_role = replica')
      const receita = (
        await q.query<{ id: string }>(`insert into public.receitas (imovel, categoria) values ($1, $2) returning id`, [imovelA, categoriaDespesa])
      ).rows[0].id
      await q.exec('set local session_replication_role = origin')
      // O formulário reenvia todas as colunas, inclusive as que não mudaram.
      await q.query(`update public.receitas set categoria = categoria, imovel = imovel, descricao = 'ajuste' where id = $1`, [receita])
      // Trocar a categoria para outra errada continua sendo recusado.
      const outra = await id(`insert into public.categorias_financeiras (nome, tipo) values ('Outra despesa QA', 'despesa') returning id`)
      const erro = await recusado(q, `update public.receitas set categoria = $2 where id = $1`, [receita, outra])
      expect(erro.code).toBe('HA007')
    })
  })
})

// ---------------------------------------------------------------------------
describe('FIN-15 — o sistema nunca fica sem administrador ativo (HA005, HA006)', () => {
  const comoAdmin = (quem: string, fn: (q: Consulta) => Promise<void>) => banco.comoUsuario(quem, fn)

  it('o administrador não rebaixa, não desativa e não remove a si mesmo (HA005)', async () => {
    await comoAdmin(admin, async (q) => {
      const rebaixar = await recusado(q, `update public.users set perfil = 'gratuito' where id = $1`, [admin])
      expect(rebaixar.code).toBe('HA005')
      expect(rebaixar.message).toBe('Você não pode rebaixar, desativar nem remover a si mesmo.')
      const desativar = await recusado(q, `update public.users set ativo = false where id = $1`, [admin])
      expect(desativar.code).toBe('HA005')
      const remover = await recusado(q, `delete from public.users where id = $1`, [admin])
      expect(remover.code).toBe('HA005')
    })
  })

  it('editar o próprio nome continua livre', async () => {
    await comoAdmin(admin, async (q) => {
      const r = await q.query(`update public.users set name = 'Admin QA renomeado' where id = $1`, [admin])
      expect(r.affectedRows).toBe(1)
    })
  })

  it('um administrador rebaixa outro enquanto sobrar um ativo; o último ninguém tira (HA006)', async () => {
    await banco.desfazendo(async (q) => {
      // Dois administradores ativos: um rebaixa o outro (como administrador logado).
      await q.exec('set local role authenticated')
      await q.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.role', 'authenticated', true)`, [admin])
      const r = await q.query(`update public.users set perfil = 'gratuito' where id = $1`, [admin2])
      expect(r.affectedRows).toBe(1)
      // Volta a ser o dono do banco, sem sessão (o `set local` da sessão vale até o fim da transação).
      await q.exec('reset role')
      await q.exec(`select set_config('request.jwt.claim.sub', '', true), set_config('request.jwt.claim.role', '', true)`)

      // Sobrou só `admin`: nem o SQL Editor (sem sessão) o rebaixa, desativa ou remove.
      const rebaixar = await recusado(q, `update public.users set perfil = 'gratuito' where id = $1`, [admin])
      expect(rebaixar.code).toBe('HA006')
      expect(rebaixar.message).toMatch(/^Este é o último administrador ativo/)
      const desativar = await recusado(q, `update public.users set ativo = false where id = $1`, [admin])
      expect(desativar.code).toBe('HA006')
      // Nem apagando o login em Authentication → Users (a exclusão cai em cascata).
      const apagar = await recusado(q, `delete from auth.users where id = $1`, [admin])
      expect(apagar.code).toBe('HA006')

      // Promovido outro, o antigo pode sair.
      await q.query(`update public.users set perfil = 'administrador' where id = $1`, [admin2])
      await q.query(`update public.users set perfil = 'gratuito' where id = $1`, [admin])
    })
  })

  it('administrador já inativo ou usuário comum não entram na regra', async () => {
    await banco.desfazendo(async (q) => {
      const comum = await id(`select id from public.users where id = $1`, [gratuito])
      await q.query(`update public.users set ativo = false where id = $1`, [comum])
      await q.query(`delete from public.users where id = $1`, [comum])
    })
  })
})

describe('REG-03 — uma unidade por identificador dentro do mesmo imóvel', () => {
  it('recusa repetir o identificador no mesmo imóvel, sem diferença de maiúsculas nem espaços', async () => {
    for (const repetido of ['Sala 01', 'sala 01 ', 'SALA 01']) {
      await banco.desfazendo(async (q) => {
        const erro = await recusado(
          q,
          `insert into public.imovel_unidades (imovel_id, identificador) values ($1, $2)`,
          [imovelA, repetido],
        )
        expect(erro.code).toBe('23505')
        expect(erro.message).toContain('imovel_unidades_identificador_uidx')
      })
    }
  })

  it('aceita o mesmo identificador em outro imóvel', async () => {
    await banco.desfazendo(async (q) => {
      await q.query(`insert into public.imovel_unidades (imovel_id, identificador) values ($1, 'Sala 01')`, [
        imovelC,
      ])
    })
  })
})
