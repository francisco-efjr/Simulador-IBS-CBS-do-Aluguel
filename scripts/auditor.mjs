#!/usr/bin/env node
/**
 * Auditor — funções de aptidão do Controle de Imóveis.
 *
 * "Função de aptidão" (fitness function, em Richards & Ford, *Fundamentos da
 * Arquitetura de Software*) é uma verificação objetiva e automática de uma
 * característica que a arquitetura promete manter: o código compila, os
 * testes passam, a tela não fala direto com o banco, toda tabela tem RLS, e
 * assim por diante. Este script roda todas elas e grava o resultado em
 * `src/data/auditoria.json`, que a página pública (`/`) mostra na seção
 * "Saúde do sistema".
 *
 * Uso:
 *   node scripts/auditor.mjs             roda tudo e sai 0 (usado no build)
 *   node scripts/auditor.mjs --estrito   sai 1 se alguma verificação falhar (CI)
 *   node scripts/auditor.mjs --markdown  não roda nada: imprime o último
 *                                        auditoria.json como tabela Markdown
 *                                        (resumo do job no GitHub Actions)
 *
 * Regras de desenho:
 *   - Node puro, sem dependência nova.
 *   - Cada verificação tem tempo limite; a falha de uma não impede as outras.
 *   - Funciona sem `.git` (a Vercel não entrega o histórico ao build) e sem as
 *     variáveis do Supabase.
 *   - O `detalhe` vai para a tela pública: escreva para leigo.
 *
 * Como acrescentar uma verificação nova: ver docs/07-auditor.md.
 */
import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ARQUIVO_SAIDA = path.join(RAIZ, 'src/data/auditoria.json')
const ARQUIVO_FEED = path.join(RAIZ, 'src/data/feed.json')

const ARGUMENTOS = new Set(process.argv.slice(2))
const ESTRITO = ARGUMENTOS.has('--estrito')

/**
 * Teto de avisos do lint (catraca). Avisos acima do teto pedem atenção; no teto
 * ou abaixo, está em ordem. Ao corrigir avisos, BAIXE este número no mesmo PR —
 * nunca suba para acomodar aviso novo.
 */
const TETO_DE_AVISOS_DO_LINT = 90

const MINUTO = 60_000

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

const ANSI = /\u001b\[[0-9;?]*[A-Za-z]/g
const semCores = (texto) => texto.replace(ANSI, '')

/**
 * Roda um comando com tempo limite. Nunca rejeita: devolve o código de saída,
 * a saída combinada e se estourou o tempo.
 */
function rodar(comando, argumentos, { tempoLimite }) {
  return new Promise((resolve) => {
    let saida = ''
    let estourou = false
    let filho
    try {
      filho = spawn(comando, argumentos, {
        cwd: RAIZ,
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
        // Grupo de processos próprio, para o tempo limite derrubar também os
        // netos (o pnpm abre o tsc/vitest/oxlint como filhos).
        detached: process.platform !== 'win32',
        shell: process.platform === 'win32',
      })
    } catch (erro) {
      resolve({ codigo: null, saida: String(erro), estourou: false, erro })
      return
    }
    const relogio = setTimeout(() => {
      estourou = true
      try {
        if (process.platform === 'win32') filho.kill('SIGKILL')
        else process.kill(-filho.pid, 'SIGKILL')
      } catch {
        // O processo já terminou.
      }
    }, tempoLimite)
    filho.stdout.on('data', (pedaco) => (saida += pedaco))
    filho.stderr.on('data', (pedaco) => (saida += pedaco))
    filho.on('error', (erro) => {
      clearTimeout(relogio)
      resolve({ codigo: null, saida: saida + String(erro), estourou, erro })
    })
    filho.on('close', (codigo) => {
      clearTimeout(relogio)
      resolve({ codigo, saida: semCores(saida), estourou, erro: null })
    })
  })
}

/** Git sem exceção: devolve a saída (sem quebra final) ou `null`. */
function git(...argumentos) {
  try {
    return execFileSync('git', argumentos, {
      cwd: RAIZ,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 30_000,
    }).trimEnd()
  } catch {
    return null
  }
}

const temGit = () => git('rev-parse', '--is-inside-work-tree') === 'true'

const PASTAS_IGNORADAS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.claude',
  '.vercel',
  '.pnpm-store',
  'coverage',
])

