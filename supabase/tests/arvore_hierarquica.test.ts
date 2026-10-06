// @vitest-environment node
/**
 * Testes das regras de negócio e estrutura hierárquica (Fase 1):
 * - Locadores, Fiadores e Unidades de Imóveis
 * - RLS dos novos módulos e tabelas
 * - Limite comercial de até 3 imóveis para usuários sem privilégio especial
 * - Gerador de número sequencial de contratos (formato NNN/AAAA)
 * - Sincronismo de ocupação da unidade e imóvel
 * - Bloqueio de inativação de unidade com contrato ativo (HA001)
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { capturarErro, criarBancoDeTeste, type BancoDeTeste } from './harness'

let banco: BancoDeTeste
let admin: string
let usuarioComum: string
let editorGeral: string
let leitorLocadores: string
let usuarioSemAcesso: string

beforeAll(async () => {
  banco = await criarBancoDeTeste()

  admin = await banco.criarUsuario({ perfil: 'administrador' })
  usuarioSemAcesso = await banco.criarUsuario({ permissoes: {} })
  usuarioComum = await banco.criarUsuario({
    permissoes: {
      imoveis: 'edicao',
      contratos: 'edicao',
      locadores: 'edicao',
    },
  })
  editorGeral = await banco.criarUsuario({
    permissoes: {
      imoveis: 'edicao',
      inquilinos: 'edicao',
      contratos: 'edicao',
      locadores: 'edicao',
    },
  })
  leitorLocadores = await banco.criarUsuario({
    permissoes: {
      locadores: 'visualizacao',
    },
  })
}, 60_000)

afterAll(async () => {
  await banco?.fechar()
})

describe('Árvore hierárquica e novas entidades', () => {
  it('cria locador com documento válido e gera autoria/auditoria', async () => {
    await banco.comoUsuario(editorGeral, async (q) => {
      const { rows } = await q.query<{ id: string; nome_razao_social: string; created_by: string }>(
        `insert into public.locadores (nome_razao_social, tipo_pessoa, cpf_cnpj, email)
         values ('Holding Familiar Aguiar LTDA', 'pj', '12.345.678/0001-95', 'contato@aguiar.com')
         returning id, nome_razao_social, created_by`,
      )
      expect(rows).toHaveLength(1)
      expect(rows[0].nome_razao_social).toBe('Holding Familiar Aguiar LTDA')
      expect(rows[0].created_by).toBe(editorGeral)
    })
  })

  it('cria fiador com cônjuge e vínculo ao módulo de contratos', async () => {
    await banco.comoUsuario(editorGeral, async (q) => {
      const { rows } = await q.query<{ id: string; nome: string }>(
        `insert into public.fiadores (nome, cpf, estado_civil, conjuge_nome, email)
         values ('Carlos Santos', '123.456.789-09', 'casado', 'Mariana Santos', 'carlos@teste.com')
         returning id, nome`,
      )
      expect(rows).toHaveLength(1)
      expect(rows[0].nome).toBe('Carlos Santos')
    })
  })

  it('cria unidades vinculadas ao imóvel macro com códigos de concessionárias e taxas', async () => {
    await banco.comoUsuario(editorGeral, async (q) => {
      const imovel = (
        await q.query<{ id: string }>(
          `insert into public.imoveis (nome, endereco) values ('Edifício Central', 'Av. Principal, 100') returning id`,
        )
      ).rows[0].id

      const { rows } = await q.query<{ id: string; identificador: string; valor_condominio: string; taxa_poco: string }>(
        `insert into public.imovel_unidades (
           imovel_id, identificador, complemento, codigo_energia, codigo_agua,
           tem_condominio, valor_condominio, taxa_poco
         ) values (
           $1, 'Apto 101', 'Bloco A', 'EN-10293', 'AG-88219',
           true, 350.00, 30.00
         ) returning id, identificador, valor_condominio, taxa_poco`,
        [imovel],
      )

      expect(rows).toHaveLength(1)
      expect(rows[0].identificador).toBe('Apto 101')
      expect(Number(rows[0].valor_condominio)).toBe(350.0)
      expect(Number(rows[0].taxa_poco)).toBe(30.0)
    })
  })
})

describe('Validação de limite comercial de até 3 imóveis', () => {
  it('usuário sem privilégio especial pode criar até 3 imóveis, mas o 4º é bloqueado (HA003)', async () => {
    const usuarioLimite = await banco.criarUsuario({
      permissoes: { imoveis: 'edicao' },
    })

    await banco.comoUsuario(usuarioLimite, async (q) => {
      // 1º imóvel
      await q.query(`insert into public.imoveis (nome, endereco) values ('Imóvel 1', 'Rua 1')`)
      // 2º imóvel
      await q.query(`insert into public.imoveis (nome, endereco) values ('Imóvel 2', 'Rua 2')`)
      // 3º imóvel
      await q.query(`insert into public.imoveis (nome, endereco) values ('Imóvel 3', 'Rua 3')`)

      // 4º imóvel deve falhar com erro HA003
      const erro = await capturarErro(
        q.query(`insert into public.imoveis (nome, endereco) values ('Imóvel 4', 'Rua 4')`),
      )
      expect(erro.code).toBe('HA003')
      expect(erro.message).toMatch(/Limite de até 3 imóveis atingido no plano gratuito/)
    })
  })

  it('administrador não sofre restrição de limite comercial de 3 imóveis', async () => {
    await banco.comoUsuario(admin, async (q) => {
      for (let i = 1; i <= 5; i++) {
        await q.query(`insert into public.imoveis (nome, endereco) values ($1, $2)`, [
          `Imóvel Admin ${i}`,
          `Rua Admin ${i}`,
        ])
      }
      const { rows } = await q.query<{ total: number }>(
        `select count(*)::int as total from public.imoveis where nome like 'Imóvel Admin %'`,
      )
      expect(rows[0].total).toBe(5)
    })
  })
})

describe('Gerador de número sequencial de contratos', () => {
  it('gera número sequencial automaticamente no formato NNN/AAAA quando omitido', async () => {
    await banco.comoUsuario(editorGeral, async (q) => {
      const imovel = (
        await q.query<{ id: string }>(
          `insert into public.imoveis (nome, endereco) values ('Casa Teste Contrato', 'Rua das Palmeiras, 10') returning id`,
        )
      ).rows[0].id
      const inquilino = (
        await q.query<{ id: string }>(
          `insert into public.inquilinos (nome) values ('Pedro Alcantara') returning id`,
        )
      ).rows[0].id

      const { rows } = await q.query<{ numero: string }>(
        `insert into public.contratos (imovel, inquilino) values ($1, $2) returning numero`,
        [imovel, inquilino],
      )

      expect(rows[0].numero).toMatch(/^[0-9]{3}\/[0-9]{4}$/)
      expect(rows[0].numero).toContain(`/${new Date().getFullYear()}`)
    })
  })

  it('função proximo_numero_contrato incrementa a sequência corretamente', async () => {
    const { rows } = await banco.db.query<{ num: string }>(
      `select public.proximo_numero_contrato(2030) as num`,
    )
    expect(rows[0].num).toBe('001/2030')
  })
})

describe('Sincronismo de ocupação da unidade com contratos', () => {
  it('contrato ativo aluga a unidade e preenche inquilino_atual; encerramento desocupa', async () => {
    await banco.comoUsuario(editorGeral, async (q) => {
      const imovel = (
        await q.query<{ id: string }>(
          `insert into public.imoveis (nome, endereco) values ('Residencial Alvorada', 'Rua A, 50') returning id`,
        )
      ).rows[0].id
      const unidade = (
        await q.query<{ id: string }>(
          `insert into public.imovel_unidades (imovel_id, identificador) values ($1, 'Apto 202') returning id`,
          [imovel],
        )
      ).rows[0].id
      const inquilino = (
        await q.query<{ id: string }>(
          `insert into public.inquilinos (nome) values ('Marcos Vinicius') returning id`,
        )
      ).rows[0].id

      // Cria contrato ativo vinculado à unidade
      const contrato = (
        await q.query<{ id: string }>(
          `insert into public.contratos (imovel, unidade_id, inquilino, status)
           values ($1, $2, $3, 'ativo') returning id`,
          [imovel, unidade, inquilino],
        )
      ).rows[0].id

      // A unidade deve estar alugada com inquilino_atual setado
      const uniAlugada = (
        await q.query<{ status: string; inquilino_atual: string }>(
          `select status, inquilino_atual from public.imovel_unidades where id = $1`,
          [unidade],
        )
      ).rows[0]
      expect(uniAlugada.status).toBe('alugado')
      expect(uniAlugada.inquilino_atual).toBe(inquilino)

      // Encerrar contrato libera a unidade para 'vago'
      await q.query(`update public.contratos set status = 'encerrado' where id = $1`, [contrato])

      const uniVaga = (
        await q.query<{ status: string; inquilino_atual: string | null }>(
          `select status, inquilino_atual from public.imovel_unidades where id = $1`,
          [unidade],
        )
      ).rows[0]
      expect(uniVaga.status).toBe('vago')
      expect(uniVaga.inquilino_atual).toBeNull()
    })
  })
})

describe('Proteção contra inativação com contrato ativo (HA001)', () => {
  it('impede inativação de unidade com contrato ativo', async () => {
    await banco.comoUsuario(editorGeral, async (q) => {
      const imovel = (
        await q.query<{ id: string }>(
          `insert into public.imoveis (nome, endereco) values ('Centro Comercial', 'Rua C, 10') returning id`,
        )
      ).rows[0].id
      const unidade = (
        await q.query<{ id: string }>(
          `insert into public.imovel_unidades (imovel_id, identificador) values ($1, 'Sala 10') returning id`,
          [imovel],
        )
      ).rows[0].id
      const inquilino = (
        await q.query<{ id: string }>(
          `insert into public.inquilinos (nome) values ('Luciana Lima') returning id`,
        )
      ).rows[0].id

      await q.query(
        `insert into public.contratos (imovel, unidade_id, inquilino, status)
         values ($1, $2, $3, 'ativo')`,
        [imovel, unidade, inquilino],
      )

      // Tentar inativar a unidade com contrato ativo deve falhar com HA001
      const erro = await capturarErro(
        q.query(`update public.imovel_unidades set status = 'inativo' where id = $1`, [unidade]),
      )
      expect(erro.code).toBe('HA001')
      expect(erro.message).toMatch(/Esta unidade tem contrato ativo e não pode ser inativada/)
    })
  })
})

describe('RLS dos novos módulos (locadores, fiadores, imovel_unidades)', () => {
  it('usuário sem permissão não lê nem insere em public.locadores', async () => {
    await banco.comoUsuario(usuarioSemAcesso, async (q) => {
      const { rows } = await q.query<{ total: number }>(
        `select count(*)::int as total from public.locadores`,
      )
      expect(rows[0].total).toBe(0)

      const erro = await capturarErro(
        q.query(
          `insert into public.locadores (nome_razao_social, tipo_pessoa, email)
           values ('Locador Invasor', 'pf', 'invasor@teste.com')`,
        ),
      )
      expect(erro.code).toBe('42501')
    })
  })

  it('usuário sem permissão não lê nem insere em public.fiadores', async () => {
    await banco.comoUsuario(usuarioSemAcesso, async (q) => {
      const { rows } = await q.query<{ total: number }>(
        `select count(*)::int as total from public.fiadores`,
      )
      expect(rows[0].total).toBe(0)

      const erro = await capturarErro(
        q.query(
          `insert into public.fiadores (nome, cpf, email)
           values ('Fiador Invasor', '529.982.247-25', 'invasor@fiador.com')`,
        ),
      )
      expect(erro.code).toBe('42501')
    })
  })

  it('usuário sem permissão não lê nem insere em public.imovel_unidades', async () => {
    await banco.comoUsuario(usuarioSemAcesso, async (q) => {
      const { rows } = await q.query<{ total: number }>(
        `select count(*)::int as total from public.imovel_unidades`,
      )
      expect(rows[0].total).toBe(0)

      const erro = await capturarErro(
        q.query(
          `insert into public.imovel_unidades (imovel_id, identificador)
           values ('00000000-0000-0000-0000-000000000001', 'Unidade Invasora')`,
        ),
      )
      expect(erro.code).toBe('42501')
    })
  })

  it('usuário com apenas visualização de locadores lê mas não pode inserir', async () => {
    // 1. Cria locador no banco direto para leitura
    await banco.db.query(
      `insert into public.locadores (nome_razao_social, tipo_pessoa, email)
       values ('Locador Para Leitura', 'pf', 'leitura@teste.com')`,
    )

    // 2. Leitor lê
    await banco.comoUsuario(leitorLocadores, async (q) => {
      const { rows } = await q.query<{ total: number }>(
        `select count(*)::int as total from public.locadores where nome_razao_social = 'Locador Para Leitura'`,
      )
      expect(rows[0].total).toBe(1)

      // 3. Mas não pode criar
      const erro = await capturarErro(
        q.query(
          `insert into public.locadores (nome_razao_social, tipo_pessoa, email)
           values ('Locador Bloqueado', 'pf', 'bloqueado@teste.com')`,
        ),
      )
      expect(erro.code).toBe('42501')
    })
  })
})

describe('Restrição de vigência contratual por unidade', () => {
  it('impede contrato para a unidade com data_fim anterior à data_inicio (contratos_vigencia_coerente)', async () => {
    await banco.comoUsuario(editorGeral, async (q) => {
      const imovel = (
        await q.query<{ id: string }>(
          `insert into public.imoveis (nome, endereco) values ('Residencial Vigência', 'Rua V, 20') returning id`,
        )
      ).rows[0].id
      const unidade = (
        await q.query<{ id: string }>(
          `insert into public.imovel_unidades (imovel_id, identificador) values ($1, 'Apto 101') returning id`,
          [imovel],
        )
      ).rows[0].id
      const inquilino = (
        await q.query<{ id: string }>(
          `insert into public.inquilinos (nome) values ('Inquilino Vigência') returning id`,
        )
      ).rows[0].id

      // Data fim anterior ao início deve ser rejeitada pela check constraint
      const erro = await capturarErro(
        q.query(
          `insert into public.contratos (imovel, unidade_id, inquilino, data_inicio, data_fim, valor_aluguel)
           values ($1, $2, $3, '2026-06-01', '2026-01-01', 2000.00)`,
          [imovel, unidade, inquilino],
        ),
      )
      expect(erro.code).toBe('23514') // check_violation
    })
  })

  it('permite vigência coerente e sincroniza a unidade para alugada', async () => {
    await banco.comoUsuario(editorGeral, async (q) => {
      const imovel = (
        await q.query<{ id: string }>(
          `insert into public.imoveis (nome, endereco) values ('Edifício Prazo', 'Rua P, 30') returning id`,
        )
      ).rows[0].id
      const unidade = (
        await q.query<{ id: string }>(
          `insert into public.imovel_unidades (imovel_id, identificador) values ($1, 'Sala 303') returning id`,
          [imovel],
        )
      ).rows[0].id
      const inquilino = (
        await q.query<{ id: string }>(
          `insert into public.inquilinos (nome) values ('Empresa Prazo LTDA') returning id`,
        )
      ).rows[0].id

      const { rows } = await q.query<{ id: string; status: string }>(
        `insert into public.contratos (imovel, unidade_id, inquilino, data_inicio, data_fim, valor_aluguel, status)
         values ($1, $2, $3, '2026-01-01', '2027-01-01', 3500.00, 'ativo')
         returning id, status`,
        [imovel, unidade, inquilino],
      )
      expect(rows).toHaveLength(1)
      expect(rows[0].status).toBe('ativo')

      const uni = (
        await q.query<{ status: string }>(
          `select status from public.imovel_unidades where id = $1`,
          [unidade],
        )
      ).rows[0]
      expect(uni.status).toBe('alugado')
    })
  })
})

