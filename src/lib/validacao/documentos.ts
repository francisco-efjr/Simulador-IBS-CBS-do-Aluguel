/**
 * Validação de CPF e CNPJ pelos dígitos verificadores.
 *
 * Funções puras, sem dependência de tela: servem ao formulário, aos testes e a
 * qualquer importação que precise conferir documento. Aceitam o número com ou
 * sem máscara (pontos, barra, hífen e espaços são ignorados), mas qualquer outro
 * caractere torna o documento inválido — "123.456.789-0x" não vira CPF por
 * descuido.
 *
 * Sequências de um só algarismo (111.111.111-11, 00.000.000/0000-00) passam na
 * conta dos dígitos verificadores, mas não são documentos emitidos; por isso são
 * recusadas à parte.
 */

/** Tira a máscara: pontos, barra, hífen e espaços. Letras viram maiúsculas. */
export function limparDocumento(valor: string): string {
  return valor.replace(/[.\-/\s]/g, '').toUpperCase()
}

function todosIguais(texto: string): boolean {
  return /^(.)\1*$/.test(texto)
}

/** Dígito verificador no módulo 11, como a Receita Federal calcula. */
function digitoModulo11(valores: number[], pesos: number[]): number {
  const soma = valores.reduce((acc, v, i) => acc + v * pesos[i], 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

export function cpfValido(valor: string | null | undefined): boolean {
  if (!valor) return false
  const cpf = limparDocumento(valor)
  if (!/^\d{11}$/.test(cpf) || todosIguais(cpf)) return false

  const n = cpf.split('').map(Number)
  const d1 = digitoModulo11(n.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2])
  if (d1 !== n[9]) return false
  const d2 = digitoModulo11(n.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  return d2 === n[10]
}

const PESOS_CNPJ_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const PESOS_CNPJ_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

/**
 * Aceita o CNPJ numérico e também o alfanumérico que a Receita Federal emite
 * desde julho de 2026: as 12 primeiras posições podem ter letras (A–Z) e os
 * dois dígitos verificadores continuam numéricos. Cada caractere entra na conta
 * pelo código ASCII menos 48 — para algarismos, é o próprio número.
 */
export function cnpjValido(valor: string | null | undefined): boolean {
  if (!valor) return false
  const cnpj = limparDocumento(valor)
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || todosIguais(cnpj)) return false

  const n = cnpj.split('').map((c) => c.charCodeAt(0) - 48)
  const d1 = digitoModulo11(n.slice(0, 12), PESOS_CNPJ_1)
  if (d1 !== n[12]) return false
  const d2 = digitoModulo11(n.slice(0, 13), PESOS_CNPJ_2)
  return d2 === n[13]
}

/** Decide pelo tamanho: 11 caracteres é CPF, 14 é CNPJ. */
export function cpfOuCnpjValido(valor: string | null | undefined): boolean {
  if (!valor) return false
  const limpo = limparDocumento(valor)
  if (limpo.length === 11) return cpfValido(limpo)
  if (limpo.length === 14) return cnpjValido(limpo)
  return false
}
