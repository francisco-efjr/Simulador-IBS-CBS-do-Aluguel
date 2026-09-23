import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ShieldAlert,
  History,
  Search,
  Filter,
  RefreshCw,
  User,
  Activity,
  Layers,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getLogsAtividade, type LogAtividadeRecord } from '@/services/logs-atividade'
import { getUsuarios, type UsuarioRecord } from '@/services/usuarios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { formatDateTime, formatDate } from '@/lib/format'

// Os valores são os do enum `acao_auditoria` e os nomes das tabelas auditadas
// pelo gatilho `tg_registrar_log` — é isso que o banco grava em cada linha.
const ACOES_OPCOES = [
  { value: 'todas', label: 'Todas as ações' },
  { value: 'criou', label: 'Criação' },
  { value: 'editou', label: 'Edição' },
  { value: 'excluiu', label: 'Exclusão' },
]

const ENTIDADES_OPCOES = [
  { value: 'todas', label: 'Todas as entidades' },
  { value: 'imoveis', label: 'Imóveis' },
  { value: 'inquilinos', label: 'Inquilinos' },
  { value: 'contratos', label: 'Contratos' },
  { value: 'receitas', label: 'Receitas' },
  { value: 'despesas', label: 'Despesas' },
  { value: 'iptu_taxas', label: 'IPTU e Taxas' },
  { value: 'fornecedores', label: 'Fornecedores' },
  { value: 'convites', label: 'Convites' },
  { value: 'importacoes', label: 'Importações de Extrato' },
  { value: 'contas_bancarias', label: 'Contas Bancárias' },
  { value: 'documentos_anexos', label: 'Documentos Anexos' },
  { value: 'users', label: 'Usuários' },
  { value: 'permissoes', label: 'Permissões' },
  { value: 'historias', label: 'Quadro de histórias' },
]

