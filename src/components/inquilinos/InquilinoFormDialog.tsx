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
import { createInquilino, updateInquilino } from '@/services/inquilinos'
import { TIPO_PESSOA_LABELS } from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { toast } from 'sonner'

const EMPTY = {
  tipo_pessoa: 'pf',
  nome: '',
  cpf: '',
  rg: '',
  data_nascimento: '',
  nome_fantasia: '',
  cnpj: '',
  responsavel: '',
  telefone: '',
  email: '',
  endereco: '',
  observacoes: '',
  status: 'ativo',
}

export function InquilinoFormDialog({
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
  const isPF = form.tipo_pessoa === 'pf'

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
    if (!form.nome.trim()) fe.nome = isPF ? 'Nome é obrigatório' : 'Razão social é obrigatória'
    if (isPF && !form.cpf.trim()) fe.cpf = 'CPF é obrigatório'
    if (!isPF && !form.cnpj.trim()) fe.cnpj = 'CNPJ é obrigatório'
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
        await updateInquilino(editing.id, data)
        toast.success('Inquilino atualizado com sucesso.')
      } else {
        await createInquilino(data)
        toast.success('Inquilino cadastrado com sucesso.')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length) {
        setErrors(ext)
      } else {
        toast.error('Não foi possível salvar o inquilino. Confira os campos e tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Inquilino' : 'Novo Inquilino'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Tipo de pessoa">
            <Select value={form.tipo_pessoa} onValueChange={(v) => upd('tipo_pessoa', v)}>
              <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_PESSOA_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {isPF ? (
            <>
              <Field label="Nome" error={errors.nome}>
                <Input
                  value={form.nome}
                  onChange={(e) => upd('nome', e.target.value)}
                  className="bg-slate-50/50 min-h-[44px]"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="CPF" error={errors.cpf}>
                  <Input
                    value={form.cpf}
                    onChange={(e) => upd('cpf', e.target.value)}
                    className="bg-slate-50/50 min-h-[44px]"
                  />
                </Field>
                <Field label="RG">
                  <Input
                    value={form.rg}
                    onChange={(e) => upd('rg', e.target.value)}
                    className="bg-slate-50/50 min-h-[44px]"
                  />
                </Field>
              </div>
              <Field label="Data de nascimento">
                <Input
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => upd('data_nascimento', e.target.value)}
                  className="bg-slate-50/50 min-h-[44px]"
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Razão social" error={errors.nome}>
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
                <Field label="CNPJ" error={errors.cnpj}>
                  <Input
                    value={form.cnpj}
                    onChange={(e) => upd('cnpj', e.target.value)}
                    className="bg-slate-50/50 min-h-[44px]"
                  />
                </Field>
              </div>
              <Field label="Responsável">
                <Input
                  value={form.responsavel}
                  onChange={(e) => upd('responsavel', e.target.value)}
                  className="bg-slate-50/50 min-h-[44px]"
                />
              </Field>
            </>
          )}
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
