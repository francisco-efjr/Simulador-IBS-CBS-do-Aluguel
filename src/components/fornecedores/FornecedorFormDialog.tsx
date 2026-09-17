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
import { createFornecedor, updateFornecedor } from '@/services/fornecedores'
import { TIPO_FORNECEDOR_LABELS } from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { toast } from 'sonner'

const EMPTY = {
  nome: '',
  nome_fantasia: '',
  cnpj_cpf: '',
  tipo_fornecedor: 'outros',
  contato: '',
  telefone: '',
  email: '',
  endereco: '',
  servicos_prestados: '',
  observacoes: '',
  status: 'ativo',
}

export function FornecedorFormDialog({
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
    if (!form.nome.trim()) fe.nome = 'Nome/razão social é obrigatório'
    if (Object.keys(fe).length) {
      setErrors(fe)
      return
    }
    const data: Record<string, any> = { status: form.status }
    for (const [k, v] of Object.entries(form)) {
      if (k === 'status') continue
      if (v === '' || v == null) continue
      data[k] = v
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateFornecedor(editing.id, data)
        toast.success('Fornecedor atualizado!')
      } else {
        await createFornecedor(data)
        toast.success('Fornecedor criado!')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length) {
        setErrors(ext)
      } else {
        toast.error('Erro ao salvar fornecedor')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome/Razão social" error={errors.nome}>
            <Input
              value={form.nome}
              onChange={(e) => upd('nome', e.target.value)}
              className="bg-slate-50/50 min-h-[44px]"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome fantasia">
              <Input
                value={form.nome_fantasia}
                onChange={(e) => upd('nome_fantasia', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="CPF/CNPJ" error={errors.cnpj_cpf}>
              <Input
                value={form.cnpj_cpf}
                onChange={(e) => upd('cnpj_cpf', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tipo de fornecedor">
              <Select value={form.tipo_fornecedor} onValueChange={(v) => upd('tipo_fornecedor', v)}>
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_FORNECEDOR_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Contato">
              <Input
                value={form.contato}
                onChange={(e) => upd('contato', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Telefone">
              <Input
                value={form.telefone}
                onChange={(e) => upd('telefone', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => upd('email', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>
          <Field label="Endereço">
            <Input
              value={form.endereco}
              onChange={(e) => upd('endereco', e.target.value)}
              className="bg-slate-50/50 min-h-[44px]"
            />
          </Field>
          <Field label="Serviços prestados">
            <Input
              value={form.servicos_prestados}
              onChange={(e) => upd('servicos_prestados', e.target.value)}
              className="bg-slate-50/50 min-h-[44px]"
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
              {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
