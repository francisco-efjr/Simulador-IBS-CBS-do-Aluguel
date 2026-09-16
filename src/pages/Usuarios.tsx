import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  UserPlus,
  Pencil,
  Power,
  Trash2,
  RefreshCw,
  Mail,
  Shield,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  ShieldAlert,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getUsuarios, updateUsuario, deleteUsuario, type UsuarioRecord } from '@/services/usuarios'
import {
  getConvites,
  reenviarConvite,
  cancelarConvite,
  deleteConvite,
  type ConviteRecord,
} from '@/services/convites'
import { ConvidarUsuarioDialog } from '@/components/usuarios/ConvidarUsuarioDialog'
import { UserFormDialog } from '@/components/usuarios/UserFormDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatDate } from '@/lib/format'

export default function Usuarios() {
  const { isAdministrador, user: currentUser } = useAuth()
  const [users, setUsers] = useState<UsuarioRecord[]>([])
  const [convites, setConvites] = useState<ConviteRecord[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingConvites, setLoadingConvites] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Dialogs state
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsuarioRecord | null>(null)

  // Confirm delete/cancel dialogs
  const [deleteUserTarget, setDeleteUserTarget] = useState<UsuarioRecord | null>(null)
  const [cancelInviteTarget, setCancelInviteTarget] = useState<ConviteRecord | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Copy token feedback
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoadingUsers(true)
      const usersData = await getUsuarios()
      setUsers(usersData)
    } catch {
      toast.error('Erro ao carregar lista de usuários')
    } finally {
      setLoadingUsers(false)
    }

    if (isAdministrador) {
      try {
        setLoadingConvites(true)
        const convitesData = await getConvites()
        setConvites(convitesData)
      } catch {
        // Ignorar se não tiver convites ou der erro de rede temporário
      } finally {
        setLoadingConvites(false)
      }
    }
  }, [isAdministrador])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime subscription
  useRealtime('users', loadData)
  useRealtime('convites', loadData)

  const handleEditUser = (user: UsuarioRecord) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }

  const handleToggleAtivo = async (user: UsuarioRecord) => {
    if (user.id === currentUser?.id) {
      toast.error('Você não pode desativar sua própria conta.')
      return
    }
    const novoStatus = user.ativo !== false
    try {
      await updateUsuario(user.id, { ativo: !novoStatus })
      toast.success(novoStatus ? 'Usuário desativado com sucesso' : 'Usuário ativado com sucesso')
      loadData()
    } catch {
      toast.error('Erro ao atualizar status do usuário')
    }
  }

  const handleTogglePerfil = async (user: UsuarioRecord) => {
    if (user.id === currentUser?.id) {
      toast.error('Você não pode alterar seu próprio perfil de administrador.')
      return
    }
    const novoPerfil = user.perfil === 'administrador' ? 'usuario' : 'administrador'
    try {
      await updateUsuario(user.id, { perfil: novoPerfil })
      toast.success(
        `Perfil de ${user.name || user.email} alterado para ${novoPerfil === 'administrador' ? 'Administrador' : 'Usuário'}`,
      )
      loadData()
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Erro ao alterar papel'
      toast.error(msg)
    }
  }

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserTarget) return
    if (deleteUserTarget.id === currentUser?.id) {
      toast.error('Você não pode remover sua própria conta.')
      setDeleteUserTarget(null)
      return
    }

    setActionLoading(true)
    try {
      await deleteUsuario(deleteUserTarget.id)
      toast.success('Usuário removido com sucesso!')
      setDeleteUserTarget(null)
      loadData()
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Erro ao remover usuário.'
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReenviarConvite = async (convite: ConviteRecord) => {
    try {
      await reenviarConvite(convite.id)
      toast.success(`E-mail de convite reenviado para ${convite.email}! (Válido por mais 7 dias)`)
      loadData()
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Erro ao reenviar convite.'
      toast.error(msg)
    }
  }

  const handleConfirmCancelInvite = async () => {
    if (!cancelInviteTarget) return
    setActionLoading(true)
    try {
      await cancelarConvite(cancelInviteTarget.id)
      toast.success('Convite cancelado!')
      setCancelInviteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao cancelar convite.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteInvite = async (conviteId: string) => {
    try {
      await deleteConvite(conviteId)
      toast.success('Registro de convite excluído.')
      loadData()
    } catch {
      toast.error('Erro ao excluir convite.')
    }
  }

  const handleCopyInviteLink = (convite: ConviteRecord) => {
    const link = `${window.location.origin}/signup?token=${convite.token}`
    navigator.clipboard.writeText(link)
    setCopiedTokenId(convite.id)
    toast.success('Link do convite copiado!')
    setTimeout(() => setCopiedTokenId(null), 3000)
  }

  // Filtragem
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users
    const term = searchTerm.toLowerCase()
    return users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.perfil && u.perfil.toLowerCase().includes(term)),
    )
  }, [users, searchTerm])

  const filteredConvites = useMemo(() => {
    if (!searchTerm.trim()) return convites
    const term = searchTerm.toLowerCase()
    return convites.filter(
      (c) =>
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.status && c.status.toLowerCase().includes(term)) ||
        (c.perfil && c.perfil.toLowerCase().includes(term)),
    )
  }, [convites, searchTerm])

  const pendentesCount = convites.filter((c) => c.status === 'pendente').length

  const getPerfilBadge = (perfil: string) => {
    if (perfil === 'administrador') {
      return (
        <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-semibold gap-1 hover:bg-amber-100">
          <Shield className="h-3 w-3 text-amber-600" /> Administrador
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium gap-1">
        <UserCheck className="h-3 w-3 text-slate-500" /> Usuário
      </Badge>
    )
  }

  const getConviteStatusBadge = (status: string, dataExpiracao: string) => {
    const today = new Date().toISOString().slice(0, 10)
    const isExpirado = status === 'expirado' || (status === 'pendente' && dataExpiracao < today)

    if (isExpirado) {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 gap-1 font-medium"
        >
          <AlertTriangle className="h-3 w-3 text-red-500" /> Expirado
        </Badge>
      )
    }
    if (status === 'pendente') {
      return (
        <Badge className="bg-gold-50 text-gold-800 border border-gold-300 gap-1 font-semibold hover:bg-gold-50">
          <Clock className="h-3 w-3 text-gold-600 animate-pulse" /> Convite Pendente
        </Badge>
      )
    }
    if (status === 'aceito') {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-semibold hover:bg-emerald-50">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Aceito
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-slate-100 text-slate-500 gap-1">
        <XCircle className="h-3 w-3 text-slate-400" /> Cancelado
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
              <h2 className="text-xl font-bold text-white">Gestão de Usuários</h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Apenas administradores podem convidar novos usuários ou alterar permissões de
                acesso.
              </p>
            </div>
          </div>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-800 mb-2">Seus dados de acesso</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Nome</span>
                <span className="font-medium text-slate-800">
                  {currentUser?.name || 'Não informado'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">E-mail</span>
                <span className="font-medium text-slate-800">{currentUser?.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Papel no Sistema</span>
                <div className="mt-1">{getPerfilBadge(currentUser?.perfil || 'usuario')}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Status da Conta</span>
                <Badge className="bg-emerald-100 text-emerald-800 mt-1 hover:bg-emerald-100">
                  Ativa
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Holding Aguiar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 p-6 text-white shadow-xl border border-navy-700/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-400">
              Holding Aguiar &bull; Governança
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Gestão de Usuários e Acessos
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Convide colaboradores, defina permissões de administrador e controle o acesso à
            plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setInviteModalOpen(true)}
            className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold shadow-lg shadow-gold-500/20 active:scale-[0.98] transition-all"
          >
            <UserPlus className="mr-2 h-4 w-4 text-navy-950" /> Convidar Usuário
          </Button>
        </div>
      </div>

      {/* Main Tabs: Usuários Ativos & Convites */}
      <Tabs defaultValue="usuarios" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="bg-slate-100 border border-slate-200 p-1">
            <TabsTrigger
              value="usuarios"
              className="data-[state=active]:bg-white data-[state=active]:text-navy-950 data-[state=active]:shadow-xs text-xs font-semibold px-4"
            >
              Usuários Cadastrados ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="convites"
              className="data-[state=active]:bg-white data-[state=active]:text-navy-950 data-[state=active]:shadow-xs text-xs font-semibold px-4 flex items-center gap-1.5"
            >
              Convites
              {pendentesCount > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-gold-500 text-navy-950 text-[10px] font-bold">
                  {pendentesCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-white text-xs border-slate-200"
            />
          </div>
        </div>

        {/* Tab 1: Usuários */}
        <TabsContent value="usuarios" className="space-y-4 m-0">
          <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-slate-200">
                    <TableHead className="font-semibold text-slate-700 text-xs">
                      Usuário / Nome
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs">E-mail</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs">Papel</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs">
                      Cadastrado em
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 text-xs">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
                          <span className="text-xs">Carregando usuários...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.id === currentUser?.id
                      return (
                        <TableRow
                          key={u.id}
                          className="border-slate-100 hover:bg-slate-50/60 transition-colors"
                        >
                          <TableCell className="font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-navy-800 font-bold text-xs">
                                {(u.name || u.email).slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                                  {u.name || 'Sem nome'}
                                  {isSelf && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1 py-0 h-4 border-gold-400 text-gold-700 bg-gold-50"
                                    >
                                      Você
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm text-slate-600">
                            {u.email}
                          </TableCell>
                          <TableCell>{getPerfilBadge(u.perfil)}</TableCell>
                          <TableCell>
                            {u.ativo !== false ? (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-medium">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formatDate(u.created)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-slate-600 hover:text-navy-900 hover:bg-slate-100"
                                onClick={() => handleEditUser(u)}
                                title="Editar usuário"
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 text-xs ${
                                  u.perfil === 'administrador'
                                    ? 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                                    : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                                }`}
                                onClick={() => handleTogglePerfil(u)}
                                disabled={isSelf}
                                title={
                                  isSelf
                                    ? 'Você não pode alterar seu próprio papel'
                                    : u.perfil === 'administrador'
                                      ? 'Rebaixar para Usuário'
                                      : 'Promover a Administrador'
                                }
                              >
                                <Shield className="h-3.5 w-3.5 mr-1" />
                                {u.perfil === 'administrador' ? 'Tornar Usuário' : 'Tornar Admin'}
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                                onClick={() => handleToggleAtivo(u)}
                                disabled={isSelf}
                                title={
                                  isSelf
                                    ? 'Você não pode desativar sua conta'
                                    : u.ativo !== false
                                      ? 'Desativar usuário'
                                      : 'Ativar usuário'
                                }
                              >
                                <Power className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteUserTarget(u)}
                                disabled={isSelf}
                                title={
                                  isSelf ? 'Você não pode remover sua conta' : 'Remover usuário'
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Convites */}
        <TabsContent value="convites" className="space-y-4 m-0">
          <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-slate-200">
                    <TableHead className="font-semibold text-slate-700 text-xs">
                      E-mail Convidado
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs">
                      Papel Previsto
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs">
                      Validade / Expiração
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs">
                      Enviado em
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 text-xs">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingConvites ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
                          <span className="text-xs">Carregando convites...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredConvites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Mail className="h-8 w-8 text-slate-300" />
                          <p>Nenhum convite enviado até o momento.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInviteModalOpen(true)}
                            className="mt-2 text-xs border-gold-500/40 text-navy-900 hover:bg-gold-500/10"
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1 text-gold-600" /> Enviar Primeiro
                            Convite
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConvites.map((c) => {
                      return (
                        <TableRow
                          key={c.id}
                          className="border-slate-100 hover:bg-slate-50/60 transition-colors"
                        >
                          <TableCell className="font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-slate-400" />
                              <span className="text-xs sm:text-sm">{c.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getPerfilBadge(c.perfil || 'usuario')}</TableCell>
                          <TableCell>{getConviteStatusBadge(c.status, c.data_expiracao)}</TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {formatDate(c.data_expiracao)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formatDate(c.created)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-1">
                              {c.status === 'pendente' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-navy-900 hover:bg-gold-500/15"
                                    onClick={() => handleCopyInviteLink(c)}
                                    title="Copiar link do convite"
                                  >
                                    {copiedTokenId === c.id ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5 mr-1 text-gold-600" />
                                    )}
                                    Copiar Link
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    onClick={() => handleReenviarConvite(c)}
                                    title="Renovar convite por +7 dias"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reenviar
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => setCancelInviteTarget(c)}
                                    title="Cancelar convite"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}

                              {c.status !== 'pendente' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteInvite(c.id)}
                                  title="Excluir histórico deste convite"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Convidar Usuário */}
      <ConvidarUsuarioDialog
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInviteSent={loadData}
      />

      {/* Modal: Editar Usuário */}
      <UserFormDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        editingUser={selectedUser}
        currentUserId={currentUser?.id}
        onSaved={loadData}
      />

      {/* AlertDialog: Confirmar remoção de usuário */}
      <AlertDialog
        open={!!deleteUserTarget}
        onOpenChange={(open) => !open && setDeleteUserTarget(null)}
      >
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Remover Usuário
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-xs sm:text-sm">
              Tem certeza de que deseja remover o usuário{' '}
              <strong>{deleteUserTarget?.name || deleteUserTarget?.email}</strong>? Essa ação é
              irreversível e removerá os acessos desta conta ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteUser}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              {actionLoading ? 'Removendo...' : 'Sim, Remover Usuário'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Confirmar cancelamento de convite */}
      <AlertDialog
        open={!!cancelInviteTarget}
        onOpenChange={(open) => !open && setCancelInviteTarget(null)}
      >
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-700 flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Cancelar Convite
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-xs sm:text-sm">
              Deseja cancelar o convite enviado para <strong>{cancelInviteTarget?.email}</strong>? O
              link gerado deixará de funcionar imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Manter Convite</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancelInvite}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              {actionLoading ? 'Cancelando...' : 'Cancelar Convite'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
