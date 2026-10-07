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
  contratos_um_ativo_por_unidade: 'unidade_id',
  contratos_reajuste_coerente: 'proxima_data_reajuste',
  contratos_vigencia_coerente: 'data_fim',
  inquilinos_cpf_valido: 'cpf',
  inquilinos_cnpj_valido: 'cnpj',
  inquilinos_email_valido: 'email',
  fornecedores_cnpj_cpf_valido: 'cnpj_cpf',
  fornecedores_email_valido: 'email',
  // Quadro de histórias (migração 20260923120002).
  historias_atividades_titulo_preenchido: 'atividade',
  historias_atividades_titulo_tamanho: 'atividade',
  historias_titulo_preenchido: 'titulo',
  historias_titulo_tamanho: 'titulo',
  historias_tag_tamanho: 'tag',
  // Árvore hierárquica e novas entidades (migração 20261005120002).
  locadores_cpf_cnpj_uidx: 'cpf_cnpj',
  locadores_cpf_cnpj_valido: 'cpf_cnpj',
  locadores_email_valido: 'email',
  locadores_nome_preenchido: 'nome_razao_social',
  fiadores_cpf_uidx: 'cpf',
  fiadores_cpf_valido: 'cpf',
  fiadores_conjuge_cpf_valido: 'conjuge_cpf',
  fiadores_email_valido: 'email',
  fiadores_nome_preenchido: 'nome',
  imovel_unidades_identificador_preenchido: 'identificador',
  imovel_unidades_identificador_uidx: 'identificador',
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
  contratos_um_ativo_por_unidade: 'Esta unidade já tem um contrato ativo nesse período.',
  contratos_reajuste_coerente: 'O reajuste não pode ser antes do início do contrato.',
  contratos_vigencia_coerente: 'A data de fim não pode ser antes da data de início.',
  inquilinos_cpf_valido: 'CPF inválido. Confira os números digitados.',
  inquilinos_cnpj_valido: 'CNPJ inválido. Confira os caracteres digitados.',
  inquilinos_email_valido: 'E-mail inválido. Use o formato nome@dominio.com.br.',
  fornecedores_cnpj_cpf_valido: 'CNPJ ou CPF inválido. Confira os caracteres digitados.',
  fornecedores_email_valido: 'E-mail inválido. Use o formato nome@dominio.com.br.',
  historias_atividades_titulo_preenchido: 'Escreva o que a atividade entrega.',
  historias_atividades_titulo_tamanho: 'A atividade pode ter até 200 caracteres.',
  historias_titulo_preenchido: 'Dê um título à história.',
  historias_titulo_tamanho: 'O título pode ter até 160 caracteres.',
  historias_tag_tamanho: 'A etiqueta pode ter até 40 caracteres.',
  // Árvore hierárquica e novas entidades (migração 20261005120002).
  locadores_cpf_cnpj_uidx: 'Já existe um locador com este CPF/CNPJ.',
  locadores_cpf_cnpj_valido: 'CPF ou CNPJ inválido. Confira os caracteres digitados.',
  locadores_email_valido: 'E-mail inválido. Use o formato nome@dominio.com.br.',
  locadores_nome_preenchido: 'Informe o nome ou a razão social do locador.',
  fiadores_cpf_uidx: 'Já existe um fiador com este CPF.',
  fiadores_cpf_valido: 'CPF inválido. Confira os números digitados.',
  fiadores_conjuge_cpf_valido: 'CPF do cônjuge inválido. Confira os números digitados.',
  fiadores_email_valido: 'E-mail inválido. Use o formato nome@dominio.com.br.',
  fiadores_nome_preenchido: 'Informe o nome do fiador.',
  imovel_unidades_identificador_preenchido: 'Informe a identificação da unidade.',
  imovel_unidades_identificador_uidx: 'Já existe uma unidade com este identificador neste imóvel.',
}

/**
 * Datas fora de 1900–2200: uma restrição por coluna, com o nome
 * <tabela>_<coluna>_plausivel, para a mensagem cair embaixo do campo certo.
 */
const DATA_IMPLAUSIVEL =
  /check constraint "(?:receitas|despesas|iptu_taxas|contratos)_(\w+)_plausivel"/

/**
 * Recusas levantadas pelos gatilhos do banco (errcode HA001 a HA009). A mensagem já sai
 * pronta para o usuário; aqui só se tira o prefixo técnico que o cliente põe
 * na frente ("Falha ao salvar em imoveis: …") e se escolhe o campo.
 */
