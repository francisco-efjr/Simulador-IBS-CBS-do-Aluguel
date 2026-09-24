// @vitest-environment node
/**
 * Quadro de histórias (migrações 20260923120001 a 20260923120003): a carga
 * inicial, a regra de que homologar é coisa de gente (RN-QDR-01 e RN-QDR-02) e
 * quem vê e quem edita (RN-QDR-03).
 *
 * "Sem sessão" é o que acontece no SQL Editor, numa migração ou numa automação
 * com a chave de serviço: nenhuma pessoa logada, auth.uid() nulo. É o caminho
 * de um agente de código — e é o que a regra fecha.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  capturarErro,
  criarBancoDeTeste,
  listarMigracoes,
  type BancoDeTeste,
  type Consulta,
} from './harness'

let banco: BancoDeTeste
let admin: string
let editor: string
let leitor: string
let semAcesso: string

const TOTAL_DA_CARGA = 59

beforeAll(async () => {
  banco = await criarBancoDeTeste()
  admin = await banco.criarUsuario({ perfil: 'administrador' })
  editor = await banco.criarUsuario({ permissoes: { quadro: 'edicao' } })
  leitor = await banco.criarUsuario({ permissoes: { quadro: 'visualizacao' } })
  semAcesso = await banco.criarUsuario({ permissoes: { imoveis: 'edicao' } })
}, 60_000)

afterAll(async () => {
  await banco?.fechar()
})

async function colunaDa(q: Consulta, numero: number): Promise<string> {
  const { rows } = await q.query<{ coluna: string }>(
    `select coluna::text from public.historias where numero = $1`,
    [numero],
  )
  return rows[0].coluna
}

/** Faz as próximas gravações da transação valerem como feitas por `id`. */
async function comSessaoDe(q: Consulta, id: string | null) {
  await q.query(`select set_config('request.jwt.claim.sub', $1, true)`, [id ?? ''])
}

describe('carga inicial', () => {
  it(`traz ${TOTAL_DA_CARGA} histórias numeradas de 1 a ${TOTAL_DA_CARGA}, sem buraco`, async () => {
    const { rows } = await banco.db.query<{ total: number; menor: number; maior: number }>(
      `select count(*)::int as total, min(numero) as menor, max(numero) as maior from public.historias`,
    )
    expect(rows[0]).toEqual({ total: TOTAL_DA_CARGA, menor: 1, maior: TOTAL_DA_CARGA })
  })

  it('nenhuma história nasce em Homologação ou Concluído', async () => {
    const { rows } = await banco.db.query<{ coluna: string; total: number }>(
      `select coluna::text, count(*)::int as total from public.historias group by coluna order by coluna`,
    )
    const colunas = rows.map((r) => r.coluna)
    expect(colunas).not.toContain('homologacao')
    expect(colunas).not.toContain('concluido')
    expect(rows.reduce((soma, r) => soma + r.total, 0)).toBe(TOTAL_DA_CARGA)
  })

  it('toda história tem "eu", "quero", "para", critérios em Gherkin e etiqueta', async () => {
    const { rows } = await banco.db.query<{ numero: number }>(
      `select numero from public.historias
        where btrim(eu) = '' or btrim(quero) = '' or btrim(para) = ''
           or criterios not like '# language: pt%' or position('Cenário' in criterios) = 0
           or coalesce(btrim(tag), '') = ''`,
    )
    expect(rows).toEqual([])
  })

  it('em Teste tudo está entregue; em Desenvolvimento há atividade pendente; no Backlog, nenhuma atividade', async () => {
    const { rows } = await banco.db.query<{
      numero: number
      coluna: string
      total: number
      feitas: number
    }>(
      `select h.numero, h.coluna::text,
              count(a.id)::int as total,
              count(a.id) filter (where a.concluida)::int as feitas
         from public.historias h
         left join public.historias_atividades a on a.historia = h.id
        group by h.numero, h.coluna`,
    )
    for (const h of rows) {
      if (h.coluna === 'teste') {
        expect(h.total, `H-${h.numero}`).toBeGreaterThan(0)
        expect(h.feitas, `H-${h.numero}`).toBe(h.total)
      }
      if (h.coluna === 'desenvolvimento') expect(h.feitas, `H-${h.numero}`).toBeLessThan(h.total)
      if (h.coluna === 'backlog') expect(h.total, `H-${h.numero}`).toBe(0)
    }
  })

  it('a carga não enche a trilha de auditoria', async () => {
    const { rows } = await banco.db.query<{ total: number }>(
      `select count(*)::int as total from public.logs_atividade where entidade = 'historias'`,
    )
    expect(rows[0].total).toBe(0)
  })

  it('a história criada depois da carga continua a numeração', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const { rows } = await q.query<{ numero: number }>(
        `insert into public.historias (titulo, tag) values ('Enviar o recibo por WhatsApp', 'Financeiro') returning numero`,
      )
      expect(rows[0].numero).toBe(TOTAL_DA_CARGA + 1)
    })
  })

  it('as três migrações podem ser rodadas de novo sem duplicar nada (SQL Editor)', async () => {
    const doQuadro = listarMigracoes().filter((m) => m.arquivo.startsWith('20260923'))
    expect(doQuadro.map((m) => m.arquivo)).toEqual([
      '20260923120001_modulo_quadro.sql',
      '20260923120002_quadro_de_historias.sql',
      '20260923120003_carga_do_quadro.sql',
    ])
    await banco.desfazendo(async (q) => {
      // A 01 acrescenta valor de enum, o que não pode rodar dentro de transação
      // junto do resto; rodar de novo é "if not exists" e fica de fora aqui.
      await q.exec(doQuadro[1].sql)
      await q.exec(doQuadro[2].sql)
      const { rows } = await q.query<{ total: number }>(`select count(*)::int as total from public.historias`)
      expect(rows[0].total).toBe(TOTAL_DA_CARGA)
    })
  })
})

