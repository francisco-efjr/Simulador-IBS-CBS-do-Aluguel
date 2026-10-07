import { Ban, Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ConfirmarAcao } from '@/components/shared/ConfirmarAcao'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentUpload } from '@/components/shared/DocumentUpload'
import { formatDate, TIPO_PESSOA_LABELS } from '@/lib/format'

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-sm text-accent-foreground">{label}</p>
      <p className="text-base font-bold">{value || '—'}</p>
    </div>
  )
}

export function InquilinoDetailDialog({
  inquilino,
  open,
  onOpenChange,
  onEdit,
  onInativar,
  canEdit = true,
}: {
  inquilino: any
  open: boolean
  onOpenChange: (v: boolean) => void
  onEdit: () => void
  /** Inativa o inquilino; o botão só aparece para quem pode editar e se ele ainda está ativo. */
  onInativar?: () => void
  canEdit?: boolean
}) {
  if (!inquilino) return null
  const isPF = inquilino.tipo_pessoa !== 'pj'
  const doc = isPF ? inquilino.cpf : inquilino.cnpj

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{inquilino.nome}</span>
            <StatusBadge type="geral" status={inquilino.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoItem label="Tipo" value={TIPO_PESSOA_LABELS[inquilino.tipo_pessoa] || '—'} />
            <InfoItem label={isPF ? 'CPF' : 'CNPJ'} value={doc} />
            {isPF ? (
              <>
                <InfoItem label="RG" value={inquilino.rg} />
                <InfoItem label="Nascimento" value={formatDate(inquilino.data_nascimento)} />
              </>
            ) : (
              <>
                <InfoItem label="Nome fantasia" value={inquilino.nome_fantasia} />
                <InfoItem label="Responsável" value={inquilino.responsavel} />
              </>
            )}
            <InfoItem label="Telefone" value={inquilino.telefone} />
            <InfoItem label="E-mail" value={inquilino.email} />
            <InfoItem label="Endereço" value={inquilino.endereco} />
            <InfoItem label="Cadastro" value={formatDate(inquilino.created)} />
          </div>
          {inquilino.observacoes && (
            <div>
              <p className="mb-0.5 text-sm text-accent-foreground">Observações</p>
              <p className="text-base">{inquilino.observacoes}</p>
            </div>
          )}
          <div>
            <p className="mb-1.5 text-sm text-accent-foreground">Documentos</p>
            <DocumentUpload entidadeTipo="inquilino" entidadeId={inquilino.id} />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 pt-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Fechar
          </Button>
          {canEdit && onInativar && inquilino.status !== 'inativo' && (
            <ConfirmarAcao
              titulo="Inativar este inquilino?"
              descricao="O inquilino sai das listas ativas e deixa de aparecer para novos contratos. O histórico continua guardado e o status pode ser revertido pela edição."
              rotuloConfirmar="Sim, inativar o inquilino"
              onConfirmar={onInativar}
            >
              <Button variant="ghost" className="w-full text-red-800 hover:bg-destructive/10 sm:w-auto">
                <Ban aria-hidden="true" /> Inativar
              </Button>
            </ConfirmarAcao>
          )}
          {canEdit && (
            <Button onClick={onEdit} className="w-full sm:w-auto">
              <Pencil aria-hidden="true" /> Editar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
