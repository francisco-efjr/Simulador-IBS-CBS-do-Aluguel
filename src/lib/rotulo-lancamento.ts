interface LancamentoRotulavel {
  descricao?: string | null
  expand?: {
    imovel?: { nome?: string; endereco?: string } | null
    categoria?: { nome?: string } | null
  } | null
}

/**
 * Nome curto e legível de um lançamento, para botões só com ícone e para a pergunta de
 * confirmação: "Aluguel 2026-10 (Sala 01)". Leitor de tela e quem confere antes de apagar
 * precisam saber QUAL registro está na linha.
 */
export function rotuloDoLancamento(l: LancamentoRotulavel | null | undefined, padrao: string) {
  if (!l) return padrao
  const base = l.descricao?.trim() || l.expand?.categoria?.nome || padrao
  const imovel = l.expand?.imovel?.nome || l.expand?.imovel?.endereco
  return imovel ? `${base} (${imovel})` : base
}
