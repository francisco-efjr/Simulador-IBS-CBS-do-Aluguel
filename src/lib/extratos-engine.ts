/**
 * Engine and utilities for:
 * 1. Text normalization & string similarity
 * 2. Parsing OFX files
 * 3. Parsing CSV files from various Brazilian & International banks (Itaú, Bradesco, Nubank, Inter, Santander, BB, etc.)
 * 4. Duplicate transaction detection with fuzzy match
 * 5. Suggestion engine based on classification history & property/category catalogs
 */

export interface ParsedTransaction {
  id?: string
  data: string // YYYY-MM-DD
  descricao: string
  valor: number // absolute positive number
  tipo: 'credito' | 'debito'
  saldo?: number
  duplicata_detectada?: boolean
  duplicata_motivo?: string
  duplicata_ids?: string[]
  // Suggestion fields
  sugestao_tipo?: 'receita' | 'despesa'
  sugestao_categoria?: string
  sugestao_categoria_id?: string
  sugestao_imovel?: string
  sugestao_imovel_id?: string
  sugestao_confianca?: number
  sugestao_origem?: string
  // Selection/state during import
  incluir?: boolean
}

/**
 * Normalizes text: lowercase, removes accents, removes non-alphanumeric (keeps spaces), collapses whitespace
 */
export function normalizeText(str: string): string {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim()
}

/**
 * Cleans descriptions specifically for financial comparison:
 * Strips common transaction prefixes/suffixes (PIX, TED, DOC, COMPRA, PAGTO, TRANSF, dates, document numbers)
 */
export function normalizeDescriptionForMatching(str: string): string {
  let text = normalizeText(str)
  // Remove dates in DD/MM, DDMM, etc.
  text = text.replace(/\b\d{2}[/-]?\d{2}([/-]?\d{2,4})?\b/g, '')
  // Remove reference codes like "E2E...", "DOC 123", "AG 1234", "CC 5678"
  text = text.replace(
    /\b(e2e|doc|ted|pix|ag|cc|aut|tar|pgto|pagto|transf|ted|cheq|dep|compra)\b/g,
    '',
  )
  // Remove long number sequences (CPF, CNPJ, transaction IDs)
  text = text.replace(/\b\d{4,}\b/g, '')
  // Trim and collapse again
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  // Teto: a tabela cresce com o produto dos tamanhos; texto enorme travaria a aba.
  const x = a.slice(0, TAMANHO_MAXIMO_COMPARACAO)
  const y = b.slice(0, TAMANHO_MAXIMO_COMPARACAO)
  const m = x.length
  const n = y.length

  let anterior = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const atual = [i]
    for (let j = 1; j <= n; j++) {
      atual[j] =
        x[i - 1] === y[j - 1]
          ? anterior[j - 1]
          : 1 + Math.min(anterior[j], atual[j - 1], anterior[j - 1])
    }
    anterior = atual
  }
  return anterior[n]
}

/**
 * Similarity ratio between 0 and 1
 */
export function calculateSimilarity(s1: string, s2: string): number {
  // Corta antes de normalizar: a comparação nunca precisa de mais que isso.
  const n1 = normalizeDescriptionForMatching(s1.slice(0, TAMANHO_MAXIMO_COMPARACAO * 2)).slice(
    0,
    TAMANHO_MAXIMO_COMPARACAO,
  )
  const n2 = normalizeDescriptionForMatching(s2.slice(0, TAMANHO_MAXIMO_COMPARACAO * 2)).slice(
    0,
    TAMANHO_MAXIMO_COMPARACAO,
  )

  if (!n1 && !n2) return 1.0
  if (!n1 || !n2) return 0.0
  if (n1 === n2) return 1.0

  // If one contains the other and length > 3
  if (n1.length > 3 && n2.length > 3) {
    if (n1.includes(n2) || n2.includes(n1)) {
      return 0.85
    }
  }

  // Jaccard token overlap
  const tokens1 = new Set(n1.split(' ').filter((t) => t.length > 1))
  const tokens2 = new Set(n2.split(' ').filter((t) => t.length > 1))
  if (tokens1.size > 0 && tokens2.size > 0) {
    let intersection = 0
    tokens1.forEach((t) => {
      if (tokens2.has(t)) intersection++
    })
    const union = new Set([...tokens1, ...tokens2]).size
    const tokenScore = union > 0 ? intersection / union : 0
    if (tokenScore >= 0.7) return tokenScore
  }

  const maxLen = Math.max(n1.length, n2.length)
  if (maxLen === 0) return 1.0
  const dist = levenshteinDistance(n1, n2)
  return Math.max(0, 1 - dist / maxLen)
}

