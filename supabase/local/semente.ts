/**
 * Massa sintética do Supabase local.
 *
 * Tudo aqui é inventado: nomes, endereços e telefones não pertencem a ninguém, e
 * CPF/CNPJ saem de um gerador que calcula os dígitos verificadores (o banco
 * recusa documento inválido). A carga roda como o administrador da semente, para
 * que a autoria (`created_by`) e a trilha de auditoria fiquem como se alguém
 * tivesse cadastrado tudo pela tela, e para o limite de 3 imóveis por usuário
 * não contar os imóveis da semente contra o editor.
 *
 * Categorias financeiras e o quadro de histórias já vêm das migrações.
 */
import type { BancoDeTeste, Modulo, Nivel } from '../tests/harness.ts'

const MODULOS: Modulo[] = [
  'imoveis',
  'inquilinos',
  'fornecedores',
  'contratos',
  'receitas',
  'despesas',
  'iptu_taxas',
  'dashboards',
  'alertas',
  'relatorios',
  'importar_extrato',
  'classificar_transacoes',
  'quadro',
  'locadores',
]

const emTodos = (nivel: Nivel) =>
  Object.fromEntries(MODULOS.map((m) => [m, nivel])) as Partial<Record<Modulo, Nivel>>

export const CONTAS: {
  email: string
  nome: string
  perfil: 'administrador' | 'usuario'
  ativo: boolean
  permissoes: Partial<Record<Modulo, Nivel>>
}[] = [
  {
    email: 'admin@teste.local',
    nome: 'Administrador Teste',
    perfil: 'administrador',
    ativo: true,
    permissoes: emTodos('edicao'),
  },
  {
    email: 'editor@teste.local',
    nome: 'Editora Teste',
    perfil: 'usuario',
    ativo: true,
    permissoes: emTodos('edicao'),
  },
  {
    email: 'leitor@teste.local',
    nome: 'Leitor Teste',
    perfil: 'usuario',
    ativo: true,
    permissoes: emTodos('visualizacao'),
  },
  {
    email: 'restrito@teste.local',
    nome: 'Restrito Teste',
    perfil: 'usuario',
    ativo: true,
    permissoes: { ...emTodos('sem_acesso'), imoveis: 'visualizacao' },
  },
  // Tem permissão em tudo e mesmo assim não entra: a situação inativa vale mais.
  {
    email: 'inativo@teste.local',
    nome: 'Inativo Teste',
    perfil: 'usuario',
    ativo: false,
    permissoes: emTodos('edicao'),
  },
]

// Documentos ------------------------------------------------------------------

function digito(valores: number[], pesos: number[]): number {
  const resto = valores.reduce((soma, v, i) => soma + v * pesos[i], 0) % 11
  return resto < 2 ? 0 : 11 - resto
}

/** Os nove primeiros dígitos mais os dois verificadores, com máscara. */
export function cpf(base: string): string {
  const n = base.split('').map(Number)
  n.push(digito(n, [10, 9, 8, 7, 6, 5, 4, 3, 2]))
  n.push(digito(n, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]))
  const t = n.join('')
  return `${t.slice(0, 3)}.${t.slice(3, 6)}.${t.slice(6, 9)}-${t.slice(9)}`
}

/** Doze posições (podem ter letras, como no CNPJ alfanumérico) mais dois dígitos. */
export function cnpj(base: string): string {
  const n = base.split('').map((c) => c.charCodeAt(0) - 48)
  n.push(digito(n, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]))
  n.push(digito(n, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]))
  const t = base + n.slice(12).join('')
  return `${t.slice(0, 2)}.${t.slice(2, 5)}.${t.slice(5, 8)}/${t.slice(8, 12)}-${t.slice(12)}`
}

// Datas -----------------------------------------------------------------------
// Relativas a hoje, para a semente sempre ter vencido, a vencer e em dia.

