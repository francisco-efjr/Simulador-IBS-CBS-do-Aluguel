import { describe, expect, it } from 'vitest'
import {
  calculateSimilarity,
  decodificarArquivo,
  decodificarEntidades,
  interpretarData,
  interpretarNumero,
  lerCSV,
  lerOFX,
  levenshteinDistance,
  parseCSV,
  parseOFX,
  TAMANHO_MAXIMO_COMPARACAO,
} from '../extratos-engine'

describe('interpretarNumero', () => {
  it.each([
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['12,5', 12.5],
    ['-123.45', -123.45],
    ['(50,00)', -50],
    ['R$ 2.500,00', 2500],
    ['2.500,00 D', -2500],
    ['1.234.567', 1234567],
    ['1,234,567', 1234567],
  ])('%s vira %d', (texto, esperado) => {
    expect(interpretarNumero(texto, { pontoUnicoEhMilhar: true })).toBe(esperado)
  })

  it('"1.234" é milhar em arquivo brasileiro, mas decimal quando o arquivo usa ponto decimal', () => {
    expect(interpretarNumero('1.234', { pontoUnicoEhMilhar: true })).toBe(1234)
    expect(interpretarNumero('1.234', { pontoUnicoEhMilhar: false })).toBe(1.23)
    expect(interpretarNumero('45.90', { pontoUnicoEhMilhar: true })).toBe(45.9)
  })

  it('texto e grupos malformados não viram número', () => {
    expect(interpretarNumero('abc')).toBeNull()
    expect(interpretarNumero('')).toBeNull()
    expect(interpretarNumero('1.2.3')).toBeNull()
    expect(interpretarNumero('--')).toBeNull()
  })
})

describe('interpretarData', () => {
  it('aceita formatos brasileiros e ISO', () => {
    expect(interpretarData('05/10/2026')).toBe('2026-10-05')
    expect(interpretarData('5-1-26')).toBe('2026-01-05')
    expect(interpretarData('2026-10-05')).toBe('2026-10-05')
    expect(interpretarData('29/02/2028')).toBe('2028-02-29')
  })

  it('não "conserta" data impossível: 31/02 e mês 13 são recusados', () => {
    expect(interpretarData('31/02/2026')).toBeNull()
    expect(interpretarData('29/02/2027')).toBeNull()
    expect(interpretarData('12/31/2026')).toBeNull() // mm/dd não é adivinhado
    expect(interpretarData('2026-13-01')).toBeNull()
    expect(interpretarData('')).toBeNull()
  })
})

describe('decodificarArquivo', () => {
  it('lê UTF-8 sem corromper acentos e tira o BOM', () => {
    const bytes = new TextEncoder().encode('﻿PIX RECEBIDO JOÃO CONCEIÇÃO')
    expect(decodificarArquivo(bytes.buffer as ArrayBuffer)).toBe('PIX RECEBIDO JOÃO CONCEIÇÃO')
  })

  it('cai para windows-1252 quando o arquivo é Latin-1', () => {
    // "JOÃO" em Latin-1: J O Ã(0xC3) O
    const latin1 = new Uint8Array([0x4a, 0x4f, 0xc3, 0x4f])
    expect(decodificarArquivo(latin1.buffer as ArrayBuffer)).toBe('JOÃO')
  })
})

describe('decodificarEntidades', () => {
  it('decodifica as entidades comuns e ignora códigos absurdos', () => {
    expect(decodificarEntidades('JOÃO &amp; FILHOS &lt;ME&gt; &#233;')).toBe('JOÃO & FILHOS <ME> é')
    expect(decodificarEntidades('x &#99999999; y')).toBe('x &#99999999; y')
  })
})

describe('lerCSV: cabeçalho', () => {
  it('CSV sem cabeçalho não perde a primeira transação', () => {
    const csv = [
      '05/10/2026;PIX RECEBIDO JOAO DA SILVA;2.800,00',
      '06/10/2026;CONDOMINIO SALA 01;-650,00',
      '07/10/2026;TARIFA BANCARIA;-29,90',
    ].join('\n')
    const r = lerCSV(csv)
    expect(r.semCabecalho).toBe(true)
    expect(r.transacoes).toHaveLength(3)
    expect(r.transacoes[0]).toMatchObject({ data: '2026-10-05', valor: 2800, tipo: 'credito' })
    expect(r.rejeitadas).toHaveLength(0)
  })

  it('CSV com cabeçalho continua usando as colunas pelo nome', () => {
    const csv = ['Data;Histórico;Valor', '05/10/2026;PIX RECEBIDO;100,00'].join('\n')
    const r = lerCSV(csv)
    expect(r.semCabecalho).toBe(false)
    expect(r.transacoes).toHaveLength(1)
  })

  it('arquivo com uma única transação e sem cabeçalho também é lido', () => {
    expect(parseCSV('05/10/2026;ALUGUEL;1.500,00')).toHaveLength(1)
  })
})

