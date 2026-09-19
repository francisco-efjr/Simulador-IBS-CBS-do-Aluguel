// @vitest-environment node
/**
 * Gatilhos da migração 03: status derivado, imóvel que segue o contrato,
 * autoria, carimbo de atualização, trilha de auditoria e a varredura de
 * vencidos. Datas são relativas a current_date, para o teste não envelhecer.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { criarBancoDeTeste, type BancoDeTeste, type Consulta } from './harness'

let banco: BancoDeTeste
let admin: string
let editor: string
let imovel: string
let inquilino: string

beforeAll(async () => {
  banco = await criarBancoDeTeste()
  admin = await banco.criarUsuario({ perfil: 'administrador' })
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
  imovel = (
    await banco.db.query<{ id: string }>(
      `insert into public.imoveis (nome, endereco) values ('Apto 12', 'Rua das Flores, 12') returning id`,
    )
  ).rows[0].id
  inquilino = (
    await banco.db.query<{ id: string }>(`insert into public.inquilinos (nome) values ('Carlos Dias') returning id`)
  ).rows[0].id
}, 60_000)

afterAll(async () => {
  await banco?.fechar()
})

async function umaLinha<T>(q: Consulta, sql: string, params: unknown[] = []): Promise<T> {
  const { rows } = await q.query<T>(sql, params)
  return rows[0]
}

describe('status derivado da receita', () => {
  const casos: [string, string, string][] = [
    ['recebido quando o valor recebido cobre o previsto', `1000, 1000, current_date + 5`, 'recebido'],
    ['parcial quando recebeu menos que o previsto', `1000, 400, current_date + 5`, 'parcial'],
    ['em_atraso quando venceu e nada foi recebido', `1000, null, current_date - 1`, 'em_atraso'],
    ['previsto quando ainda não venceu', `1000, null, current_date + 5`, 'previsto'],
    ['previsto quando vence hoje', `1000, null, current_date`, 'previsto'],
  ]

  it.each(casos)('%s', async (_nome, valores, esperado) => {
    await banco.comoUsuario(editor, async (q) => {
      const linha = await umaLinha<{ status_financeiro: string }>(
        q,
        `insert into public.receitas (imovel, valor_previsto, valor_recebido, data_vencimento)
         values ($1, ${valores}) returning status_financeiro`,
        [imovel],
      )
      expect(linha.status_financeiro).toBe(esperado)
    })
  })

  it('usa o valor quando não há valor previsto', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const linha = await umaLinha<{ status_financeiro: string }>(
        q,
        `insert into public.receitas (imovel, valor, valor_recebido) values ($1, 500, 500) returning status_financeiro`,
        [imovel],
      )
      expect(linha.status_financeiro).toBe('recebido')
    })
  })

  it('ignora o status que o cliente manda e recalcula a cada edição', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const { id, status_financeiro } = await umaLinha<{ id: string; status_financeiro: string }>(
        q,
        `insert into public.receitas (imovel, valor_previsto, data_vencimento, status_financeiro)
         values ($1, 1000, current_date + 10, 'recebido') returning id, status_financeiro`,
        [imovel],
      )
      expect(status_financeiro).toBe('previsto')

      const depois = await umaLinha<{ status_financeiro: string }>(
        q,
        `update public.receitas set valor_recebido = 1000 where id = $1 returning status_financeiro`,
        [id],
      )
      expect(depois.status_financeiro).toBe('recebido')
    })
  })
})

describe('status derivado da despesa', () => {
  const casos: [string, string, string][] = [
    ['pago quando o valor pago cobre o previsto', `800, 800, current_date + 5`, 'pago'],
    ['parcial quando pagou menos que o previsto', `800, 100, current_date - 5`, 'parcial'],
    ['em_atraso quando venceu e nada foi pago', `800, null, current_date - 1`, 'em_atraso'],
    ['previsto quando ainda não venceu', `800, null, current_date + 1`, 'previsto'],
  ]

  it.each(casos)('%s', async (_nome, valores, esperado) => {
    await banco.comoUsuario(editor, async (q) => {
      const linha = await umaLinha<{ status_financeiro: string }>(
        q,
        `insert into public.despesas (imovel, valor_previsto, valor_pago, data_vencimento)
         values ($1, ${valores}) returning status_financeiro`,
        [imovel],
      )
      expect(linha.status_financeiro).toBe(esperado)
    })
  })
})

describe('status derivado do IPTU e taxas', () => {
  const casos: [string, string, string][] = [
    ['pago quando há data de pagamento, mesmo vencido', `current_date - 30, current_date - 1`, 'pago'],
    ['vencido quando passou do vencimento sem pagamento', `current_date - 1, null`, 'vencido'],
    ['pendente quando ainda não venceu', `current_date + 30, null`, 'pendente'],
  ]

  it.each(casos)('%s', async (_nome, valores, esperado) => {
    await banco.comoUsuario(editor, async (q) => {
      const linha = await umaLinha<{ status: string }>(
        q,
        `insert into public.iptu_taxas (imovel, valor, vencimento, data_pagamento)
         values ($1, 1200, ${valores}) returning status`,
        [imovel],
      )
      expect(linha.status).toBe(esperado)
    })
  })
})

describe('imóvel segue o contrato', () => {
  async function situacaoDoImovel(q: Consulta, id = imovel) {
    return umaLinha<{ status: string; inquilino_atual: string | null }>(
      q,
      `select status, inquilino_atual from public.imoveis where id = $1`,
      [id],
    )
  }

  it('contrato ativo aluga o imóvel e grava o inquilino atual', async () => {
    await banco.comoUsuario(editor, async (q) => {
      expect(await situacaoDoImovel(q)).toEqual({ status: 'vago', inquilino_atual: null })
      await q.query(`insert into public.contratos (imovel, inquilino) values ($1, $2)`, [imovel, inquilino])
      expect(await situacaoDoImovel(q)).toEqual({ status: 'alugado', inquilino_atual: inquilino })
    })
  })

  it('encerrar o único contrato ativo devolve o imóvel a vago', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const { id } = await umaLinha<{ id: string }>(
        q,
        `insert into public.contratos (imovel, inquilino) values ($1, $2) returning id`,
        [imovel, inquilino],
      )
      await q.query(`update public.contratos set status = 'encerrado' where id = $1`, [id])
      expect(await situacaoDoImovel(q)).toEqual({ status: 'vago', inquilino_atual: null })
    })
  })

  it('encerrar um contrato não libera o imóvel se outro contrato ativo resta nele', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const outro = await umaLinha<{ id: string }>(
        q,
        `insert into public.inquilinos (nome) values ('Beatriz Rocha') returning id`,
      )
      await q.query(`insert into public.contratos (imovel, inquilino) values ($1, $2)`, [imovel, inquilino])
      const { id } = await umaLinha<{ id: string }>(
        q,
        `insert into public.contratos (imovel, inquilino) values ($1, $2) returning id`,
        [imovel, outro.id],
      )
      await q.query(`update public.contratos set status = 'cancelado' where id = $1`, [id])
      expect((await situacaoDoImovel(q)).status).toBe('alugado')
    })
  })

  it('contrato criado já encerrado não mexe no imóvel', async () => {
    await banco.comoUsuario(editor, async (q) => {
      await q.query(`insert into public.contratos (imovel, inquilino, status) values ($1, $2, 'encerrado')`, [
        imovel,
        inquilino,
      ])
      expect(await situacaoDoImovel(q)).toEqual({ status: 'vago', inquilino_atual: null })
    })
  })

  it('usuário com edição só em contratos ainda move o imóvel (o gatilho é security definer)', async () => {
    const soContratos = await banco.criarUsuario({ permissoes: { contratos: 'edicao' } })
    await banco.comoUsuario(soContratos, async (q) => {
      await q.query(`insert into public.contratos (imovel, inquilino) values ($1, $2)`, [imovel, inquilino])
    })
    // A transação foi desfeita; confere o efeito repetindo como postgres.
    await banco.desfazendo(async (q) => {
      await q.query(`insert into public.contratos (imovel, inquilino) values ($1, $2)`, [imovel, inquilino])
      expect((await situacaoDoImovel(q)).status).toBe('alugado')
    })
  })

  // Achado: o gatilho só olha o imóvel NOVO. Trocar o imóvel de um contrato
  // ativo aluga o destino, mas deixa o de origem 'alugado' e com
  // inquilino_atual apontando para quem já não mora lá.
  it.fails('trocar o imóvel de um contrato ativo libera o imóvel antigo', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const destino = await umaLinha<{ id: string }>(
        q,
        `insert into public.imoveis (endereco) values ('Rua Nova, 5') returning id`,
      )
      const { id } = await umaLinha<{ id: string }>(
        q,
        `insert into public.contratos (imovel, inquilino) values ($1, $2) returning id`,
        [imovel, inquilino],
      )
      await q.query(`update public.contratos set imovel = $2 where id = $1`, [id, destino.id])
      expect((await situacaoDoImovel(q, destino.id)).status).toBe('alugado')
      expect(await situacaoDoImovel(q)).toEqual({ status: 'vago', inquilino_atual: null })
    })
  })

  // Achado: não há gatilho de DELETE em contratos. Apagar um contrato ativo
  // (a RLS permite a quem tem edição) deixa o imóvel 'alugado' para sempre.
  it.fails('apagar um contrato ativo libera o imóvel', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const { id } = await umaLinha<{ id: string }>(
        q,
        `insert into public.contratos (imovel, inquilino) values ($1, $2) returning id`,
        [imovel, inquilino],
      )
      await q.query(`delete from public.contratos where id = $1`, [id])
      expect(await situacaoDoImovel(q)).toEqual({ status: 'vago', inquilino_atual: null })
    })
  })
})

describe('autoria e carimbo', () => {
  it('grava created_by e updated_by com quem está logado', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const linha = await umaLinha<{ created_by: string; updated_by: string }>(
        q,
        `insert into public.inquilinos (nome) values ('Paula Reis') returning created_by, updated_by`,
      )
      expect(linha).toEqual({ created_by: editor, updated_by: editor })
    })
  })

  it('na edição, troca updated_by e mantém a autoria original', async () => {
    const { id } = await umaLinha<{ id: string }>(
      banco.db,
      `insert into public.fornecedores (nome, created_by) values ('Vidraçaria Luz', $1) returning id`,
      [editor],
    )
    await banco.comoUsuario(admin, async (q) => {
      const linha = await umaLinha<{ created_by: string; updated_by: string }>(
        q,
        `update public.fornecedores set nome = 'Vidraçaria Luz Ltda', created_by = $2, updated_by = $2
          where id = $1 returning created_by, updated_by`,
        [id, admin],
      )
      expect(linha).toEqual({ created_by: editor, updated_by: admin })
    })
  })

  it('carimba updated na edição', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const { id } = await umaLinha<{ id: string }>(
        q,
        `insert into public.imoveis (endereco, updated) values ('Rua Velha, 1', '2000-01-01') returning id`,
      )
      const linha = await umaLinha<{ recente: boolean }>(
        q,
        `update public.imoveis set numero = '2' where id = $1 returning updated > '2001-01-01' as recente`,
        [id],
      )
      expect(linha.recente).toBe(true)
    })
  })

  // Achado: no INSERT o gatilho faz coalesce(new.created_by, auth.uid()) — o
  // valor mandado pelo cliente vence. Qualquer um com edição cria registro em
  // nome de outra pessoa, e a trilha de autoria deixa de ser confiável. No
  // UPDATE a regra já é a certa (auth.uid() primeiro).
  it.fails('não deixa criar registro em nome de outra pessoa', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const linha = await umaLinha<{ created_by: string; updated_by: string }>(
        q,
        `insert into public.inquilinos (nome, created_by, updated_by) values ('Forjado', $1, $1)
         returning created_by, updated_by`,
        [admin],
      )
      expect(linha).toEqual({ created_by: editor, updated_by: editor })
    })
  })
})

describe('trilha de auditoria', () => {
  type Log = {
    usuario: string | null
    acao: string
    entidade: string
    registro_id: string
    detalhes: string
    payload: Record<string, { de: unknown; para: unknown }> | null
  }

  async function logsDe(q: Consulta, registro: string): Promise<Log[]> {
    // Lido como postgres dentro da mesma transação: a trilha é só do administrador.
    const { rows } = await q.query<Log>(
      `select usuario, acao, entidade, registro_id, detalhes, payload
         from public.logs_atividade where registro_id = $1 order by created, acao`,
      [registro],
    )
    return rows
  }

  it('registra criação, edição com diff e exclusão, com o autor', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const { id } = await umaLinha<{ id: string }>(
        q,
        `insert into public.imoveis (nome, endereco, valor) values ('Loja Centro', 'Rua A, 1', 100000) returning id`,
      )
      await q.query(`update public.imoveis set valor = 120000, nome = 'Loja do Centro' where id = $1`, [id])
      await q.query(`delete from public.imoveis where id = $1`, [id])

      await q.exec('reset role')
      const logs = await logsDe(q, id)
      expect(logs.map((l) => l.acao).sort()).toEqual(['criou', 'editou', 'excluiu'])
      expect(logs.every((l) => l.usuario === editor && l.entidade === 'imoveis')).toBe(true)

      const criou = logs.find((l) => l.acao === 'criou')!
      expect(criou.detalhes).toBe('criou imoveis "Loja Centro"')
      expect(criou.payload).toBeNull()

      const editou = logs.find((l) => l.acao === 'editou')!
      expect(editou.detalhes).toBe('editou imoveis "Loja do Centro"')
      expect(editou.payload).toEqual({
        nome: { de: 'Loja Centro', para: 'Loja do Centro' },
        valor: { de: 100000, para: 120000 },
      })

      expect(logs.find((l) => l.acao === 'excluiu')!.detalhes).toBe('excluiu imoveis "Loja do Centro"')
    })
  })

  it('o diff deixa de fora updated e updated_by', async () => {
    await banco.comoUsuario(admin, async (q) => {
      await q.query(`update public.inquilinos set telefone = '11 99999-0000' where id = $1`, [inquilino])
      await q.exec('reset role')
      const editou = (await logsDe(q, inquilino)).find((l) => l.acao === 'editou')!
      expect(Object.keys(editou.payload!)).toEqual(['telefone'])
      expect(editou.usuario).toBe(admin)
    })
  })

  it('imóvel sem nome é identificado pelo endereço', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const { id } = await umaLinha<{ id: string }>(
        q,
        `insert into public.imoveis (endereco, numero) values ('Travessa B', '100') returning id`,
      )
      await q.exec('reset role')
      expect((await logsDe(q, id))[0].detalhes).toBe('criou imoveis "Travessa B"')
    })
  })

  it('a mudança de imóvel feita pelo contrato também entra na trilha', async () => {
    await banco.comoUsuario(editor, async (q) => {
      await q.query(`insert into public.contratos (imovel, inquilino) values ($1, $2)`, [imovel, inquilino])
      await q.exec('reset role')
      const editou = (await logsDe(q, imovel)).find((l) => l.acao === 'editou')!
      expect(editou.payload).toMatchObject({ status: { de: 'vago', para: 'alugado' } })
    })
  })
})

describe('marcar_lancamentos_em_atraso()', () => {
  it('marca o que venceu e ainda estava previsto, e só isso', async () => {
    await banco.desfazendo(async (q) => {
      // Simula lançamentos que estavam em dia e venceram depois: grava sem os
      // gatilhos (que já os marcariam na entrada) e com o status antigo.
      await q.exec(`set local session_replication_role = replica`)
      const vencida = await umaLinha<{ id: string }>(
        q,
        `insert into public.receitas (imovel, valor, data_vencimento, status_financeiro)
         values ($1, 100, current_date - 3, 'previsto') returning id`,
        [imovel],
      )
      const emDia = await umaLinha<{ id: string }>(
        q,
        `insert into public.receitas (imovel, valor, data_vencimento, status_financeiro)
         values ($1, 100, current_date + 3, 'previsto') returning id`,
        [imovel],
      )
      const recebida = await umaLinha<{ id: string }>(
        q,
        `insert into public.receitas (imovel, valor, valor_recebido, data_vencimento, status_financeiro)
         values ($1, 100, 100, current_date - 3, 'recebido') returning id`,
        [imovel],
      )
      const despesa = await umaLinha<{ id: string }>(
        q,
        `insert into public.despesas (imovel, valor, data_vencimento, status_financeiro)
         values ($1, 50, current_date - 1, 'previsto') returning id`,
        [imovel],
      )
      const iptu = await umaLinha<{ id: string }>(
        q,
        `insert into public.iptu_taxas (imovel, valor, vencimento, status)
         values ($1, 900, current_date - 1, 'pendente') returning id`,
        [imovel],
      )
      await q.exec(`set local session_replication_role = origin`)

      const contagem = await umaLinha(q, `select * from public.marcar_lancamentos_em_atraso()`)
      expect(contagem).toEqual({ receitas: 1, despesas: 1, iptu: 1 })

      const status = async (tabela: string, coluna: string, id: string) =>
        (await umaLinha<{ s: string }>(q, `select ${coluna}::text as s from public.${tabela} where id = $1`, [id])).s

      expect(await status('receitas', 'status_financeiro', vencida.id)).toBe('em_atraso')
      expect(await status('receitas', 'status_financeiro', emDia.id)).toBe('previsto')
      expect(await status('receitas', 'status_financeiro', recebida.id)).toBe('recebido')
      expect(await status('despesas', 'status_financeiro', despesa.id)).toBe('em_atraso')
      expect(await status('iptu_taxas', 'status', iptu.id)).toBe('vencido')

      // Segunda passada não encontra mais nada.
      expect(await umaLinha(q, `select * from public.marcar_lancamentos_em_atraso()`)).toEqual({
        receitas: 0,
        despesas: 0,
        iptu: 0,
      })
    })
  })
})
