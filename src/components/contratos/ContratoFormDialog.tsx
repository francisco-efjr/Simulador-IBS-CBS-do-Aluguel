import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field } from '@/components/shared/Field'
import { createContrato, updateContrato } from '@/services/contratos'
import { getImoveis } from '@/services/imoveis'
import { getInquilinos } from '@/services/inquilinos'
import { TIPO_GARANTIA_LABELS, STATUS_CONTRATO_LABELS } from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { toast } from 'sonner'

const EMPTY = {
  numero: '',
  imovel: '',
  inquilino: '',
  data_inicio: '',
  data_fim: '',
  valor_aluguel: '',
  dia_vencimento: '',
  indice_reajuste: '',
  periodicidade_reajuste: '',
  proxima_data_reajuste: '',
  tipo_garantia: 'sem garantia',
  valor_garantia: '',
  status: 'ativo',
  observacoes: '',
}
const NUM_FIELDS = ['valor_aluguel', 'dia_vencimento', 'valor_garantia']

export function ContratoFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: any | null
  onSaved: () => void
}) {
  const [form, setForm] = useState<Record<string, string>>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [imoveis, setImoveis] = useState<any[]>([])
  const [inquilinos, setInquilinos] = useState<any[]>([])
  const upd = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!open) return
    setErrors({})
    setFile(null)
    if (editing) {
      setForm({
        ...EMPTY,
        ...Object.fromEntries(
          Object.entries(editing).map(([k, v]) => [k, v == null ? '' : String(v)]),
        ),
      })
    } else {
      setForm(EMPTY)
    }
    Promise.all([getImoveis(), getInquilinos()]).then(([ims, iqs]) => {
      setImoveis(ims)
      setInquilinos(iqs)
    })
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const fe: FieldErrors = {}
    if (!form.imovel) fe.imovel = 'Imóvel é obrigatório'
    if (!form.inquilino) fe.inquilino = 'Inquilino é obrigatório'
    if (!form.data_inicio) fe.data_inicio = 'Data de início é obrigatória'
    if (!form.data_fim) fe.data_fim = 'Data de término é obrigatória'
    if (form.data_inicio && form.data_fim && form.data_inicio > form.data_fim) {
      fe.data_fim = 'Data de término deve ser posterior à data de início'
    }
    if (!form.valor_aluguel) fe.valor_aluguel = 'Valor do aluguel é obrigatório'
    if (Object.keys(fe).length) {
      setErrors(fe)
      return
    }

    let payload: Record<string, any> | FormData
    if (file) {
      const fd = new FormData()
      for (const [k, v] of Object.entries(form)) {
        if (k === 'status') continue
        if (v === '' || v == null) continue
        fd.append(k, NUM_FIELDS.includes(k) ? String(Number(v)) : v)
      }
      fd.append('status', form.status)
      fd.append('documento', file)
      payload = fd
    } else {
      payload = { status: form.status }
      for (const [k, v] of Object.entries(form)) {
        if (k === 'status') continue
        if (v === '' || v == null) continue
        payload[k] = NUM_FIELDS.includes(k) ? Number(v) : v
      }
    }

    setSubmitting(true)
    try {
      if (editing) {
        await updateContrato(editing.id, payload)
        toast.success('Contrato atualizado!')
      } else {
        await createContrato(payload)
        toast.success('Contrato criado!')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length) {
        setErrors(ext)
      } else {
        toast.error('Erro ao salvar contrato')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Número do contrato" error={errors.numero}>
              <Input
                value={form.numero}
                onChange={(e) => upd('numero', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => upd('status', v)}>
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONTRATO_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Dia de vencimento" error={errors.dia_vencimento}>
              <Input
                type="number"
                min={1}
                max={31}
                value={form.dia_vencimento}
                onChange={(e) => upd('dia_vencimento', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Imóvel" error={errors.imovel}>
              <Select value={form.imovel} onValueChange={(v) => upd('imovel', v)}>
                <SelectTrigger aria-label="Selecione..." className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {imoveis.map((im) => (
                    <SelectItem key={im.id} value={im.id}>
                      {im.nome || im.endereco || '—'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Inquilino" error={errors.inquilino}>
              <Select value={form.inquilino} onValueChange={(v) => upd('inquilino', v)}>
                <SelectTrigger aria-label="Selecione..." className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {inquilinos.map((iq) => (
                    <SelectItem key={iq.id} value={iq.id}>
                      {iq.nome || '—'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Data de início" error={errors.data_inicio}>
              <Input
                type="date"
                value={form.data_inicio}
                onChange={(e) => upd('data_inicio', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Data de término" error={errors.data_fim}>
              <Input
                type="date"
                value={form.data_fim}
                onChange={(e) => upd('data_fim', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Valor do aluguel (R$)" error={errors.valor_aluguel}>
              <Input
                type="number"
                step="0.01"
                value={form.valor_aluguel}
                onChange={(e) => upd('valor_aluguel', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Valor da garantia (R$)">
              <Input
                type="number"
                step="0.01"
                value={form.valor_garantia}
                onChange={(e) => upd('valor_garantia', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Índice de reajuste">
              <Input
                value={form.indice_reajuste}
                onChange={(e) => upd('indice_reajuste', e.target.value)}
                placeholder="IPCA, IGP-M..."
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Periodicidade do reajuste">
              <Input
                value={form.periodicidade_reajuste}
                onChange={(e) => upd('periodicidade_reajuste', e.target.value)}
                placeholder="Anual, Semestral..."
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Próxima data de reajuste">
              <Input
                type="date"
                value={form.proxima_data_reajuste}
                onChange={(e) => upd('proxima_data_reajuste', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>
          <Field label="Tipo de garantia">
            <Select value={form.tipo_garantia} onValueChange={(v) => upd('tipo_garantia', v)}>
              <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_GARANTIA_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Documento do contrato">
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs min-h-[44px] pt-2"
              accept=".pdf,.doc,.docx,image/*"
            />
          </Field>
          <Field label="Observações">
            <Textarea
              value={form.observacoes}
              onChange={(e) => upd('observacoes', e.target.value)}
              rows={2}
              className="bg-slate-50/50"
            />
          </Field>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto min-h-[44px] bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar Contrato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
