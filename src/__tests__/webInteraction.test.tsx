import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../ui/App.tsx';

describe('Testes de Integração e Interação Web (QA Web Component Tests)', () => {
  it('deve renderizar a aplicação principal e barra de navegação com todas as abas', () => {
    render(<App />);

    expect(screen.getByText('Simulador IBS/CBS do Aluguel')).toBeInTheDocument();
    expect(screen.getAllByText('LC 214/2025')[0]).toBeInTheDocument();
    expect(screen.getByText('Simulação Única')).toBeInTheDocument();
    expect(screen.getByText('Carteira de Imóveis')).toBeInTheDocument();
    expect(screen.getByText('Comparativo Atual x Novo')).toBeInTheDocument();
  });

  it('deve alternar entre as abas principais com coesão visual', () => {
    render(<App />);

    // Aba Carteira
    fireEvent.click(screen.getByText('Carteira de Imóveis'));
    expect(screen.getByText('Simulador de Carteira de Imóveis')).toBeInTheDocument();
    expect(screen.getByText('Adicionar Imóvel à Carteira')).toBeInTheDocument();

    // Aba Comparativo
    fireEvent.click(screen.getByText('Comparativo Atual x Novo'));
    expect(screen.getByText('Configuração do Cenário Comparativo')).toBeInTheDocument();
    expect(screen.getByText('Regime Vigente Atual')).toBeInTheDocument();

    // Aba Fundamentos da Lei
    fireEvent.click(screen.getByText('Fundamentos da Lei'));
    expect(screen.getByText('Guia Jurídico e Fundamentação Legal')).toBeInTheDocument();

    // Volta para Simulação Única
    fireEvent.click(screen.getByText('Simulação Única'));
    expect(screen.getByText('Ficha da Operação')).toBeInTheDocument();
  });

  it('deve atualizar as alíquotas reativamente ao mudar o Ano da Transição (2026 vs 2033)', () => {
    render(<App />);

    // Clica em 2026 (Ano Teste)
    const btn2026 = screen.getByText('2026 (Teste)');
    fireEvent.click(btn2026);

    // Deve exibir 0.3%
    expect(screen.getAllByText(/0.3%/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Ano Teste/)).toBeInTheDocument();

    // Clica em 2033 (Regime Pleno)
    const btn2033 = screen.getByText('2033 (Pleno)');
    fireEvent.click(btn2033);

    // Deve exibir 7.95%
    expect(screen.getAllByText(/7.95%/).length).toBeGreaterThan(0);
  });

  it('deve alternar entre Residencial e Comercial e atualizar a aplicação do Redutor Social', () => {
    render(<App />);

    // Inicialmente residencial (tem redutor social)
    expect(screen.getByText(/Redutor Social de R\$ 600,00\/mês é aplicado/)).toBeInTheDocument();

    // Clica em Comercial
    const btnComercial = screen.getByRole('button', { name: /Comercial/i });
    fireEvent.click(btnComercial);

    // Redutor social não se aplica
    expect(screen.getByText(/Imóveis comerciais não fazem jus ao Redutor Social/)).toBeInTheDocument();
  });

  it('deve alternar entre Pessoa Física e PJ e adaptar os inputs inteligentemente', () => {
    render(<App />);

    // Em PF, mostra campos de habitualidade
    expect(screen.getByText('Nº de Imóveis Alugados')).toBeInTheDocument();
    expect(screen.getByText('Receita Anual Total (R$)')).toBeInTheDocument();

    // Clica em Pessoa Jurídica (Holding)
    const btnPJ = screen.getByRole('button', { name: /Pessoa Jurídica \(Holding\)/i });
    fireEvent.click(btnPJ);

    // Oculta campos de habitualidade e exibe campos da PJ
    expect(screen.queryByText('Nº de Imóveis Alugados')).not.toBeInTheDocument();
    expect(screen.getByText('Regime Tributário da PJ')).toBeInTheDocument();
    expect(screen.getByText('Taxa de Imobiliária (%)')).toBeInTheDocument();
    expect(screen.getByText(/PJ toma crédito de IBS\/CBS sobre a comissão da imobiliária/)).toBeInTheDocument();
  });

  it('deve aplicar a máscara brasileira (0.000,00) em tempo real durante o preenchimento', () => {
    render(<App />);

    // Valor inicial formatado no padrão brasileiro com milhar e decimal
    const rentInput = screen.getByDisplayValue('3.500,00');
    expect(rentInput).toBeInTheDocument();

    // Simula o foco no input
    fireEvent.focus(rentInput);

    // Apaga todo o valor (backspace até vazio)
    fireEvent.change(rentInput, { target: { value: '' } });
    expect(rentInput).toHaveValue(''); // Não recolocou 0 teimoso na frente!

    // Digita "5000" -> Durante o preenchimento, já aplica o separador de milhar "5.000"
    fireEvent.change(rentInput, { target: { value: '5000' } });
    expect(rentInput).toHaveValue('5.000'); // Máscara aplicada ao vivo!

    // Digita com centavos "5000,75" -> Durante o preenchimento, já formata "5.000,75"
    fireEvent.change(rentInput, { target: { value: '5000,75' } });
    expect(rentInput).toHaveValue('5.000,75'); // Centavos e milhar ao vivo!

    // Blur mantém ou completa a formatação
    fireEvent.blur(rentInput);
    expect(rentInput).toHaveValue('5.000,75');
  });

  it('deve exibir feedback visual de validação de erro ao inserir valor inválido de aluguel', () => {
    render(<App />);

    const rentInput = screen.getByDisplayValue('3.500,00');
    fireEvent.change(rentInput, { target: { value: '-2000' } });

    // Mensagem de erro de validação
    expect(screen.getByText('O valor do aluguel base não pode ser negativo.')).toBeInTheDocument();
    expect(screen.getByText('Entrada Inválida no Contrato')).toBeInTheDocument();
  });

  it('deve exibir a aba API Cronograma com o endpoint GET /api/cronograma-transicao e dados válidos', () => {
    render(<App />);

    // Clica na nova aba API Cronograma
    fireEvent.click(screen.getByText('API Cronograma'));

    expect(screen.getByText('/api/cronograma-transicao')).toBeInTheDocument();
    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('VIGENTE_E_VALIDADO')).toBeInTheDocument();
    expect(screen.getByText('2026 – 2033 (8 Fases)')).toBeInTheDocument();
  });
});
