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
import { createDespesa, updateDespesa } from '@/services/despesas'
import { getImoveis } from '@/services/imoveis'
import { getFornecedores } from '@/services/fornecedores'
import { getCategoriasDespesa } from '@/services/categorias-financeiras'
import { STATUS_DESPESA_LABELS, FORMA_PAGAMENTO_LABELS } from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

const EMPTY = {
  imovel: '',
  fornecedor: '',
  categoria: '',
  descricao: '',
  valor: '',
  data: '',
  competencia: '',
  data_vencimento: '',
  valor_previsto: '',
  valor_pago: '',
  data_pagamento: '',
  status_financeiro: 'previsto',
  forma_pagamento: '',
  observacoes: '',
}
const NUM_FIELDS = ['valor', 'valor_previsto', 'valor_pago']

export function DespesaFormDialog({
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
  const [imoveis, setImoveis] = useState<any[]>([])
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
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
    Promise.all([getImoveis(), getFornecedores(), getCategoriasDespesa()]).then(
      ([ims, fors, cats]) => {
        setImoveis(ims)
        setFornecedores(fors)
        setCategorias(cats)
      },
    )
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const fe: FieldErrors = {}
    if (!form.imovel) fe.imovel = 'Imóvel é obrigatório'
    if (Object.keys(fe).length) {
      setErrors(fe)
      return
    }
    const data: Record<string, any> = { status: 'ativo' }
    for (const [k, v] of Object.entries(form)) {
      if (v === '' || v == null) continue
      data[k] = NUM_FIELDS.includes(k) ? Number(v) : v
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateDespesa(editing.id, data)
        toast.success('Despesa atualizada!')
      } else {
        await createDespesa(data)
        toast.success('Despesa criada!')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length) setErrors(ext)
      else toast.error('Erro ao salvar despesa')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Imóvel" error={errors.imovel}>
              <Select value={form.imovel} onValueChange={(v) => upd('imovel', v)}>
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
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
            <Field label="Fornecedor (opcional)">
              <Select value={form.fornecedor} onValueChange={(v) => upd('fornecedor', v)}>
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome || '—'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Categoria" error={errors.categoria}>
            <Select value={form.categoria} onValueChange={(v) => upd('categoria', v)}>
              <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Descrição" error={errors.descricao}>
            <Input
              value={form.descricao}
              onChange={(e) => upd('descricao', e.target.value)}
              className="bg-slate-50/50 min-h-[44px]"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Valor (R$)" error={errors.valor}>
              <Input
                type="number"
                step="0.01"
                value={form.valor}
                onChange={(e) => upd('valor', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Data">
              <Input
                type="date"
                value={form.data}
                onChange={(e) => upd('data', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Competência">
              <Input
                value={form.competencia}
                onChange={(e) => upd('competencia', e.target.value)}
                placeholder="2025-01"
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Data de vencimento">
              <Input
                type="date"
                value={form.data_vencimento}
                onChange={(e) => upd('data_vencimento', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Valor previsto (R$)">
              <Input
                type="number"
                step="0.01"
                value={form.valor_previsto}
                onChange={(e) => upd('valor_previsto', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status_financeiro}
                onValueChange={(v) => upd('status_financeiro', v)}
              >
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_DESPESA_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Valor pago (R$)">
              <Input
                type="number"
                step="0.01"
                value={form.valor_pago}
                onChange={(e) => upd('valor_pago', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Data do pagamento">
              <Input
                type="date"
                value={form.data_pagamento}
                onChange={(e) => upd('data_pagamento', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Forma de pagamento">
              <Select value={form.forma_pagamento} onValueChange={(v) => upd('forma_pagamento', v)}>
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMA_PAGAMENTO_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <p className="text-xs text-slate-400">
            O status financeiro é recalculado automaticamente conforme valores e datas.
          </p>
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
              {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar Despesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
