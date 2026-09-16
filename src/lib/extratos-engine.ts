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
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[m][n]
}

/**
 * Similarity ratio between 0 and 1
 */
export function calculateSimilarity(s1: string, s2: string): number {
  const n1 = normalizeDescriptionForMatching(s1)
  const n2 = normalizeDescriptionForMatching(s2)

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

/**
 * Parses OFX file content into structured transactions
 */
export function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []

  // Extract STMTTRN blocks
  const stmttrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
  let match: RegExpExecArray | null

  // Fallback if no closing tags (some OFX 1.x banks don't close tags)
  let blocks: string[] = []
  if (content.includes('</STMTTRN>')) {
    while ((match = stmttrnRegex.exec(content)) !== null) {
      blocks.push(match[1])
    }
  } else {
    // Split by <STMTTRN>
    const parts = content.split(/<STMTTRN>/i)
    blocks = parts.slice(1).map((p) => p.split(/<STMTTRN>|<BANKTRANLIST>|<\/BANKTRANLIST>/i)[0])
  }

  const getTagValue = (block: string, tag: string): string => {
    // Matches <TAG>value or <TAG>value</TAG>
    const tagRegex = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i')
    const m = tagRegex.exec(block)
    return m ? m[1].trim() : ''
  }

  for (const block of blocks) {
    const trntype = getTagValue(block, 'TRNTYPE').toUpperCase()
    const dtpostedRaw = getTagValue(block, 'DTPOSTED')
    const trnamtRaw = getTagValue(block, 'TRNAMT')
    const fitid = getTagValue(block, 'FITID')
    const memo = getTagValue(block, 'MEMO')
    const name = getTagValue(block, 'NAME')

    if (!dtpostedRaw || !trnamtRaw) continue

    // Format date: OFX date is YYYYMMDD... e.g. 20250615120000
    let year = dtpostedRaw.substring(0, 4)
    let month = dtpostedRaw.substring(4, 6)
    let day = dtpostedRaw.substring(6, 8)
    if (!day || isNaN(Number(day))) day = '01'
    if (!month || isNaN(Number(month))) month = '01'
    const dateFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

    // Parse amount: OFX uses negative for debit, positive for credit
    const numAmt = parseFloat(trnamtRaw.replace(',', '.'))
    if (isNaN(numAmt)) continue

    const isCredit = numAmt > 0 || trntype === 'CREDIT' || trntype === 'DEP'
    const valor = Math.abs(numAmt)
    const descricao =
      [name, memo, fitid ? `ID:${fitid}` : '']
        .filter(Boolean)
        .join(' - ')
        .replace(/\s+/g, ' ')
        .trim() || 'Transação OFX'

    transactions.push({
      data: dateFormatted,
      descricao,
      valor,
      tipo: isCredit ? 'credito' : 'debito',
      incluir: true,
    })
  }

  return transactions
}

/**
 * Parses CSV file with intelligent column detection, delimiter sniffing and date formatting
 */
