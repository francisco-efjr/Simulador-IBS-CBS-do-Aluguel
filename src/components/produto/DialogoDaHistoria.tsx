import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Eye, ListChecks, PencilLine, Plus, ScrollText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
 * O cartão aberto: a história inteira.
 *
 * Quem tem edição no módulo "quadro" edita tudo direto, sem modo de edição à
 * parte: título, "Eu, quero, para", critérios, observações e etiqueta são um
 * rascunho que vai ao banco em "Salvar alterações"; coluna e atividades gravam
 * na hora, como num quadro de trabalho. Quem só tem visualização lê.
 *
 * No computador o cartão se divide em duas colunas — o texto à esquerda,
 * etiqueta, coluna e atividades à direita; no celular, uma coluna só.
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

const CAMPOS_DE_TEXTO = ['titulo', 'tag', 'eu', 'quero', 'para', 'criterios', 'observacoes'] as const

type TextoDaHistoria = Pick<DadosDaHistoria, (typeof CAMPOS_DE_TEXTO)[number]>

const CAMPO =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200'

const BOTAO_DE_ABA =
  'inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300'

function dadosDa(historia: HistoriaDoQuadro | null): DadosDaHistoria {
  if (!historia) return { ...HISTORIA_EM_BRANCO }
  const { titulo, tag, eu, quero, para, criterios, observacoes, coluna } = historia
  return { titulo, tag, eu, quero, para, criterios, observacoes, coluna }
}

function textoDe(dados: DadosDaHistoria): TextoDaHistoria {
  const { titulo, tag, eu, quero, para, criterios, observacoes } = dados
  return { titulo, tag, eu, quero, para, criterios, observacoes }
}

