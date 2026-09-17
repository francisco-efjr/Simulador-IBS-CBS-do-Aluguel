import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { extractFieldErrors } from '@/lib/dados/erros'
import darkLogo from '@/assets/chatgpt-image-aug-7-2026-061737-pm-5-f38c6.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/inicio'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')
    setFieldErrors({})

    const errors: Record<string, string> = {}
    if (!email.trim()) errors.email = 'E-mail é obrigatório'
    if (!password) errors.password = 'Senha é obrigatória'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    const { error } = await signIn(email, password)
    setIsSubmitting(false)

    if (error) {
      const extracted = extractFieldErrors(error)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        setGeneralError(
          error?.message && !error?.response
            ? error.message
            : 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
        )
      }
    } else {
      navigate(from, { replace: true })
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
            <CardTitle as="h1" className="text-2xl font-bold tracking-tight text-white">
              Acesse sua conta
            </CardTitle>
            <CardDescription className="text-slate-200 text-sm sm:text-base">
              Digite suas credenciais de acesso ao painel Holding Aguiar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {generalError && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-950/80 p-3 text-sm font-semibold text-red-200 border border-red-800/60"
                >
                  {generalError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-100 font-semibold text-sm">
                  E-mail institucional
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gold-400" />
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="seu.email@holdingaguiar.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.email) || undefined}
                    aria-describedby={fieldErrors.email ? 'email-erro' : undefined}
                    className="pl-9 min-h-[48px] text-base bg-navy-900/90 border-navy-700 text-white placeholder:text-slate-300 focus:border-gold-500 focus:ring-gold-500"
                  />
                </div>
                {fieldErrors.email && (
                  <p id="email-erro" role="alert" className="text-sm font-semibold text-red-300">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-100 font-semibold text-sm">
                  Senha de acesso
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gold-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.password) || undefined}
                    aria-describedby={fieldErrors.password ? 'password-erro' : undefined}
                    className="pl-9 pr-14 min-h-[48px] text-base bg-navy-900/90 border-navy-700 text-white placeholder:text-slate-300 focus:border-gold-500 focus:ring-gold-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    className="absolute right-0 top-0 flex h-full min-h-[48px] w-12 items-center justify-center rounded-r-md text-slate-300 hover:text-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-erro" role="alert" className="text-sm font-semibold text-red-300">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex min-h-[44px] items-center space-x-3">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    className="border-navy-600 data-[state=checked]:bg-gold-500 data-[state=checked]:text-navy-950"
                  />
                  <label
                    htmlFor="remember"
                    className="flex min-h-[44px] items-center text-sm font-medium text-slate-200 cursor-pointer"
                  >
                    Lembrar de mim
                  </label>
                </div>
                <Link
                  to="/recuperar-senha"
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-gold-300 underline underline-offset-4 hover:text-gold-200 transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[52px] text-base bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-600 hover:to-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/20 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? 'Entrando...' : 'Entrar no sistema'}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4 text-navy-950" />}
              </Button>
            </form>

            <div className="mt-6 border-t border-navy-700/80 pt-4 text-center">
              <p className="text-sm text-slate-300">
                Ainda não tem acesso?{' '}
                <Link
                  to="/signup"
                  className="inline-flex min-h-[44px] items-center font-semibold text-gold-300 underline underline-offset-4 hover:text-gold-200"
                >
                  Criar conta
                </Link>
              </p>
            </div>
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
