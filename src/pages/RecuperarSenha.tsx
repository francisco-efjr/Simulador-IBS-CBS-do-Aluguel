import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  RefreshCw,
  KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { solicitarRecuperacaoSenha } from '@/services/auth-recovery'
import darkLogo from '@/assets/chatgpt-image-aug-7-2026-061737-pm-5-f38c6.png'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [devToken, setDevToken] = useState<string | null>(null)

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
    setDevToken(null)

    try {
      const res = await solicitarRecuperacaoSenha(email)
      if (res.success) {
        setSent(true)
        if (res.token) {
          setDevToken(res.token)
        }
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
    <div className="relative flex min-h-screen items-center justify-center bg-navy-950 px-4 py-8 overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-navy-700/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in-up z-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src={darkLogo}
            alt="Holding Aguiar"
            className="h-24 w-auto object-contain mb-2 drop-shadow-md"
          />
          <p className="text-xs font-semibold tracking-widest text-gold-400 uppercase">
            Sistema de Gestão de Imóveis
          </p>
        </div>

        <Card className="border border-navy-700/80 bg-navy-800/90 text-slate-100 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1.5 pb-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/15 border border-gold-500/30 text-gold-400 mb-2">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle as="h1" className="text-2xl font-bold tracking-tight text-white">
              Recuperar Senha
            </CardTitle>
            <CardDescription className="text-slate-200 text-sm sm:text-base">
              {sent
                ? 'Verifique sua caixa de entrada e siga as orientações enviadas.'
                : 'Informe seu e-mail institucional para receber o link seguro de redefinição.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-emerald-950/80 p-4 border border-emerald-800/60 text-emerald-200">
                  <CheckCircle className="h-5 w-5 text-gold-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p className="font-semibold text-emerald-300">
                      Instruções enviadas com sucesso!
                    </p>
                    <p className="text-slate-300 text-xs">
                      Se o e-mail <strong className="text-white">{email}</strong> estiver cadastrado
                      na Holding Aguiar, você receberá uma mensagem com o link de redefinição válido
                      por <strong>1 hora</strong>.
                    </p>
                  </div>
                </div>

                {devToken && (
                  <div className="rounded-lg bg-navy-900/90 p-3.5 border border-gold-500/30 space-y-2">
                    <span className="text-xs font-semibold text-gold-400 uppercase tracking-wide flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" /> Acesso direto de redefinição:
                    </span>
                    <p className="text-xs text-slate-300">
                      Para continuar no navegador ou caso o serviço de e-mail externo demore:
                    </p>
                    <Link
                      to={`/redefinir-senha?token=${devToken}`}
                      className="inline-flex items-center gap-2 text-xs font-bold text-gold-400 hover:text-gold-300 underline bg-gold-500/10 px-3 py-2 rounded-md border border-gold-500/20 w-full justify-center transition-colors"
                    >
                      Abrir Tela de Redefinição de Senha &rarr;
                    </Link>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSent(false)
                      setEmail('')
                      setDevToken(null)
                    }}
                    className="w-full min-h-[44px] border-navy-600 bg-navy-900/80 text-white hover:bg-navy-700 font-medium text-xs sm:text-sm"
                  >
                    <RefreshCw className="mr-2 h-4 w-4 text-gold-400" /> Enviar para outro e-mail
                  </Button>

                  <Link to="/login" className="w-full">
                    <Button
                      variant="ghost"
                      className="w-full min-h-[48px] text-slate-200 hover:text-white hover:bg-navy-700/50 text-base"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-950/80 p-3 text-xs font-medium text-red-300 border border-red-800/60">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-100 font-semibold text-sm">
                    E-mail institucional cadastrado
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gold-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.email@holdingaguiar.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitting}
                      className="pl-9 bg-navy-900/90 border-navy-700 text-white placeholder:text-slate-300 focus:border-gold-500 focus:ring-gold-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[44px] bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-600 hover:to-gold-500 text-navy-950 font-bold py-2.5 shadow-lg shadow-gold-500/20 transition-all active:scale-[0.98]"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-950 border-t-transparent" />
                      Enviando instruções...
                    </span>
                  ) : (
                    <>
                      <span>Enviar Link de Recuperação</span>
                      <ArrowRight className="ml-2 h-4 w-4 text-navy-950" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 text-sm font-semibold text-gold-300 underline underline-offset-4 hover:text-gold-200"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-2 text-slate-300 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-gold-400" />
          <span>Ambiente Seguro &bull; Holding Aguiar © 2026</span>
        </div>
      </div>
    </div>
  )
}
