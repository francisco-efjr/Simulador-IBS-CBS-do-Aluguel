/**
 * Dados de demonstração do Controle de Imóveis.
 *
 * As datas são calculadas a partir de hoje, não fixas no calendário: assim os
 * alertas de vencimento, os gráficos mensais e a régua de inadimplência
 * continuam fazendo sentido em qualquer dia que a demonstração for aberta.
 */

export interface MockRecord {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  [field: string]: unknown
}

const pad = (value: number) => String(value).padStart(2, '0')

const isoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const isoMonth = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`

const stamp = (date: Date) =>
  `${isoDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.000Z`

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const addMonths = (date: Date, months: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

/** Dia `day` do mês deslocado em `monthOffset` a partir de hoje. */
const monthDay = (today: Date, monthOffset: number, day: number) => {
  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
  return new Date(base.getFullYear(), base.getMonth(), Math.min(day, lastDay))
}

function record(
  collectionName: string,
  id: string,
  created: Date,
  fields: Record<string, unknown>,
): MockRecord {
  return {
    id,
    collectionId: `mock_${collectionName}`,
    collectionName,
    created: stamp(created),
    updated: stamp(created),
    ...fields,
  }
}

export function buildSeedData(): Record<string, MockRecord[]> {
  const today = new Date()
  const longAgo = addMonths(today, -14)

  /* ------------------------------------------------------------------ users */

  const users: MockRecord[] = [
    record('users', 'usr_francisco', longAgo, {
      email: 'francisco@holdingaguiar.com.br',
      name: 'Francisco Aguiar',
      perfil: 'administrador',
      ativo: true,
      permissoes: [],
      avatar: '',
      emailVisibility: true,
      verified: true,
    }),
    record('users', 'usr_beatriz', addMonths(today, -11), {
      email: 'beatriz@holdingaguiar.com.br',
      name: 'Beatriz Nunes',
      perfil: 'administrador',
      ativo: true,
      permissoes: [],
      avatar: '',
      emailVisibility: true,
      verified: true,
    }),
    record('users', 'usr_marcelo', addMonths(today, -7), {
      email: 'marcelo.contabil@holdingaguiar.com.br',
      name: 'Marcelo Tavares',
      perfil: 'usuario',
      ativo: true,
      avatar: '',
      emailVisibility: true,
      verified: true,
      permissoes: [
        { modulo: 'receitas', nivel: 'edicao' },
        { modulo: 'despesas', nivel: 'edicao' },
        { modulo: 'iptu_taxas', nivel: 'edicao' },
        { modulo: 'relatorios', nivel: 'visualizacao' },
        { modulo: 'dashboards', nivel: 'visualizacao' },
        { modulo: 'imoveis', nivel: 'visualizacao' },
        { modulo: 'contratos', nivel: 'visualizacao' },
      ],
    }),
    record('users', 'usr_carla', addMonths(today, -4), {
      email: 'carla.locacao@holdingaguiar.com.br',
      name: 'Carla Menezes',
      perfil: 'usuario',
      ativo: false,
      avatar: '',
      emailVisibility: true,
      verified: true,
      permissoes: [
        { modulo: 'imoveis', nivel: 'edicao' },
        { modulo: 'inquilinos', nivel: 'edicao' },
        { modulo: 'contratos', nivel: 'edicao' },
      ],
    }),
  ]

  /* --------------------------------------------------------------- imóveis */

  const imoveisSeed = [
    {
      id: 'imv_01',
      codigo: 'AG-001',
      nome: 'Edifício Aurora — Apto 402',
      tipo: 'apartamento',
      status: 'alugado',
      endereco: 'Rua Padre Chagas',
      numero: '185',
      complemento: 'Apto 402',
      bairro: 'Moinhos de Vento',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '90570-080',
      area: 96,
      quartos: 3,
      banheiros: 2,
      vagas: 1,
      valor: 4200,
      valor_estimado: 890000,
      matricula: '84.221',
      inscricao_imobiliaria: '1102938-4',
      observacoes: 'Reformado em 2024. Condomínio inclui água e gás.',
    },
    {
      id: 'imv_02',
      codigo: 'AG-002',
      nome: 'Casa Bela Vista',
      tipo: 'casa',
      status: 'alugado',
      endereco: 'Rua Ramiro Barcelos',
      numero: '2340',
      complemento: '',
      bairro: 'Bom Fim',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '90035-003',
      area: 180,
      quartos: 4,
      banheiros: 3,
      vagas: 2,
      valor: 6800,
      valor_estimado: 1450000,
      matricula: '51.907',
      inscricao_imobiliaria: '2209841-7',
      observacoes: 'Pátio amplo nos fundos. Telhado revisado no último inverno.',
    },
    {
      id: 'imv_03',
      codigo: 'AG-003',
      nome: 'Sala Comercial Center Plaza',
      tipo: 'sala_comercial',
      status: 'alugado',
      endereco: 'Av. Carlos Gomes',
      numero: '1155',
      complemento: 'Sala 708',
      bairro: 'Auxiliadora',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '90480-004',
      area: 52,
      quartos: 0,
      banheiros: 1,
      vagas: 1,
      valor: 3100,
      valor_estimado: 520000,
      matricula: '77.014',
      inscricao_imobiliaria: '3310772-1',
      observacoes: 'Locação para pessoa jurídica. Contrato com reajuste IGP-M.',
    },
    {
      id: 'imv_04',
      codigo: 'AG-004',
      nome: 'Loja Rua da Praia',
      tipo: 'loja',
      status: 'alugado',
      endereco: 'Rua dos Andradas',
      numero: '920',
      complemento: 'Loja 3',
      bairro: 'Centro Histórico',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '90020-004',
      area: 78,
      quartos: 0,
      banheiros: 2,
      vagas: 0,
      valor: 5400,
      valor_estimado: 740000,
      matricula: '33.488',
      inscricao_imobiliaria: '4417220-9',
      observacoes: 'Ponto comercial consolidado, vitrine para a rua.',
    },
    {
      id: 'imv_05',
      codigo: 'AG-005',
      nome: 'Residencial Vila Nova — Apto 201',
      tipo: 'apartamento',
      status: 'alugado',
      endereco: 'Rua Felipe de Oliveira',
      numero: '76',
      complemento: 'Apto 201',
      bairro: 'Petrópolis',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '90630-000',
      area: 68,
      quartos: 2,
      banheiros: 1,
      vagas: 1,
      valor: 2750,
      valor_estimado: 480000,
      matricula: '62.135',
      inscricao_imobiliaria: '5528114-3',
      observacoes: '',
    },
    {
      id: 'imv_06',
      codigo: 'AG-006',
      nome: 'Galpão Distrito Industrial',
      tipo: 'galpao',
      status: 'alugado',
      endereco: 'Av. Severo Dullius',
      numero: '4500',
      complemento: 'Módulo B',
      bairro: 'São João',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '90200-310',
      area: 640,
      quartos: 0,
      banheiros: 2,
      vagas: 6,
      valor: 12500,
      valor_estimado: 2300000,
      matricula: '19.776',
      inscricao_imobiliaria: '6639055-2',
      observacoes: 'Pé-direito de 8m, doca para carga e descarga.',
    },
    {
      id: 'imv_07',
      codigo: 'AG-007',
      nome: 'Apartamento Menino Deus — Apto 104',
      tipo: 'apartamento',
      status: 'vago',
      endereco: 'Rua José de Alencar',
      numero: '412',
      complemento: 'Apto 104',
      bairro: 'Menino Deus',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '90880-480',
      area: 74,
      quartos: 2,
      banheiros: 2,
      vagas: 1,
      valor: 2900,
      valor_estimado: 510000,
      matricula: '45.302',
      inscricao_imobiliaria: '7740188-6',
      observacoes: 'Disponível para locação desde a saída do último inquilino.',
    },
    {
      id: 'imv_08',
      codigo: 'AG-008',
      nome: 'Casa Tristeza',
      tipo: 'casa',
      status: 'em_manutencao',
      endereco: 'Rua Doutor Campos Velho',
      numero: '1890',
      complemento: '',
      bairro: 'Cristal',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '90810-050',
      area: 140,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      valor: 3800,
      valor_estimado: 690000,
      matricula: '28.664',
      inscricao_imobiliaria: '8851299-0',
      observacoes: 'Reforma elétrica e hidráulica em andamento.',
    },
  ]

  const imoveis: MockRecord[] = imoveisSeed.map((imovel, index) =>
    record('imoveis', imovel.id, addMonths(today, -13 + index), {
      ...imovel,
      fotos: [],
      inquilino_atual: '',
      created_by: 'usr_francisco',
      updated_by: 'usr_francisco',
    }),
  )

  /* ------------------------------------------------------------ inquilinos */

  const inquilinosSeed = [
    {
      id: 'inq_01',
      nome: 'Helena Castro Ribeiro',
      tipo_pessoa: 'pf',
      cpf: '472.318.990-15',
      rg: '3045782911',
      email: 'helena.castro@email.com',
      telefone: '(51) 99812-4477',
      data_nascimento: '1987-03-22',
      status: 'ativo',
    },
    {
      id: 'inq_02',
      nome: 'Rodrigo Salles Amorim',
      tipo_pessoa: 'pf',
      cpf: '318.774.220-08',
      rg: '2098431756',
      email: 'rodrigo.amorim@email.com',
      telefone: '(51) 99640-1182',
      data_nascimento: '1979-11-04',
      status: 'ativo',
    },
    {
      id: 'inq_03',
      nome: 'Vetor Contabilidade Ltda.',
      tipo_pessoa: 'pj',
      cnpj: '18.442.907/0001-63',
      nome_fantasia: 'Vetor Contábil',
      responsavel: 'Sandra Kruger',
      email: 'financeiro@vetorcontabil.com.br',
      telefone: '(51) 3222-8890',
      endereco: 'Av. Carlos Gomes, 1155 — Sala 708, Porto Alegre/RS',
      status: 'ativo',
    },
    {
      id: 'inq_04',
      nome: 'Comércio de Calçados Piratini ME',
      tipo_pessoa: 'pj',
      cnpj: '27.305.118/0001-40',
      nome_fantasia: 'Calçados Piratini',
      responsavel: 'Jorge Pacheco',
      email: 'jorge@calcadospiratini.com.br',
      telefone: '(51) 3028-4413',
      endereco: 'Rua dos Andradas, 920 — Loja 3, Porto Alegre/RS',
      status: 'ativo',
    },
    {
      id: 'inq_05',
      nome: 'Juliana Prates Moreira',
      tipo_pessoa: 'pf',
      cpf: '905.612.483-77',
      rg: '4471209833',
      email: 'ju.prates@email.com',
      telefone: '(51) 98155-7062',
      data_nascimento: '1993-07-19',
      status: 'ativo',
    },
    {
      id: 'inq_06',
      nome: 'Transportadora Sul Cargas S.A.',
      tipo_pessoa: 'pj',
      cnpj: '09.771.554/0001-27',
      nome_fantasia: 'Sul Cargas',
      responsavel: 'Antônio Bertoldo',
      email: 'contratos@sulcargas.com.br',
      telefone: '(51) 3371-6600',
      endereco: 'Av. Severo Dullius, 4500 — Módulo B, Porto Alegre/RS',
      status: 'ativo',
    },
    {
      id: 'inq_07',
      nome: 'Patrícia Lemos Vasconcelos',
      tipo_pessoa: 'pf',
      cpf: '660.294.117-32',
      rg: '1188304572',
      email: 'patricia.lemos@email.com',
      telefone: '(51) 99327-8814',
      data_nascimento: '1985-01-30',
      status: 'ativo',
      observacoes: 'Histórico de pagamento em dia nos últimos três anos.',
    },
    {
      id: 'inq_08',
      nome: 'Eduardo Nogueira Lima',
      tipo_pessoa: 'pf',
      cpf: '224.508.663-91',
      rg: '5520118477',
      email: 'eduardo.nlima@email.com',
      telefone: '(51) 99004-5521',
      data_nascimento: '1990-09-08',
      status: 'inativo',
      observacoes: 'Contrato encerrado. Vistoria de saída sem pendências.',
    },
  ]

  const inquilinos: MockRecord[] = inquilinosSeed.map((inquilino, index) =>
    record('inquilinos', inquilino.id, addMonths(today, -13 + index), {
      ...inquilino,
      created_by: 'usr_francisco',
      updated_by: 'usr_francisco',
    }),
  )

  /* ----------------------------------------------------------- fornecedores */

  const fornecedoresSeed = [
    {
      id: 'for_01',
      nome: 'Elétrica Mendes & Filhos Ltda.',
      nome_fantasia: 'Elétrica Mendes',
      tipo_fornecedor: 'eletricista',
      cnpj_cpf: '12.884.771/0001-05',
      contato: 'Ivan Mendes',
      email: 'contato@eletricamendes.com.br',
      telefone: '(51) 3019-4422',
      servicos_prestados: 'Instalação e manutenção elétrica, laudos e adequação de padrão.',
      status: 'ativo',
    },
    {
      id: 'for_02',
      nome: 'Hidráulica Cristal ME',
      nome_fantasia: 'Hidráulica Cristal',
      tipo_fornecedor: 'encanador',
      cnpj_cpf: '31.220.908/0001-74',
      contato: 'Luiz Fernando Rocha',
      email: 'atendimento@hidraulicacristal.com.br',
      telefone: '(51) 98844-2310',
      servicos_prestados: 'Desentupimento, troca de tubulação e caça-vazamentos.',
      status: 'ativo',
    },
    {
      id: 'for_03',
      nome: 'Construtora Vale Verde Ltda.',
      nome_fantasia: 'Vale Verde Obras',
      tipo_fornecedor: 'pedreiro',
      cnpj_cpf: '44.617.203/0001-18',
      contato: 'Sérgio Bastos',
      email: 'obras@valeverde.com.br',
      telefone: '(51) 3325-7719',
      servicos_prestados: 'Reformas estruturais, alvenaria e impermeabilização.',
      status: 'ativo',
    },
    {
      id: 'for_04',
      nome: 'Pinturas Horizonte',
      nome_fantasia: 'Pinturas Horizonte',
      tipo_fornecedor: 'pintor',
      cnpj_cpf: '702.338.490-26',
      contato: 'Nelson Tavares',
      email: 'nelson.pinturas@email.com',
      telefone: '(51) 99271-0053',
      servicos_prestados: 'Pintura interna e externa, textura e massa corrida.',
      status: 'ativo',
    },
    {
      id: 'for_05',
      nome: 'Porto Seguros Corretora S.A.',
      nome_fantasia: 'Porto Seguros Corretora',
      tipo_fornecedor: 'seguradora',
      cnpj_cpf: '05.114.882/0001-96',
      contato: 'Renata Bittencourt',
      email: 'renata@portocorretora.com.br',
      telefone: '(51) 3287-9000',
      servicos_prestados: 'Seguro incêndio, seguro-fiança e responsabilidade civil.',
      status: 'ativo',
    },
    {
      id: 'for_06',
      nome: 'Limpeza Total Serviços Ltda.',
      nome_fantasia: 'Limpeza Total',
      tipo_fornecedor: 'empresa_limpeza',
      cnpj_cpf: '58.903.447/0001-31',
      contato: 'Márcia Oliveira',
      email: 'comercial@limpezatotal.com.br',
      telefone: '(51) 3014-5566',
      servicos_prestados: 'Limpeza pós-obra e conservação de áreas comuns.',
      status: 'inativo',
    },
  ]

  const fornecedores: MockRecord[] = fornecedoresSeed.map((fornecedor, index) =>
    record('fornecedores', fornecedor.id, addMonths(today, -12 + index), {
      ...fornecedor,
      created_by: 'usr_francisco',
      updated_by: 'usr_francisco',
    }),
  )

  /* ---------------------------------------------- categorias financeiras */

  // Mesmos nomes das migrations 0010 e 0012, para a demonstração refletir o
  // catálogo real do sistema.
  const categoriasReceita = ['Aluguel', 'Multa', 'Juros', 'Reembolso', 'Outras receitas']
  const categoriasDespesa = [
    'Manutenção',
    'Reforma',
    'Comissão de corretagem',
    'Condomínio',
    'Contas de consumo',
    'Impostos',
    'Seguros',
    'Outros',
  ]

  const categorias: MockRecord[] = [
    ...categoriasReceita.map((nome, index) =>
      record('categorias_financeiras', `cat_r${index + 1}`, longAgo, {
        nome,
        tipo: 'receita',
        status: 'ativo',
        created_by: 'usr_francisco',
        updated_by: 'usr_francisco',
      }),
    ),
    ...categoriasDespesa.map((nome, index) =>
      record('categorias_financeiras', `cat_d${index + 1}`, longAgo, {
        nome,
        tipo: 'despesa',
        status: 'ativo',
        created_by: 'usr_francisco',
        updated_by: 'usr_francisco',
      }),
    ),
  ]

  const categoriaAluguel = 'cat_r1'

  /* ------------------------------------------------------------- contratos */

  const contratosSeed = [
    {
      id: 'ctr_01',
      numero: 'LOC-2024-011',
      imovel: 'imv_01',
      inquilino: 'inq_01',
      valor_aluguel: 4200,
      monthsStart: -20,
      monthsEnd: 10,
      dia_vencimento: 5,
      indice_reajuste: 'IGP-M',
      periodicidade_reajuste: 'anual',
      reajusteOffsetMonths: 4,
      tipo_garantia: 'caução',
      valor_garantia: 12600,
      status: 'ativo',
    },
    {
      id: 'ctr_02',
      numero: 'LOC-2024-018',
      imovel: 'imv_02',
      inquilino: 'inq_02',
      valor_aluguel: 6800,
      monthsStart: -17,
      monthsEnd: 7,
      dia_vencimento: 10,
      indice_reajuste: 'IPCA',
      periodicidade_reajuste: 'anual',
      reajusteOffsetMonths: 7,
      tipo_garantia: 'fiador',
      valor_garantia: 0,
      status: 'ativo',
    },
    {
      id: 'ctr_03',
      numero: 'LOC-2025-004',
      imovel: 'imv_03',
      inquilino: 'inq_03',
      valor_aluguel: 3100,
      monthsStart: -11,
      // Vence dentro de 30 dias: acende o alerta de término de contrato.
      monthsEnd: 0,
      dia_vencimento: 8,
      indice_reajuste: 'IGP-M',
      periodicidade_reajuste: 'anual',
      reajusteOffsetMonths: 1,
      tipo_garantia: 'seguro-fiança',
      valor_garantia: 0,
      status: 'ativo',
      observacoes: 'Inquilino sinalizou interesse em renovar por mais 24 meses.',
    },
    {
      id: 'ctr_04',
      numero: 'LOC-2025-009',
      imovel: 'imv_04',
      inquilino: 'inq_04',
      valor_aluguel: 5400,
      monthsStart: -9,
      monthsEnd: 15,
      dia_vencimento: 15,
      indice_reajuste: 'IPCA',
      periodicidade_reajuste: 'anual',
      reajusteOffsetMonths: 3,
      tipo_garantia: 'título de capitalização',
      valor_garantia: 16200,
      status: 'ativo',
    },
    {
      id: 'ctr_05',
      numero: 'LOC-2025-016',
      imovel: 'imv_05',
      inquilino: 'inq_05',
      valor_aluguel: 2750,
      monthsStart: -6,
      monthsEnd: 18,
      dia_vencimento: 20,
      indice_reajuste: 'IGP-M',
      periodicidade_reajuste: 'anual',
      reajusteOffsetMonths: 6,
      tipo_garantia: 'caução',
      valor_garantia: 8250,
      status: 'ativo',
    },
    {
      id: 'ctr_06',
      numero: 'LOC-2025-021',
      imovel: 'imv_06',
      inquilino: 'inq_06',
      valor_aluguel: 12500,
      monthsStart: -5,
      monthsEnd: 31,
      dia_vencimento: 25,
      indice_reajuste: 'IPCA',
      periodicidade_reajuste: 'anual',
      reajusteOffsetMonths: 7,
      tipo_garantia: 'seguro-fiança',
      valor_garantia: 0,
      status: 'ativo',
      observacoes: 'Contrato de 36 meses com carência de 2 meses já cumprida.',
    },
    {
      id: 'ctr_07',
      numero: 'LOC-2023-007',
      imovel: 'imv_07',
      inquilino: 'inq_08',
      valor_aluguel: 2600,
      monthsStart: -26,
      monthsEnd: -2,
      dia_vencimento: 5,
      indice_reajuste: 'IGP-M',
      periodicidade_reajuste: 'anual',
      reajusteOffsetMonths: -14,
      tipo_garantia: 'caução',
      valor_garantia: 7800,
      status: 'encerrado',
      observacoes: 'Encerrado no fim do prazo. Caução devolvida integralmente.',
    },
  ]

  const contratos: MockRecord[] = contratosSeed.map((contrato) => {
    const {
      monthsStart,
      monthsEnd,
      reajusteOffsetMonths,
      dia_vencimento: diaVencimento,
      ...rest
    } = contrato

    return record('contratos', contrato.id, monthDay(today, monthsStart, 1), {
      ...rest,
      dia_vencimento: diaVencimento,
      data_inicio: isoDate(monthDay(today, monthsStart, 1)),
      data_fim: isoDate(monthDay(today, monthsEnd, contrato.status === 'ativo' ? 20 : 28)),
      proxima_data_reajuste:
        contrato.status === 'ativo' ? isoDate(monthDay(today, reajusteOffsetMonths, 1)) : '',
      documento: '',
      created_by: 'usr_francisco',
      updated_by: 'usr_francisco',
    })
  })

  // Marca o inquilino atual nos imóveis com contrato ativo.
  contratosSeed
    .filter((contrato) => contrato.status === 'ativo')
    .forEach((contrato) => {
      const imovel = imoveis.find((item) => item.id === contrato.imovel)
      if (imovel) imovel.inquilino_atual = contrato.inquilino
    })

  /* -------------------------------------------------------------- receitas */

  const receitas: MockRecord[] = []
  const contratosAtivos = contratosSeed.filter((contrato) => contrato.status === 'ativo')

  contratosAtivos.forEach((contrato, contratoIndex) => {
    // Seis meses fechados, o mês corrente e o próximo previsto.
    for (let offset = -6; offset <= 1; offset++) {
      if (offset < contrato.monthsStart) continue

      const vencimento = monthDay(today, offset, contrato.dia_vencimento)
      const jaVenceu = vencimento.getTime() < today.getTime()

      // Um único contrato carrega a inadimplência do mês corrente — é o que
      // acende o alerta sem transformar a carteira inteira em atraso.
      const inadimplente = contratoIndex === 2 && offset === 0 && jaVenceu

      let statusFinanceiro: string
      if (offset < 0) statusFinanceiro = 'recebido'
      else if (inadimplente) statusFinanceiro = 'em_atraso'
      else if (offset === 0 && jaVenceu) statusFinanceiro = 'recebido'
      else statusFinanceiro = 'previsto'

      const recebido = statusFinanceiro === 'recebido'
      const formas = ['pix', 'transferencia', 'boleto', 'debito_automatico']

      receitas.push(
        record('receitas', `rec_${contrato.id}_${offset + 6}`, addDays(vencimento, -20), {
          imovel: contrato.imovel,
          contrato: contrato.id,
          inquilino: contrato.inquilino,
          categoria: categoriaAluguel,
          descricao: `Aluguel ${isoMonth(vencimento)} — ${contrato.numero}`,
          competencia: isoMonth(vencimento),
          valor: contrato.valor_aluguel,
          valor_previsto: contrato.valor_aluguel,
          valor_recebido: recebido ? contrato.valor_aluguel : 0,
          data: isoDate(vencimento),
          data_vencimento: isoDate(vencimento),
          data_recebimento: recebido ? isoDate(addDays(vencimento, -1)) : '',
          status: 'ativo',
          status_financeiro: statusFinanceiro,
          forma_recebimento: recebido ? formas[contratoIndex % formas.length] : '',
          observacoes: inadimplente ? 'Inquilino notificado por e-mail e telefone.' : '',
          transacao_importada_id: '',
          created_by: 'usr_francisco',
          updated_by: 'usr_francisco',
        }),
      )
    }
  })

  // Receitas avulsas, para o gráfico não virar uma única categoria.
  receitas.push(
    record('receitas', 'rec_multa_01', monthDay(today, -2, 12), {
      imovel: 'imv_04',
      contrato: 'ctr_04',
      inquilino: 'inq_04',
      categoria: 'cat_r2',
      descricao: 'Multa por atraso no aluguel',
      competencia: isoMonth(monthDay(today, -2, 1)),
      valor: 108,
      valor_previsto: 108,
      valor_recebido: 108,
      data: isoDate(monthDay(today, -2, 12)),
      data_vencimento: isoDate(monthDay(today, -2, 12)),
      data_recebimento: isoDate(monthDay(today, -2, 12)),
      status: 'ativo',
      status_financeiro: 'recebido',
      forma_recebimento: 'pix',
      created_by: 'usr_francisco',
      updated_by: 'usr_francisco',
    }),
    record('receitas', 'rec_reemb_01', monthDay(today, -1, 18), {
      imovel: 'imv_02',
      contrato: 'ctr_02',
      inquilino: 'inq_02',
      categoria: 'cat_r4',
      descricao: 'Reembolso de conserto de portão elétrico',
      competencia: isoMonth(monthDay(today, -1, 1)),
      valor: 640,
      valor_previsto: 640,
      valor_recebido: 640,
      data: isoDate(monthDay(today, -1, 18)),
      data_vencimento: isoDate(monthDay(today, -1, 18)),
      data_recebimento: isoDate(monthDay(today, -1, 20)),
      status: 'ativo',
      status_financeiro: 'recebido',
      forma_recebimento: 'transferencia',
      created_by: 'usr_beatriz',
      updated_by: 'usr_beatriz',
    }),
  )

  /* -------------------------------------------------------------- despesas */

  const despesasSeed = [
    {
      imovel: 'imv_08',
      fornecedor: 'for_01',
      categoria: 'cat_d2',
      descricao: 'Reforma elétrica completa — troca de quadro e fiação',
      valor: 14800,
      monthOffset: -1,
      dia: 12,
      status_financeiro: 'pago',
      forma: 'transferencia',
    },
    {
      imovel: 'imv_08',
      fornecedor: 'for_02',
      categoria: 'cat_d2',
      descricao: 'Substituição da tubulação hidráulica dos banheiros',
      valor: 9250,
      monthOffset: 0,
      dia: 8,
      status_financeiro: 'pago',
      forma: 'pix',
    },
    {
      imovel: 'imv_08',
      fornecedor: 'for_04',
      categoria: 'cat_d2',
      descricao: 'Pintura interna pós-reforma',
      valor: 6400,
      monthOffset: 1,
      dia: 10,
      status_financeiro: 'previsto',
      forma: '',
    },
    {
      imovel: 'imv_01',
      fornecedor: 'for_02',
      categoria: 'cat_d1',
      descricao: 'Reparo de vazamento na cozinha',
      valor: 780,
      monthOffset: -4,
      dia: 9,
      status_financeiro: 'pago',
      forma: 'pix',
    },
    {
      imovel: 'imv_02',
      fornecedor: 'for_03',
      categoria: 'cat_d1',
      descricao: 'Revisão e troca de telhas do telhado',
      valor: 3900,
      monthOffset: -3,
      dia: 21,
      status_financeiro: 'pago',
      forma: 'boleto',
    },
    {
      imovel: 'imv_03',
      fornecedor: '',
      categoria: 'cat_d4',
      descricao: 'Taxa condominial Center Plaza',
      valor: 620,
      monthOffset: -2,
      dia: 5,
      status_financeiro: 'pago',
      forma: 'debito_automatico',
    },
    {
      imovel: 'imv_03',
      fornecedor: '',
      categoria: 'cat_d4',
      descricao: 'Taxa condominial Center Plaza',
      valor: 620,
      monthOffset: -1,
      dia: 5,
      status_financeiro: 'pago',
      forma: 'debito_automatico',
    },
    {
      imovel: 'imv_03',
      fornecedor: '',
      categoria: 'cat_d4',
      descricao: 'Taxa condominial Center Plaza',
      valor: 640,
      monthOffset: 0,
      dia: 5,
      status_financeiro: 'pago',
      forma: 'debito_automatico',
    },
    {
      imovel: 'imv_06',
      fornecedor: 'for_05',
      categoria: 'cat_d7',
      descricao: 'Seguro incêndio anual — Galpão Distrito Industrial',
      valor: 4350,
      monthOffset: -2,
      dia: 28,
      status_financeiro: 'pago',
      forma: 'boleto',
    },
    {
      imovel: 'imv_04',
      fornecedor: 'for_05',
      categoria: 'cat_d7',
      descricao: 'Seguro-fiança — renovação anual',
      valor: 2180,
      monthOffset: -5,
      dia: 14,
      status_financeiro: 'pago',
      forma: 'boleto',
    },
    {
      imovel: 'imv_07',
      fornecedor: 'for_06',
      categoria: 'cat_d1',
      descricao: 'Limpeza pós-desocupação',
      valor: 890,
      monthOffset: -2,
      dia: 3,
      status_financeiro: 'pago',
      forma: 'pix',
    },
    {
      imovel: 'imv_07',
      fornecedor: '',
      categoria: 'cat_d3',
      descricao: 'Comissão de corretagem — captação de novo inquilino',
      valor: 2900,
      monthOffset: 1,
      dia: 25,
      status_financeiro: 'previsto',
      forma: '',
    },
    {
      imovel: 'imv_05',
      fornecedor: 'for_01',
      categoria: 'cat_d1',
      descricao: 'Troca de disjuntores e tomadas',
      valor: 540,
      monthOffset: -3,
      dia: 17,
      status_financeiro: 'pago',
      forma: 'pix',
    },
    {
      imovel: 'imv_06',
      fornecedor: '',
      categoria: 'cat_d5',
      descricao: 'Energia elétrica — área comum do galpão',
      valor: 1280,
      monthOffset: -1,
      dia: 22,
      status_financeiro: 'pago',
      forma: 'debito_automatico',
    },
    {
      imovel: 'imv_06',
      fornecedor: '',
      categoria: 'cat_d5',
      descricao: 'Energia elétrica — área comum do galpão',
      valor: 1195,
      monthOffset: 0,
      dia: 22,
      // Já venceu e segue em aberto: alimenta o alerta de despesa atrasada.
      status_financeiro: 'em_atraso',
      forma: '',
    },
    {
      imovel: 'imv_02',
      fornecedor: 'for_04',
      categoria: 'cat_d1',
      descricao: 'Pintura da fachada',
      valor: 5100,
      monthOffset: -6,
      dia: 11,
      status_financeiro: 'pago',
      forma: 'transferencia',
    },
    {
      imovel: 'imv_01',
      fornecedor: '',
      categoria: 'cat_d8',
      descricao: 'Vistoria cautelar de imóvel',
      valor: 420,
      monthOffset: -4,
      dia: 26,
      status_financeiro: 'pago',
      forma: 'pix',
    },
    {
      imovel: 'imv_04',
      fornecedor: 'for_03',
      categoria: 'cat_d1',
      descricao: 'Manutenção da porta de enrolar da loja',
      valor: 1350,
      monthOffset: 0,
      dia: 27,
      status_financeiro: 'previsto',
      forma: '',
    },
  ]

  const despesas: MockRecord[] = despesasSeed.map((despesa, index) => {
    const vencimento = monthDay(today, despesa.monthOffset, despesa.dia)
    const pago = despesa.status_financeiro === 'pago'

    return record('despesas', `des_${String(index + 1).padStart(2, '0')}`, addDays(vencimento, -8), {
      imovel: despesa.imovel,
      fornecedor: despesa.fornecedor,
      categoria: despesa.categoria,
      descricao: despesa.descricao,
      competencia: isoMonth(vencimento),
      valor: despesa.valor,
      valor_previsto: despesa.valor,
      valor_pago: pago ? despesa.valor : 0,
      data: isoDate(vencimento),
      data_vencimento: isoDate(vencimento),
      data_pagamento: pago ? isoDate(vencimento) : '',
      status: 'ativo',
      status_financeiro: despesa.status_financeiro,
      forma_pagamento: despesa.forma,
      observacoes: '',
      transacao_importada_id: '',
      created_by: 'usr_francisco',
      updated_by: 'usr_francisco',
    })
  })

  /* ------------------------------------------------------------ IPTU/taxas */

  const anoAtual = today.getFullYear()

  const iptuSeed = [
    { imovel: 'imv_01', tipo: 'iptu', valor: 2840, monthOffset: -5, dia: 10, status: 'pago' },
    { imovel: 'imv_02', tipo: 'iptu', valor: 4120, monthOffset: -5, dia: 10, status: 'pago' },
    { imovel: 'imv_03', tipo: 'iptu', valor: 1980, monthOffset: -4, dia: 10, status: 'pago' },
    { imovel: 'imv_04', tipo: 'iptu', valor: 3350, monthOffset: -4, dia: 10, status: 'pago' },
    { imovel: 'imv_05', tipo: 'iptu', valor: 1540, monthOffset: -3, dia: 10, status: 'pago' },
    // Vencido e em aberto.
    { imovel: 'imv_06', tipo: 'iptu', valor: 8760, monthOffset: -1, dia: 15, status: 'vencido' },
    // Vence dentro de 30 dias: entra na central de alertas.
    { imovel: 'imv_07', tipo: 'iptu', valor: 1720, monthOffset: 0, dia: 28, status: 'pendente' },
    {
      imovel: 'imv_08',
      tipo: 'taxa_municipal',
      valor: 460,
      monthOffset: 1,
      dia: 12,
      status: 'pendente',
    },
    {
      imovel: 'imv_01',
      tipo: 'taxa_condominio',
      valor: 780,
      monthOffset: 0,
      dia: 10,
      status: 'pago',
    },
    {
      imovel: 'imv_04',
      tipo: 'taxa_extraordinaria',
      valor: 2400,
      monthOffset: 1,
      dia: 20,
      status: 'pendente',
    },
  ]

  const iptuTaxas: MockRecord[] = iptuSeed.map((taxa, index) => {
    const vencimento = monthDay(today, taxa.monthOffset, taxa.dia)
    const pago = taxa.status === 'pago'

    return record(
      'iptu_taxas',
      `ipt_${String(index + 1).padStart(2, '0')}`,
      addDays(vencimento, -30),
      {
        imovel: taxa.imovel,
        tipo: taxa.tipo,
        descricao:
          taxa.tipo === 'iptu'
            ? `IPTU ${anoAtual} — cota única`
            : `${taxa.tipo === 'taxa_condominio' ? 'Taxa condominial' : taxa.tipo === 'taxa_municipal' ? 'Taxa municipal de conservação' : 'Taxa extraordinária de obras'} ${anoAtual}`,
        valor: taxa.valor,
        vencimento: isoDate(vencimento),
        ano_referencia: anoAtual,
        status: taxa.status,
        data_pagamento: pago ? isoDate(addDays(vencimento, -2)) : '',
        forma_pagamento: pago ? 'debito_automatico' : '',
        observacoes: taxa.status === 'vencido' ? 'Emitir segunda via com juros e multa.' : '',
        comprovante: '',
        created_by: 'usr_francisco',
        updated_by: 'usr_francisco',
      },
    )
  })

  /* -------------------------------------------------- contas e importações */

  const contasBancarias: MockRecord[] = [
    record('contas_bancarias', 'cba_01', addMonths(today, -14), {
      nome: 'Itaú — Conta Movimento',
      banco: 'Itaú Unibanco',
      agencia: '1521',
      conta: '04471-8',
      tipo: 'Conta Corrente',
      saldo_inicial: 85000,
      ativo: true,
      created_by: 'usr_francisco',
      updated_by: 'usr_francisco',
    }),
    record('contas_bancarias', 'cba_02', addMonths(today, -10), {
      nome: 'Banrisul — Reserva de Obras',
      banco: 'Banrisul',
      agencia: '0338',
      conta: '92015-4',
      tipo: 'Conta Poupança',
      saldo_inicial: 42000,
      ativo: true,
      created_by: 'usr_francisco',
      updated_by: 'usr_francisco',
    }),
  ]

  const importacoes: MockRecord[] = [
    record('importacoes', 'imp_01', monthDay(today, -2, 2), {
      conta_bancaria: 'cba_01',
      arquivo_nome: `extrato-itau-${isoMonth(monthDay(today, -3, 1))}.ofx`,
      formato: 'ofx',
      data_importacao: isoDate(monthDay(today, -2, 2)),
      total_transacoes: 18,
      transacoes_classificadas: 18,
      transacoes_ignoradas: 0,
      status: 'concluida',
      created_by: 'usr_francisco',
      updated_by: 'usr_francisco',
    }),
    record('importacoes', 'imp_02', monthDay(today, -1, 3), {
      conta_bancaria: 'cba_01',
      arquivo_nome: `extrato-itau-${isoMonth(monthDay(today, -2, 1))}.ofx`,
      formato: 'ofx',
      data_importacao: isoDate(monthDay(today, -1, 3)),
      total_transacoes: 15,
      transacoes_classificadas: 13,
      transacoes_ignoradas: 2,
      status: 'concluida',
      created_by: 'usr_francisco',
      updated_by: 'usr_francisco',
    }),
    record('importacoes', 'imp_03', monthDay(today, 0, 2), {
      conta_bancaria: 'cba_01',
      arquivo_nome: `extrato-itau-${isoMonth(monthDay(today, -1, 1))}.csv`,
      formato: 'csv',
      data_importacao: isoDate(monthDay(today, 0, 2)),
      total_transacoes: 9,
      transacoes_classificadas: 3,
      transacoes_ignoradas: 0,
      status: 'parcial',
      created_by: 'usr_francisco',
      updated_by: 'usr_francisco',
    }),
  ]

  // A importação parcial deixa uma fila de classificação pendente — é o estado
  // que faz a tela "Classificar Transações" ter o que mostrar.
  const transacoesSeed = [
    {
      descricao: 'PIX RECEBIDO HELENA C RIBEIRO',
      valor: 4200,
      tipo: 'credito',
      dia: 4,
      classificada: true,
      sugestao_tipo: 'receita',
      sugestao_categoria: 'Aluguel',
      sugestao_imovel: 'Edifício Aurora — Apto 402',
      sugestao_imovel_id: 'imv_01',
      sugestao_confianca: 0.96,
    },
    {
      descricao: 'TED RECEBIDA RODRIGO S AMORIM',
      valor: 6800,
      tipo: 'credito',
      dia: 9,
      classificada: true,
      sugestao_tipo: 'receita',
      sugestao_categoria: 'Aluguel',
      sugestao_imovel: 'Casa Bela Vista',
      sugestao_imovel_id: 'imv_02',
      sugestao_confianca: 0.94,
    },
    {
      descricao: 'PIX RECEBIDO VETOR CONTABILIDADE',
      valor: 3100,
      tipo: 'credito',
      dia: 8,
      classificada: true,
      sugestao_tipo: 'receita',
      sugestao_categoria: 'Aluguel',
      sugestao_imovel: 'Sala Comercial Center Plaza',
      sugestao_imovel_id: 'imv_03',
      sugestao_confianca: 0.91,
    },
    {
      descricao: 'TED RECEBIDA COM CALCADOS PIRATINI',
      valor: 5400,
      tipo: 'credito',
      dia: 14,
      classificada: false,
      sugestao_tipo: 'receita',
      sugestao_categoria: 'Aluguel',
      sugestao_imovel: 'Loja Rua da Praia',
      sugestao_imovel_id: 'imv_04',
      sugestao_confianca: 0.88,
    },
    {
      descricao: 'PIX RECEBIDO JULIANA P MOREIRA',
      valor: 2750,
      tipo: 'credito',
      dia: 19,
      classificada: false,
      sugestao_tipo: 'receita',
      sugestao_categoria: 'Aluguel',
      sugestao_imovel: 'Residencial Vila Nova — Apto 201',
      sugestao_imovel_id: 'imv_05',
      sugestao_confianca: 0.87,
    },
    {
      descricao: 'TED RECEBIDA SUL CARGAS SA',
      valor: 12500,
      tipo: 'credito',
      dia: 24,
      classificada: false,
      sugestao_tipo: 'receita',
      sugestao_categoria: 'Aluguel',
      sugestao_imovel: 'Galpão Distrito Industrial',
      sugestao_imovel_id: 'imv_06',
      sugestao_confianca: 0.93,
    },
    {
      descricao: 'PAGTO BOLETO HIDRAULICA CRISTAL ME',
      valor: -9250,
      tipo: 'debito',
      dia: 8,
      classificada: false,
      sugestao_tipo: 'despesa',
      sugestao_categoria: 'Reforma',
      sugestao_imovel: 'Casa Tristeza',
      sugestao_imovel_id: 'imv_08',
      sugestao_confianca: 0.79,
    },
    {
      descricao: 'DEB AUTOMATICO CEEE EQUATORIAL',
      valor: -1195,
      tipo: 'debito',
      dia: 22,
      classificada: false,
      sugestao_tipo: 'despesa',
      sugestao_categoria: 'Contas de consumo',
      sugestao_imovel: 'Galpão Distrito Industrial',
      sugestao_imovel_id: 'imv_06',
      sugestao_confianca: 0.72,
    },
    {
      descricao: 'TARIFA PACOTE DE SERVICOS',
      valor: -89.9,
      tipo: 'debito',
      dia: 5,
      classificada: false,
      sugestao_tipo: 'despesa',
      sugestao_categoria: 'Outros',
      sugestao_imovel: '',
      sugestao_imovel_id: '',
      sugestao_confianca: 0.34,
    },
  ]

  let saldoCorrente = 85000

  const transacoesImportadas: MockRecord[] = transacoesSeed.map((transacao, index) => {
    const data = monthDay(today, -1, transacao.dia)
    saldoCorrente += transacao.valor

    return record(
      'transacoes_importadas',
      `trx_${String(index + 1).padStart(2, '0')}`,
      monthDay(today, 0, 2),
      {
        importacao: 'imp_03',
        data: isoDate(data),
        descricao: transacao.descricao,
        valor: Math.abs(transacao.valor),
        tipo: transacao.tipo,
        saldo: Math.round(saldoCorrente * 100) / 100,
        classificada: transacao.classificada,
        ignorada: false,
        duplicata_detectada: false,
        duplicata_ids: [],
        sugestao_categoria: transacao.sugestao_categoria,
        sugestao_categoria_id: '',
        sugestao_imovel: transacao.sugestao_imovel,
        sugestao_imovel_id: transacao.sugestao_imovel_id,
        sugestao_tipo: transacao.sugestao_tipo,
        sugestao_confianca: transacao.sugestao_confianca,
        categoria_classificada: transacao.classificada ? transacao.sugestao_categoria : '',
        imovel_classificado: transacao.classificada ? transacao.sugestao_imovel : '',
        receita_gerada: '',
        despesa_gerada: '',
        created_by: 'usr_francisco',
        updated_by: 'usr_francisco',
      },
    )
  })

  /* ------------------------------------------------- convites e auditoria */

  const convites: MockRecord[] = [
    record('convites', 'cvt_01', addDays(today, -3), {
      email: 'novo.analista@holdingaguiar.com.br',
      token: 'demo-token-convite-001',
      perfil: 'usuario',
      status: 'pendente',
      data_expiracao: isoDate(addDays(today, 4)),
      criado_por: 'usr_francisco',
    }),
    record('convites', 'cvt_02', addDays(today, -20), {
      email: 'estagiario.financeiro@holdingaguiar.com.br',
      token: 'demo-token-convite-002',
      perfil: 'usuario',
      status: 'expirado',
      data_expiracao: isoDate(addDays(today, -13)),
      criado_por: 'usr_beatriz',
    }),
  ]

  const logsSeed = [
    { usuario: 'usr_francisco', acao: 'login', entidade: 'users', detalhes: 'Acesso ao sistema' },
    {
      usuario: 'usr_francisco',
      acao: 'criar',
      entidade: 'receitas',
      detalhes: 'Receita de aluguel lançada para o contrato LOC-2025-021',
    },
    {
      usuario: 'usr_beatriz',
      acao: 'editar',
      entidade: 'contratos',
      detalhes: 'Contrato LOC-2025-004 — observação de renovação registrada',
    },
    {
      usuario: 'usr_marcelo',
      acao: 'criar',
      entidade: 'despesas',
      detalhes: 'Despesa de reforma elétrica registrada para Casa Tristeza',
    },
    {
      usuario: 'usr_francisco',
      acao: 'importar',
      entidade: 'importacoes',
      detalhes: 'Extrato CSV importado com 9 transações',
    },
    {
      usuario: 'usr_marcelo',
      acao: 'editar',
      entidade: 'iptu_taxas',
      detalhes: 'IPTU do Galpão Distrito Industrial marcado como vencido',
    },
    {
      usuario: 'usr_beatriz',
      acao: 'criar',
      entidade: 'convites',
      detalhes: 'Convite enviado para novo.analista@holdingaguiar.com.br',
    },
    {
      usuario: 'usr_francisco',
      acao: 'editar',
      entidade: 'imoveis',
      detalhes: 'Imóvel AG-008 alterado para "Em manutenção"',
    },
    {
      usuario: 'usr_marcelo',
      acao: 'excluir',
      entidade: 'despesas',
      detalhes: 'Despesa duplicada removida da competência anterior',
    },
    {
      usuario: 'usr_francisco',
      acao: 'exportar',
      entidade: 'relatorios',
      detalhes: 'Relatório financeiro consolidado exportado em PDF',
    },
    {
      usuario: 'usr_beatriz',
      acao: 'login',
      entidade: 'users',
      detalhes: 'Acesso ao sistema',
    },
    {
      usuario: 'usr_francisco',
      acao: 'editar',
      entidade: 'users',
      detalhes: 'Usuária Carla Menezes desativada',
    },
  ]

  const logsAtividade: MockRecord[] = logsSeed.map((log, index) =>
    record('logs_atividade', `log_${String(index + 1).padStart(2, '0')}`, addDays(today, -index), {
      ...log,
    }),
  )

  return {
    users,
    imoveis,
    inquilinos,
    fornecedores,
    categorias_financeiras: categorias,
    contratos,
    receitas,
    despesas,
    iptu_taxas: iptuTaxas,
    contas_bancarias: contasBancarias,
    importacoes,
    transacoes_importadas: transacoesImportadas,
    convites,
    logs_atividade: logsAtividade,
    documentos_anexos: [],
    password_resets: [],
  }
}

/**
 * Relações por coleção, para o mock resolver `expand` como o PocketBase faz.
 * Chave = campo do registro, valor = coleção apontada.
 */
export const RELATIONS: Record<string, Record<string, string>> = {
  imoveis: {
    inquilino_atual: 'inquilinos',
    created_by: 'users',
    updated_by: 'users',
  },
  contratos: {
    imovel: 'imoveis',
    inquilino: 'inquilinos',
    created_by: 'users',
    updated_by: 'users',
  },
  receitas: {
    imovel: 'imoveis',
    contrato: 'contratos',
    inquilino: 'inquilinos',
    categoria: 'categorias_financeiras',
    created_by: 'users',
    updated_by: 'users',
  },
  despesas: {
    imovel: 'imoveis',
    fornecedor: 'fornecedores',
    categoria: 'categorias_financeiras',
    created_by: 'users',
    updated_by: 'users',
  },
  iptu_taxas: {
    imovel: 'imoveis',
    created_by: 'users',
    updated_by: 'users',
  },
  importacoes: {
    conta_bancaria: 'contas_bancarias',
    created_by: 'users',
    updated_by: 'users',
  },
  transacoes_importadas: {
    importacao: 'importacoes',
    created_by: 'users',
    updated_by: 'users',
  },
  convites: {
    criado_por: 'users',
  },
  logs_atividade: {
    usuario: 'users',
  },
  documentos_anexos: {
    created_by: 'users',
  },
  password_resets: {
    user: 'users',
  },
  inquilinos: {
    created_by: 'users',
    updated_by: 'users',
  },
  fornecedores: {
    created_by: 'users',
    updated_by: 'users',
  },
  categorias_financeiras: {
    created_by: 'users',
    updated_by: 'users',
  },
  contas_bancarias: {
    created_by: 'users',
    updated_by: 'users',
  },
}
