import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import {
  formatCurrency,
  formatDate,
  TIPO_IMOVEL_LABELS,
  STATUS_IMOVEL_LABELS,
  STATUS_CONTRATO_LABELS,
  TIPO_IPTU_LABELS,
  STATUS_IPTU_LABELS,
  STATUS_RECEITA_LABELS,
  STATUS_DESPESA_LABELS,
} from '@/lib/format'
import brandLogo from '@/assets/chatgpt-image-aug-7-2026-061737-pm-5-f38c6.png'

// Colors Holding Aguiar
const COLOR_NAVY = [15, 23, 42] as [number, number, number] // #0f172a
const COLOR_NAVY_LIGHT = [30, 41, 59] as [number, number, number] // #1e293b
const COLOR_GOLD = [217, 119, 6] as [number, number, number] // #d97706
const COLOR_GOLD_LIGHT = [254, 243, 199] as [number, number, number] // #fef3c7
const COLOR_TEXT_MUTED = [100, 116, 139] as [number, number, number]

// Helper: load image as Base64 for jsPDF
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
    const res = await fetch(imageUrl)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}

// Helper: Add Standard Holding Aguiar Header to PDF
const addPdfHeader = async (
  doc: jsPDF,
  title: string,
  periodoLabel: string,
  extraFilterInfo?: string,
) => {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Top Navy Accent Bar
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Gold Accent line
  doc.setFillColor(217, 119, 6)
  doc.rect(0, 28, pageWidth, 2, 'F')

  // Try rendering logo or fallback text
  try {
    const logoBase64 = await getBase64ImageFromUrl(brandLogo)
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 14, 4, 38, 20)
    }
  } catch {
    // fallback
  }

  // System and Report Titles
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('HOLDING AGUIAR — GESTÃO PATRIMONIAL', 56, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(217, 119, 6)
  doc.text(title.toUpperCase(), 56, 19)

  // Right side date info
  const emissaoStr = `Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  doc.setTextColor(203, 213, 225)
  doc.setFontSize(7.5)
  doc.text(emissaoStr, pageWidth - 14, 12, { align: 'right' })

  // Subheader banner below header
  doc.setTextColor(51, 65, 85)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title, 14, 37)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  const metaText = `Período de Referência: ${periodoLabel}${extraFilterInfo ? `  •  ${extraFilterInfo}` : ''}`
  doc.text(metaText, 14, 42)

  // Separator line
  doc.setDrawColor(226, 232, 240)
  doc.line(14, 45, pageWidth - 14, 45)
}

// Helper: Add Standard PDF Footer with pagination
const addPdfFooter = (doc: jsPDF) => {
  const pageCount = (doc as any).internal.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(
      'Holding Aguiar — Sistema Controle de Imóveis • Relatório Oficial Confidencial',
      14,
      pageHeight - 7,
    )
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' })
  }
}

// ==========================================
// 1. RELATÓRIO FINANCEIRO
// ==========================================

export interface RelatorioFinanceiroParams {
  periodoLabel: string
  startDateStr: string
  endDateStr: string
  imovelFilterLabel: string
  kpis: {
    receitasRecebidas: number
    despesasPagas: number
    resultadoLiquido: number
    receitasPendentes: number
    receitasVencidas: number
    despesasPendentes: number
    despesasVencidas: number
  }
  imoveisSummary: {
    nome: string
    codigo?: string
    receitas: number
    despesas: number
    resultado: number
  }[]
  receitasDetalhadas?: any[]
  despesasDetalhadas?: any[]
}

export async function exportarRelatorioFinanceiroPDF(data: RelatorioFinanceiroParams) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  await addPdfHeader(
    doc,
    'Relatório Financeiro — Holding Aguiar',
    data.periodoLabel,
    `Filtro Imóvel: ${data.imovelFilterLabel}`,
  )

  // 1. Tabela com os 7 Indicadores
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('1. Indicadores Financeiros do Período', 14, 52)

  const kpisTableRows = [
    ['Receitas Recebidas (Realizadas)', formatCurrency(data.kpis.receitasRecebidas)],
    ['Despesas Pagas (Realizadas)', formatCurrency(data.kpis.despesasPagas)],
    [
      `Resultado Líquido (${data.kpis.resultadoLiquido >= 0 ? 'Superávit' : 'Déficit'})`,
      formatCurrency(data.kpis.resultadoLiquido),
    ],
    ['Receitas Pendentes (A Receber)', formatCurrency(data.kpis.receitasPendentes)],
    ['Receitas Vencidas (Em Atraso)', formatCurrency(data.kpis.receitasVencidas)],
    ['Despesas Pendentes (A Pagar)', formatCurrency(data.kpis.despesasPendentes)],
    ['Despesas Vencidas (Em Atraso)', formatCurrency(data.kpis.despesasVencidas)],
  ]

  autoTable(doc, {
    startY: 55,
    head: [['Indicador Financeiro', 'Valor Consolidado (R$)']],
    body: kpisTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: COLOR_NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120 },
      1: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (dataCell) => {
      if (dataCell.row.index === 2 && dataCell.section === 'body') {
        dataCell.cell.styles.fillColor = [240, 253, 244]
        dataCell.cell.styles.textColor = [22, 101, 52]
      }
    },
  })

  // 2. Tabela de Resumo por Imóvel
  const finalY1 = (doc as any).lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('2. Resumo Financeiro por Imóvel', 14, finalY1)

  const imoveisTableRows = data.imoveisSummary.map((im) => [
    im.nome + (im.codigo ? ` (${im.codigo})` : ''),
    formatCurrency(im.receitas),
    formatCurrency(im.despesas),
    formatCurrency(im.resultado),
  ])

  // Total row
  const totalRec = data.imoveisSummary.reduce((acc, curr) => acc + curr.receitas, 0)
  const totalDesp = data.imoveisSummary.reduce((acc, curr) => acc + curr.despesas, 0)
  const totalRes = totalRec - totalDesp
  imoveisTableRows.push([
    'TOTAL GERAL',
    formatCurrency(totalRec),
    formatCurrency(totalDesp),
    formatCurrency(totalRes),
  ])

  autoTable(doc, {
    startY: finalY1 + 3,
    head: [['Imóvel', 'Receitas (R$)', 'Despesas (R$)', 'Resultado Líquido (R$)']],
    body: imoveisTableRows,
    theme: 'striped',
    headStyles: {
      fillColor: COLOR_NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right', textColor: [16, 185, 129] },
      2: { halign: 'right', textColor: [225, 29, 72] },
      3: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (cellData) => {
      if (cellData.row.index === imoveisTableRows.length - 1 && cellData.section === 'body') {
        cellData.cell.styles.fontStyle = 'bold'
        cellData.cell.styles.fillColor = [241, 245, 249]
      }
    },
  })

  addPdfFooter(doc)
  doc.save(`Relatorio_Financeiro_Holding_Aguiar_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function exportarRelatorioFinanceiroExcel(data: RelatorioFinanceiroParams) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Indicadores
  const kpiRows = [
    ['RELATÓRIO FINANCEIRO — HOLDING AGUIAR'],
    [`Período: ${data.periodoLabel}`],
    [`Filtro: ${data.imovelFilterLabel}`],
    [`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`],
    [],
    ['INDICADOR', 'VALOR (R$)'],
    ['Receitas Recebidas (Realizadas)', data.kpis.receitasRecebidas],
    ['Despesas Pagas (Realizadas)', data.kpis.despesasPagas],
    ['Resultado Líquido', data.kpis.resultadoLiquido],
    ['Receitas Pendentes (A Receber)', data.kpis.receitasPendentes],
    ['Receitas Vencidas (Em Atraso)', data.kpis.receitasVencidas],
    ['Despesas Pendentes (A Pagar)', data.kpis.despesasPendentes],
    ['Despesas Vencidas (Em Atraso)', data.kpis.despesasVencidas],
  ]
  const wsKpis = XLSX.utils.aoa_to_sheet(kpiRows)
  XLSX.utils.book_append_sheet(wb, wsKpis, 'Indicadores')

  // Sheet 2: Resumo por Imovel
  const imovelRows = [
    ['RESUMO POR IMÓVEL — HOLDING AGUIAR'],
    [`Período: ${data.periodoLabel}`],
    [],
    ['Imóvel', 'Código', 'Receitas (R$)', 'Despesas (R$)', 'Resultado (R$)'],
    ...data.imoveisSummary.map((im) => [
      im.nome,
      im.codigo || '',
      im.receitas,
      im.despesas,
      im.resultado,
    ]),
  ]
  const wsImoveis = XLSX.utils.aoa_to_sheet(imovelRows)
  XLSX.utils.book_append_sheet(wb, wsImoveis, 'Resumo Imóveis')

  XLSX.writeFile(
    wb,
    `Relatorio_Financeiro_Holding_Aguiar_${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}

// ==========================================
// 2. RELATÓRIO DE IMÓVEIS
// ==========================================

export interface RelatorioImoveisParams {
  periodoLabel: string
  statusFilterLabel: string
  tipoFilterLabel: string
  kpis: {
    total: number
    alugados: number
    vagos: number
    manutencao: number
    inativos: number
    taxaOcupacao: number
    receitaTotal: number
    despesaTotal: number
    resultado: number
  }
  imoveisDetalhados: {
    nome: string
    codigo?: string
    tipo: string
    status: string
    receitas: number
    despesas: number
    resultado: number
    contratoAtivo: string
    inquilinoNome: string
    iptuPendente: number
  }[]
}

export async function exportarRelatorioImoveisPDF(data: RelatorioImoveisParams) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  await addPdfHeader(
    doc,
    'Relatório de Imóveis & Ocupação — Holding Aguiar',
    data.periodoLabel,
    `Status: ${data.statusFilterLabel} • Tipo: ${data.tipoFilterLabel}`,
  )

  // 1. Tabela com Indicadores de Portfólio
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text('1. Indicadores Consolidados do Portfólio', 14, 52)

  const kpisRow = [
    [
      `Total: ${data.kpis.total}`,
      `Alugados: ${data.kpis.alugados}`,
      `Vagos: ${data.kpis.vagos}`,
      `Manutenção: ${data.kpis.manutencao}`,
      `Taxa de Ocupação: ${data.kpis.taxaOcupacao.toFixed(1)}%`,
      `Receita: ${formatCurrency(data.kpis.receitaTotal)}`,
      `Despesa: ${formatCurrency(data.kpis.despesaTotal)}`,
      `Resultado: ${formatCurrency(data.kpis.resultado)}`,
    ],
  ]

  autoTable(doc, {
    startY: 55,
    head: [
      [
        'Total Imóveis',
        'Alugados',
        'Vagos',
        'Manutenção',
        'Taxa Ocupação',
        'Receitas Realizadas',
        'Despesas Pagas',
        'Resultado Líquido',
      ],
    ],
    body: [
      [
        data.kpis.total.toString(),
        data.kpis.alugados.toString(),
        data.kpis.vagos.toString(),
        data.kpis.manutencao.toString(),
        `${data.kpis.taxaOcupacao.toFixed(1)}%`,
        formatCurrency(data.kpis.receitaTotal),
        formatCurrency(data.kpis.despesaTotal),
        formatCurrency(data.kpis.resultado),
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: COLOR_NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      halign: 'center',
      fontStyle: 'bold',
    },
  })

  // 2. Tabela Detalhada por Imóvel
  const finalY = (doc as any).lastAutoTable.finalY + 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text('2. Detalhamento por Propriedade', 14, finalY)

  const tableBody = data.imoveisDetalhados.map((im) => [
    im.nome + (im.codigo ? ` (${im.codigo})` : ''),
    TIPO_IMOVEL_LABELS[im.tipo] || im.tipo,
    STATUS_IMOVEL_LABELS[im.status] || im.status,
    formatCurrency(im.receitas),
    formatCurrency(im.despesas),
    formatCurrency(im.resultado),
    im.contratoAtivo ? `${im.contratoAtivo} (${im.inquilinoNome || 'Locado'})` : 'Nenhum',
    im.iptuPendente > 0 ? formatCurrency(im.iptuPendente) : 'Em dia',
  ])

  autoTable(doc, {
    startY: finalY + 3,
    head: [
      [
        'Nome do Imóvel',
        'Tipo',
        'Status',
        'Receitas (R$)',
        'Despesas (R$)',
        'Resultado (R$)',
        'Contrato Ativo / Inquilino',
        'IPTU/Taxa Pendente',
      ],
    ],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: COLOR_NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 26 },
      2: { cellWidth: 26 },
      3: { halign: 'right', textColor: [16, 185, 129] },
      4: { halign: 'right', textColor: [225, 29, 72] },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 48 },
      7: { halign: 'right' },
    },
  })

  addPdfFooter(doc)
  doc.save(`Relatorio_Imoveis_Holding_Aguiar_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function exportarRelatorioImoveisExcel(data: RelatorioImoveisParams) {
  const wb = XLSX.utils.book_new()

  const rows = [
    ['RELATÓRIO DE IMÓVEIS — HOLDING AGUIAR'],
    [`Período: ${data.periodoLabel}`],
    [`Status: ${data.statusFilterLabel} | Tipo: ${data.tipoFilterLabel}`],
    [`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`],
    [],
    [
      'Total Imóveis',
      'Alugados',
      'Vagos',
      'Em Manutenção',
      'Taxa Ocupação (%)',
      'Receita Total (R$)',
      'Despesa Total (R$)',
      'Resultado (R$)',
    ],
    [
      data.kpis.total,
      data.kpis.alugados,
      data.kpis.vagos,
      data.kpis.manutencao,
      data.kpis.taxaOcupacao.toFixed(1),
      data.kpis.receitaTotal,
      data.kpis.despesaTotal,
      data.kpis.resultado,
    ],
    [],
    [
      'Imóvel',
      'Código',
      'Tipo',
      'Status',
      'Receitas (R$)',
      'Despesas (R$)',
      'Resultado (R$)',
      'Contrato Ativo',
      'Inquilino',
      'IPTU Pendente (R$)',
    ],
    ...data.imoveisDetalhados.map((im) => [
      im.nome,
      im.codigo || '',
      TIPO_IMOVEL_LABELS[im.tipo] || im.tipo,
      STATUS_IMOVEL_LABELS[im.status] || im.status,
      im.receitas,
      im.despesas,
      im.resultado,
      im.contratoAtivo || 'Nenhum',
      im.inquilinoNome || '',
      im.iptuPendente,
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Imóveis')
  XLSX.writeFile(
    wb,
    `Relatorio_Imoveis_Holding_Aguiar_${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}

// ==========================================
// 3. RELATÓRIO DE CONTRATOS
// ==========================================

export interface RelatorioContratosParams {
  periodoLabel: string
  statusFilterLabel: string
  imovelFilterLabel: string
  contratos: {
    numero: string
    imovelNome: string
    inquilinoNome: string
    dataInicio: string
    dataFim: string
    valorAluguel: number
    status: string
    diasRestantes: number
    indiceReajuste?: string
    proximoReajuste?: string
  }[]
}

export async function exportarRelatorioContratosPDF(data: RelatorioContratosParams) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  await addPdfHeader(
    doc,
    'Relatório Geral de Contratos de Locação — Holding Aguiar',
    data.periodoLabel,
    `Status: ${data.statusFilterLabel} • Imóvel: ${data.imovelFilterLabel}`,
  )

  const rows = data.contratos.map((c) => {
    let diasStr = '—'
    if (c.diasRestantes < 0) {
      diasStr = `Vencido há ${Math.abs(c.diasRestantes)}d`
    } else if (c.diasRestantes === 0) {
      diasStr = 'Vence hoje'
    } else {
      diasStr = `${c.diasRestantes} dias`
    }

    return [
      c.numero || 'S/N',
      c.imovelNome,
      c.inquilinoNome,
      formatDate(c.dataInicio),
      formatDate(c.dataFim),
      formatCurrency(c.valorAluguel),
      STATUS_CONTRATO_LABELS[c.status] || c.status,
      diasStr,
      c.indiceReajuste || '—',
      formatDate(c.proximoReajuste),
    ]
  })

  autoTable(doc, {
    startY: 52,
    head: [
      [
        'Nº Contrato',
        'Imóvel',
        'Inquilino',
        'Início',
        'Término',
        'Valor Aluguel (R$)',
        'Status',
        'Dias Restantes',
        'Índice Reaj.',
        'Próx. Reajuste',
      ],
    ],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: COLOR_NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 26 },
      1: { cellWidth: 48 },
      2: { cellWidth: 42 },
      5: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
      7: { halign: 'center' },
    },
  })

  addPdfFooter(doc)
  doc.save(`Relatorio_Contratos_Holding_Aguiar_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function exportarRelatorioContratosExcel(data: RelatorioContratosParams) {
  const wb = XLSX.utils.book_new()

  const rows = [
    ['RELATÓRIO DE CONTRATOS — HOLDING AGUIAR'],
    [`Período: ${data.periodoLabel}`],
    [`Status: ${data.statusFilterLabel} | Imóvel: ${data.imovelFilterLabel}`],
    [`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`],
    [],
    [
      'Nº Contrato',
      'Imóvel',
      'Inquilino',
      'Data Início',
      'Data Término',
      'Valor Aluguel (R$)',
      'Status',
      'Dias Restantes',
      'Índice Reajuste',
      'Próxima Data Reajuste',
    ],
    ...data.contratos.map((c) => [
      c.numero || '',
      c.imovelNome,
      c.inquilinoNome,
      c.dataInicio,
      c.dataFim,
      c.valorAluguel,
      STATUS_CONTRATO_LABELS[c.status] || c.status,
      c.diasRestantes,
      c.indiceReajuste || '',
      c.proximoReajuste || '',
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Contratos')
  XLSX.writeFile(
    wb,
    `Relatorio_Contratos_Holding_Aguiar_${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}

// ==========================================
// 4. RELATÓRIO DE INADIMPLÊNCIA
// ==========================================

export interface RelatorioInadimplenciaParams {
  periodoLabel: string
  imovelFilterLabel: string
  receitasEmAtraso: {
    imovelNome: string
    inquilinoNome: string
    descricao: string
    dataVencimento: string
    diasAtraso: number
    valor: number
  }[]
  despesasEmAtraso: {
    imovelNome: string
    fornecedorNome: string
    descricao: string
    dataVencimento: string
    diasAtraso: number
    valor: number
  }[]
  iptuVencidos: {
    imovelNome: string
    descricao: string
    tipo: string
    vencimento: string
    diasAtraso: number
    valor: number
  }[]
}

export async function exportarRelatorioInadimplenciaPDF(data: RelatorioInadimplenciaParams) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  await addPdfHeader(
    doc,
    'Relatório de Inadimplência & Contas Vencidas — Holding Aguiar',
    data.periodoLabel,
    `Filtro Imóvel: ${data.imovelFilterLabel}`,
  )

  let startY = 52

  // Total Inadimplência Box
  const totRec = data.receitasEmAtraso.reduce((acc, c) => acc + c.valor, 0)
  const totDesp = data.despesasEmAtraso.reduce((acc, c) => acc + c.valor, 0)
  const totIptu = data.iptuVencidos.reduce((acc, c) => acc + c.valor, 0)

  doc.setFillColor(254, 242, 242)
  doc.setDrawColor(248, 113, 113)
  doc.roundedRect(14, startY, doc.internal.pageSize.getWidth() - 28, 16, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(153, 27, 27)
  doc.text('RESUMO GERAL DE PENDÊNCIAS VENCIDAS', 20, startY + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(
    `Receitas em Atraso: ${formatCurrency(totRec)}  |  Despesas em Atraso: ${formatCurrency(totDesp)}  |  IPTU/Taxas Vencidos: ${formatCurrency(totIptu)}`,
    20,
    startY + 12,
  )

  startY += 23

  // 1. Receitas em Atraso
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text(`1. Receitas de Locação em Atraso (${data.receitasEmAtraso.length})`, 14, startY)

  const recRows = data.receitasEmAtraso.map((r) => [
    r.imovelNome,
    r.inquilinoNome || '—',
    r.descricao,
    formatDate(r.dataVencimento),
    `${r.diasAtraso} dia(s)`,
    formatCurrency(r.valor),
  ])

  if (recRows.length === 0) {
    recRows.push(['Nenhuma receita em atraso', '—', '—', '—', '—', 'R$ 0,00'])
  }

  autoTable(doc, {
    startY: startY + 3,
    head: [['Imóvel', 'Inquilino', 'Descrição', 'Vencimento', 'Atraso', 'Valor Previsto (R$)']],
    body: recRows,
    theme: 'striped',
    headStyles: {
      fillColor: [185, 28, 28], // Red
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      4: { halign: 'center', textColor: [185, 28, 28], fontStyle: 'bold' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // 2. Despesas em Atraso
  startY = (doc as any).lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text(`2. Despesas Operacionais em Atraso (${data.despesasEmAtraso.length})`, 14, startY)

  const despRows = data.despesasEmAtraso.map((d) => [
    d.imovelNome,
    d.fornecedorNome || '—',
    d.descricao,
    formatDate(d.dataVencimento),
    `${d.diasAtraso} dia(s)`,
    formatCurrency(d.valor),
  ])

  if (despRows.length === 0) {
    despRows.push(['Nenhuma despesa em atraso', '—', '—', '—', '—', 'R$ 0,00'])
  }

  autoTable(doc, {
    startY: startY + 3,
    head: [['Imóvel', 'Fornecedor', 'Descrição', 'Vencimento', 'Atraso', 'Valor Previsto (R$)']],
    body: despRows,
    theme: 'striped',
    headStyles: {
      fillColor: COLOR_NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      4: { halign: 'center', textColor: [185, 28, 28], fontStyle: 'bold' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // 3. IPTU e Taxas Vencidos
  startY = (doc as any).lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text(`3. IPTU e Tributos Imobiliários Vencidos (${data.iptuVencidos.length})`, 14, startY)

  const iptuRows = data.iptuVencidos.map((t) => [
    t.imovelNome,
    TIPO_IPTU_LABELS[t.tipo] || t.tipo,
    t.descricao,
    formatDate(t.vencimento),
    `${t.diasAtraso} dia(s)`,
    formatCurrency(t.valor),
  ])

  if (iptuRows.length === 0) {
    iptuRows.push(['Nenhum IPTU vencido', '—', '—', '—', '—', 'R$ 0,00'])
  }

  autoTable(doc, {
    startY: startY + 3,
    head: [['Imóvel', 'Tipo Obrigação', 'Descrição', 'Vencimento', 'Atraso', 'Valor Devido (R$)']],
    body: iptuRows,
    theme: 'striped',
    headStyles: {
      fillColor: [180, 83, 9], // Amber dark
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      4: { halign: 'center', textColor: [185, 28, 28], fontStyle: 'bold' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
  })

  addPdfFooter(doc)
  doc.save(`Relatorio_Inadimplencia_Holding_Aguiar_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function exportarRelatorioInadimplenciaExcel(data: RelatorioInadimplenciaParams) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Receitas Atraso
  const recRows = [
    ['RECEITAS EM ATRASO — HOLDING AGUIAR'],
    [`Período: ${data.periodoLabel}`],
    [`Filtro Imóvel: ${data.imovelFilterLabel}`],
    [],
    [
      'Imóvel',
      'Inquilino',
      'Descrição',
      'Data Vencimento',
      'Dias em Atraso',
      'Valor Previsto (R$)',
    ],
    ...data.receitasEmAtraso.map((r) => [
      r.imovelNome,
      r.inquilinoNome,
      r.descricao,
      r.dataVencimento,
      r.diasAtraso,
      r.valor,
    ]),
  ]
  const wsRec = XLSX.utils.aoa_to_sheet(recRows)
  XLSX.utils.book_append_sheet(wb, wsRec, 'Receitas em Atraso')

  // Sheet 2: Despesas Atraso
  const despRows = [
    ['DESPESAS EM ATRASO — HOLDING AGUIAR'],
    [`Período: ${data.periodoLabel}`],
    [],
    [
      'Imóvel',
      'Fornecedor',
      'Descrição',
      'Data Vencimento',
      'Dias em Atraso',
      'Valor Previsto (R$)',
    ],
    ...data.despesasEmAtraso.map((d) => [
      d.imovelNome,
      d.fornecedorNome,
      d.descricao,
      d.dataVencimento,
      d.diasAtraso,
      d.valor,
    ]),
  ]
  const wsDesp = XLSX.utils.aoa_to_sheet(despRows)
  XLSX.utils.book_append_sheet(wb, wsDesp, 'Despesas em Atraso')

  // Sheet 3: IPTU Vencido
  const iptuRows = [
    ['IPTU E TAXAS VENCIDAS — HOLDING AGUIAR'],
    [`Período: ${data.periodoLabel}`],
    [],
    ['Imóvel', 'Tipo', 'Descrição', 'Data Vencimento', 'Dias em Atraso', 'Valor Devido (R$)'],
    ...data.iptuVencidos.map((i) => [
      i.imovelNome,
      TIPO_IPTU_LABELS[i.tipo] || i.tipo,
      i.descricao,
      i.vencimento,
      i.diasAtraso,
      i.valor,
    ]),
  ]
  const wsIptu = XLSX.utils.aoa_to_sheet(iptuRows)
  XLSX.utils.book_append_sheet(wb, wsIptu, 'IPTU Vencido')

  XLSX.writeFile(
    wb,
    `Relatorio_Inadimplencia_Holding_Aguiar_${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}
