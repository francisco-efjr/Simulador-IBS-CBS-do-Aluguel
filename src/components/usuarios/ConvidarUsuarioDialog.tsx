import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Mail, Send, Shield, User, Copy, Check } from 'lucide-react'
import { enviarConvite, type Perfil } from '@/services/convites'
import { toast } from 'sonner'

interface ConvidarUsuarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInviteSent: () => void
}

export function ConvidarUsuarioDialog({
  open,
  onOpenChange,
  onInviteSent,
}: ConvidarUsuarioDialogProps) {
  const [email, setEmail] = useState('')
  const [perfil, setPerfil] = useState<Perfil>('usuario')
  const [submitting, setSubmitting] = useState(false)
  const [createdInvite, setCreatedInvite] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)

  const handleClose = () => {
    setEmail('')
    setPerfil('usuario')
    setCreatedInvite(null)
    setCopied(false)
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      toast.error('Informe um e-mail válido para envio do convite.')
      return
    }

    setSubmitting(true)
    try {
      const res = await enviarConvite({
        email: email.trim().toLowerCase(),
        perfil,
      })

      if (res && res.convite) {
        setCreatedInvite(res.convite)
        toast.success('Convite gerado com sucesso!')
        onInviteSent()
      } else {
        toast.success('Convite enviado com sucesso!')
        handleClose()
        onInviteSent()
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Erro ao enviar convite.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const getInviteLink = () => {
    if (!createdInvite?.token) return ''
    const origin = window.location.origin
    return `${origin}/signup?token=${createdInvite.token}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Link copiado para a área de transferência!')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-md bg-white p-6 shadow-2xl border-slate-200">
        <DialogHeader className="space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/15 border border-gold-500/30 text-navy-900">
            <Mail className="h-5 w-5 text-gold-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-navy-950">
            {createdInvite ? 'Convite Gerado' : 'Convidar Novo Usuário'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs sm:text-sm">
            {createdInvite
              ? 'O convite foi registrado no sistema. O link expira em 7 dias.'
              : 'O convidado receberá o link para definir seu nome e sua senha de acesso.'}
          </DialogDescription>
        </DialogHeader>

        {createdInvite ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" /> Convite criado para{' '}
                {createdInvite.email}
              </p>
              <p className="text-emerald-700">
                Perfil de acesso atribuído:{' '}
                <strong className="capitalize">{createdInvite.perfil}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Link de Ativação do Convite
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={getInviteLink()}
                  className="text-xs font-mono bg-slate-50 text-slate-700 select-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-navy-900 hover:bg-gold-500/10 border-gold-500/40"
                  onClick={() => copyToClipboard(getInviteLink())}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gold-600" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Código / Token</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={createdInvite.token}
                  className="text-xs font-mono bg-slate-50 text-slate-700 select-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-navy-900 hover:bg-slate-100"
                  onClick={() => copyToClipboard(createdInvite.token)}
                >
                  <Copy className="h-4 w-4 text-slate-600" />
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                onClick={handleClose}
                className="w-full bg-navy-900 hover:bg-navy-800 text-white font-medium"
              >
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-semibold text-slate-700">
                E-mail do novo usuário *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="invite-email"
                  type="email"
                  required
                  placeholder="colaborador@holdingaguiar.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 focus:border-gold-500 focus:ring-gold-500 text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-perfil" className="text-xs font-semibold text-slate-700">
                Papel / Perfil de Acesso
              </Label>
              <Select value={perfil} onValueChange={(v) => setPerfil(v as Perfil)}>
                <SelectTrigger id="invite-perfil" className="bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario" className="py-2.5">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">Usuário Padrão</div>
                        <div className="text-[11px] text-slate-500">
                          Acesso aos módulos operacionais (imóveis, contratos, receitas, etc.)
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="administrador" className="py-2.5">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gold-600" />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">Administrador</div>
                        <div className="text-[11px] text-slate-500">
                          Acesso total + gestão de usuários e configurações
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-navy-50 border border-navy-100 p-3 text-[11px] text-navy-800 leading-relaxed">
              <strong>Nota de validade:</strong> O convite terá validade de <strong>7 dias</strong>{' '}
              a partir do envio. O usuário poderá definir sua senha segura diretamente no sistema.
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
                className="border-slate-300 text-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold shadow-md shadow-gold-500/20"
              >
                {submitting ? (
                  'Enviando convite...'
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Enviar Convite
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
