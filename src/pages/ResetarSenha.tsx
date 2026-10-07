import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { LayoutDeAcesso } from '@/components/organico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validarLinkDeRecuperacao, redefinirSenha } from '@/services/auth-recovery'

export default function RedefinirSenha() {
  const navigate = useNavigate()

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

  // O link do e-mail traz a credencial no fragmento da URL; o cliente do
  // Supabase a converte em sessão antes desta tela montar. Aqui só se confere
  // se essa sessão existe.
  useEffect(() => {
    let isMounted = true
    setCheckingToken(true)

    validarLinkDeRecuperacao()
      .then((res) => {
        if (!isMounted) return
        if (res.valid) {
          setTokenValid(true)
          if (res.email) setAccountEmail(res.email)
        } else {
          setTokenValid(false)
          setTokenErrorMsg(res.message || 'O link de recuperação é inválido ou expirou.')
        }
      })
      .catch(() => {
        if (!isMounted) return
        setTokenValid(false)
        setTokenErrorMsg('Link de recuperação expirado ou inválido.')
      })
      .finally(() => {
        if (isMounted) setCheckingToken(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

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
      const res = await redefinirSenha(password)
      if (res.success) {
        setSuccess(true)
        toast.success('Senha redefinida com sucesso. Você já pode entrar com a sua nova senha.')
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2500)
      } else {
        toast.error(res.message || 'Não foi possível redefinir a senha. Tente novamente.')
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
    <LayoutDeAcesso
      titulo="Redefinir senha"
      subtitulo={<>Crie uma nova senha de acesso institucional para sua conta.</>}
    >
      {checkingToken ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-xs">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Validando token de segurança...</span>
        </div>
      ) : !tokenValid ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-destructive/15 p-4 border border-transparent text-red-800">
            <AlertTriangle className="h-5 w-5 text-red-800 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-semibold text-red-800">Link Inválido ou Expirado</p>
              <p className="text-xs">
                {tokenErrorMsg ||
                  'O link de redefinição de senha não é válido ou ultrapassou o limite de 1 hora.'}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link to="/recuperar-senha" className="w-full">
              <Button className="w-full min-h-[44px] font-bold py-2.5">
                Solicitar Novo Link de Recuperação
              </Button>
            </Link>

            <Link to="/login" className="w-full">
              <Button variant="ghost" className="w-full text-xs sm:text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o login
              </Button>
            </Link>
          </div>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-primary/15 p-4 border border-transparent text-success-ink">
            <CheckCircle2 className="h-6 w-6 text-success-ink shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-semibold text-success-ink">Senha Alterada com Sucesso!</p>
              <p className="text-xs">
                Sua senha de acesso foi atualizada no sistema. Você será redirecionado para o login
                em instantes...
              </p>
            </div>
          </div>

          <Link to="/login" className="w-full block pt-2">
            <Button className="w-full min-h-[44px] font-bold py-2.5">
              Ir para a Tela de Login &rarr;
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {accountEmail && (
            <div className="p-2.5 rounded-lg border text-xs">
              Redefinindo senha para: <strong className="text-primary">{accountEmail}</strong>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-semibold text-sm">
              Nova Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="pl-12 pr-14 min-h-[48px] text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p role="alert" className="text-sm font-semibold text-red-800">
                {errors.password}
              </p>
            )}

            {/* Indicador de Força de Senha */}
            {password.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Força da senha:</span>
                  <span className="font-semibold">{strength.label}</span>
                </div>
                <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full">
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
            <Label htmlFor="confirm" className="font-semibold text-sm">
              Confirmar Nova Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <Input
                id="confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                className="pl-12 pr-14 min-h-[48px] text-base"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p role="alert" className="text-sm font-semibold text-red-800">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] font-bold py-2.5 transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                Redefinindo senha...
              </span>
            ) : (
              <>
                <span>Salvar Nova Senha</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-xs font-semibold text-primary hover:text-foreground hover:underline flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </LayoutDeAcesso>
  )
}