describe('lerCSV: valores', () => {
  const cab = 'Data;Descrição;Valor\n'

  it('"1.234" e "1.234.567" são milhares, não 1,23', () => {
    const r = lerCSV(cab + '05/10/2026;ALUGUEL A;1.234\n06/10/2026;VENDA;1.234.567\n07/10/2026;X;1.234,56')
    expect(r.transacoes.map((t) => t.valor)).toEqual([1234, 1234567, 1234.56])
  })

  it('arquivo com ponto decimal mantém "45.90" como 45,90', () => {
    const r = lerCSV(cab + '05/10/2026;A;45.90\n06/10/2026;B;1.234.56')
    expect(r.transacoes[0].valor).toBe(45.9)
    expect(r.rejeitadas).toHaveLength(1)
  })

  it('coluna de débito e crédito separadas', () => {
    const r = lerCSV('Data;Histórico;Débito;Crédito\n05/10/2026;PIX;;2.800,00\n06/10/2026;LUZ;120,00;')
    expect(r.transacoes.map((t) => [t.tipo, t.valor])).toEqual([
      ['credito', 2800],
      ['debito', 120],
    ])
  })
})

describe('lerCSV: entrada x saída', () => {
  it('"Estorno de tarifa" positivo continua crédito em arquivo com sinais', () => {
    const csv = [
      'Data;Descrição;Valor',
      '05/10/2026;TARIFA BANCARIA;-29,90',
      '06/10/2026;Estorno de tarifa bancária;29,90',
      '07/10/2026;Compra cartão estorno;45,00',
    ].join('\n')
    const r = lerCSV(csv)
    expect(r.transacoes.map((t) => t.tipo)).toEqual(['debito', 'credito', 'credito'])
  })

  it('arquivo sem sinais: a palavra da descrição desempata, e "estorno" ganha de "tarifa"', () => {
    const csv = [
      'Data;Descrição;Valor',
      '05/10/2026;TARIFA BANCARIA;29,90',
      '06/10/2026;Estorno de tarifa bancária;29,90',
      '07/10/2026;PIX RECEBIDO JOAO;2.800,00',
    ].join('\n')
    const r = lerCSV(csv)
    expect(r.transacoes.map((t) => t.tipo)).toEqual(['debito', 'credito', 'credito'])
  })

  it('coluna de tipo explícita vale mais que a descrição', () => {
    const csv = ['Data;Descrição;Valor;Tipo', '05/10/2026;Tarifa de TED;29,90;C'].join('\n')
    expect(lerCSV(csv).transacoes[0].tipo).toBe('credito')
  })
})

describe('lerCSV: linhas rejeitadas são contadas, não descartadas em silêncio', () => {
  it('data impossível, mm/dd, valor zero, valor com texto e sem valor', () => {
    const csv = [
      'Data;Descrição;Valor',
      '05/10/2026;OK;100,00',
      '31/02/2026;DATA IMPOSSIVEL;50,00',
      '12/31/2026;MES DIA TROCADO;50,00',
      '06/10/2026;VALOR ZERO;0,00',
      '06/10/2026;VALOR TEXTO;abc',
      '06/10/2026;SEM VALOR;',
      '06/10/2026',
    ].join('\n')
    const r = lerCSV(csv)
    expect(r.transacoes).toHaveLength(1)
    expect(r.rejeitadas).toHaveLength(6)
    expect(r.rejeitadas.map((l) => l.linha)).toEqual([3, 4, 5, 6, 7, 8])
    const motivos = r.rejeitadas.map((l) => l.motivo)
    expect(motivos[0]).toMatch(/Data inválida/)
    expect(motivos[1]).toMatch(/Data inválida/)
    expect(motivos[2]).toBe('Valor zerado')
    expect(motivos[3]).toMatch(/Valor ilegível/)
    expect(motivos[4]).toBe('Sem valor')
    expect(motivos[5]).toBe('Linha com colunas faltando')
    expect(r.rejeitadas[0].conteudo).toContain('DATA IMPOSSIVEL')
  })

  it('o número da linha considera as linhas em branco do arquivo', () => {
    const r = lerCSV('Data;Descrição;Valor\n\n\n31/02/2026;X;10,00')
    expect(r.rejeitadas[0].linha).toBe(4)
  })
})

