import { useState } from 'react'
import { X, Upload, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentUpload } from '@/components/shared/DocumentUpload'
import { updateImovel } from '@/services/imoveis'
import { formatCurrency, formatDate, TIPO_IMOVEL_LABELS, STATUS_IMOVEL_LABELS } from '@/lib/format'

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  )
}

export function ImovelDetailDialog({
  imovel,
  open,
  onOpenChange,
  onEdit,
  onRefresh,
  canEdit = true,
}: {
  imovel: any
  open: boolean
  onOpenChange: (v: boolean) => void
  onEdit: () => void
  onRefresh: () => void
  canEdit?: boolean
}) {
  const [uploading, setUploading] = useState(false)
  if (!imovel) return null
  const fotos: string[] = Array.isArray(imovel.fotos)
    ? imovel.fotos
    : imovel.fotos
      ? [imovel.fotos]
      : []

  const handleUpload = async (files: FileList) => {
    setUploading(true)
    try {
      const fd = new FormData()
      for (const f of fotos) fd.append('fotos', f)
      for (const f of Array.from(files)) fd.append('fotos', f)
      await updateImovel(imovel.id, fd)
      onRefresh()
      toast.success('Fotos enviadas!')
    } catch {
      toast.error('Erro ao enviar fotos')
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = async (filename: string) => {
    try {
      const fd = new FormData()
      for (const f of fotos.filter((x) => x !== filename)) fd.append('fotos', f)
      await updateImovel(imovel.id, fd)
      onRefresh()
      toast.success('Foto removida')
    } catch {
      toast.error('Erro ao remover foto')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{imovel.nome || imovel.endereco}</span>
            <StatusBadge type="imovel" status={imovel.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Input
              type="file"
              multiple
              accept="image/*"
              disabled={uploading}
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
              className="text-xs min-h-[44px] pt-2"
            />
            <Button
              size="sm"
              disabled={uploading}
              className="bg-indigo-600 hover:bg-indigo-700 shrink-0 min-h-[44px] min-w-[44px]"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {fotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fotos.map((f) => (
                <div key={f} className="relative group">
                  <img
                    src={pb.files.getURL(imovel, f)}
                    alt=""
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemovePhoto(f)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <InfoItem label="Código" value={imovel.codigo} />
            <InfoItem label="Tipo" value={TIPO_IMOVEL_LABELS[imovel.tipo]} />
            <InfoItem label="Status" value={STATUS_IMOVEL_LABELS[imovel.status]} />
            <InfoItem label="Endereço" value={`${imovel.endereco || ''} ${imovel.numero || ''}`} />
            <InfoItem label="Complemento" value={imovel.complemento} />
            <InfoItem label="Bairro" value={imovel.bairro} />
            <InfoItem label="Cidade/UF" value={`${imovel.cidade || ''} / ${imovel.estado || ''}`} />
            <InfoItem label="CEP" value={imovel.cep} />
            <InfoItem label="Área" value={imovel.area ? `${imovel.area} m²` : null} />
            <InfoItem label="Quartos" value={imovel.quartos} />
            <InfoItem label="Banheiros" value={imovel.banheiros} />
            <InfoItem label="Vagas" value={imovel.vagas} />
            <InfoItem label="Valor estimado" value={formatCurrency(imovel.valor_estimado)} />
            <InfoItem label="Matrícula" value={imovel.matricula} />
            <InfoItem label="Inscrição imob." value={imovel.inscricao_imobiliaria} />
            <InfoItem label="Cadastro" value={formatDate(imovel.created)} />
          </div>
          {imovel.observacoes && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Observações</p>
              <p className="text-sm text-slate-600">{imovel.observacoes}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Documentos</p>
            <DocumentUpload entidadeTipo="imovel" entidadeId={imovel.id} />
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
