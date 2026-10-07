import { paraNumeroEmReais, valorParaCampo } from '@/lib/dinheiro'

/**
 * Preenche o formulário de edição com o registro lido do banco.
 *
 * Só entram as chaves que o formulário tem (as de `vazio`): copiar o registro
 * inteiro levava junto `expand`, `id`, `created`… e o PATCH voltava 400
 * (CAD-01/FIN-01). Os campos de dinheiro entram como a pessoa os digita
 * ("2.800,00"), não como o banco os guarda ("2800").
 */
export function formularioDoRegistro(
  vazio: Record<string, string>,
  registro: Record<string, unknown>,
  camposDeDinheiro: readonly string[] = [],
): Record<string, string> {
  const form: Record<string, string> = { ...vazio }
  for (const chave of Object.keys(vazio)) {
    const valor = registro[chave]
    if (valor == null) continue
    form[chave] = camposDeDinheiro.includes(chave) ? valorParaCampo(valor) : String(valor)
  }
  return form
}

/** Converte o texto do campo para o número que vai ao banco (dinheiro lido em reais; o resto, como número). */
export function textoParaNumero(
  chave: string,
  texto: string,
  camposDeDinheiro: readonly string[] = [],
): number {
  return camposDeDinheiro.includes(chave) ? paraNumeroEmReais(texto) : Number(texto)
}
