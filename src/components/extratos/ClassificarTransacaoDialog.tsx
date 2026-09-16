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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  formatCurrency,
  formatDate,
  FORMA_RECEBIMENTO_LABELS,
  FORMA_PAGAMENTO_LABELS,
} from '@/lib/format'
import { Sparkles, Building, Tag, Check, RefreshCw } from 'lucide-react'
import type { TransacaoImportada } from '@/services/importacoes'

interface ClassificarTransacaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transacao: TransacaoImportada | null
  imoveis: any[]
  inquilinos: any[]
  contratos: any[]
  fornecedores: any[]
  categorias: any[]
  onConfirm: (data: {
    tipo: 'receita' | 'despesa'
    imovel: string
    contrato?: string
    inquilino?: string
    fornecedor?: string
    categoria: string
    competencia: string
    valor: number
    data: string
    forma: string
    observacoes?: string
    descricao: string
  }) => Promise<void>
}

export function ClassificarTransacaoDialog({
  open,
  onOpenChange,
  transacao,
  imoveis,
  inquilinos,
  contratos,
  fornecedores,
  categorias,
  onConfirm,
}: ClassificarTransacaoDialogProps) {
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita')
  const [imovel, setImovel] = useState('')
  const [contrato, setContrato] = useState('')
  const [inquilino, setInquilino] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [competencia, setCompetencia] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [forma, setForma] = useState('pix')
  const [descricao, setDescricao] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Initialize form when transacao changes
  useEffect(() => {
    if (!open || !transacao) return

    const initialTipo =
      transacao.sugestao_tipo || (transacao.tipo === 'credito' ? 'receita' : 'despesa')
    setTipo(initialTipo)

    // Match imovel
    let matchedImovelId = transacao.sugestao_imovel_id || ''
    if (!matchedImovelId && transacao.sugestao_imovel) {
      const found = imoveis.find(
        (im) =>
          im.nome?.toLowerCase() === transacao.sugestao_imovel?.toLowerCase() ||
          im.endereco?.toLowerCase() === transacao.sugestao_imovel?.toLowerCase(),
      )
      if (found) matchedImovelId = found.id
    }
    setImovel(matchedImovelId)

    // Match categoria
    let matchedCatId = transacao.sugestao_categoria_id || ''
    if (!matchedCatId && transacao.sugestao_categoria) {
      const found = categorias.find(
        (c) =>
          c.tipo === initialTipo &&
          c.nome?.toLowerCase() === transacao.sugestao_categoria?.toLowerCase(),
      )
      if (found) matchedCatId = found.id
    }
    setCategoria(matchedCatId)

    // Competence derived from transaction date (YYYY-MM)
    const dateStr = transacao.data?.substring(0, 10) || ''
    setData(dateStr)
    setCompetencia(dateStr ? dateStr.substring(0, 7) : '')
    setValor(String(transacao.valor || ''))
    setDescricao(transacao.descricao || '')
    setObservacoes(`Importado via extrato bancário. Ref: ${transacao.descricao}`)
    setContrato('')
    setInquilino('')
    setFornecedor('')
    setForma(transacao.tipo === 'credito' ? 'pix' : 'pix')
  }, [open, transacao, imoveis, categorias])

  // Filtered categories based on selected tipo
  const filteredCategorias = categorias.filter((c) => c.tipo === tipo && c.status === 'ativo')

  // Filtered contracts based on selected imovel
  const filteredContratos = imovel ? contratos.filter((c) => c.imovel === imovel) : contratos

  // Auto-fill inquilino when contract is chosen
  const handleContratoChange = (cId: string) => {
    setContrato(cId)
    const c = contratos.find((item) => item.id === cId)
    if (c) {
      if (c.inquilino) setInquilino(c.inquilino)
      if (!imovel && c.imovel) setImovel(c.imovel)
    }
  }

  const handleApplySuggestion = () => {
    if (!transacao) return
    if (transacao.sugestao_tipo) setTipo(transacao.sugestao_tipo)
    if (transacao.sugestao_imovel_id) setImovel(transacao.sugestao_imovel_id)
    if (transacao.sugestao_categoria_id) setCategoria(transacao.sugestao_categoria_id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imovel) {
      alert('Selecione um imóvel.')
      return
    }
    if (!categoria) {
      alert('Selecione uma categoria financeira.')
      return
    }

    setSubmitting(true)
    try {
      await onConfirm({
        tipo,
        imovel,
        contrato: contrato || undefined,
        inquilino: inquilino || undefined,
        fornecedor: fornecedor || undefined,
        categoria,
        competencia: competencia || data.substring(0, 7),
        valor: Number(valor),
        data,
        forma,
        descricao,
        observacoes,
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (!transacao) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-lg">
            <span>Classificar Lançamento</span>
            <span className="text-sm font-normal text-slate-500">{formatDate(transacao.data)}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Transaction Banner */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Descrição no Extrato
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{transacao.descricao}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Valor</p>
              <p
                className={`text-base font-bold ${
                  transacao.tipo === 'credito' ? 'text-emerald-700' : 'text-slate-900'
                }`}
              >
                {transacao.tipo === 'credito' ? '+' : '-'} {formatCurrency(transacao.valor)}
              </p>
            </div>
          </div>

          {(transacao.sugestao_categoria || transacao.sugestao_imovel) && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-navy-900 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-gold-600" />
                <span>
                  Sugestão:{' '}
                  <strong>
                    {transacao.sugestao_tipo === 'receita' ? 'Receita' : 'Despesa'} —{' '}
                    {transacao.sugestao_categoria || 'Geral'}
                    {transacao.sugestao_imovel ? ` (${transacao.sugestao_imovel})` : ''}
                  </strong>
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleApplySuggestion}
                className="h-6 text-xs text-gold-700 hover:text-gold-800 hover:bg-gold-50 px-2"
              >
                Preencher com Sugestão
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tipo Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Tipo de Lançamento</label>
            <Tabs
              value={tipo}
              onValueChange={(v) => {
                setTipo(v as 'receita' | 'despesa')
                setCategoria('') // Reset category when type changes
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="receita"
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-medium"
                >
                  Receita (Entrada / Aluguel)
                </TabsTrigger>
                <TabsTrigger
                  value="despesa"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white font-medium"
                >
                  Despesa (Saída / Custo)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Imóvel">
              <Select value={imovel} onValueChange={setImovel}>
                <SelectTrigger aria-label="Selecione o imóvel..." className="bg-slate-50/50">
                  <SelectValue placeholder="Selecione o imóvel..." />
                </SelectTrigger>
                <SelectContent>
                  {imoveis.map((im) => (
                    <SelectItem key={im.id} value={im.id}>
                      {im.nome || im.endereco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Categoria Financeira">
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger aria-label="Selecione a categoria..." className="bg-slate-50/50">
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {tipo === 'receita' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Contrato de Locação (opcional)">
                <Select value={contrato} onValueChange={handleContratoChange}>
                  <SelectTrigger aria-label="Selecione o contrato..." className="bg-slate-50/50">
                    <SelectValue placeholder="Selecione o contrato..." />
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

              <Field label="Inquilino / Pagador (opcional)">
                <Select value={inquilino} onValueChange={setInquilino}>
                  <SelectTrigger aria-label="Selecione o inquilino..." className="bg-slate-50/50">
                    <SelectValue placeholder="Selecione o inquilino..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inquilinos.map((iq) => (
                      <SelectItem key={iq.id} value={iq.id}>
                        {iq.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ) : (
            <Field label="Fornecedor / Favorecido (opcional)">
              <Select value={fornecedor} onValueChange={setFornecedor}>
                <SelectTrigger aria-label="Selecione o fornecedor..." className="bg-slate-50/50">
                  <SelectValue placeholder="Selecione o fornecedor..." />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Competência">
              <Input
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                placeholder="AAAA-MM"
                className="bg-slate-50/50"
              />
            </Field>

            <Field label="Data de Vencimento / Evento">
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="bg-slate-50/50"
              />
            </Field>

            <Field label={tipo === 'receita' ? 'Forma de Recebimento' : 'Forma de Pagamento'}>
              <Select value={forma} onValueChange={setForma}>
                <SelectTrigger className="bg-slate-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipo === 'receita'
                    ? Object.entries(FORMA_RECEBIMENTO_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))
                    : Object.entries(FORMA_PAGAMENTO_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Descrição Personalizada">
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="bg-slate-50/50"
            />
          </Field>

          <Field label="Observações">
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="bg-slate-50/50"
            />
          </Field>

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
              className="bg-navy-800 hover:bg-navy-900 text-white font-semibold"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Lançando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5 text-gold-400" /> Confirmar Lançamento
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
