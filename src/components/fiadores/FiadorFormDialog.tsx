import { useState, useEffect } from 'react'
import { HeartHandshake } from 'lucide-react'
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
  createFiador,
  updateFiador,
  type Fiador,
  type DadosFiador,
} from '@/services/fiadores'
import { aplicarMascaraDocumento, formatarTelefone } from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { fiadorSchema, validarFormulario } from '@/lib/validacao/esquemas'
import { toast } from 'sonner'

const ESTADOS_CIVIS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'separado', label: 'Separado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
]

const EMPTY = {
  nome: '',
  cpf: '',
  rg: '',
  estado_civil: 'solteiro',
  conjuge_nome: '',
  conjuge_cpf: '',
  email: '',
  telefone: '',
  endereco_completo: '',
}

interface FiadorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: Fiador | null
  onSaved?: (fiador?: Fiador) => void
}

export function FiadorFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: FiadorFormDialogProps) {
  const [form, setForm] = useState<Record<string, string>>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const upd = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const ec = (form.estado_civil || '').toLowerCase().trim()
  const isCasadoOuUniao =
    ec === 'casado' ||
    ec === 'casada' ||
    ec.startsWith('casad') ||
    ec.includes('união') ||
    ec.includes('uniao')

  useEffect(() => {
    if (!open) return
    setErrors({})
    if (editing) {
      setForm({
        nome: editing.nome || '',
        cpf: editing.cpf || '',
        rg: editing.rg || '',
        estado_civil: editing.estado_civil || 'solteiro',
        conjuge_nome: editing.conjuge_nome || '',
        conjuge_cpf: editing.conjuge_cpf || '',
        email: editing.email || '',
        telefone: editing.telefone || '',
        endereco_completo: editing.endereco_completo || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, editing])

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    upd('cpf', aplicarMascaraDocumento(e.target.value, 'pf'))
  }

  const handleConjugeCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    upd('conjuge_cpf', aplicarMascaraDocumento(e.target.value, 'pf'))
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
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

    const fe = validarFormulario(fiadorSchema, form)
    if (Object.keys(fe).length > 0) {
      setErrors(fe)
      return
    }

    const payload: DadosFiador = {
      nome: form.nome.trim(),
      cpf: form.cpf.trim() || null,
      rg: form.rg.trim() || null,
      estado_civil: form.estado_civil.trim() || null,
      conjuge_nome: isCasadoOuUniao ? form.conjuge_nome.trim() || null : null,
      conjuge_cpf: isCasadoOuUniao ? form.conjuge_cpf.trim() || null : null,
      email: form.email.trim() || null,
      telefone: form.telefone.trim() || null,
      endereco_completo: form.endereco_completo.trim() || null,
    }

    setSubmitting(true)
    try {
      let salvo: Fiador
      if (editing) {
        salvo = await updateFiador(editing.id, payload)
        toast.success('Fiador atualizado com sucesso.')
      } else {
        salvo = await createFiador(payload)
        toast.success('Fiador cadastrado com sucesso.')
      }
      onOpenChange(false)
      onSaved?.(salvo)
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length > 0) {
        setErrors(ext)
      } else {
        toast.error('Não foi possível salvar o fiador. Confira os campos e tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Fiador' : 'Novo Fiador'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Nome completo do fiador" error={errors.nome}>
            <Input
              value={form.nome}
              onChange={(e) => upd('nome', e.target.value)}
              placeholder="Ex: Carlos Eduardo de Aguiar"
              className="bg-slate-50/50 min-h-[44px]"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="CPF" error={errors.cpf}>
              <Input
                value={form.cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>

            <Field label="RG" error={errors.rg}>
              <Input
                value={form.rg}
                onChange={(e) => upd('rg', e.target.value)}
                placeholder="SSP / Órgão emissor"
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>

            <Field label="Estado civil" error={errors.estado_civil}>
              <Select
                value={form.estado_civil}
                onValueChange={(v) => upd('estado_civil', v)}
              >
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_CIVIS.map((ecItem) => (
                    <SelectItem key={ecItem.value} value={ecItem.value}>
                      {ecItem.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Seção Dinâmica de Outorga Conjugal */}
          {isCasadoOuUniao && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 sm:p-4 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-medium text-sm">
                <HeartHandshake className="h-4 w-4 text-indigo-600" />
                <span>Outorga Conjugal (Cônjuge / Companheiro)</span>
              </div>
              <p className="text-xs text-indigo-700/80">
                Pela legislação civil brasileira, a fiança prestada por pessoa casada ou em união estável exige a anuência do cônjuge.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Field
                  label="Nome do cônjuge"
                  error={errors.conjuge_nome}
                >
                  <Input
                    value={form.conjuge_nome}
                    onChange={(e) => upd('conjuge_nome', e.target.value)}
                    placeholder="Nome completo do cônjuge"
                    className="bg-white min-h-[44px]"
                  />
                </Field>

                <Field
                  label="CPF do cônjuge"
                  error={errors.conjuge_cpf}
                >
                  <Input
                    value={form.conjuge_cpf}
                    onChange={handleConjugeCpfChange}
                    placeholder="000.000.000-00"
                    className="bg-white min-h-[44px]"
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Telefone" error={errors.telefone}>
              <Input
                value={form.telefone}
                onChange={handleTelefoneChange}
                placeholder="(00) 00000-0000"
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>

            <Field label="E-mail" error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => upd('email', e.target.value)}
                placeholder="fiador@exemplo.com.br"
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
          </div>

          <Field label="Endereço completo" error={errors.endereco_completo}>
            <Textarea
              value={form.endereco_completo}
              onChange={(e) => upd('endereco_completo', e.target.value)}
              placeholder="Rua, número, complemento, bairro, cidade, estado e CEP"
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
              {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar Fiador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
