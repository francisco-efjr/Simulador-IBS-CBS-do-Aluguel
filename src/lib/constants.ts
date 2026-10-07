import {
  Home,
  Building2,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Receipt,
  Truck,
  UserCog,
  BarChart3,
  PieChart,
  UploadCloud,
  ListChecks,
  LucideIcon,
  Bell,
  FileSpreadsheet,
  History,
  Calculator,
  SquareKanban,
  UserCheck,
  ScrollText,
} from 'lucide-react'

export type ModuloPermissao =
  | 'imoveis'
  | 'inquilinos'
  | 'locadores'
  | 'fornecedores'
  | 'contratos'
  | 'receitas'
  | 'despesas'
  | 'iptu_taxas'
  | 'dashboards'
  | 'alertas'
  | 'relatorios'
  | 'importar_extrato'
  | 'classificar_transacoes'
  | 'quadro'

export type NivelPermissao = 'sem_acesso' | 'visualizacao' | 'edicao'

export interface PermissaoModulo {
  modulo: ModuloPermissao
  nivel: NivelPermissao
}

export const GRUPOS_MENU = [
  'Visão geral',
  'Extratos',
  'Cadastros',
  'Financeiro',
  'Análise',
  'Gestão',
  'Ferramentas',
] as const

export type GrupoMenu = (typeof GRUPOS_MENU)[number]

export interface MenuItem {
  title: string
  path: string
  icon: LucideIcon
  description: string
  adminOnly?: boolean
  modulo?: ModuloPermissao
  /** Grupo do menu lateral (rótulo em caixa alta acima dos itens). */
  grupo: GrupoMenu
}

export interface ModuloInfo {
  id: ModuloPermissao
  nome: string
  descricao: string
  rotas: string[]
}

export const MODULOS_SISTEMA: ModuloInfo[] = [
  {
    id: 'imoveis',
    nome: 'Imóveis',
    descricao: 'Cadastro e gestão de propriedades imobiliárias',
    rotas: ['/imoveis'],
  },
  {
    id: 'inquilinos',
    nome: 'Inquilinos',
    descricao: 'Gestão de locatários e contatos',
    rotas: ['/inquilinos'],
  },
  {
    id: 'locadores',
    nome: 'Locadores',
    descricao: 'Cadastro de proprietários e repasses',
    rotas: ['/locadores'],
  },
  {
    id: 'fornecedores',
    nome: 'Fornecedores',
    descricao: 'Prestadores de serviço e fornecedores parceiros',
    rotas: ['/fornecedores'],
  },
  {
    id: 'contratos',
    nome: 'Contratos',
    descricao: 'Contratos de locação, prazos e reajustes',
    rotas: ['/contratos'],
  },
  {
    id: 'receitas',
    nome: 'Receitas',
    descricao: 'Controle de aluguéis e entradas financeiras',
    rotas: ['/receitas'],
  },
  {
    id: 'despesas',
    nome: 'Despesas',
    descricao: 'Controle de pagamentos, custos e contas',
    rotas: ['/despesas'],
  },
  {
    id: 'iptu_taxas',
    nome: 'IPTU/Taxas',
    descricao: 'Controle de tributos e taxas imobiliárias',
    rotas: ['/iptu-taxas'],
  },
  {
    id: 'dashboards',
    nome: 'Dashboards',
    descricao: 'Painéis consolidados Financeiro e de Imóveis',
    rotas: ['/dashboard-financeiro', '/dashboard-imoveis'],
  },
  {
    id: 'alertas',
    nome: 'Alertas',
    descricao: 'Central de vencimentos e pendências',
    rotas: ['/alertas'],
  },
  {
    id: 'relatorios',
    nome: 'Relatórios',
    descricao: 'Geração e exportação de relatórios PDF e Excel',
    rotas: ['/relatorios'],
  },
  {
    id: 'importar_extrato',
    nome: 'Importar Extrato',
    descricao: 'Upload de extratos OFX, CSV e extratos bancários',
    rotas: ['/importar-extrato', '/historico-importacoes'],
  },
  {
    id: 'classificar_transacoes',
    nome: 'Classificar Transações',
    descricao: 'Fila de conciliação e classificação de extratos',
    rotas: ['/classificar-transacoes'],
  },
  {
    id: 'quadro',
    nome: 'Quadro de histórias',
    descricao: 'Quem cria, edita e move histórias do quadro (ler é aberto a todos)',
    rotas: ['/quadro', '/'],
  },
]

