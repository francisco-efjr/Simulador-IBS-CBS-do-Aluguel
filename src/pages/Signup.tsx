import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { LayoutDeAcesso } from '@/components/organico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Field } from '@/components/shared/Field'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { RegrasDaSenha } from '@/components/shared/RegrasDaSenha'
import { ResumoDeErros, type ErroDoResumo } from '@/components/shared/ResumoDeErros'
import { extractFieldErrors, mensagemDeAutenticacao } from '@/lib/dados/erros'
import { emailCompleto, MENSAGENS } from '@/lib/mensagens-de-erro'
import { MENSAGENS_DA_SENHA, TAMANHO_MINIMO_DA_SENHA } from '@/lib/senha'
import { CLIENTE, NOME_DO_SISTEMA } from '@/lib/marca'
import { validarConviteToken } from '@/services/convites'
import { toast } from 'sonner'

type Campo = 'name' | 'email' | 'password' | 'confirmPassword'

const ROTULOS: Record<Campo, string> = {
  name: 'Nome completo',
  email: 'E-mail',
  password: 'Senha',
  confirmPassword: 'Repita a senha',
}

export default function Signup() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') || ''

  const [token, setToken] = useState(tokenFromUrl)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [tentativa, setTentativa] = useState(0)
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
      } else {
        setInviteStatus(res)
        setGeneralError(res.message || 'Convite inválido ou expirado.')
      }
    } catch {
      setGeneralError('Não foi possível verificar o convite. Confira a internet e tente de novo.')
    } finally {
      setValidatingToken(false)
    }
  }

  const emailDoConvite = Boolean(inviteStatus?.valid && inviteStatus.email)

  /** Confere um campo (ao sair dele e ao enviar). Devolve o texto do erro, ou vazio. */
  const conferir = (campo: Campo, valor: string): string => {
    switch (campo) {
      case 'name':
        return valor.trim() ? '' : MENSAGENS.obrigatorio(ROTULOS.name)
      case 'email':
        if (!valor.trim()) return MENSAGENS.obrigatorio(ROTULOS.email)
        return emailCompleto(valor) ? '' : MENSAGENS.emailIncompleto
      case 'password':
        if (!valor) return MENSAGENS.obrigatorio(ROTULOS.password)
        return valor.length >= TAMANHO_MINIMO_DA_SENHA ? '' : MENSAGENS_DA_SENHA.curta
      case 'confirmPassword':
        if (!valor) return MENSAGENS.obrigatorio(ROTULOS.confirmPassword)
        return valor === password ? '' : MENSAGENS_DA_SENHA.diferentes
    }
  }

  const aoSairDoCampo = (campo: Campo, valor: string) => {
    // Passar o foco por um campo vazio, antes de tentar enviar, ainda não é erro.
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
    const valores: Record<Campo, string> = { name, email, password, confirmPassword }
    ;(Object.keys(valores) as Campo[]).forEach((campo) => {
      const mensagem = conferir(campo, valores[campo])
      if (mensagem) errors[campo] = mensagem
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

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
          'Não foi possível criar a conta agora. Confira os dados e tente de novo.',
        )
        setGeneralError(errorMsg)
      }
    } else if (!conviteToken) {
      // Sem convite a conta nasce inativa: nada de entrar no sistema agora.
      setAguardaLiberacao(true)
    } else {
      toast.success(`Conta ativada. Boas-vindas à ${CLIENTE}.`)
      navigate('/inicio', { replace: true })
    }
  }

  const errosDoResumo: ErroDoResumo[] = (Object.keys(ROTULOS) as Campo[])
    .filter((campo) => fieldErrors[campo])
    .map((campo) => ({ campo, rotulo: ROTULOS[campo], mensagem: fieldErrors[campo] }))

  if (aguardaLiberacao) {
    return (
      <LayoutDeAcesso
        etiqueta="Cadastro feito"
        titulo="Conta criada, aguardando liberação"
        subtitulo={
          <>
            Seu cadastro foi feito sem um convite válido. Um administrador do sistema precisa
            liberar o seu acesso antes do primeiro login.
          </>
        }
      >
        <Button asChild size="lg" className="w-full">
          <Link to="/login">Ir para o login</Link>
        </Button>
      </LayoutDeAcesso>
    )
  }

  return (
    <LayoutDeAcesso
      etiqueta={inviteStatus?.valid ? 'Convite recebido' : 'Cadastro'}
      titulo={inviteStatus?.valid ? 'Crie sua senha de acesso' : 'Criar conta'}
      subtitulo={
        inviteStatus?.valid
          ? `Defina seu nome e sua senha para acessar o ${NOME_DO_SISTEMA} da ${CLIENTE}.`
          : 'Defina suas credenciais. Sem convite, a conta fica aguardando a liberação de um administrador.'
      }
    >
      {/* Convite validado: mostra o e-mail e o papel que ele dá. */}
      {inviteStatus?.valid && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-3xl bg-primary/10 px-5 py-4 text-base text-success-ink"
        >
          <CircleCheck className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <strong className="font-extrabold">Convite confirmado</strong>
            {inviteStatus.perfil && (
              <span className="flex flex-wrap items-center gap-2">
                Seu acesso será de
                <Badge variant="ok" className="uppercase">
                  {inviteStatus.perfil}
                </Badge>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Convite recusado (inválido, vencido, já usado). */}
      {inviteStatus && !inviteStatus.valid && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-3xl bg-destructive/10 px-5 py-4 text-base text-red-800"
        >
          <CircleAlert className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <strong className="font-extrabold">Convite inválido ou vencido</strong>
            <span>{inviteStatus.message || 'Peça um novo convite a quem administra o sistema.'}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {generalError && !(inviteStatus && !inviteStatus.valid) && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-3xl bg-destructive/10 px-5 py-3 text-sm font-bold text-red-800"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{generalError}</span>
          </div>
        )}

        <ResumoDeErros erros={errosDoResumo} tentativa={tentativa} />

        {/* Código de convite digitado à mão, quando a pessoa não chegou pelo link. */}
        {!tokenFromUrl && !inviteStatus?.valid && (
          <div className="flex flex-col gap-3 rounded-3xl bg-muted px-5 py-4">
            <Field
              id="token"
              label="Código do convite"
              opcional
              hint="Está no e-mail do convite. Sem ele, um administrador libera o acesso depois."
            >
              <Input
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </Field>
            <Button
              type="button"
              variant="outline"
              carregando={validatingToken}
              textoCarregando="Conferindo…"
              disabled={!validatingToken && !token.trim()}
              onClick={() => handleValidateToken(token)}
              className="self-start"
            >
              Conferir convite
            </Button>
            {!token.trim() && (
              <p className="text-sm text-accent-foreground">
                Digite o código para poder conferir o convite.
              </p>
            )}
          </div>
        )}

        <Field id="name" label={ROTULOS.name} error={fieldErrors.name} anunciar={false}>
          <Input
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={(e) => aoSairDoCampo('name', e.target.value)}
            className="min-h-14"
          />
        </Field>

        <Field
          id="email"
          label={ROTULOS.email}
          error={fieldErrors.email}
          anunciar={false}
          hint={
            emailDoConvite
              ? 'É o e-mail do convite. Para trocar, fale com a administração.'
              : undefined
          }
        >
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            readOnly={emailDoConvite}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => aoSairDoCampo('email', e.target.value)}
            className={emailDoConvite ? 'min-h-14 border-dashed' : 'min-h-14'}
          />
        </Field>

        <Field id="password" label={ROTULOS.password} error={fieldErrors.password} anunciar={false}>
          <PasswordInput
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={(e) => aoSairDoCampo('password', e.target.value)}
          />
        </Field>

        <Field
          id="confirmPassword"
          label={ROTULOS.confirmPassword}
          error={fieldErrors.confirmPassword}
          anunciar={false}
        >
          <PasswordInput
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={(e) => aoSairDoCampo('confirmPassword', e.target.value)}
          />
        </Field>

        <RegrasDaSenha senha={password} confirmacao={confirmPassword} />

        <Button
          type="submit"
          size="lg"
          carregando={isSubmitting}
          textoCarregando="Criando seu acesso…"
          className="mt-1 w-full"
        >
          {inviteStatus?.valid ? 'Criar meu acesso' : 'Criar conta'}
        </Button>

        <Link
          to="/login"
          className="self-center px-2.5 py-2.5 text-base font-bold text-primary underline hover:text-foreground"
        >
          Já tenho acesso · Entrar
        </Link>
      </form>
    </LayoutDeAcesso>
  )
}
