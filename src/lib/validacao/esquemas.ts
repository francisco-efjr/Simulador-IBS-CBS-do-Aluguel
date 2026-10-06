import { z } from 'zod'
import type { FieldErrors } from '@/lib/dados/erros'
import { cnpjValido, cpfOuCnpjValido, cpfValido } from './documentos'

/**
 * Esquemas de validação dos cadastros (achado S-06).
 *
 * Os formulários guardam tudo como texto — é o que o `<input>` devolve — e só
 * convertem para número na hora de enviar. Os esquemas conferem esse texto,
 * antes da conversão, com as mesmas regras que as restrições CHECK do banco:
 * a tela avisa primeiro e com mensagem clara; o banco continua sendo a última
 * barreira para quem não passa pela tela.
 *
 * Campo vazio vale como "não informado". Só é erro quando a coluna é
 * obrigatória no banco (not null) ou quando a tela já exigia o campo.
 *
 * As mensagens dizem o que corrigir, não só que está errado: o público vai dos
 * 40 aos 90 anos e nem sempre sabe o que é "formato inválido".
 */

// -- Blocos -------------------------------------------------------------------

/** Texto do formulário: nulo ou ausente conta como vazio, espaços das pontas saem. */
const texto = z.preprocess((v) => (v == null ? '' : String(v)), z.string().trim())

/** Um campo com uma regra só, que devolve a mensagem de erro ou `null`. */
function campo(regra: (valor: string) => string | null) {
  return texto.superRefine((valor, ctx) => {
    const mensagem = regra(valor)
    if (mensagem) ctx.addIssue({ code: 'custom', message: mensagem })
  })
}

const livre = texto

function obrigatorio(mensagem: string) {
  return campo((v) => (v ? null : mensagem))
}

/** Maior valor que cabe em numeric(14, 2). */
const TETO_MONETARIO = 999_999_999_999.99

/** Aceita "1500", "1500.50" e também "1.500,50", caso o valor venha digitado à brasileira. */
function paraNumero(valor: string): number {
  const normalizado = valor.includes(',') ? valor.replace(/\./g, '').replace(',', '.') : valor
  return normalizado === '' ? Number.NaN : Number(normalizado)
}

function dinheiro(rotulo: string, obrigatorioMsg?: string) {
  return campo((v) => {
    if (!v) return obrigatorioMsg ?? null
    const n = paraNumero(v)
    if (!Number.isFinite(n)) return `${rotulo} deve ter apenas números, por exemplo 1500,00.`
    if (n < 0) return `${rotulo} não pode ser negativo. Informe zero ou um valor positivo.`
    if (n > TETO_MONETARIO) return `${rotulo} está acima do limite. Confira se não sobrou algum zero.`
    return null
  })
}

function inteiro(
  rotulo: string,
  { min, max, mensagemFaixa }: { min: number; max: number; mensagemFaixa: string },
) {
  return campo((v) => {
    if (!v) return null
    const n = paraNumero(v)
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return `${rotulo}: use um número inteiro, sem vírgula.`
    }
    if (n < min || n > max) return mensagemFaixa
    return null
  })
}

/** Quantidade de cômodos ou vagas: inteiro, zero ou mais (smallint no banco). */
function quantidade(rotulo: string) {
  return inteiro(rotulo, {
    min: 0,
    max: 32767,
    mensagemFaixa: `${rotulo} não pode ser negativo. Informe zero se não houver.`,
  })
}

/**
 * Regex rigoroso para validação de e-mail seguindo RFC 5322 simplificado:
 * - Não permite espaços
 * - Usuário: letras, números e símbolos permitidos
 * - Domínio com partes alfanuméricas/hífen (1-63 chars)
 * - TLD com pelo menos 2 caracteres alfabéticos
 */
const REGEX_EMAIL_RIGOROSO =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

/**
 * Verifica se a estrutura do domínio de um e-mail é válida e plausível na Internet.
 */
export function validarDominioEmail(dominioOuEmail: string): boolean {
  if (!dominioOuEmail) return false
  const dominio = dominioOuEmail.includes('@')
    ? dominioOuEmail.split('@')[1]?.trim()
    : dominioOuEmail.trim()
  if (!dominio || dominio.length > 255) return false

  if (dominio.startsWith('.') || dominio.endsWith('.') || dominio.includes('..')) {
    return false
  }

  const partes = dominio.split('.')
  if (partes.length < 2) return false

  const tld = partes[partes.length - 1]
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return false
  }

  for (const parte of partes) {
    if (!parte || parte.length > 63) return false
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(parte)) {
      return false
    }
  }

  return true
}

