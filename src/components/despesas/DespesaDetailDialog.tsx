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
  STATUS_DESPESA_LABELS,
  FORMA_PAGAMENTO_LABELS,
} from '@/lib/format'

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  )
}

export function DespesaDetailDialog({
  despesa,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  canEdit = true,
}: {
  despesa: any
  open: boolean
  onOpenChange: (v: boolean) => void
  onEdit: () => void
  onDelete: () => void
  canEdit?: boolean
}) {
  if (!despesa) return null
  const imovel = despesa.expand?.imovel
  const fornecedor = despesa.expand?.fornecedor
  const categoria = despesa.expand?.categoria

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{despesa.descricao || `Despesa ${despesa.id.slice(0, 8)}`}</span>
            <StatusBadge type="despesa" status={despesa.status_financeiro} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <InfoItem label="Imóvel" value={imovel?.nome || imovel?.endereco || '—'} />
            <InfoItem label="Fornecedor" value={fornecedor?.nome || '—'} />
            <InfoItem label="Categoria" value={categoria?.nome || '—'} />
            <InfoItem label="Competência" value={despesa.competencia} />
            <InfoItem
              label="Status"
              value={STATUS_DESPESA_LABELS[despesa.status_financeiro] || despesa.status_financeiro}
            />
            <InfoItem label="Valor" value={formatCurrency(despesa.valor)} />
            <InfoItem label="Valor previsto" value={formatCurrency(despesa.valor_previsto)} />
            <InfoItem label="Valor pago" value={formatCurrency(despesa.valor_pago)} />
            <InfoItem label="Data" value={formatDate(despesa.data)} />
            <InfoItem label="Data de vencimento" value={formatDate(despesa.data_vencimento)} />
            <InfoItem label="Data do pagamento" value={formatDate(despesa.data_pagamento)} />
            <InfoItem
              label="Forma de pagamento"
              value={
                despesa.forma_pagamento
                  ? FORMA_PAGAMENTO_LABELS[despesa.forma_pagamento] || despesa.forma_pagamento
                  : null
              }
            />
            <InfoItem label="Descrição" value={despesa.descricao} />
            <InfoItem label="Cadastro" value={formatDate(despesa.created)} />
            {despesa.transacao_importada_id && (
              <InfoItem
                label="Origem Bancária"
                value={
                  <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    Importado via Extrato (ID: {despesa.transacao_importada_id.slice(0, 8)})
                  </span>
                }
              />
            )}
          </div>
          {despesa.observacoes && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Observações</p>
              <p className="text-sm text-slate-600">{despesa.observacoes}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Documentos anexos</p>
            <DocumentUpload entidadeTipo="despesa" entidadeId={despesa.id} />
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
