import { Download, Pencil, Trash2 } from 'lucide-react'
import dados from '@/lib/dados/cliente'
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
import { formatCurrency, formatDate, TIPO_IPTU_LABELS, STATUS_IPTU_LABELS } from '@/lib/format'
import { LinkDeArquivo } from '@/components/shared/ArquivoPrivado'

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  )
}

export function IptuTaxaDetailDialog({
  iptuTaxa,
  item,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  canEdit = true,
}: {
  iptuTaxa?: any
  item?: any
  open: boolean
  onOpenChange: (v: boolean) => void
  onEdit: () => void
  onDelete: () => void
  canEdit?: boolean
}) {
  const data = iptuTaxa || item
  if (!data) return null
  const imovel = data.expand?.imovel

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{data.descricao || `Obrigação ${data.id.slice(0, 8)}`}</span>
            <StatusBadge type="iptu_taxas" status={data.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <InfoItem label="Imóvel" value={imovel?.nome || imovel?.endereco || '—'} />
            <InfoItem label="Tipo" value={TIPO_IPTU_LABELS[data.tipo] || data.tipo} />
            <InfoItem label="Status" value={STATUS_IPTU_LABELS[data.status] || data.status} />
            <InfoItem label="Ano de referência" value={data.ano_referencia} />
            <InfoItem label="Valor" value={formatCurrency(data.valor)} />
            <InfoItem label="Data de vencimento" value={formatDate(data.vencimento)} />
            <InfoItem label="Data do pagamento" value={formatDate(data.data_pagamento)} />
            <InfoItem label="Forma de pagamento" value={data.forma_pagamento} />
            <InfoItem label="Descrição" value={data.descricao} />
            <InfoItem label="Cadastro" value={formatDate(data.created)} />
          </div>
          {data.observacoes && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Observações</p>
              <p className="text-sm text-slate-600">{data.observacoes}</p>
            </div>
          )}
          {data.comprovante && (
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Comprovante</p>
              <LinkDeArquivo
                tabela="iptu_taxas"
                campo="comprovante"
                caminho={data.comprovante}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
              >
                <Download className="h-4 w-4" /> Baixar comprovante
              </LinkDeArquivo>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Documentos anexos</p>
            <DocumentUpload entidadeTipo="iptu_taxas" entidadeId={data.id} />
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
