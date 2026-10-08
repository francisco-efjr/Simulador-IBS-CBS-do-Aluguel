// @vitest-environment node
/**
 * Row Level Security (migração 04): a permissão de módulo é decidida pelo banco.
 *
 * Cada teste roda dentro de uma transação desfeita ao final (comoUsuario /
 * comoAnonimo), então o que um escreve o outro não vê. Os dados de partida são
 * gravados uma vez, como `postgres`, no beforeAll.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { capturarErro, criarBancoDeTeste, listarMigracoes, type BancoDeTeste, type Consulta } from './harness'

let banco: BancoDeTeste

let admin: string
let gratuito: string
let outroGratuito: string
let comLinhaAntiga: string
let inativo: string

let imovel: string
let inquilino: string

/** O que o perfil gratuito acessa (e edita): Imóveis, Inquilinos, Locadores e fiadores, Contratos. */
const TABELAS_DO_GRATUITO = ['imoveis', 'inquilinos', 'contratos', 'documentos_anexos']

/** O resto é só do administrador. */
const TABELAS_SO_DO_ADMINISTRADOR = [
  'fornecedores',
  'receitas',
  'despesas',
  'iptu_taxas',
  'contas_bancarias',
  'importacoes',
  'transacoes_importadas',
]

const TABELAS_DE_NEGOCIO = [...TABELAS_DO_GRATUITO, ...TABELAS_SO_DO_ADMINISTRADOR]

const TODAS_AS_TABELAS = [
  ...TABELAS_DE_NEGOCIO,
  'users',
  'permissoes',
  'categorias_financeiras',
  'convites',
  'logs_atividade',
]

async function contar(q: Consulta, tabela: string): Promise<number> {
  const { rows } = await q.query<{ total: number }>(`select count(*)::int as total from public.${tabela}`)
  return rows[0].total
}

async function inserirImovel(q: Consulta, nome = 'Sala 101'): Promise<string> {
  const { rows } = await q.query<{ id: string }>(
    `insert into public.imoveis (nome, endereco) values ($1, 'Rua Teste, 1') returning id`,
    [nome],
  )
  return rows[0].id
}

beforeAll(async () => {
  banco = await criarBancoDeTeste()

  admin = await banco.criarUsuario({ perfil: 'administrador' })
  gratuito = await banco.criarUsuario()
  outroGratuito = await banco.criarUsuario()
  comLinhaAntiga = await banco.criarUsuario()
  inativo = await banco.criarUsuario({ ativo: false })

  // Dados de partida, gravados como postgres (fora da RLS). Cada tabela de
  // negócio ganha ao menos uma linha, para que "não vê nada" signifique algo.
  const { db } = banco
  // Permissão por módulo gravada antes do perfil gratuito: não pode mais ampliar
  // nem restringir o acesso.
  await db.query(
    `insert into public.permissoes (usuario, modulo, nivel) values
       ($1, 'receitas', 'edicao'), ($1, 'fornecedores', 'visualizacao'), ($1, 'imoveis', 'sem_acesso')`,
    [comLinhaAntiga],
  )
  imovel = (
    await db.query<{ id: string }>(
      `insert into public.imoveis (nome, endereco) values ('Casa da Praia', 'Av. Atlântica, 10') returning id`,
    )
  ).rows[0].id
  inquilino = (
    await db.query<{ id: string }>(`insert into public.inquilinos (nome) values ('Maria Souza') returning id`)
  ).rows[0].id
  await db.query(`insert into public.fornecedores (nome) values ('Elétrica Silva')`)
  await db.query(
    `insert into public.contratos (numero, imovel, inquilino, valor_aluguel) values ('C-1', $1, $2, 2500)`,
    [imovel, inquilino],
  )
  await db.query(`insert into public.receitas (imovel, descricao, valor) values ($1, 'Aluguel de setembro', 2500)`, [
    imovel,
  ])
  await db.query(`insert into public.despesas (imovel, descricao, valor) values ($1, 'Pintura', 800)`, [imovel])
  await db.query(`insert into public.iptu_taxas (imovel, valor) values ($1, 1200)`, [imovel])
  const conta = (
    await db.query<{ id: string }>(`insert into public.contas_bancarias (nome) values ('Conta principal') returning id`)
  ).rows[0].id
  const importacao = (
    await db.query<{ id: string }>(
      `insert into public.importacoes (conta_bancaria, arquivo_nome, formato) values ($1, 'extrato.ofx', 'ofx') returning id`,
      [conta],
    )
  ).rows[0].id
  await db.query(
    `insert into public.transacoes_importadas (importacao, data, descricao, valor, tipo)
     values ($1, current_date, 'PIX recebido', 2500, 'credito')`,
    [importacao],
  )
  await db.query(
    `insert into public.documentos_anexos (entidade_tipo, entidade_id, arquivo) values ('imovel', $1, 'planta.pdf')`,
    [imovel],
  )
  await db.query(
    `insert into public.documentos_anexos (entidade_tipo, entidade_id, arquivo) values ('inquilino', $1, 'rg.pdf')`,
    [inquilino],
  )
  await db.query(
    `insert into public.convites (email, token, data_expiracao) values ('novo@teste.local', 'tok-rls', now() + interval '1 day')`,
  )
}, 60_000)

