import { Card, cantoOrganico } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Estado "carregando" da lista de contratos (seção 15 do handoff Fase 2).
 *
 * Blocos com pulso suave no lugar de cartões e de tabela, na mesma forma do que
 * vai aparecer, para a tela não "pular" quando os dados chegam. A lista toda é
 * `aria-busy`; o leitor de tela ouve só "Carregando contratos…" (`role="status"`),
 * e os blocos ficam escondidos dele.
 */
export function CarregandoContratos() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Carregando contratos…
      </span>

      {/* Computador largo: linhas de tabela. */}
      <Card aria-hidden="true" className="hidden overflow-hidden min-[1500px]:block">
        <div className="grid grid-cols-[1.6fr_1.3fr_1fr_1fr_1fr_150px] gap-4 bg-muted px-7 py-[18px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-3/5 rounded-lg" />
          ))}
          <span />
        </div>
        {[0, 1, 2, 3, 4].map((linha) => (
          <div
            key={linha}
            className="grid grid-cols-[1.6fr_1.3fr_1fr_1fr_1fr_150px] items-center gap-4 border-t border-border/60 px-7 py-5"
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-[18px] w-4/5 rounded-lg" />
              <Skeleton className="h-3.5 w-[45%] rounded-lg" />
            </div>
            <Skeleton className="h-[18px] w-3/4 rounded-lg" />
            <Skeleton className="h-[18px] w-3/5 rounded-lg" />
            <Skeleton className="h-[18px] w-[65%] rounded-lg" />
            <Skeleton className="h-7 w-[110px] rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        ))}
      </Card>

      {/* Celular, tablet e computador estreito: cartões. */}
      <ul
        aria-hidden="true"
        className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-3 min-[1500px]:hidden md:gap-4"
      >
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Card canto={cantoOrganico(i)} className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-[35%] rounded-lg" />
                <Skeleton className="h-7 w-[90px] rounded-full" />
              </div>
              <Skeleton className="h-6 w-[70%] rounded-lg" />
              <Skeleton className="h-16 w-full rounded-[18px]" />
              <Skeleton className="h-12 w-full rounded-full" />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