export default function LogsAtividade() {
  const { isAdministrador, user: currentUser } = useAuth()

  // Lista de logs e paginação
  const [logs, setLogs] = useState<LogAtividadeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Lista de usuários para o filtro
  const [usuarios, setUsuarios] = useState<UsuarioRecord[]>([])

  // Filtros
  const [selectedUsuario, setSelectedUsuario] = useState('todos')
  const [selectedAcao, setSelectedAcao] = useState('todas')
  const [selectedEntidade, setSelectedEntidade] = useState('todas')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Carregar lista de usuários para o filtro
  useEffect(() => {
    if (isAdministrador) {
      getUsuarios()
        .then(setUsuarios)
        .catch(() => {})
    }
  }, [isAdministrador])

  // Carregar dados de logs
  const fetchLogs = useCallback(async () => {
    if (!isAdministrador) return
    setLoading(true)
    try {
      const res = await getLogsAtividade({
        page,
        perPage,
        usuario: selectedUsuario,
        acao: selectedAcao,
        entidade: selectedEntidade,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        search: debouncedSearch || undefined,
      })
      setLogs(res.items)
      setTotalItems(res.totalItems)
      setTotalPages(res.totalPages)
    } catch {
      toast.error(
        'Não foi possível carregar o histórico de atividades. Atualize a página e tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }, [
    isAdministrador,
    page,
    perPage,
    selectedUsuario,
    selectedAcao,
    selectedEntidade,
    dataInicio,
    dataFim,
    debouncedSearch,
  ])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Atualização em tempo real na coleção de logs
  useRealtime('logs_atividade', () => {
    // Se estiver na página 1, recarrega suavemente
    if (page === 1) {
      fetchLogs()
    }
  })

  // Limpar todos os filtros
  const handleClearFilters = () => {
    setSelectedUsuario('todos')
    setSelectedAcao('todas')
    setSelectedEntidade('todas')
    setDataInicio('')
    setDataFim('')
    setSearch('')
    setPage(1)
  }

  const hasActiveFilters =
    selectedUsuario !== 'todos' ||
    selectedAcao !== 'todas' ||
    selectedEntidade !== 'todas' ||
    Boolean(dataInicio) ||
    Boolean(dataFim) ||
    Boolean(search)

  // Exportar logs filtrados para CSV
  const handleExportCsv = () => {
    if (logs.length === 0) {
      toast.error('Não há registros para exportar.')
      return
    }

    const headers = ['Data e Hora', 'Usuário', 'E-mail', 'Ação', 'Entidade', 'Detalhes']
    const rows = logs.map((log) => [
      formatDateTime(log.created),
      log.expand?.usuario?.name || 'Sistema / Não identificado',
      log.expand?.usuario?.email || '',
      log.acao,
      log.entidade,
      `"${(log.detalhes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `auditoria_holding_aguiar_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Relatório de atividades exportado com sucesso.')
  }

  // Estilização de badges para Ações
  const renderAcaoBadge = (acao: string) => {
    const norm = (acao || '').toLowerCase()
    if (norm === 'criou') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold hover:bg-emerald-100 text-xs">
          Criou
        </Badge>
      )
    }
    if (norm === 'editou') {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold hover:bg-blue-100 text-xs">
          Editou
        </Badge>
      )
    }
    if (norm === 'excluiu') {
      return (
        <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold hover:bg-rose-100 text-xs">
          Excluiu
        </Badge>
      )
    }
    if (norm === 'ativou') {
      return (
        <Badge className="bg-teal-100 text-teal-800 border-teal-300 font-semibold hover:bg-teal-100 text-xs">
          Ativou
        </Badge>
      )
    }
    if (norm === 'desativou') {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold hover:bg-amber-100 text-xs">
          Desativou
        </Badge>
      )
    }
    if (norm === 'convidou') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-semibold hover:bg-purple-100 text-xs">
          Convidou
        </Badge>
      )
    }
    if (norm === 'importou') {
      return (
        <Badge className="bg-cyan-100 text-cyan-800 border-cyan-300 font-semibold hover:bg-cyan-100 text-xs">
          Importou
        </Badge>
      )
    }
    if (norm === 'cancelou' || norm === 'encerrou') {
      return (
        <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-semibold hover:bg-slate-100 text-xs">
          {norm.charAt(0).toUpperCase() + norm.slice(1)}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-slate-700 border-slate-300 text-xs font-medium">
        {acao}
      </Badge>
    )
  }

  // Estilização de badges para Entidades
  const renderEntidadeBadge = (entidade: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      imoveis: { label: 'Imóvel', color: 'bg-navy-100 text-navy-800 border-navy-200' },
      inquilinos: { label: 'Inquilino', color: 'bg-sky-100 text-sky-800 border-sky-200' },
      contratos: { label: 'Contrato', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      receitas: { label: 'Receita', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      despesas: { label: 'Despesa', color: 'bg-rose-100 text-rose-800 border-rose-200' },
      iptu_taxas: { label: 'IPTU/Taxa', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      fornecedores: {
        label: 'Fornecedor',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
      },
      users: { label: 'Usuário', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      permissoes: { label: 'Permissão', color: 'bg-pink-100 text-pink-800 border-pink-200' },
      documentos_anexos: {
        label: 'Documento',
        color: 'bg-violet-100 text-violet-800 border-violet-200',
      },
      convites: { label: 'Convite', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' },
      importacoes: { label: 'Extrato', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
      contas_bancarias: {
        label: 'Conta Bancária',
        color: 'bg-slate-100 text-slate-800 border-slate-200',
      },
      historias: { label: 'História', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    }

    const item = labels[entidade] || { label: entidade, color: 'bg-slate-100 text-slate-700' }
    return (
      <Badge variant="outline" className={`${item.color} font-semibold text-xs`}>
        {item.label}
      </Badge>
    )
  }

  if (!isAdministrador) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gold-500/30 bg-gradient-to-r from-navy-950 to-navy-900 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/20 text-gold-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Log de Atividades e Auditoria</h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Acesso restrito: somente administradores do sistema têm permissão para visualizar o
                log de auditoria.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Holding Aguiar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 p-6 text-white shadow-xl border border-navy-700/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-400 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-gold-400" /> Holding Aguiar &bull; Governança &
              Auditoria
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="h-6 w-6 text-gold-400" /> Registro de Atividades do Sistema
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Rastreabilidade completa de todas as criações, alterações, exclusões e acessos efetuados
            no sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
            className="border-navy-600 bg-navy-900/90 text-white hover:bg-navy-800 hover:text-gold-300 text-xs h-9"
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin text-gold-400' : ''}`}
            />
            Atualizar
          </Button>

          <Button
            onClick={handleExportCsv}
            className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold text-xs h-9 shadow-lg shadow-gold-500/20 active:scale-[0.98] transition-all"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-navy-950" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      <Card className="border-slate-200/90 shadow-sm bg-white">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gold-600" />
              <CardTitle className="text-sm font-bold text-slate-800">
                Filtros de Auditoria
              </CardTitle>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 text-xs text-rose-700 hover:text-rose-700 hover:bg-rose-50"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
            {/* Campo de Busca Livre */}
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Search className="h-3 w-3 text-slate-600" /> Buscar nos detalhes
              </label>
              <div className="relative">
                <Input
                  placeholder="Ex: Apartamento, Contrato, Maria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 text-xs pl-3 bg-slate-50/70 border-slate-200"
                />
              </div>
            </div>

            {/* Seletor de Usuário */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <User className="h-3 w-3 text-slate-600" /> Usuário
              </label>
              <Select
                value={selectedUsuario}
                onValueChange={(val) => {
                  setSelectedUsuario(val)
                  setPage(1)
                }}
              >
                <SelectTrigger
                  aria-label="Todos os usuários"
                  className="h-9 text-xs bg-slate-50/70 border-slate-200"
                >
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos" className="text-xs">
                    Todos os usuários
                  </SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Ação */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Activity className="h-3 w-3 text-slate-600" /> Ação
              </label>
              <Select
                value={selectedAcao}
                onValueChange={(val) => {
                  setSelectedAcao(val)
                  setPage(1)
                }}
              >
                <SelectTrigger
                  aria-label="Todas as ações"
                  className="h-9 text-xs bg-slate-50/70 border-slate-200"
                >
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  {ACOES_OPCOES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Entidade */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Layers className="h-3 w-3 text-slate-600" /> Módulo / Entidade
              </label>
              <Select
                value={selectedEntidade}
                onValueChange={(val) => {
                  setSelectedEntidade(val)
                  setPage(1)
                }}
              >
                <SelectTrigger
                  aria-label="Todas as entidades"
                  className="h-9 text-xs bg-slate-50/70 border-slate-200"
                >
                  <SelectValue placeholder="Todas as entidades" />
                </SelectTrigger>
                <SelectContent>
                  {ENTIDADES_OPCOES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período (Data Início e Fim) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-600" /> Período
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => {
                    setDataInicio(e.target.value)
                    setPage(1)
                  }}
                  className="h-9 text-xs px-1.5 bg-slate-50/70 border-slate-200"
                  title="Data Início"
                />
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => {
                    setDataFim(e.target.value)
                    setPage(1)
                  }}
                  className="h-9 text-xs px-1.5 bg-slate-50/70 border-slate-200"
                  title="Data Fim"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-slate-50/70 border-b border-slate-200 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold text-slate-800">
              Registros Encontrados ({totalItems})
            </CardTitle>
            <span className="text-xs text-slate-600 font-normal">
              &bull; Ordenados por data mais recente
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Linhas por página:</span>
            <Select
              value={String(perPage)}
              onValueChange={(val) => {
                setPerPage(Number(val))
                setPage(1)
              }}
            >
              <SelectTrigger className="h-7 w-20 text-xs bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15" className="text-xs">
                  15
                </SelectItem>
                <SelectItem value="25" className="text-xs">
                  25
                </SelectItem>
                <SelectItem value="50" className="text-xs">
                  50
                </SelectItem>
                <SelectItem value="100" className="text-xs">
                  100
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200">
                <TableHead className="font-semibold text-slate-700 text-xs w-[160px]">
                  Data / Hora
                </TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs w-[200px]">
                  Usuário Responsável
                </TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs w-[110px]">
                  Ação
                </TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs w-[130px]">
                  Entidade
                </TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs">
                  Detalhes da Ação
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center text-slate-600">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
                      <span className="text-xs font-medium">
                        Carregando registros de auditoria...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-600 text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History className="h-8 w-8 text-slate-300" />
                      <p className="font-medium text-slate-600">
                        Nenhum registro de log encontrado.
                      </p>
                      <p className="text-xs text-slate-600">
                        {hasActiveFilters
                          ? 'Tente ajustar ou limpar os filtros aplicados acima.'
                          : 'As ações executadas no sistema serão registradas automaticamente aqui.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const usuarioName =
                    log.expand?.usuario?.name || log.expand?.usuario?.email || 'Sistema'
                  const usuarioEmail = log.expand?.usuario?.email || ''
                  const isCurrentUser = log.usuario === currentUser?.id

                  return (
                    <TableRow
                      key={log.id}
                      className="border-slate-100 hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Data / Hora */}
                      <TableCell className="text-xs text-slate-600 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                          <span>{formatDateTime(log.created)}</span>
                        </div>
                      </TableCell>

                      {/* Usuário Responsável */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-800 font-bold text-xs">
                            {usuarioName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-slate-900 truncate flex items-center gap-1">
                              {usuarioName}
                              {isCurrentUser && (
                                <span className="text-xs text-gold-700 bg-gold-50 border border-gold-300 px-1 rounded">
                                  Você
                                </span>
                              )}
                            </div>
                            {usuarioEmail && (
                              <div className="text-xs text-slate-600 truncate">{usuarioEmail}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Ação */}
                      <TableCell>{renderAcaoBadge(log.acao)}</TableCell>

                      {/* Entidade */}
                      <TableCell>{renderEntidadeBadge(log.entidade)}</TableCell>

                      {/* Detalhes */}
                      <TableCell className="text-xs text-slate-700 font-normal leading-relaxed">
                        <span className="break-words">
                          {log.detalhes || 'Sem detalhes adicionais'}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Barra de Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50/60">
            <div className="text-xs text-slate-600">
              Página <strong className="text-slate-800">{page}</strong> de{' '}
              <strong className="text-slate-800">{totalPages}</strong> &bull; Total de{' '}
              <strong className="text-slate-800">{totalItems}</strong> registros
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-8 px-2.5 text-xs border-slate-200 bg-white hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 p-0 text-xs ${
                        page === pageNum
                          ? 'bg-navy-900 text-gold-400 font-bold hover:bg-navy-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-8 px-2.5 text-xs border-slate-200 bg-white hover:bg-slate-50"
              >
                Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
