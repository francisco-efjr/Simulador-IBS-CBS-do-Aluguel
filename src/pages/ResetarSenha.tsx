import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { validarTokenReset, redefinirSenha } from '@/services/auth-recovery'
import darkLogo from '@/assets/chatgpt-image-aug-7-2026-061737-pm-5-f38c6.png'

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = (searchParams.get('token') || '').trim()

  const [checkingToken, setCheckingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenErrorMsg, setTokenErrorMsg] = useState('')
  const [accountEmail, setAccountEmail] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  // Validação preliminar do token no carregamento da página
  useEffect(() => {
    if (!token) {
      setCheckingToken(false)
      setTokenValid(false)
      setTokenErrorMsg('Link incompleto: nenhum código de token foi informado na URL.')
      return
    }

    let isMounted = true
    setCheckingToken(true)

    validarTokenReset(token)
      .then((res) => {
        if (!isMounted) return
        if (res.valid) {
          setTokenValid(true)
          if (res.email) setAccountEmail(res.email)
        } else {
          setTokenValid(false)
          setTokenErrorMsg(res.message || 'O link de recuperação informado é inválido ou expirou.')
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setTokenValid(false)
        const msg =
          err?.data?.message || err?.message || 'Link de recuperação expirado ou inválido.'
        setTokenErrorMsg(msg)
      })
      .finally(() => {
        if (isMounted) setCheckingToken(false)
      })

    return () => {
      isMounted = false
    }
  }, [token])

  // Cálculo da força da senha
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Não informada', color: 'bg-slate-600' }
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 2) return { score: 1, label: 'Fraca', color: 'bg-rose-500' }
    if (score <= 3) return { score: 2, label: 'Média', color: 'bg-amber-500' }
    return { score: 3, label: 'Forte', color: 'bg-emerald-500' }
  }

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const fieldErrors: Record<string, string> = {}
    if (!password) {
      fieldErrors.password = 'A nova senha é obrigatória'
    } else if (password.length < 8) {
      fieldErrors.password = 'A senha deve conter no mínimo 8 caracteres'
    }

    if (!confirmPassword) {
      fieldErrors.confirmPassword = 'A confirmação de senha é obrigatória'
    } else if (password !== confirmPassword) {
      fieldErrors.confirmPassword = 'As senhas informadas não coincidem'
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setSubmitting(true)
    try {
      const res = await redefinirSenha(token, password, confirmPassword)
      if (res.success) {
        setSuccess(true)
        toast.success('Senha redefinida com sucesso!')
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2500)
      } else {
        toast.error(res.message || 'Erro ao redefinir a senha.')
        setTokenErrorMsg(res.message)
      }
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        'Não foi possível redefinir a senha. O link pode ter expirado.'
      toast.error(msg)
      setTokenErrorMsg(msg)
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
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-slate-300 text-xs sm:text-sm">
              Crie uma nova senha de acesso institucional para sua conta.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {checkingToken ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-300 text-xs">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
                <span>Validando token de segurança...</span>
              </div>
            ) : !tokenValid ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-red-950/80 p-4 border border-red-800/60 text-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p className="font-semibold text-red-300">Link Inválido ou Expirado</p>
                    <p className="text-slate-300 text-xs">
                      {tokenErrorMsg ||
                        'O link de redefinição de senha não é válido ou ultrapassou o limite de 1 hora.'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Link to="/recuperar-senha" className="w-full">
                    <Button className="w-full min-h-[44px] bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-600 hover:to-gold-500 text-navy-950 font-bold py-2.5">
                      Solicitar Novo Link de Recuperação
                    </Button>
                  </Link>

                  <Link to="/login" className="w-full">
                    <Button
                      variant="ghost"
                      className="w-full text-slate-300 hover:text-white hover:bg-navy-700/50 text-xs sm:text-sm"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : success ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-emerald-950/80 p-4 border border-emerald-800/60 text-emerald-200">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p className="font-semibold text-emerald-300">Senha Alterada com Sucesso!</p>
                    <p className="text-slate-300 text-xs">
                      Sua senha de acesso foi atualizada no sistema. Você será redirecionado para o
                      login em instantes...
                    </p>
                  </div>
                </div>

                <Link to="/login" className="w-full block pt-2">
                  <Button className="w-full min-h-[44px] bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-600 hover:to-gold-500 text-navy-950 font-bold py-2.5">
                    Ir para a Tela de Login &rarr;
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {accountEmail && (
                  <div className="p-2.5 rounded-lg bg-navy-900/80 border border-navy-700 text-xs text-slate-300">
                    Redefinindo senha para:{' '}
                    <strong className="text-gold-400">{accountEmail}</strong>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-200 font-medium text-xs">
                    Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gold-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitting}
                      className="pl-9 pr-10 bg-navy-900/90 border-navy-700 text-white placeholder:text-slate-400 focus:border-gold-500 focus:ring-gold-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-gold-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs font-medium text-red-400">{errors.password}</p>
                  )}

                  {/* Indicador de Força de Senha */}
                  {password.length > 0 && (
                    <div className="pt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Força da senha:</span>
                        <span className="font-semibold text-slate-200">{strength.label}</span>
                      </div>
                      <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-navy-900">
                        <div
                          className={`h-full flex-1 rounded-full ${
                            strength.score >= 1 ? strength.color : 'bg-transparent'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full ${
                            strength.score >= 2 ? strength.color : 'bg-transparent'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full ${
                            strength.score >= 3 ? strength.color : 'bg-transparent'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-slate-200 font-medium text-xs">
                    Confirmar Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gold-400" />
                    <Input
                      id="confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={submitting}
                      className="pl-9 pr-10 bg-navy-900/90 border-navy-700 text-white placeholder:text-slate-400 focus:border-gold-500 focus:ring-gold-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-gold-400 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs font-medium text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[44px] bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-600 hover:to-gold-500 text-navy-950 font-bold py-2.5 shadow-lg shadow-gold-500/20 transition-all active:scale-[0.98]"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-950 border-t-transparent" />
                      Redefinindo senha...
                    </span>
                  ) : (
                    <>
                      <span>Salvar Nova Senha</span>
                      <ArrowRight className="ml-2 h-4 w-4 text-navy-950" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="text-xs font-semibold text-gold-400 hover:text-gold-300 hover:underline flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
          <ShieldCheck className="h-4 w-4 text-gold-400" />
          <span>Ambiente Seguro &bull; Holding Aguiar © 2026</span>
        </div>
      </div>
    </div>
  )
}
