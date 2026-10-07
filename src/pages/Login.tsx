import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { CircleAlert, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/shared/Field'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { ResumoDeErros, type ErroDoResumo } from '@/components/shared/ResumoDeErros'
import { Checkbox } from '@/components/ui/checkbox'
import { AvisoDeAcesso, LayoutDeAcesso } from '@/components/organico'
import { extractFieldErrors, mensagemDeAutenticacao } from '@/lib/dados/erros'
import { emailCompleto, MENSAGENS } from '@/lib/mensagens-de-erro'
import { lerAvisoDeLogin } from '@/lib/dados/sessao'
import { toast } from 'sonner'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [tentativa, setTentativa] = useState(0)
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

  const NOMES: Record<string, string> = { email: 'E-mail', password: 'Senha' }

  /** Confere um campo; usado ao sair dele e ao enviar. */
  const conferir = (campo: 'email' | 'password', valor: string): string => {
    if (campo === 'email') {
      if (!valor.trim()) return MENSAGENS.obrigatorio(NOMES.email)
      if (!emailCompleto(valor)) return MENSAGENS.emailIncompleto
      return ''
    }
    return valor ? '' : MENSAGENS.obrigatorio(NOMES.password)
  }

  const aoSairDoCampo = (campo: 'email' | 'password', valor: string) => {
    // Só avisa quem já escreveu algo ou já tentou enviar; passar o foco por um campo vazio não é erro.
    if (!valor && tentativa === 0) return
    const mensagem = conferir(campo, valor)
    setFieldErrors((atuais) => {
      const novos = { ...atuais }
      if (mensagem) novos[campo] = mensagem
      else delete novos[campo]
      return novos
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')
    setTentativa((n) => n + 1)

    const errors: Record<string, string> = {}
    const erroEmail = conferir('email', email)
    const erroSenha = conferir('password', password)
    if (erroEmail) errors.email = erroEmail
    if (erroSenha) errors.password = erroSenha
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    const { error } = await signIn(email, password)
    setIsSubmitting(false)

    if (error) {
      const extracted = extractFieldErrors(error)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        setGeneralError(mensagemDeAutenticacao(error, MENSAGENS.loginRecusado))
      }
    } else {
      navigate(from, { replace: true })
    }
  }

  const errosDoResumo: ErroDoResumo[] = (['email', 'password'] as const)
    .filter((campo) => fieldErrors[campo])
    .map((campo) => ({ campo, rotulo: NOMES[campo], mensagem: fieldErrors[campo] }))

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
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
            className="flex items-start gap-2 rounded-3xl bg-destructive/10 px-5 py-3 text-sm font-bold text-red-800"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{generalError}</span>
          </div>
        )}

        <ResumoDeErros erros={errosDoResumo} tentativa={tentativa} />

        <Field id="email" label="E-mail" error={fieldErrors.email} anunciar={false}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => aoSairDoCampo('email', e.target.value)}
            required
            className="min-h-14"
          />
        </Field>

        <Field id="password" label="Senha" error={fieldErrors.password} anunciar={false}>
          <PasswordInput
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={(e) => aoSairDoCampo('password', e.target.value)}
            required
          />
        </Field>

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

        <Button
          type="submit"
          size="lg"
          carregando={isSubmitting}
          textoCarregando="Entrando…"
          className="mt-1 w-full"
        >
          Entrar
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
