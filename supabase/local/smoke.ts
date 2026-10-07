/**
 * Fumaça do Supabase local: exercita, com o supabase-js de verdade, o que as
 * telas pedem ao servidor. Roda contra o servidor já no ar:
 *
 *   pnpm supabase:local            (em outro terminal)
 *   pnpm smoke:local
 *
 * Imprime ok/falhou por item e sai com código 1 se algo falhar. No fim chama
 * POST /__reset, então deixa o banco como a semente.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { request } from 'node:http'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { RELACOES, chaveEstrangeira } from '../../src/lib/dados/esquema.ts'
import { CHAVE_ANONIMA } from './chaves.ts'

const URL_LOCAL = process.env.SUPABASE_LOCAL_URL ?? 'http://localhost:54321'
const { contas } = JSON.parse(
  readFileSync(join(import.meta.dirname, '.contas-locais.json'), 'utf8'),
) as {
  contas: { email: string; senha: string }[]
}
const senhaDe = (email: string) => contas.find((c) => c.email === email)!.senha

const resultados: { nome: string; ok: boolean; motivo?: string }[] = []
async function item(nome: string, fn: () => Promise<void>) {
  try {
    await fn()
    resultados.push({ nome, ok: true })
  } catch (erro) {
    resultados.push({ nome, ok: false, motivo: (erro as Error).message })
  }
}
function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(mensagem)
}
const igual = (obtido: unknown, esperado: unknown, o: string) =>
  afirmar(
    obtido === esperado,
    `${o}: esperado ${JSON.stringify(esperado)}, veio ${JSON.stringify(obtido)}`,
  )

const novoCliente = () =>
  createClient(URL_LOCAL, CHAVE_ANONIMA, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

async function entrar(email: string, senha = senhaDe(email)): Promise<SupabaseClient> {
  const cliente = novoCliente()
  const { error } = await cliente.auth.signInWithPassword({ email, password: senha })
  if (error) throw new Error(`login de ${email}: ${error.message}`)
  return cliente
}

/** Mesma montagem de `montarSelect` em src/lib/dados/cliente.ts (aquele arquivo depende do Vite e não roda no Node). */
function montarSelect(tabela: string, expand?: string): string {
  if (!expand) return '*'
  const embutidos = expand
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .map((caminho) => {
      const [campo, subcampo] = caminho.split('.')
      const alvo = RELACOES[tabela]?.[campo]
      if (!alvo) return ''
      const fk = chaveEstrangeira(tabela, campo)
      const subAlvo = subcampo && RELACOES[alvo]?.[subcampo]
      if (!subAlvo) return `exp__${campo}:${alvo}!${fk}(*)`
      return `exp__${campo}:${alvo}!${fk}(*, exp__${subcampo}:${subAlvo}!${chaveEstrangeira(alvo, subcampo)}(*))`
    })
  return ['*', ...embutidos.filter(Boolean)].join(', ')
}

/** Quanto cada tabela deve ter, no mínimo, logo após a semente. */
const MINIMO: Record<string, number> = {
  users: 5,
  permissoes: 70,
  imoveis: 3,
  imovel_unidades: 3,
  locadores: 3,
  fiadores: 2,
  inquilinos: 4,
  fornecedores: 2,
  categorias_financeiras: 13,
  contratos: 3,
  receitas: 7,
  despesas: 6,
  iptu_taxas: 2,
  contas_bancarias: 1,
  importacoes: 1,
  transacoes_importadas: 3,
  convites: 1,
  logs_atividade: 1,
  historias: 59,
  historias_atividades: 1,
  documentos_anexos: 0,
}

// ---------------------------------------------------------------------------

const admin = await entrar('admin@teste.local')
const editor = await entrar('editor@teste.local')
const leitor = await entrar('leitor@teste.local')
const restrito = await entrar('restrito@teste.local')
const anonimo = novoCliente()

