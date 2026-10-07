import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Teste de fumaça do gerador de relatórios (FIN-03): cada um dos quatro modelos precisa
 * sair em PDF (cabeçalho "%PDF") e em Excel (assinatura zip "PK"), com dados mínimos.
 * Na versão anterior os quatro PDFs quebravam com "autoTable is not a function" e
 * ninguém percebia porque não havia teste.
 */

interface Saida {
  nome: string
  bytes: Uint8Array
}
let saida: Saida | null = null

vi.mock('xlsx', async (importOriginal) => {
  const real = await importOriginal<typeof import('xlsx')>()
  return {
    ...real,
    writeFile: vi.fn((wb: import('xlsx').WorkBook, nome: string) => {
      saida = {
        nome,
        bytes: new Uint8Array(real.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer),
      }
    }),
  }
})

vi.mock('jspdf', async (importOriginal) => {
  const real = await importOriginal<typeof import('jspdf')>()
  // `save` é criado dentro do construtor do jsPDF; em vez de baixar o arquivo, capturamos os bytes.
  class JsPdfCapturando extends real.jsPDF {
    constructor(...args: ConstructorParameters<typeof real.jsPDF>) {
      super(...args)
      const capturar = (nome?: string) => {
        saida = { nome: nome ?? '', bytes: new Uint8Array(this.output('arraybuffer')) }
        return this
      }
      this.save = capturar as unknown as typeof this.save
    }
  }
  return { ...real, jsPDF: JsPdfCapturando }
})

import {
  exportarRelatorioContratosExcel,
  exportarRelatorioContratosPDF,
  exportarRelatorioFinanceiroExcel,
  exportarRelatorioFinanceiroPDF,
  exportarRelatorioImoveisExcel,
  exportarRelatorioImoveisPDF,
  exportarRelatorioInadimplenciaExcel,
  exportarRelatorioInadimplenciaPDF,
} from '../reports-generator'

const financeiro = {
  periodoLabel: 'Ano Atual (2026)',
  startDateStr: '2026-01-01',
  endDateStr: '2026-12-31',
  imovelFilterLabel: 'Todos os Imóveis',
  kpis: {
    receitasRecebidas: 12350,
    despesasPagas: 1900,
    resultadoLiquido: 10450,
    receitasPendentes: 2250,
    receitasVencidas: 7300,
    despesasPendentes: 650,
    despesasVencidas: 350,
  },
  imoveisSummary: [
    { nome: 'Apartamento Centro', codigo: 'AP01', receitas: 5600, despesas: 480, resultado: 5120 },
  ],
}

const imoveis = {
  periodoLabel: 'Geral',
  statusFilterLabel: 'Todos',
  tipoFilterLabel: 'Todos',
  kpis: {
    total: 1,
    alugados: 1,
    vagos: 0,
    manutencao: 0,
    inativos: 0,
    taxaOcupacao: 100,
    receitaTotal: 5600,
    despesaTotal: 480,
    resultado: 5120,
  },
  imoveisDetalhados: [
    {
      nome: 'Apartamento Centro',
      codigo: 'AP01',
      tipo: 'apartamento',
      status: 'alugado',
      receitas: 5600,
      despesas: 480,
      resultado: 5120,
      contratoAtivo: '001/2026',
      inquilinoNome: 'João da Silva',
      iptuPendente: 0,
    },
  ],
}

const contratos = {
  periodoLabel: 'Geral',
  statusFilterLabel: 'Todos',
  imovelFilterLabel: 'Todos os Imóveis',
  contratos: [
    {
      numero: '001/2026',
      imovelNome: 'Apartamento Centro',
      inquilinoNome: 'João da Silva',
      dataInicio: '2026-01-01',
      dataFim: '2027-01-01',
      valorAluguel: 2800,
      status: 'ativo',
      diasRestantes: 86,
      indiceReajuste: 'IGPM',
      proximoReajuste: '2027-01-01',
    },
  ],
}

const inadimplencia = {
  periodoLabel: 'Geral',
  imovelFilterLabel: 'Todos os Imóveis',
  receitasEmAtraso: [
    {
      imovelNome: 'Sala 01',
      inquilinoNome: 'Padaria Pão Quente',
      descricao: 'Aluguel 2026-09',
      dataVencimento: '2026-09-10',
      diasAtraso: 26,
      valor: 4500,
    },
  ],
  despesasEmAtraso: [
    {
      imovelNome: 'Apartamento Centro',
      fornecedorNome: 'Eletricista',
      descricao: 'Revisão do quadro de luz',
      dataVencimento: '2026-10-01',
      diasAtraso: 5,
      valor: 350,
    },
  ],
  iptuVencidos: [
    {
      imovelNome: 'Apartamento Centro',
      descricao: 'IPTU 2026',
      tipo: 'iptu',
      vencimento: '2026-09-06',
      diasAtraso: 30,
      valor: 1890,
    },
  ],
}

const texto = (b: Uint8Array, n: number) => String.fromCharCode(...b.slice(0, n))

afterEach(() => {
  saida = null
})

const modelosPdf: [string, () => Promise<void>][] = [
  ['financeiro', () => exportarRelatorioFinanceiroPDF(financeiro)],
  ['imóveis', () => exportarRelatorioImoveisPDF(imoveis)],
  ['contratos', () => exportarRelatorioContratosPDF(contratos)],
  ['inadimplência', () => exportarRelatorioInadimplenciaPDF(inadimplencia)],
]

const modelosExcel: [string, () => Promise<void>][] = [
  ['financeiro', () => exportarRelatorioFinanceiroExcel(financeiro)],
  ['imóveis', () => exportarRelatorioImoveisExcel(imoveis)],
  ['contratos', () => exportarRelatorioContratosExcel(contratos)],
  ['inadimplência', () => exportarRelatorioInadimplenciaExcel(inadimplencia)],
]

describe('gerador de relatórios', () => {
  it.each(modelosPdf)('PDF de %s sai com cabeçalho %PDF e conteúdo', async (_nome, gerar) => {
    await gerar()
    expect(saida).not.toBeNull()
    expect(saida!.nome).toMatch(/^Relatorio_\w+_Holding_Aguiar_\d{4}-\d{2}-\d{2}\.pdf$/)
    expect(saida!.bytes.length).toBeGreaterThan(1000)
    expect(texto(saida!.bytes, 5)).toBe('%PDF-')
  })

  it.each(modelosExcel)('Excel de %s sai como arquivo zip (PK)', async (_nome, gerar) => {
    await gerar()
    expect(saida).not.toBeNull()
    expect(saida!.nome).toMatch(/\.xlsx$/)
    expect(saida!.bytes.length).toBeGreaterThan(500)
    expect(texto(saida!.bytes, 2)).toBe('PK')
  })

  it('o PDF financeiro cresce quando há tabelas (autoTable realmente desenhou)', async () => {
    await exportarRelatorioFinanceiroPDF({ ...financeiro, imoveisSummary: [] })
    const vazio = saida!.bytes.length
    await exportarRelatorioFinanceiroPDF(financeiro)
    expect(saida!.bytes.length).toBeGreaterThan(vazio)
  })
})
