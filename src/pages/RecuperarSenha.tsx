import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleAlert, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { LayoutDeAcesso } from '@/components/organico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/shared/Field'
import { ResumoDeErros } from '@/components/shared/ResumoDeErros'
import { emailCompleto, MENSAGENS } from '@/lib/mensagens-de-erro'
import { solicitarRecuperacaoSenha } from '@/services/auth-recovery'

const LINK_DE_TEXTO =
  'inline-flex min-h-11 items-center self-center px-2.5 text-base font-bold text-primary underline hover:text-foreground'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const [error, setError] = useState('')
  const [tentativa, setTentativa] = useState(0)

  const conferir = (valor: string): string => {
    if (!valor.trim()) return MENSAGENS.obrigatorio('E-mail')
    return emailCompleto(valor) ? '' : MENSAGENS.emailIncompleto
  }

  /** Pede o link ao serviço. Devolve se deu certo; a mensagem de falha vai para a tela. */
  const pedirLink = async (): Promise<boolean> => {
    try {
      const res = await solicitarRecuperacaoSenha(email)
      if (res.success) return true
      setError(res.message || 'Não foi possível pedir o link agora. Tente de novo em instantes.')
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      setError(
        e?.data?.message ||
          e?.message ||
          'Não foi possível enviar o e-mail. Tente de novo mais tarde.',
      )
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTentativa((n) => n + 1)

    const mensagem = conferir(email)
    setFieldError(mensagem)
    if (mensagem) return

    setSubmitting(true)
    if (await pedirLink()) setSent(true)
    setSubmitting(false)
  }

  const reenviar = async () => {
    setError('')
    setReenviando(true)
    if (await pedirLink()) toast.success('Link enviado de novo. Veja também a caixa de spam.')
    setReenviando(false)
  }

  if (sent) {
    return (
      <LayoutDeAcesso
        icone={MailCheck}
        etiqueta="Recuperar acesso"
        titulo="Confira seu e-mail"
        subtitulo={
          <>
            Se existir um acesso com <strong className="break-all">{email}</strong>, o link chega em
            alguns minutos e vale por 1 hora. Veja também a caixa de spam.
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-3xl bg-destructive/10 px-5 py-3 text-sm font-bold text-destructive"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          <Button asChild size="lg" className="w-full">
            <Link to="/login">Voltar para o login</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            carregando={reenviando}
            textoCarregando="Enviando…"
            onClick={reenviar}
            className="self-center"
          >
            Não chegou? Enviar de novo
          </Button>
          <button
            type="button"
            className={LINK_DE_TEXTO}
            onClick={() => {
              setSent(false)
              setEmail('')
              setError('')
              setTentativa(0)
            }}
          >
            Usar outro e-mail
          </button>
        </div>
      </LayoutDeAcesso>
    )
  }

  return (
    <LayoutDeAcesso
      etiqueta="Recuperar acesso"
      titulo="Esqueceu a senha?"
      subtitulo="Informe seu e-mail. Vamos enviar um link para você criar uma senha nova."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-3xl bg-destructive/10 px-5 py-3 text-sm font-bold text-destructive"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <ResumoDeErros
          erros={fieldError ? [{ campo: 'email', rotulo: 'E-mail', mensagem: fieldError }] : []}
          tentativa={tentativa}
        />

        <Field
          id="email"
          label="E-mail"
          error={fieldError}
          anunciar={false}
          hint="O mesmo e-mail com que você entra no sistema."
        >
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => {
              if (e.target.value || tentativa > 0) setFieldError(conferir(e.target.value))
            }}
            disabled={submitting}
            className="min-h-14"
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          carregando={submitting}
          textoCarregando="Enviando…"
          className="w-full"
        >
          Enviar link
        </Button>

        <Link to="/login" className={LINK_DE_TEXTO}>
          Voltar para o login
        </Link>
      </form>
    </LayoutDeAcesso>
  )
}
