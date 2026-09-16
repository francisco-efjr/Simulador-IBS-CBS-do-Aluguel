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
import { formatDate, TIPO_FORNECEDOR_LABELS } from '@/lib/format'

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  )
}

export function FornecedorDetailDialog({
  fornecedor,
  open,
  onOpenChange,
  onEdit,
  canEdit = true,
}: {
  fornecedor: any
  open: boolean
  onOpenChange: (v: boolean) => void
  onEdit: () => void
  canEdit?: boolean
}) {
  if (!fornecedor) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{fornecedor.nome}</span>
            <StatusBadge type="geral" status={fornecedor.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoItem
              label="Tipo"
              value={TIPO_FORNECEDOR_LABELS[fornecedor.tipo_fornecedor] || '—'}
            />
            <InfoItem label="CPF/CNPJ" value={fornecedor.cnpj_cpf} />
            <InfoItem label="Nome fantasia" value={fornecedor.nome_fantasia} />
            <InfoItem label="Contato" value={fornecedor.contato} />
            <InfoItem label="Telefone" value={fornecedor.telefone} />
            <InfoItem label="E-mail" value={fornecedor.email} />
            <InfoItem label="Endereço" value={fornecedor.endereco} />
            <InfoItem label="Cadastro" value={formatDate(fornecedor.created)} />
          </div>
          {fornecedor.servicos_prestados && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Serviços prestados</p>
              <p className="text-sm text-slate-600">{fornecedor.servicos_prestados}</p>
            </div>
          )}
          {fornecedor.observacoes && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Observações</p>
              <p className="text-sm text-slate-600">{fornecedor.observacoes}</p>
            </div>
          )}
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
