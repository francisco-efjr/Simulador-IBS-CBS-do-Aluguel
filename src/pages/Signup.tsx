import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { LayoutDeAcesso } from '@/components/organico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { extractFieldErrors, mensagemDeAutenticacao } from '@/lib/dados/erros'
import { validarConviteToken } from '@/services/convites'
import { toast } from 'sonner'

export default function Signup() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') || ''

  const [token, setToken] = useState(tokenFromUrl)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  // Cadastro feito sem convite válido: a conta existe, mas espera um administrador liberar.
  const [aguardaLiberacao, setAguardaLiberacao] = useState(false)

  // Convite validation state
  const [validatingToken, setValidatingToken] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<{
    valid?: boolean
    email?: string
    perfil?: string
    message?: string
  } | null>(null)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  // Auto-validar token da URL
  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
      handleValidateToken(tokenFromUrl)
    }
  }, [tokenFromUrl])

  const handleValidateToken = async (tok: string) => {
    if (!tok.trim()) return
    setValidatingToken(true)
    setGeneralError('')
    try {
      const res = await validarConviteToken(tok.trim())
      if (res.valid) {
        setInviteStatus(res)
        if (res.email) setEmail(res.email)
        toast.success('Convite validado com sucesso.')
      } else {
        setInviteStatus(res)
        setGeneralError(res.message || 'Convite inválido ou expirado.')
      }
    } catch {
      setGeneralError('Não foi possível verificar o token.')
    } finally {
      setValidatingToken(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')
    setFieldErrors({})

    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Nome é obrigatório'
    if (!email.trim()) errors.email = 'E-mail é obrigatório'
    if (!password || password.length < 8) {
      errors.password = 'A senha deve ter no mínimo 8 caracteres'
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    // Só segue o token que a verificação aprovou; o banco confere de novo.
    const conviteToken = inviteStatus?.valid ? token.trim() : undefined

    setIsSubmitting(true)
    const { error } = await signUp(email.trim().toLowerCase(), password, name.trim(), conviteToken)
    setIsSubmitting(false)

    if (error) {
      const extracted = extractFieldErrors(error)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        const errorMsg = mensagemDeAutenticacao(
          error,
          'Ocorreu um erro ao criar a conta. Verifique se o e-mail já está em uso.',
        )
        setGeneralError(errorMsg)
      }
    } else if (!conviteToken) {
      // Sem convite a conta nasce inativa: nada de entrar no sistema agora.
      setAguardaLiberacao(true)
    } else {
      toast.success('Conta ativada com sucesso. Boas-vindas à Holding Aguiar.')
      navigate('/inicio', { replace: true })
    }
  }

  if (aguardaLiberacao) {
    return (
      <LayoutDeAcesso
        titulo="Conta criada, aguardando liberação"
        subtitulo={
          <>
            Seu cadastro foi feito sem um convite válido. Um administrador do sistema precisa liberar o seu acesso antes do primeiro login.
          </>
        }
      >
        <Link
          to="/login"
          className="font-semibold text-primary hover:text-foreground hover:underline"
        >
          Ir para o login
        </Link>
      </LayoutDeAcesso>
    )
  }

  return (
    <LayoutDeAcesso
      titulo={inviteStatus?.valid ? 'Ativar seu convite' : 'Criar conta'}
      subtitulo={
        inviteStatus?.valid
          ? 'Defina seu nome e senha para acessar o Gestão de imóveis da Holding Aguiar'
          : 'Defina suas credenciais. Sem convite, a conta fica aguardando a liberação de um administrador.'
      }
    >
      {/* Se tem token de convite validado */}
      {inviteStatus?.valid && (
        <div className="mb-4 rounded-lg bg-primary/10 border border-primary/30 p-3.5 text-xs text-primary flex items-start gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Convite Validado com Sucesso</div>
            <div>
              E-mail: <strong className="text-primary">{inviteStatus.email}</strong>
            </div>
            {inviteStatus.perfil && (
              <div className="flex items-center gap-1.5 mt-1">
                <span>Papel atribuído:</span>
                <Badge className="bg-gold-500 font-bold text-xs uppercase">
                  {inviteStatus.perfil}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Se token inválido */}
      {inviteStatus && !inviteStatus.valid && (
        <div className="mb-4 rounded-lg bg-destructive/15 border border-transparent p-3.5 text-xs text-red-800 flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-red-800 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-red-800 font-semibold mb-0.5">
              Convite Inválido ou Expirado
            </strong>
            <p>{inviteStatus.message || 'Solicite um novo convite ao administrador.'}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-red-800 border border-transparent">
            {generalError}
          </div>
        )}

        {/* Campo para inserir token se não validado pela URL */}
        {!tokenFromUrl && !inviteStatus?.valid && (
          <div className="space-y-1.5 p-3 rounded-lg border">
            <Label
              htmlFor="token"
              className="font-medium text-xs flex items-center justify-between"
            >
              <span>Possui um Código / Token de Convite?</span>
              <span className="text-xs text-primary font-normal">Opcional</span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <Input
                  id="token"
                  type="text"
                  placeholder="Cole o código do convite..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pl-12 h-9 text-xs font-mono"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleValidateToken(token)}
                disabled={validatingToken || !token.trim()}
                className="h-9 border-gold-500/40 text-primary hover:bg-gold-500/10 text-xs shrink-0"
              >
                {validatingToken ? 'Validando...' : 'Validar'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name" className="font-semibold text-sm">
            Nome completo *
          </Label>
          <div className="relative">
            <User className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            <Input
              id="name"
              type="text"
              required
              placeholder="Seu Nome Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-12"
            />
          </div>
          {fieldErrors.name && (
            <p role="alert" className="text-sm font-semibold text-red-800">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-semibold text-sm">
            E-mail *
          </Label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={!!inviteStatus?.email}
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-9 bg-navy-900/90 border-navy-700 text-white placeholder:text-slate-300 focus:border-gold-500 focus:ring-gold-500 ${
                inviteStatus?.email ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p role="alert" className="text-sm font-semibold text-red-800">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="font-semibold text-sm">
            Definir Senha (mín. 8 caracteres) *
          </Label>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 pr-14 min-h-[48px] text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              className="absolute right-0 top-0 flex h-full min-h-[48px] w-12 items-center justify-center rounded-r-md hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p role="alert" className="text-sm font-semibold text-red-800">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="font-semibold text-sm">
            Confirmar Senha *
          </Label>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-12 pr-14 min-h-[48px] text-base"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword
                  ? 'Ocultar confirmação de senha'
                  : 'Mostrar confirmação de senha'
              }
              aria-pressed={showConfirmPassword}
              className="absolute right-0 top-0 flex h-full min-h-[48px] w-12 items-center justify-center rounded-r-md hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p role="alert" className="text-sm font-semibold text-red-800">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full font-bold py-2.5 transition-all active:scale-[0.98]"
        >
          {isSubmitting
            ? 'Salvando cadastro...'
            : inviteStatus?.valid
              ? 'Concluir Cadastro e Acessar'
              : 'Criar conta'}
          {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>

      <div className="mt-6 border-t pt-4 text-center">
        <p className="text-xs">
          Já possui uma conta ativa?{' '}
          <Link
            to="/login"
            className="inline-flex min-h-[44px] items-center px-1 font-semibold text-primary hover:text-foreground hover:underline"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </LayoutDeAcesso>
  )
}
