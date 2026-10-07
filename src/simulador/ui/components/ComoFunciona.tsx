import React from 'react'
import { Calculator, CalendarRange, Leaf, type LucideIcon } from 'lucide-react'

const CARTOES: { icone: LucideIcon; titulo: string; texto: string; canto: string }[] = [
  {
    icone: Leaf,
    titulo: 'O que muda',
    texto:
      'IBS e CBS substituem aos poucos PIS, Cofins, ISS e ICMS. A locação de imóveis passa a ter esses tributos.',
    canto: 'rounded-organic-tr',
  },
  {
    icone: Calculator,
    titulo: 'Redutor de 70%',
    texto:
      'A locação paga 30% da alíquota de referência. Com 26,5%, a alíquota efetiva fica perto de 7,95%.',
    canto: 'rounded-organic-tl',
  },
  {
    icone: CalendarRange,
    titulo: 'Transição até 2033',
    texto:
      'As alíquotas sobem por etapas entre 2026 e 2033. O simulador apura pelo ano corrente da transição.',
    canto: 'rounded-organic-br',
  },
]

/** Três cartões explicativos (tela 05 do handoff); sobem e giram 1° no hover. */
export const ComoFunciona: React.FC = () => (
  <section
    id="como-funciona"
    aria-labelledby="como-funciona-titulo"
    className="scroll-mt-24 space-y-5"
  >
    <h2 id="como-funciona-titulo" className="text-2xl text-text-primary sm:text-3xl">
      Como funciona
    </h2>
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-5 lg:gap-7">
      {CARTOES.map(({ icone: Icone, titulo, texto, canto }) => (
        <li
          key={titulo}
          className={`gira-no-hover flex flex-col gap-3.5 border border-sim-border/60 bg-surface p-7 shadow-soft transition-all duration-400 hover:-translate-y-1 hover:rotate-1 hover:shadow-lift ${canto}`}
        >
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-bg/10 text-accent-bg"
          >
            <Icone className="h-7 w-7" />
          </span>
          <h3 className="text-[1.4375rem] text-text-primary">{titulo}</h3>
          <p className="text-base leading-relaxed text-text-secondary">{texto}</p>
        </li>
      ))}
    </ul>
  </section>
)
