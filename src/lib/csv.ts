/**
 * Geração segura de CSV (SEG-06).
 *
 * - Todo campo vai entre aspas, com `"` dobrado: vírgula, ponto e vírgula, `#` e quebra de
 *   linha dentro do texto não deslocam colunas nem cortam o arquivo.
 * - Texto que começa com `= + - @` (ou tab/CR) é lido como fórmula por Excel e Calc; recebe
 *   um apóstrofo na frente para virar texto puro (injeção de fórmula, ex.: `=HYPERLINK(...)`
 *   num nome de usuário que o administrador abre na planilha).
 * - Separador `;` e BOM UTF-8: é o que o Excel em português abre com acentos certos.
 */

const INICIO_PERIGOSO = /^[=+\-@\t\r]|^\s+[=+\-@]/

/** Uma célula pronta para o arquivo: neutralizada, escapada e entre aspas. */
export function celulaCsv(valor: unknown): string {
  let texto = valor === null || valor === undefined ? '' : String(valor)
  if (INICIO_PERIGOSO.test(texto)) texto = `'${texto}`
  return `"${texto.replace(/"/g, '""')}"`
}

export const SEPARADOR_CSV = ';'

/** Texto completo do CSV (com BOM), linhas separadas por CRLF. */
export function montarCsv(cabecalho: string[], linhas: unknown[][]): string {
  return (
    '﻿' +
    [cabecalho, ...linhas].map((l) => l.map(celulaCsv).join(SEPARADOR_CSV)).join('\r\n') +
    '\r\n'
  )
}

/** Baixa o texto como arquivo por Blob (não por `data:` URL, onde o `#` corta o conteúdo). */
export function baixarCsv(nomeDoArquivo: string, conteudo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = nomeDoArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
