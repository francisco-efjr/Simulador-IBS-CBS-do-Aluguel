import type { ReactNode } from 'react'
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
  descricao: string
  /** Texto do botão que confirma. Diz o que vai acontecer, não "OK". */
  rotuloConfirmar: string
  onConfirmar: () => void
  /** Vermelho quando a ação remove ou desativa algo. */
  perigoso?: boolean
}

/**
 * Pergunta antes de fazer o que é difícil desfazer.
 *
 * Um clique errado em um ícone pequeno não pode inativar um contrato. O
 * diálogo diz em palavras o que vai acontecer com qual registro, e o botão de
 * confirmação repete a ação em vez de dizer "OK" — quem lê rápido, ou lê por
 * leitor de tela, precisa da frase completa no próprio botão.
 */
export function ConfirmarAcao({
  children,
  titulo,
  descricao,
  rotuloConfirmar,
  onConfirmar,
  perigoso = true,
}: ConfirmarAcaoProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">{titulo}</AlertDialogTitle>
          <AlertDialogDescription className="text-base text-slate-700">
            {descricao}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="min-h-[48px] text-base">
            Voltar sem alterar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            className={
              perigoso
                ? 'min-h-[48px] text-base bg-red-700 hover:bg-red-800 focus-visible:ring-red-700'
                : 'min-h-[48px] text-base'
            }
          >
            {rotuloConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
