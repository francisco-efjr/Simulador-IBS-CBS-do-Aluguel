import { Badge, type BadgeProps } from '@/components/ui/badge'

type Tom = NonNullable<BadgeProps['variant']>

/** Pílulas de situação (StatusPill do handoff): sempre texto e cor juntos. */
const CONFIG: Record<string, Record<string, { label: string; tom: Tom }>> = {
  imovel: {
    vago: { label: 'Vago', tom: 'warn' },
    alugado: { label: 'Alugado', tom: 'ok' },
    em_manutencao: { label: 'Em manutenção', tom: 'neutral' },
    inativo: { label: 'Inativo', tom: 'neutral' },
  },
  geral: {
    ativo: { label: 'Ativo', tom: 'ok' },
    inativo: { label: 'Inativo', tom: 'neutral' },
  },
  contrato: {
    ativo: { label: 'Ativo', tom: 'ok' },
    encerrado: { label: 'Encerrado', tom: 'neutral' },
    cancelado: { label: 'Cancelado', tom: 'danger' },
  },
  iptu_taxas: {
    pago: { label: 'Pago', tom: 'ok' },
    pendente: { label: 'Pendente', tom: 'warn' },
    vencido: { label: 'Vencido', tom: 'danger' },
  },
  receita: {
    previsto: { label: 'Previsto', tom: 'neutral' },
    recebido: { label: 'Recebido', tom: 'ok' },
    em_atraso: { label: 'Em atraso', tom: 'danger' },
    parcial: { label: 'Parcial', tom: 'warn' },
  },
  despesa: {
    previsto: { label: 'Previsto', tom: 'neutral' },
    pago: { label: 'Pago', tom: 'ok' },
    em_atraso: { label: 'Em atraso', tom: 'danger' },
    parcial: { label: 'Parcial', tom: 'warn' },
  },
}

export function StatusBadge({
  type,
  status,
}: {
  type: 'imovel' | 'geral' | 'contrato' | 'iptu_taxas' | 'receita' | 'despesa'
  status: string
}) {
  const cfg = CONFIG[type]?.[status] || { label: status, tom: 'neutral' as Tom }
  return <Badge variant={cfg.tom}>{cfg.label}</Badge>
}
