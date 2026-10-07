import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/shared/Field'
import { ResumoDeErros } from '@/components/shared/ResumoDeErros'
import { emailCompleto, MENSAGENS } from '@/lib/mensagens-de-erro'

describe('Button carregando (guia de estilo, seção 06)', () => {
  it('troca o texto, marca aria-busy e ignora o segundo toque', () => {
    const aoClicar = vi.fn()
    render(
      <Button carregando textoCarregando="Entrando…" onClick={aoClicar}>
        Entrar
      </Button>,
    )
    const botao = screen.getByRole('button', { name: 'Entrando…' })
    expect(botao).toHaveAttribute('aria-busy', 'true')
    expect(botao).not.toBeDisabled() // o foco do teclado fica no botão
    fireEvent.click(botao)
    expect(aoClicar).not.toHaveBeenCalled()
  })

  it('usa "Aguarde…" quando não há texto próprio', () => {
    render(<Button carregando>Salvar</Button>)
    expect(screen.getByRole('button', { name: 'Aguarde…' })).toBeInTheDocument()
  })

  it('parado, clica normalmente e não marca aria-busy', () => {
    const aoClicar = vi.fn()
    render(<Button onClick={aoClicar}>Salvar</Button>)
    const botao = screen.getByRole('button', { name: 'Salvar' })
    expect(botao).not.toHaveAttribute('aria-busy')
    fireEvent.click(botao)
    expect(aoClicar).toHaveBeenCalledTimes(1)
  })
})

describe('Field com erro e opcional', () => {
  it('liga o erro ao campo e marca aria-invalid', () => {
    render(
      <Field label="E-mail" error="Digite o e-mail completo, por exemplo nome@email.com">
        <Input />
      </Field>,
    )
    const campo = screen.getByLabelText(/E-mail/)
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    const mensagem = screen.getByText(/Digite o e-mail completo/)
    expect(campo.getAttribute('aria-describedby')).toContain(mensagem.closest('p')!.id)
  })

  it('escreve "(opcional)" no rótulo, sem asterisco', () => {
    render(
      <Field label="Telefone" opcional>
        <Input />
      </Field>,
    )
    expect(screen.getByText('(opcional)')).toBeInTheDocument()
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('usa o id combinado, para o resumo apontar para o campo', () => {
    render(
      <Field id="meu-campo" label="Nome">
        <Input />
      </Field>,
    )
    expect(screen.getByLabelText('Nome')).toHaveAttribute('id', 'meu-campo')
  })
})

describe('ResumoDeErros', () => {
  const erros = [
    { campo: 'a', rotulo: 'E-mail', mensagem: 'incompleto' },
    { campo: 'b', rotulo: 'Senha', mensagem: 'falta' },
  ]

  it('conta os campos, é um alerta e recebe o foco ao enviar', () => {
    const { rerender } = render(<ResumoDeErros erros={[]} tentativa={0} />)
    rerender(<ResumoDeErros erros={erros} tentativa={1} />)
    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('Confira 2 campos')
    expect(alerta).toHaveFocus()
  })

  it('diz "1 campo" no singular e leva o foco ao campo ao ativar o link', () => {
    render(
      <>
        <ResumoDeErros erros={[erros[0]]} tentativa={1} />
        <input id="a" aria-label="E-mail" />
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Confira 1 campo')
    // jsdom não implementa scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
    fireEvent.click(screen.getByRole('link', { name: /E-mail: incompleto/ }))
    expect(screen.getByLabelText('E-mail')).toHaveFocus()
  })

  it('não aparece sem erros', () => {
    render(<ResumoDeErros erros={[]} tentativa={3} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('catálogo de mensagens', () => {
  it('traz os textos da seção 07', () => {
    expect(MENSAGENS.obrigatorio('E-mail')).toBe('Preencha o campo E-mail.')
    expect(MENSAGENS.loginRecusado).toBe('E-mail ou senha não conferem. Confira e tente de novo.')
  })

  it('confere o formato do e-mail', () => {
    expect(emailCompleto('helena@holding')).toBe(false)
    expect(emailCompleto('helena@holdingaguiar.com.br')).toBe(true)
  })
})