/** Lista arquivos sob `pasta` (relativos à raiz), pulando dependências e builds. */
function listarArquivos(pasta = '.') {
  const resultado = []
  const visitar = (relativo) => {
    let entradas
    try {
      entradas = fs.readdirSync(path.join(RAIZ, relativo), { withFileTypes: true })
    } catch {
      return
    }
    for (const entrada of entradas) {
      if (PASTAS_IGNORADAS.has(entrada.name)) continue
      const caminho = relativo === '.' ? entrada.name : path.posix.join(relativo, entrada.name)
      if (entrada.isDirectory()) visitar(caminho)
      else if (entrada.isFile()) resultado.push(caminho)
    }
  }
  visitar(pasta)
  return resultado
}

function lerTexto(relativo) {
  try {
    const completo = path.join(RAIZ, relativo)
    if (fs.statSync(completo).size > 1024 * 1024) return null
    return fs.readFileSync(completo, 'utf8')
  } catch {
    return null
  }
}

const plural = (n, singular, pluralForma) => `${n} ${n === 1 ? singular : pluralForma}`

/** Data AAAA-MM-DD no calendário de Brasília. */
function dataEmBrasilia(instante) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante)
}

const dataCurta = (aaaammdd) => aaaammdd.split('-').reverse().join('/')

// ---------------------------------------------------------------------------
// Funções de aptidão
//
// Cada uma devolve { situacao: 'ok' | 'atencao' | 'falha', detalhe }.
// `nome` e `detalhe` aparecem na página pública: linguagem de leigo.
// ---------------------------------------------------------------------------

