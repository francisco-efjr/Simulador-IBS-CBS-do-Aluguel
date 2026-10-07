/**
 * Leitura de valor em reais digitado na tela.
 *
 * Um só leitor para todos os formulários (achados CAD-02 e FIN-05): antes cada
 * tela tinha o seu, e `1.234,56` virava 1,23 enquanto `1234.56` virava 123.456.
 * Dinheiro errado sem aviso é o pior defeito deste sistema, então na dúvida o
 * leitor recusa e pede para a pessoa corrigir — nunca "adivinha" um valor.
 *
 * Formas aceitas:
 *   1234     1234,56     1234.56     1.234,56     R$ 1.234,56     -10
 * Regras:
 *   - vírgula é o separador dos centavos; ponto também, se vier sozinho e
 *     com 1 ou 2 dígitos depois (`1234.56`);
 *   - ponto em grupos de 3 dígitos é milhar (`1.234` = 1234, `12.345.678`);
 *   - no máximo 2 casas depois da vírgula (`1,234` é recusado, não arredondado);
 *   - mais de um separador de centavos ou milhar fora de lugar (`1.2.3,4`) é recusado.
 */

export type MotivoDaRecusa = 'vazio' | 'formato' | 'casas'

/** `valor` só vale quando `ok`; quando não, vem NaN e `motivo` diz o que houve. */
export interface LeituraDeValor {
  ok: boolean
  valor: number
  motivo?: MotivoDaRecusa
}

const recusa = (motivo: MotivoDaRecusa): LeituraDeValor => ({ ok: false, valor: Number.NaN, motivo })

/** `1.234`, `12.345.678`: grupos de 3 dígitos depois de um primeiro grupo de 1 a 3 (sem zero à frente). */
const COM_MILHAR = /^[1-9]\d{0,2}(\.\d{3})+$/

export function lerValorEmReais(texto: string | number | null | undefined, casas = 2): LeituraDeValor {
  if (typeof texto === 'number') {
    return Number.isFinite(texto) ? { ok: true, valor: texto } : recusa('formato')
  }

  let t = String(texto ?? '')
    .replace(/R\$/gi, '')
    .replace(/[\s\u00a0]/g, '')
  if (t === '') return recusa('vazio')

  let sinal = 1
  if (t[0] === '-') {
    sinal = -1
    t = t.slice(1)
  } else if (t[0] === '+') {
    t = t.slice(1)
  }

  let inteira: string
  let fracao = ''

  if (t.includes(',')) {
    const partes = t.split(',')
    if (partes.length !== 2) return recusa('formato')
    inteira = partes[0]
    fracao = partes[1]
    if (inteira !== '' && !/^\d+$/.test(inteira) && !COM_MILHAR.test(inteira)) {
      return recusa('formato')
    }
    inteira = inteira.replace(/\./g, '')
  } else if (COM_MILHAR.test(t)) {
    inteira = t.replace(/\./g, '')
  } else {
    const partes = t.split('.')
    if (partes.length > 2) return recusa('formato')
    inteira = partes[0]
    fracao = partes[1] ?? ''
  }

  if (!/^\d*$/.test(inteira) || !/^\d*$/.test(fracao)) return recusa('formato')
  if (inteira === '' && fracao === '') return recusa('formato')
  if (fracao.length > casas) return recusa('casas')

  const valor = Number(`${inteira || '0'}.${fracao || '0'}`) * sinal
  if (!Number.isFinite(valor)) return recusa('formato')
  return { ok: true, valor: valor === 0 ? 0 : valor }
}

/** Valor em reais como número, ou `NaN` quando o texto não é um valor. */
export function paraNumeroEmReais(texto: string | number | null | undefined, casas = 2): number {
  const leitura = lerValorEmReais(texto, casas)
  return leitura.ok ? leitura.valor : Number.NaN
}

/** Mensagem para a pessoa, dizendo o que corrigir. */
export function mensagemDeValor(rotulo: string, motivo: MotivoDaRecusa, casas = 2): string {
  if (motivo === 'casas') {
    return casas === 0
      ? `${rotulo}: use um número inteiro, sem vírgula.`
      : `${rotulo} aceita no máximo ${casas} casas depois da vírgula, por exemplo 1.500,50.`
  }
  return `${rotulo} deve ter apenas números, por exemplo 1.500,00.`
}

/** Número vindo do banco, escrito como o campo mostra: `1234.5` vira `1.234,50`. */
export function valorParaCampo(valor: unknown): string {
  if (valor == null || valor === '') return ''
  const n = Number(valor)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
