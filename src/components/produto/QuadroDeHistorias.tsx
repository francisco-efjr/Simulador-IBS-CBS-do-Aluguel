import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, Lock, LogIn, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getErrorMessage } from '@/lib/dados/erros'
import {
  COLUNAS_DO_QUADRO,
  codigoDaHistoria,
  contagemDeAtividades,
  destinosPermitidos,
  etiquetasDoQuadro,
  listarHistorias,
  moverHistoria,
  type ColunaDoQuadro,
  type HistoriaDoQuadro,
} from '@/services/quadro'
import { APARENCIA_DA_COLUNA } from './aparencia'
import { DialogoDaHistoria } from './DialogoDaHistoria'

/**
 * Quadro de histórias da página inicial (`/`), no jeito de um quadro de
 * trabalho: Backlog, Desenvolvimento, Teste, Homologação e Concluído.
 *
 * Por fora, o cartão tem só o número, o título, a etiqueta e as atividades
 * feitas; o resto abre no diálogo. Quem tem edição no módulo "quadro" cria
 * história, edita, marca atividade e muda a coluna — pelo diálogo ou, no
 * computador, arrastando o cartão. O banco é quem decide se o movimento vale
 * (RN-QDR-01 e RN-QDR-02); a tela só evita oferecer o que ele vai recusar.
 *
 * O quadro é interno: sem login, a página mostra só o convite para entrar.
 */

const TIPO_ARRASTADO = 'application/x-historia'

function Cartao({
  historia,
  podeArrastar,
  onAbrir,
}: {
  historia: HistoriaDoQuadro
  podeArrastar: boolean
  onAbrir: (historia: HistoriaDoQuadro, gatilho: HTMLElement) => void
}) {
  const { feitas, total } = contagemDeAtividades(historia.atividades)
  const codigo = codigoDaHistoria(historia.numero)

  const aoArrastar = (evento: DragEvent<HTMLButtonElement>) => {
    evento.dataTransfer.setData(TIPO_ARRASTADO, historia.id)
    evento.dataTransfer.effectAllowed = 'move'
  }

  return (
    <button
      type="button"
      draggable={podeArrastar}
      onDragStart={podeArrastar ? aoArrastar : undefined}
      onClick={(evento) => onAbrir(historia, evento.currentTarget)}
      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xs transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
    >
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-sm font-bold text-slate-900">
          {codigo}
        </span>
        {historia.tag && (
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-sm font-semibold text-indigo-900">
            {historia.tag}
          </span>
        )}
      </span>
      <span className="mt-2 block text-base font-bold leading-snug text-slate-900">
        {historia.titulo}
      </span>
      <span
        className={`mt-2 inline-flex items-center gap-1.5 text-sm font-semibold ${
          total > 0 && feitas === total ? 'text-emerald-800' : 'text-slate-700'
        }`}
      >
        <ListChecks className="h-4 w-4 shrink-0" aria-hidden="true" />
        {total === 0 ? (
          'Sem atividades'
        ) : (
          <>
            {feitas}/{total}
            <span className="sr-only"> atividades feitas</span>
          </>
        )}
      </span>
    </button>
  )
}