// Autenticação ------------------------------------------------------------------
for (const { email } of contas) {
  await item(`login de ${email}`, async () => {
    const { data, error } = await novoCliente().auth.signInWithPassword({
      email,
      password: senhaDe(email),
    })
    afirmar(!error && data.session?.access_token, error?.message ?? 'sem sessão')
  })
}
await item('senha errada: AuthApiError 400 "Invalid login credentials"', async () => {
  const { error } = await novoCliente().auth.signInWithPassword({
    email: 'admin@teste.local',
    password: 'errada-123',
  })
  igual(error?.status, 400, 'status')
  igual(error?.message, 'Invalid login credentials', 'mensagem')
  igual(error?.name, 'AuthApiError', 'tipo')
})
await item(
  'inativo entra no Auth, mas o perfil vem inativo (use-auth o derruba) e o negócio fica fechado',
  async () => {
    const inativo = await entrar('inativo@teste.local')
    const { data: perfil } = await inativo.from('users').select('id, ativo').maybeSingle()
    igual(perfil?.ativo, false, 'perfil.ativo')
    const { data: imoveis } = await inativo.from('imoveis').select('id')
    igual(imoveis?.length, 0, 'imóveis visíveis')
    const { error } = await inativo.from('imoveis').insert({ endereco: 'Rua Proibida, 1' })
    igual(error?.code, '42501', 'insert')
  },
)
await item('getUser, refreshSession e perfil do próprio usuário', async () => {
  const { data } = await editor.auth.getUser()
  igual(data.user?.email, 'editor@teste.local', 'getUser')
  const { data: renovada, error } = await editor.auth.refreshSession()
  afirmar(!error && renovada.session?.access_token, error?.message ?? 'sem sessão renovada')
  const { data: perfil } = await editor
    .from('users')
    .select('id, email, name, perfil, ativo, avatar')
    .eq('id', data.user!.id)
    .maybeSingle()
  igual(perfil?.perfil, 'usuario', 'perfil')
})
await item('API sem apikey: 401', async () => {
  const r = await fetch(`${URL_LOCAL}/rest/v1/historias?select=id`)
  igual(r.status, 401, 'status')
})
await item('CORS: libera localhost, não libera outra origem', async () => {
  const pedido = (origem: string) =>
    fetch(`${URL_LOCAL}/rest/v1/imoveis`, {
      method: 'OPTIONS',
      headers: { Origin: origem, 'Access-Control-Request-Method': 'GET' },
    })
  const local = await pedido('http://localhost:8083')
  igual(local.status, 204, 'status')
  igual(local.headers.get('access-control-allow-origin'), 'http://localhost:8083', 'origem local')
  igual(
    (await pedido('https://exemplo.com')).headers.get('access-control-allow-origin'),
    null,
    'origem externa',
  )
})