const VERIFICACOES = [
  {
    id: 'tipos',
    nome: 'Código coerente',
    descricao:
      'Confere, antes de publicar, se todas as partes do código se encaixam (checagem de tipos do TypeScript).',
    tempoLimite: 5 * MINUTO,
    async executar() {
      const r = await rodar('pnpm', ['typecheck'], { tempoLimite: this.tempoLimite })
      if (r.estourou)
        return { situacao: 'falha', detalhe: 'A conferência demorou demais e foi interrompida.' }
      if (r.codigo === null)
        return {
          situacao: 'atencao',
          detalhe: 'Não foi possível rodar a conferência neste ambiente.',
        }
      if (r.codigo === 0)
        return { situacao: 'ok', detalhe: 'Todas as partes do código se encaixam corretamente.' }
      const erros = (r.saida.match(/error TS\d+/g) ?? []).length
      return {
        situacao: 'falha',
        detalhe: erros
          ? `O código tem ${plural(erros, 'encaixe errado', 'encaixes errados')}.`
          : 'A conferência do código apontou problema.',
      }
    },
  },
  {
    id: 'testes',
    nome: 'Testes automáticos',
    descricao: 'Roda a bateria de testes que confere os cálculos e o comportamento das telas.',
    tempoLimite: 10 * MINUTO,
    async executar() {
      const r = await rodar('pnpm', ['test'], { tempoLimite: this.tempoLimite })
      if (r.estourou)
        return { situacao: 'falha', detalhe: 'Os testes demoraram demais e foram interrompidos.' }
      if (r.codigo === null)
        return { situacao: 'atencao', detalhe: 'Não foi possível rodar os testes neste ambiente.' }
      const linha = r.saida.match(/^\s*Tests\s+(.+)$/m)?.[1] ?? ''
      const conta = (rotulo) => Number(linha.match(new RegExp(`(\\d+) ${rotulo}`))?.[1] ?? 0)
      const passaram = conta('passed')
      const falharam = conta('failed')
      if (falharam > 0 || r.codigo !== 0) {
        return {
          situacao: 'falha',
          detalhe: falharam
            ? `${plural(falharam, 'teste automático falhou', 'testes automáticos falharam')}, de ${passaram + falharam}.`
            : 'Os testes automáticos não terminaram direito.',
        }
      }
      if (passaram === 0)
        return { situacao: 'atencao', detalhe: 'Nenhum teste automático foi encontrado.' }
      return {
        situacao: 'ok',
        detalhe:
          passaram === 1
            ? 'O único teste automático passou.'
            : `Todos os ${passaram} testes automáticos passaram.`,
      }
    },
  },
  {
    id: 'lint',
    nome: 'Boas práticas de escrita',
    descricao: `Revisa o código contra as regras de escrita do projeto (oxlint). Erro reprova; avisos acima do teto de ${TETO_DE_AVISOS_DO_LINT} pedem atenção.`,
    tempoLimite: 3 * MINUTO,
    async executar() {
      const r = await rodar('pnpm', ['run', 'lint', '--format=json'], {
        tempoLimite: this.tempoLimite,
      })
      if (r.estourou)
        return { situacao: 'falha', detalhe: 'A revisão demorou demais e foi interrompida.' }
      if (r.codigo === null)
        return { situacao: 'atencao', detalhe: 'Não foi possível rodar a revisão neste ambiente.' }
      let diagnosticos
      try {
        diagnosticos = JSON.parse(
          r.saida.slice(r.saida.indexOf('{'), r.saida.lastIndexOf('}') + 1),
        ).diagnostics
      } catch {
        return {
          situacao: 'atencao',
          detalhe: 'A revisão rodou, mas o resultado não pôde ser lido.',
        }
      }
      const erros = diagnosticos.filter((d) => d.severity === 'error').length
      const avisos = diagnosticos.length - erros
      if (erros > 0) {
        return {
          situacao: 'falha',
          detalhe: `${plural(erros, 'erro', 'erros')} de escrita no código para corrigir, além de ${plural(avisos, 'aviso', 'avisos')}.`,
        }
      }
      if (avisos > TETO_DE_AVISOS_DO_LINT) {
        return {
          situacao: 'atencao',
          detalhe: `Nenhum erro, mas os pontos de melhoria subiram de ${TETO_DE_AVISOS_DO_LINT} para ${avisos}.`,
        }
      }
      return {
        situacao: 'ok',
        detalhe: avisos
          ? `Nenhum erro. Há ${plural(avisos, 'ponto de melhoria anotado', 'pontos de melhoria anotados')} para arrumar com calma, e esse número não pode crescer.`
          : 'Nenhum erro nem ponto de melhoria pendente.',
      }
    },
  },
  {
    id: 'camadas',
    nome: 'Acesso ao banco organizado',
    descricao:
      'Nenhuma tela (src/pages) nem componente (src/components) fala direto com o banco: o acesso passa só por src/services e src/lib/dados.',
    executar() {
      const proibido = (modulo) =>
        modulo === '@supabase/supabase-js' || /(^@\/|\/|^)lib\/dados\/supabase(\.ts)?$/.test(modulo)
      const importacao =
        /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g
      const infratores = []
      for (const arquivo of [...listarArquivos('src/pages'), ...listarArquivos('src/components')]) {
        if (!/\.(tsx?|jsx?)$/.test(arquivo)) continue
        const texto = lerTexto(arquivo) ?? ''
        for (const m of texto.matchAll(importacao)) {
          if (proibido(m[1] ?? m[2] ?? m[3])) {
            infratores.push(arquivo)
            break
          }
        }
      }
      if (infratores.length) {
        return {
          situacao: 'falha',
          detalhe: `${plural(infratores.length, 'arquivo de tela acessa', 'arquivos de tela acessam')} o banco sem passar pela camada de serviços: ${infratores.join(', ')}.`,
        }
      }
      return {
        situacao: 'ok',
        detalhe: 'Todas as telas passam pela camada própria para ler e gravar dados.',
      }
    },
  },
  {
    id: 'sem-modo-demonstracao',
    nome: 'Sem dados de demonstração',
    descricao:
      'Não sobrou resto do antigo modo de demonstração (VITE_USE_MOCK, IS_MOCK_MODE, src/lib/mock), que aceitava qualquer senha.',
    executar() {
      const achados = []
      if (fs.existsSync(path.join(RAIZ, 'src/lib/mock'))) achados.push('src/lib/mock')
      const alvos = [
        // O auditoria.json cita os nomes proibidos na própria descrição desta regra.
        ...listarArquivos('src').filter((a) => a !== 'src/data/auditoria.json'),
        'index.html',
        'vite.config.ts',
        'vercel.json',
        'package.json',
        '.env.example',
      ]
      for (const arquivo of alvos) {
        const texto = lerTexto(arquivo)
        if (texto && /VITE_USE_MOCK|IS_MOCK_MODE|lib\/mock\b/.test(texto)) achados.push(arquivo)
      }
      if (achados.length) {
        return {
          situacao: 'falha',
          detalhe: `Ainda há restos do modo de demonstração em: ${achados.join(', ')}.`,
        }
      }
      return {
        situacao: 'ok',
        detalhe:
          'O sistema só funciona com o banco de verdade; o modo de demonstração foi removido.',
      }
    },
  },
  {
    id: 'rls',
    nome: 'Proteção de cada tabela',
    descricao:
      'Toda tabela criada em supabase/migrations tem a segurança por linha (RLS) ligada, para que cada pessoa só veja o que pode.',
    executar() {
      const pasta = 'supabase/migrations'
      const arquivos = listarArquivos(pasta).filter((a) => a.endsWith('.sql'))
      if (!arquivos.length)
        return { situacao: 'atencao', detalhe: 'Não há migrações do banco para conferir.' }
      const criadas = new Set()
      const protegidas = new Set()
      for (const arquivo of arquivos) {
        const sql = (lerTexto(arquivo) ?? '').replace(/--[^\n]*/g, '').toLowerCase()
        for (const m of sql.matchAll(
          /create\s+table\s+(?:if\s+not\s+exists\s+)?public\."?(\w+)"?/g,
        ))
          criadas.add(m[1])
        for (const m of sql.matchAll(
          /alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?public\."?(\w+)"?\s+enable\s+row\s+level\s+security/g,
        ))
          protegidas.add(m[1])
        // Forma em laço: do $$ ... foreach t in array array['a', 'b'] ...
        // execute format('alter table public.%I enable row level security', t)
        for (const bloco of sql.split(/\$\$/)) {
          if (!/%i\s+enable\s+row\s+level\s+security/.test(bloco)) continue
          for (const lista of bloco.matchAll(/array\s*\[([^\]]*)\]/g))
            for (const nome of lista[1].matchAll(/'(\w+)'/g)) protegidas.add(nome[1])
        }
      }
      const semRls = [...criadas].filter((t) => !protegidas.has(t)).sort()
      if (semRls.length) {
        return {
          situacao: 'falha',
          detalhe: `${plural(semRls.length, 'tabela está', 'tabelas estão')} sem a proteção por linha: ${semRls.join(', ')}.`,
        }
      }
      return {
        situacao: 'ok',
        detalhe: `As ${criadas.size} tabelas do banco têm a proteção que limita cada pessoa ao que ela pode ver.`,
      }
    },
  },
  {
    id: 'segredos',
    nome: 'Nenhuma senha exposta',
    descricao:
      'Nenhuma chave secreta foi guardada junto do código: nada de chave service_role, chave sb_secret_ ou arquivo .env no repositório.',
    executar() {
      const comGit = temGit()
      const arquivos = comGit
        ? (git('ls-files') ?? '').split('\n').filter(Boolean)
        : listarArquivos('.')
      const envs = arquivos.filter(
        (a) => /(^|\/)\.env(\.[^/]+)?$/.test(a) && !/\.(example|sample|exemplo)$/.test(a),
      )
      const achados = []
      const binario = /\.(png|jpe?g|gif|webp|ico|pdf|zip|woff2?|ttf|otf|eot|mp4|xlsx?)$/i
      for (const arquivo of arquivos) {
        if (binario.test(arquivo) || /(^|\/)pnpm-lock\.yaml$/.test(arquivo)) continue
        const texto = lerTexto(arquivo)
        if (!texto) continue
        let achou =
          /sb_secret_[A-Za-z0-9_-]{16,}/.test(texto) ||
          /service_role_?key\s*[:=]\s*['"]?[A-Za-z0-9._-]{20,}/i.test(texto)
        if (!achou) {
          for (const m of texto.matchAll(
            /eyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{8,}/g,
          )) {
            try {
              if (
                JSON.parse(Buffer.from(m[1], 'base64url').toString('utf8')).role === 'service_role'
              )
                achou = true
            } catch {
              // Não é um JWT de verdade.
            }
          }
        }
        // Só o caminho vai para o relatório — nunca o valor encontrado.
        if (achou) achados.push(arquivo)
      }
      if (achados.length || (comGit && envs.length)) {
        return {
          situacao: 'falha',
          detalhe: `Há chave secreta ou arquivo de senhas guardado junto do código: ${[...(comGit ? envs : []), ...achados].join(', ')}. Troque a chave no Supabase e remova o arquivo.`,
        }
      }
      if (envs.length) {
        return {
          situacao: 'atencao',
          detalhe: `Há um arquivo de senhas (${envs.join(', ')}) na pasta. Sem o histórico do git não dá para saber se ele foi guardado junto do código.`,
        }
      }
      return {
        situacao: 'ok',
        detalhe: 'Nenhuma chave secreta ou arquivo de senhas foi guardado junto do código.',
      }
    },
  },
  {
    id: 'decisoes',
    nome: 'Decisões técnicas registradas',
    descricao:
      'Todo registro de decisão em docs/05-adr diz em que situação está (proposta, aceita, substituída).',
    executar() {
      const adrs = listarArquivos('docs/05-adr').filter((a) => /\/\d{4}-[^/]+\.md$/.test(a))
      if (!adrs.length)
        return { situacao: 'atencao', detalhe: 'Não há registros de decisão para conferir.' }
      const semSituacao = adrs.filter(
        // "- **Status:** Aceita", "**Situação:** aceita" ou um título "## Status".
        (a) =>
          !/^\s*[-*]?\s*\**\s*(status|situação)\s*\**\s*:|^#+\s*(status|situação)\s*$/im.test(
            lerTexto(a) ?? '',
          ),
      )
      if (semSituacao.length) {
        return {
          situacao: 'falha',
          detalhe: `${plural(semSituacao.length, 'registro de decisão está', 'registros de decisão estão')} sem dizer a situação: ${semSituacao.map((a) => path.basename(a)).join(', ')}.`,
        }
      }
      return {
        situacao: 'ok',
        detalhe: `Os ${adrs.length} registros de decisão técnica dizem em que situação estão.`,
      }
    },
  },
  {
    id: 'feed-em-dia',
    nome: 'Lista de novidades em dia',
    descricao:
      'A seção "Últimas atualizações" não ficou para trás: a entrega (feat) ou correção (fix) mais recente do histórico não é mais nova que a última entrada de src/data/feed.json.',
    executar() {
      let feed
      try {
        feed = JSON.parse(fs.readFileSync(ARQUIVO_FEED, 'utf8'))
      } catch {
        return { situacao: 'falha', detalhe: 'A lista de novidades não pôde ser lida.' }
      }
      const datas = Array.isArray(feed)
        ? feed.map((e) => e?.data).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
        : []
      if (!datas.length)
        return {
          situacao: 'falha',
          detalhe: 'A lista de novidades está vazia ou com datas inválidas.',
        }
      const ultimaNoticia = datas.reduce((a, b) => (b > a ? b : a))

      if (!temGit()) {
        return {
          situacao: 'atencao',
          detalhe: `Não deu para conferir nesta publicação, porque o histórico de alterações não acompanha o servidor. A conferência completa roda a cada proposta de mudança. Última novidade: ${dataCurta(ultimaNoticia)}.`,
        }
      }
      const historico = git('log', '--no-merges', '-n', '500', '--format=%cI%x09%s') ?? ''
      const entrega = historico
        .split('\n')
        .map((linha) => linha.split('\t'))
        .find(([, assunto]) => /^(feat|fix)(\([^)]*\))?!?:/.test(assunto ?? ''))
      if (!entrega) {
        const raso = git('rev-parse', '--is-shallow-repository') === 'true'
        return raso
          ? {
              situacao: 'atencao',
              detalhe: `Não deu para conferir: só uma parte do histórico de alterações está disponível aqui. Última novidade: ${dataCurta(ultimaNoticia)}.`,
            }
          : {
              situacao: 'ok',
              detalhe: `Nenhuma entrega registrada no histórico além do que já está na lista.`,
            }
      }
      const dataEntrega = dataEmBrasilia(new Date(entrega[0]))
      if (dataEntrega > ultimaNoticia) {
        return {
          situacao: 'atencao',
          detalhe: `Há uma alteração de ${dataCurta(dataEntrega)} ainda sem notícia na lista (a última é de ${dataCurta(ultimaNoticia)}).`,
        }
      }
      return {
        situacao: 'ok',
        detalhe: `A lista de novidades acompanha o código. Última novidade: ${dataCurta(ultimaNoticia)}.`,
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

function commitAtual() {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA || git('rev-parse', 'HEAD') || process.env.GITHUB_SHA
  return sha ? sha.slice(0, 7) : null
}

async function executar(verificacao) {
  const limite = verificacao.tempoLimite ?? MINUTO
  let relogio
  try {
    const resultado = await Promise.race([
      Promise.resolve().then(() => verificacao.executar()),
      new Promise((_, rejeitar) => {
        relogio = setTimeout(() => rejeitar(new Error('tempo limite')), limite + 5_000)
      }),
    ])
    return resultado
  } catch (erro) {
    return {
      situacao: 'falha',
      detalhe:
        erro?.message === 'tempo limite'
          ? 'A verificação demorou demais e foi interrompida.'
          : 'A verificação não conseguiu terminar.',
      erroTecnico: String(erro?.stack ?? erro),
    }
  } finally {
    clearTimeout(relogio)
  }
}

const SIMBOLO = { ok: '[ ok ]', atencao: '[ ! ]', falha: '[FALHA]' }
const ROTULO_MD = { ok: 'Em ordem', atencao: 'Atenção', falha: 'Falha' }

function paraMarkdown(auditoria) {
  const linhas = [
    '## Auditor — funções de aptidão',
    '',
    `Commit \`${auditoria.commit ?? 'desconhecido'}\` · gerado em ${auditoria.geradoEm}`,
    '',
    '| Situação | Verificação | Resultado |',
    '| :--- | :--- | :--- |',
    ...auditoria.verificacoes.map(
      (v) =>
        `| ${ROTULO_MD[v.situacao] ?? v.situacao} | **${v.nome}** (\`${v.id}\`) | ${v.detalhe.replace(/\|/g, '\\|')} |`,
    ),
  ]
  return linhas.join('\n') + '\n'
}

async function principal() {
  if (ARGUMENTOS.has('--markdown')) {
    process.stdout.write(paraMarkdown(JSON.parse(fs.readFileSync(ARQUIVO_SAIDA, 'utf8'))))
    return 0
  }

  console.log('Auditor: rodando as funções de aptidão…\n')
  const verificacoes = []
  for (const v of VERIFICACOES) {
    const inicio = Date.now()
    const { situacao, detalhe, erroTecnico } = await executar(v)
    const segundos = ((Date.now() - inicio) / 1000).toFixed(1)
    console.log(`${SIMBOLO[situacao].padEnd(8)}${v.nome} (${segundos}s)\n        ${detalhe}`)
    if (erroTecnico) console.log(`        ${erroTecnico.split('\n').join('\n        ')}`)
    verificacoes.push({ id: v.id, nome: v.nome, descricao: v.descricao, situacao, detalhe })
  }

  const auditoria = { geradoEm: new Date().toISOString(), commit: commitAtual(), verificacoes }
  fs.writeFileSync(ARQUIVO_SAIDA, JSON.stringify(auditoria, null, 2) + '\n')

  const falhas = verificacoes.filter((v) => v.situacao === 'falha').length
  const atencoes = verificacoes.filter((v) => v.situacao === 'atencao').length
  console.log(
    `\n${verificacoes.length} verificações: ${verificacoes.length - falhas - atencoes} em ordem, ${atencoes} com atenção, ${falhas} com falha.`,
  )
  console.log(`Resultado gravado em ${path.relative(RAIZ, ARQUIVO_SAIDA)}.`)

  if (falhas && ESTRITO) {
    console.log('Modo estrito: saindo com erro porque há falha.')
    return 1
  }
  return 0
}

principal().then(
  (codigo) => process.exit(codigo),
  (erro) => {
    // Nem um erro inesperado do próprio auditor pode derrubar o build.
    console.error('Auditor: erro inesperado.', erro)
    process.exit(ESTRITO ? 1 : 0)
  },
)
