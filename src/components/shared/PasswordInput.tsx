import { forwardRef, useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Campo de senha com o botão "mostrar / ocultar" dentro (olho de 44px).
 *
 * Quem digita senha longa, com 70 anos e o celular na mão, precisa conferir o
 * que escreveu. O nome termina em `Input` para o `Field` achar o controle e
 * ligar rótulo, ajuda e erro a ele.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<ComponentProps<'input'>, 'type'>>(
  ({ className, ...props }, ref) => {
    const [visivel, setVisivel] = useState(false)
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visivel ? 'text' : 'password'}
          className={cn('min-h-14 pr-16', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visivel}
          className="foco-interno absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
        >
          {visivel ? (
            <EyeOff className="h-[22px] w-[22px]" aria-hidden="true" />
          ) : (
            <Eye className="h-[22px] w-[22px]" aria-hidden="true" />
          )}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
