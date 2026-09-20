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
  // Regras de negócio (migração 20260919120001).
  contratos_um_ativo_por_imovel: 'imovel',
  contratos_reajuste_coerente: 'proxima_data_reajuste',
  contratos_vigencia_coerente: 'data_fim',
  inquilinos_cpf_valido: 'cpf',
  inquilinos_cnpj_valido: 'cnpj',
  inquilinos_email_valido: 'email',
  fornecedores_cnpj_cpf_valido: 'cnpj_cpf',
  fornecedores_email_valido: 'email',
}

const MENSAGEM_POR_INDICE: Record<string, string> = {
  inquilinos_cpf_uidx: 'Já existe um inquilino com este CPF.',
  inquilinos_cnpj_uidx: 'Já existe um inquilino com este CNPJ.',
  imoveis_codigo_uidx: 'Já existe um imóvel com este código.',
  fornecedores_documento_uidx: 'Já existe um fornecedor com este CNPJ/CPF.',
  contratos_numero_uidx: 'Já existe um contrato com este número.',
  users_email_uidx: 'Este e-mail já está cadastrado.',
  categorias_financeiras_nome_tipo_key: 'Já existe uma categoria com este nome.',
  contratos_um_ativo_por_imovel: 'Este imóvel já tem um contrato ativo nesse período.',
  contratos_reajuste_coerente: 'O reajuste não pode ser antes do início do contrato.',
  contratos_vigencia_coerente: 'A data de fim não pode ser antes da data de início.',
  inquilinos_cpf_valido: 'CPF inválido. Confira os números digitados.',
  inquilinos_cnpj_valido: 'CNPJ inválido. Confira os caracteres digitados.',
  inquilinos_email_valido: 'E-mail inválido. Use o formato nome@dominio.com.br.',
  fornecedores_cnpj_cpf_valido: 'CNPJ ou CPF inválido. Confira os caracteres digitados.',
  fornecedores_email_valido: 'E-mail inválido. Use o formato nome@dominio.com.br.',
}

/**
 * Datas fora de 1900–2200: uma restrição por coluna, com o nome
 * <tabela>_<coluna>_plausivel, para a mensagem cair embaixo do campo certo.
 */
const DATA_IMPLAUSIVEL =
  /check constraint "(?:receitas|despesas|iptu_taxas|contratos)_(\w+)_plausivel"/

/**
 * Recusas levantadas pelos gatilhos do banco (errcode HA001). A mensagem já sai
 * pronta para o usuário; aqui só se tira o prefixo técnico que o cliente põe
 * na frente ("Falha ao salvar em imoveis: …") e se escolhe o campo.
 */
const RECUSA_DO_GATILHO = /(Est[ea] (?:imóvel|inquilino) tem contrato ativo e não pode ser [^.]+\.[^\n]*)/

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

  const data = texto.match(DATA_IMPLAUSIVEL)
  if (data) return { [data[1]]: 'Data fora do intervalo aceito. Confira o ano digitado.' }

  // Só a inativação vira erro de campo; a exclusão não tem formulário.
  const recusa = texto.match(RECUSA_DO_GATILHO)
  if (recusa && recusa[1].includes('inativado')) return { status: recusa[1] }

  // "null value in column "endereco" of relation "imoveis" violates not-null"
  const obrigatorio = texto.match(/null value in column "([^"]+)"/)
  if (obrigatorio) return { [obrigatorio[1]]: 'Campo obrigatório.' }

  return {}
}

export function getErrorMessage(error: unknown): string {
  const texto = textoDoErro(error)
  const campos = Object.values(extractFieldErrors(error))
  if (campos.length > 0) return campos.join(' ')

  const recusa = texto.match(RECUSA_DO_GATILHO)
  if (recusa) return recusa[1]

  // O Postgres 15+ escreve "violates RESTRICT setting of foreign key constraint"
  // quando a exclusão esbarra em on delete restrict; as duas formas contam.
  if (texto.includes('violates foreign key') || texto.includes('of foreign key constraint')) {
    return 'Este registro está ligado a outro e não pode ser removido.'
  }
  if (texto.includes('row-level security') || texto.includes('permission denied')) {
    return 'Você não tem permissão para esta operação.'
  }

  return texto || 'Ocorreu um erro inesperado.'
}
