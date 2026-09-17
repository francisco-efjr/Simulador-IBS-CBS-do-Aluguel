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
import { createReceita, updateReceita } from '@/services/receitas'
import { getImoveis } from '@/services/imoveis'
import { getInquilinos } from '@/services/inquilinos'
import { getContratos } from '@/services/contratos'
import { getCategoriasReceita } from '@/services/categorias-financeiras'
import { STATUS_RECEITA_LABELS, FORMA_RECEBIMENTO_LABELS } from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { toast } from 'sonner'

const EMPTY = {
  imovel: '',
  contrato: '',
  inquilino: '',
  categoria: '',
  competencia: '',
  data_vencimento: '',
  valor_previsto: '',
  valor_recebido: '',
  data_recebimento: '',
  status_financeiro: 'previsto',
  forma_recebimento: '',
  descricao: '',
  observacoes: '',
}
const NUM_FIELDS = ['valor_previsto', 'valor_recebido']

export function ReceitaFormDialog({
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
  const [inquilinos, setInquilinos] = useState<any[]>([])
  const [contratos, setContratos] = useState<any[]>([])
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
    Promise.all([getImoveis(), getInquilinos(), getContratos(), getCategoriasReceita()]).then(
      ([ims, iqs, cts, cats]) => {
        setImoveis(ims)
        setInquilinos(iqs)
        setContratos(cts)
        setCategorias(cats)
      },
    )
  }, [open, editing])

  const filteredContratos = form.imovel
    ? contratos.filter((c) => c.imovel === form.imovel)
    : contratos

  const handleContratoChange = (contratoId: string) => {
    upd('contrato', contratoId)
    const contrato = contratos.find((c) => c.id === contratoId)
    if (contrato) {
      if (contrato.inquilino) upd('inquilino', contrato.inquilino)
      if (!form.imovel && contrato.imovel) upd('imovel', contrato.imovel)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const fe: FieldErrors = {}
    if (!form.imovel) fe.imovel = 'Imóvel é obrigatório'
    if (!form.categoria) fe.categoria = 'Categoria é obrigatória'
    if (!form.data_vencimento) fe.data_vencimento = 'Data de vencimento é obrigatória'
    if (!form.valor_previsto) fe.valor_previsto = 'Valor previsto é obrigatório'
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
        await updateReceita(editing.id, data)
        toast.success('Receita atualizada!')
      } else {
        await createReceita(data)
        toast.success('Receita criada!')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length) setErrors(ext)
      else toast.error('Erro ao salvar receita')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
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
            <Field label="Contrato (opcional)">
              <Select value={form.contrato} onValueChange={handleContratoChange}>
                <SelectTrigger aria-label="Selecione..." className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredContratos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.numero || `Contrato ${c.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Inquilino">
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
            <Field label="Categoria" error={errors.categoria}>
              <Select value={form.categoria} onValueChange={(v) => upd('categoria', v)}>
                <SelectTrigger aria-label="Selecione..." className="bg-slate-50/50 min-h-[44px]">
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Competência" error={errors.competencia}>
              <Input
                value={form.competencia}
                onChange={(e) => upd('competencia', e.target.value)}
                placeholder="2025-06"
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Data de vencimento" error={errors.data_vencimento}>
              <Input
                type="date"
                value={form.data_vencimento}
                onChange={(e) => upd('data_vencimento', e.target.value)}
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
                  {Object.entries(STATUS_RECEITA_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Valor previsto (R$)" error={errors.valor_previsto}>
              <Input
                type="number"
                step="0.01"
                value={form.valor_previsto}
                onChange={(e) => upd('valor_previsto', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Valor recebido (R$)">
              <Input
                type="number"
                step="0.01"
                value={form.valor_recebido}
                onChange={(e) => upd('valor_recebido', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Data do recebimento">
              <Input
                type="date"
                value={form.data_recebimento}
                onChange={(e) => upd('data_recebimento', e.target.value)}
                className="bg-slate-50/50 min-h-[44px]"
              />
            </Field>
            <Field label="Forma de recebimento">
              <Select
                value={form.forma_recebimento}
                onValueChange={(v) => upd('forma_recebimento', v)}
              >
                <SelectTrigger aria-label="Selecione..." className="bg-slate-50/50 min-h-[44px]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMA_RECEBIMENTO_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Descrição">
            <Input
              value={form.descricao}
              onChange={(e) => upd('descricao', e.target.value)}
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
              {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar Receita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
