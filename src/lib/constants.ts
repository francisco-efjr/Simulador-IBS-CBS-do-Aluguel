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

/**
 * Perfil de acesso (migração 20261008120001). É o perfil que decide o acesso:
 * não há mais permissão marcada módulo a módulo.
 */
export type PerfilUsuario = 'administrador' | 'gratuito'

export const ROTULO_DO_PERFIL: Record<PerfilUsuario, string> = {
  administrador: 'Administrador',
  gratuito: 'Gratuito',
}

export const DESCRICAO_DO_PERFIL: Record<PerfilUsuario, string> = {
  administrador: 'Acessa e edita tudo, sem limite de imóveis.',
  gratuito: 'Início, Imóveis, Inquilinos, Locadores e fiadores e Contratos. Até 3 imóveis ativos.',
}

/**
 * Módulos do perfil gratuito, com edição. Espelha public.modulos_do_gratuito()
 * no banco: mudar um é mudar o outro. Fiadores vêm junto de Contratos (no
 * banco) e de Locadores (na tela). Início não é módulo: é aberto a todos.
 */
export const MODULOS_DO_GRATUITO: readonly ModuloPermissao[] = ['imoveis', 'inquilinos', 'locadores', 'contratos']

/** Nível de acesso de um perfil num módulo. Conta inativa não chega aqui. */
export function nivelDoPerfil(perfil: PerfilUsuario, modulo: ModuloPermissao): NivelPermissao {
  if (perfil === 'administrador') return 'edicao'
  return MODULOS_DO_GRATUITO.includes(modulo) ? 'edicao' : 'sem_acesso'
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
    // O quadro acompanha a construção do sistema: fica fora do perfil gratuito.
    title: 'Quadro de andamento',
    path: '/quadro',
    icon: SquareKanban,
    description: 'Histórias do sistema, critérios de aceitação e homologação',
    grupo: 'Gestão',
    modulo: 'quadro',
  },
  {
    title: 'Usuários e perfis',
    path: '/usuarios',
    icon: UserCog,
    description: 'Perfis de acesso, convites e contas do sistema',
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
    // A rota segue pública (abre sem login); no menu, fica fora do perfil gratuito.
    title: 'Simulador IBS/CBS',
    path: '/simulador',
    icon: Calculator,
    description: 'Simulação do IBS e da CBS sobre a locação (LC 214/2025)',
    grupo: 'Ferramentas',
    adminOnly: true,
  },
]

export const MENU_ITEMS: MenuItem[] = MODULES_LIST
