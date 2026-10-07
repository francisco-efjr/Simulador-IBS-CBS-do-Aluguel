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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field } from '@/components/shared/Field'
import {
  createUnidade,
  updateUnidade,
  type ImovelUnidade,
  type DadosUnidade,
} from '@/services/unidades'
import { STATUS_IMOVEL_LABELS } from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { unidadeSchema, validarFormulario } from '@/lib/validacao/esquemas'
import { toast } from 'sonner'
import { DinheiroInput } from '@/components/shared/DinheiroInput'
import { paraNumeroEmReais, valorParaCampo } from '@/lib/dinheiro'

const TIPOS_UNIDADE = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'sala', label: 'Sala Comercial' },
  { value: 'loja', label: 'Loja' },
  { value: 'casa', label: 'Casa' },
  { value: 'vaga', label: 'Vaga de Garagem' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'outro', label: 'Outro' },
]

const EMPTY = {
  identificador: '',
  complemento: '',
  tipo_unidade: 'apartamento',
  codigo_energia: '',
  codigo_agua: '',
  tem_condominio: false,
  valor_condominio: '',
  taxa_poco: '30,00',
  taxas_extras: '',
  status: 'vago',
  observacoes: '',
}

interface UnidadeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imovelId: string
  imovelNome?: string
  editing?: ImovelUnidade | null
  onSaved: () => void
}

export function UnidadeFormDialog({
  open,
  onOpenChange,
  imovelId,
  imovelNome,
  editing,
  onSaved,
}: UnidadeFormDialogProps) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const upd = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!open) return
    setErrors({})
    if (editing) {
      setForm({
        identificador: editing.identificador || '',
        complemento: editing.complemento || '',
        tipo_unidade: editing.tipo_unidade || 'apartamento',
        codigo_energia: editing.codigo_energia || '',
        codigo_agua: editing.codigo_agua || '',
        tem_condominio: Boolean(editing.tem_condominio),
        valor_condominio: valorParaCampo(editing.valor_condominio),
        taxa_poco: editing.taxa_poco != null ? valorParaCampo(editing.taxa_poco) : '30,00',
        taxas_extras: valorParaCampo(editing.taxas_extras),
        status: editing.status || 'vago',
        observacoes: (editing as any).observacoes || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const fe = validarFormulario(unidadeSchema, {
      ...form,
      imovel_id: imovelId,
    })

    if (Object.keys(fe).length > 0) {
      setErrors(fe)
      return
    }

    const paraNum = (val: string) => {
      if (!val) return null
      const n = paraNumeroEmReais(val)
      return Number.isFinite(n) ? n : null
    }

    const payload: DadosUnidade = {
      imovel_id: imovelId,
      identificador: form.identificador.trim(),
      complemento: form.complemento.trim() || null,
      tipo_unidade: form.tipo_unidade,
      codigo_energia: form.codigo_energia.trim() || null,
      codigo_agua: form.codigo_agua.trim() || null,
      tem_condominio: form.tem_condominio,
      valor_condominio: form.tem_condominio ? paraNum(form.valor_condominio) : null,
      taxa_poco: paraNum(form.taxa_poco),
      taxas_extras: paraNum(form.taxas_extras),
      status: (form.status as any) || 'vago',
    }

    setSubmitting(true)
    try {
      if (editing) {
        await updateUnidade(editing.id, payload)
        toast.success('Unidade atualizada com sucesso.')
      } else {
        await createUnidade(payload)
        toast.success('Unidade cadastrada com sucesso.')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length > 0) {
        setErrors(ext)
      } else {
        toast.error('Não foi possível salvar a unidade. Confira os campos e tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Editar Unidade' : 'Nova Unidade'}
            {imovelNome && (
              <span className="block text-xs font-normal text-slate-500 mt-1">
                Imóvel: {imovelNome}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field
              label="Identificador"
              error={errors.identificador}
              className="sm:col-span-2"
            >
              <Input
                value={form.identificador}
                onChange={(e) => upd('identificador', e.target.value)}
                placeholder="Ex: Apto 101, Sala 02, Térreo"
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>

            <Field label="Tipo da Unidade">
              <Select
                value={form.tipo_unidade}
                onValueChange={(v) => upd('tipo_unidade', v)}
              >
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_UNIDADE.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Complemento">
              <Input
                value={form.complemento}
                onChange={(e) => upd('complemento', e.target.value)}
                placeholder="Bloco B, Frente, Fundos..."
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>

            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => upd('status', v)}
              >
                <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_IMOVEL_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Medidores e Contas de Consumo */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Contas de Consumo e Medidores
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Código do Relógio de Energia (Enel/Light/etc)" error={errors.codigo_energia}>
                <Input
                  value={form.codigo_energia}
                  onChange={(e) => upd('codigo_energia', e.target.value)}
                  placeholder="Nº da instalação elétrica"
                  className="bg-white min-h-[44px]"
                />
              </Field>

              <Field label="Código do Hidrômetro de Água (Sabesp/Cedae/etc)" error={errors.codigo_agua}>
                <Input
                  value={form.codigo_agua}
                  onChange={(e) => upd('codigo_agua', e.target.value)}
                  placeholder="Nº do hidrômetro/ligação de água"
                  className="bg-white min-h-[44px]"
                />
              </Field>
            </div>
          </div>

          {/* Taxas e Rateios */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="tem-condominio" className="text-sm font-semibold text-slate-800">
                  Condomínio
                </Label>
                <p className="text-xs text-slate-500">
                  A unidade possui taxa ou rateio de condomínio?
                </p>
              </div>
              <Switch
                id="tem-condominio"
                checked={form.tem_condominio}
                onCheckedChange={(checked) => upd('tem_condominio', checked)}
              />
            </div>

            {form.tem_condominio && (
              <Field label="Valor do Condomínio (R$)" error={errors.valor_condominio}>
                <DinheiroInput
                  value={form.valor_condominio}
                  onValueChange={(v) => upd('valor_condominio', v)}
                  placeholder="Ex: 350,00"
                  className="bg-white min-h-[44px]"
                />
              </Field>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
              <Field label="Taxa de Poço / Água Compartilhada (R$)" error={errors.taxa_poco}>
                <DinheiroInput
                  value={form.taxa_poco}
                  onValueChange={(v) => upd('taxa_poco', v)}
                  placeholder="30,00"
                  className="bg-white min-h-[44px]"
                />
              </Field>

              <Field label="Taxas Extras (R$)" error={errors.taxas_extras}>
                <DinheiroInput
                  value={form.taxas_extras}
                  onValueChange={(v) => upd('taxas_extras', v)}
                  placeholder="0,00"
                  className="bg-white min-h-[44px]"
                />
              </Field>
            </div>
          </div>

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
              {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar Unidade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
