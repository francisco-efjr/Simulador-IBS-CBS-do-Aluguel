import type { ReactNode } from 'react'
import { CircleHelp, Trash2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ConfirmarAcaoProps {
  /** O botão que dispara a ação. Recebe o papel de gatilho do diálogo. */
  children: ReactNode
  titulo: string
  /** Diz o que acontece com o registro e se dá para desfazer. */
  descricao: string
  /** Texto do botão que confirma. Diz o que vai acontecer ("Sim, excluir"), não "OK". */
  rotuloConfirmar: string
  onConfirmar: () => void
  /** Vermelho quando a ação remove ou desativa algo. */
  perigoso?: boolean
  /** Ícone do bloco no topo; o padrão é a lixeira para ação perigosa. */
  icone?: LucideIcon
}

/**
 * Pergunta antes de fazer o que é difícil desfazer (guia de estilo, seção 07).
 *
 * Um clique errado em um ícone pequeno não pode inativar um contrato. O
 * diálogo diz em palavras o que vai acontecer e se dá para desfazer, e o botão
 * de confirmação repete a ação em vez de dizer "OK". O foco abre em "Cancelar"
 * (a opção segura, que o Radix escolhe por ser o `AlertDialogCancel`). No
 * celular vira painel de baixo.
 */
export function ConfirmarAcao({
  children,
  titulo,
  descricao,
  rotuloConfirmar,
  onConfirmar,
  perigoso = true,
  icone,
}: ConfirmarAcaoProps) {
  const Icone = icone ?? (perigoso ? Trash2 : CircleHelp)
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-[34rem]">
        <AlertDialogHeader className="gap-4 text-left">
          <span
            aria-hidden="true"
            className={cn(
              'blob-1 flex h-14 w-14 items-center justify-center',
              perigoso ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
            )}
          >
            <Icone className="h-6 w-6" />
          </span>
          <AlertDialogTitle className="text-balance text-[1.625rem] leading-tight sm:text-[1.75rem]">
            {titulo}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[1.0625rem] leading-normal text-accent-foreground">
            {descricao}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-1 flex-col gap-2.5 sm:flex-row-reverse sm:justify-start sm:gap-3">
          <AlertDialogCancel
            variant={perigoso ? 'default' : 'outline'}
            className="mt-0 min-h-14 text-lg sm:min-h-[52px] sm:text-[1.0625rem]"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            variant={perigoso ? 'perigo' : 'default'}
            className="min-h-14 text-lg sm:min-h-[52px] sm:text-[1.0625rem]"
          >
            {rotuloConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
