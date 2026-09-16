import { Badge } from '@/components/ui/badge'

const CONFIG: Record<string, Record<string, { label: string; className: string }>> = {
  imovel: {
    vago: { label: 'Vago', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    alugado: {
      label: 'Alugado',
      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    },
    em_manutencao: {
      label: 'Em manutenção',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    },
    inativo: { label: 'Inativo', className: 'bg-slate-200 text-slate-700 hover:bg-slate-100' },
  },
  geral: {
    ativo: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
    inativo: { label: 'Inativo', className: 'bg-slate-200 text-slate-700 hover:bg-slate-100' },
  },
  contrato: {
    ativo: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
    encerrado: { label: 'Encerrado', className: 'bg-slate-200 text-slate-700 hover:bg-slate-100' },
    cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  },
  iptu_taxas: {
    pago: { label: 'Pago', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
    pendente: {
      label: 'Pendente',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    },
    vencido: { label: 'Vencido', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  },
  receita: {
    previsto: { label: 'Previsto', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    recebido: {
      label: 'Recebido',
      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    },
    em_atraso: { label: 'Em atraso', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
    parcial: { label: 'Parcial', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  },
  despesa: {
    previsto: { label: 'Previsto', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    pago: { label: 'Pago', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
    em_atraso: { label: 'Em atraso', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
    parcial: { label: 'Parcial', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  },
}

export function StatusBadge({
  type,
  status,
}: {
  type: 'imovel' | 'geral' | 'contrato' | 'iptu_taxas' | 'receita' | 'despesa'
  status: string
}) {
  const cfg = CONFIG[type]?.[status] || { label: status, className: 'bg-slate-200 text-slate-700' }
  return <Badge className={cfg.className}>{cfg.label}</Badge>
}
