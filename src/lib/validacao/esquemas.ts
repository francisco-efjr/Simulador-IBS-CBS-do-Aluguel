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

/** Formato de e-mail propositalmente simples: algo@algo.dominio, sem espaços. */
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailValido(valor: string): boolean {
  return FORMATO_EMAIL.test(valor)
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
