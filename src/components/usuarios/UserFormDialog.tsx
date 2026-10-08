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
import { updateUsuario, type Perfil, type UsuarioRecord } from '@/services/usuarios'
import { DESCRICAO_DO_PERFIL, ROTULO_DO_PERFIL } from '@/lib/constants'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { toast } from 'sonner'
import { Shield, User, Sparkles } from 'lucide-react'

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
  const [perfil, setPerfil] = useState<Perfil>('gratuito')
  const [ativo, setAtivo] = useState(true)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const isSelf = editingUser?.id === currentUserId

  useEffect(() => {
    if (open && editingUser) {
      setErrors({})
      setName(editingUser.name || '')
      setPerfil(editingUser.perfil || 'gratuito')
      setAtivo(editingUser.ativo !== false)
    }
  }, [open, editingUser])

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
      toast.error('Você não pode retirar o seu próprio perfil de administrador.')
      return
    }

    if (isSelf && !ativo) {
      toast.error('Você não pode desativar a sua própria conta.')
      return
    }

    setSubmitting(true)
    try {
      await updateUsuario(editingUser.id, {
        name: name.trim(),
        perfil,
        ativo,
      })
      toast.success('Usuário atualizado com sucesso.')
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setErrors(extracted)
      } else {
        toast.error('Não foi possível atualizar o usuário. Tente novamente.')
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
            Atualize os dados cadastrais e o perfil de acesso. O perfil define o que a pessoa acessa.
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
              className="bg-slate-100 text-slate-700 cursor-not-allowed border-slate-300"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Papel / Perfil de Acesso</Label>
            <Select value={perfil} onValueChange={(v) => setPerfil(v as Perfil)} disabled={isSelf}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gratuito">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span>{ROTULO_DO_PERFIL.gratuito}</span>
                  </div>
                </SelectItem>
                <SelectItem value="administrador">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gold-600" />
                    <span>{ROTULO_DO_PERFIL.administrador}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-xs text-slate-500">
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

          <div className="p-3 rounded-lg border border-gold-300/40 bg-gold-50/30 text-xs text-slate-700 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-gold-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>{ROTULO_DO_PERFIL[perfil]}:</strong> {DESCRICAO_DO_PERFIL[perfil]}
            </p>
          </div>

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
              carregando={submitting}
              textoCarregando="Salvando…"
            >
              {'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
