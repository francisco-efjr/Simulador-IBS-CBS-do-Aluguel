import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Landmark, CheckCircle, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getContasBancarias,
  deleteContaBancaria,
  type ContaBancaria,
} from '@/services/contas-bancarias'
import { ContaBancariaFormDialog } from './ContaBancariaFormDialog'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'

export function ContasBancariasManagerDialog({
  open,
  onOpenChange,
  onContaCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onContaCreated?: (conta: ContaBancaria) => void
}) {
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingConta, setEditingConta] = useState<ContaBancaria | null>(null)

  const loadContas = async () => {
    try {
      setLoading(true)
      const data = await getContasBancarias()
      setContas(data)
    } catch {
      toast.error('Erro ao carregar contas bancárias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadContas()
    }
  }, [open])

  const handleDelete = async (conta: ContaBancaria) => {
    if (confirm(`Tem certeza que deseja excluir a conta "${conta.nome}"?`)) {
      try {
        await deleteContaBancaria(conta.id)
        toast.success('Conta bancária excluída')
        loadContas()
      } catch {
        toast.error('Não foi possível excluir esta conta')
      }
    }
  }

  const handleSaved = (saved?: ContaBancaria) => {
    loadContas()
    if (saved && onContaCreated) {
      onContaCreated(saved)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-100 text-navy-800">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Contas Bancárias</DialogTitle>
                <p className="text-xs text-slate-500">
                  Gerencie as contas para vinculação na importação de extratos
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingConta(null)
                setFormOpen(true)
              }}
              className="bg-navy-800 hover:bg-navy-900 text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Nova Conta
            </Button>
          </DialogHeader>

          <div className="py-2">
            {loading ? (
              <p className="text-center py-6 text-sm text-slate-400">Carregando contas...</p>
            ) : contas.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-lg">
                <Landmark className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">Nenhuma conta bancária cadastrada</p>
                <p className="text-xs text-slate-400 mt-1">
                  Cadastre suas contas correntes, investimentos ou poupanças para importar extratos.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Nome</TableHead>
                      <TableHead>Banco / Tipo</TableHead>
                      <TableHead>Agência / Conta</TableHead>
                      <TableHead className="text-right">Saldo Inicial</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-[90px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contas.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-slate-900">{c.nome}</TableCell>
                        <TableCell className="text-sm text-slate-600">
                          <div>{c.banco || 'Não informado'}</div>
                          <Badge variant="outline" className="text-[10px] mt-0.5 font-normal">
                            {c.tipo || 'Conta Corrente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {c.agencia ? `Ag: ${c.agencia}` : ''} {c.conta ? `CC: ${c.conta}` : ''}
                          {!c.agencia && !c.conta && '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(c.saldo_inicial || 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {c.ativo ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                              <CheckCircle className="h-3 w-3 mr-1 text-emerald-600" /> Ativa
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-slate-400">
                              <XCircle className="h-3 w-3 mr-1" /> Inativa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-navy-900"
                              onClick={() => {
                                setEditingConta(c)
                                setFormOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(c)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ContaBancariaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editingConta}
        onSaved={handleSaved}
      />
    </>
  )
}
