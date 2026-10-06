import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
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
  createContrato,
  updateContrato,
  obterProximoNumeroContrato,
  type Contrato,
} from '@/services/contratos'
import { getImoveis, type Imovel } from '@/services/imoveis'
import { getInquilinos } from '@/services/inquilinos'
import { getLocadores, type Locador } from '@/services/locadores'
import { getFiadores, type Fiador } from '@/services/fiadores'
import { getUnidadesPorImovel, type ImovelUnidade } from '@/services/unidades'
import { TIPO_GARANTIA_LABELS, STATUS_CONTRATO_LABELS } from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { contratoSchema, validarFormulario } from '@/lib/validacao/esquemas'
import { FiadorFormDialog } from '@/components/fiadores/FiadorFormDialog'
import { OPCOES_MINUTA_PADRAO } from '@/components/contratos/MinutaContratoDialog'
import { toast } from 'sonner'

const EMPTY = {
  numero: '',
  imovel: '',
  unidade_id: '',
  locador_id: '',
  inquilino: '',
  fiador_id: '',
  minuta_padrao: '',
  data_inicio: '',
  data_fim: '',
  valor_aluguel: '',
  dia_vencimento: '10',
  indice_reajuste: 'IPCA',
  periodicidade_reajuste: 'Anual',
  proxima_data_reajuste: '',
  tipo_garantia: 'sem garantia',
  valor_garantia: '',
  status: 'ativo',
  observacoes: '',
}

const NUM_FIELDS = ['valor_aluguel', 'dia_vencimento', 'valor_garantia']