describe('homologação é coisa de gente (RN-QDR-01, RN-QDR-02)', () => {
  it('sem sessão, a história anda entre Backlog, Desenvolvimento e Teste', async () => {
    await banco.desfazendo(async (q) => {
      await q.query(`update public.historias set coluna = 'desenvolvimento' where numero = 8`)
      expect(await colunaDa(q, 8)).toBe('desenvolvimento')
      await q.query(`update public.historias set coluna = 'teste' where numero = 8`)
      await q.query(`update public.historias set coluna = 'backlog' where numero = 8`)
      expect(await colunaDa(q, 8)).toBe('backlog')
    })
  })

  it.each(['homologacao', 'concluido'])('sem sessão, não leva a história para %s', async (destino) => {
    const erro = await banco.desfazendo((q) =>
      capturarErro(q.query(`update public.historias set coluna = $1 where numero = 7`, [destino])),
    )
    expect(erro.code).toBe('HA002')
    expect(erro.message).toContain('Só uma pessoa que entrou no sistema')
  })

  it.each(['homologacao', 'concluido'])('sem sessão, não cria história em %s', async (destino) => {
    const erro = await banco.desfazendo((q) =>
      capturarErro(q.query(`insert into public.historias (titulo, coluna) values ('Atalho', $1)`, [destino])),
    )
    expect(erro.code).toBe('HA002')
  })

  it('sem sessão, não tira da Homologação o que uma pessoa pôs lá', async () => {
    const erro = await banco.desfazendo(async (q) => {
      await comSessaoDe(q, editor)
      await q.query(`update public.historias set coluna = 'homologacao' where numero = 7`)
      await comSessaoDe(q, null)
      return capturarErro(q.query(`update public.historias set coluna = 'desenvolvimento' where numero = 7`))
    })
    expect(erro.code).toBe('HA002')
  })

  it('sem sessão, edita o texto de uma história em Homologação sem mudar a coluna', async () => {
    await banco.desfazendo(async (q) => {
      await comSessaoDe(q, editor)
      await q.query(`update public.historias set coluna = 'homologacao' where numero = 7`)
      await comSessaoDe(q, null)
      const { affectedRows } = await q.query(
        `update public.historias set observacoes = 'Conferida com a Helena.' where numero = 7`,
      )
      expect(affectedRows).toBe(1)
      expect(await colunaDa(q, 7)).toBe('homologacao')
    })
  })

  it('quem entrou no sistema leva de Teste para Homologação e depois para Concluído', async () => {
    await banco.comoUsuario(editor, async (q) => {
      await q.query(`update public.historias set coluna = 'homologacao' where numero = 7`)
      await q.query(`update public.historias set coluna = 'concluido' where numero = 7`)
      expect(await colunaDa(q, 7)).toBe('concluido')
    })
  })

  it('quem entrou no sistema pode devolver da Homologação ao Desenvolvimento', async () => {
    await banco.comoUsuario(editor, async (q) => {
      await q.query(`update public.historias set coluna = 'homologacao' where numero = 7`)
      await q.query(`update public.historias set coluna = 'desenvolvimento' where numero = 7`)
      expect(await colunaDa(q, 7)).toBe('desenvolvimento')
    })
  })

  it('nem uma pessoa pula de Teste direto para Concluído', async () => {
    const erro = await banco.comoUsuario(editor, (q) =>
      capturarErro(q.query(`update public.historias set coluna = 'concluido' where numero = 7`)),
    )
    expect(erro.code).toBe('HA002')
    expect(erro.message).toContain('depois de passar pela Homologação')
  })

  it('nem uma pessoa cria história direto em Concluído', async () => {
    const erro = await banco.comoUsuario(editor, (q) =>
      capturarErro(q.query(`insert into public.historias (titulo, coluna) values ('Pronta', 'concluido')`)),
    )
    expect(erro.code).toBe('HA002')
  })

  it('a trilha registra quem levou para Homologação, com o "de → para"', async () => {
    await banco.comoUsuario(editor, async (q) => {
      await q.query(`update public.historias set coluna = 'homologacao' where numero = 7`)
      await q.exec('reset role')
      const { rows } = await q.query<{ usuario: string; detalhes: string; payload: Record<string, unknown> }>(
        `select usuario, detalhes, payload from public.logs_atividade
          where entidade = 'historias' order by created desc limit 1`,
      )
      expect(rows[0].usuario).toBe(editor)
      expect(rows[0].detalhes).toBe('editou historias "Imóvel acompanha o contrato"')
      expect(rows[0].payload).toMatchObject({ coluna: { de: 'teste', para: 'homologacao' } })
    })
  })
})