const agora = new Date()
const dois = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`
const emDias = (n: number) =>
  iso(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + n))
const mes = (n: number) => new Date(agora.getFullYear(), agora.getMonth() + n, 1)
const diaDo = (m: Date, dia: number) => iso(new Date(m.getFullYear(), m.getMonth(), dia))
const competencia = (m: Date) => `${m.getFullYear()}-${dois(m.getMonth() + 1)}`

/** Cria usuários, cadastros, contratos, lançamentos e uma importação. Devolve o id de cada conta. */
export async function semear(banco: BancoDeTeste): Promise<Record<string, string>> {
  const ids: Record<string, string> = {}
  for (const c of CONTAS) ids[c.email] = await banco.criarUsuario(c)

  await banco.db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [
      ids['admin@teste.local'],
    ])

    const ins = async (tabela: string, linha: Record<string, unknown>): Promise<string> => {
      const colunas = Object.keys(linha)
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.${tabela} (${colunas.join(', ')})
         values (${colunas.map((_, i) => `$${i + 1}`).join(', ')}) returning id`,
        Object.values(linha),
      )
      return rows[0].id
    }

    // Cadastros ---------------------------------------------------------------
    const locHolding = await ins('locadores', {
      nome_razao_social: 'Holding Aguiar Participações Ltda',
      tipo_pessoa: 'pj',
      cpf_cnpj: cnpj('112223330001'),
      email: 'holding@exemplo.teste',
      telefone: '(11) 3000-0001',
      dados_bancarios: 'Banco Exemplo, ag. 0001, c/c 12345-6',
    })
    const locMaria = await ins('locadores', {
      nome_razao_social: 'Maria Helena Aguiar',
      tipo_pessoa: 'pf',
      cpf_cnpj: cpf('123456789'),
      email: 'maria.aguiar@exemplo.teste',
      telefone: '(11) 98888-0002',
      dados_bancarios: 'Banco Exemplo, ag. 0002, c/c 54321-0',
    })
    const locCarlos = await ins('locadores', {
      nome_razao_social: 'Carlos Eduardo Aguiar',
      tipo_pessoa: 'pf',
      cpf_cnpj: cpf('987654321'),
      email: 'carlos.aguiar@exemplo.teste',
      telefone: '(11) 98888-0003',
    })

    const fiadorPedro = await ins('fiadores', {
      nome: 'Pedro Henrique Matos',
      cpf: cpf('111222333'),
      rg: '12.345.678-9',
      estado_civil: 'casado',
      conjuge_nome: 'Lúcia Matos',
      conjuge_cpf: cpf('444555666'),
      email: 'pedro.matos@exemplo.teste',
      telefone: '(11) 97777-0004',
      endereco_completo: 'Rua dos Ipês, 45, Vila Nova, São Paulo/SP',
    })
    await ins('fiadores', {
      nome: 'Sônia Regina Campos',
      cpf: cpf('777888999'),
      rg: '23.456.789-0',
      estado_civil: 'solteira',
      email: 'sonia.campos@exemplo.teste',
      telefone: '(11) 97777-0005',
      endereco_completo: 'Av. das Palmeiras, 900, Centro, Campinas/SP',
    })

    const inqJoao = await ins('inquilinos', {
      nome: 'João da Silva Souza',
      tipo_pessoa: 'pf',
      cpf: cpf('135792468'),
      rg: '34.567.890-1',
      data_nascimento: '1982-04-17',
      email: 'joao.souza@exemplo.teste',
      telefone: '(11) 96666-0006',
      endereco: 'Rua das Acácias, 120, apto 101, São Paulo/SP',
    })
    const inqPadaria = await ins('inquilinos', {
      nome: 'Padaria Pão Quente Ltda',
      tipo_pessoa: 'pj',
      cnpj: cnpj('1A2B3C4D0001'),
      nome_fantasia: 'Pão Quente',
      responsavel: 'Rita de Cássia Lopes',
      email: 'contato@paoquente.teste',
      telefone: '(11) 3555-0007',
      endereco: 'Av. Central, 300, sala 01, São Paulo/SP',
    })
    const inqAna = await ins('inquilinos', {
      nome: 'Ana Paula Ribeiro',
      tipo_pessoa: 'pf',
      cpf: cpf('246813579'),
      rg: '45.678.901-2',
      data_nascimento: '1990-11-02',
      email: 'ana.ribeiro@exemplo.teste',
      telefone: '(11) 95555-0008',
      endereco: 'Rua do Sol, 77, Campinas/SP',
      status: 'inativo',
    })
    await ins('inquilinos', {
      nome: 'Roberto Lima Nogueira',
      tipo_pessoa: 'pf',
      cpf: cpf('369258147'),
      data_nascimento: '1975-08-23',
      email: 'roberto.nogueira@exemplo.teste',
      telefone: '(11) 94444-0009',
      endereco: 'Rua Verde, 12, São Paulo/SP',
    })

    const forEletricista = await ins('fornecedores', {
      nome: 'Eletricista Silva e Filhos ME',
      nome_fantasia: 'Silva Elétrica',
      cnpj_cpf: cnpj('445556660001'),
      tipo_fornecedor: 'eletricista',
      contato: 'Sr. Silva',
      email: 'silva.eletrica@exemplo.teste',
      telefone: '(11) 93333-0010',
      servicos_prestados: 'Instalações e reparos elétricos',
    })
    const forCondominio = await ins('fornecedores', {
      nome: 'Condomínio Edifício Aguiar Centro',
      cnpj_cpf: cnpj('777888990001'),
      tipo_fornecedor: 'condominio',
      contato: 'Síndica Marta',
      email: 'sindico@aguiarcentro.teste',
      telefone: '(11) 3222-0011',
    })

    // Imóveis, unidades e contratos -------------------------------------------
    const impApto = await ins('imoveis', {
      codigo: 'IMV-001',
      nome: 'Apartamento Jardim das Flores',
      endereco: 'Rua das Acácias',
      numero: '120',
      complemento: 'Apto 101',
      bairro: 'Jardim das Flores',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01001-000',
      matricula: '12345',
      cib: '9.876.543-2',
      inscricao_imobiliaria: '123.456.7890-1',
      tipo: 'apartamento',
      area: 68.5,
      quartos: 2,
      banheiros: 1,
      vagas: 1,
      valor: 2800,
      valor_estimado: 520000,
      valor_imovel: 520000,
      iptus: ['123.456.7890-1'],
    })
    const impPredio = await ins('imoveis', {
      codigo: 'IMV-002',
      nome: 'Edifício Aguiar Centro',
      endereco: 'Avenida Central',
      numero: '300',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01010-100',
      matricula: '67890',
      tipo: 'sala_comercial',
      area: 240,
      valor: 4500,
      valor_estimado: 1800000,
      valor_imovel: 1800000,
      iptus: ['222.333.4444-5', '222.333.4445-3'],
    })
    const impCasa = await ins('imoveis', {
      codigo: 'IMV-003',
      nome: 'Casa Vila Nova',
      endereco: 'Rua dos Ipês',
      numero: '45',
      bairro: 'Vila Nova',
      cidade: 'Campinas',
      estado: 'SP',
      cep: '13010-200',
      tipo: 'casa',
      area: 120,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      valor: 3200,
      valor_estimado: 640000,
      valor_imovel: 640000,
    })

    const sala1 = await ins('imovel_unidades', {
      imovel_id: impPredio,
      identificador: 'Sala 01',
      tipo_unidade: 'comercial',
      codigo_energia: 'ENE-0001',
      codigo_agua: 'AGU-0001',
      tem_condominio: true,
      valor_condominio: 650,
    })
    await ins('imovel_unidades', {
      imovel_id: impPredio,
      identificador: 'Sala 02',
      tipo_unidade: 'comercial',
      codigo_energia: 'ENE-0002',
      codigo_agua: 'AGU-0002',
      tem_condominio: true,
      valor_condominio: 650,
    })
    await ins('imovel_unidades', {
      imovel_id: impPredio,
      identificador: 'Loja Térrea',
      tipo_unidade: 'comercial',
      codigo_energia: 'ENE-0003',
      tem_condominio: true,
      valor_condominio: 900,
      taxa_poco: 40,
    })

    // O número do contrato (NNN/AAAA) nasce no gatilho; o imóvel passa a "alugado" também.
    const contApto = await ins('contratos', {
      imovel: impApto,
      inquilino: inqJoao,
      locador_id: locMaria,
      fiador_id: fiadorPedro,
      data_inicio: diaDo(mes(-8), 1),
      data_fim: diaDo(mes(16), 1),
      valor_aluguel: 2800,
      dia_vencimento: 5,
      indice_reajuste: 'IGPM',
      periodicidade_reajuste: 'anual',
      proxima_data_reajuste: emDias(20),
      tipo_garantia: 'fiador',
      status: 'ativo',
    })
    const contPredio = await ins('contratos', {
      imovel: impPredio,
      unidade_id: sala1,
      inquilino: inqPadaria,
      locador_id: locHolding,
      data_inicio: diaDo(mes(-14), 10),
      data_fim: emDias(25),
      valor_aluguel: 4500,
      dia_vencimento: 10,
      indice_reajuste: 'IPCA',
      periodicidade_reajuste: 'anual',
      tipo_garantia: 'caução',
      valor_garantia: 13500,
      status: 'ativo',
    })
    await ins('contratos', {
      imovel: impCasa,
      inquilino: inqAna,
      locador_id: locCarlos,
      data_inicio: diaDo(mes(-30), 1),
      data_fim: diaDo(mes(-2), 0),
      valor_aluguel: 3200,
      dia_vencimento: 15,
      tipo_garantia: 'sem garantia',
      status: 'encerrado',
    })

    // Financeiro ----------------------------------------------------------------
    const { rows: categorias } = await tx.query<{ id: string; nome: string; tipo: string }>(
      `select id, nome, tipo from public.categorias_financeiras`,
    )
    const categoria = (tipo: string, nome: string) =>
      categorias.find((c) => c.tipo === tipo && c.nome === nome)!.id

    /** Aluguel de um mês. `situacao` 'em_dia' = pago; 'parcial' = metade; 'aberto' = sem pagamento (vence conforme o dia). */
    const receita = (
      imovel: string,
      contrato: string,
      inquilino: string,
      deslocamento: number,
      valor: number,
      dia: number,
      situacao: string,
    ) => {
      const m = mes(deslocamento)
      const vencimento = diaDo(m, dia)
      const recebido = situacao === 'em_dia' ? valor : situacao === 'parcial' ? valor / 2 : null
      return ins('receitas', {
        imovel,
        contrato,
        inquilino,
        categoria: categoria('receita', 'Aluguel'),
        descricao: `Aluguel ${competencia(m)}`,
        competencia: competencia(m),
        valor,
        valor_previsto: valor,
        valor_recebido: recebido,
        data: vencimento,
        data_vencimento: vencimento,
        data_recebimento: recebido ? (vencimento > emDias(0) ? emDias(0) : vencimento) : null,
        forma_recebimento: 'pix',
      })
    }
    await receita(impApto, contApto, inqJoao, -2, 2800, 5, 'em_dia')
    await receita(impApto, contApto, inqJoao, -1, 2800, 5, 'em_dia')
    await receita(impApto, contApto, inqJoao, 0, 2800, 5, 'aberto')
    await receita(impPredio, contPredio, inqPadaria, -2, 4500, 10, 'em_dia')
    await receita(impPredio, contPredio, inqPadaria, -1, 4500, 10, 'aberto') // vencida e sem pagamento: em atraso
    await receita(impPredio, contPredio, inqPadaria, 0, 4500, 10, 'parcial')
    await receita(impPredio, contPredio, inqPadaria, 1, 4500, 10, 'aberto') // do mês que vem: previsto

    const despesa = (
      imovel: string,
      fornecedor: string,
      categ: string,
      descricao: string,
      deslocamento: number,
      valor: number,
      dia: number,
      pago: boolean,
    ) => {
      const m = mes(deslocamento)
      const vencimento = diaDo(m, dia)
      return ins('despesas', {
        imovel,
        fornecedor,
        categoria: categoria('despesa', categ),
        descricao,
        competencia: competencia(m),
        valor,
        valor_previsto: valor,
        valor_pago: pago ? valor : null,
        data: vencimento,
        data_vencimento: vencimento,
        data_pagamento: pago ? vencimento : null,
        forma_pagamento: 'boleto',
      })
    }
    await despesa(impPredio, forCondominio, 'Condomínio', 'Condomínio Sala 01', -2, 650, 8, true)
    await despesa(impPredio, forCondominio, 'Condomínio', 'Condomínio Sala 01', -1, 650, 8, true)
    await despesa(impPredio, forCondominio, 'Condomínio', 'Condomínio Sala 01', 0, 650, 8, false)
    await despesa(
      impApto,
      forEletricista,
      'Manutenção',
      'Troca de fiação da cozinha',
      -1,
      480,
      20,
      true,
    )
    await despesa(
      impApto,
      forEletricista,
      'Manutenção',
      'Revisão do quadro de luz',
      0,
      350,
      1,
      false,
    ) // vencida: em atraso
    await despesa(
      impApto,
      forEletricista,
      'Manutenção',
      'Troca de lâmpadas das áreas comuns',
      0,
      120,
      2,
      true,
    )
    await despesa(
      impCasa,
      forEletricista,
      'Contas de consumo',
      'Energia da casa vaga',
      1,
      190,
      12,
      false,
    ) // previsto

    await ins('iptu_taxas', {
      imovel: impApto,
      tipo: 'iptu',
      descricao: 'IPTU 2026 - parcela única',
      ano_referencia: agora.getFullYear(),
      valor: 1890,
      vencimento: emDias(-30), // sem pagamento: o gatilho marca como vencido
    })
    await ins('iptu_taxas', {
      imovel: impPredio,
      tipo: 'iptu',
      descricao: 'IPTU 2026 - parcela única',
      ano_referencia: agora.getFullYear(),
      valor: 8240,
      vencimento: emDias(45),
    })

    // Extrato para classificar ----------------------------------------------------
    const conta = await ins('contas_bancarias', {
      nome: 'Conta Corrente Principal',
      banco: 'Banco Exemplo S.A.',
      agencia: '0001',
      conta: '12345-6',
      saldo_inicial: 15000,
    })
    const importacao = await ins('importacoes', {
      conta_bancaria: conta,
      arquivo_nome: 'extrato-mes-anterior.csv',
      formato: 'csv',
      total_transacoes: 3,
    })
    const lancamentos: [string, string, number, string, string | null][] = [
      [emDias(-12), 'PIX RECEBIDO JOAO DA SILVA SOUZA', 2800, 'credito', 'receita'],
      [emDias(-10), 'TARIFA MANUTENCAO DE CONTA', 29.9, 'debito', null],
      [emDias(-8), 'PAGTO BOLETO COND EDIF AGUIAR CENTRO', 650, 'debito', 'despesa'],
    ]
    for (const [data, descricao, valor, tipo, sugestao] of lancamentos) {
      await ins('transacoes_importadas', {
        importacao,
        data,
        descricao,
        valor,
        tipo,
        sugestao_tipo: sugestao,
        sugestao_categoria:
          sugestao === 'receita' ? 'Aluguel' : sugestao === 'despesa' ? 'Condomínio' : null,
        sugestao_categoria_id: sugestao
          ? categoria(sugestao, sugestao === 'receita' ? 'Aluguel' : 'Condomínio')
          : null,
        sugestao_confianca: sugestao ? 0.9 : null,
      })
    }

    // Convite pendente: permite testar /signup por convite e a tela de usuários.
    await ins('convites', {
      email: 'convidado@teste.local',
      token: 'convite-local-0001',
      perfil: 'usuario',
      data_expiracao: `${emDias(7)}T12:00:00Z`,
    })
  })

  return ids
}
