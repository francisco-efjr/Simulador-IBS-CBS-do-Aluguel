import { Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Marca do sistema: broto musgo num blob. Decorativa — o nome vem ao lado, em texto. */
export function LogoSistema({
  tamanho = 'md',
  invertido = false,
  className,
}: {
  tamanho?: 'sm' | 'md' | 'lg'
  invertido?: boolean
  className?: string
}) {
  const medidas = {
    sm: 'h-10 w-10 [&_svg]:h-5 [&_svg]:w-5',
    md: 'h-12 w-12 [&_svg]:h-6 [&_svg]:w-6',
    lg: 'h-[72px] w-[72px] [&_svg]:h-8 [&_svg]:w-8',
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'blob-1 flex shrink-0 items-center justify-center',
        invertido ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground',
        medidas[tamanho],
        className,
      )}
    >
      <Sprout strokeWidth={2} />
    </span>
  )
}