describe('quem vê e quem edita (RN-QDR-03)', () => {
  it('quem não tem o módulo não vê nenhuma história nem atividade', async () => {
    await banco.comoUsuario(semAcesso, async (q) => {
      const historias = await q.query(`select 1 from public.historias`)
      const atividades = await q.query(`select 1 from public.historias_atividades`)
      expect(historias.rows).toHaveLength(0)
      expect(atividades.rows).toHaveLength(0)
    })
  })

  it('visitante sem login não lê o quadro', async () => {
    const erro = await banco.comoAnonimo((q) => capturarErro(q.query(`select 1 from public.historias`)))
    expect(erro.code).toBe('42501')
  })

  it('com visualização, vê tudo, mas não cria nem altera', async () => {
    await banco.comoUsuario(leitor, async (q) => {
      const { rows } = await q.query<{ total: number }>(`select count(*)::int as total from public.historias`)
      expect(rows[0].total).toBe(TOTAL_DA_CARGA)
      const alterada = await q.query(`update public.historias set titulo = 'Mudou' where numero = 1`)
      const marcada = await q.query(`update public.historias_atividades set concluida = true`)
      expect(alterada.affectedRows).toBe(0)
      expect(marcada.affectedRows).toBe(0)
    })
    const erro = await banco.comoUsuario(leitor, (q) =>
      capturarErro(q.query(`insert into public.historias (titulo) values ('Nova')`)),
    )
    expect(erro.code).toBe('42501')
  })

  it('com edição, cria história, edita o texto e cuida das atividades', async () => {
    await banco.comoUsuario(editor, async (q) => {
      const { rows } = await q.query<{ id: string; created_by: string }>(
        `insert into public.historias (titulo, tag, eu, quero, para)
         values ('Enviar o recibo por WhatsApp', 'Financeiro', 'Marcos, assistente administrativo',
                 'mandar o recibo pelo WhatsApp da inquilina', 'ela não precisar pedir por e-mail')
         returning id, created_by`,
      )
      expect(rows[0].created_by).toBe(editor)
      const historia = rows[0].id

      const atividade = await q.query<{ id: string }>(
        `insert into public.historias_atividades (historia, titulo, ordem) values ($1, 'Gerar o PDF do recibo', 1) returning id`,
        [historia],
      )
      const marcada = await q.query(`update public.historias_atividades set concluida = true where id = $1`, [
        atividade.rows[0].id,
      ])
      const apagada = await q.query(`delete from public.historias_atividades where id = $1`, [atividade.rows[0].id])
      expect(marcada.affectedRows).toBe(1)
      expect(apagada.affectedRows).toBe(1)
    })
  })

  it('ninguém exclui história, nem o administrador', async () => {
    const erro = await banco.comoUsuario(admin, (q) =>
      capturarErro(q.query(`delete from public.historias where numero = 1`)),
    )
    expect(erro.code).toBe('42501')
  })

  it('título em branco é recusado, na história e na atividade', async () => {
    const naHistoria = await banco.comoUsuario(editor, (q) =>
      capturarErro(q.query(`insert into public.historias (titulo) values ('   ')`)),
    )
    expect(naHistoria.message).toContain('historias_titulo_preenchido')

    const naAtividade = await banco.comoUsuario(editor, (q) =>
      capturarErro(
        q.query(
          `insert into public.historias_atividades (historia, titulo)
           select id, '' from public.historias where numero = 1`,
        ),
      ),
    )
    expect(naAtividade.message).toContain('historias_atividades_titulo_preenchido')
  })
})