// ---------------------------------------------------------------------------
// Leitura de arquivo: decodificação, números, datas e linhas rejeitadas
// ---------------------------------------------------------------------------

/** Tamanho máximo aceito para um extrato (5 MB): maior que isso trava a aba e não é extrato. */
export const TAMANHO_MAXIMO_EXTRATO_BYTES = 5 * 1024 * 1024

/** Descrições maiores que isso são cortadas antes de comparar (evita Levenshtein quadrático). */
export const TAMANHO_MAXIMO_COMPARACAO = 200

/** Linha do arquivo que não virou transação, com o motivo, para mostrar à pessoa. */
export interface LinhaRejeitada {
  /** Número da linha no arquivo (começando em 1). */
  linha: number
  /** Trecho da linha original (cortado em 120 caracteres). */
  conteudo: string
  motivo: string
}

export interface ResultadoLeitura {
  transacoes: ParsedTransaction[]
  rejeitadas: LinhaRejeitada[]
  /** CSV sem linha de cabeçalho: colunas assumidas como Data, Descrição, Valor. */
  semCabecalho: boolean
}

const trecho = (s: string) => (s.length > 120 ? `${s.slice(0, 120)}…` : s)

/**
 * Converte os bytes do arquivo em texto. Tenta UTF-8 (estrito); se o arquivo não for UTF-8
 * válido (bancos antigos gravam Latin-1/Windows-1252), cai para windows-1252. Remove o BOM.
 */
export function decodificarArquivo(buffer: ArrayBuffer): string {
  let texto: string
  try {
    texto = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    texto = new TextDecoder('windows-1252').decode(buffer)
  }
  return texto.replace(/^﻿/, '')
}

const codigoParaTexto = (n: number) => (n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '')

/** Decodifica as entidades XML/HTML que aparecem em OFX ("JOÃO &amp; FILHOS"). */
export function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&#(\d{1,7});/g, (_, n: string) => codigoParaTexto(Number(n)))
    .replace(/&#x([0-9a-f]{1,6});/gi, (_, n: string) => codigoParaTexto(parseInt(n, 16)))
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
}

