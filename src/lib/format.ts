export const formatCurrency = (value: number | undefined | null): string => {
  if (value == null || isNaN(value)) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export const formatDate = (date: string | undefined | null): string => {
  if (!date) return '—'
  const d = new Date(date + (date.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

export const formatDateTime = (date: string | undefined | null): string => {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export const TIPO_IMOVEL_LABELS: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  sala_comercial: 'Sala comercial',
  loja: 'Loja',
  galpao: 'Galpão',
  terreno: 'Terreno',
  outro: 'Outro',
}

export const STATUS_IMOVEL_LABELS: Record<string, string> = {
  vago: 'Vago',
  alugado: 'Alugado',
  em_manutencao: 'Em manutenção',
  inativo: 'Inativo',
}

export const TIPO_PESSOA_LABELS: Record<string, string> = {
  pf: 'Pessoa Física',
  pj: 'Pessoa Jurídica',
}

export const TIPO_FORNECEDOR_LABELS: Record<string, string> = {
  eletricista: 'Eletricista',
  encanador: 'Encanador',
  pedreiro: 'Pedreiro',
  pintor: 'Pintor',
  empresa_manutencao: 'Empresa de manutenção',
  empresa_limpeza: 'Empresa de limpeza',
  seguradora: 'Seguradora',
  condominio: 'Condomínio',
  outros: 'Outros',
}

export const STATUS_CONTRATO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  encerrado: 'Encerrado',
  cancelado: 'Cancelado',
}

export const TIPO_GARANTIA_LABELS: Record<string, string> = {
  caução: 'Caução',
  fiador: 'Fiador',
  'seguro-fiança': 'Seguro-fiança',
  'título de capitalização': 'Título de capitalização',
  'sem garantia': 'Sem garantia',
  outros: 'Outros',
}

export const TIPO_IPTU_LABELS: Record<string, string> = {
  iptu: 'IPTU',
  taxa_condominio: 'Condomínio',
  seguro: 'Seguro',
  taxa_municipal: 'Taxa municipal',
  taxa_extraordinaria: 'Taxa extraordinária',
  outro: 'Outros',
}

export const STATUS_IPTU_LABELS: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  vencido: 'Vencido',
}

export const STATUS_RECEITA_LABELS: Record<string, string> = {
  previsto: 'Previsto',
  recebido: 'Recebido',
  em_atraso: 'Em atraso',
  parcial: 'Parcial',
}

export const FORMA_RECEBIMENTO_LABELS: Record<string, string> = {
  pix: 'Pix',
  transferencia: 'Transferência',
  boleto: 'Boleto',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  debito_automatico: 'Débito automático',
  outros: 'Outros',
}

export const STATUS_DESPESA_LABELS: Record<string, string> = {
  previsto: 'Previsto',
  pago: 'Pago',
  em_atraso: 'Em atraso',
  parcial: 'Parcial',
}

export const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  pix: 'Pix',
  transferencia: 'Transferência',
  boleto: 'Boleto',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  debito_automatico: 'Débito automático',
  cheque: 'Cheque',
  outros: 'Outros',
}