function Coluna({
  coluna,
  historias,
  podeEditar,
  visivelNoCelular,
  onAbrir,
  onSoltar,
}: {
  coluna: ColunaDoQuadro
  historias: HistoriaDoQuadro[]
  podeEditar: boolean
  visivelNoCelular: boolean
  onAbrir: (historia: HistoriaDoQuadro, gatilho: HTMLElement) => void
  onSoltar: (historiaId: string, coluna: ColunaDoQuadro) => void
}) {
  const [recebendo, setRecebendo] = useState(false)
  const estilo = APARENCIA_DA_COLUNA[coluna]
  const Icone = estilo.icone
  const tituloId = `coluna-${coluna}`

  const aoPassarPorCima = (evento: DragEvent<HTMLElement>) => {
    if (!podeEditar || !evento.dataTransfer.types.includes(TIPO_ARRASTADO)) return
    evento.preventDefault()
    evento.dataTransfer.dropEffect = 'move'
    setRecebendo(true)
  }

  const aoSoltar = (evento: DragEvent<HTMLElement>) => {
    setRecebendo(false)
    const id = evento.dataTransfer.getData(TIPO_ARRASTADO)
    if (!podeEditar || !id) return
    evento.preventDefault()
    onSoltar(id, coluna)
  }

  return (
    <section
      aria-labelledby={tituloId}
      onDragOver={aoPassarPorCima}
      onDragLeave={() => setRecebendo(false)}
      onDrop={aoSoltar}
      className={`${visivelNoCelular ? 'flex' : 'hidden'} min-w-0 flex-col rounded-xl border lg:flex ${estilo.coluna} ${
        recebendo ? 'ring-4 ring-indigo-300' : ''
      }`}
    >
      <div className="border-b border-white/70 px-3 py-3">
        <h3 id={tituloId} className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Icone className={`h-5 w-5 shrink-0 ${estilo.texto}`} aria-hidden="true" />
          {estilo.rotulo}
          <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 text-base font-bold text-slate-900">
            {historias.length}
          </span>
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{estilo.explicacao}</p>
      </div>

      <ul className="flex-1 space-y-2 p-2">
        {historias.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 py-6 text-center text-sm text-slate-600">
            Nenhuma história aqui.
          </li>
        ) : (
          historias.map((historia) => (
            <li key={historia.id}>
              <Cartao historia={historia} podeArrastar={podeEditar} onAbrir={onAbrir} />
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

function Aviso({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 text-base leading-relaxed text-slate-700 shadow-xs sm:flex-row sm:items-center">
      <Lock className="h-6 w-6 shrink-0 text-slate-500" aria-hidden="true" />
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function QuadroDeHistorias() {
  const { isAuthenticated, loading, canViewModule, canEditModule } = useAuth()
  const podeVer = isAuthenticated && canViewModule('quadro')
  const podeEditar = isAuthenticated && canEditModule('quadro')

  const [historias, setHistorias] = useState<HistoriaDoQuadro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [etiqueta, setEtiqueta] = useState<string | null>(null)
  const [colunaNoCelular, setColunaNoCelular] = useState<ColunaDoQuadro>('teste')
  const [aberta, setAberta] = useState<{ id: string | null } | null>(null)
  const gatilho = useRef<HTMLElement | null>(null)

  const carregar = useCallback(async () => {
    try {
      setHistorias(await listarHistorias())
      setErro('')
    } catch (e) {
      setErro(getErrorMessage(e))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (podeVer) carregar()
  }, [podeVer, carregar])

  useRealtime('historias', carregar, podeVer)
  useRealtime('historias_atividades', carregar, podeVer)

  if (loading) {
    return (
      <p aria-live="polite" className="mt-5 text-base text-slate-600">
        Carregando o quadro…
      </p>
    )
  }

  if (!isAuthenticated) {
    return (
      <Aviso>
        <p>
          O quadro de histórias é interno. Entre no sistema para ver cada história, os critérios de
          aceitação e o que falta — e, se o seu acesso permitir, editar e homologar.
        </p>
        <Link
          to="/login"
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-950 px-5 py-2.5 text-base font-bold text-white hover:bg-navy-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
        >
          <LogIn className="h-5 w-5" aria-hidden="true" />
          Entrar para ver o quadro
        </Link>
      </Aviso>
    )
  }

  if (!podeVer) {
    return (
      <Aviso>
        <p>
          Seu acesso não inclui o quadro de histórias. Peça a quem administra o sistema para liberar o
          módulo "Quadro de histórias".
        </p>
      </Aviso>
    )
  }

  const etiquetas = etiquetasDoQuadro(historias)
  const visiveis = historias.filter((h) => etiqueta === null || h.tag === etiqueta)
  const porColuna = (coluna: ColunaDoQuadro) => visiveis.filter((h) => h.coluna === coluna)
  const emTeste = historias.filter((h) => h.coluna === 'teste').length
  const historiaAberta = aberta?.id ? (historias.find((h) => h.id === aberta.id) ?? null) : null

  const abrir = (historia: HistoriaDoQuadro | null, elemento: HTMLElement) => {
    gatilho.current = elemento
    setAberta({ id: historia?.id ?? null })
  }

  const soltar = async (id: string, destino: ColunaDoQuadro) => {
    const historia = historias.find((h) => h.id === id)
    if (!historia || historia.coluna === destino) return
    if (!destinosPermitidos(historia.coluna).includes(destino)) {
      toast.error(
        'A história só vai para Concluído depois de passar pela Homologação. Mova para Homologação primeiro.',
      )
      return
    }
    setHistorias((lista) => lista.map((h) => (h.id === id ? { ...h, coluna: destino } : h)))
    try {
      await moverHistoria(id, destino)
      toast.success(
        `${codigoDaHistoria(historia.numero)} foi para ${APARENCIA_DA_COLUNA[destino].rotulo}.`,
      )
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      carregar()
    }
  }

  const botaoDeEtiqueta = (valor: string | null, rotulo: string, quantidade: number) => {
    const escolhida = etiqueta === valor
    return (
      <button
        key={rotulo}
        type="button"
        aria-pressed={escolhida}
        onClick={() => setEtiqueta(valor)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-base font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 ${
          escolhida
            ? 'border-indigo-700 bg-indigo-700 text-white'
            : 'border-slate-300 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50'
        }`}
      >
        {rotulo}
        <span
          className={`rounded-full px-2 py-0.5 text-sm font-bold ${
            escolhida ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {quantidade}
        </span>
      </button>
    )
  }

  return (
    <div className="mt-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p aria-live="polite" className="text-base leading-relaxed text-slate-700">
            {carregando ? (
              'Carregando as histórias…'
            ) : (
              <>
                <strong className="font-bold text-slate-900">{historias.length}</strong> histórias no
                quadro.{' '}
                {emTeste > 0 &&
                  (emTeste === 1
                    ? '1 está em Teste, esperando uma pessoa homologar.'
                    : `${emTeste} estão em Teste, esperando uma pessoa homologar.`)}
              </>
            )}
          </p>
          {podeEditar && (
            <Button
              type="button"
              className="min-h-11 shrink-0"
              onClick={(evento) => abrir(null, evento.currentTarget)}
            >
              <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
              Nova história
            </Button>
          )}
        </div>

        {etiquetas.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p id="filtro-etiqueta" className="text-base font-bold text-slate-900">
              Mostrar qual parte do sistema
            </p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="filtro-etiqueta">
              {botaoDeEtiqueta(null, 'Tudo', historias.length)}
              {etiquetas.map((nome) =>
                botaoDeEtiqueta(nome, nome, historias.filter((h) => h.tag === nome).length),
              )}
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-slate-100 pt-4 lg:hidden">
          <p id="filtro-coluna" className="text-base font-bold text-slate-900">
            Coluna
          </p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="filtro-coluna">
            {COLUNAS_DO_QUADRO.map((coluna) => {
              const escolhida = colunaNoCelular === coluna
              return (
                <button
                  key={coluna}
                  type="button"
                  aria-pressed={escolhida}
                  onClick={() => setColunaNoCelular(coluna)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-base font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 ${
                    escolhida
                      ? 'border-indigo-700 bg-indigo-700 text-white'
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  {APARENCIA_DA_COLUNA[coluna].rotulo}
                  <span
                    className={`rounded-full px-2 py-0.5 text-sm font-bold ${
                      escolhida ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {porColuna(coluna).length}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>Não foi possível carregar o quadro. {erro}</p>
          <Button type="button" variant="outline" className="min-h-11" onClick={carregar}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Tentar de novo
          </Button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
        {COLUNAS_DO_QUADRO.map((coluna) => (
          <Coluna
            key={coluna}
            coluna={coluna}
            historias={porColuna(coluna)}
            podeEditar={podeEditar}
            visivelNoCelular={colunaNoCelular === coluna}
            onAbrir={abrir}
            onSoltar={soltar}
          />
        ))}
      </div>

      <DialogoDaHistoria
        aberto={aberta !== null && (aberta.id === null || historiaAberta !== null)}
        historia={historiaAberta}
        podeEditar={podeEditar}
        etiquetas={etiquetas}
        onFechar={() => setAberta(null)}
        onMudou={carregar}
        onCloseAutoFocus={(evento) => {
          evento.preventDefault()
          gatilho.current?.focus()
        }}
      />
    </div>
  )
}
