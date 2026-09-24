import { SquareKanban } from 'lucide-react'
import { QuadroDeHistorias } from '@/components/produto/QuadroDeHistorias'

export default function Quadro() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <SquareKanban className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Quadro de Histórias
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
            O que o sistema faz e o que falta, com os critérios de aceitação. Homologação e Concluído
            são sempre decisão de uma pessoa.
          </p>
        </div>
      </div>

      <QuadroDeHistorias />
    </div>
  )
}