// Leitura: toda tabela, com o mesmo select do montarSelect --------------------------
const relacionadas = Object.keys(RELACOES)
const todasAsTabelas = [
  ...relacionadas,
  ...Object.keys(MINIMO).filter((t) => !relacionadas.includes(t)),
]
for (const tabela of todasAsTabelas) {
  await item(`lista ${tabela} com expand`, async () => {
    const campos = Object.keys(RELACOES[tabela] ?? {})
    const { data, error, count } = await admin
      .from(tabela)
      .select(montarSelect(tabela, campos.join(',')), { count: 'exact' })
      .range(0, 29)
    afirmar(!error, error?.message ?? '')
    afirmar((count ?? 0) >= (MINIMO[tabela] ?? 0), `count ${count} < ${MINIMO[tabela]}`)
    for (const linha of (data ?? []) as any[]) {
      for (const campo of campos.filter((c) => linha[c])) {
        // O embed traz o registro apontado pela coluna, e a coluna continua com o id.
        igual(linha[`exp__${campo}`]?.id, linha[campo], `${tabela}.${campo} embutido`)
      }
    }
  })
}
await item('dois níveis: transacoes_importadas → importacao.conta_bancaria', async () => {
  const { data, error } = await admin
    .from('transacoes_importadas')
    .select(montarSelect('transacoes_importadas', 'importacao.conta_bancaria'))
    .limit(1)
  afirmar(!error, error?.message ?? '')
  igual(
    (data as any)[0].exp__importacao.exp__conta_bancaria.nome,
    'Conta Corrente Principal',
    'conta embutida',
  )
})
await item('embed sem apelido e um-para-muitos: imoveis → imovel_unidades(*)', async () => {
  const { data, error } = await admin
    .from('imoveis')
    .select('nome, imovel_unidades(identificador)')
    .eq('codigo', 'IMV-002')
    .single()
  afirmar(!error, error?.message ?? '')
  igual((data as any).imovel_unidades.length, 3, 'unidades')
})
await item('count exact + range: páginas, última página e vazio', async () => {
  const pagina = (de: number, ate: number) =>
    admin
      .from('imoveis')
      .select('id', { count: 'exact' })
      .order('created', { ascending: false, nullsFirst: false })
      .range(de, ate)
  const a = await pagina(0, 1)
  igual(a.data?.length, 2, 'página 1')
  igual(a.count, 3, 'total')
  const b = await pagina(2, 3)
  igual(b.data?.length, 1, 'página 2')
  igual(b.count, 3, 'total na página 2')
  const vazio = await admin
    .from('imoveis')
    .select('id', { count: 'exact' })
    .eq('codigo', 'NAO-EXISTE')
    .range(0, 9)
  igual(vazio.count, 0, 'count vazio')
  igual(vazio.data?.length, 0, 'linhas vazias')
})
await item(
  'filtros: eq, neq, in, ilike, or, is.null, not.is.null, gte/lte, order múltiplo',
  async () => {
    const n = async (q: PromiseLike<{ data: any[] | null; error: any }>) => {
      const { data, error } = await q
      afirmar(!error, error?.message)
      return data!.length
    }
    igual(await n(admin.from('contratos').select('id').eq('status', 'ativo')), 2, 'eq')
    igual(await n(admin.from('contratos').select('id').neq('status', 'ativo')), 1, 'neq')
    igual(
      await n(admin.from('imoveis').select('id').in('codigo', ['IMV-001', 'IMV-003', 'XXX'])),
      2,
      'in',
    )
    igual(await n(admin.from('imoveis').select('id').ilike('nome', '%CASA%')), 1, 'ilike')
    igual(
      await n(admin.from('imoveis').select('id').or('nome.ilike.*apartamento*,codigo.eq.IMV-003')),
      2,
      'or',
    )
    igual(await n(admin.from('inquilinos').select('id').is('cnpj', null)), 3, 'is null')
    igual(await n(admin.from('inquilinos').select('id').not('cnpj', 'is', null)), 1, 'not is null')
    igual(
      await n(
        admin
          .from('receitas')
          .select('id')
          .gte('data_vencimento', '2000-01-01')
          .lte('data_vencimento', '2100-01-01'),
      ),
      7,
      'gte/lte',
    )
    igual(await n(admin.from('iptu_taxas').select('id').eq('status', 'vencido')), 1, 'iptu vencido')
    const { data } = await admin
      .from('receitas')
      .select('competencia, valor')
      .order('competencia', { ascending: false })
      .order('valor', { ascending: true, nullsFirst: false })
    afirmar(data![0].competencia >= data![data!.length - 1].competencia, 'ordem decrescente')
  },
)
await item('tipos como no PostgREST: numeric vira número, timestamptz vira texto ISO', async () => {
  const { data } = await admin.from('receitas').select('valor, created').limit(1).single()
  igual(typeof data!.valor, 'number', 'valor')
  afirmar(
    typeof data!.created === 'string' && /^\d{4}-\d\d-\d\dT/.test(data!.created),
    `created: ${data!.created}`,
  )
})
await item('single/maybeSingle: 0 linhas = PGRST116 (406), maybeSingle devolve null', async () => {
  const um = await admin.from('imoveis').select('id').eq('codigo', 'NAO-EXISTE').single()
  igual(um.error?.code, 'PGRST116', 'código')
  igual(um.status, 406, 'status')
  const talvez = await admin.from('imoveis').select('id').eq('codigo', 'NAO-EXISTE').maybeSingle()
  afirmar(!talvez.error && talvez.data === null, 'maybeSingle')
})
await item('tabela inexistente: 404', async () => {
  const { error, status } = await admin.from('nao_existe').select('*')
  igual(status, 404, 'status')
  afirmar(error, 'sem erro')
})
await item(
  'logs_atividade: busca textual como o serviço faz (detalhes/acao/entidade ilike)',
  async () => {
    // `acao` é enum: o Postgres não faz ILIKE em enum. O PostgREST de produção responde igual a este servidor.
    const { error } = await admin
      .from('logs_atividade')
      .select('*')
      .or('detalhes.ilike.*imovel*,entidade.ilike.*imovel*')
    afirmar(!error, error?.message ?? '')
  },
)

