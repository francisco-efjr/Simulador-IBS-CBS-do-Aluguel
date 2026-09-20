import { CircleHelp, ListChecks, ScrollText } from 'lucide-react'
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DECISOES_DO_DONO, type Historia } from '@/data/historias'
import { APARENCIA_DA_COLUNA } from './aparencia'

/**
 * A história inteira, no diálogo que abre ao clicar no cartão do quadro.
 *
 * Só leitura: nada aqui muda a situação da história. O conteúdo vem de
 * `src/data/historias.json`, derivado da documentação de produto.
 *
 * O diálogo é o do shadcn/ui (Radix): ele prende o foco enquanto está aberto,
 * fecha no Esc e devolve o foco ao cartão que o abriu. Por isso o cartão é um
 * `DialogTrigger` de verdade, e não uma `div` com `onClick`.
 */

interface Props {
  historia: Historia
}

/** "3 cenários" / "1 cenário" — sem "1 cenários" na tela. */
function plural(quantidade: number, singular: string, pluralForma: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : pluralForma}`
}

export function DialogoDaHistoria({ historia }: Props) {
  const estilo = APARENCIA_DA_COLUNA[historia.coluna]
  const Icone = estilo.icone
  const { cenarios } = historia
  const decisao = historia.decisaoPendente ? DECISOES_DO_DONO[historia.decisaoPendente] : undefined

  const aindaNao: string[] = []
  if (cenarios.propostos) aindaNao.push(plural(cenarios.propostos, 'ainda falta', 'ainda faltam'))
  if (cenarios.lacunas)
    aindaNao.push(
      `${plural(cenarios.lacunas, 'funciona', 'funcionam')} de um jeito diferente do combinado`,
    )
  if (cenarios.defeitos)
    aindaNao.push(`${plural(cenarios.defeitos, 'tem', 'têm')} defeito provável a confirmar`)

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <p className="flex flex-wrap items-center gap-2 text-left">
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
        </p>
        <DialogTitle className="pr-10 text-left text-xl font-bold text-slate-900 sm:text-2xl">
          {historia.titulo}
        </DialogTitle>
        <DialogDescription className="text-left text-base leading-relaxed text-slate-700">
          {historia.resumo}
        </DialogDescription>
      </DialogHeader>

      <blockquote className="border-l-4 border-slate-300 pl-4 text-base leading-relaxed text-slate-800">
        {historia.comoQueroPara}
      </blockquote>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="flex items-center gap-2 text-base font-bold text-slate-900">
          <ListChecks className="h-5 w-5 shrink-0 text-slate-600" aria-hidden="true" />
          Cenários de aceitação
        </p>
        <p className="mt-1 text-base leading-relaxed text-slate-700">
          São {plural(cenarios.total, 'situação combinada', 'situações combinadas')} para conferir
          se a história está de pé. Hoje{' '}
          <strong className="font-bold text-slate-900">
            {cenarios.implementados === 0
              ? 'nenhuma passa'
              : cenarios.implementados === 1
                ? '1 já passa'
                : `${cenarios.implementados} já passam`}
          </strong>
          {aindaNao.length ? `; ${aindaNao.join(', ')}.` : '.'}
        </p>
      </div>

      <dl className="space-y-3 text-base">
        <div>
          <dt className="font-bold text-slate-900">Regras que a história segue</dt>
          <dd className="mt-1 text-slate-700">
            {historia.regras.length
              ? historia.regras.join(', ')
              : 'Nenhuma regra específica — vale o comportamento geral do sistema.'}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-slate-900">
            {historia.backlog.length === 1 ? 'Item da lista do que fazer' : 'Itens da lista do que fazer'}
          </dt>
          <dd className="mt-1 text-slate-700">
            {historia.backlog.length
              ? historia.backlog.join(', ')
              : 'Nada pendente na lista: a história está inteira.'}
          </dd>
        </div>
      </dl>

      {decisao && (
        <div className="flex gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <CircleHelp className="mt-0.5 h-6 w-6 shrink-0 text-indigo-700" aria-hidden="true" />
          <div>
            <p className="text-base font-bold text-indigo-950">
              Depende de uma decisão sua
              <span className="ml-2 rounded bg-indigo-200 px-2 py-0.5 text-sm font-bold text-indigo-950">
                {historia.decisaoPendente}
              </span>
            </p>
            <p className="mt-1 text-base leading-relaxed text-indigo-950/90">{decisao}</p>
          </div>
        </div>
      )}

      <p className="flex gap-2 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">
        <ScrollText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Esta ficha vem da documentação do produto. Para fechar, aperte Esc ou o botão de fechar.
      </p>
    </DialogContent>
  )
}