export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length < 2) return []

  // Detect delimiter: evaluate semicolon, comma, tab
  const sample = lines.slice(0, 5).join('\n')
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

  // Find header row (usually the first row that has words like data, descri, valor, memo, historico)
  let headerIndex = 0
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const rowNorm = normalizeText(lines[i])
    if (
      rowNorm.includes('data') ||
      rowNorm.includes('dt') ||
      rowNorm.includes('date') ||
      rowNorm.includes('valor') ||
      rowNorm.includes('historico') ||
      rowNorm.includes('descricao') ||
      rowNorm.includes('lancamento')
    ) {
      headerIndex = i
      break
    }
  }

  const headers = splitCSVRow(lines[headerIndex], delimiter).map((h) => normalizeText(h))

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
  let debitCol = headers.findIndex(
    (h) => h.includes('debito') || h.includes('saida') || h.includes('despesa'),
  )
  let creditCol = headers.findIndex(
    (h) => h.includes('credito') || h.includes('entrada') || h.includes('receita'),
  )
  let saldoCol = headers.findIndex((h) => h.includes('saldo') || h.includes('balance'))
  let typeCol = headers.findIndex(
    (h) => h.includes('tipo') || h.includes('type') || h === 'd/c' || h === 'c/d',
  )

  // Defaults if not found
  if (dateCol === -1) dateCol = 0
  if (descCol === -1) descCol = headers.length > 2 ? 1 : 0
  if (valCol === -1 && debitCol === -1 && creditCol === -1) {
    valCol = headers.length > 2 ? 2 : 1
  }

  const transactions: ParsedTransaction[] = []

  // Date parsing helper
  const parseDateStr = (raw: string): string | null => {
    if (!raw) return null
    const cleaned = raw.replace(/[^\d/\-.]/g, '')

    // Check DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const brMatch = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/)
    if (brMatch) {
      let day = brMatch[1].padStart(2, '0')
      let month = brMatch[2].padStart(2, '0')
      let year = brMatch[3]
      if (year.length === 2) year = '20' + year
      return `${year}-${month}-${day}`
    }

    // Check YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = cleaned.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
    if (isoMatch) {
      let year = isoMatch[1]
      let month = isoMatch[2].padStart(2, '0')
      let day = isoMatch[3].padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return null
  }

  // Number parsing helper (handles 1.234,56 or 1,234.56 or -123.45)
  const parseNumberStr = (raw: string): number | null => {
    if (!raw) return null
    let s = raw.replace(/\s+/g, '').replace('R$', '')
    if (!s) return null

    let isNegative = false
    if (s.includes('-') || s.endsWith('D') || s.startsWith('D-') || s.includes('(')) {
      isNegative = true
    }
    s = s.replace(/[^0-9,.-]/g, '')

    // Check for Brazilian format: 1.234,56
    if (s.includes('.') && s.includes(',')) {
      if (s.indexOf('.') < s.indexOf(',')) {
        s = s.replace(/\./g, '').replace(',', '.')
      } else {
        s = s.replace(/,/g, '')
      }
    } else if (s.includes(',')) {
      s = s.replace(',', '.')
    }

    const val = parseFloat(s)
    if (isNaN(val)) return null
    return isNegative ? -Math.abs(val) : val
  }

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = splitCSVRow(lines[i], delimiter)
    if (cols.length < 2) continue

    const dateStr = dateCol >= 0 && cols[dateCol] ? parseDateStr(cols[dateCol]) : null
    if (!dateStr) continue

    const descricao = (descCol >= 0 && cols[descCol] ? cols[descCol] : 'Lançamento bancário').trim()

    let valorNum = 0
    let tipo: 'credito' | 'debito' = 'credito'

    if (debitCol >= 0 && creditCol >= 0) {
      const debitVal = parseNumberStr(cols[debitCol]) || 0
      const creditVal = parseNumberStr(cols[creditCol]) || 0
      if (debitVal > 0) {
        valorNum = debitVal
        tipo = 'debito'
      } else if (creditVal > 0) {
        valorNum = creditVal
        tipo = 'credito'
      }
    } else if (valCol >= 0 && cols[valCol]) {
      const parsedVal = parseNumberStr(cols[valCol])
      if (parsedVal !== null) {
        if (parsedVal < 0) {
          valorNum = Math.abs(parsedVal)
          tipo = 'debito'
        } else {
          valorNum = parsedVal
          tipo = 'credito'
        }
      }
    }

    if (typeCol >= 0 && cols[typeCol]) {
      const t = normalizeText(cols[typeCol])
      if (t.includes('deb') || t.includes('saida') || t === 'd') {
        tipo = 'debito'
      } else if (t.includes('cred') || t.includes('entr') || t === 'c') {
        tipo = 'credito'
      }
    }

    // Double check common keywords in description if sign is ambiguous
    const descNorm = normalizeText(descricao)
    if (
      descNorm.includes('pagamento efetuado') ||
      descNorm.includes('tarifa') ||
      descNorm.includes('deb aut') ||
      descNorm.includes('saque') ||
      descNorm.includes('compra debito') ||
      descNorm.includes('compra cartao')
    ) {
      tipo = 'debito'
    } else if (
      descNorm.includes('ted recebida') ||
      descNorm.includes('pix recebido') ||
      descNorm.includes('credito em conta') ||
      descNorm.includes('deposito recebido')
    ) {
      tipo = 'credito'
    }

    let saldo: number | undefined
    if (saldoCol >= 0 && cols[saldoCol]) {
      const s = parseNumberStr(cols[saldoCol])
      if (s !== null) saldo = s
    }

    if (valorNum > 0 || valorNum < 0) {
      transactions.push({
        data: dateStr,
        descricao,
        valor: Math.abs(valorNum),
        tipo,
        saldo,
        incluir: true,
      })
    }
  }

  return transactions
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
