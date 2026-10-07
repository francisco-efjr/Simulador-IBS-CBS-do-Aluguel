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

export function formatarCpf(valor: string | null | undefined): string {
  if (!valor) return '—'
  const limpo = valor.replace(/\D/g, '')
  if (limpo.length !== 11) return valor
  return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatarCnpj(valor: string | null | undefined): string {
  if (!valor) return '—'
  const limpo = valor.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
  if (limpo.length !== 14) return valor
  return limpo.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, '$1.$2.$3/$4-$5')
}

export function formatarCpfCnpj(valor: string | null | undefined): string {
  if (!valor) return '—'
  const limpo = valor.replace(/[^0-9A-Za-z]/g, '')
  if (limpo.length === 11) return formatarCpf(limpo)
  if (limpo.length === 14) return formatarCnpj(limpo)
  return valor
}

export function formatarTelefone(valor: string | null | undefined): string {
  if (!valor) return '—'
  const limpo = valor.replace(/\D/g, '')
  if (limpo.length === 11) {
    return limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (limpo.length === 10) {
    return limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return valor
}

export function aplicarMascaraDocumento(valor: string, tipo: 'pf' | 'pj' = 'pf'): string {
  const limpo = valor.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
  if (tipo === 'pf') {
    const apenasNum = limpo.replace(/\D/g, '').slice(0, 11)
    return apenasNum
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
  } else {
    const chars = limpo.slice(0, 14)
    return chars
      .replace(/^(.{2})(.+)/, '$1.$2')
      .replace(/^(.{2})\.(.{3})(.+)/, '$1.$2.$3')
      .replace(/^(.{2})\.(.{3})\.(.{3})(.+)/, '$1.$2.$3/$4')
      .replace(/^(.{2})\.(.{3})\.(.{3})\/(.{4})(.+)/, '$1.$2.$3/$4-$5')
  }
}

/**
 * Corta o texto para caber numa opção de seletor (regra Q32 do handoff: até ~24
 * caracteres). O nome inteiro vai no texto de apoio embaixo do campo. Corta na
 * última palavra inteira e põe reticências.
 */
export function abreviar(texto: string | null | undefined, maximo = 24): string {
  const limpo = (texto ?? '').trim().replace(/\s+/g, ' ')
  if (limpo.length <= maximo) return limpo
  const corte = limpo.slice(0, maximo - 1)
  const ultimoEspaco = corte.lastIndexOf(' ')
  const base = ultimoEspaco > maximo / 2 ? corte.slice(0, ultimoEspaco) : corte
  return `${base.trimEnd()}…`
}