const RECUSA_DO_GATILHO =
  /(Est[ea] (?:imóvel|inquilino|unidade) tem contrato ativo e não pode ser [^.]+\.[^\n]*|Limite de até 3 imóveis atingido[^\n]*|Só uma pessoa que entrou no sistema leva a história[^\n]*|A história só vai para Concluído[^\n]*|Esta unidade não pertence ao imóvel do contrato\.|Esta categoria é de (?:despesa|receita) e não pode ser usada em (?:receitas|despesas)\.|Este contrato é de outro imóvel\.[^\n]*|O inquilino da receita é diferente do inquilino do contrato\.|Você não pode rebaixar, desativar nem remover a si mesmo\.|Este é o último administrador ativo[^\n]*)/

/** Recusas do banco que cabem embaixo de um campo do formulário: início da mensagem → campo. */
const CAMPO_DA_RECUSA: [string, string][] = [
  ['Esta unidade não pertence', 'unidade_id'],
  ['Esta categoria é de', 'categoria'],
  ['Este contrato é de outro imóvel', 'contrato'],
  ['O inquilino da receita', 'inquilino'],
]

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

  // Unidade fora do imóvel, categoria de tipo errado, contrato/inquilino que não combinam.
  const campo = recusa && CAMPO_DA_RECUSA.find(([inicio]) => recusa[1].startsWith(inicio))
  if (campo) return { [campo[1]]: recusa![1] }

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

  const traduzida = traduzirMensagemTecnica(texto)
  if (traduzida) return traduzida
  // Mensagem crua do banco ou da rede (nome de tabela, de restrição, inglês) não
  // ajuda ninguém na tela; texto já escrito em português pelo sistema passa.
  if (!texto || pareceMensagemTecnica(texto)) return MENSAGEM_GENERICA
  return texto
}

export const MENSAGEM_SESSAO_TERMINOU = 'Sua sessão terminou, entre de novo.'

const MENSAGEM_GENERICA =
  'Não foi possível concluir agora. Tente de novo em instantes; se continuar, avise quem administra o sistema.'

/** Mensagens conhecidas do Auth, do Postgres e da rede, na ordem em que valem. */
const TRADUCOES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos. Confira e tente de novo.'],
  [
    /email not confirmed/i,
    'Seu e-mail ainda não foi confirmado. Abra a mensagem que enviamos e clique no link de confirmação.',
  ],
  [
    /user already registered|already been registered|email address.*already/i,
    'Este e-mail já tem cadastro. Entre com a sua senha ou use "Esqueci minha senha".',
  ],
  [
    /rate limit|too many requests|security purposes|over_(email|sms)_send_rate_limit/i,
    'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
  ],
  [
    /password should be at least|weak password|password is too (short|weak)/i,
    'A senha é curta ou fraca demais. Use pelo menos 8 caracteres, misturando letras e números.',
  ],
  [/new password should be different/i, 'A nova senha precisa ser diferente da senha atual.'],
  [
    /signups? (not allowed|are disabled|disabled)/i,
    'O cadastro está fechado. Peça um convite a quem administra o sistema.',
  ],
  [
    /otp.*expired|token has expired|link.*(expired|invalid)|invalid.*(token|link)/i,
    'Este link venceu ou já foi usado. Peça um novo.',
  ],
  [/jwt expired|invalid jwt|jwt.*(malformed|invalid)|refresh token/i, MENSAGEM_SESSAO_TERMINOU],
  [
    /failed to fetch|networkerror|network request failed|load failed/i,
    'Sem conexão com o servidor. Confira a internet e tente de novo.',
  ],
]

/** Tradução da mensagem técnica conhecida, ou `null` quando não é uma das conhecidas. */
export function traduzirMensagemTecnica(texto: string): string | null {
  for (const [padrao, mensagem] of TRADUCOES) {
    if (padrao.test(texto)) return mensagem
  }
  return null
}

/** Texto que veio do banco, do Auth ou da rede: prefixo do cliente de dados ou palavras em inglês. */
export function pareceMensagemTecnica(texto: string): boolean {
  if (/^Falha ao /i.test(texto)) return true
  return /\b(the|is|are|not|failed|error|violates|constraint|column|relation|does not exist|invalid|duplicate|syntax|permission|timeout|fetch|jwt|token|schema|function|null value|unexpected)\b/i.test(
    texto,
  )
}

/**
 * Mensagem para as telas de entrada, cadastro e recuperação de senha.
 *
 * O Auth devolve texto em inglês ("Invalid login credentials"); aqui ele vira
 * português claro. O que não for conhecido nem estiver já em português cai na
 * mensagem de `padrao`, em vez de aparecer cru para quem tem 70 anos.
 */
export function mensagemDeAutenticacao(error: unknown, padrao: string): string {
  const texto = textoDoErro(error)
  const traduzida = traduzirMensagemTecnica(texto)
  if (traduzida) return traduzida
  if (!texto || pareceMensagemTecnica(texto)) return padrao
  return texto
}