afterAll(async () => {
  await banco?.fechar()
})

describe('RLS — perfil gratuito: o que acessa', () => {
  it.each(TABELAS_DO_GRATUITO)('lê %s', async (tabela) => {
    await banco.comoUsuario(gratuito, async (q) => {
      expect(await contar(q, tabela)).toBeGreaterThan(0)
    })
  })

  it('cria, altera e apaga imóvel', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      const novo = await inserirImovel(q, 'Loja nova')
      const alterado = await q.query(`update public.imoveis set nome = 'Loja reformada' where id = $1`, [novo])
      expect(alterado.affectedRows).toBe(1)
      const apagado = await q.query(`delete from public.imoveis where id = $1`, [novo])
      expect(apagado.affectedRows).toBe(1)
    })
  })

  it('cria inquilino, locador, fiador e contrato', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      const novoInquilino = (
        await q.query<{ id: string }>(`insert into public.inquilinos (nome) values ('João Prado') returning id`)
      ).rows[0].id
      await q.query(`insert into public.locadores (nome_razao_social, tipo_pessoa) values ('Holding Aguiar', 'pj')`)
      await q.query(`insert into public.fiadores (nome) values ('Pedro Lima')`)
      const outroImovel = await inserirImovel(q, 'Sala 202')
      await q.query(
        `insert into public.contratos (numero, imovel, inquilino, valor_aluguel) values ('C-2', $1, $2, 1800)`,
        [outroImovel, novoInquilino],
      )
      expect(await contar(q, 'contratos')).toBe(2)
    })
  })

  it('anexa documento em imóvel', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      await q.query(
        `insert into public.documentos_anexos (entidade_tipo, entidade_id, arquivo) values ('imovel', $1, 'x.pdf')`,
        [imovel],
      )
      expect(await contar(q, 'documentos_anexos')).toBe(3)
    })
  })

  it('lê as categorias financeiras, que são vocabulário compartilhado', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      expect(await contar(q, 'categorias_financeiras')).toBe(13)
    })
  })

  it('a decisão do banco é edição nos quatro módulos e nada fora deles', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      const { rows } = await q.query<{ modulo: string; nivel: string }>(
        `select m::text as modulo, public.nivel_no_modulo(m)::text as nivel
           from unnest(enum_range(null::public.modulo_permissao)) m
          order by 1`,
      )
      const comAcesso = rows.filter((r) => r.nivel !== 'sem_acesso')
      expect(comAcesso).toEqual([
        { modulo: 'contratos', nivel: 'edicao' },
        { modulo: 'imoveis', nivel: 'edicao' },
        { modulo: 'inquilinos', nivel: 'edicao' },
        { modulo: 'locadores', nivel: 'edicao' },
      ])
    })
  })
})

describe('migração do perfil gratuito', () => {
  it('pode ser rodada de novo sem erro (SQL Editor) e não traz o perfil antigo de volta', async () => {
    const migracao = listarMigracoes().find((m) => m.arquivo.startsWith('20261008120001'))
    expect(migracao).toBeDefined()
    await banco.desfazendo(async (q) => {
      await q.exec(migracao!.sql)
      const { rows } = await q.query<{ perfil: string }>(
        `select unnest(enum_range(null::public.perfil_usuario))::text as perfil`,
      )
      expect(rows.map((r) => r.perfil)).toEqual(['administrador', 'gratuito'])
    })
  })
})