export function ContratoFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Contrato | null
  onSaved: () => void
}) {
  const [form, setForm] = useState<Record<string, string>>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  // Listas para seleção
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [unidades, setUnidades] = useState<ImovelUnidade[]>([])
  const [inquilinos, setInquilinos] = useState<any[]>([])
  const [locadores, setLocadores] = useState<Locador[]>([])
  const [fiadores, setFiadores] = useState<Fiador[]>([])

  // Modal de cadastro rápido de fiador
  const [fiadorModalOpen, setFiadorModalOpen] = useState(false)

  const upd = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  // Carrega listas gerais ao abrir
  useEffect(() => {
    if (!open) return
    setErrors({})
    setFile(null)

    Promise.all([
      getImoveis(),
      getInquilinos(),
      getLocadores(),
      getFiadores(),
    ]).then(([ims, iqs, locs, fiads]) => {
      setImoveis(ims)
      setInquilinos(iqs)
      setLocadores(locs)
      setFiadores(fiads)
    })

    if (editing) {
      setForm({
        ...EMPTY,
        ...Object.fromEntries(
          Object.entries(editing).map(([k, v]) => [k, v == null ? '' : String(v)]),
        ),
        imovel: editing.imovel || '',
        unidade_id: editing.unidade_id || '',
        locador_id: editing.locador_id || '',
        fiador_id: editing.fiador_id || '',
      })
    } else {
      setForm(EMPTY)
      // Carrega sugestão de número sequencial do contrato
      obterProximoNumeroContrato().then((proximo) => {
        setForm((prev) => (prev.numero ? prev : { ...prev, numero: proximo }))
      })
    }
  }, [open, editing])

  // Atualiza as unidades quando o imóvel selecionado mudar
  useEffect(() => {
    if (!form.imovel) {
      setUnidades([])
      return
    }
    getUnidadesPorImovel(form.imovel).then((unds) => {
      setUnidades(unds)
    })
  }, [form.imovel])

  // Trata seleção de Minuta Padrão
  const handleMinutaChange = (minutaId: string) => {
    upd('minuta_padrao', minutaId)
    if (minutaId.endsWith('fiador')) {
      upd('tipo_garantia', 'fiador')
    } else if (minutaId.endsWith('caucao')) {
      upd('tipo_garantia', 'caução')
      if (form.valor_aluguel && !form.valor_garantia) {
        const aluguelNum = Number(form.valor_aluguel.replace(',', '.'))
        if (!isNaN(aluguelNum) && aluguelNum > 0) {
          upd('valor_garantia', String(aluguelNum * 3))
        }
      }
    } else if (minutaId.endsWith('sem_garantia')) {
      upd('tipo_garantia', 'sem garantia')
      upd('valor_garantia', '')
      upd('fiador_id', '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const fe = validarFormulario(contratoSchema, form)
    if (Object.keys(fe).length) {
      setErrors(fe)
      return
    }

    const formatarValor = (k: string, v: string) => {
      if (NUM_FIELDS.includes(k)) {
        return Number(v.replace(/\./g, '').replace(',', '.'))
      }
      return v
    }

    let payload: Record<string, any> | FormData
    if (file) {
      const fd = new FormData()
      for (const [k, v] of Object.entries(form)) {
        if (k === 'status' || k === 'minuta_padrao') continue
        if (v === '' || v == null) continue
        fd.append(k, NUM_FIELDS.includes(k) ? String(formatarValor(k, v)) : v)
      }
      fd.append('status', form.status)
      fd.append('documento', file)
      payload = fd
    } else {
      payload = { status: form.status }
      for (const [k, v] of Object.entries(form)) {
        if (k === 'status' || k === 'minuta_padrao') continue
        if (v === '' || v == null) continue
        payload[k] = formatarValor(k, v)
      }
    }

    setSubmitting(true)
    try {
      if (editing) {
        await updateContrato(editing.id, payload)
        toast.success('Contrato atualizado com sucesso.')
      } else {
        await createContrato(payload)
        toast.success('Contrato cadastrado com sucesso.')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length) {
        setErrors(ext)
      } else {
        toast.error('Não foi possível salvar o contrato. Confira os campos e tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Linha 1: Número, Status, Minuta Padrão */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Número do contrato" error={errors.numero}>
                <Input
                  value={form.numero}
                  onChange={(e) => upd('numero', e.target.value)}
                  placeholder="001/2026"
                  className="bg-slate-50/50 min-h-[44px]"
                />
              </Field>

              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => upd('status', v)}>
                  <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONTRATO_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Minuta Padrão (Modelo)">
                <Select
                  value={form.minuta_padrao}
                  onValueChange={handleMinutaChange}
                >
                  <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                    <SelectValue placeholder="Selecione minuta padrão..." />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCOES_MINUTA_PADRAO.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Linha 2: Partes - Locador, Imóvel, Unidade, Inquilino */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Locador (Proprietário)" error={errors.locador_id}>
                <Select
                  value={form.locador_id}
                  onValueChange={(v) => upd('locador_id', v)}
                >
                  <SelectTrigger aria-label="Selecione o locador" className="bg-slate-50/50 min-h-[44px]">
                    <SelectValue placeholder="Selecione o locador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locadores.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.nome_razao_social} ({loc.tipo_pessoa.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Inquilino (Locatário)" error={errors.inquilino}>
                <Select value={form.inquilino} onValueChange={(v) => upd('inquilino', v)}>
                  <SelectTrigger aria-label="Selecione o inquilino" className="bg-slate-50/50 min-h-[44px]">
                    <SelectValue placeholder="Selecione o inquilino..." />
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Imóvel" error={errors.imovel}>
                <Select
                  value={form.imovel}
                  onValueChange={(v) => {
                    upd('imovel', v)
                    upd('unidade_id', '') // Limpa unidade ao trocar imóvel
                  }}
                >
                  <SelectTrigger aria-label="Selecione o imóvel" className="bg-slate-50/50 min-h-[44px]">
                    <SelectValue placeholder="Selecione o imóvel..." />
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

              <Field label="Unidade (Filha)" error={errors.unidade_id}>
                <Select
                  value={form.unidade_id}
                  onValueChange={(v) => upd('unidade_id', v)}
                  disabled={!form.imovel || unidades.length === 0}
                >
                  <SelectTrigger aria-label="Selecione a unidade" className="bg-slate-50/50 min-h-[44px]">
                    <SelectValue
                      placeholder={
                        !form.imovel
                          ? 'Selecione o imóvel primeiro...'
                          : unidades.length === 0
                            ? 'Nenhuma unidade cadastrada (imóvel único)'
                            : 'Selecione a unidade...'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.identificador} {u.complemento ? `(${u.complemento})` : ''} — {u.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Linha 3: Vigência e Valores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Data de início" error={errors.data_inicio}>
                <Input
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => upd('data_inicio', e.target.value)}
                  className="bg-slate-50/50 min-h-[44px]"
                />
              </Field>

              <Field label="Data de término" error={errors.data_fim}>
                <Input
                  type="date"
                  value={form.data_fim}
                  onChange={(e) => upd('data_fim', e.target.value)}
                  className="bg-slate-50/50 min-h-[44px]"
                />
              </Field>

              <Field label="Valor do aluguel (R$)" error={errors.valor_aluguel}>
                <Input
                  type="text"
                  value={form.valor_aluguel}
                  onChange={(e) => upd('valor_aluguel', e.target.value)}
                  placeholder="0,00"
                  className="bg-slate-50/50 min-h-[44px]"
                />
              </Field>

              <Field label="Dia de vencimento" error={errors.dia_vencimento}>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={form.dia_vencimento}
                  onChange={(e) => upd('dia_vencimento', e.target.value)}
                  className="bg-slate-50/50 min-h-[44px]"
                />
              </Field>
            </div>

            {/* Linha 4: Reajustes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Índice de reajuste">
                <Input
                  value={form.indice_reajuste}
                  onChange={(e) => upd('indice_reajuste', e.target.value)}
                  placeholder="IPCA, IGP-M..."
                  className="bg-slate-50/50 min-h-[44px]"
                />
              </Field>

              <Field label="Periodicidade do reajuste">
                <Input
                  value={form.periodicidade_reajuste}
                  onChange={(e) => upd('periodicidade_reajuste', e.target.value)}
                  placeholder="Anual, Semestral..."
                  className="bg-slate-50/50 min-h-[44px]"
                />
              </Field>

              <Field label="Próxima data de reajuste">
                <Input
                  type="date"
                  value={form.proxima_data_reajuste}
                  onChange={(e) => upd('proxima_data_reajuste', e.target.value)}
                  className="bg-slate-50/50 min-h-[44px]"
                />
              </Field>
            </div>

            {/* Linha 5: Garantia e Fiador */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Tipo de garantia">
                <Select
                  value={form.tipo_garantia}
                  onValueChange={(v) => {
                    upd('tipo_garantia', v)
                    if (v !== 'fiador') upd('fiador_id', '')
                  }}
                >
                  <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_GARANTIA_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {form.tipo_garantia !== 'fiador' && (
                <Field label="Valor da garantia (R$)" error={errors.valor_garantia}>
                  <Input
                    type="text"
                    value={form.valor_garantia}
                    onChange={(e) => upd('valor_garantia', e.target.value)}
                    placeholder="0,00"
                    className="bg-slate-50/50 min-h-[44px]"
                  />
                </Field>
              )}

              {/* Se garantia for Fiador, exibe seleção de fiador */}
              {form.tipo_garantia === 'fiador' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Fiador vinculado</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setFiadorModalOpen(true)}
                      className="text-xs text-indigo-600 p-0 h-auto font-medium"
                    >
                      <Plus className="h-3 w-3 mr-0.5" /> Novo Fiador
                    </Button>
                  </div>
                  <Select
                    value={form.fiador_id}
                    onValueChange={(v) => upd('fiador_id', v)}
                  >
                    <SelectTrigger className="bg-slate-50/50 min-h-[44px]">
                      <SelectValue placeholder="Selecione o fiador cadastrado..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fiadores.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome} {f.cpf ? `(${f.cpf})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Field label="Documento do contrato (Upload opcional)">
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
                {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar Contrato'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para cadastro rápido de novo fiador */}
      <FiadorFormDialog
        open={fiadorModalOpen}
        onOpenChange={setFiadorModalOpen}
        onSaved={(novoFiador) => {
          if (novoFiador) {
            setFiadores((prev) => [...prev, novoFiador])
            upd('fiador_id', novoFiador.id)
          }
        }}
      />
    </>
  )
}