// Escrita: RLS, regras e erros ----------------------------------------------------------
await item('editor cria, edita e exclui um imóvel (select().single() em cada passo)', async () => {
  const criado = await editor
    .from('imoveis')
    .insert({ nome: 'Imóvel de fumaça', endereco: 'Rua da Fumaça, 1', tipo: 'casa' })
    .select()
    .single()
  afirmar(!criado.error, criado.error?.message ?? '')
  igual(criado.status, 201, 'status do insert')
  const id = criado.data!.id
  igual(criado.data!.updated_by !== null, true, 'autoria carimbada pelo gatilho')
  const editado = await editor
    .from('imoveis')
    .update({ nome: 'Imóvel de fumaça (editado)', area: 55.5 })
    .eq('id', id)
    .select()
    .single()
  afirmar(!editado.error, editado.error?.message ?? '')
  igual(editado.data!.nome, 'Imóvel de fumaça (editado)', 'nome')
  igual(editado.data!.area, 55.5, 'área')
  const apagado = await editor.from('imoveis').delete().eq('id', id)
  afirmar(!apagado.error, apagado.error?.message ?? '')
  igual(apagado.status, 204, 'status do delete')
  const { data } = await editor.from('imoveis').select('id').eq('id', id)
  igual(data?.length, 0, 'depois de excluir')
})
await item('leitor não escreve: insert = 42501 (403), update/delete não alteram nada', async () => {
  const insert = await leitor.from('imoveis').insert({ endereco: 'Rua Proibida, 2' })
  igual(insert.error?.code, '42501', 'código')
  igual(insert.status, 403, 'status')
  const { data: alvo } = await leitor
    .from('imoveis')
    .select('id, nome')
    .eq('codigo', 'IMV-001')
    .single()
  const update = await leitor
    .from('imoveis')
    .update({ nome: 'Invadido' })
    .eq('id', alvo!.id)
    .select()
    .single()
  igual(update.error?.code, 'PGRST116', 'update sem linhas visíveis')
  const { data: depois } = await admin.from('imoveis').select('nome').eq('id', alvo!.id).single()
  igual(depois!.nome, alvo!.nome, 'nome intacto')
})
await item(
  'restrito vê imóveis, mas não contratos; anon não lê dado de negócio (401); quadro é público',
  async () => {
    const imoveis = await restrito.from('imoveis').select('id')
    igual(imoveis.data?.length, 3, 'imóveis do restrito')
    const contratos = await restrito.from('contratos').select('id')
    igual(contratos.data?.length, 0, 'contratos do restrito')
    for (const tabela of ['imoveis', 'inquilinos', 'users', 'logs_atividade']) {
      const r = await anonimo.from(tabela).select('*')
      igual(r.error?.code, '42501', `anon em ${tabela}`)
      igual(r.status, 401, `status anon em ${tabela}`)
    }
    const quadro = await anonimo.from('historias').select('id').limit(1)
    afirmar(!quadro.error && quadro.data!.length === 1, quadro.error?.message ?? 'quadro vazio')
  },
)
await item('só o administrador lê users e permissões de todos; editor só a si', async () => {
  igual((await admin.from('users').select('id')).data?.length, 5, 'admin')
  igual((await editor.from('users').select('id')).data?.length, 1, 'editor')
  igual((await editor.from('permissoes').select('id')).data?.length, 14, 'permissões do editor')
})
await item('upsert de permissões (onConflict usuario,modulo): admin pode, editor não', async () => {
  const { data: u } = await admin
    .from('users')
    .select('id')
    .eq('email', 'leitor@teste.local')
    .single()
  const linhas = [
    { usuario: u!.id, modulo: 'imoveis', nivel: 'edicao' },
    { usuario: u!.id, modulo: 'quadro', nivel: 'visualizacao' },
  ]
  const ok = await admin.from('permissoes').upsert(linhas, { onConflict: 'usuario,modulo' })
  afirmar(!ok.error, ok.error?.message ?? '')
  const { data: p } = await admin
    .from('permissoes')
    .select('nivel')
    .eq('usuario', u!.id)
    .eq('modulo', 'imoveis')
    .single()
  igual(p!.nivel, 'edicao', 'nível gravado')
  afirmar(
    (await editor.from('permissoes').upsert(linhas, { onConflict: 'usuario,modulo' })).error,
    'editor não deveria conseguir',
  )
})
await item(
  'erros do banco viram status e códigos do PostgREST (23505→409, 23514→400, 22P02→400, HA001→400)',
  async () => {
    const { data: inq } = await admin
      .from('inquilinos')
      .select('cpf')
      .eq('nome', 'João da Silva Souza')
      .single()
    const duplicado = await admin.from('inquilinos').insert({ nome: 'Duplicado', cpf: inq!.cpf })
    igual(duplicado.error?.code, '23505', 'código unique')
    igual(duplicado.status, 409, 'status unique')
    const negativo = await admin.from('imoveis').insert({ endereco: 'Rua X', valor: -1 })
    igual(negativo.error?.code, '23514', 'código check')
    igual(negativo.status, 400, 'status check')
    const enumRuim = await admin.from('imoveis').insert({ endereco: 'Rua X', tipo: 'castelo' })
    igual(enumRuim.error?.code, '22P02', 'código enum')
    igual(enumRuim.status, 400, 'status enum')
    const { data: imovel } = await admin
      .from('imoveis')
      .select('id')
      .eq('codigo', 'IMV-001')
      .single()
    const ocupado = await admin.from('imoveis').delete().eq('id', imovel!.id)
    igual(ocupado.error?.code, 'HA001', 'código HA001')
    igual(ocupado.status, 400, 'status HA001')
    const semFiltro = await fetch(`${URL_LOCAL}/rest/v1/imoveis`, {
      method: 'PATCH',
      body: '{"nome":"x"}',
      headers: {
        apikey: CHAVE_ANONIMA,
        authorization: `Bearer ${(await admin.auth.getSession()).data.session!.access_token}`,
        'content-type': 'application/json',
      },
    })
    igual(semFiltro.status, 400, 'PATCH sem filtro')
    igual(((await semFiltro.json()) as any).code, '21000', 'código sem filtro')
  },
)
await item(
  'CPF inválido é recusado pelo banco (documento com dígito verificador errado)',
  async () => {
    const { error } = await admin
      .from('inquilinos')
      .insert({ nome: 'CPF ruim', cpf: '111.444.777-00' })
    igual(error?.code, '23514', 'código')
  },
)

