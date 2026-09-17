export type FieldErrors = Record<string, string>

/** Coluna citada pelo Postgres numa violação de restrição, quando dá para saber. */
const COLUNA_POR_INDICE: Record<string, string> = {
  inquilinos_cpf_uidx: 'cpf',
  inquilinos_cnpj_uidx: 'cnpj',
  imoveis_codigo_uidx: 'codigo',
  fornecedores_documento_uidx: 'cnpj_cpf',
  contratos_numero_uidx: 'numero',
  users_email_uidx: 'email',
  convites_token_key: 'token',
  categorias_financeiras_nome_tipo_key: 'nome',
}

const MENSAGEM_POR_INDICE: Record<string, string> = {
  inquilinos_cpf_uidx: 'Já existe um inquilino com este CPF.',
  inquilinos_cnpj_uidx: 'Já existe um inquilino com este CNPJ.',
  imoveis_codigo_uidx: 'Já existe um imóvel com este código.',
  fornecedores_documento_uidx: 'Já existe um fornecedor com este CNPJ/CPF.',
  contratos_numero_uidx: 'Já existe um contrato com este número.',
  users_email_uidx: 'Este e-mail já está cadastrado.',
  categorias_financeiras_nome_tipo_key: 'Já existe uma categoria com este nome.',
}

function textoDoErro(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message ?? '')
  }
  return ''
}

/**
 * Traduz o erro do banco em erro de campo, para a mensagem aparecer embaixo do
 * campo certo em vez de num aviso genérico no topo do formulário.
 */
export function extractFieldErrors(error: unknown): FieldErrors {
  const texto = textoDoErro(error)
  if (!texto) return {}

  for (const [indice, coluna] of Object.entries(COLUNA_POR_INDICE)) {
    if (texto.includes(indice)) {
      return { [coluna]: MENSAGEM_POR_INDICE[indice] ?? 'Este valor já está em uso.' }
    }
  }

  // "null value in column "endereco" of relation "imoveis" violates not-null"
  const obrigatorio = texto.match(/null value in column "([^"]+)"/)
  if (obrigatorio) return { [obrigatorio[1]]: 'Campo obrigatório.' }

  return {}
}

export function getErrorMessage(error: unknown): string {
  const texto = textoDoErro(error)
  const campos = Object.values(extractFieldErrors(error))
  if (campos.length > 0) return campos.join(' ')

  if (texto.includes('violates foreign key')) {
    return 'Este registro está ligado a outro e não pode ser removido.'
  }
  if (texto.includes('row-level security') || texto.includes('permission denied')) {
    return 'Você não tem permissão para esta operação.'
  }

  return texto || 'Ocorreu um erro inesperado.'
}