function Campo({
  id,
  rotulo,
  dica,
  erro,
  children,
}: {
  id: string
  rotulo: ReactNode
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
  const original = (id: string) => historia.atividades.find((a) => a.id === id)

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
    const antes = original(atividade.id) ?? atividade
    if (titulo.trim() === antes.titulo) return
    if (!titulo.trim()) {
      setAtividades((lista) => lista.map((a) => (a.id === atividade.id ? antes : a)))
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

  // A lista fica dentro do formulário da história: incluir não pode enviar o
  // formulário de fora, então o Enter do campo é tratado aqui.
  const incluir = async () => {
    if (!nova.trim() || incluindo) return
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

  const aoTeclarNaNova = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key !== 'Enter') return
    evento.preventDefault()
    incluir()
  }

  return (
    <section aria-labelledby={`${idNova}-titulo`} className="space-y-3">
      <h3
        id={`${idNova}-titulo`}
        className="flex items-center gap-2 text-base font-bold text-slate-900"
      >
        <ListChecks className="h-5 w-5 shrink-0 text-slate-600" aria-hidden="true" />
        Atividades
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-bold text-slate-800">
          {feitas}/{total}
          <span className="sr-only"> feitas</span>
        </span>
      </h3>

      {atividades.length === 0 ? (
        <p className="text-sm text-slate-600">
          Nenhuma atividade ainda. Elas nascem quando a história entra em desenvolvimento.
        </p>
      ) : (
        <ul className="space-y-2">
          {atividades.map((atividade, posicao) => (
            <li
              key={atividade.id}
              className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2"
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
                    {original(atividade.id)?.titulo ?? atividade.titulo}
                  </label>
                  <textarea
                    aria-label={`Texto da atividade ${posicao + 1}`}
                    value={atividade.titulo}
                    maxLength={200}
                    rows={1}
                    onChange={(evento) =>
                      setAtividades((lista) =>
                        lista.map((a) =>
                          a.id === atividade.id ? { ...a, titulo: evento.target.value } : a,
                        ),
                      )
                    }
                    onKeyDown={(evento) => {
                      if (evento.key !== 'Enter') return
                      evento.preventDefault()
                      evento.currentTarget.blur()
                    }}
                    onBlur={(evento) => renomear(atividade, evento.target.value)}
                    className={`min-w-0 flex-1 resize-none rounded border border-transparent bg-transparent px-1 py-0.5 text-sm leading-snug text-slate-900 [field-sizing:content] hover:border-slate-200 focus:border-indigo-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ${atividade.concluida ? 'text-slate-600 line-through' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => excluir(atividade)}
                    aria-label={`Excluir a atividade "${atividade.titulo}"`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </>
              ) : (
                <label
                  htmlFor={`atividade-${atividade.id}`}
                  className={`flex-1 text-sm leading-snug ${atividade.concluida ? 'text-slate-600 line-through' : 'text-slate-900'}`}
                >
                  {atividade.titulo}
                </label>
              )}
            </li>
          ))}
        </ul>
      )}

      {podeEditar && (
        <div className="flex gap-2">
          <label htmlFor={idNova} className="sr-only">
            Nova atividade
          </label>
          <input
            id={idNova}
            value={nova}
            maxLength={200}
            onChange={(evento) => setNova(evento.target.value)}
            onKeyDown={aoTeclarNaNova}
            placeholder="Nova atividade"
            className={`${CAMPO} min-w-0 text-sm`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={incluir}
            disabled={incluindo || !nova.trim()}
            aria-label="Incluir a atividade"
            className="min-h-11 shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
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
  const editavel = podeEditar || nova
  const [rascunho, setRascunho] = useState<DadosDaHistoria>(() => dadosDa(historia))
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [movendo, setMovendo] = useState(false)
  const [criteriosFormatados, setCriteriosFormatados] = useState(false)
  const idBase = useId()
  const id = (campo: string) => `${idBase}-${campo}`
  const caixa = useRef<HTMLDivElement>(null)

  // Reabre limpo a cada história. Chave pelo id, e não pelo objeto: o quadro
  // recarrega pelo tempo real e não pode apagar o que está sendo digitado.
  useEffect(() => {
    if (!aberto) return
    setRascunho(dadosDa(historia))
    setErros({})
    setCriteriosFormatados(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, historia?.id])

  const salvo = textoDe(dadosDa(historia))
  const atual = textoDe(rascunho)
  const alterado = CAMPOS_DE_TEXTO.some((campo) => (atual[campo] ?? '') !== (salvo[campo] ?? ''))

  const alterar = <K extends keyof DadosDaHistoria>(campo: K, valor: DadosDaHistoria[K]) =>
    setRascunho((anterior) => ({ ...anterior, [campo]: valor }))

  const fechar = () => {
    if (
      editavel &&
      alterado &&
      !window.confirm('Há alterações que não foram salvas nesta história. Fechar mesmo assim?')
    )
      return
    onFechar()
  }

  const descartar = () => {
    setRascunho(dadosDa(historia))
    setErros({})
  }

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
        // Só o texto: a coluna grava na hora e pode ter sido mudada por outra
        // pessoa enquanto este rascunho estava aberto.
        await atualizarHistoria(historia.id, textoDe(rascunho))
        toast.success(`História ${codigoDaHistoria(historia.numero)} salva.`)
        onMudou()
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

  const seletorDeColuna = (
    <select
      id={id('coluna')}
      value={nova ? rascunho.coluna : historia.coluna}
      disabled={movendo}
      onChange={(evento) => {
        const destino = evento.target.value as ColunaDoQuadro
        if (nova) alterar('coluna', destino)
        else mover(destino)
      }}
      className={`${CAMPO} min-h-11`}
    >
      {COLUNAS_DO_QUADRO.filter((c) => opcoesDeColuna.includes(c)).map((c) => (
        <option key={c} value={c}>
          {APARENCIA_DA_COLUNA[c].rotulo}
        </option>
      ))}
    </select>
  )

  const criteriosLegiveis = (texto: string) =>
    texto.trim() ? (
      <CriteriosEmBdd texto={texto} />
    ) : (
      <p className="text-base text-slate-600">Ainda sem critérios de aceitação.</p>
    )

  const formulario = (
    <form onSubmit={salvar} noValidate className="space-y-6">
      <Campo id={id('titulo')} rotulo="Título" erro={erros.titulo}>
        <input
          id={id('titulo')}
          value={rascunho.titulo}
          maxLength={160}
          required
          aria-invalid={Boolean(erros.titulo)}
          aria-describedby={erros.titulo ? `${id('titulo')}-erro` : undefined}
          onChange={(evento) => alterar('titulo', evento.target.value)}
          className={`${CAMPO} text-lg font-bold sm:text-xl`}
        />
      </Campo>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <legend className="px-1 text-base font-bold text-slate-900">Descrição</legend>
            <Campo
              id={id('eu')}
              rotulo="Eu"
              dica="Quem quer, com o papel. Ex.: Helena, sócia-administradora."
            >
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
                className={`${CAMPO} [field-sizing:content]`}
              />
            </Campo>
            <Campo id={id('para')} rotulo="Para">
              <textarea
                id={id('para')}
                rows={2}
                value={rascunho.para}
                onChange={(evento) => alterar('para', evento.target.value)}
                className={`${CAMPO} [field-sizing:content]`}
              />
            </Campo>
          </fieldset>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <label htmlFor={id('criterios')} className="block text-base font-bold text-slate-900">
                Critérios de aceitação (BDD)
              </label>
              <div
                role="group"
                aria-label="Como mostrar os critérios"
                className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={!criteriosFormatados}
                  onClick={() => setCriteriosFormatados(false)}
                  className={`${BOTAO_DE_ABA} ${!criteriosFormatados ? 'bg-indigo-700 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  <PencilLine className="h-4 w-4" aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  aria-pressed={criteriosFormatados}
                  onClick={() => setCriteriosFormatados(true)}
                  className={`${BOTAO_DE_ABA} ${criteriosFormatados ? 'bg-indigo-700 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Ver formatado
                </button>
              </div>
            </div>
            <p id={`${id('criterios')}-dica`} className="text-sm text-slate-600">
              Um cenário por funcionalidade, em Gherkin: Cenário, Dado, Quando, Então.
            </p>
            {criteriosFormatados ? (
              criteriosLegiveis(rascunho.criterios)
            ) : (
              <textarea
                id={id('criterios')}
                rows={16}
                value={rascunho.criterios}
                spellCheck={false}
                aria-describedby={`${id('criterios')}-dica`}
                onChange={(evento) => alterar('criterios', evento.target.value)}
                className={`${CAMPO} font-mono text-sm leading-relaxed`}
              />
            )}
          </div>

          <Campo id={id('observacoes')} rotulo="Observações">
            <textarea
              id={id('observacoes')}
              rows={4}
              value={rascunho.observacoes}
              onChange={(evento) => alterar('observacoes', evento.target.value)}
              className={`${CAMPO} [field-sizing:content]`}
            />
          </Campo>
        </div>

        <aside className="space-y-6 lg:rounded-xl lg:border lg:border-slate-200 lg:p-4">
          <Campo
            id={id('tag')}
            rotulo="Etiqueta"
            dica="A parte do sistema, como Financeiro."
            erro={erros.tag}
          >
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

          <Campo
            id={id('coluna')}
            rotulo="Coluna"
            dica={nova ? undefined : 'Muda na hora, sem precisar salvar.'}
          >
            {seletorDeColuna}
          </Campo>

          {historia ? (
            <ListaDeAtividades historia={historia} podeEditar={podeEditar} onMudou={onMudou} />
          ) : (
            <p className="text-sm text-slate-600">
              As atividades entram depois que a história for criada.
            </p>
          )}
        </aside>
      </div>

      <div className="sticky -bottom-4 -mx-4 flex flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:-bottom-6 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p aria-live="polite" className="text-sm font-semibold text-slate-600">
          {nova ? '' : alterado ? 'Há alterações não salvas.' : 'Tudo salvo.'}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {nova && (
            <Button type="button" variant="outline" className="min-h-11" onClick={fechar}>
              Cancelar
            </Button>
          )}
          {!nova && alterado && (
            <Button type="button" variant="outline" className="min-h-11" onClick={descartar}>
              Descartar alterações
            </Button>
          )}
          <Button type="submit" disabled={salvando || (!nova && !alterado)} className="min-h-11">
            {salvando ? 'Salvando…' : nova ? 'Criar história' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </form>
  )

  const leitura = historia && (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="min-w-0 space-y-6">
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
          {criteriosLegiveis(historia.criterios)}
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
      </div>

      <aside className="lg:rounded-xl lg:border lg:border-slate-200 lg:p-4">
        <ListaDeAtividades historia={historia} podeEditar={false} onMudou={onMudou} />
      </aside>
    </div>
  )

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && fechar()}>
      <DialogContent
        ref={caixa}
        className="sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl"
        // O foco vai para o cartão, e não para o título: com o texto já
        // selecionado, a primeira tecla apagaria o título sem querer.
        onOpenAutoFocus={(evento) => {
          if (nova) return
          evento.preventDefault()
          caixa.current?.focus()
        }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogHeader className="space-y-2">
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
          <DialogTitle
            className={
              editavel ? 'sr-only' : 'pr-10 text-left text-xl font-bold text-slate-900 sm:text-2xl'
            }
          >
            {nova
              ? 'Nova história'
              : editavel
                ? `${codigoDaHistoria(historia.numero)}: ${historia.titulo}`
                : historia.titulo}
          </DialogTitle>
          <DialogDescription className="text-left text-base leading-relaxed text-slate-700">
            {nova
              ? 'Escreva quem quer, o que quer e para quê. Ela entra no Backlog, a menos que você escolha outra coluna.'
              : estilo.explicacao}
          </DialogDescription>
        </DialogHeader>

        {editavel ? formulario : leitura}
      </DialogContent>
    </Dialog>
  )
}