// RPC ----------------------------------------------------------------------------------
await item('rpc proximo_numero_contrato({p_ano: 2026}) devolve texto NNN/2026', async () => {
  const { data, error } = await editor.rpc('proximo_numero_contrato', { p_ano: 2026 })
  afirmar(!error, error?.message ?? '')
  afirmar(typeof data === 'string' && /^\d{3}\/2026$/.test(data), `veio ${JSON.stringify(data)}`)
})
await item('rpc validar_convite: sem login, devolve linhas (returns table)', async () => {
  const bom = await anonimo.rpc('validar_convite', { p_token: 'convite-local-0001' })
  afirmar(!bom.error, bom.error?.message ?? '')
  igual(Array.isArray(bom.data), true, 'array')
  igual(bom.data[0].valido, true, 'válido')
  igual(bom.data[0].email, 'convidado@teste.local', 'e-mail')
  igual(
    (await anonimo.rpc('validar_convite', { p_token: 'nada' })).data[0].valido,
    false,
    'token ruim',
  )
})
await item(
  'rpc importar_extrato: editor grava importação + transações (uuid); leitor e anon recusados',
  async () => {
    const { data: conta } = await editor.from('contas_bancarias').select('id').limit(1).single()
    const argumentos = {
      p_importacao: { conta_bancaria: conta!.id, arquivo_nome: 'fumaca.csv', formato: 'csv' },
      p_transacoes: [
        { data: '2026-09-01', descricao: 'Teste um', valor: 100, tipo: 'credito' },
        { data: '2026-09-02', descricao: 'Teste dois', valor: 50.5, tipo: 'debito' },
      ],
    }
    const ok = await editor.rpc('importar_extrato', argumentos)
    afirmar(!ok.error, ok.error?.message ?? '')
    afirmar(typeof ok.data === 'string' && ok.data.length === 36, `uuid: ${ok.data}`)
    const { count } = await editor
      .from('transacoes_importadas')
      .select('id', { count: 'exact', head: true })
      .eq('importacao', ok.data)
    igual(count, 2, 'transações gravadas')
    igual((await leitor.rpc('importar_extrato', argumentos)).error?.code, '42501', 'leitor')
    const semLogin = await anonimo.rpc('importar_extrato', argumentos)
    igual(semLogin.error?.code, '42501', 'anon')
    igual(semLogin.status, 401, 'status anon')
    igual((await editor.rpc('nao_existe', {})).status, 404, 'função inexistente')
  },
)

