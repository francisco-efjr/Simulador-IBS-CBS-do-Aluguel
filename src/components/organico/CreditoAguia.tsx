import { DESENVOLVEDORA } from '@/lib/marca'
import { cn } from '@/lib/utils'

/** "Desenvolvido por Aguia Solutions LTDA" — fim do menu, login e simulador. */
export function CreditoAguia({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-accent-foreground', className)}>
      Desenvolvido por <strong className="font-extrabold">{DESENVOLVEDORA}</strong>
    </p>
  )
}
