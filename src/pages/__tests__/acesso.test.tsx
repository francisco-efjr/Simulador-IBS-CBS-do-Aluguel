import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const solicitarRecuperacaoSenha = vi.fn()
const redefinirSenha = vi.fn()
vi.mock('@/services/auth-recovery', () => ({
  solicitarRecuperacaoSenha: (...args: unknown[]) => solicitarRecuperacaoSenha(...args),
  validarLinkDeRecuperacao: () => Promise.resolve({ valid: true, email: 'ana@exemplo.com.br' }),
  redefinirSenha: (...args: unknown[]) => redefinirSenha(...args),
}))
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ signIn: vi.fn(), signUp: vi.fn(), isAuthenticated: false }),
}))

import RecuperarSenha from '@/pages/RecuperarSenha'
import ResetarSenha from '@/pages/ResetarSenha'
import Login from '@/pages/Login'

const dentroDoRoteador = (tela: React.ReactElement) =>
  render(<MemoryRouter>{tela}</MemoryRouter>)

describe('Recuperar senha', () => {
  beforeEach(() => solicitarRecuperacaoSenha.mockReset())

  it('avisa o e-mail incompleto, com o texto do catálogo, e não envia', async () => {
    dentroDoRoteador(<RecuperarSenha />)
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }))
    const resumo = await screen.findByRole('alert')
    expect(resumo).toHaveTextContent('Confira 1 campo')
    expect(resumo).toHaveTextContent('Digite o e-mail completo, por exemplo nome@email.com')
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(solicitarRecuperacaoSenha).not.toHaveBeenCalled()
  })

  it('depois de enviar mostra "Confira seu e-mail" com o endereço', async () => {
    solicitarRecuperacaoSenha.mockResolvedValue({ success: true, message: '' })
    dentroDoRoteador(<RecuperarSenha />)
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com.br' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }))
    expect(await screen.findByRole('heading', { name: 'Confira seu e-mail' })).toBeInTheDocument()
    expect(screen.getByText('ana@exemplo.com.br')).toBeInTheDocument()
  })
})

describe('Redefinir senha', () => {
  it('marca as regras enquanto digita e diz "Atendido:" ou "Falta:" ao leitor de tela', async () => {
    dentroDoRoteador(<ResetarSenha />)
    const senha = await screen.findByLabelText('Senha nova')
    const regras = screen.getByRole('list', { name: 'Regras da senha' })
    expect(regras).toHaveTextContent('Falta: Pelo menos 8 caracteres')
    expect(regras).toHaveTextContent('Falta: As duas senhas são iguais')

    fireEvent.change(senha, { target: { value: 'senhaboa1' } })
    fireEvent.change(screen.getByLabelText('Repita a senha nova'), {
      target: { value: 'senhaboa1' },
    })
    expect(regras).toHaveTextContent('Atendido: Pelo menos 8 caracteres')
    expect(regras).toHaveTextContent('Atendido: As duas senhas são iguais')
  })

  it('não salva senha curta e leva ao erro', async () => {
    redefinirSenha.mockReset()
    dentroDoRoteador(<ResetarSenha />)
    fireEvent.change(await screen.findByLabelText('Senha nova'), { target: { value: 'curta' } })
    fireEvent.change(screen.getByLabelText('Repita a senha nova'), { target: { value: 'curta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar senha nova' }))
    await waitFor(() =>
      expect(screen.getAllByText(/pelo menos 8 caracteres/i).length).toBeGreaterThan(0),
    )
    expect(redefinirSenha).not.toHaveBeenCalled()
  })
})

describe('Login', () => {
  beforeEach(() => {
    // O Radix mede o Checkbox com ResizeObserver, que o jsdom não traz.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  it('lista os campos que faltam e foca o resumo', async () => {
    dentroDoRoteador(<Login />)
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    const resumo = await screen.findByRole('alert')
    expect(resumo).toHaveTextContent('Confira 2 campos')
    expect(resumo).toHaveTextContent('Preencha o campo E-mail.')
    expect(resumo).toHaveTextContent('Preencha o campo Senha.')
    expect(resumo).toHaveFocus()
  })
})
