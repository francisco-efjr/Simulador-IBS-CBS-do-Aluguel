/**
 * Regras da senha que o sistema confere de verdade (cadastro e redefinição).
 *
 * São só as que valem: mostrar uma regra que ninguém confere seria enganar a
 * pessoa. O Auth ainda pode recusar uma senha fraca; essa mensagem chega
 * traduzida (ver `lib/dados/erros.ts`).
 */

export const TAMANHO_MINIMO_DA_SENHA = 8

export interface RegraDaSenha {
  id: 'tamanho' | 'iguais'
  texto: string
  atendida: boolean
}

export function regrasDaSenha(senha: string, confirmacao: string): RegraDaSenha[] {
  return [
    {
      id: 'tamanho',
      texto: `Pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres`,
      atendida: senha.length >= TAMANHO_MINIMO_DA_SENHA,
    },
    {
      id: 'iguais',
      texto: 'As duas senhas são iguais',
      atendida: senha.length > 0 && senha === confirmacao,
    },
  ]
}

/** Mensagens de erro ao enviar, no tom do catálogo da seção 07. */
export const MENSAGENS_DA_SENHA = {
  curta: `A senha precisa ter pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`,
  diferentes: 'As duas senhas precisam ser iguais.',
} as const