/**
 * Função auxiliar para checagem de domínio e formato de e-mail.
 */
export function checarDominioEmail(emailStr: string): {
  valido: boolean
  dominio?: string
  erro?: string
} {
  if (!emailStr || !emailStr.includes('@')) {
    return { valido: false, erro: 'E-mail não contém arroba (@).' }
  }
  const partes = emailStr.split('@')
  if (partes.length !== 2) {
    return { valido: false, erro: 'E-mail contém múltiplos arrobas (@).' }
  }
  const [, dominio] = partes
  const dominioValido = validarDominioEmail(dominio)
  if (!dominioValido) {
    return { valido: false, dominio, erro: 'Domínio do e-mail inválido ou inexistente.' }
  }
  return { valido: true, dominio }
}

/** Valida o e-mail combinando regex rigoroso e checagem de domínio. */
export function emailValido(valor: string | null | undefined): boolean {
  if (!valor) return false
  const limpo = valor.trim()
  if (!limpo || limpo.length > 254) return false
  return REGEX_EMAIL_RIGOROSO.test(limpo) && validarDominioEmail(limpo)
}

const email = campo((v) =>
  !v || emailValido(v)
    ? null
    : 'Este e-mail parece incompleto. Confira se tem o @ e o domínio, como nome@exemplo.com.br.',
)

/** Mês de competência no padrão que o banco guarda: AAAA-MM. */
const competencia = campo((v) =>
  !v || /^\d{4}-(0[1-9]|1[0-2])$/.test(v)
    ? null
    : 'Informe a competência como ano e mês, por exemplo 2025-06 para junho de 2025.',
)

/** Compara só a parte da data (AAAA-MM-DD), mesmo que venha com hora do banco. */
function dia(valor: string): string {
  return valor.slice(0, 10)
}

// -- Cadastros ----------------------------------------------------------------

export const imovelSchema = z.object({
  codigo: livre,
  nome: livre,
  tipo: livre,
  status: livre,
  endereco: obrigatorio('Informe o endereço do imóvel (rua ou avenida).'),
  numero: livre,
  complemento: livre,
  bairro: livre,
  cep: livre,
  cidade: livre,
  estado: campo((v) =>
    !v || /^[A-Za-z]{2}$/.test(v)
      ? null
      : 'Informe o estado com as duas letras da sigla, por exemplo SP ou MG.',
  ),
  matricula: livre,
  cib: livre,
  iptus: z
    .preprocess((v) => {
      if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean)
      if (typeof v === 'string') {
        const trimmed = v.trim()
        if (!trimmed) return []
        return trimmed.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
      }
      return []
    }, z.array(z.string()))
    .default([]),
  inscricao_imobiliaria: livre,
  area: campo((v) => {
    if (!v) return null
    const n = paraNumero(v)
    if (!Number.isFinite(n)) return 'Área: use apenas números, por exemplo 72,5.'
    if (n < 0) return 'A área não pode ser negativa. Informe a metragem em m².'
    return null
  }),
  quartos: quantidade('Quartos'),
  banheiros: quantidade('Banheiros'),
  vagas: quantidade('Vagas'),
  valor_estimado: dinheiro('Valor estimado'),
  valor_imovel: dinheiro('Valor do imóvel'),
  observacoes: livre,
})

export const unidadeSchema = z.object({
  imovel_id: livre,
  identificador: obrigatorio('Informe a identificação da unidade (ex: Apto 101, Sala 02).'),
  complemento: livre,
  tipo_unidade: livre,
  codigo_energia: livre,
  codigo_agua: livre,
  tem_condominio: z
    .preprocess((v) => v === true || v === 'true' || v === 1 || v === '1', z.boolean())
    .default(false),
  valor_condominio: dinheiro('O valor do condomínio'),
  taxa_poco: dinheiro('A taxa de poço'),
  taxas_extras: dinheiro('As taxas extras'),
  status: livre,
  inquilino_atual: livre,
  observacoes: livre,
})

