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

/**
 * Falta configuração.
 *
 * Um build sem estas duas variáveis não pode subir fingindo que funciona — era
 * o achado S-03. Mas também não pode morrer numa tela branca: aqui a falta é
 * sinalizada, e `main.tsx` desenha uma tela que diz o que fazer. O cliente é
 * criado com um endereço de sustentação só para os imports não quebrarem no
 * caminho.
 */
export const CONFIGURACAO_AUSENTE = !url || !chave

export const supabase = createClient(url || 'https://configuracao.ausente', chave || 'ausente', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'controle-imoveis:sessao',
  },
})

export const URL_SUPABASE = url ?? ''
