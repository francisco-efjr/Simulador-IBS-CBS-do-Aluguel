import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../ui/App.tsx';

describe('Testes de Integração e Interação Web (QA Web Component Tests)', () => {
  it('deve renderizar a aplicação principal e barra de navegação com todas as abas', () => {
    render(<App />);

    expect(screen.getByText('Simulador Tributário Imobiliário')).toBeInTheDocument();
    expect(screen.getAllByText('LC 214/2025')[0]).toBeInTheDocument();
    expect(screen.getByText('Contrato Individual')).toBeInTheDocument();
    expect(screen.getByText('Gestão de Portfólio')).toBeInTheDocument();
    expect(screen.getByText('Cenário Comparativo')).toBeInTheDocument();
  });

  it('deve alternar entre as abas principais com coesão visual', () => {
    render(<App />);

    // Aba Portfólio
    fireEvent.click(screen.getByText('Gestão de Portfólio'));
    expect(screen.getByText(/Gestão de Portfólio Imobiliário/)).toBeInTheDocument();
    expect(screen.getByText('Cadastrar Ativo no Portfólio')).toBeInTheDocument();

    // Aba Comparativo
    fireEvent.click(screen.getByText('Cenário Comparativo'));
    expect(screen.getByText('Diagnóstico Comparativo de Regimes Tributários')).toBeInTheDocument();
    expect(screen.getByText('Simulação Comparativa Zerada')).toBeInTheDocument();

    // Aba Dossiê Jurídico
    fireEvent.click(screen.getByText('Dossiê Jurídico'));
    expect(screen.getByText('Dossiê Jurídico & Fundamentação Regulatória')).toBeInTheDocument();

    // Volta para Contrato Individual
    fireEvent.click(screen.getByText('Contrato Individual'));
    expect(screen.getByText('Parâmetros do Contrato de Locação')).toBeInTheDocument();
  });

  it('deve atualizar as alíquotas reativamente ao mudar o Ano da Transição (2026 vs 2033)', () => {
    render(<App />);

    // Clica em 2026 (Ano Teste)
    const btn2026 = screen.getByText('2026 (Ano Teste)');
    fireEvent.click(btn2026);

    // Deve exibir 0.3%
    expect(screen.getAllByText(/0.3%/).length).toBeGreaterThan(0);

    // Clica em 2033 (Regime Pleno)
    const btn2033 = screen.getByText('2033 (Regime Pleno)');
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
    expect(screen.getByText(/Imóveis comerciais não fazem jus ao benefício do Redutor Social/)).toBeInTheDocument();
  });

  it('deve alternar entre Pessoa Física e PJ e adaptar os inputs inteligentemente', () => {
    render(<App />);

    // Em PF, mostra campos de habitualidade
    expect(screen.getByText('Nº de Imóveis Alugados')).toBeInTheDocument();
    expect(screen.getByText('Receita Anual com Aluguéis (R$)')).toBeInTheDocument();

    // Clica em Pessoa Jurídica (Holding)
    const btnPJ = screen.getByRole('button', { name: /Pessoa Jurídica \(Holding\)/i });
    fireEvent.click(btnPJ);

    // Oculta campos de habitualidade e exibe campos da PJ
    expect(screen.queryByText('Nº de Imóveis Alugados')).not.toBeInTheDocument();
    expect(screen.getByText('Regime Tributário PJ')).toBeInTheDocument();
    expect(screen.getByText('Taxa de Administração Imobiliária (%)')).toBeInTheDocument();
    expect(screen.getByText(/Crédito Financeiro sobre Insumos/)).toBeInTheDocument();
  });

  it('deve iniciar zerado e aplicar a máscara brasileira (0.000,00) em tempo real durante o preenchimento', () => {
    render(<App />);

    // Inicia zerado, campo vazio com placeholder 0,00 e calculadora zerada aguardando parâmetros
    expect(screen.getByText(/Calculadora Zerada • Aguardando Parâmetros/)).toBeInTheDocument();
    const rentInputs = screen.getAllByPlaceholderText('0,00');
    const rentInput = rentInputs[0];
    expect(rentInput).toHaveValue('');

    // Simula o foco no input
    fireEvent.focus(rentInput);
    expect(rentInput).toHaveValue('');

    // Digita "5000" -> Durante o preenchimento, já aplica o separador de milhar "5.000"
    fireEvent.change(rentInput, { target: { value: '5000' } });
    expect(rentInput).toHaveValue('5.000'); // Máscara aplicada ao vivo!

    // Digita com centavos "5000,75" -> Durante o preenchimento, já formata "5.000,75"
    fireEvent.change(rentInput, { target: { value: '5000,75' } });
    expect(rentInput).toHaveValue('5.000,75'); // Centavos e milhar ao vivo!

    // Blur mantém ou completa a formatação
    fireEvent.blur(rentInput);
    expect(rentInput).toHaveValue('5.000,75');

    // Com valor consultado, exibe os resultados calculados!
    expect(screen.getByText('IBS + CBS Bruto Devido')).toBeInTheDocument();
  });

  it('deve exibir feedback visual de validação de erro ao inserir valor inválido de aluguel', () => {
    render(<App />);

    const rentInputs = screen.getAllByPlaceholderText('0,00');
    const rentInput = rentInputs[0];
    fireEvent.change(rentInput, { target: { value: '-2000' } });

    // Mensagem de erro de validação
    expect(screen.getByText('O valor do aluguel base não pode ser negativo.')).toBeInTheDocument();
    expect(screen.getByText('Parâmetros Contratuais Incorretos')).toBeInTheDocument();
  });

  it('deve exibir a aba API Cronograma com o endpoint GET /api/cronograma-transicao e dados válidos', () => {
    render(<App />);

    // Clica na aba API Cronograma
    fireEvent.click(screen.getByText('Integração & Cronograma'));

    expect(screen.getByText('/api/cronograma-transicao')).toBeInTheDocument();
    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('VIGENTE_E_VALIDADO')).toBeInTheDocument();
    expect(screen.getByText('2026 – 2033 (8 Fases)')).toBeInTheDocument();
  });

  it('deve gerenciar portfólio iniciando zerado e atualizar ao cadastrar novo ativo', () => {
    render(<App />);

    fireEvent.click(screen.getByText('Gestão de Portfólio'));
    expect(screen.getByText(/AGUARDANDO ATIVOS • CARTEIRA ZERADA/)).toBeInTheDocument();
    expect(screen.getByText('0 ativos')).toBeInTheDocument();

    // Preenche o formulário para adicionar imóvel
    const nameInput = screen.getByPlaceholderText('Ex: Sala Comercial 1201 - Paulista');
    fireEvent.change(nameInput, { target: { value: 'Apto Copacabana' } });

    // Formulário tem inputs de BRL com placeholder 0,00
    const formRentInputs = screen.getAllByPlaceholderText('0,00');
    // Digita aluguel no primeiro input monetário do form
    fireEvent.change(formRentInputs[0], { target: { value: '4000' } });

    // Clica no botão de adicionar
    fireEvent.click(screen.getByRole('button', { name: /Adicionar ao Portfólio/i }));

    // Agora carteira tem 1 ativo
    expect(screen.getByText('1 ativo')).toBeInTheDocument();
    expect(screen.getByText('Apto Copacabana')).toBeInTheDocument();
  });

  it('deve transicionar a aba comparativa do estado zerado para o demonstrativo ao preencher aluguel', () => {
    render(<App />);

    fireEvent.click(screen.getByText('Cenário Comparativo'));
    expect(screen.getByText('Simulação Comparativa Zerada')).toBeInTheDocument();

    const rentInputs = screen.getAllByPlaceholderText('0,00');
    fireEvent.change(rentInputs[0], { target: { value: '6000' } });

    // Deve exibir os cards de comparação
    expect(screen.getByText('Regime Atual Vigente')).toBeInTheDocument();
    expect(screen.getByText(/Novo Regime \(LC 214\/2025\)/)).toBeInTheDocument();
  });
});