// Storage ------------------------------------------------------------------------------
await item(
  'storage: upload (FormData), link assinado, download, remoção; anon e bucket inexistente recusados',
  async () => {
    const conteudo = 'contrato de fumaça — acentuação ok'
    const caminho = `fumaca-${Date.now()}.txt`
    const arquivo = new File([conteudo], 'c.txt', { type: 'text/plain' })
    const up = await editor.storage
      .from('contratos-documentos')
      .upload(caminho, arquivo, { contentType: 'text/plain', upsert: false })
    afirmar(!up.error, up.error?.message ?? '')
    igual(up.data!.path, caminho, 'path')
    const dup = await editor.storage
      .from('contratos-documentos')
      .upload(caminho, arquivo, { upsert: false })
    afirmar(dup.error, 'duplicado deveria falhar')
    const { data: link, error } = await editor.storage
      .from('contratos-documentos')
      .createSignedUrl(caminho, 60)
    afirmar(!error && link?.signedUrl, error?.message ?? 'sem link')
    const baixado = await fetch(link!.signedUrl)
    igual(baixado.status, 200, 'download')
    igual(await baixado.text(), conteudo, 'conteúdo')
    igual(
      (await fetch(link!.signedUrl.replace(/token=[^&]+/, 'token=adulterado'))).status,
      400,
      'token adulterado',
    )
    afirmar(
      (await anonimo.storage.from('contratos-documentos').upload('anon.txt', arquivo)).error,
      'anon não deveria subir',
    )
    afirmar(
      (await editor.storage.from('bucket-que-nao-existe').upload('a.txt', arquivo)).error,
      'bucket inexistente',
    )
    const rm = await editor.storage.from('contratos-documentos').remove([caminho])
    afirmar(!rm.error, rm.error?.message ?? '')
    igual(rm.data?.length, 1, 'removidos')
    igual((await fetch(link!.signedUrl)).status, 404, 'depois de remover')
  },
)