describe('RLS — perfil gratuito: o que fica de fora', () => {
  it.each(TABELAS_SO_DO_ADMINISTRADOR)('não lê nada em %s', async (tabela) => {
    await banco.comoUsuario(gratuito, async (q) => {
      expect(await contar(q, tabela)).toBe(0)
    })
  })

  it('não lança receita nem despesa', async () => {
    const receita = await banco.comoUsuario(gratuito, (q) =>
      capturarErro(q.query(`insert into public.receitas (imovel, valor) values ($1, 100)`, [imovel])),
    )
    const despesa = await banco.comoUsuario(gratuito, (q) =>
      capturarErro(q.query(`insert into public.despesas (imovel, valor) values ($1, 50)`, [imovel])),
    )
    expect(receita.code).toBe('42501')
    expect(despesa.code).toBe('42501')
  })

  it('não cria fornecedor nem categoria financeira', async () => {
    const fornecedor = await banco.comoUsuario(gratuito, (q) =>
      capturarErro(q.query(`insert into public.fornecedores (nome) values ('Fornecedor X')`)),
    )
    const categoria = await banco.comoUsuario(gratuito, (q) =>
      capturarErro(q.query(`insert into public.categorias_financeiras (nome, tipo) values ('Luvas', 'receita')`)),
    )
    expect(fornecedor.code).toBe('42501')
    expect(categoria.code).toBe('42501')
  })

  it('não altera nem apaga o que é do administrador', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      expect((await q.query(`update public.receitas set valor = 1`)).affectedRows).toBe(0)
      expect((await q.query(`delete from public.despesas`)).affectedRows).toBe(0)
    })
    expect(await contar(banco.db, 'receitas')).toBe(1)
  })

  it('não lê a trilha de auditoria nem os convites', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      expect(await contar(q, 'logs_atividade')).toBe(0)
      expect(await contar(q, 'convites')).toBe(0)
    })
  })

  it('linha antiga em permissoes não amplia nem restringe o acesso', async () => {
    await banco.comoUsuario(comLinhaAntiga, async (q) => {
      expect(await contar(q, 'receitas')).toBe(0)
      expect(await contar(q, 'fornecedores')).toBe(0)
      expect(await contar(q, 'imoveis')).toBe(1)
      const erro = await capturarErro(q.query(`insert into public.receitas (imovel, valor) values ($1, 100)`, [imovel]))
      expect(erro.code).toBe('42501')
    })
  })
})

describe('RLS — conta inativa', () => {
  it.each(TABELAS_DE_NEGOCIO)('não lê nada em %s', async (tabela) => {
    await banco.comoUsuario(inativo, async (q) => {
      expect(await contar(q, tabela)).toBe(0)
    })
  })

  it('não cria, não altera e não lê nem as categorias', async () => {
    await banco.comoUsuario(inativo, async (q) => {
      expect(await contar(q, 'categorias_financeiras')).toBe(0)
      expect((await q.query(`update public.imoveis set nome = 'Invadido' where id = $1`, [imovel])).affectedRows).toBe(0)
      expect((await capturarErro(inserirImovel(q))).code).toBe('42501')
    })
    const { rows } = await banco.db.query<{ nome: string }>(`select nome from public.imoveis where id = $1`, [imovel])
    expect(rows[0].nome).toBe('Casa da Praia')
  })
})

