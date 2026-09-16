import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Field } from '@/components/shared/Field'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Layers, RefreshCw } from 'lucide-react'
import { FORMA_RECEBIMENTO_LABELS, FORMA_PAGAMENTO_LABELS } from '@/lib/format'

interface ClassificarLoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  imoveis: any[]
  categorias: any[]
  fornecedores: any[]
  onConfirm: (data: {
    tipo: 'receita' | 'despesa'
    imovel: string
    categoria: string
    fornecedor?: string
    forma: string
    competencia?: string
  }) => Promise<void>
}

export function ClassificarLoteDialog({
  open,
  onOpenChange,
  selectedCount,
  imoveis,
  categorias,
  fornecedores,
  onConfirm,
}: ClassificarLoteDialogProps) {
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita')
  const [imovel, setImovel] = useState('')
  const [categoria, setCategoria] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [forma, setForma] = useState('pix')
  const [competencia, setCompetencia] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setImovel('')
      setCategoria('')
      setFornecedor('')
      setCompetencia(new Date().toISOString().substring(0, 7))
    }
  }, [open])

  const filteredCategorias = categorias.filter((c) => c.tipo === tipo && c.status === 'ativo')

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
        categoria,
        fornecedor: fornecedor || undefined,
        forma,
        competencia: competencia || undefined,
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Layers className="h-5 w-5 text-gold-600" />
            Classificação em Lote ({selectedCount} transações)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Aplique a mesma configuração de imóvel e categoria para todas as transações selecionadas
            simultaneamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tipo Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Tipo dos Lançamentos</label>
            <Tabs
              value={tipo}
              onValueChange={(v) => {
                setTipo(v as 'receita' | 'despesa')
                setCategoria('')
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="receita"
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  Receitas (Entradas)
                </TabsTrigger>
                <TabsTrigger
                  value="despesa"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
                >
                  Despesas (Saídas)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Field label="Imóvel">
            <Select value={imovel} onValueChange={setImovel}>
              <SelectTrigger
                aria-label="Selecione o imóvel de destino..."
                className="bg-slate-50/50"
              >
                <SelectValue placeholder="Selecione o imóvel de destino..." />
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

          {tipo === 'despesa' && (
            <Field label="Fornecedor (opcional)">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Competência">
              <Input
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                placeholder="AAAA-MM"
                className="bg-slate-50/50"
              />
            </Field>

            <Field label="Forma de Pagto/Receb">
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

          <DialogFooter className="gap-2 pt-3">
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
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5 text-gold-400" /> Classificar {selectedCount} em
                  Lote
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
