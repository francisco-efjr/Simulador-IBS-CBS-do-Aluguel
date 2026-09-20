import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OndeOSistemaEsta } from '../OndeOSistemaEsta'
import { OBJETIVOS, progressoDasEntregas, type Objetivos } from '@/data/andamento'

/**
 * A seção "Onde o sistema está", da tela Início. O que estes testes protegem é
 * a promessa feita ao dono: ver o objetivo, o andamento e o que vem a seguir
 * sem abrir a página pública — e nunca um número que ninguém mede.
 */

const OBJETIVOS_DE_TESTE: Objetivos = {
  objetivo: {
    frase: 'Fechar o mês dentro do sistema.',
    prazo: '2026-12-31',
    prazoPorExtenso: '31 de dezembro de 2026',
  },
  indicadores: [
    {
      nome: 'Aluguéis previstos pelo contrato',
      comoSeMede: 'Quantos nascem sozinhos do contrato.',
      hoje: 'Nenhum',
      meta: 'Todos os contratos em vigor',
      situacao: 'parado',
    },
    {
      nome: 'Reajustes na data',
      comoSeMede: 'Reajustes feitos até o aniversário do contrato.',
      hoje: null,
      meta: 'Todos',
      situacao: 'nao-medido',
    },
  ],
  proximosPassos: [
    { codigo: 'B-03', titulo: 'Entrada só por convite', detalhe: 'Fechar o cadastro aberto.' },
    { codigo: 'B-02', titulo: 'Laudo com a lei nova', detalhe: 'Citar a LC 227/2026.' },
    { codigo: 'B-14', titulo: 'Recusa explicada', detalhe: 'Dizer o motivo na tela.' },
    { codigo: 'B-10', titulo: 'Garantia conferida', detalhe: 'Caução até três aluguéis.' },
  ],
}

function montar(props: Parameters<typeof OndeOSistemaEsta>[0] = {}) {
  return render(
    <MemoryRouter>
      <OndeOSistemaEsta objetivos={OBJETIVOS_DE_TESTE} {...props} />
    </MemoryRouter>,
  )
}

describe('Onde o sistema está', () => {
  it('mostra o objetivo com o prazo', () => {
    montar()
    expect(screen.getByText(/Nosso objetivo até 31 de dezembro de 2026/)).toBeInTheDocument()
    expect(screen.getByText('Fechar o mês dentro do sistema.')).toBeInTheDocument()
  })

  it('mostra o progresso das entregas com a mesma conta da página pública', () => {
    montar()
    const progresso = progressoDasEntregas()
    expect(
      screen.getByText(`${progresso.contagem.pronto} de ${progresso.total} entregas concluídas`),
    ).toBeInTheDocument()
    expect(screen.getByText(`${progresso.percentualPronto}%`)).toBeInTheDocument()
  })

  it('diz "ainda não medido" em vez de inventar número', () => {
    montar()
    expect(screen.getByText('Nenhum')).toBeInTheDocument()
    expect(screen.getByText('ainda não medido')).toBeInTheDocument()
  })

  it('mostra só os três primeiros passos, na ordem do backlog', () => {
    montar()
    expect(screen.getByText('Entrada só por convite')).toBeInTheDocument()
    expect(screen.getByText('Laudo com a lei nova')).toBeInTheDocument()
    expect(screen.getByText('Recusa explicada')).toBeInTheDocument()
    expect(screen.queryByText('Garantia conferida')).not.toBeInTheDocument()
  })

  it('leva ao quadro completo e resume a última conferência automática', () => {
    montar()
    expect(screen.getByRole('link', { name: /Ver o quadro completo/ })).toHaveAttribute('href', '/')
    expect(screen.getByText(/Última conferência automática: \d+ de \d+ em ordem/)).toBeInTheDocument()
  })

  it('só o administrador recebe o atalho do registro de atividades', () => {
    const { unmount } = montar()
    expect(screen.queryByRole('link', { name: /registro de atividades/ })).not.toBeInTheDocument()
    unmount()

    montar({ isAdministrador: true })
    expect(screen.getByRole('link', { name: /registro de atividades/ })).toHaveAttribute(
      'href',
      '/logs-atividade',
    )
  })

  it('usa, por padrão, o objetivo publicado em objetivos.json', () => {
    render(
      <MemoryRouter>
        <OndeOSistemaEsta />
      </MemoryRouter>,
    )
    expect(screen.getByText(OBJETIVOS.objetivo.frase)).toBeInTheDocument()
  })
})