// Cadastro, convite e recuperação ---------------------------------------------------------
await item(
  'signUp pelo convite: sessão na hora, perfil criado pelo gatilho, senha trocada com updateUser',
  async () => {
    const novo = novoCliente()
    const { data, error } = await novo.auth.signUp({
      email: 'convidado@teste.local',
      password: 'Senha-Inicial-1',
      options: { data: { name: 'Pessoa Convidada', convite_token: 'convite-local-0001' } },
    })
    afirmar(!error && data.session, error?.message ?? 'sem sessão')
    const { data: perfil } = await novo
      .from('users')
      .select('name, perfil, ativo')
      .eq('id', data.user!.id)
      .single()
    igual(perfil!.name, 'Pessoa Convidada', 'nome')
    igual(perfil!.ativo, true, 'ativo')
    const { data: convite } = await admin
      .from('convites')
      .select('status')
      .eq('email', 'convidado@teste.local')
      .single()
    igual(convite!.status, 'aceito', 'convite aceito pelo gatilho')
    const repetido = await novoCliente().auth.signUp({
      email: 'convidado@teste.local',
      password: 'Senha-Inicial-1',
    })
    igual(repetido.error?.message, 'User already registered', 'e-mail repetido')
    afirmar(
      (await novoCliente().auth.signUp({ email: 'curta@teste.local', password: '123' })).error,
      'senha curta deveria falhar',
    )
    const troca = await novo.auth.updateUser({ password: 'Senha-Nova-2' })
    afirmar(!troca.error, troca.error?.message ?? '')
    afirmar(
      !(
        await novoCliente().auth.signInWithPassword({
          email: 'convidado@teste.local',
          password: 'Senha-Nova-2',
        })
      ).error,
      'login com a senha nova',
    )
    igual(
      (await novo.auth.updateUser({ password: 'Senha-Nova-2' })).error?.message,
      'New password should be different from the old password.',
      'mesma senha',
    )
    afirmar(!(await novo.auth.signOut()).error, 'signOut')
  },
)
await item(
  'signUp sem o token do convite (ou com token de outro e-mail): a conta nasce inativa e sem permissão',
  async () => {
    // O e-mail do convite pendente é de outra pessoa; quem não sabe o token não o herda.
    await admin.from('convites').insert({
      email: 'pendente@teste.local',
      token: 'convite-local-0002',
      perfil: 'administrador',
      data_expiracao: new Date(Date.now() + 86_400_000).toISOString(),
    })
    for (const [email, token] of [
      ['pendente@teste.local', undefined],
      ['intruso@teste.local', 'convite-local-0002'],
    ] as const) {
      const novo = novoCliente()
      const { data, error } = await novo.auth.signUp({
        email,
        password: 'Senha-Inicial-1',
        options: { data: token ? { convite_token: token } : {} },
      })
      afirmar(!error && data.user, error?.message ?? 'sem usuário')
      const { data: perfil } = await novo.from('users').select('perfil, ativo').eq('id', data.user!.id).single()
      igual(perfil!.perfil, 'usuario', `perfil de ${email}`)
      igual(perfil!.ativo, false, `inativo: ${email}`)
      // Conta inativa não lê nem o vocabulário compartilhado.
      const { data: categorias } = await novo.from('categorias_financeiras').select('id')
      igual(categorias!.length, 0, `categorias lidas por ${email}`)
    }
    const { data: convite } = await admin.from('convites').select('status').eq('token', 'convite-local-0002').single()
    igual(convite!.status, 'pendente', 'convite continua pendente')
  },
)
await item(
  'recuperação de senha: resetPasswordForEmail responde igual com e sem conta; link fica em /__emails',
  async () => {
    const cliente = novoCliente()
    afirmar(
      !(
        await cliente.auth.resetPasswordForEmail('editor@teste.local', {
          redirectTo: 'http://localhost:8083/redefinir-senha',
        })
      ).error,
      'com conta',
    )
    afirmar(!(await cliente.auth.resetPasswordForEmail('ninguem@teste.local')).error, 'sem conta')
    const caixa = (await (await fetch(`${URL_LOCAL}/__emails`)).json()) as {
      para: string
      link: string
    }[]
    igual(caixa.length, 1, 'só quem tem conta recebe')
    afirmar(
      caixa[0].link.startsWith('http://localhost:8083/redefinir-senha#access_token=') &&
        caixa[0].link.includes('type=recovery'),
      caixa[0].link,
    )
  },
)

// Tempo real: recusado sem derrubar o servidor ------------------------------------------------
await item('websocket do realtime é recusado e o servidor segue de pé', async () => {
  const status = await new Promise<number>((resolve, reject) => {
    const pedido = request(`${URL_LOCAL}/realtime/v1/websocket?apikey=x`, {
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
        'Sec-WebSocket-Version': '13',
      },
    })
    pedido
      .on('response', (r) => resolve(r.statusCode ?? 0))
      .on('upgrade', () => reject(new Error('aceitou o upgrade')))
      .on('error', reject)
      .end()
  })
  igual(status, 501, 'status do upgrade')
  igual((await fetch(`${URL_LOCAL}/__saude`)).status, 200, 'saúde depois do upgrade')
})

// Reset ----------------------------------------------------------------------------------------
await item('/__reset volta o banco à semente (e invalida sessões antigas)', async () => {
  const { data } = await admin
    .from('imoveis')
    .insert({ endereco: 'Rua do Reset, 1' })
    .select()
    .single()
  igual(
    (await admin.from('imoveis').select('id', { count: 'exact', head: true })).count,
    4,
    'antes do reset',
  )
  igual((await fetch(`${URL_LOCAL}/__reset`, { method: 'POST' })).status, 200, 'status do reset')
  const novo = await entrar('admin@teste.local')
  igual(
    (await novo.from('imoveis').select('id', { count: 'exact', head: true })).count,
    3,
    'depois do reset',
  )
  igual(
    (await novo.from('imoveis').select('id').eq('id', data!.id)).data?.length,
    0,
    'o imóvel do teste sumiu',
  )
})

// ---------------------------------------------------------------------------------------------
for (const r of resultados)
  console.log(`${r.ok ? 'ok     ' : 'FALHOU '} ${r.nome}${r.ok ? '' : `\n          ${r.motivo}`}`)
const ok = resultados.filter((r) => r.ok).length
console.log(`\n${ok}/${resultados.length} ok`)
process.exit(ok === resultados.length ? 0 : 1)
