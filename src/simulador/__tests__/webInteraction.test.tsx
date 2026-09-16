import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { App } from '../ui/App.tsx';
import { TransitionCalendar } from '../core/services/TransitionCalendar.ts';

/** Destrava o Modo Profissional como se o usuário tivesse aberto /?pro=1 */
function enableProfessionalMode() {
  window.localStorage.setItem('modoProfissional', '1');
}

describe('Interface pública (locador assistido)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renderiza o cabeçalho e apenas os módulos de uso do locador', () => {
    render(<App />);

    expect(screen.getByText('Simulador Tributário Imobiliário')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Contrato Individual' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Gestão de Portfólio' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Cenário Comparativo' })).toBeInTheDocument();
  });

  it('não expõe os módulos reservados nem os parâmetros regulatórios', () => {
    render(<App />);

    expect(screen.queryByRole('tab', { name: 'Dossiê Jurídico' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Integração & Cronograma' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Premissas Econômico-Fiscais/)).not.toBeInTheDocument();
    expect(screen.queryByText('Ano da apuração')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Parecer/ })).not.toBeInTheDocument();
  });

  it('não expõe o seletor de ano nem a alíquota de referência', () => {
    render(<App />);

    expect(screen.queryByRole('group', { name: 'Ano da apuração' })).not.toBeInTheDocument();
    expect(screen.queryByText('Alíquota do aluguel')).not.toBeInTheDocument();
    for (const year of [2026, 2029, 2033]) {
      expect(screen.queryByRole('button', { name: String(year) })).not.toBeInTheDocument();
    }
  });

  it('apura pelo ano corrente da transição sem pedir escolha ao usuário', () => {
    render(<App />);

    const anoCorrente = TransitionCalendar.getCurrentTransitionYear();
    fireEvent.change(screen.getByLabelText('Valor do aluguel por mês'), { target: { value: '500000' } });

    expect(screen.getByText(`Imposto por mês em ${anoCorrente}`)).toBeInTheDocument();
  });

  it('associa cada rótulo ao seu campo, permitindo busca por label acessível', () => {
    render(<App />);

    expect(screen.getByLabelText('Valor do aluguel por mês')).toBeInTheDocument();
    expect(screen.getByLabelText('Condomínio por mês')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantos imóveis aluga')).toBeInTheDocument();
  });

  it('aplica a máscara progressiva e calcula ao informar o aluguel', () => {
    render(<App />);

    const rentInput = screen.getByLabelText('Valor do aluguel por mês');
    expect(rentInput).toHaveValue('');
    expect(screen.getByText('Informe o valor do aluguel.')).toBeInTheDocument();

    fireEvent.focus(rentInput);
    fireEvent.change(rentInput, { target: { value: '1' } });
    expect(rentInput).toHaveValue('0,01');

    fireEvent.change(rentInput, { target: { value: '0,010' } });
    expect(rentInput).toHaveValue('0,10');

    fireEvent.change(rentInput, { target: { value: '500075' } });
    expect(rentInput).toHaveValue('5.000,75');

    fireEvent.blur(rentInput);
    expect(rentInput).toHaveValue('5.000,75');
    expect(screen.getByText(/^Imposto por mês em \d{4}$/)).toBeInTheDocument();
  });

  it('sinaliza erro de validação em aluguel negativo', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Valor do aluguel por mês'), { target: { value: '-2000' } });

    expect(screen.getByText('O valor do aluguel base não pode ser negativo.')).toBeInTheDocument();
    expect(screen.getByText('Confira os valores')).toBeInTheDocument();
  });

  it('troca os campos exibidos conforme o dono seja pessoa física ou empresa', () => {
    render(<App />);

    expect(screen.getByLabelText('Quantos imóveis aluga')).toBeInTheDocument();

    const donoGroup = screen.getByRole('group', { name: 'Quem é o dono do imóvel' });
    fireEvent.click(within(donoGroup).getByLabelText('Empresa'));

    expect(screen.queryByLabelText('Quantos imóveis aluga')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Regime da empresa')).toBeInTheDocument();
    expect(screen.getByLabelText('Taxa da imobiliária')).toBeInTheDocument();
  });

  it('compara os regimes ao informar o aluguel na aba comparativa', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('tab', { name: 'Cenário Comparativo' }));
    expect(screen.getByText('Informe o aluguel mensal para ver a comparação.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Aluguel mensal'), { target: { value: '600000' } });

    expect(screen.getByText('Hoje')).toBeInTheDocument();
    expect(screen.getByText(/^Em \d{4}$/)).toBeInTheDocument();
  });

  it('cadastra um ativo na carteira partindo do estado zerado', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('tab', { name: 'Gestão de Portfólio' }));
    expect(screen.getByText('0 ativos')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nome do imóvel'), { target: { value: 'Apto Copacabana' } });
    fireEvent.change(screen.getByLabelText('Aluguel por mês'), { target: { value: '400000' } });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar imóvel/i }));

    expect(screen.getByText('1 ativo')).toBeInTheDocument();
    expect(screen.getByText('Apto Copacabana')).toBeInTheDocument();
  });

  it('cadastra ativo com múltiplas unidades', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('tab', { name: 'Gestão de Portfólio' }));

    fireEvent.change(screen.getByLabelText('Nome do imóvel'), { target: { value: 'Residencial Flores' } });
    fireEvent.change(screen.getByLabelText('Quantas unidades'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('Aluguel somado de todas'), { target: { value: '600000' } });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar imóvel/i }));

    expect(screen.getByText('Residencial Flores')).toBeInTheDocument();
    expect(screen.getByText('6 apartamentos')).toBeInTheDocument();
  });
});

