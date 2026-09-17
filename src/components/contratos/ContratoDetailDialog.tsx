import { Download, Pencil } from 'lucide-react'
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
import { formatCurrency, formatDate, TIPO_GARANTIA_LABELS } from '@/lib/format'
import { LinkDeArquivo } from '@/components/shared/ArquivoPrivado'

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  )
}

export function ContratoDetailDialog({
  contrato,
  open,
  onOpenChange,
  onEdit,
  canEdit = true,
}: {
  contrato: any
  open: boolean
  onOpenChange: (v: boolean) => void
  onEdit: () => void
  canEdit?: boolean
}) {
  if (!contrato) return null
  const imovel = contrato.expand?.imovel
  const inquilino = contrato.expand?.inquilino

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{contrato.numero || `Contrato ${contrato.id.slice(0, 8)}`}</span>
            <StatusBadge type="contrato" status={contrato.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <InfoItem label="Número" value={contrato.numero} />
            <InfoItem label="Imóvel" value={imovel?.nome || imovel?.endereco || '—'} />
            <InfoItem label="Inquilino" value={inquilino?.nome || '—'} />
            <InfoItem label="Data de início" value={formatDate(contrato.data_inicio)} />
            <InfoItem label="Data de término" value={formatDate(contrato.data_fim)} />
            <InfoItem
              label="Dia de vencimento"
              value={contrato.dia_vencimento ? `Dia ${contrato.dia_vencimento}` : null}
            />
            <InfoItem label="Valor do aluguel" value={formatCurrency(contrato.valor_aluguel)} />
            <InfoItem label="Índice de reajuste" value={contrato.indice_reajuste} />
            <InfoItem label="Periodicidade" value={contrato.periodicidade_reajuste} />
            <InfoItem label="Próximo reajuste" value={formatDate(contrato.proxima_data_reajuste)} />
            <InfoItem
              label="Tipo de garantia"
              value={TIPO_GARANTIA_LABELS[contrato.tipo_garantia] || '—'}
            />
            <InfoItem label="Valor da garantia" value={formatCurrency(contrato.valor_garantia)} />
            <InfoItem label="Cadastro" value={formatDate(contrato.created)} />
          </div>
          {contrato.observacoes && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Observações</p>
              <p className="text-sm text-slate-600">{contrato.observacoes}</p>
            </div>
          )}
          {contrato.documento && (
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Documento do contrato</p>
              <LinkDeArquivo
                tabela="contratos"
                campo="documento"
                caminho={contrato.documento}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
              >
                <Download className="h-4 w-4" /> Baixar documento
              </LinkDeArquivo>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Documentos anexos</p>
            <DocumentUpload entidadeTipo="contrato" entidadeId={contrato.id} />
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
