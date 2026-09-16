import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { updateUsuario, type Perfil, type UsuarioRecord } from '@/services/usuarios'
import {
  MODULOS_SISTEMA,
  type ModuloPermissao,
  type NivelPermissao,
  type PermissaoModulo,
} from '@/lib/constants'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import { Shield, User, LockKeyhole, Eye, Pencil, Sparkles } from 'lucide-react'

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUser: UsuarioRecord | null
  currentUserId?: string
  onSaved: () => void
}

export function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  currentUserId,
  onSaved,
}: UserFormDialogProps) {
  const [name, setName] = useState('')
  const [perfil, setPerfil] = useState<Perfil>('usuario')
  const [ativo, setAtivo] = useState(true)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  // Granular permissions map: modulo => nivel
  const [permissoesMap, setPermissoesMap] = useState<Record<ModuloPermissao, NivelPermissao>>(
    () => {
      const initial: Record<string, NivelPermissao> = {}
      MODULOS_SISTEMA.forEach((m) => {
        initial[m.id] = 'edicao'
      })
      return initial as Record<ModuloPermissao, NivelPermissao>
    },
  )

  const isSelf = editingUser?.id === currentUserId

  useEffect(() => {
    if (open && editingUser) {
      setErrors({})
      setName(editingUser.name || '')
      setPerfil(editingUser.perfil || 'usuario')
      setAtivo(editingUser.ativo !== false)

      const initialMap: Record<string, NivelPermissao> = {}
      const userPerms = editingUser.permissoes

      if (userPerms && Array.isArray(userPerms) && userPerms.length > 0) {
        MODULOS_SISTEMA.forEach((m) => {
          const match = userPerms.find((p) => p.modulo === m.id)
          initialMap[m.id] = match ? match.nivel : 'sem_acesso'
        })
      } else {
        // Default retrocompatible: all edicao
        MODULOS_SISTEMA.forEach((m) => {
          initialMap[m.id] = 'edicao'
        })
      }
      setPermissoesMap(initialMap as Record<ModuloPermissao, NivelPermissao>)
    }
  }, [open, editingUser])

  // Single module change
  const handleLevelChange = (modulo: ModuloPermissao, nivel: NivelPermissao) => {
    setPermissoesMap((prev) => ({
      ...prev,
      [modulo]: nivel,
    }))
  }

  // Check if all modules are currently 'edicao'
  const isAllEdicao = MODULOS_SISTEMA.every((m) => permissoesMap[m.id] === 'edicao')

  // Toggle all modules to edicao or sem_acesso
  const handleToggleAllEdicao = (checked: boolean) => {
    const targetLevel: NivelPermissao = checked ? 'edicao' : 'sem_acesso'
    const newMap: Record<string, NivelPermissao> = {}
    MODULOS_SISTEMA.forEach((m) => {
      newMap[m.id] = targetLevel
    })
    setPermissoesMap(newMap as Record<ModuloPermissao, NivelPermissao>)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setErrors({})
    const fieldErrors: FieldErrors = {}
    if (!name.trim()) fieldErrors.name = 'Nome é obrigatório'

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    if (isSelf && perfil !== 'administrador') {
      toast.error('Você não pode remover seu próprio papel de administrador.')
      return
    }

    if (isSelf && !ativo) {
      toast.error('Você não pode desativar sua própria conta.')
      return
    }

    // Build permissions array (empty for admin, populated for regular user)
    const permissoesArray: PermissaoModulo[] =
      perfil === 'administrador'
        ? []
        : MODULOS_SISTEMA.map((m) => ({
            modulo: m.id,
            nivel: permissoesMap[m.id] || 'sem_acesso',
          }))

    setSubmitting(true)
    try {
      await updateUsuario(editingUser.id, {
        name: name.trim(),
        perfil,
        ativo,
        permissoes: permissoesArray,
      })
      toast.success('Usuário atualizado com sucesso!')
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setErrors(extracted)
      } else {
        toast.error('Ocorreu um erro ao atualizar usuário.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!editingUser) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white border-slate-200">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-navy-900 font-semibold">
            <Shield className="h-5 w-5 text-gold-500" />
            <DialogTitle className="text-xl font-bold text-navy-950">Editar Usuário</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Atualize os dados cadastrais, perfil de acesso e permissões individuais por módulo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="user-name" className="text-xs font-semibold text-slate-700">
              Nome completo
            </Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do usuário"
              className="bg-slate-50 border-slate-200 text-slate-900"
            />
            {errors.name && <p className="text-xs font-medium text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">E-mail</Label>
            <Input
              value={editingUser.email}
              disabled
              className="bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Papel / Perfil de Acesso</Label>
            <Select value={perfil} onValueChange={(v) => setPerfil(v as Perfil)} disabled={isSelf}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usuario">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span>Usuário Padrão</span>
                  </div>
                </SelectItem>
                <SelectItem value="administrador">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gold-600" />
                    <span>Administrador</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-[11px] text-slate-500">
                Você não pode rebaixar seu próprio perfil de administrador.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div>
              <Label htmlFor="user-ativo" className="text-sm font-semibold text-slate-800">
                Conta ativa
              </Label>
              <p className="text-xs text-slate-500">
                {isSelf
                  ? 'Você não pode desativar sua própria conta'
                  : 'Usuários inativos não podem fazer login no sistema'}
              </p>
            </div>
            <Switch id="user-ativo" checked={ativo} onCheckedChange={setAtivo} disabled={isSelf} />
          </div>

          {/* PERMISSÕES DE ACESSO POR MÓDULO (Apenas para Usuários comuns, oculto para Administradores) */}
          {perfil !== 'administrador' ? (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-gold-500" />
                    Permissões de Acesso por Módulo
                  </Label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Defina o que este usuário pode visualizar ou editar no sistema.
                  </p>
                </div>

                {/* Checkbox "Todos os módulos" como Edição */}
                <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
                  <Checkbox
                    id="user-toggleAllEdicao"
                    checked={isAllEdicao}
                    onCheckedChange={(checked) => handleToggleAllEdicao(Boolean(checked))}
                  />
                  <Label
                    htmlFor="user-toggleAllEdicao"
                    className="text-xs font-medium text-slate-700 cursor-pointer select-none"
                  >
                    Todos os módulos (Edição)
                  </Label>
                </div>
              </div>

              {/* Tabela de módulos e níveis de acesso */}
              <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-2xs">
                <div className="grid grid-cols-12 bg-slate-50/90 px-3 py-2 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <div className="col-span-6 sm:col-span-7">Módulo</div>
                  <div className="col-span-6 sm:col-span-5 text-right sm:text-left">
                    Nível de Acesso
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto">
                  {MODULOS_SISTEMA.map((modulo) => {
                    const currentLevel = permissoesMap[modulo.id] || 'sem_acesso'

                    return (
                      <div
                        key={modulo.id}
                        className="grid grid-cols-12 items-center px-3 py-2 hover:bg-slate-50/70 transition-colors gap-2"
                      >
                        <div className="col-span-6 sm:col-span-7 min-w-0 pr-1">
                          <span className="text-xs font-semibold text-slate-900 block truncate">
                            {modulo.nome}
                          </span>
                          <span className="text-[10px] text-slate-400 hidden sm:block truncate">
                            {modulo.descricao}
                          </span>
                        </div>

                        <div className="col-span-6 sm:col-span-5">
                          <Select
                            value={currentLevel}
                            onValueChange={(val: NivelPermissao) =>
                              handleLevelChange(modulo.id, val)
                            }
                            disabled={submitting}
                          >
                            <SelectTrigger className="h-7.5 text-xs bg-slate-50/70 border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sem_acesso">
                                <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                                  <LockKeyhole className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                  <span>🔒 Sem acesso</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="visualizacao">
                                <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                                  <Eye className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                  <span>👁️ Visualização</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="edicao">
                                <div className="flex items-center gap-1.5 text-slate-900 font-medium text-xs">
                                  <Pencil className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  <span>✏️ Edição</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-gold-300/40 bg-gold-50/30 text-xs text-slate-700 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-gold-600 shrink-0 mt-0.5" />
              <p>
                <strong>Administradores</strong> possuem permissão total e irrestrita a todos os
                módulos, relatórios, cadastros e auditorias do sistema.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="border-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-navy-900 hover:bg-navy-800 text-white font-medium"
            >
              {submitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
