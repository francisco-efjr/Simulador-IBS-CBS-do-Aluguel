import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { extractFieldErrors } from '@/lib/dados/erros'
import { validarConviteToken } from '@/services/convites'
import darkLogo from '@/assets/chatgpt-image-aug-7-2026-061737-pm-5-f38c6.png'
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
        toast.success('Convite validado com sucesso!')
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

    setIsSubmitting(true)
    const { error } = await signUp(email.trim().toLowerCase(), password, name.trim())
    setIsSubmitting(false)

    if (error) {
      const extracted = extractFieldErrors(error)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        const errorMsg =
          error?.data?.message ||
          error?.message ||
          'Ocorreu um erro ao criar a conta. Verifique se o e-mail já está em uso.'
        setGeneralError(errorMsg)
      }
    } else {
      toast.success('Conta ativada com sucesso! Bem-vindo(a) à Holding Aguiar.')
      navigate('/inicio', { replace: true })
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
            className="h-20 w-auto object-contain mb-2 drop-shadow-md"
          />
          <p className="text-xs font-semibold tracking-widest text-gold-400 uppercase">
            Sistema de Gestão de Imóveis
          </p>
        </div>

        <Card className="border border-navy-700/80 bg-navy-800/95 text-slate-100 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1.5 pb-4 text-center">
            <CardTitle as="h1" className="text-2xl font-bold tracking-tight text-white">
              {inviteStatus?.valid ? 'Ativar seu Convite' : 'Cadastrar Usuário'}
            </CardTitle>
            <CardDescription className="text-slate-200 text-sm sm:text-base">
              {inviteStatus?.valid
                ? 'Defina seu nome e senha para acessar o sistema da Holding Aguiar'
                : 'Defina suas credenciais para acessar o sistema'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Se tem token de convite validado */}
            {inviteStatus?.valid && (
              <div className="mb-4 rounded-lg bg-gold-500/15 border border-gold-500/30 p-3.5 text-xs text-gold-200 flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-gold-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-white">Convite Validado com Sucesso</div>
                  <div>
                    E-mail: <strong className="text-gold-300">{inviteStatus.email}</strong>
                  </div>
                  {inviteStatus.perfil && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span>Papel atribuído:</span>
                      <Badge className="bg-gold-500 text-navy-950 font-bold text-xs uppercase">
                        {inviteStatus.perfil}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Se token inválido */}
            {inviteStatus && !inviteStatus.valid && (
              <div className="mb-4 rounded-lg bg-red-950/80 border border-red-800/60 p-3.5 text-xs text-red-200 flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-red-300 font-semibold mb-0.5">
                    Convite Inválido ou Expirado
                  </strong>
                  <p>{inviteStatus.message || 'Solicite um novo convite ao administrador.'}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {generalError && (
                <div className="rounded-lg bg-red-950/80 p-3 text-xs font-medium text-red-300 border border-red-800/60">
                  {generalError}
                </div>
              )}

              {/* Campo para inserir token se não validado pela URL */}
              {!tokenFromUrl && !inviteStatus?.valid && (
                <div className="space-y-1.5 p-3 rounded-lg bg-navy-900/60 border border-navy-700">
                  <Label
                    htmlFor="token"
                    className="text-slate-300 font-medium text-xs flex items-center justify-between"
                  >
                    <span>Possui um Código / Token de Convite?</span>
                    <span className="text-xs text-gold-400 font-normal">Opcional</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-gold-400" />
                      <Input
                        id="token"
                        type="text"
                        placeholder="Cole o código do convite..."
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="pl-9 h-9 bg-navy-900 text-xs text-white border-navy-700 focus:border-gold-500 font-mono"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidateToken(token)}
                      disabled={validatingToken || !token.trim()}
                      className="h-9 border-gold-500/40 text-gold-400 hover:bg-gold-500/10 text-xs shrink-0"
                    >
                      {validatingToken ? 'Validando...' : 'Validar'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-slate-100 font-semibold text-sm">
                  Nome completo *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gold-400" />
                  <Input
                    id="name"
                    type="text"
                    required
                    placeholder="Seu Nome Completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 bg-navy-900/90 border-navy-700 text-white placeholder:text-slate-300 focus:border-gold-500 focus:ring-gold-500"
                  />
                </div>
                {fieldErrors.name && (
                  <p role="alert" className="text-sm font-semibold text-red-300">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-100 font-semibold text-sm">
                  E-mail *
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
                  <p role="alert" className="text-sm font-semibold text-red-300">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-100 font-semibold text-sm">
                  Definir Senha (mín. 8 caracteres) *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gold-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  <p role="alert" className="text-sm font-semibold text-red-300">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-slate-100 font-semibold text-sm">
                  Confirmar Senha *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gold-400" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-14 min-h-[48px] text-base bg-navy-900/90 border-navy-700 text-white placeholder:text-slate-300 focus:border-gold-500 focus:ring-gold-500"
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
                    className="absolute right-0 top-0 flex h-full min-h-[48px] w-12 items-center justify-center rounded-r-md text-slate-300 hover:text-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p role="alert" className="text-sm font-semibold text-red-300">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-600 hover:to-gold-500 text-navy-950 font-bold py-2.5 shadow-lg shadow-gold-500/20 transition-all active:scale-[0.98]"
              >
                {isSubmitting
                  ? 'Salvando cadastro...'
                  : inviteStatus?.valid
                    ? 'Concluir Cadastro e Acessar'
                    : 'Criar conta'}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4 text-navy-950" />}
              </Button>
            </form>

            <div className="mt-6 border-t border-navy-700/80 pt-4 text-center">
              <p className="text-xs text-slate-400">
                Já possui uma conta ativa?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-gold-400 hover:text-gold-300 hover:underline"
                >
                  Fazer login
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
