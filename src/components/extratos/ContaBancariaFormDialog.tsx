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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Field } from '@/components/shared/Field'
import {
  createContaBancaria,
  updateContaBancaria,
  type ContaBancaria,
} from '@/services/contas-bancarias'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { toast } from 'sonner'

const TIPOS_CONTA = ['Conta Corrente', 'Conta Poupança', 'Conta Investimento', 'Outros'] as const

const EMPTY = {
  nome: '',
  banco: '',
  agencia: '',
  conta: '',
  tipo: 'Conta Corrente' as ContaBancaria['tipo'],
  saldo_inicial: '',
  ativo: true,
}

export function ContaBancariaFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: ContaBancaria | null
  onSaved: (savedConta?: ContaBancaria) => void
}) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const upd = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!open) return
    setErrors({})
    if (editing) {
      setForm({
        nome: editing.nome || '',
        banco: editing.banco || '',
        agencia: editing.agencia || '',
        conta: editing.conta || '',
        tipo: editing.tipo || 'Conta Corrente',
        saldo_inicial: editing.saldo_inicial != null ? String(editing.saldo_inicial) : '',
        ativo: editing.ativo !== false,
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const fe: FieldErrors = {}
    if (!form.nome.trim()) fe.nome = 'Nome da conta é obrigatório'
    if (Object.keys(fe).length) {
      setErrors(fe)
      return
    }

    setSubmitting(true)
    try {
      const payload: Partial<ContaBancaria> = {
        nome: form.nome.trim(),
        banco: form.banco.trim(),
        agencia: form.agencia.trim(),
        conta: form.conta.trim(),
        tipo: form.tipo,
        saldo_inicial: form.saldo_inicial ? Number(form.saldo_inicial) : 0,
        ativo: form.ativo,
      }

      let res: ContaBancaria
      if (editing) {
        res = await updateContaBancaria(editing.id, payload)
        toast.success('Conta bancária atualizada com sucesso!')
      } else {
        res = await createContaBancaria(payload)
        toast.success('Conta bancária cadastrada com sucesso!')
      }
      onOpenChange(false)
      onSaved(res)
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length) setErrors(ext)
      else toast.error('Erro ao salvar conta bancária')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome Identificador da Conta" error={errors.nome}>
            <Input
              value={form.nome}
              onChange={(e) => upd('nome', e.target.value)}
              placeholder="ex.: Itaú Principal, BTG Investimentos"
              className="bg-slate-50/50"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Instituição Financeira / Banco">
              <Input
                value={form.banco}
                onChange={(e) => upd('banco', e.target.value)}
                placeholder="ex.: Banco Itaú, Nubank, Bradesco"
                className="bg-slate-50/50"
              />
            </Field>
            <Field label="Tipo de Conta">
              <Select value={form.tipo} onValueChange={(v) => upd('tipo', v)}>
                <SelectTrigger className="bg-slate-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONTA.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Agência">
              <Input
                value={form.agencia}
                onChange={(e) => upd('agencia', e.target.value)}
                placeholder="ex.: 1234"
                className="bg-slate-50/50"
              />
            </Field>
            <Field label="Número da Conta">
              <Input
                value={form.conta}
                onChange={(e) => upd('conta', e.target.value)}
                placeholder="ex.: 56789-0"
                className="bg-slate-50/50"
              />
            </Field>
          </div>

          <Field label="Saldo Inicial (R$)">
            <Input
              type="number"
              step="0.01"
              value={form.saldo_inicial}
              onChange={(e) => upd('saldo_inicial', e.target.value)}
              placeholder="0,00"
              className="bg-slate-50/50"
            />
          </Field>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Label htmlFor="conta-ativo" className="text-sm font-medium cursor-pointer">
              Conta ativa para importações e movimentações
            </Label>
            <Switch
              id="conta-ativo"
              checked={form.ativo}
              onCheckedChange={(checked) => upd('ativo', checked)}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-navy-800 hover:bg-navy-900 text-white"
            >
              {submitting ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar Conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
