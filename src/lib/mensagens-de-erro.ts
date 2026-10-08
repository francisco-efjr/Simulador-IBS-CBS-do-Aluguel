/**
 * Catálogo de mensagens de erro do formulário (guia de estilo, seção 07).
 *
 * Cada mensagem diz o que houve e o que fazer, com um exemplo quando o formato
 * não é óbvio. Ficam aqui para a mesma situação ter sempre o mesmo texto em
 * qualquer tela.
 */

export const MENSAGENS = {
  /** "Preencha o campo E-mail." */
  obrigatorio: (nomeDoCampo: string) => `Preencha o campo ${nomeDoCampo}.`,
  emailIncompleto: 'Digite o e-mail completo, por exemplo nome@email.com',
  valorEmReais: 'Use só números, por exemplo 3.500,00',
  data: 'Use dia/mês/ano, por exemplo 31/10/2026',
  /** "A data final precisa ser depois de 01/10/2026." */
  dataFinalAntesDaInicial: (dataInicial: string) =>
    `A data final precisa ser depois de ${dataInicial}.`,
  /** "Confira os números do CPF. Falta um dígito ou há um erro." */
  documento: (qual: 'CPF' | 'CNPJ' | 'CPF ou CNPJ') =>
    `Confira os números do ${qual}. Falta um dígito ou há um erro.`,
  arquivoNaoAceito: (formatos: string) =>
    `Esse tipo de arquivo não é aceito. Envie ${formatos}.`,
  loginRecusado: 'E-mail ou senha não conferem. Confira e tente de novo.',
  semInternet: 'Sem conexão com a internet. O que você digitou continua na tela.',
  sessaoEncerrada: 'Por segurança, sua sessão terminou. Entre de novo para continuar.',
} as const

const FORMATO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Confere só o formato (algo@dominio.ext); quem decide se existe é o servidor. */
export function emailCompleto(valor: string): boolean {
  return FORMATO_DE_EMAIL.test(valor.trim())
}
