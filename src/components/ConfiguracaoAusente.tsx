/**
 * Tela de configuração ausente.
 *
 * Aparece quando o build subiu sem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
 * Antes, faltando configuração, a aplicação subia sobre dados falsos e aceitava
 * qualquer senha (achado S-03); agora ela não sobe — mas diz por quê, em vez de
 * entregar uma tela branca a quem for publicar.
 */
export function ConfiguracaoAusente() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
          Configuração incompleta
        </span>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          O sistema não sabe com qual banco falar
        </h1>

        <p className="mt-3 text-base leading-relaxed text-slate-700">
          Este build subiu sem o endereço do projeto Supabase. Defina as duas variáveis abaixo no
          ambiente de publicação e publique de novo:
        </p>

        <ul className="mt-4 space-y-2">
          {['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].map((nome) => (
            <li
              key={nome}
              className="rounded-lg bg-slate-100 px-4 py-2.5 font-mono text-sm text-slate-800"
            >
              {nome}
            </li>
          ))}
        </ul>

        <p className="mt-5 text-sm leading-relaxed text-slate-600">
          Os valores estão no painel do Supabase, em Settings → API Keys. A chave publicável é feita
          para viver no navegador: quem controla o acesso são as políticas do banco.
        </p>
      </div>
    </main>
  )
}