describe('RLS — administrador', () => {
  it.each(TABELAS_DE_NEGOCIO)('lê tudo em %s', async (tabela) => {
    await banco.comoUsuario(admin, async (q) => {
      expect(await contar(q, tabela)).toBeGreaterThan(0)
    })
  })

  it('escreve em qualquer módulo, sem linha em permissoes', async () => {
    await banco.comoUsuario(admin, async (q) => {
      await inserirImovel(q, 'Galpão')
      await q.query(`insert into public.fornecedores (nome) values ('Hidráulica Lima')`)
      await q.query(`insert into public.contas_bancarias (nome) values ('Conta reserva')`)
      await q.query(`insert into public.receitas (imovel, valor) values ($1, 100)`, [imovel])
      await q.query(`insert into public.categorias_financeiras (nome, tipo) values ('Luvas', 'receita')`)
      expect(await contar(q, 'fornecedores')).toBe(2)
      const apagado = await q.query(`delete from public.documentos_anexos`)
      expect(apagado.affectedRows).toBe(2)
    })
  })

  it('cadastra mais de 3 imóveis (sem o limite do gratuito)', async () => {
    await banco.comoUsuario(admin, async (q) => {
      for (let i = 1; i <= 4; i++) await inserirImovel(q, `Sala ${i}`)
      expect(await contar(q, 'imoveis')).toBe(5)
    })
  })

  it('vê todos os perfis e administra convites', async () => {
    await banco.comoUsuario(admin, async (q) => {
      expect(await contar(q, 'users')).toBe(5)
      expect(await contar(q, 'convites')).toBe(1)
    })
  })

  it('o banco decide edição em todos os módulos', async () => {
    await banco.comoUsuario(admin, async (q) => {
      const { rows } = await q.query<{ nivel: string }>(
        `select distinct public.nivel_no_modulo(m)::text as nivel
           from unnest(enum_range(null::public.modulo_permissao)) m`,
      )
      expect(rows).toEqual([{ nivel: 'edicao' }])
    })
  })
})

describe('RLS — anônimo', () => {
  it.each(TODAS_AS_TABELAS)('não lê %s', async (tabela) => {
    const erro = await banco.comoAnonimo((q) => capturarErro(contar(q, tabela)))
    expect(erro.code).toBe('42501')
  })

  it('não escreve', async () => {
    const erro = await banco.comoAnonimo((q) => capturarErro(inserirImovel(q)))
    expect(erro.code).toBe('42501')
  })

  it('valida convite pelo token, e só aquele convite', async () => {
    await banco.comoAnonimo(async (q) => {
      const valido = await q.query<{ valido: boolean; email: string }>(`select * from public.validar_convite('tok-rls')`)
      expect(valido.rows[0]).toMatchObject({ valido: true, email: 'novo@teste.local' })
      const invalido = await q.query<{ valido: boolean; email: string | null }>(
        `select * from public.validar_convite('chute')`,
      )
      expect(invalido.rows[0]).toMatchObject({ valido: false, email: null })
    })
  })

  // Corrigido na migração 20260919120004 (11.6): a função é security definer e
  // herdava EXECUTE de anon; qualquer visitante a disparava por /rest/v1/rpc.
  it('anônimo não consegue executar marcar_lancamentos_em_atraso()', async () => {
    const erro = await banco.comoAnonimo((q) => capturarErro(q.query(`select public.marcar_lancamentos_em_atraso()`)))
    expect(erro.code).toBe('42501')
  })
})

