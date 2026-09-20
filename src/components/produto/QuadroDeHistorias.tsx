import { useState } from 'react'
import { CircleHelp, Lock } from 'lucide-react'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import {
  HISTORIAS,
  ORDEM_DAS_COLUNAS,
  epicosDoQuadro,
  historiasFiltradas,
  resumoDoQuadro,
  type ColunaDoQuadro,
  type Historia,
} from '@/data/historias'
import { APARENCIA_DA_COLUNA } from './aparencia'
import { DialogoDaHistoria } from './DialogoDaHistoria'

/**
 * Quadro de histórias da página pública (`/`) — no estilo dos quadros de
 * trabalho que a equipe usa, com três colunas: A fazer, Em ajuste e Concluída.
 *
 * **Só leitura, de propósito.** A página é pública e sem login, e a situação de
 * cada história vem da documentação e do código, não de alguém arrastando o
 * cartão. Por isso não há como mover nada aqui — e a tela diz isso em uma
 * linha, logo abaixo do título.
 *
 * **Épico: filtro, e não raia.** Seis épicos × três colunas dariam dezoito
 * blocos empilhados no celular, a maioria vazia, e o dono rolaria a página
 * inteira para achar uma história. Com o filtro, as colunas continuam três em
 * qualquer tela, e o épico não se perde: ele aparece como etiqueta em todo
 * cartão e no diálogo.
 *
 * Os dados vêm de `src/data/historias.json` — ver `src/data/historias.ts`.
 */

/** A primeira frase do resumo, para o cartão caber em uma linha de leitura. */
function primeiraFrase(texto: string): string {
  const fim = texto.search(/\.\s/)
  return fim === -1 ? texto : texto.slice(0, fim + 1)
}

function Cartao({ historia }: { historia: Historia }) {
  const estilo = APARENCIA_DA_COLUNA[historia.coluna]
  const Icone = estilo.icone

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
        >
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-200 px-2 py-0.5 text-sm font-bold text-slate-900">
              {historia.id}
            </span>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-sm font-semibold text-indigo-900">
              {historia.epico}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${estilo.caixa} ${estilo.texto}`}
            >
              <Icone className="h-4 w-4 shrink-0" aria-hidden="true" />
              {estilo.rotulo}
            </span>
          </span>

          <span className="mt-2 block text-base font-bold text-slate-900">{historia.titulo}</span>
          <span className="mt-1 block text-sm font-semibold text-slate-600">
            {historia.persona}
          </span>
          <span className="mt-2 block text-sm leading-relaxed text-slate-700">
            {primeiraFrase(historia.resumo)}
          </span>

          {historia.decisaoPendente && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-sm font-semibold text-indigo-900">
              <CircleHelp className="h-4 w-4 shrink-0" aria-hidden="true" />
              Espera uma decisão sua
            </span>
          )}

          <span className="mt-3 block text-sm font-bold text-indigo-800 underline underline-offset-4">
            Ver a história inteira
          </span>
        </button>
      </DialogTrigger>
      <DialogoDaHistoria historia={historia} />
    </Dialog>
  )
}

function Coluna({ coluna, historias }: { coluna: ColunaDoQuadro; historias: Historia[] }) {
  const estilo = APARENCIA_DA_COLUNA[coluna]
  const Icone = estilo.icone
  const tituloId = `coluna-${coluna}`

  return (
    <section
      aria-labelledby={tituloId}
      className={`flex flex-col rounded-xl border ${estilo.coluna}`}
    >
      <div className="border-b border-white/70 px-4 py-3">
        <h3 id={tituloId} className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Icone className={`h-5 w-5 shrink-0 ${estilo.texto}`} aria-hidden="true" />
          {estilo.rotulo}
          <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 text-base font-bold text-slate-900">
            {historias.length}
          </span>
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{estilo.explicacao}</p>
      </div>

      <ul className="flex-1 space-y-3 p-3">
        {historias.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-center text-sm text-slate-600">
            Nenhuma história aqui com o que você escolheu ver.
          </li>
        ) : (
          historias.map((historia) => (
            <li key={historia.id}>
              <Cartao historia={historia} />
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

interface Props {
  historias?: Historia[]
}

export function QuadroDeHistorias({ historias = HISTORIAS }: Props) {
  const [epico, setEpico] = useState<string | null>(null)
  const [soOQueFalta, setSoOQueFalta] = useState(false)

  const epicos = epicosDoQuadro(historias)
  const resumo = resumoDoQuadro(historias)
  const visiveis = historiasFiltradas({ epico, soOQueFalta }, historias)
  const resumoVisivel = resumoDoQuadro(visiveis)

  const botaoDeEpico = (valor: string | null, rotulo: string, quantidade: number) => {
    const escolhido = epico === valor
    return (
      <button
        key={rotulo}
        type="button"
        aria-pressed={escolhido}
        onClick={() => setEpico(valor)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-base font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 ${
          escolhido
            ? 'border-indigo-700 bg-indigo-700 text-white'
            : 'border-slate-300 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50'
        }`}
      >
        {rotulo}
        <span
          className={`rounded-full px-2 py-0.5 text-sm font-bold ${
            escolhido ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {quantidade}
        </span>
      </button>
    )
  }

  return (
    <div className="mt-5">
      <p className="flex gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base leading-relaxed text-slate-700 shadow-xs">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
        Este quadro é só para olhar: a situação de cada história vem da documentação do sistema e não
        muda por aqui.
      </p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p id="filtro-epico" className="text-base font-bold text-slate-900">
          Mostrar qual parte do sistema
        </p>
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-labelledby="filtro-epico"
        >
          {botaoDeEpico(null, 'Tudo', historias.length)}
          {epicos.map((nome) =>
            botaoDeEpico(nome, nome, historias.filter((h) => h.epico === nome).length),
          )}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-base font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={soOQueFalta}
              onChange={(evento) => setSoOQueFalta(evento.target.checked)}
              className="h-6 w-6 rounded border-2 border-slate-400 text-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
            />
            Mostrar só o que falta
          </label>
        </div>

        <p aria-live="polite" className="mt-3 text-base text-slate-700">
          Mostrando <strong className="font-bold text-slate-900">{visiveis.length}</strong> de{' '}
          {resumo.total} histórias. Ao todo, {resumo.contagem.concluida} estão concluídas e{' '}
          {resumo.falta} ainda pedem trabalho.
          {resumoVisivel.comDecisaoPendente > 0 && (
            <>
              {' '}
              {resumoVisivel.comDecisaoPendente === 1
                ? '1 delas espera'
                : `${resumoVisivel.comDecisaoPendente} delas esperam`}{' '}
              uma decisão sua.
            </>
          )}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ORDEM_DAS_COLUNAS.map((coluna) => (
          <Coluna
            key={coluna}
            coluna={coluna}
            historias={visiveis.filter((historia) => historia.coluna === coluna)}
          />
        ))}
      </div>
    </div>
  )
}
