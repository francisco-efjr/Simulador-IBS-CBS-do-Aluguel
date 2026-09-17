import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/dados/supabase'

export interface EventoTempoReal<T = Record<string, unknown>> {
  action: 'create' | 'update' | 'delete'
  record: T
}

const ACOES = {
  INSERT: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const

/**
 * Assina as mudanças de uma tabela e avisa a tela.
 *
 * Use sempre este hook em vez de assinar no corpo do componente: ele mantém um
 * canal por montagem e desliga na saída, sem deixar assinatura órfã quando a
 * pessoa troca de tela no meio de um carregamento.
 *
 * A tabela precisa estar na publicação `supabase_realtime` (ver a migração
 * …_tempo_real.sql); fora dela, o canal abre e nunca recebe evento.
 */
export function useRealtime<T = Record<string, unknown>>(
  tabela: string,
  callback: (evento: EventoTempoReal<T>) => void,
  habilitado: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!habilitado) return

    const canal = supabase
      .channel(`tempo-real:${tabela}:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tabela }, (payload) => {
        callbackRef.current({
          action: ACOES[payload.eventType as keyof typeof ACOES] ?? 'update',
          record: (payload.new ?? payload.old) as T,
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [tabela, habilitado])
}

export default useRealtime