describe('EXECUTE das funções security definer', () => {
  type Funcao = { nome: string; gatilho: boolean; anon: boolean; authenticated: boolean; publico: boolean }

  /**
   * Toda função security definer de public, com quem pode executá-la. Função
   * nova entra aqui sozinha: se nascer aberta a anon, estes testes pegam.
   */
  async function funcoesSecurityDefiner(): Promise<Funcao[]> {
    const { rows } = await banco.db.query<Funcao>(
      `select p.oid::regprocedure::text as nome,
              p.prorettype = 'trigger'::regtype as gatilho,
              has_function_privilege('anon', p.oid, 'execute') as anon,
              has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
              exists (
                select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                 where a.grantee = 0 and a.privilege_type = 'EXECUTE'
              ) as publico
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prosecdef
        order by 1`,
    )
    return rows
  }

  const ABERTA_AO_VISITANTE = 'validar_convite(text)'
  const USADAS_NA_RLS = [
    'eh_administrador()',
    'nivel_no_modulo(modulo_permissao)',
    'pode_editar(modulo_permissao)',
    'pode_ver(modulo_permissao)',
    'usuario_ativo()',
  ]

  it('a consulta enxerga as funções (não passa por estar vazia)', async () => {
    const nomes = (await funcoesSecurityDefiner()).map((f) => f.nome)
    expect(nomes).toEqual(
      expect.arrayContaining([ABERTA_AO_VISITANTE, 'marcar_lancamentos_em_atraso()', ...USADAS_NA_RLS]),
    )
  })

  it('nenhuma é executável por anon, exceto validar_convite', async () => {
    const abertas = (await funcoesSecurityDefiner()).filter((f) => f.anon).map((f) => f.nome)
    expect(abertas).toEqual([ABERTA_AO_VISITANTE])
  })

  it('nenhuma herda EXECUTE de PUBLIC', async () => {
    const herdadas = (await funcoesSecurityDefiner()).filter((f) => f.publico).map((f) => f.nome)
    expect(herdadas).toEqual([])
  })

  it('funções de gatilho não são executáveis pelas roles da API', async () => {
    const gatilhos = (await funcoesSecurityDefiner()).filter((f) => f.gatilho)
    expect(gatilhos.length).toBeGreaterThan(0)
    expect(gatilhos.filter((f) => f.anon || f.authenticated).map((f) => f.nome)).toEqual([])
  })

  it('authenticated executa só as funções da RLS e validar_convite', async () => {
    const liberadas = (await funcoesSecurityDefiner()).filter((f) => f.authenticated).map((f) => f.nome)
    expect([...liberadas].sort()).toEqual([...USADAS_NA_RLS, ABERTA_AO_VISITANTE].sort())
  })

  it('nem o administrador logado dispara marcar_lancamentos_em_atraso() por /rpc', async () => {
    const erro = await banco.comoUsuario(admin, (q) =>
      capturarErro(q.query(`select public.marcar_lancamentos_em_atraso()`)),
    )
    expect(erro.code).toBe('42501')
  })

  it('a RLS continua decidindo para authenticated depois do revoke', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      const { rows } = await q.query<{ ver: boolean; editar: boolean; receitas: boolean }>(
        `select public.pode_ver('imoveis') as ver, public.pode_editar('imoveis') as editar,
                public.pode_ver('receitas') as receitas`,
      )
      expect(rows[0]).toEqual({ ver: true, editar: true, receitas: false })
    })
  })
})

describe('RLS — identidade e permissões', () => {
  it('usuário comum só enxerga o próprio perfil', async () => {
    await banco.comoUsuario(comLinhaAntiga, async (q) => {
      const { rows } = await q.query<{ id: string }>(`select id from public.users`)
      expect(rows).toEqual([{ id: comLinhaAntiga }])
    })
  })

  it('usuário comum só enxerga as próprias permissões', async () => {
    await banco.comoUsuario(comLinhaAntiga, async (q) => {
      const { rows } = await q.query<{ usuario: string }>(`select distinct usuario from public.permissoes`)
      expect(rows).toEqual([{ usuario: comLinhaAntiga }])
    })
  })

  it('usuário comum não se concede permissão', async () => {
    await banco.comoUsuario(comLinhaAntiga, async (q) => {
      const erro = await capturarErro(
        q.query(`insert into public.permissoes (usuario, modulo, nivel) values ($1, 'despesas', 'edicao')`, [comLinhaAntiga]),
      )
      expect(erro.code).toBe('42501')
    })
  })

  it('usuário comum não sobe o próprio nível', async () => {
    await banco.comoUsuario(comLinhaAntiga, async (q) => {
      const alterado = await q.query(`update public.permissoes set nivel = 'edicao' where usuario = $1`, [comLinhaAntiga])
      expect(alterado.affectedRows).toBe(0)
      const apagado = await q.query(`delete from public.permissoes where usuario = $1`, [comLinhaAntiga])
      expect(apagado.affectedRows).toBe(0)
    })
    const { rows } = await banco.db.query<{ nivel: string }>(
      `select nivel from public.permissoes where usuario = $1 and modulo = 'fornecedores'`,
      [comLinhaAntiga],
    )
    expect(rows).toEqual([{ nivel: 'visualizacao' }])
  })

  it('usuário comum não altera o perfil de outra pessoa', async () => {
    await banco.comoUsuario(comLinhaAntiga, async (q) => {
      const alterado = await q.query(`update public.users set name = 'Hackeado' where id = $1`, [gratuito])
      expect(alterado.affectedRows).toBe(0)
    })
  })

  it('usuário comum não cria perfil diretamente', async () => {
    await banco.comoUsuario(comLinhaAntiga, async (q) => {
      const erro = await capturarErro(
        q.query(`insert into public.users (id, email, perfil) values ($1, 'x@teste.local', 'administrador')`, [
          gratuito,
        ]),
      )
      expect(erro.code).toBe('42501')
    })
  })
})