export const MODULES_LIST: MenuItem[] = [
  {
    title: 'Início',
    path: '/inicio',
    icon: Home,
    description: 'Visão geral e acesso rápido aos módulos',
    grupo: 'Visão geral',
  },
  {
    title: 'Importar extrato',
    path: '/importar-extrato',
    icon: UploadCloud,
    description: 'Upload de extratos bancários CSV/OFX e conciliação',
    grupo: 'Extratos',
    modulo: 'importar_extrato',
  },
  {
    title: 'Histórico de importações',
    path: '/historico-importacoes',
    icon: History,
    description: 'Importações já feitas, com o que entrou e o que foi descartado',
    grupo: 'Extratos',
    modulo: 'importar_extrato',
  },
  {
    title: 'Classificar transações',
    path: '/classificar-transacoes',
    icon: ListChecks,
    description: 'Fila de classificação e lançamento inteligente',
    grupo: 'Extratos',
    modulo: 'classificar_transacoes',
  },
  {
    title: 'Imóveis',
    path: '/imoveis',
    icon: Building2,
    description: 'Gestão de edifícios, casas e salas comerciais',
    grupo: 'Cadastros',
    modulo: 'imoveis',
  },
  {
    title: 'Inquilinos',
    path: '/inquilinos',
    icon: Users,
    description: 'Cadastro e dados de contato dos locatários',
    grupo: 'Cadastros',
    modulo: 'inquilinos',
  },
  {
    title: 'Locadores e fiadores',
    path: '/locadores',
    icon: UserCheck,
    description: 'Cadastro de proprietários e repasses',
    grupo: 'Cadastros',
    modulo: 'locadores',
  },
  {
    title: 'Fornecedores',
    path: '/fornecedores',
    icon: Truck,
    description: 'Prestadores de serviço e parceiros',
    grupo: 'Cadastros',
    modulo: 'fornecedores',
  },
  {
    title: 'Contratos',
    path: '/contratos',
    icon: FileText,
    description: 'Contratos de locação, reajustes e prazos',
    grupo: 'Cadastros',
    modulo: 'contratos',
  },
  {
    title: 'Receitas',
    path: '/receitas',
    icon: TrendingUp,
    description: 'Recebimento de aluguéis e taxas',
    grupo: 'Financeiro',
    modulo: 'receitas',
  },
  {
    title: 'Despesas',
    path: '/despesas',
    icon: TrendingDown,
    description: 'Controle de custos, obras e manutenção',
    grupo: 'Financeiro',
    modulo: 'despesas',
  },
  {
    title: 'IPTU e taxas',
    path: '/iptu-taxas',
    icon: Receipt,
    description: 'Acompanhamento do IPTU, condomínio e impostos',
    grupo: 'Financeiro',
    modulo: 'iptu_taxas',
  },
  {
    title: 'Dashboard financeiro',
    path: '/dashboard-financeiro',
    icon: BarChart3,
    description: 'Indicadores financeiros e fluxo de caixa',
    grupo: 'Análise',
    modulo: 'dashboards',
  },
  {
    title: 'Dashboard de imóveis',
    path: '/dashboard-imoveis',
    icon: PieChart,
    description: 'Métricas de ocupação e rendimento',
    grupo: 'Análise',
    modulo: 'dashboards',
  },
  {
    title: 'Alertas',
    path: '/alertas',
    icon: Bell,
    description: 'Central de vencimentos de contratos, receitas, despesas e IPTU',
    grupo: 'Análise',
    modulo: 'alertas',
  },
  {
    title: 'Relatórios',
    path: '/relatorios',
    icon: FileSpreadsheet,
    description: 'Geração e exportação de relatórios em PDF e Excel',
    grupo: 'Análise',
    modulo: 'relatorios',
  },
  {
    // Ler o quadro é aberto a todos; o módulo 'quadro' decide só quem edita.
    title: 'Quadro de andamento',
    path: '/quadro',
    icon: SquareKanban,
    description: 'Histórias do sistema, critérios de aceitação e homologação',
    grupo: 'Gestão',
  },
  {
    title: 'Usuários e permissões',
    path: '/usuarios',
    icon: UserCog,
    description: 'Gestão de permissões, convites e acessos do sistema',
    grupo: 'Gestão',
    adminOnly: true,
  },
  {
    title: 'Logs de atividade',
    path: '/logs-atividade',
    icon: ScrollText,
    description: 'Auditoria de acessos, criações, edições e exclusões no sistema',
    grupo: 'Gestão',
    adminOnly: true,
  },
  {
    // Rota pública: fica visível para todo usuário logado, sem permissão de módulo.
    title: 'Simulador IBS/CBS',
    path: '/simulador',
    icon: Calculator,
    description: 'Simulação do IBS e da CBS sobre a locação (LC 214/2025)',
    grupo: 'Ferramentas',
  },
]

export const MENU_ITEMS: MenuItem[] = MODULES_LIST
