/**
 * Avaliador mínimo da sintaxe de filtro do PocketBase.
 *
 * Cobre o que a aplicação realmente usa: comparações `campo OP valor` unidas
 * por `&&` e `||`, com valores entre aspas simples/duplas, números e booleanos.
 * Não há parênteses nem funções nos filtros do projeto.
 *
 * Um filtro que este parser não entenda devolve `true` (deixa o registro
 * passar). Num ambiente de demonstração, uma lista larga demais é um defeito
 * muito menos confuso que uma tela vazia sem explicação.
 */

type Operator = '=' | '!=' | '>=' | '<=' | '>' | '<' | '~' | '!~'

// Ordem importa: os operadores de dois caracteres precisam ser testados antes.
const OPERATORS: Operator[] = ['!=', '>=', '<=', '!~', '=', '>', '<', '~']

function parseLiteral(raw: string): unknown {
  const token = raw.trim()

  if (
    (token.startsWith("'") && token.endsWith("'") && token.length >= 2) ||
    (token.startsWith('"') && token.endsWith('"') && token.length >= 2)
  ) {
    // PocketBase escapa aspas simples duplicando-as.
    return token.slice(1, -1).replace(/''/g, "'")
  }

  if (token === 'true') return true
  if (token === 'false') return false
  if (token === 'null') return null

  const asNumber = Number(token)
  return token !== '' && !Number.isNaN(asNumber) ? asNumber : token
}

function readField(record: Record<string, unknown>, path: string): unknown {
  return path
    .trim()
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
      record,
    )
}

/** Comparação frouxa, no espírito do PocketBase: '10' e 10 são o mesmo valor. */
function compare(left: unknown, operator: Operator, right: unknown): boolean {
  if (operator === '~' || operator === '!~') {
    const haystack = String(left ?? '').toLowerCase()
    const needle = String(right ?? '')
      .toLowerCase()
      .replace(/^%|%$/g, '')
    const hit = haystack.includes(needle)
    return operator === '~' ? hit : !hit
  }

  if (operator === '=' || operator === '!=') {
    // Relações multi-valor: `campo = 'id'` casa se o id estiver na lista.
    const hit = Array.isArray(left)
      ? left.some((item) => String(item) === String(right))
      : left == null && right == null
        ? true
        : String(left ?? '') === String(right ?? '')
    return operator === '=' ? hit : !hit
  }

  const leftNumber = Number(left)
  const rightNumber = Number(right)
  const numeric =
    left !== '' &&
    right !== '' &&
    left != null &&
    right != null &&
    !Number.isNaN(leftNumber) &&
    !Number.isNaN(rightNumber)

  const a: string | number = numeric ? leftNumber : String(left ?? '')
  const b: string | number = numeric ? rightNumber : String(right ?? '')

  switch (operator) {
    case '>':
      return a > b
    case '>=':
      return a >= b
    case '<':
      return a < b
    case '<=':
      return a <= b
  }
}

/** Divide em `separator`, ignorando ocorrências dentro de aspas. */
function splitOutsideQuotes(input: string, separator: string): string[] {
  const parts: string[] = []
  let current = ''
  let quote: string | null = null

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (quote) {
      current += char
      if (char === quote) quote = null
      continue
    }

    if (char === "'" || char === '"') {
      quote = char
      current += char
      continue
    }

    if (input.startsWith(separator, i)) {
      parts.push(current)
      current = ''
      i += separator.length - 1
      continue
    }

    current += char
  }

  parts.push(current)
  return parts
}

function evaluateComparison(record: Record<string, unknown>, expression: string): boolean {
  const trimmed = expression.trim()
  if (!trimmed) return true

  for (const operator of OPERATORS) {
    const pieces = splitOutsideQuotes(trimmed, operator)
    if (pieces.length !== 2) continue

    return compare(readField(record, pieces[0]), operator, parseLiteral(pieces[1]))
  }

  return true
}

/**
 * Retorna um predicado para o filtro. Filtro vazio aceita tudo.
 */
export function buildFilterPredicate(
  filter?: string,
): (record: Record<string, unknown>) => boolean {
  const expression = filter?.trim()
  if (!expression) return () => true

  return (record) =>
    splitOutsideQuotes(expression, '||').some((orGroup) =>
      splitOutsideQuotes(orGroup, '&&').every((andTerm) => evaluateComparison(record, andTerm)),
    )
}