describe('lerOFX', () => {
  const ofx = (blocos: string) =>
    `OFXHEADER:100\nCHARSET:1252\n<OFX><BANKTRANLIST>${blocos}</BANKTRANLIST></OFX>`

  it('decodifica &amp; no nome', () => {
    const r = lerOFX(
      ofx(
        '<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261005120000<TRNAMT>100.00<FITID>1<NAME>JOAO &amp; FILHOS</STMTTRN>',
      ),
    )
    expect(r.transacoes[0].descricao).toContain('JOAO & FILHOS')
    expect(r.transacoes[0].descricao).not.toContain('&amp;')
  })

  it('o sinal de TRNAMT manda: CREDIT com valor negativo é débito', () => {
    const r = lerOFX(
      ofx('<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261005<TRNAMT>-80.00<FITID>1<MEMO>X</STMTTRN>'),
    )
    expect(r.transacoes[0]).toMatchObject({ tipo: 'debito', valor: 80 })
  })

  it('lê "1,234.56" como 1234,56', () => {
    const r = lerOFX(ofx('<STMTTRN><DTPOSTED>20261005<TRNAMT>1,234.56<MEMO>X</STMTTRN>'))
    expect(r.transacoes[0].valor).toBe(1234.56)
  })

  it('data impossível, texto e mês 13 viram linhas rejeitadas com motivo', () => {
    const r = lerOFX(
      ofx(
        [
          '<STMTTRN><DTPOSTED>20261005<TRNAMT>10.00<MEMO>OK</STMTTRN>',
          '<STMTTRN><DTPOSTED>ABCDEFGH<TRNAMT>10.00<MEMO>TEXTO</STMTTRN>',
          '<STMTTRN><DTPOSTED>20261301<TRNAMT>10.00<MEMO>MES13</STMTTRN>',
          '<STMTTRN><DTPOSTED>20260231<TRNAMT>10.00<MEMO>FEV31</STMTTRN>',
          '<STMTTRN><DTPOSTED>20261005<TRNAMT>0.00<MEMO>ZERO</STMTTRN>',
          '<STMTTRN><DTPOSTED>20261005<MEMO>SEMVALOR</STMTTRN>',
        ].join(''),
      ),
    )
    expect(r.transacoes).toHaveLength(1)
    expect(r.rejeitadas).toHaveLength(5)
    expect(r.rejeitadas[0].motivo).toMatch(/Data inválida/)
    expect(r.rejeitadas[3].motivo).toBe('Valor zerado')
    expect(r.rejeitadas[4].motivo).toBe('Sem data ou sem valor')
  })

  it('OFX 1.x sem tags de fechamento também é lido (parseOFX mantém a assinatura antiga)', () => {
    const txt =
      '<OFX><STMTTRN><DTPOSTED>20261005<TRNAMT>10.00<MEMO>A<STMTTRN><DTPOSTED>20261006<TRNAMT>-5.00<MEMO>B</OFX>'
    expect(parseOFX(txt)).toHaveLength(2)
  })
})

describe('robustez (SEG-13)', () => {
  it('Levenshtein de textos gigantes termina rápido e respeita o teto', () => {
    const a = 'a'.repeat(12000)
    const b = 'b'.repeat(12000)
    const inicio = Date.now()
    const d = levenshteinDistance(a, b)
    expect(Date.now() - inicio).toBeLessThan(1000)
    expect(d).toBe(TAMANHO_MAXIMO_COMPARACAO)
  })

  it('calculateSimilarity não trava com descrição enorme', () => {
    const inicio = Date.now()
    const s = calculateSimilarity('x'.repeat(50000) + ' pix', 'y'.repeat(50000) + ' ted')
    expect(Date.now() - inicio).toBeLessThan(1000)
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(1)
  })

  it('OFX gigante sem fechar tag e CSV de uma linha só terminam sem travar', () => {
    const inicio = Date.now()
    parseOFX('<STMTTRN><DTPOSTED>20261005<TRNAMT>1.00'.repeat(20000))
    parseCSV('a;'.repeat(200000))
    expect(Date.now() - inicio).toBeLessThan(3000)
  })
})
