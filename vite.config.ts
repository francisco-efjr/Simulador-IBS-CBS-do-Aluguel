/// <reference types="vitest" />
/* Vite config for building the frontend react app: https://vite.dev/config/ */
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { TransitionCalendar } from './src/simulador/core/services/TransitionCalendar'

const SCHEDULE_PATHS = [
  '/api/cronograma-transicao.json',
  '/api/cronograma-transicao',
  '/api/transition-schedule',
]

const SCHEDULE_ASSET = 'api/cronograma-transicao.json'

/**
 * Cronograma de transição do IBS/CBS publicado como API.
 *
 * Em desenvolvimento responde via middleware; no build é emitido como arquivo
 * estático dentro de dist/, para que o mesmo endereço funcione em produção sem
 * depender de função serverless. É o endpoint que o Explorador de API do
 * simulador documenta.
 */
function transitionApiPlugin(): Plugin {
  return {
    name: 'transition-schedule-api',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : ''
        if (!SCHEDULE_PATHS.includes(url)) return next()

        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(JSON.stringify(TransitionCalendar.getFullSchedule(), null, 2))
      })
    },

    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: SCHEDULE_ASSET,
        source: JSON.stringify(TransitionCalendar.getFullSchedule(), null, 2),
      })
    },
  }
}


/**
 * Política de segurança de conteúdo aplicada ao HTML publicado.
 *
 * O host também envia a política por cabeçalho (ver vercel.json); repeti-la no
 * documento faz a proteção viajar junto com o arquivo, valendo em qualquer
 * lugar onde o `dist/` for servido. Só entra no build de produção: em
 * desenvolvimento o Vite usa script embutido e `eval` para recarregar módulos,
 * e a política quebraria o servidor local.
 *
 * O endereço do Supabase vem de VITE_SUPABASE_URL — a mesma variável que o
 * cliente usa (ver src/lib/dados/supabase.ts) — em vez de escrito à mão aqui:
 * um valor fixo já ficou desatualizado depois da migração para o Supabase e
 * bloqueou login e cadastro em produção (toda chamada virava "Failed to
 * fetch", porque o navegador aplica esta política e a do cabeçalho ao mesmo
 * tempo, e a mais restritiva vence).
 */
function cspProducao(supabaseUrl: string): string {
  const origem = supabaseUrl ? new URL(supabaseUrl).origin : ''
  const origemWs = origem.replace(/^http/, 'ws')

  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src 'self' data: blob:${origem ? ` ${origem}` : ''}`,
    `connect-src 'self'${origem ? ` ${origem} ${origemWs}` : ''}`,
    // `frame-ancestors` só vale por cabeçalho: no <meta> o navegador ignora e
    // ainda registra erro no console. Quem cobre o enquadramento é o host
    // (X-Frame-Options e CSP em vercel.json).
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}

function cspPlugin(mode: string, supabaseUrl: string): Plugin {
  return {
    name: 'csp-no-html',
    transformIndexHtml(html) {
      if (mode === 'development') return html
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${cspProducao(supabaseUrl)}" />`,
      )
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      host: '::',
      port: 8081,
    },
    build: {
      outDir: mode === 'development' ? 'dev-dist' : 'dist',
      minify: mode !== 'development',
      // lightningcss in every mode so dev/QA catches the same CSS errors as prod
      cssMinify: 'lightningcss',
      sourcemap: mode === 'development',
      rolldownOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return
          }
          warn(warning)
        },
      },
    },
    plugins: [
      react(),
      transitionApiPlugin(),
      cspPlugin(mode, env.VITE_SUPABASE_URL),
    ].filter(Boolean),
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode ?? process.env.NODE_ENV ?? 'production'),
    },
    // Suíte do motor de cálculo do simulador (herdada do projeto original).
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/simulador/__tests__/setup.ts',
      // As cópias de trabalho dos agentes vivem em .claude/worktrees e trazem
      // testes próprios; contá-los aqui duplicaria (e confundiria) o resultado.
      exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
    },
    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, './src'),
        },
        {
          find: /zod\/v4\/core/,
          replacement: path.resolve(__dirname, 'node_modules', 'zod', 'v4', 'core'),
        }
      ],
    },
  }
})
