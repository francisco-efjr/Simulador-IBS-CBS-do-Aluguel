import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { ListChecks, Pencil, Plus, ScrollText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { extractFieldErrors, getErrorMessage } from '@/lib/dados/erros'
import {
  COLUNAS_DO_QUADRO,
  HISTORIA_EM_BRANCO,
  atualizarAtividade,
  atualizarHistoria,
  codigoDaHistoria,
  contagemDeAtividades,
  criarAtividade,
  criarHistoria,
  destinosPermitidos,
  excluirAtividade,
  moverHistoria,
  type AtividadeDaHistoria,
  type ColunaDoQuadro,
  type DadosDaHistoria,
  type HistoriaDoQuadro,
} from '@/services/quadro'
import { APARENCIA_DA_COLUNA } from './aparencia'
import { CriteriosEmBdd } from './CriteriosEmBdd'

/**
 * O cartão aberto: a história inteira, para ler, editar e mover.
 *
 * Abre em leitura. Quem tem edição no módulo "quadro" marca atividades e muda
 * a coluna direto daqui, e tem o botão "Editar" para mexer no texto. História
 * nova abre já no formulário.
 *
 * O texto (título, eu/quero/para, critérios, observações) é um rascunho que só
 * vai ao banco em "Salvar". Atividade e coluna gravam na hora, como num quadro
 * de trabalho: marcar uma caixa não pede confirmação.
 */

interface Props {
  aberto: boolean
  /** `null` abre o formulário de história nova. */
  historia: HistoriaDoQuadro | null
  podeEditar: boolean
  /** Etiquetas já usadas, sugeridas no campo de etiqueta. */
  etiquetas: string[]
  onFechar: () => void
  /** Algo mudou no banco: o quadro recarrega. */
  onMudou: () => void
  onCloseAutoFocus?: (evento: Event) => void
}

const CAMPO =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200'

function dadosDa(historia: HistoriaDoQuadro | null): DadosDaHistoria {
  if (!historia) return { ...HISTORIA_EM_BRANCO }
  const { titulo, tag, eu, quero, para, criterios, observacoes, coluna } = historia
  return { titulo, tag, eu, quero, para, criterios, observacoes, coluna }
}

function Campo({
  id,
  rotulo,
  dica,
  erro,
  children,
}: {
  id: string
  rotulo: string
  dica?: string
  erro?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-base font-bold text-slate-900">
        {rotulo}
      </label>
      {dica && (
        <p id={`${id}-dica`} className="text-sm text-slate-600">
          {dica}
        </p>
      )}
      {children}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-sm font-semibold text-red-700">
          {erro}
        </p>
      )}
    </div>
  )
}

