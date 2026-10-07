/**
 * Texto sem acento e sem diferença de maiúscula, para busca: quem digita "joao" ou "pao quente"
 * precisa achar "João" e "Pão Quente" (FIN-16).
 */
export function semAcento(texto: string | null | undefined): string {
  return (texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/** Termo digitado na caixa de busca, pronto para comparar com `semAcento(campo).includes(...)`. */
export function termoDeBusca(digitado: string | null | undefined): string {
  return semAcento(digitado).trim()
}
