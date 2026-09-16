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
} from 'lucide-react'

export type ModuloPermissao =
  | 'imoveis'
  | 'inquilinos'
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

export type NivelPermissao = 'sem_acesso' | 'visualizacao' | 'edicao'

export interface PermissaoModulo {
  modulo: ModuloPermissao
  nivel: NivelPermissao
}

export interface MenuItem {
  title: string
  path: string
  icon: LucideIcon
  description: string
  adminOnly?: boolean
  modulo?: ModuloPermissao
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
]

export const MODULES_LIST: MenuItem[] = [
  {
    title: 'Início',
    path: '/',
    icon: Home,
    description: 'Visão geral e acesso rápido aos módulos',
  },
  {
    title: 'Alertas',
    path: '/alertas',
    icon: Bell,
    description: 'Central de vencimentos de contratos, receitas, despesas e IPTU',
    modulo: 'alertas',
  },
  {
    title: 'Relatórios',
    path: '/relatorios',
    icon: FileSpreadsheet,
    description: 'Geração e exportação de relatórios em PDF e Excel',
    modulo: 'relatorios',
  },
  {
    title: 'Importar Extrato',
    path: '/importar-extrato',
    icon: UploadCloud,
    description: 'Upload de extratos bancários CSV/OFX e conciliação',
    modulo: 'importar_extrato',
  },
  {
    title: 'Classificar Transações',
    path: '/classificar-transacoes',
    icon: ListChecks,
    description: 'Fila de classificação e lançamento inteligente',
    modulo: 'classificar_transacoes',
  },
  {
    title: 'Imóveis',
    path: '/imoveis',
    icon: Building2,
    description: 'Gestão de edifícios, casas e salas comerciais',
    modulo: 'imoveis',
  },
  {
    title: 'Inquilinos',
    path: '/inquilinos',
    icon: Users,
    description: 'Cadastro e dados de contato dos locatários',
    modulo: 'inquilinos',
  },
  {
    title: 'Contratos',
    path: '/contratos',
    icon: FileText,
    description: 'Contratos de locação, reajustes e prazos',
    modulo: 'contratos',
  },
  {
    title: 'Receitas',
    path: '/receitas',
    icon: TrendingUp,
    description: 'Recebimento de aluguéis e taxas',
    modulo: 'receitas',
  },
  {
    title: 'Despesas',
    path: '/despesas',
    icon: TrendingDown,
    description: 'Controle de custos, obras e manutenção',
    modulo: 'despesas',
  },
  {
    title: 'IPTU e Taxas',
    path: '/iptu-taxas',
    icon: Receipt,
    description: 'Acompanhamento do IPTU, condomínio e impostos',
    modulo: 'iptu_taxas',
  },
  {
    title: 'Fornecedores',
    path: '/fornecedores',
    icon: Truck,
    description: 'Prestadores de serviço e parceiros',
    modulo: 'fornecedores',
  },
  {
    title: 'Usuários',
    path: '/usuarios',
    icon: UserCog,
    description: 'Gestão de permissões, convites e acessos do sistema',
    adminOnly: true,
  },
  {
    title: 'Logs de Atividade',
    path: '/logs-atividade',
    icon: History,
    description: 'Auditoria de acessos, criações, edições e exclusões no sistema',
    adminOnly: true,
  },
  {
    title: 'Dashboard Financeiro',
    path: '/dashboard-financeiro',
    icon: BarChart3,
    description: 'Indicadores financeiros e fluxo de caixa',
    modulo: 'dashboards',
  },
  {
    title: 'Dashboard de Imóveis',
    path: '/dashboard-imoveis',
    icon: PieChart,
    description: 'Métricas de ocupação e rendimento',
    modulo: 'dashboards',
  },
  {
    // Rota pública: fica visível para todo usuário logado, sem permissão de módulo.
    title: 'Simulador IBS/CBS',
    path: '/simulador',
    icon: Calculator,
    description: 'Simulação do IBS e da CBS sobre a locação (LC 214/2025)',
  },
]
