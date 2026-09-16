import { Pencil, Trash2 } from 'lucide-react'
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
import {
  formatCurrency,
  formatDate,
  STATUS_RECEITA_LABELS,
  FORMA_RECEBIMENTO_LABELS,
} from '@/lib/format'

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  )
}

export function ReceitaDetailDialog({
  receita,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  canEdit = true,
}: {
  receita: any
  open: boolean
  onOpenChange: (v: boolean) => void
  onEdit: () => void
  onDelete: () => void
  canEdit?: boolean
}) {
  if (!receita) return null
  const imovel = receita.expand?.imovel
  const contrato = receita.expand?.contrato
  const inquilino = receita.expand?.inquilino
  const categoria = receita.expand?.categoria

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{receita.descricao || `Receita ${receita.id.slice(0, 8)}`}</span>
            <StatusBadge type="receita" status={receita.status_financeiro} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <InfoItem label="Imóvel" value={imovel?.nome || imovel?.endereco || '—'} />
            <InfoItem label="Contrato" value={contrato?.numero || '—'} />
            <InfoItem label="Inquilino" value={inquilino?.nome || '—'} />
            <InfoItem label="Categoria" value={categoria?.nome || '—'} />
            <InfoItem label="Competência" value={receita.competencia} />
            <InfoItem
              label="Status"
              value={STATUS_RECEITA_LABELS[receita.status_financeiro] || receita.status_financeiro}
            />
            <InfoItem label="Valor previsto" value={formatCurrency(receita.valor_previsto)} />
            <InfoItem label="Valor recebido" value={formatCurrency(receita.valor_recebido)} />
            <InfoItem label="Data de vencimento" value={formatDate(receita.data_vencimento)} />
            <InfoItem label="Data do recebimento" value={formatDate(receita.data_recebimento)} />
            <InfoItem
              label="Forma de recebimento"
              value={
                receita.forma_recebimento
                  ? FORMA_RECEBIMENTO_LABELS[receita.forma_recebimento] || receita.forma_recebimento
                  : null
              }
            />
            <InfoItem label="Descrição" value={receita.descricao} />
            <InfoItem label="Cadastro" value={formatDate(receita.created)} />
            {receita.transacao_importada_id && (
              <InfoItem
                label="Origem Bancária"
                value={
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Importado via Extrato (ID: {receita.transacao_importada_id.slice(0, 8)})
                  </span>
                }
              />
            )}
          </div>
          {receita.observacoes && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Observações</p>
              <p className="text-sm text-slate-600">{receita.observacoes}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Documentos anexos</p>
            <DocumentUpload entidadeTipo="receita" entidadeId={receita.id} />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          {canEdit && (
            <Button
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
          )}
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
