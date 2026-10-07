import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { UserCheck, CircleOff } from 'lucide-react'
import { GrupoDePilulas } from '@/components/shared/GrupoDePilulas'
import { Combobox } from '@/components/shared/Combobox'
import { Field } from '@/components/shared/Field'
import { abreviar } from '@/lib/format'

describe('abreviar (regra Q32: opção de seletor até ~24 caracteres)', () => {
  it('não mexe no que cabe', () => {
    expect(abreviar('Edifício Aguiar')).toBe('Edifício Aguiar')
  })

  it('corta na última palavra inteira e põe reticências', () => {
    const curto = abreviar('Holding Aguiar Participações Ltda')
    expect(curto.length).toBeLessThanOrEqual(24)
    expect(curto).toBe('Holding Aguiar…')
  })

  it('aceita vazio', () => {
    expect(abreviar(null)).toBe('')
  })
})

describe('GrupoDePilulas', () => {
  it('é um grupo de rádio com uma opção marcada, e troca ao clicar', () => {
    const aoMudar = vi.fn()
    render(
      <GrupoDePilulas
        legenda="Tipo de garantia"
        opcoes={[
          { valor: 'fiador', rotulo: 'Fiador', icone: UserCheck },
          { valor: 'sem garantia', rotulo: 'Sem garantia', icone: CircleOff },
        ]}
        valor="fiador"
        onValorChange={aoMudar}
      />,
    )
    expect(screen.getByRole('radiogroup', { name: 'Tipo de garantia' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Fiador' })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: 'Sem garantia' }))
    expect(aoMudar).toHaveBeenCalledWith('sem garantia')
  })
})

describe('Combobox em painel', () => {
  const opcoes = [
    { valor: '1', rotulo: 'Clínica Respira Ltda', detalhe: '12.345.678/0001-90' },
    { valor: '2', rotulo: 'Café Ponto Doce', detalhe: '987.654.321-00' },
  ]

  it('o rótulo do campo dá nome ao gatilho e mostra a opção escolhida', () => {
    render(
      <Field label="Inquilino">
        <Combobox opcoes={opcoes} valor="2" onValorChange={() => {}} />
      </Field>,
    )
    const gatilho = screen.getByRole('combobox', { name: /Inquilino/ })
    expect(gatilho).toHaveTextContent('Café Ponto Doce')
  })

  it('abre o painel com nome inteiro e documento, e escolhe ao ativar', async () => {
    const aoEscolher = vi.fn()
    // O cmdk mede a lista com ResizeObserver e rola o item com scrollIntoView.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Element.prototype.scrollIntoView = vi.fn()
    render(
      <Field label="Inquilino">
        <Combobox opcoes={opcoes} valor="" onValorChange={aoEscolher} />
      </Field>,
    )
    fireEvent.click(screen.getByRole('combobox'))
    expect(await screen.findByText('12.345.678/0001-90')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Clínica Respira Ltda'))
    expect(aoEscolher).toHaveBeenCalledWith('1')
  })
})
