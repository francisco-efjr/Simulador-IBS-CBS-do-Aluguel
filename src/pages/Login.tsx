import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AvisoDeAcesso, LayoutDeAcesso } from '@/components/organico'
import { extractFieldErrors, mensagemDeAutenticacao } from '@/lib/dados/erros'
import { lerAvisoDeLogin } from '@/lib/dados/sessao'
import { toast } from 'sonner'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')
  // Aviso de sessão que terminou no meio do trabalho: vale uma vez só.
  const [aviso] = useState(() => lerAvisoDeLogin())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    // O aviso explica o que houve; o toast de "não foi possível salvar" que ficou para trás só confunde.
    if (aviso) toast.dismiss()
  }, [aviso])

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
          mensagemDeAutenticacao(
            error,
            'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
          ),
        )
      }
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <LayoutDeAcesso
      titulo="Que bom ver você de novo"
      subtitulo="Entre com seu e-mail e senha para acompanhar os imóveis e as contas."
      rodape={
        <AvisoDeAcesso icone={<ShieldCheck aria-hidden="true" />}>
          <p>O acesso é feito por convite. Se ainda não recebeu o seu, fale com a administração.</p>
          <p className="mt-1">
            Recebeu um convite?{' '}
            <Link
              to="/signup"
              className="inline-flex min-h-11 items-center font-bold text-primary underline"
            >
              Criar conta
            </Link>
          </p>
        </AvisoDeAcesso>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {aviso && !generalError && (
          <div
            role="status"
            className="rounded-3xl bg-secondary/20 px-5 py-3 text-sm font-bold text-warning-ink"
          >
            {aviso}
          </div>
        )}

        {generalError && (
          <div
            role="alert"
            className="rounded-3xl bg-destructive/15 px-5 py-3 text-sm font-bold text-red-800"
          >
            {generalError}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-bold">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldErrors.email) || undefined}
            aria-describedby={fieldErrors.email ? 'email-erro' : undefined}
            className="min-h-14"
          />
          {fieldErrors.email && (
            <p id="email-erro" role="alert" className="px-2 text-sm font-bold text-red-800">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm font-bold">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.password) || undefined}
              aria-describedby={fieldErrors.password ? 'password-erro' : undefined}
              className="min-h-14 pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              className="absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
            >
              {showPassword ? (
                <EyeOff className="h-[22px] w-[22px]" aria-hidden="true" />
              ) : (
                <Eye className="h-[22px] w-[22px]" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-erro" role="alert" className="px-2 text-sm font-bold text-red-800">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className="flex min-h-11 items-center gap-3 px-1">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(!!checked)}
          />
          <label htmlFor="remember" className="flex min-h-11 cursor-pointer items-center text-base">
            Lembrar de mim
          </label>
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>

        <Link
          to="/recuperar-senha"
          className="self-center px-2.5 py-2.5 text-base font-bold text-primary underline hover:text-foreground"
        >
          Esqueci minha senha
        </Link>
      </form>
    </LayoutDeAcesso>
  )
}
