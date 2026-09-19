// @vitest-environment node
/**
 * Ninguém promove a si mesmo (gatilho tg_proteger_privilegio, migração 03) e o
 * perfil nasce junto do login (tg_criar_perfil_do_usuario).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { capturarErro, criarBancoDeTeste, type BancoDeTeste, type Consulta } from './harness'

let banco: BancoDeTeste
let admin: string
let usuario: string

beforeAll(async () => {
  banco = await criarBancoDeTeste()
  admin = await banco.criarUsuario({ perfil: 'administrador' })
  usuario = await banco.criarUsuario({ permissoes: { imoveis: 'edicao' } })
}, 60_000)

afterAll(async () => {
  await banco?.fechar()
})

async function perfilDe(id: string) {
  const { rows } = await banco.db.query<{ perfil: string; ativo: boolean; name: string }>(
    `select perfil, ativo, name from public.users where id = $1`,
    [id],
  )
  return rows[0]
}

describe('tg_proteger_privilegio', () => {
  it('usuário comum não se promove a administrador', async () => {
    const erro = await banco.comoUsuario(usuario, (q) =>
      capturarErro(q.query(`update public.users set perfil = 'administrador' where id = $1`, [usuario])),
    )
    expect(erro.code).toBe('42501')
    expect(erro.message).toMatch(/Somente um administrador/)
    expect((await perfilDe(usuario)).perfil).toBe('usuario')
  })

  it('usuário desativado não se reativa', async () => {
    const desativado = await banco.criarUsuario({ ativo: false })
    const erro = await banco.comoUsuario(desativado, (q) =>
      capturarErro(q.query(`update public.users set ativo = true where id = $1`, [desativado])),
    )
    // A política users_editar deixa a pessoa alcançar a própria linha mesmo
    // desativada; quem recusa é o gatilho.
    expect(erro.code).toBe('42501')
    expect((await perfilDe(desativado)).ativo).toBe(false)
  })

  it('usuário comum não se desativa sozinho (situação é assunto do administrador)', async () => {
    const erro = await banco.comoUsuario(usuario, (q) =>
      capturarErro(q.query(`update public.users set ativo = false where id = $1`, [usuario])),
    )
    expect(erro.code).toBe('42501')
  })

  it('usuário comum edita o próprio nome e avatar', async () => {
    await banco.comoUsuario(usuario, async (q) => {
      const r = await q.query(`update public.users set name = 'Novo nome', avatar = 'a.png' where id = $1`, [usuario])
      expect(r.affectedRows).toBe(1)
    })
  })

  it('administrador promove, rebaixa e desativa outra pessoa', async () => {
    await banco.comoUsuario(admin, async (q) => {
      await q.query(`update public.users set perfil = 'administrador' where id = $1`, [usuario])
      const promovido = await q.query<{ perfil: string }>(`select perfil from public.users where id = $1`, [usuario])
      expect(promovido.rows[0].perfil).toBe('administrador')
      await q.query(`update public.users set perfil = 'usuario', ativo = false where id = $1`, [usuario])
      const rebaixado = await q.query<{ perfil: string; ativo: boolean }>(
        `select perfil, ativo from public.users where id = $1`,
        [usuario],
      )
      expect(rebaixado.rows[0]).toEqual({ perfil: 'usuario', ativo: false })
    })
  })

  it('administrador desativado perde o poder de promover', async () => {
    const exAdmin = await banco.criarUsuario({ perfil: 'administrador', ativo: false })
    await banco.comoUsuario(exAdmin, async (q) => {
      const r = await q.query(`update public.users set perfil = 'administrador' where id = $1`, [usuario])
      expect(r.affectedRows).toBe(0)
    })
    expect((await perfilDe(usuario)).perfil).toBe('usuario')
  })

  // Corrigido na migração 20260919120004 (11.1): sem sessão (SQL Editor),
  // eh_administrador() é false e o gatilho recusava o passo do README.
  it('o passo "Primeiro administrador" do README funciona no SQL Editor (sem sessão)', async () => {
    const primeiro = await banco.criarUsuario({ email: 'dono@holding.local' })
    await banco.desfazendo(async (q) => {
      await q.query(
        `update public.users set perfil = 'administrador', ativo = true
          where lower(email) = lower('dono@holding.local')`,
      )
      const { rows } = await q.query<{ perfil: string }>(`select perfil from public.users where id = $1`, [primeiro])
      expect(rows[0].perfil).toBe('administrador')
    })
  })

  it('o service_role (chave de serviço, sem sessão) também promove', async () => {
    await banco.desfazendo(async (q) => {
      await q.exec(`set local role service_role`)
      await q.query(`update public.users set perfil = 'administrador' where id = $1`, [usuario])
      const { rows } = await q.query<{ perfil: string }>(`select perfil from public.users where id = $1`, [usuario])
      expect(rows[0].perfil).toBe('administrador')
    })
  })

  it('a role authenticated sem sessão não aproveita a liberação do SQL Editor', async () => {
    await banco.desfazendo(async (q) => {
      // Política permissiva só nesta transação, para a RLS não esconder a linha
      // e o teste chegar ao gatilho — é ele que está sob teste.
      // (UPDATE com WHERE também passa pelas políticas de SELECT: por isso "for all".)
      await q.exec(`create policy teste_tudo on public.users for all to authenticated using (true) with check (true)`)
      await q.exec(`set local role authenticated`)
      const erro = await capturarErro(
        q.query(`update public.users set perfil = 'administrador' where id = $1`, [usuario]),
      )
      expect(erro.code).toBe('42501')
      expect(erro.message).toMatch(/Somente um administrador/)
    })
    expect((await perfilDe(usuario)).perfil).toBe('usuario')
  })

  it('anônimo não promove ninguém', async () => {
    const erro = await banco.comoAnonimo((q) =>
      capturarErro(q.query(`update public.users set perfil = 'administrador' where id = $1`, [usuario])),
    )
    expect(erro.code).toBe('42501')
    expect((await perfilDe(usuario)).perfil).toBe('usuario')
  })
})

describe('trilha das mudanças de privilégio', () => {
  type Log = {
    usuario: string | null
    acao: string
    entidade: string
    registro_id: string
    detalhes: string
    payload: Record<string, { de: unknown; para: unknown }> | null
  }

  async function logsDe(q: Consulta, entidade: string, registro: string): Promise<Log[]> {
    // Lido como postgres dentro da mesma transação: a trilha é só do administrador.
    const { rows } = await q.query<Log>(
      `select usuario, acao, entidade, registro_id, detalhes, payload
         from public.logs_atividade where entidade = $1 and registro_id = $2 order by created, acao`,
      [entidade, registro],
    )
    return rows
  }

  it('promover e desativar alguém fica registrado, com quem fez e o diff', async () => {
    const alvo = await banco.criarUsuario({ nome: 'Rita Alves' })
    await banco.comoUsuario(admin, async (q) => {
      await q.query(`update public.users set perfil = 'administrador' where id = $1`, [alvo])
      await q.query(`update public.users set ativo = false where id = $1`, [alvo])
      await q.exec('reset role')
      const edicoes = (await logsDe(q, 'users', alvo)).filter((l) => l.acao === 'editou')
      expect(edicoes).toHaveLength(2)
      expect(edicoes.every((l) => l.usuario === admin && l.detalhes === 'editou users "Rita Alves"')).toBe(true)
      expect(edicoes.map((l) => l.payload)).toEqual(
        expect.arrayContaining([
          { perfil: { de: 'usuario', para: 'administrador' } },
          { ativo: { de: true, para: false } },
        ]),
      )
    })
  })

  it('a promoção pelo SQL Editor também entra, sem autor', async () => {
    const alvo = await banco.criarUsuario({ nome: 'Dono da Holding' })
    await banco.desfazendo(async (q) => {
      await q.query(`update public.users set perfil = 'administrador' where id = $1`, [alvo])
      const edicoes = (await logsDe(q, 'users', alvo)).filter((l) => l.acao === 'editou')
      expect(edicoes).toHaveLength(1)
      expect(edicoes[0]).toMatchObject({ usuario: null, payload: { perfil: { de: 'usuario', para: 'administrador' } } })
    })
  })

  it('trocar o próprio nome ou avatar não entra na trilha', async () => {
    await banco.comoUsuario(usuario, async (q) => {
      await q.query(`update public.users set name = 'Outro nome', avatar = 'b.png' where id = $1`, [usuario])
      await q.exec('reset role')
      expect((await logsDe(q, 'users', usuario)).filter((l) => l.acao === 'editou')).toHaveLength(0)
    })
  })

  it('o login novo entra como "criou users"', async () => {
    await banco.desfazendo(async (q) => {
      const { rows } = await q.query<{ id: string }>(
        `insert into auth.users (email, raw_user_meta_data) values ('novata@teste.local', '{"name":"Lia Novata"}') returning id`,
      )
      const logs = await logsDe(q, 'users', rows[0].id)
      expect(logs.map((l) => [l.acao, l.detalhes])).toEqual([['criou', 'criou users "Lia Novata"']])
    })
  })

  it('conceder, mudar e retirar permissão fica registrado, com rótulo legível', async () => {
    const alvo = await banco.criarUsuario({ nome: 'Rui Prado' })
    await banco.comoUsuario(admin, async (q) => {
      const { rows } = await q.query<{ id: string }>(
        `insert into public.permissoes (usuario, modulo, nivel) values ($1, 'receitas', 'visualizacao') returning id`,
        [alvo],
      )
      const id = rows[0].id
      await q.query(`update public.permissoes set nivel = 'edicao' where id = $1`, [id])
      await q.query(`delete from public.permissoes where id = $1`, [id])
      await q.exec('reset role')

      const logs = await logsDe(q, 'permissoes', id)
      expect(logs.map((l) => l.acao).sort()).toEqual(['criou', 'editou', 'excluiu'])
      expect(logs.every((l) => l.usuario === admin)).toBe(true)
      expect(logs.find((l) => l.acao === 'criou')!.detalhes).toBe('criou permissoes "Rui Prado — receitas: visualizacao"')
      const editou = logs.find((l) => l.acao === 'editou')!
      expect(editou.detalhes).toBe('editou permissoes "Rui Prado — receitas: edicao"')
      expect(editou.payload).toEqual({ nivel: { de: 'visualizacao', para: 'edicao' } })
      expect(logs.find((l) => l.acao === 'excluiu')!.detalhes).toBe('excluiu permissoes "Rui Prado — receitas: edicao"')
    })
  })
})

describe('perfil nasce junto do login (auth.users)', () => {
  it('cria o perfil como usuario ativo, sem permissão, com o nome do metadado', async () => {
    await banco.desfazendo(async (q) => {
      const { rows } = await q.query<{ id: string }>(
        `insert into auth.users (email, raw_user_meta_data) values ('ana@teste.local', '{"name":"Ana Lima"}') returning id`,
      )
      const perfil = await q.query(`select email, name, perfil, ativo from public.users where id = $1`, [rows[0].id])
      expect(perfil.rows[0]).toEqual({ email: 'ana@teste.local', name: 'Ana Lima', perfil: 'usuario', ativo: true })
      const permissoes = await q.query(`select 1 from public.permissoes where usuario = $1`, [rows[0].id])
      expect(permissoes.rows).toHaveLength(0)
    })
  })

  it('sem nome no metadado, usa o que vem antes do @', async () => {
    await banco.desfazendo(async (q) => {
      const { rows } = await q.query<{ id: string }>(
        `insert into auth.users (email) values ('joao.pereira@teste.local') returning id`,
      )
      const perfil = await q.query<{ name: string }>(`select name from public.users where id = $1`, [rows[0].id])
      expect(perfil.rows[0].name).toBe('joao.pereira')
    })
  })

  it('quem entra por convite pendente nasce com o perfil do convite, e o convite vira aceito', async () => {
    await banco.desfazendo(async (q) => {
      await q.query(
        `insert into public.convites (email, token, perfil, data_expiracao)
         values ('Chefe@Teste.local', 'tok-1', 'administrador', now() + interval '2 days')`,
      )
      const { rows } = await q.query<{ id: string }>(
        `insert into auth.users (email) values ('chefe@teste.local') returning id`,
      )
      const perfil = await q.query<{ perfil: string }>(`select perfil from public.users where id = $1`, [rows[0].id])
      expect(perfil.rows[0].perfil).toBe('administrador')
      const convite = await q.query<{ status: string }>(`select status from public.convites where token = 'tok-1'`)
      expect(convite.rows[0].status).toBe('aceito')
    })
  })

  it('convite vencido não vale: nasce como usuario', async () => {
    await banco.desfazendo(async (q) => {
      await q.query(
        `insert into public.convites (email, token, perfil, data_expiracao)
         values ('atrasado@teste.local', 'tok-2', 'administrador', now() - interval '1 day')`,
      )
      const { rows } = await q.query<{ id: string }>(
        `insert into auth.users (email) values ('atrasado@teste.local') returning id`,
      )
      const perfil = await q.query<{ perfil: string }>(`select perfil from public.users where id = $1`, [rows[0].id])
      expect(perfil.rows[0].perfil).toBe('usuario')
    })
  })

  it('apagar o login apaga o perfil e as permissões', async () => {
    const efemero = await banco.criarUsuario({ permissoes: { imoveis: 'edicao' } })
    await banco.desfazendo(async (q) => {
      await q.query(`delete from auth.users where id = $1`, [efemero])
      expect((await q.query(`select 1 from public.users where id = $1`, [efemero])).rows).toHaveLength(0)
      expect((await q.query(`select 1 from public.permissoes where usuario = $1`, [efemero])).rows).toHaveLength(0)
    })
  })
})