describe('RLS — logs_atividade', () => {
  it('só o administrador lê a trilha', async () => {
    await banco.comoUsuario(admin, async (q) => {
      expect(await contar(q, 'logs_atividade')).toBeGreaterThan(0)
    })
    for (const quem of [gratuito, outroGratuito, inativo]) {
      await banco.comoUsuario(quem, async (q) => {
        expect(await contar(q, 'logs_atividade')).toBe(0)
      })
    }
  })

  it('ninguém altera nem apaga a trilha, nem o administrador', async () => {
    const antes = await contar(banco.db, 'logs_atividade')
    for (const quem of [admin, gratuito]) {
      await banco.comoUsuario(quem, async (q) => {
        const alterado = await q.query(`update public.logs_atividade set detalhes = 'apagado'`)
        const apagado = await q.query(`delete from public.logs_atividade`)
        expect(alterado.affectedRows).toBe(0)
        expect(apagado.affectedRows).toBe(0)
      })
    }
    expect(await contar(banco.db, 'logs_atividade')).toBe(antes)
  })

  it('ninguém forja entrada na trilha à mão', async () => {
    for (const quem of [admin, gratuito]) {
      const erro = await banco.comoUsuario(quem, (q) =>
        capturarErro(q.query(`insert into public.logs_atividade (acao, entidade, detalhes) values ('criou', 'imoveis', 'falso')`)),
      )
      expect(erro.code).toBe('42501')
    }
  })
})

describe('RLS — arquivos (storage)', () => {
  beforeAll(async () => {
    await banco.db.query(
      `insert into storage.objects (bucket_id, name) values
         ('imoveis-fotos', 'fachada.jpg'),
         ('contratos-documentos', 'C-1.pdf'),
         ('avatars', $1 || '/foto.png')`,
      [outroGratuito],
    )
  })

  it('arquivo segue o módulo do bucket: o gratuito vê e envia foto de imóvel e documento de contrato', async () => {
    await banco.comoUsuario(outroGratuito, async (q) => {
      const { rows } = await q.query<{ bucket_id: string }>(
        `select bucket_id from storage.objects where bucket_id <> 'avatars' order by 1`,
      )
      expect(rows).toEqual([{ bucket_id: 'contratos-documentos' }, { bucket_id: 'imoveis-fotos' }])
      await q.query(`insert into storage.objects (bucket_id, name) values ('imoveis-fotos', 'nova.jpg')`)
    })
  })

  it('conta inativa não vê arquivo de módulo nenhum', async () => {
    await banco.comoUsuario(inativo, async (q) => {
      const { rows } = await q.query(`select 1 from storage.objects where bucket_id <> 'avatars'`)
      expect(rows).toHaveLength(0)
    })
  })

  it('avatar só se grava na pasta do próprio id', async () => {
    await banco.comoUsuario(gratuito, async (q) => {
      await q.query(`insert into storage.objects (bucket_id, name) values ('avatars', $1 || '/eu.png')`, [gratuito])
      const apagado = await q.query(`delete from storage.objects where bucket_id = 'avatars' and name like $1 || '%'`, [
        outroGratuito,
      ])
      expect(apagado.affectedRows).toBe(0)
      // Por último: depois de um erro a transação fica abortada.
      const erro = await capturarErro(
        q.query(`insert into storage.objects (bucket_id, name) values ('avatars', $1 || '/outro.png')`, [outroGratuito]),
      )
      expect(erro.code).toBe('42501')
    })
  })

  it('anônimo não vê arquivo algum', async () => {
    await banco.comoAnonimo(async (q) => {
      expect((await q.query(`select 1 from storage.objects`)).rows).toHaveLength(0)
    })
  })
})