export const inquilinoSchema = z
  .object({
    tipo_pessoa: livre,
    nome: livre,
    cpf: livre,
    rg: livre,
    data_nascimento: livre,
    nome_fantasia: livre,
    cnpj: livre,
    responsavel: livre,
    telefone: livre,
    email,
    endereco: livre,
    endereco_secundario: livre,
    endereco_secundario_origem: livre,
    observacoes: livre,
    status: livre,
  })
  .superRefine((d, ctx) => {
    const pf = d.tipo_pessoa !== 'pj'
    if (!d.nome) {
      ctx.addIssue({
        code: 'custom',
        path: ['nome'],
        message: pf ? 'Informe o nome do inquilino.' : 'Informe a razão social da empresa.',
      })
    }
    // Só confere o documento do tipo escolhido: o outro campo nem aparece na tela.
    if (pf) {
      if (!d.cpf) {
        ctx.addIssue({ code: 'custom', path: ['cpf'], message: 'Informe o CPF do inquilino.' })
      } else if (!cpfValido(d.cpf)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cpf'],
          message: 'Este CPF não é válido. Confira os 11 números, por exemplo 123.456.789-09.',
        })
      }
    } else if (!d.cnpj) {
      ctx.addIssue({ code: 'custom', path: ['cnpj'], message: 'Informe o CNPJ da empresa.' })
    } else if (!cnpjValido(d.cnpj)) {
      ctx.addIssue({
        code: 'custom',
        path: ['cnpj'],
        message: 'Este CNPJ não é válido. Confira os 14 caracteres, por exemplo 12.345.678/0001-95.',
      })
    }
  })

export const locadorSchema = z
  .object({
    nome_razao_social: livre,
    tipo_pessoa: livre,
    cpf_cnpj: livre,
    email: livre,
    telefone: livre,
    dados_bancarios: livre,
    status: livre,
  })
  .superRefine((d, ctx) => {
    const pf = d.tipo_pessoa !== 'pj'
    if (!d.nome_razao_social) {
      ctx.addIssue({
        code: 'custom',
        path: ['nome_razao_social'],
        message: pf ? 'Informe o nome do locador.' : 'Informe a razão social do locador.',
      })
    }
    if (!d.cpf_cnpj) {
      ctx.addIssue({
        code: 'custom',
        path: ['cpf_cnpj'],
        message: pf ? 'Informe o CPF do locador.' : 'Informe o CNPJ do locador.',
      })
    } else {
      const valido = pf ? cpfValido(d.cpf_cnpj) : cnpjValido(d.cpf_cnpj)
      if (!valido) {
        ctx.addIssue({
          code: 'custom',
          path: ['cpf_cnpj'],
          message: pf
            ? 'Este CPF não é válido. Confira os 11 números, por exemplo 123.456.789-09.'
            : 'Este CNPJ não é válido. Confira os 14 caracteres, por exemplo 12.345.678/0001-95.',
        })
      }
    }
    if (!d.email) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Informe o e-mail do locador.',
      })
    } else if (!emailValido(d.email)) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Este e-mail parece incompleto. Confira se tem o @ e o domínio, como nome@exemplo.com.br.',
      })
    }
  })

export const fiadorSchema = z
  .object({
    nome: obrigatorio('Informe o nome do fiador.'),
    cpf: livre,
    rg: livre,
    estado_civil: livre,
    conjuge_nome: livre,
    conjuge_cpf: livre,
    email,
    telefone: livre,
    endereco_completo: livre,
  })
  .superRefine((d, ctx) => {
    if (!d.cpf) {
      ctx.addIssue({
        code: 'custom',
        path: ['cpf'],
        message: 'Informe o CPF do fiador.',
      })
    } else if (!cpfValido(d.cpf)) {
      ctx.addIssue({
        code: 'custom',
        path: ['cpf'],
        message: 'Este CPF não é válido. Confira os 11 números, por exemplo 123.456.789-09.',
      })
    }

    const ec = (d.estado_civil ?? '').toLowerCase().trim()
    const casado =
      ec === 'casado' ||
      ec === 'casada' ||
      ec.startsWith('casad') ||
      ec.includes('união') ||
      ec.includes('uniao')

    if (casado) {
      if (!d.conjuge_nome) {
        ctx.addIssue({
          code: 'custom',
          path: ['conjuge_nome'],
          message: 'Informe o nome do cônjuge para a outorga conjugal.',
        })
      }
      if (!d.conjuge_cpf) {
        ctx.addIssue({
          code: 'custom',
          path: ['conjuge_cpf'],
          message: 'Informe o CPF do cônjuge para a outorga conjugal.',
        })
      } else if (!cpfValido(d.conjuge_cpf)) {
        ctx.addIssue({
          code: 'custom',
          path: ['conjuge_cpf'],
          message: 'Este CPF do cônjuge não é válido. Confira os 11 números, por exemplo 123.456.789-09.',
        })
      }
    } else if (d.conjuge_cpf && !cpfValido(d.conjuge_cpf)) {
      ctx.addIssue({
        code: 'custom',
        path: ['conjuge_cpf'],
        message: 'Este CPF do cônjuge não é válido. Confira os 11 números, por exemplo 123.456.789-09.',
      })
    }
  })

