import { Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentUpload } from '@/components/shared/DocumentUpload'
import { formatDate, TIPO_PESSOA_LABELS } from '@/lib/format'

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  )
}

export function InquilinoDetailDialog({
  inquilino,
  open,
  onOpenChange,
  onEdit,
  canEdit = true,
}: {
  inquilino: any
  open: boolean
  onOpenChange: (v: boolean) => void
  onEdit: () => void
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
              <p className="text-xs text-slate-400 mb-0.5">Observações</p>
              <p className="text-sm text-slate-600">{inquilino.observacoes}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Documentos</p>
            <DocumentUpload entidadeTipo="inquilino" entidadeId={inquilino.id} />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Fechar
          </Button>
          {canEdit && (
            <Button
              onClick={onEdit}
              className="w-full sm:w-auto min-h-[44px] bg-indigo-600 hover:bg-indigo-700"
            >
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          )}{' '}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
