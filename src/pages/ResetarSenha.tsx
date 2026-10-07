import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleAlert, CircleCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { LayoutDeAcesso } from '@/components/organico'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/shared/Field'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { RegrasDaSenha } from '@/components/shared/RegrasDaSenha'
import { ResumoDeErros, type ErroDoResumo } from '@/components/shared/ResumoDeErros'
import { MENSAGENS } from '@/lib/mensagens-de-erro'
import { MENSAGENS_DA_SENHA, TAMANHO_MINIMO_DA_SENHA } from '@/lib/senha'
import { validarLinkDeRecuperacao, redefinirSenha } from '@/services/auth-recovery'

export default function RedefinirSenha() {
  const navigate = useNavigate()

  const [checkingToken, setCheckingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenErrorMsg, setTokenErrorMsg] = useState('')
  const [accountEmail, setAccountEmail] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [erro, setErro] = useState('')
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

  const conferir = (campo: 'password' | 'confirmPassword', valor: string): string => {
    if (campo === 'password') {
      if (!valor) return MENSAGENS.obrigatorio('Senha nova')
      return valor.length >= TAMANHO_MINIMO_DA_SENHA ? '' : MENSAGENS_DA_SENHA.curta
    }
    if (!valor) return MENSAGENS.obrigatorio('Repita a senha nova')
    return valor === password ? '' : MENSAGENS_DA_SENHA.diferentes
  }

  const aoSairDoCampo = (campo: 'password' | 'confirmPassword', valor: string) => {
    if (!valor && tentativa === 0) return
    const mensagem = conferir(campo, valor)
    setErrors((atuais) => {
      const novos = { ...atuais }
      if (mensagem) novos[campo] = mensagem
      else delete novos[campo]
      return novos
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTentativa((n) => n + 1)

    const fieldErrors: Record<string, string> = {}
    const erroSenha = conferir('password', password)
    const erroConfirmacao = conferir('confirmPassword', confirmPassword)
    if (erroSenha) fieldErrors.password = erroSenha
    if (erroConfirmacao) fieldErrors.confirmPassword = erroConfirmacao
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSubmitting(true)
    try {
      const res = await redefinirSenha(password)
      if (res.success) {
        setSuccess(true)
        toast.success('Senha nova salva. Já pode entrar com ela.')
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2500)
      } else {
        setErro(res.message || 'Não foi possível salvar a senha agora. Tente de novo.')
      }
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      setErro(
        e?.data?.message ||
          e?.message ||
          'Não foi possível salvar a senha agora. O link pode ter vencido.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const errosDoResumo: ErroDoResumo[] = [
    errors.password && { campo: 'password', rotulo: 'Senha nova', mensagem: errors.password },
    errors.confirmPassword && {
      campo: 'confirmPassword',
      rotulo: 'Repita a senha nova',
      mensagem: errors.confirmPassword,
    },
  ].filter(Boolean) as ErroDoResumo[]

  const linkDeTexto =
    'inline-flex min-h-11 items-center self-center px-2.5 text-base font-bold text-primary underline hover:text-foreground'

  return (
    <LayoutDeAcesso
      etiqueta={checkingToken ? 'Senha nova' : !tokenValid ? 'Recuperar acesso' : 'Senha nova'}
      titulo={
        !checkingToken && !tokenValid
          ? 'Este link não vale mais'
          : success
            ? 'Senha nova salva'
            : 'Crie uma senha nova'
      }
      subtitulo={
        !checkingToken && !tokenValid
          ? undefined
          : success
            ? 'Você será levado ao login em instantes.'
            : 'Depois de salvar, use a senha nova para entrar.'
      }
    >
      {checkingToken ? (
        <div role="status" className="flex flex-col items-center gap-3 py-8 text-base">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <span>Conferindo o link…</span>
        </div>
      ) : !tokenValid ? (
        <div className="flex flex-col gap-4">
          <div
            role="alert"
            className="flex items-start gap-3 rounded-3xl bg-destructive/10 px-5 py-4 text-base text-destructive"
          >
            <CircleAlert className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            <p>
              {tokenErrorMsg ||
                'O link de redefinição venceu ou já foi usado. Cada link vale por 1 hora.'}
            </p>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link to="/recuperar-senha">Pedir um link novo</Link>
          </Button>
          <Link to="/login" className={linkDeTexto}>
            Voltar para o login
          </Link>
        </div>
      ) : success ? (
        <div className="flex flex-col gap-4">
          <div
            role="status"
            className="flex items-start gap-3 rounded-3xl bg-primary/10 px-5 py-4 text-base text-success-ink"
          >
            <CircleCheck className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            <p>Sua senha foi atualizada.</p>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link to="/login">Ir para o login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {accountEmail && (
            <p className="rounded-3xl bg-muted px-5 py-3 text-base">
              Senha nova para <strong className="break-all">{accountEmail}</strong>
            </p>
          )}

          {erro && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-3xl bg-destructive/10 px-5 py-3 text-sm font-bold text-destructive"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{erro}</span>
            </div>
          )}

          <ResumoDeErros erros={errosDoResumo} tentativa={tentativa} />

          <Field id="password" label="Senha nova" error={errors.password} anunciar={false}>
            <PasswordInput
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={(e) => aoSairDoCampo('password', e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field
            id="confirmPassword"
            label="Repita a senha nova"
            error={errors.confirmPassword}
            anunciar={false}
          >
            <PasswordInput
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={(e) => aoSairDoCampo('confirmPassword', e.target.value)}
              disabled={submitting}
            />
          </Field>

          <RegrasDaSenha senha={password} confirmacao={confirmPassword} />

          <Button
            type="submit"
            size="lg"
            carregando={submitting}
            textoCarregando="Salvando…"
            className="mt-1 w-full"
          >
            Salvar senha nova
          </Button>

          <Link to="/login" className={linkDeTexto}>
            Voltar para o login
          </Link>
        </form>
      )}
    </LayoutDeAcesso>
  )
}