/** Data AAAA-MM-DD existe no calendário? (31/02 não existe.) */
export function dataExiste(ano: number, mes: number, dia: number): boolean {
  if (ano < 1900 || ano > 2100 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return false
  const d = new Date(Date.UTC(ano, mes - 1, dia))
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia
}

const aaaaMmDd = (ano: number, mes: number, dia: number) =>
  `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

/**
 * Lê data de extrato. Aceita DD/MM/AAAA (também com - ou .), DD/MM/AA e AAAA-MM-DD.
 * Devolve null quando a data não existe (31/02, mês 13): quem chama rejeita a linha
 * em vez de "consertar" a data em silêncio. Nunca inverte dia e mês.
 */
export function interpretarData(raw: string): string | null {
  if (!raw) return null
  const limpo = raw.replace(/[^\d/\-.]/g, '')

  const br = limpo.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})$/)
  if (br) {
    const ano = br[3].length === 2 ? 2000 + Number(br[3]) : Number(br[3])
    const mes = Number(br[2])
    const dia = Number(br[1])
    return dataExiste(ano, mes, dia) ? aaaaMmDd(ano, mes, dia) : null
  }

  const iso = limpo.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (iso) {
    const ano = Number(iso[1])
    const mes = Number(iso[2])
    const dia = Number(iso[3])
    return dataExiste(ano, mes, dia) ? aaaaMmDd(ano, mes, dia) : null
  }
  return null
}

export interface OpcoesNumero {
  /**
   * "1.234" (um ponto e exatamente 3 dígitos depois) é milhar? Em extrato brasileiro, sim,
   * salvo se o resto do arquivo usa ponto como decimal. No OFX o ponto é sempre decimal.
   */
  pontoUnicoEhMilhar?: boolean
}

/**
 * Lê valor monetário de extrato: "1.234,56", "1,234.56", "-123.45", "(50,00)", "1.234",
 * "1.234.567", "R$ 2.500,00 D". Devolve null quando não é número (nunca chuta).
 */
export function interpretarNumero(raw: string, opcoes: OpcoesNumero = {}): number | null {
  if (!raw) return null
  const original = raw.replace(/\s+/g, '').replace(/R\$/gi, '')
  if (!original) return null

  const negativo =
    original.includes('-') || /D$/i.test(original) || /^D-/i.test(original) || original.includes('(')
  let s = original.replace(/[^0-9,.]/g, '')
  if (!/\d/.test(s)) return null

  const temPonto = s.includes('.')
  const temVirgula = s.includes(',')

  if (temPonto && temVirgula) {
    // O último separador é o decimal; o outro é milhar.
    if (s.lastIndexOf('.') < s.lastIndexOf(',')) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (temVirgula) {
    const virgulas = s.split(',').length - 1
    if (virgulas > 1) {
      // 1,234,567 (estilo americano): só milhar, se todos os grupos tiverem 3 dígitos.
      const grupos = s.split(',')
      if (!grupos.slice(1).every((g) => g.length === 3)) return null
      s = grupos.join('')
    } else {
      s = s.replace(',', '.')
    }
  } else if (temPonto) {
    const grupos = s.split('.')
    if (grupos.length > 2) {
      // 1.234.567: só milhar, se todos os grupos depois do primeiro tiverem 3 dígitos.
      if (!grupos.slice(1).every((g) => g.length === 3)) return null
      s = grupos.join('')
    } else if (opcoes.pontoUnicoEhMilhar && grupos[1].length === 3 && grupos[0].length <= 3) {
      s = grupos.join('')
    }
  }

  const val = Number(s)
  if (!Number.isFinite(val)) return null
  const centavos = Math.round(val * 100) / 100
  return negativo ? -Math.abs(centavos) : centavos
}

/** Mesmo valor "ainda negativo" mesmo sendo zero? Zero é tratado como valor ausente. */
const temMarcaDeNegativo = (raw: string) =>
  raw.includes('-') || /D$/i.test(raw.trim()) || /^D-/i.test(raw.trim()) || raw.includes('(')

/**
 * Lê o conteúdo de um arquivo OFX. Linhas que não viram transação (sem data/valor, data
 * impossível, valor zero ou ilegível) vão para `rejeitadas` com o motivo.
 */
export function lerOFX(content: string): ResultadoLeitura {
  const transacoes: ParsedTransaction[] = []
  const rejeitadas: LinhaRejeitada[] = []

  // Extrai os blocos STMTTRN (com ou sem tag de fechamento: OFX 1.x costuma não fechar)
  let blocks: string[] = []
  if (/<\/STMTTRN>/i.test(content)) {
    const stmttrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
    let match: RegExpExecArray | null
    while ((match = stmttrnRegex.exec(content)) !== null) blocks.push(match[1])
  } else {
    const parts = content.split(/<STMTTRN>/i)
    blocks = parts.slice(1).map((p) => p.split(/<STMTTRN>|<BANKTRANLIST>|<\/BANKTRANLIST>/i)[0])
  }

  const getTagValue = (block: string, tag: string): string => {
    const m = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i').exec(block)
    return m ? decodificarEntidades(m[1].trim()) : ''
  }

  blocks.forEach((block, idx) => {
    const numero = idx + 1
    const rotulo = `Transação ${numero} do OFX`
    const dtpostedRaw = getTagValue(block, 'DTPOSTED')
    const trnamtRaw = getTagValue(block, 'TRNAMT')
    const fitid = getTagValue(block, 'FITID')
    const memo = getTagValue(block, 'MEMO')
    const name = getTagValue(block, 'NAME')
    const resumo = trecho([name, memo, dtpostedRaw, trnamtRaw].filter(Boolean).join(' | '))

    if (!dtpostedRaw || !trnamtRaw) {
      rejeitadas.push({ linha: numero, conteudo: resumo || rotulo, motivo: 'Sem data ou sem valor' })
      return
    }

    // Data OFX: AAAAMMDD[HHMMSS...]
    const dm = dtpostedRaw.match(/^(\d{4})(\d{2})(\d{2})/)
    const dateFormatted = dm ? interpretarData(`${dm[1]}-${dm[2]}-${dm[3]}`) : null
    if (!dateFormatted) {
      rejeitadas.push({
        linha: numero,
        conteudo: resumo,
        motivo: `Data inválida (${trecho(dtpostedRaw)})`,
      })
      return
    }

    // O sinal de TRNAMT manda: negativo = débito, positivo = crédito (TRNTYPE só é conferido).
    const numAmt = interpretarNumero(trnamtRaw)
    if (numAmt === null) {
      rejeitadas.push({
        linha: numero,
        conteudo: resumo,
        motivo: `Valor ilegível (${trecho(trnamtRaw)})`,
      })
      return
    }
    if (numAmt === 0) {
      rejeitadas.push({ linha: numero, conteudo: resumo, motivo: 'Valor zerado' })
      return
    }

    const descricao =
      [name, memo, fitid ? `ID:${fitid}` : '']
        .filter(Boolean)
        .join(' - ')
        .replace(/\s+/g, ' ')
        .trim() || 'Transação OFX'

    transacoes.push({
      data: dateFormatted,
      descricao,
      valor: Math.abs(numAmt),
      tipo: numAmt > 0 ? 'credito' : 'debito',
      incluir: true,
    })
  })

  return { transacoes, rejeitadas, semCabecalho: false }
}

/** Compatível com o uso antigo: só as transações lidas. */
export function parseOFX(content: string): ParsedTransaction[] {
  return lerOFX(content).transacoes
}

/**
 * Lê um CSV com detecção de delimitador, cabeçalho e colunas. Linhas que não viram transação
 * vão para `rejeitadas` com o motivo (nada some em silêncio).
 */
export function lerCSV(content: string): ResultadoLeitura {
  const rejeitadas: LinhaRejeitada[] = []

  // Mantém o número da linha original para apontar o problema à pessoa.
  const linhasBrutas = content.replace(/^﻿/, '').split(/\r?\n/)
  const lines: { numero: number; texto: string }[] = []
  linhasBrutas.forEach((l, i) => {
    const t = l.trim()
    if (t.length > 0) lines.push({ numero: i + 1, texto: t })
  })

  if (lines.length === 0) return { transacoes: [], rejeitadas, semCabecalho: false }

  // Detect delimiter: evaluate semicolon, comma, tab
  const sample = lines
    .slice(0, 5)
    .map((l) => l.texto)
    .join('\n')
  const countSemicolons = (sample.match(/;/g) || []).length
  const countCommas = (sample.match(/,/g) || []).length
  const countTabs = (sample.match(/\t/g) || []).length

  let delimiter = ','
  if (countSemicolons > countCommas && countSemicolons > countTabs) {
    delimiter = ';'
  } else if (countTabs > countCommas) {
    delimiter = '\t'
  }

  // Helper to split CSV row taking quotes into account
  const splitCSVRow = (row: string, delim: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delim && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''))
    return result
  }

  // A linha parece um lançamento (tem data válida e algum número)? Então não é cabeçalho.
  const pareceLancamento = (cols: string[]) =>
    cols.some((c) => interpretarData(c) !== null) &&
    cols.some((c) => /\d/.test(c) && interpretarNumero(c) !== null && interpretarData(c) === null)

  // Find header row (usually the first row that has words like data, descri, valor, memo, historico)
  let headerIndex = -1
  let semCabecalho = true
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const rowNorm = normalizeText(lines[i].texto)
    if (
      rowNorm.includes('data') ||
      rowNorm.includes('dt') ||
      rowNorm.includes('date') ||
      rowNorm.includes('valor') ||
      rowNorm.includes('historico') ||
      rowNorm.includes('descricao') ||
      rowNorm.includes('lancamento')
    ) {
      if (!pareceLancamento(splitCSVRow(lines[i].texto, delimiter))) {
        headerIndex = i
        semCabecalho = false
      }
      break
    }
  }
  if (headerIndex === -1 && semCabecalho) {
    // Nenhuma linha de cabeçalho: se a primeira já é um lançamento, ela é dado.
    // Se não for, mantém o comportamento antigo (primeira linha é cabeçalho desconhecido).
    const primeira = splitCSVRow(lines[0].texto, delimiter)
    if (!pareceLancamento(primeira)) {
      headerIndex = 0
      semCabecalho = false
    }
  }

  const headers =
    headerIndex >= 0
      ? splitCSVRow(lines[headerIndex].texto, delimiter).map((h) => normalizeText(h))
      : splitCSVRow(lines[0].texto, delimiter).map(() => '')

  // Column mapping
  let dateCol = headers.findIndex(
    (h) => h.includes('data') || h.includes('date') || h === 'dt' || h.includes('dia'),
  )
  let descCol = headers.findIndex(
    (h) =>
      h.includes('historico') ||
      h.includes('descricao') ||
      h.includes('memo') ||
      h.includes('detalhe') ||
      h.includes('identificador') ||
      h.includes('lancamento') ||
      h.includes('transacao') ||
      h.includes('titulo'),
  )
  let valCol = headers.findIndex(
    (h) =>
      (h.includes('valor') || h.includes('amount') || h.includes('quantia')) &&
      !h.includes('saldo'),
  )
  const debitCol = headers.findIndex(
    (h) => h.includes('debito') || h.includes('saida') || h.includes('despesa'),
  )
  const creditCol = headers.findIndex(
    (h) => h.includes('credito') || h.includes('entrada') || h.includes('receita'),
  )
  const saldoCol = headers.findIndex((h) => h.includes('saldo') || h.includes('balance'))
  const typeCol = headers.findIndex(
    (h) => h.includes('tipo') || h.includes('type') || h === 'd/c' || h === 'c/d',
  )

  // Defaults if not found (arquivo sem cabeçalho: Data, Descrição, Valor)
  if (dateCol === -1) dateCol = 0
  if (descCol === -1) descCol = headers.length > 2 ? 1 : 0
  if (valCol === -1 && debitCol === -1 && creditCol === -1) {
    valCol = headers.length > 2 ? 2 : 1
  }

  const primeiraLinhaDeDados = headerIndex + 1
  const linhasDeDados = lines.slice(primeiraLinhaDeDados)

  // Contexto do arquivo para ler números ambíguos e decidir o sinal.
  const colunasDeValor = [valCol, debitCol, creditCol].filter((c) => c >= 0)
  const celulasDeValor: string[] = []
  for (const l of linhasDeDados) {
    const cols = splitCSVRow(l.texto, delimiter)
    for (const c of colunasDeValor) if (cols[c]) celulasDeValor.push(cols[c])
  }
  // Ponto decimal de verdade no arquivo: "45.90" ou "12.5" (sem vírgula, 1 ou 2 casas).
  const arquivoUsaPontoDecimal = celulasDeValor.some((c) => /^[^\d]*\d+\.\d{1,2}[^\d.,]*$/.test(c.trim()))
  const opcoesNumero: OpcoesNumero = { pontoUnicoEhMilhar: !arquivoUsaPontoDecimal }
  // Se o arquivo tem algum valor negativo na coluna de valor, o sinal é confiável.
  const arquivoTemSinal =
    valCol >= 0 &&
    linhasDeDados.some((l) => {
      const c = splitCSVRow(l.texto, delimiter)[valCol]
      return !!c && temMarcaDeNegativo(c)
    })

  const transactions: ParsedTransaction[] = []

  for (const { numero, texto } of linhasDeDados) {
    const cols = splitCSVRow(texto, delimiter)
    const rejeitar = (motivo: string) =>
      rejeitadas.push({ linha: numero, conteudo: trecho(texto), motivo })

    if (cols.length < 2) {
      rejeitar('Linha com colunas faltando')
      continue
    }

    const dataBruta = dateCol >= 0 ? cols[dateCol] : ''
    if (!dataBruta) {
      rejeitar('Sem data')
      continue
    }
    const dateStr = interpretarData(dataBruta)
    if (!dateStr) {
      rejeitar(`Data inválida (${trecho(dataBruta)}): use dia/mês/ano, como 31/12/2026`)
      continue
    }

    const descricao = (descCol >= 0 && cols[descCol] ? cols[descCol] : 'Lançamento bancário').trim()

    let valorNum = 0
    let tipo: 'credito' | 'debito' = 'credito'
    // O tipo já está definido pelo arquivo (colunas débito/crédito, coluna de tipo ou sinal)?
    let tipoDefinido = false
    let valorIlegivel = ''
    let valorEncontrado = false

    if (debitCol >= 0 && creditCol >= 0) {
      const debitLido = interpretarNumero(cols[debitCol] ?? '', opcoesNumero)
      const creditLido = interpretarNumero(cols[creditCol] ?? '', opcoesNumero)
      valorEncontrado = debitLido !== null || creditLido !== null
      const debitVal = Math.abs(debitLido ?? 0)
      const creditVal = Math.abs(creditLido ?? 0)
      if (debitVal > 0) {
        valorNum = debitVal
        tipo = 'debito'
        tipoDefinido = true
      } else if (creditVal > 0) {
        valorNum = creditVal
        tipo = 'credito'
        tipoDefinido = true
      } else if ((cols[debitCol] ?? '').trim() || (cols[creditCol] ?? '').trim()) {
        valorIlegivel = `${cols[debitCol] ?? ''} ${cols[creditCol] ?? ''}`.trim()
      }
    } else if (valCol >= 0 && cols[valCol]) {
      const parsedVal = interpretarNumero(cols[valCol], opcoesNumero)
      valorEncontrado = parsedVal !== null
      if (parsedVal === null) {
        valorIlegivel = cols[valCol]
      } else if (parsedVal < 0) {
        valorNum = Math.abs(parsedVal)
        tipo = 'debito'
        tipoDefinido = true
      } else {
        valorNum = parsedVal
        tipo = 'credito'
        tipoDefinido = arquivoTemSinal // positivo num arquivo com sinais = crédito de fato
      }
    }

    if (typeCol >= 0 && cols[typeCol]) {
      const t = normalizeText(cols[typeCol])
      if (t.includes('deb') || t.includes('saida') || t === 'd') {
        tipo = 'debito'
        tipoDefinido = true
      } else if (t.includes('cred') || t.includes('entr') || t === 'c') {
        tipo = 'credito'
        tipoDefinido = true
      }
    }

    // Palavras da descrição só desempatam quando o arquivo não diz se é entrada ou saída;
    // nunca valem contra o sinal ou contra a coluna de tipo.
    if (!tipoDefinido) {
      const descNorm = normalizeText(descricao)
      if (
        descNorm.includes('estorno') ||
        descNorm.includes('ted recebida') ||
        descNorm.includes('pix recebido') ||
        descNorm.includes('credito em conta') ||
        descNorm.includes('deposito recebido')
      ) {
        tipo = 'credito'
      } else if (
        descNorm.includes('pagamento efetuado') ||
        descNorm.includes('tarifa') ||
        descNorm.includes('deb aut') ||
        descNorm.includes('saque') ||
        descNorm.includes('compra debito') ||
        descNorm.includes('compra cartao')
      ) {
        tipo = 'debito'
      }
    }

    if (valorIlegivel) {
      rejeitar(`Valor ilegível (${trecho(valorIlegivel)})`)
      continue
    }
    if (!(valorNum > 0)) {
      rejeitar(valorEncontrado ? 'Valor zerado' : 'Sem valor')
      continue
    }

    let saldo: number | undefined
    if (saldoCol >= 0 && cols[saldoCol]) {
      const s = interpretarNumero(cols[saldoCol], opcoesNumero)
      if (s !== null) saldo = s
    }

    transactions.push({
      data: dateStr,
      descricao,
      valor: Math.abs(valorNum),
      tipo,
      saldo,
      incluir: true,
    })
  }

  return { transacoes: transactions, rejeitadas, semCabecalho }
}

/** Compatível com o uso antigo: só as transações lidas. */
export function parseCSV(content: string): ParsedTransaction[] {
  return lerCSV(content).transacoes
}

/**
 * Detects duplicates against existing transactions in the system
 * Same date + same value (+/- 0.01) + similar description (>= 0.7 similarity)
 */
export function checkDuplicates(
  newTx: ParsedTransaction,
  existingTxs: Array<{ id: string; data: string; valor: number; descricao: string; tipo: string }>,
): { isDuplicate: boolean; matchedIds: string[]; reason?: string } {
  const matchedIds: string[] = []

  for (const ext of existingTxs) {
    // Check same date
    const sameDate = ext.data.substring(0, 10) === newTx.data.substring(0, 10)
    if (!sameDate) continue

    // Check same value
    const sameValue = Math.abs(ext.valor - newTx.valor) < 0.05
    if (!sameValue) continue

    // Check same flow type (credit/debit)
    if (ext.tipo && newTx.tipo && ext.tipo !== newTx.tipo) continue

    // Check similarity
    const sim = calculateSimilarity(ext.descricao, newTx.descricao)
    if (sim >= 0.65) {
      matchedIds.push(ext.id)
    }
  }

  if (matchedIds.length > 0) {
    return {
      isDuplicate: true,
      matchedIds,
      reason: `Detectada transação existente com mesma data, valor idêntico e descrição similar (${matchedIds.length} correspondência(s))`,
    }
  }

  return { isDuplicate: false, matchedIds: [] }
}

/**
 * Suggestion engine for transactions
 * Looks up historical classifications and property/category names
 */
export function generateSuggestion(
  tx: ParsedTransaction,
  history: Array<{
    descricao: string
    categoria_classificada?: string
    sugestao_categoria?: string
    imovel_classificado?: string
    sugestao_imovel?: string
    tipo?: string
    sugestao_tipo?: string
    receita_gerada?: string
    despesa_gerada?: string
  }>,
  imoveis: Array<{ id: string; nome?: string; endereco?: string; codigo?: string }>,
  categorias: Array<{ id: string; nome: string; tipo: 'receita' | 'despesa' }>,
): {
  sugestao_tipo?: 'receita' | 'despesa'
  sugestao_categoria?: string
  sugestao_categoria_id?: string
  sugestao_imovel?: string
  sugestao_imovel_id?: string
  sugestao_confianca?: number
  sugestao_origem?: string
} {
  const descNorm = normalizeText(tx.descricao)
  const defaultType: 'receita' | 'despesa' = tx.tipo === 'credito' ? 'receita' : 'despesa'

  // 1. Search history for high similarity matches
  const matches: Array<{
    score: number
    tipo?: 'receita' | 'despesa'
    categoria?: string
    imovel?: string
  }> = []

  for (const hist of history) {
    const histDesc = hist.descricao
    if (!histDesc) continue

    const sim = calculateSimilarity(tx.descricao, histDesc)
    if (sim >= 0.6) {
      const cat = hist.categoria_classificada || hist.sugestao_categoria
      const imov = hist.imovel_classificado || hist.sugestao_imovel
      let t: 'receita' | 'despesa' | undefined = undefined
      if (hist.receita_gerada) t = 'receita'
      else if (hist.despesa_gerada) t = 'despesa'
      else if (hist.tipo === 'credito') t = 'receita'
      else if (hist.tipo === 'debito') t = 'despesa'

      matches.push({
        score: sim,
        tipo: t,
        categoria: cat,
        imovel: imov,
      })
    }
  }

  // If we have history matches, tally frequencies
  if (matches.length > 0) {
    // Sort by similarity
    matches.sort((a, b) => b.score - a.score)
    const bestMatch = matches[0]

    // Calculate confidence based on top matches agreement
    const topMatches = matches.slice(0, 5)
    let catFrequency = 0
    let imovFrequency = 0

    topMatches.forEach((m) => {
      if (m.categoria && m.categoria === bestMatch.categoria) catFrequency++
      if (m.imovel && m.imovel === bestMatch.imovel) imovFrequency++
    })

    const confidence = Math.min(
      0.98,
      bestMatch.score * 0.7 + (catFrequency / topMatches.length) * 0.3,
    )

    if (confidence >= 0.5) {
      // Resolve category ID if possible
      let catId = ''
      if (bestMatch.categoria) {
        const foundCat = categorias.find(
          (c) =>
            normalizeText(c.nome) === normalizeText(bestMatch.categoria || '') ||
            c.id === bestMatch.categoria,
        )
        if (foundCat) catId = foundCat.id
      }

      // Resolve imovel ID if possible
      let imovId = ''
      if (bestMatch.imovel) {
        const foundImov = imoveis.find(
          (im) =>
            normalizeText(im.nome || '') === normalizeText(bestMatch.imovel || '') ||
            normalizeText(im.endereco || '') === normalizeText(bestMatch.imovel || '') ||
            im.id === bestMatch.imovel,
        )
        if (foundImov) imovId = foundImov.id
      }

      return {
        sugestao_tipo: bestMatch.tipo || defaultType,
        sugestao_categoria: bestMatch.categoria,
        sugestao_categoria_id: catId,
        sugestao_imovel: bestMatch.imovel,
        sugestao_imovel_id: imovId,
        sugestao_confianca: Number(confidence.toFixed(2)),
        sugestao_origem: `Histórico (${matches.length} transação(ões) correspondente(s))`,
      }
    }
  }

  // 2. Fallback heuristic: check if description mentions any Imóvel directly
  let matchedImovel: { id: string; nome: string } | null = null
  for (const im of imoveis) {
    const imNome = normalizeText(im.nome || '')
    const imEnd = normalizeText(im.endereco || '')
    const imCod = normalizeText(im.codigo || '')

    if (
      (imNome.length > 3 && descNorm.includes(imNome)) ||
      (imEnd.length > 5 && descNorm.includes(imEnd)) ||
      (imCod.length > 2 && descNorm.includes(imCod))
    ) {
      matchedImovel = { id: im.id, nome: im.nome || im.endereco || '' }
      break
    }
  }

  // 3. Fallback heuristic: check if description mentions standard category keywords
  let matchedCategory: { id: string; nome: string; tipo: 'receita' | 'despesa' } | null = null
  for (const cat of categorias) {
    const catNorm = normalizeText(cat.nome)
    if (catNorm.length > 3 && descNorm.includes(catNorm)) {
      matchedCategory = cat
      break
    }
  }

  // Common banking keywords fallback
  if (!matchedCategory) {
    if (
      descNorm.includes('aluguel') ||
      descNorm.includes('locacao') ||
      descNorm.includes('mensalidade')
    ) {
      const aluguelCat = categorias.find(
        (c) => normalizeText(c.nome).includes('aluguel') && c.tipo === 'receita',
      )
      if (aluguelCat) matchedCategory = aluguelCat
    } else if (descNorm.includes('condominio') || descNorm.includes('cond.')) {
      const condCat = categorias.find((c) => normalizeText(c.nome).includes('condominio'))
      if (condCat) matchedCategory = condCat
    } else if (
      descNorm.includes('iptu') ||
      descNorm.includes('prefeitura') ||
      descNorm.includes('taxa')
    ) {
      const iptuCat = categorias.find(
        (c) => normalizeText(c.nome).includes('iptu') || normalizeText(c.nome).includes('taxa'),
      )
      if (iptuCat) matchedCategory = iptuCat
    } else if (
      descNorm.includes('energia') ||
      descNorm.includes('enel') ||
      descNorm.includes('cpfl') ||
      descNorm.includes('luz')
    ) {
      const luzCat = categorias.find(
        (c) =>
          normalizeText(c.nome).includes('energia') ||
          normalizeText(c.nome).includes('luz') ||
          normalizeText(c.nome).includes('utilidades'),
      )
      if (luzCat) matchedCategory = luzCat
    } else if (
      descNorm.includes('sabesp') ||
      descNorm.includes('agua') ||
      descNorm.includes('saneamento')
    ) {
      const aguaCat = categorias.find(
        (c) =>
          normalizeText(c.nome).includes('agua') || normalizeText(c.nome).includes('utilidades'),
      )
      if (aguaCat) matchedCategory = aguaCat
    } else if (
      descNorm.includes('manutencao') ||
      descNorm.includes('reforma') ||
      descNorm.includes('eletrica') ||
      descNorm.includes('pintura')
    ) {
      const manutCat = categorias.find(
        (c) =>
          normalizeText(c.nome).includes('manutencao') || normalizeText(c.nome).includes('obra'),
      )
      if (manutCat) matchedCategory = manutCat
    }
  }

  if (matchedImovel || matchedCategory) {
    const conf = matchedImovel && matchedCategory ? 0.75 : 0.6
    return {
      sugestao_tipo: matchedCategory ? matchedCategory.tipo : defaultType,
      sugestao_categoria: matchedCategory ? matchedCategory.nome : undefined,
      sugestao_categoria_id: matchedCategory ? matchedCategory.id : undefined,
      sugestao_imovel: matchedImovel ? matchedImovel.nome : undefined,
      sugestao_imovel_id: matchedImovel ? matchedImovel.id : undefined,
      sugestao_confianca: conf,
      sugestao_origem: 'Reconhecimento inteligente por palavras-chave',
    }
  }

  return {
    sugestao_tipo: defaultType,
    sugestao_confianca: 0.3,
  }
}
