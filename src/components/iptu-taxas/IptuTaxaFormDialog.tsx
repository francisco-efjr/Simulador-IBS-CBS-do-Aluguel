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
import { createIptuTaxa, updateIptuTaxa } from '@/services/iptu-taxas'
import { getImoveis } from '@/services/imoveis'
import { TIPO_IPTU_LABELS, STATUS_IPTU_LABELS } from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { toast } from 'sonner'

const EMPTY = {
  imovel: '',
  tipo: 'iptu',
  descricao: '',
  ano_referencia: '',
  valor: '',
  vencimento: '',
  data_pagamento: '',
  status: 'pendente',
  forma_pagamento: '',
  observacoes: '',
}
const NUM_FIELDS = ['ano_referencia', 'valor']

export function IptuTaxaFormDialog({
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
    getImoveis().then((ims) => setImoveis(ims))
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const fe: FieldErrors = {}
    if (!form.imovel) fe.imovel = 'Imóvel é obrigatório'
    if (!form.descricao) fe.descricao = 'Descrição é obrigatória'
    if (!form.vencimento) fe.vencimento = 'Data de vencimento é obrigatória'
    if (!form.valor) fe.valor = 'Valor é obrigatório'
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
      fd.append('comprovante', file)
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
        await updateIptuTaxa(editing.id, payload)
        toast.success('Obrigação atualizada!')
      } else {
        await createIptuTaxa(payload)
        toast.success('Obrigação criada!')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length) {
        setErrors(ext)
      } else {
        toast.error('Erro ao salvar obrigação')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Obrigação' : 'Nova Obrigação'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Field label="Tipo da obrigação">
              <Select value={form.tipo} onValueChange={(v) => upd('tipo', v)}>
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_IPTU_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Descrição" error={errors.descricao}>
            <Input
              value={form.descricao}
              onChange={(e) => upd('descricao', e.target.value)}
              className="bg-slate-50/50 min-h-[44px]"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Ano de referência">
              <Input
                type="number"
                min={2000}
                max={2100}
                value={form.ano_referencia}
                onChange={(e) => upd('ano_referencia', e.target.value)}
                placeholder="2025"
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Valor (R$)" error={errors.valor}>
              <Input
                type="number"
                step="0.01"
                value={form.valor}
                onChange={(e) => upd('valor', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => upd('status', v)}>
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_IPTU_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Data de vencimento" error={errors.vencimento}>
              <Input
                type="date"
                value={form.vencimento}
                onChange={(e) => upd('vencimento', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Data de pagamento">
              <Input
                type="date"
                value={form.data_pagamento}
                onChange={(e) => upd('data_pagamento', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>
          <Field label="Forma de pagamento">
            <Input
              value={form.forma_pagamento}
              onChange={(e) => upd('forma_pagamento', e.target.value)}
              placeholder="Boleto, PIX, Transferência..."
              className="bg-slate-50/50 min-h-[44px]"
            />
          </Field>
          <Field label="Comprovante">
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
              {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar Obrigação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
