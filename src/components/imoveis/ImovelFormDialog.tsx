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
import { createImovel, updateImovel } from '@/services/imoveis'
import { TIPO_IMOVEL_LABELS, STATUS_IMOVEL_LABELS } from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

const EMPTY = {
  codigo: '',
  nome: '',
  tipo: 'casa',
  status: 'vago',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cep: '',
  cidade: '',
  estado: '',
  matricula: '',
  inscricao_imobiliaria: '',
  area: '',
  quartos: '',
  banheiros: '',
  vagas: '',
  valor_estimado: '',
  observacoes: '',
}
const NUM_FIELDS = ['area', 'quartos', 'banheiros', 'vagas', 'valor_estimado']

export function ImovelFormDialog({
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
  const upd = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!open) return
    setErrors({})
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
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const fe: FieldErrors = {}
    if (!form.endereco.trim()) fe.endereco = 'Endereço é obrigatório'
    if (Object.keys(fe).length) {
      setErrors(fe)
      return
    }
    const data: Record<string, any> = {}
    for (const [k, v] of Object.entries(form)) {
      if (v === '' || v == null) continue
      data[k] = NUM_FIELDS.includes(k) ? Number(v) : v
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateImovel(editing.id, data)
        toast.success('Imóvel atualizado!')
      } else {
        await createImovel(data)
        toast.success('Imóvel criado!')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length) {
        setErrors(ext)
      } else {
        toast.error('Erro ao salvar imóvel')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Imóvel' : 'Novo Imóvel'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Código" error={errors.codigo}>
              <Input
                value={form.codigo}
                onChange={(e) => upd('codigo', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Nome/Identificação" error={errors.nome} className="sm:col-span-2">
              <Input
                value={form.nome}
                onChange={(e) => upd('nome', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Tipo">
              <Select value={form.tipo} onValueChange={(v) => upd('tipo', v)}>
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_IMOVEL_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => upd('status', v)}>
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_IMOVEL_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Valor estimado (R$)" error={errors.valor_estimado}>
              <Input
                type="number"
                step="0.01"
                value={form.valor_estimado}
                onChange={(e) => upd('valor_estimado', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Field label="Endereço" error={errors.endereco} className="sm:col-span-2">
              <Input
                value={form.endereco}
                onChange={(e) => upd('endereco', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Número">
              <Input
                value={form.numero}
                onChange={(e) => upd('numero', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Complemento">
              <Input
                value={form.complemento}
                onChange={(e) => upd('complemento', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Bairro">
              <Input
                value={form.bairro}
                onChange={(e) => upd('bairro', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="CEP">
              <Input
                value={form.cep}
                onChange={(e) => upd('cep', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Cidade">
              <Input
                value={form.cidade}
                onChange={(e) => upd('cidade', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Estado">
              <Input
                value={form.estado}
                onChange={(e) => upd('estado', e.target.value)}
                maxLength={2}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <Field label="Matrícula" className="col-span-2 sm:col-span-1">
              <Input
                value={form.matricula}
                onChange={(e) => upd('matricula', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Inscrição" className="col-span-2 sm:col-span-1">
              <Input
                value={form.inscricao_imobiliaria}
                onChange={(e) => upd('inscricao_imobiliaria', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Área (m²)">
              <Input
                type="number"
                step="0.01"
                value={form.area}
                onChange={(e) => upd('area', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Quartos">
              <Input
                type="number"
                value={form.quartos}
                onChange={(e) => upd('quartos', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Banheiros">
              <Input
                type="number"
                value={form.banheiros}
                onChange={(e) => upd('banheiros', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Vagas">
              <Input
                type="number"
                value={form.vagas}
                onChange={(e) => upd('vagas', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>
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
              {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar Imóvel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
