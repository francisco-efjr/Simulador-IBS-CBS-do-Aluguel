// @vitest-environment node
/**
 * Row Level Security (migração 04): a permissão de módulo é decidida pelo banco.
 *
 * Cada teste roda dentro de uma transação desfeita ao final (comoUsuario /
 * comoAnonimo), então o que um escreve o outro não vê. Os dados de partida são
 * gravados uma vez, como `postgres`, no beforeAll.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { capturarErro, criarBancoDeTeste, type BancoDeTeste, type Consulta } from './harness'

let banco: BancoDeTeste

let admin: string
let semPermissao: string
let semAcessoExplicito: string
let leitor: string
let editor: string
let inativo: string

let imovel: string
let inquilino: string

const TABELAS_DE_NEGOCIO = [
  'imoveis',
  'inquilinos',
  'fornecedores',
  'contratos',
  'receitas',
  'despesas',
  'iptu_taxas',
  'contas_bancarias',
  'importacoes',
  'transacoes_importadas',
  'documentos_anexos',
]

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
  semPermissao = await banco.criarUsuario()
  semAcessoExplicito = await banco.criarUsuario({ permissoes: { imoveis: 'sem_acesso' } })
  leitor = await banco.criarUsuario({ permissoes: { imoveis: 'visualizacao', receitas: 'visualizacao' } })
  editor = await banco.criarUsuario({
    permissoes: {
      imoveis: 'edicao',
      inquilinos: 'edicao',
      contratos: 'edicao',
      receitas: 'edicao',
      despesas: 'edicao',
      iptu_taxas: 'edicao',
    },
  })
  inativo = await banco.criarUsuario({ ativo: false, permissoes: { imoveis: 'edicao' } })

  // Dados de partida, gravados como postgres (fora da RLS). Cada tabela de
  // negócio ganha ao menos uma linha, para que "não vê nada" signifique algo.
  const { db } = banco
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
    `insert into public.convites (email, token, data_expiracao) values ('novo@teste.local', 'tok-rls', now() + interval '1 day')`,
  )
}, 60_000)

afterAll(async () => {
  await banco?.fechar()
})

describe('RLS — usuário sem permissão (fail-closed, S-04)', () => {
  it.each(TABELAS_DE_NEGOCIO)('não lê nada em %s', async (tabela) => {
    await banco.comoUsuario(semPermissao, async (q) => {
      expect(await contar(q, tabela)).toBe(0)
    })
  })

  it('não cria imóvel', async () => {
    const erro = await banco.comoUsuario(semPermissao, (q) => capturarErro(inserirImovel(q)))
    expect(erro.code).toBe('42501')
  })

  it('não altera nem apaga imóvel existente', async () => {
    await banco.comoUsuario(semPermissao, async (q) => {
      const alterado = await q.query(`update public.imoveis set nome = 'Invadido' where id = $1`, [imovel])
      const apagado = await q.query(`delete from public.receitas`)
      expect(alterado.affectedRows).toBe(0)
      expect(apagado.affectedRows).toBe(0)
    })
    const { rows } = await banco.db.query<{ nome: string }>(`select nome from public.imoveis where id = $1`, [imovel])
    expect(rows[0].nome).toBe('Casa da Praia')
  })

  it("linha explícita 'sem_acesso' também barra", async () => {
    await banco.comoUsuario(semAcessoExplicito, async (q) => {
      expect(await contar(q, 'imoveis')).toBe(0)
      expect((await capturarErro(inserirImovel(q))).code).toBe('42501')
    })
  })

  it('usuário inativo não acessa nada, mesmo com edição concedida', async () => {
    await banco.comoUsuario(inativo, async (q) => {
      expect(await contar(q, 'imoveis')).toBe(0)
      expect(await contar(q, 'categorias_financeiras')).toBe(0)
      expect((await capturarErro(inserirImovel(q))).code).toBe('42501')
    })
  })

  it('lê as categorias financeiras, que são vocabulário compartilhado', async () => {
    await banco.comoUsuario(semPermissao, async (q) => {
      expect(await contar(q, 'categorias_financeiras')).toBe(13)
    })
  })
})

describe("RLS — nível 'visualizacao'", () => {
  it('lê o módulo concedido', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      expect(await contar(q, 'imoveis')).toBe(1)
      expect(await contar(q, 'receitas')).toBe(1)
    })
  })

  it('não lê módulo que não recebeu', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      expect(await contar(q, 'despesas')).toBe(0)
      expect(await contar(q, 'contratos')).toBe(0)
      expect(await contar(q, 'inquilinos')).toBe(0)
    })
  })

  it('não cria', async () => {
    const erro = await banco.comoUsuario(leitor, (q) => capturarErro(inserirImovel(q)))
    expect(erro.code).toBe('42501')
  })

  it('não altera nem apaga', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      const alterado = await q.query(`update public.imoveis set nome = 'Outro' where id = $1`, [imovel])
      const apagado = await q.query(`delete from public.receitas`)
      expect(alterado.affectedRows).toBe(0)
      expect(apagado.affectedRows).toBe(0)
    })
  })

  it('anexo herda o módulo da entidade: lê o anexo de imóvel', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      expect(await contar(q, 'documentos_anexos')).toBe(1)
      const erro = await capturarErro(
        q.query(
          `insert into public.documentos_anexos (entidade_tipo, entidade_id, arquivo) values ('imovel', $1, 'x.pdf')`,
          [imovel],
        ),
      )
      expect(erro.code).toBe('42501')
    })
  })
})

describe("RLS — nível 'edicao'", () => {
  it('cria, altera e apaga no módulo concedido', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const novo = await inserirImovel(q, 'Loja nova')
      const alterado = await q.query(`update public.imoveis set nome = 'Loja reformada' where id = $1`, [novo])
      expect(alterado.affectedRows).toBe(1)
      const apagado = await q.query(`delete from public.imoveis where id = $1`, [novo])
      expect(apagado.affectedRows).toBe(1)
    })
  })

  it('lança receita e despesa no imóvel existente', async () => {
    await banco.comoUsuario(editor, async (q) => {
      await q.query(`insert into public.receitas (imovel, valor) values ($1, 100)`, [imovel])
      await q.query(`insert into public.despesas (imovel, valor) values ($1, 50)`, [imovel])
      expect(await contar(q, 'receitas')).toBe(2)
      expect(await contar(q, 'despesas')).toBe(2)
    })
  })

  it('não escreve em módulo que não recebeu', async () => {
    await banco.comoUsuario(editor, async (q) => {
      expect(await contar(q, 'fornecedores')).toBe(0)
      const erro = await capturarErro(q.query(`insert into public.fornecedores (nome) values ('Fornecedor X')`))
      expect(erro.code).toBe('42501')
    })
  })

  it('cria categoria financeira (tem edição em receitas)', async () => {
    await banco.comoUsuario(editor, async (q) => {
      await q.query(`insert into public.categorias_financeiras (nome, tipo) values ('Luvas', 'receita')`)
      expect(await contar(q, 'categorias_financeiras')).toBe(14)
    })
  })

  it('não lê a trilha de auditoria nem os convites', async () => {
    await banco.comoUsuario(editor, async (q) => {
      expect(await contar(q, 'logs_atividade')).toBe(0)
      expect(await contar(q, 'convites')).toBe(0)
    })
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
      expect(await contar(q, 'fornecedores')).toBe(2)
      const apagado = await q.query(`delete from public.documentos_anexos`)
      expect(apagado.affectedRows).toBe(1)
    })
  })

  it('vê todos os perfis e administra permissões e convites', async () => {
    await banco.comoUsuario(admin, async (q) => {
      expect(await contar(q, 'users')).toBe(6)
      await q.query(`insert into public.permissoes (usuario, modulo, nivel) values ($1, 'fornecedores', 'edicao')`, [
        semPermissao,
      ])
      const alterado = await q.query(`update public.permissoes set nivel = 'edicao' where usuario = $1`, [leitor])
      expect(alterado.affectedRows).toBe(2)
      expect(await contar(q, 'convites')).toBe(1)
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
    await banco.comoUsuario(leitor, async (q) => {
      const { rows } = await q.query<{ ver: boolean; editar: boolean }>(
        `select public.pode_ver('imoveis') as ver, public.pode_editar('imoveis') as editar`,
      )
      expect(rows[0]).toEqual({ ver: true, editar: false })
    })
  })
})

describe('RLS — identidade e permissões', () => {
  it('usuário comum só enxerga o próprio perfil', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      const { rows } = await q.query<{ id: string }>(`select id from public.users`)
      expect(rows).toEqual([{ id: leitor }])
    })
  })

  it('usuário comum só enxerga as próprias permissões', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      const { rows } = await q.query<{ usuario: string }>(`select distinct usuario from public.permissoes`)
      expect(rows).toEqual([{ usuario: leitor }])
    })
  })

  it('usuário comum não se concede permissão', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      const erro = await capturarErro(
        q.query(`insert into public.permissoes (usuario, modulo, nivel) values ($1, 'despesas', 'edicao')`, [leitor]),
      )
      expect(erro.code).toBe('42501')
    })
  })

  it('usuário comum não sobe o próprio nível', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      const alterado = await q.query(`update public.permissoes set nivel = 'edicao' where usuario = $1`, [leitor])
      expect(alterado.affectedRows).toBe(0)
      const apagado = await q.query(`delete from public.permissoes where usuario = $1`, [leitor])
      expect(apagado.affectedRows).toBe(0)
    })
    const { rows } = await banco.db.query<{ nivel: string }>(
      `select distinct nivel from public.permissoes where usuario = $1`,
      [leitor],
    )
    expect(rows).toEqual([{ nivel: 'visualizacao' }])
  })

  it('usuário comum não altera o perfil de outra pessoa', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      const alterado = await q.query(`update public.users set name = 'Hackeado' where id = $1`, [editor])
      expect(alterado.affectedRows).toBe(0)
    })
  })

  it('usuário comum não cria perfil diretamente', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      const erro = await capturarErro(
        q.query(`insert into public.users (id, email, perfil) values ($1, 'x@teste.local', 'administrador')`, [
          editor,
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
    for (const quem of [semPermissao, leitor, editor]) {
      await banco.comoUsuario(quem, async (q) => {
        expect(await contar(q, 'logs_atividade')).toBe(0)
      })
    }
  })

  it('ninguém altera nem apaga a trilha, nem o administrador', async () => {
    const antes = await contar(banco.db, 'logs_atividade')
    for (const quem of [admin, editor]) {
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
    for (const quem of [admin, editor]) {
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
      [leitor],
    )
  })

  it('arquivo segue a permissão do módulo do bucket', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      const { rows } = await q.query<{ bucket_id: string }>(
        `select bucket_id from storage.objects where bucket_id <> 'avatars'`,
      )
      expect(rows).toEqual([{ bucket_id: 'imoveis-fotos' }])
      const erro = await capturarErro(
        q.query(`insert into storage.objects (bucket_id, name) values ('imoveis-fotos', 'nova.jpg')`),
      )
      expect(erro.code).toBe('42501')
    })
  })

  it('sem permissão não vê arquivo de módulo nenhum', async () => {
    await banco.comoUsuario(semPermissao, async (q) => {
      const { rows } = await q.query(`select 1 from storage.objects where bucket_id <> 'avatars'`)
      expect(rows).toHaveLength(0)
    })
  })

  it('avatar só se grava na pasta do próprio id', async () => {
    await banco.comoUsuario(editor, async (q) => {
      await q.query(`insert into storage.objects (bucket_id, name) values ('avatars', $1 || '/eu.png')`, [editor])
      const apagado = await q.query(`delete from storage.objects where bucket_id = 'avatars' and name like $1 || '%'`, [
        leitor,
      ])
      expect(apagado.affectedRows).toBe(0)
      // Por último: depois de um erro a transação fica abortada.
      const erro = await capturarErro(
        q.query(`insert into storage.objects (bucket_id, name) values ('avatars', $1 || '/outro.png')`, [leitor]),
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
