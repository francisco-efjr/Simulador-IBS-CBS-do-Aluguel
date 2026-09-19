import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Activity, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtime } from '@/hooks/use-realtime'
import { getLogsAtividade, type LogAtividadeRecord } from '@/services/logs-atividade'
import { fraseDaAtividade } from './frase-da-atividade'

const QUANTIDADE = 15
/** Um lote de cadastros (importação de extrato) vira uma recarga só. */
const ESPERA_DA_RECARGA_MS = 800
/** "há 5 minutos" envelhece; refaz o texto de minuto em minuto. */
const INTERVALO_DO_RELOGIO_MS = 60_000

type Estado = 'carregando' | 'pronto' | 'erro'

function tempoRelativo(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  return formatDistanceToNow(data, { addSuffix: true, locale: ptBR })
}

function dataCompleta(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
}

/**
 * Últimas atividades da equipe, atualizadas ao vivo.
 *
 * Só faz sentido para administrador: a RLS de `logs_atividade` só deixa ele ler,
 * e o tempo real respeita a mesma regra. Quem monta o componente decide quem vê.
 */
export function FeedDeAtividades() {
  const [logs, setLogs] = useState<LogAtividadeRecord[]>([])
  const [estado, setEstado] = useState<Estado>('carregando')
  const [anuncio, setAnuncio] = useState('')
  const [, setRelogio] = useState(0)

  const idsConhecidos = useRef<Set<string> | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const montado = useRef(true)

  const carregar = useCallback(async () => {
    try {
      const resposta = await getLogsAtividade({ perPage: QUANTIDADE })
      if (!montado.current) return

      // Anuncia ao leitor de tela só o que chegou depois da primeira carga, e
      // de forma resumida: um lote grande não vira uma ladainha.
      const anteriores = idsConhecidos.current
      if (anteriores) {
        const novos = resposta.items.filter((l) => !anteriores.has(l.id))
        if (novos.length === 1) {
          setAnuncio(`Nova atividade: ${fraseDaAtividade(novos[0]).texto}.`)
        } else if (novos.length > 1) {
          setAnuncio(`${novos.length} novas atividades registradas.`)
        }
      }
      idsConhecidos.current = new Set(resposta.items.map((l) => l.id))

      setLogs(resposta.items)
      setEstado('pronto')
    } catch (erro) {
      if (!montado.current) return
      console.error('Não foi possível carregar as atividades recentes.', erro)
      setEstado('erro')
    }
  }, [])

  useEffect(() => {
    montado.current = true
    carregar()
    const relogio = setInterval(() => setRelogio((n) => n + 1), INTERVALO_DO_RELOGIO_MS)
    return () => {
      montado.current = false
      clearInterval(relogio)
      if (temporizador.current) clearTimeout(temporizador.current)
    }
  }, [carregar])

  // O evento traz o id do usuário, não o nome; recarregar a lista (com o
  // `expand`) é mais simples e já descarta o que saiu do topo.
  useRealtime('logs_atividade', () => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(carregar, ESPERA_DA_RECARGA_MS)
  })

  const tentarDeNovo = () => {
    setEstado('carregando')
    carregar()
  }

  return (
    <Card className="border border-slate-200/80 bg-white">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 p-5 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Activity className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          Atividades recentes
        </CardTitle>
        <Link
          to="/logs-atividade"
          className="rounded-md px-2 py-1 text-sm font-semibold text-indigo-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          Ver tudo<span className="sr-only"> no registro de atividades</span>
        </Link>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        {/* Região viva separada da lista: anuncia só a novidade, não a lista inteira. */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {anuncio}
        </div>

        {estado === 'carregando' && logs.length === 0 && (
          <ul className="space-y-4" aria-label="Carregando atividades recentes" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
                <Skeleton className="h-3 w-1/4 motion-reduce:animate-none" />
              </li>
            ))}
          </ul>
        )}

        {estado === 'erro' && logs.length === 0 && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700" role="status">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <span>Não foi possível carregar as atividades agora.</span>
            <Button variant="outline" size="sm" onClick={tentarDeNovo}>
              Tentar de novo
            </Button>
          </div>
        )}

        {estado === 'pronto' && logs.length === 0 && (
          <p className="text-sm text-slate-700">
            Ainda não há atividades registradas. Assim que alguém cadastrar ou alterar algo, aparece
            aqui.
          </p>
        )}

        {logs.length > 0 && (
          <>
            {estado === 'erro' && (
              <p className="mb-3 flex items-center gap-2 text-xs text-slate-600" role="status">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                Não foi possível atualizar agora; a lista pode estar um pouco atrasada.
              </p>
            )}
            <ul className="divide-y divide-slate-100">
              {logs.map((log) => {
                const frase = fraseDaAtividade(log)
                return (
                  <li key={log.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm leading-relaxed text-slate-800">
                      <span className="font-semibold text-slate-900">{frase.autor}</span>{' '}
                      {frase.oQue}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      <time dateTime={log.created} title={dataCompleta(log.created)}>
                        {tempoRelativo(log.created)}
                      </time>
                    </p>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default FeedDeAtividades
