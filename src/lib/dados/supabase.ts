import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase da aplicação.
 *
 * A chave publicável é feita para viver no pacote do navegador: ela não
 * concede nada por si só. Quem decide o que cada pessoa lê e escreve são as
 * políticas de RLS do banco (ver supabase/migrations/…_rls.sql), e não a
 * ausência da chave.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !chave) {
  throw new Error(
    'Configuração ausente: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env ' +
      '(ver supabase/README.md).',
  )
}

export const supabase = createClient(url, chave, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'controle-imoveis:sessao',
  },
})

export const URL_SUPABASE = url