export const fornecedorSchema = z.object({
  nome: obrigatorio('Informe o nome ou a razão social do fornecedor.'),
  nome_fantasia: livre,
  cnpj_cpf: campo((v) =>
    !v || cpfOuCnpjValido(v)
      ? null
      : 'Este CPF ou CNPJ não é válido. Confira os números: o CPF tem 11 e o CNPJ tem 14.',
  ),
  tipo_fornecedor: livre,
  contato: livre,
  telefone: livre,
  email,
  endereco: livre,
  servicos_prestados: livre,
  observacoes: livre,
  status: livre,
})

export const contratoSchema = z
  .object({
    numero: livre,
    imovel: obrigatorio('Escolha o imóvel deste contrato.'),
    unidade_id: livre,
    locador_id: livre,
    fiador_id: livre,
    inquilino: obrigatorio('Escolha o inquilino deste contrato.'),
    data_inicio: obrigatorio('Informe a data de início do contrato.'),
    data_fim: obrigatorio('Informe a data de término do contrato.'),
    valor_aluguel: dinheiro('O valor do aluguel', 'Informe o valor do aluguel.'),
    dia_vencimento: inteiro('Dia de vencimento', {
      min: 1,
      max: 31,
      mensagemFaixa: 'O dia de vencimento precisa estar entre 1 e 31.',
    }),
    indice_reajuste: livre,
    periodicidade_reajuste: livre,
    proxima_data_reajuste: livre,
    tipo_garantia: livre,
    valor_garantia: dinheiro('O valor da garantia'),
    status: livre,
    observacoes: livre,
  })
  .superRefine((d, ctx) => {
    if (d.data_inicio && d.data_fim && dia(d.data_fim) < dia(d.data_inicio)) {
      ctx.addIssue({
        code: 'custom',
        path: ['data_fim'],
        message: 'A data de término não pode ser anterior à data de início. Confira as duas datas.',
      })
    }
  })

export const receitaSchema = z.object({
  imovel: obrigatorio('Escolha o imóvel desta receita.'),
  contrato: livre,
  inquilino: livre,
  categoria: obrigatorio('Escolha a categoria da receita.'),
  competencia,
  data_vencimento: obrigatorio('Informe a data de vencimento.'),
  valor_previsto: dinheiro('O valor previsto', 'Informe o valor previsto.'),
  valor_recebido: dinheiro('O valor recebido'),
  data_recebimento: livre,
  status_financeiro: livre,
  forma_recebimento: livre,
  descricao: livre,
  observacoes: livre,
})

export const despesaSchema = z.object({
  imovel: obrigatorio('Escolha o imóvel desta despesa.'),
  fornecedor: livre,
  categoria: livre,
  descricao: livre,
  valor: dinheiro('O valor'),
  data: livre,
  competencia,
  data_vencimento: livre,
  valor_previsto: dinheiro('O valor previsto'),
  valor_pago: dinheiro('O valor pago'),
  data_pagamento: livre,
  status_financeiro: livre,
  forma_pagamento: livre,
  observacoes: livre,
})

export const iptuTaxaSchema = z.object({
  imovel: obrigatorio('Escolha o imóvel desta obrigação.'),
  tipo: livre,
  descricao: obrigatorio('Descreva a obrigação, por exemplo "IPTU 2025 — cota única".'),
  ano_referencia: inteiro('Ano de referência', {
    min: 1900,
    max: 2200,
    mensagemFaixa: 'Informe o ano com quatro números, por exemplo 2025.',
  }),
  valor: dinheiro('O valor', 'Informe o valor da obrigação.'),
  vencimento: obrigatorio('Informe a data de vencimento.'),
  data_pagamento: livre,
  status: livre,
  forma_pagamento: livre,
  observacoes: livre,
})

// -- Uso nos formulários ------------------------------------------------------

/**
 * Confere os dados com o esquema e devolve um erro por campo, no formato que o
 * `<Field error>` já exibe (ligado ao controle por `aria-describedby`). Quando o
 * campo tem mais de um problema, fica a primeira mensagem — uma coisa por vez.
 */
export function validarFormulario(schema: z.ZodType, dados: unknown): FieldErrors {
  const resultado = schema.safeParse(dados)
  if (resultado.success) return {}

  const erros: FieldErrors = {}
  for (const issue of resultado.error.issues) {
    const chave = issue.path[0]
    if (chave == null) continue
    const nome = String(chave)
    if (!(nome in erros)) erros[nome] = issue.message
  }
  return erros
}