function ListaDeAtividades({
  historia,
  podeEditar,
  onMudou,
}: {
  historia: HistoriaDoQuadro
  podeEditar: boolean
  onMudou: () => void
}) {
  const [atividades, setAtividades] = useState<AtividadeDaHistoria[]>(historia.atividades)
  const [nova, setNova] = useState('')
  const [incluindo, setIncluindo] = useState(false)
  const idNova = useId()

  // A lista do banco manda: quando o quadro recarrega (inclusive por outra
  // pessoa, pelo tempo real), a lista aberta acompanha.
  useEffect(() => setAtividades(historia.atividades), [historia.atividades])

  const { feitas, total } = contagemDeAtividades(atividades)

  const marcar = async (atividade: AtividadeDaHistoria, concluida: boolean) => {
    setAtividades((lista) => lista.map((a) => (a.id === atividade.id ? { ...a, concluida } : a)))
    try {
      await atualizarAtividade(atividade.id, { concluida })
      onMudou()
    } catch (erro) {
      setAtividades((lista) =>
        lista.map((a) => (a.id === atividade.id ? { ...a, concluida: !concluida } : a)),
      )
      toast.error(getErrorMessage(erro))
    }
  }

  const renomear = async (atividade: AtividadeDaHistoria, titulo: string) => {
    if (titulo.trim() === atividade.titulo) return
    if (!titulo.trim()) {
      setAtividades((lista) => lista.map((a) => (a.id === atividade.id ? atividade : a)))
      toast.error('Escreva o que a atividade entrega, ou exclua a atividade.')
      return
    }
    try {
      await atualizarAtividade(atividade.id, { titulo })
      onMudou()
    } catch (erro) {
      toast.error(getErrorMessage(erro))
    }
  }

  const excluir = async (atividade: AtividadeDaHistoria) => {
    try {
      await excluirAtividade(atividade.id)
      setAtividades((lista) => lista.filter((a) => a.id !== atividade.id))
      toast.success(`Atividade "${atividade.titulo}" excluída.`)
      onMudou()
    } catch (erro) {
      toast.error(getErrorMessage(erro))
    }
  }

  const incluir = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!nova.trim()) return
    setIncluindo(true)
    try {
      const ordem = atividades.reduce((maior, a) => Math.max(maior, a.ordem), 0) + 1
      const criada = await criarAtividade(historia.id, nova, ordem)
      setAtividades((lista) => [...lista, criada])
      setNova('')
      onMudou()
    } catch (erro) {
      toast.error(getErrorMessage(erro))
    } finally {
      setIncluindo(false)
    }
  }

  return (
    <section aria-labelledby={`${idNova}-titulo`} className="space-y-3">
      <h3 id={`${idNova}-titulo`} className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <ListChecks className="h-5 w-5 shrink-0 text-slate-600" aria-hidden="true" />
        Atividades
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-bold text-slate-800">
          {feitas}/{total}
          <span className="sr-only"> feitas</span>
        </span>
      </h3>

      {atividades.length === 0 ? (
        <p className="text-base text-slate-600">
          Nenhuma atividade ainda. Elas nascem quando a história entra em desenvolvimento.
        </p>
      ) : (
        <ul className="space-y-2">
          {atividades.map((atividade, posicao) => (
            <li
              key={atividade.id}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <input
                id={`atividade-${atividade.id}`}
                type="checkbox"
                checked={atividade.concluida}
                disabled={!podeEditar}
                onChange={(evento) => marcar(atividade, evento.target.checked)}
                className="mt-1 h-6 w-6 shrink-0 rounded border-2 border-slate-400 text-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:opacity-70"
              />
              {podeEditar ? (
                <>
                  <label htmlFor={`atividade-${atividade.id}`} className="sr-only">
                    {historia.atividades.find((a) => a.id === atividade.id)?.titulo ?? atividade.titulo}
                  </label>
                  <input
                    aria-label={`Texto da atividade ${posicao + 1}`}
                    value={atividade.titulo}
                    maxLength={200}
                    onChange={(evento) =>
                      setAtividades((lista) =>
                        lista.map((a) =>
                          a.id === atividade.id ? { ...a, titulo: evento.target.value } : a,
                        ),
                      )
                    }
                    onBlur={(evento) =>
                      renomear(
                        historia.atividades.find((a) => a.id === atividade.id) ?? atividade,
                        evento.target.value,
                      )
                    }
                    className={`min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-base text-slate-900 hover:border-slate-200 focus:border-indigo-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ${atividade.concluida ? 'text-slate-600 line-through' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => excluir(atividade)}
                    aria-label={`Excluir a atividade "${atividade.titulo}"`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  </button>
                </>
              ) : (
                <label
                  htmlFor={`atividade-${atividade.id}`}
                  className={`flex-1 text-base ${atividade.concluida ? 'text-slate-600 line-through' : 'text-slate-900'}`}
                >
                  {atividade.titulo}
                </label>
              )}
            </li>
          ))}
        </ul>
      )}

      {podeEditar && (
        <form onSubmit={incluir} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={idNova} className="sr-only">
            Nova atividade
          </label>
          <input
            id={idNova}
            value={nova}
            maxLength={200}
            onChange={(evento) => setNova(evento.target.value)}
            placeholder="Nova atividade, por exemplo: Mostrar o motivo da recusa"
            className={CAMPO}
          />
          <Button type="submit" variant="outline" disabled={incluindo || !nova.trim()} className="min-h-11 shrink-0">
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            {incluindo ? 'Incluindo…' : 'Incluir'}
          </Button>
        </form>
      )}
    </section>
  )
}

export function DialogoDaHistoria({
  aberto,
  historia,
  podeEditar,
  etiquetas,
  onFechar,
  onMudou,
  onCloseAutoFocus,
}: Props) {
  const nova = historia === null
  const [editando, setEditando] = useState(nova)
  const [rascunho, setRascunho] = useState<DadosDaHistoria>(() => dadosDa(historia))
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [movendo, setMovendo] = useState(false)
  const idBase = useId()
  const id = (campo: string) => `${idBase}-${campo}`

  // Reabre limpo a cada história. Chave pelo id, e não pelo objeto: o quadro
  // recarrega pelo tempo real e não pode apagar o que está sendo digitado.
  useEffect(() => {
    if (!aberto) return
    setEditando(historia === null)
    setRascunho(dadosDa(historia))
    setErros({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, historia?.id])

  const cancelar = () => {
    if (nova) return onFechar()
    setEditando(false)
    setRascunho(dadosDa(historia))
    setErros({})
  }

  const alterar = <K extends keyof DadosDaHistoria>(campo: K, valor: DadosDaHistoria[K]) =>
    setRascunho((atual) => ({ ...atual, [campo]: valor }))

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!rascunho.titulo.trim()) {
      setErros({ titulo: 'Dê um título à história.' })
      return
    }
    setSalvando(true)
    setErros({})
    try {
      if (nova) {
        const criada = await criarHistoria(rascunho)
        toast.success(
          `História ${codigoDaHistoria(criada.numero)} criada em ${APARENCIA_DA_COLUNA[criada.coluna].rotulo}.`,
        )
        onMudou()
        onFechar()
      } else {
        await atualizarHistoria(historia.id, rascunho)
        toast.success(`História ${codigoDaHistoria(historia.numero)} salva.`)
        onMudou()
        setEditando(false)
      }
    } catch (erro) {
      const doCampo = extractFieldErrors(erro)
      if (Object.keys(doCampo).length) setErros(doCampo)
      else toast.error(getErrorMessage(erro))
    } finally {
      setSalvando(false)
    }
  }

  const mover = async (destino: ColunaDoQuadro) => {
    if (!historia || destino === historia.coluna) return
    setMovendo(true)
    try {
      await moverHistoria(historia.id, destino)
      toast.success(
        `${codigoDaHistoria(historia.numero)} foi para ${APARENCIA_DA_COLUNA[destino].rotulo}.`,
      )
      onMudou()
    } catch (erro) {
      toast.error(getErrorMessage(erro))
    } finally {
      setMovendo(false)
    }
  }

  const coluna = historia?.coluna ?? rascunho.coluna
  const estilo = APARENCIA_DA_COLUNA[coluna]
  const IconeDaColuna = estilo.icone
  const opcoesDeColuna = nova
    ? COLUNAS_DO_QUADRO.filter((c) => c !== 'concluido')
    : [historia.coluna, ...destinosPermitidos(historia.coluna)]

  const seletorDeColuna = (campo: string, valor: ColunaDoQuadro, aoMudar: (c: ColunaDoQuadro) => void) => (
    <select
      id={campo}
      value={valor}
      disabled={movendo}
      onChange={(evento) => aoMudar(evento.target.value as ColunaDoQuadro)}
      className={`${CAMPO} min-h-11`}
    >
      {COLUNAS_DO_QUADRO.filter((c) => opcoesDeColuna.includes(c)).map((c) => (
        <option key={c} value={c}>
          {APARENCIA_DA_COLUNA[c].rotulo}
        </option>
      ))}
    </select>
  )

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && onFechar()}>
      <DialogContent className="sm:max-w-3xl" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <p className="flex flex-wrap items-center gap-2 text-left">
            {historia && (
              <span className="rounded bg-slate-200 px-2 py-0.5 text-sm font-bold text-slate-900">
                {codigoDaHistoria(historia.numero)}
              </span>
            )}
            {historia?.tag && (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-sm font-semibold text-indigo-900">
                {historia.tag}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${estilo.caixa} ${estilo.texto}`}
            >
              <IconeDaColuna className="h-4 w-4 shrink-0" aria-hidden="true" />
              {estilo.rotulo}
            </span>
          </p>
          <DialogTitle className="pr-10 text-left text-xl font-bold text-slate-900 sm:text-2xl">
            {nova ? 'Nova história' : historia.titulo}
          </DialogTitle>
          <DialogDescription className="text-left text-base leading-relaxed text-slate-700">
            {nova
              ? 'Escreva quem quer, o que quer e para quê. Ela entra no Backlog, a menos que você escolha outra coluna.'
              : estilo.explicacao}
          </DialogDescription>
        </DialogHeader>

        {editando ? (
          <form onSubmit={salvar} className="space-y-5" noValidate>
            <Campo id={id('titulo')} rotulo="Título" erro={erros.titulo}>
              <input
                id={id('titulo')}
                value={rascunho.titulo}
                maxLength={160}
                required
                aria-invalid={Boolean(erros.titulo)}
                aria-describedby={erros.titulo ? `${id('titulo')}-erro` : undefined}
                onChange={(evento) => alterar('titulo', evento.target.value)}
                className={CAMPO}
              />
            </Campo>

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo id={id('tag')} rotulo="Etiqueta" dica="A parte do sistema, como Financeiro." erro={erros.tag}>
                <input
                  id={id('tag')}
                  value={rascunho.tag ?? ''}
                  maxLength={40}
                  list={id('etiquetas')}
                  aria-describedby={`${id('tag')}-dica`}
                  onChange={(evento) => alterar('tag', evento.target.value)}
                  className={CAMPO}
                />
                <datalist id={id('etiquetas')}>
                  {etiquetas.map((etiqueta) => (
                    <option key={etiqueta} value={etiqueta} />
                  ))}
                </datalist>
              </Campo>
              <Campo id={id('coluna')} rotulo="Coluna">
                {seletorDeColuna(id('coluna'), rascunho.coluna, (c) => alterar('coluna', c))}
              </Campo>
            </div>

            <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-base font-bold text-slate-900">A história</legend>
              <Campo id={id('eu')} rotulo="Eu" dica="Quem quer, com o papel. Ex.: Helena, sócia-administradora.">
                <input
                  id={id('eu')}
                  value={rascunho.eu}
                  aria-describedby={`${id('eu')}-dica`}
                  onChange={(evento) => alterar('eu', evento.target.value)}
                  className={CAMPO}
                />
              </Campo>
              <Campo id={id('quero')} rotulo="Quero">
                <textarea
                  id={id('quero')}
                  rows={2}
                  value={rascunho.quero}
                  onChange={(evento) => alterar('quero', evento.target.value)}
                  className={CAMPO}
                />
              </Campo>
              <Campo id={id('para')} rotulo="Para">
                <textarea
                  id={id('para')}
                  rows={2}
                  value={rascunho.para}
                  onChange={(evento) => alterar('para', evento.target.value)}
                  className={CAMPO}
                />
              </Campo>
            </fieldset>

            <Campo
              id={id('criterios')}
              rotulo="Critérios de aceitação (BDD)"
              dica="Um cenário por funcionalidade, em Gherkin: Cenário, Dado, Quando, Então."
            >
              <textarea
                id={id('criterios')}
                rows={14}
                value={rascunho.criterios}
                spellCheck={false}
                aria-describedby={`${id('criterios')}-dica`}
                onChange={(evento) => alterar('criterios', evento.target.value)}
                className={`${CAMPO} font-mono text-sm leading-relaxed`}
              />
            </Campo>

            <Campo id={id('observacoes')} rotulo="Observações">
              <textarea
                id={id('observacoes')}
                rows={4}
                value={rascunho.observacoes}
                onChange={(evento) => alterar('observacoes', evento.target.value)}
                className={CAMPO}
              />
            </Campo>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={cancelar}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando} className="min-h-11">
                {salvando ? 'Salvando…' : nova ? 'Criar história' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          historia && (
            <div className="space-y-6">
              <dl className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-base sm:grid-cols-[auto_1fr] sm:gap-x-4">
                <dt className="font-bold text-slate-900">Eu</dt>
                <dd className="text-slate-800">{historia.eu || '—'}</dd>
                <dt className="font-bold text-slate-900">Quero</dt>
                <dd className="text-slate-800">{historia.quero || '—'}</dd>
                <dt className="font-bold text-slate-900">Para</dt>
                <dd className="text-slate-800">{historia.para || '—'}</dd>
              </dl>

              <section aria-labelledby={id('titulo-criterios')} className="space-y-2">
                <h3 id={id('titulo-criterios')} className="text-lg font-bold text-slate-900">
                  Critérios de aceitação
                </h3>
                {historia.criterios.trim() ? (
                  <CriteriosEmBdd texto={historia.criterios} />
                ) : (
                  <p className="text-base text-slate-600">Ainda sem critérios de aceitação.</p>
                )}
              </section>

              <section aria-labelledby={id('titulo-observacoes')} className="space-y-2">
                <h3
                  id={id('titulo-observacoes')}
                  className="flex items-center gap-2 text-lg font-bold text-slate-900"
                >
                  <ScrollText className="h-5 w-5 shrink-0 text-slate-600" aria-hidden="true" />
                  Observações
                </h3>
                <p className="whitespace-pre-line text-base leading-relaxed text-slate-800">
                  {historia.observacoes.trim() || 'Sem observações.'}
                </p>
              </section>

              <ListaDeAtividades historia={historia} podeEditar={podeEditar} onMudou={onMudou} />

              {podeEditar && (
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1.5 sm:w-64">
                    <label htmlFor={id('mover')} className="block text-base font-bold text-slate-900">
                      Coluna
                    </label>
                    {seletorDeColuna(id('mover'), historia.coluna, mover)}
                  </div>
                  <Button type="button" variant="outline" className="min-h-11" onClick={() => setEditando(true)}>
                    <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                    Editar a história
                  </Button>
                </div>
              )}
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
