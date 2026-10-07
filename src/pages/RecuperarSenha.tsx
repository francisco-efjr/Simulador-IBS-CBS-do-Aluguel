import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react'
import { LayoutDeAcesso } from '@/components/organico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { solicitarRecuperacaoSenha } from '@/services/auth-recovery'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('E-mail institucional é obrigatório')
      return
    }
    if (!email.includes('@')) {
      setError('Por favor, informe um e-mail válido.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await solicitarRecuperacaoSenha(email)
      if (res.success) {
        setSent(true)
      } else {
        setError(res.message || 'Não foi possível solicitar a recuperação de senha.')
      }
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        'Não foi possível enviar o e-mail. Tente novamente mais tarde.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <LayoutDeAcesso
      titulo="Recuperar senha"
      subtitulo={
        sent
          ? 'Verifique sua caixa de entrada e siga as orientações enviadas.'
          : 'Informe seu e-mail institucional para receber o link seguro de redefinição.'
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-primary/15 p-4 border border-transparent text-success-ink">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-semibold text-success-ink">Instruções enviadas com sucesso!</p>
              <p className="text-xs">
                Se o e-mail <strong className="">{email}</strong> estiver cadastrado na Holding
                Aguiar, você receberá uma mensagem com o link de redefinição válido por{' '}
                <strong>1 hora</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setSent(false)
                setEmail('')
              }}
              className="w-full min-h-[44px] font-medium text-xs sm:text-sm"
            >
              <RefreshCw className="mr-2 h-4 w-4 text-primary" /> Enviar para outro e-mail
            </Button>

            <Link to="/login" className="w-full">
              <Button variant="ghost" className="w-full min-h-[48px] text-base">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-red-800 border border-transparent">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-semibold text-sm">
              E-mail institucional cadastrado
            </Label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <Input
                id="email"
                type="email"
                placeholder="seu.email@holdingaguiar.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="pl-12"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] font-bold py-2.5 transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                Enviando instruções...
              </span>
            ) : (
              <>
                <span>Enviar link de recuperação</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </LayoutDeAcesso>
  )
}