describe('Área reservada (Modo Profissional)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('destrava os módulos técnicos quando o modo está ativo', () => {
    enableProfessionalMode();
    render(<App />);

    expect(screen.getByText('Modo Profissional')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Dossiê Jurídico' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Integração & Cronograma' })).toBeInTheDocument();
    expect(screen.getByText(/Premissas Econômico-Fiscais/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Ano da apuração' })).toBeInTheDocument();
  });

  it('permite escolher qualquer um dos oito anos e recalcula a alíquota', () => {
    enableProfessionalMode();
    render(<App />);

    for (const year of [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]) {
      expect(screen.getByRole('button', { name: String(year) })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole('button', { name: '2026' }));
    expect(screen.getByText('0,30%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2032' }));
    expect(screen.getByText('4,76%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2033' }));
    expect(screen.getByText('7,95%')).toBeInTheDocument();
  });

  it('expõe o endpoint do cronograma na aba de integração', () => {
    enableProfessionalMode();
    render(<App />);

    fireEvent.click(screen.getByRole('tab', { name: 'Integração & Cronograma' }));

    expect(screen.getByText('VIGENTE_E_VALIDADO')).toBeInTheDocument();
    expect(screen.getByText('2026 – 2033 (8 Fases)')).toBeInTheDocument();
  });

  it('oferece o parecer de auditoria ao lado do cálculo', () => {
    enableProfessionalMode();
    render(<App />);

    fireEvent.change(screen.getByLabelText('Valor do aluguel por mês'), { target: { value: '500000' } });
    fireEvent.click(screen.getByRole('button', { name: /Parecer/ }));

    expect(screen.getByText(/Parecer de Auditoria Fiscal/)).toBeInTheDocument();
  });

  it('ao sair, recolhe os módulos reservados e devolve o usuário a uma aba pública', () => {
    enableProfessionalMode();
    render(<App />);

    fireEvent.click(screen.getByRole('tab', { name: 'Dossiê Jurídico' }));
    fireEvent.click(screen.getByRole('button', { name: /Sair/ }));

    expect(screen.queryByText('Modo Profissional')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Dossiê Jurídico' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Contrato Individual' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(window.localStorage.getItem('modoProfissional')).toBeNull();
  });
});
