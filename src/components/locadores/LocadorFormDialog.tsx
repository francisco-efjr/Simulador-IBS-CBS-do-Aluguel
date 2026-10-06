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
import {
  createLocador,
  updateLocador,
  type Locador,
  type DadosLocador,
} from '@/services/locadores'
import {
  TIPO_PESSOA_LABELS,
  aplicarMascaraDocumento,
  formatarTelefone,
} from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { locadorSchema, validarFormulario } from '@/lib/validacao/esquemas'
import { toast } from 'sonner'

const EMPTY = {
  tipo_pessoa: 'pf',
  nome_razao_social: '',
  cpf_cnpj: '',
  email: '',
  telefone: '',
  dados_bancarios: '',
  status: 'ativo',
}

interface LocadorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Locador | null
  onSaved: () => void
}

export function LocadorFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: LocadorFormDialogProps) {
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
        tipo_pessoa: editing.tipo_pessoa || 'pf',
        nome_razao_social: editing.nome_razao_social || '',
        cpf_cnpj: editing.cpf_cnpj || '',
        email: editing.email || '',
        telefone: editing.telefone || '',
        dados_bancarios: editing.dados_bancarios || '',
        status: editing.status || 'ativo',
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, editing])

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = aplicarMascaraDocumento(
      e.target.value,
      isPF ? 'pf' : 'pj',
    )
    upd('cpf_cnpj', formatado)
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // Permite digitação natural e aplica máscara ao preencher
    const limpo = raw.replace(/\D/g, '')
    if (limpo.length <= 11) {
      upd('telefone', formatarTelefone(limpo))
    } else {
      upd('telefone', raw)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const fe = validarFormulario(locadorSchema, form)
    if (Object.keys(fe).length > 0) {
      setErrors(fe)
      return
    }

    const payload: DadosLocador = {
      tipo_pessoa: form.tipo_pessoa as 'pf' | 'pj',
      nome_razao_social: form.nome_razao_social.trim(),
      cpf_cnpj: form.cpf_cnpj.trim() || null,
      email: form.email.trim() || null,
      telefone: form.telefone.trim() || null,
      dados_bancarios: form.dados_bancarios.trim() || null,
      status: (form.status as 'ativo' | 'inativo') || 'ativo',
    }

    setSubmitting(true)
    try {
      if (editing) {
        await updateLocador(editing.id, payload)
        toast.success('Locador atualizado com sucesso.')
      } else {
        await createLocador(payload)
        toast.success('Locador cadastrado com sucesso.')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length > 0) {
        setErrors(ext)
      } else {
        toast.error('Não foi possível salvar o locador. Confira os campos e tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Locador' : 'Novo Locador'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tipo de pessoa">
              <Select
                value={form.tipo_pessoa}
                onValueChange={(v) => {
                  upd('tipo_pessoa', v)
                  // Ao trocar de tipo, reformata o documento
                  upd('cpf_cnpj', aplicarMascaraDocumento(form.cpf_cnpj, v as 'pf' | 'pj'))
                }}
              >
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_PESSOA_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
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
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field
            label={isPF ? 'Nome completo' : 'Razão social'}
            error={errors.nome_razao_social}
          >
            <Input
              value={form.nome_razao_social}
              onChange={(e) => upd('nome_razao_social', e.target.value)}
              placeholder={isPF ? 'Ex: João Carlos Aguiar' : 'Ex: Aguiar Empreendimentos LTDA'}
              className="bg-slate-50/50 min-h-[44px]"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label={isPF ? 'CPF' : 'CNPJ'}
              error={errors.cpf_cnpj}
            >
              <Input
                value={form.cpf_cnpj}
                onChange={handleDocumentoChange}
                placeholder={isPF ? '000.000.000-00' : '00.000.000/0001-00'}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>

            <Field label="Telefone" error={errors.telefone}>
              <Input
                value={form.telefone}
                onChange={handleTelefoneChange}
                placeholder="(00) 00000-0000"
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>

          <Field label="E-mail" error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => upd('email', e.target.value)}
              placeholder="locador@exemplo.com.br"
              className="bg-slate-50/50 min-h-[44px]"
            />
          </Field>

          <Field
            label="Dados bancários e PIX para repasse"
            error={errors.dados_bancarios}
          >
            <Textarea
              value={form.dados_bancarios}
              onChange={(e) => upd('dados_bancarios', e.target.value)}
              placeholder="Ex: Banco Itaú (341), Agência 1234, Conta Corrente 56789-0, Chave PIX: locador@email.com"
              rows={3}
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
              {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar Locador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
