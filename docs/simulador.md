# Simulador Tributário: IBS e CBS na Locação de Imóveis 🏢📊

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-green.svg)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Motor de cálculo e plataforma analítica para auditoria fiscal e simulação dos impactos da Reforma Tributária sobre o mercado imobiliário brasileiro de locação**, rigorosamente em conformidade com a **Emenda Constitucional nº 132/2023** e a **Lei Complementar nº 214/2025** (regulamentação do IBS e da CBS).

---

## 📑 Sumário

- [Visão Geral](#-visão-geral)
- [Fundamentação Legal e Regras de Negócio](#-fundamentação-legal-e-regras-de-negócio)
  - [1. Enquadramento e Habitualidade (Locador PF)](#1-enquadramento-e-habitualidade-locador-pf)
  - [2. Exclusão Expressa de Encargos Acessórios](#2-exclusão-expressa-de-encargos-acessórios)
  - [3. Redutor Social Residencial](#3-redutor-social-residencial)
  - [4. Cronograma Constitucional de Transição (2026–2033)](#4-cronograma-constitucional-de-transição-20262033)
  - [5. Créditos Operacionais e Cadeia B2B](#5-créditos-operacionais-e-cadeia-b2b)
  - [6. Comparativo Pré vs. Pós-Reforma (Carnê-Leão e Lucro Presumido)](#6-comparativo-pré-vs-pós-reforma)
- [Arquitetura do Software](#-arquitetura-do-software)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Integrada do Cronograma](#-api-integrada-do-cronograma)
- [Como Instalar e Executar](#-como-instalar-e-executar)
- [Suíte de Testes Automatizados](#-suíte-de-testes-automatizados)
- [Área Reservada (Modo Profissional)](#-área-reservada-modo-profissional)
- [Licença e Autoria](#-licença-e-autoria)

---

## 🎯 Visão Geral

A Reforma Tributária sobre o Consumo institui o **IBS** (Imposto sobre Bens e Serviços) e a **CBS** (Contribuição sobre Bens e Serviços) no modelo de IVA Dual, trazendo impactos profundos na tributação da locação imobiliária.

O **Simulador-IBS-CBS-do-Aluguel** foi concebido com foco em:

1. **Rigor e Precisão Contábil**: Aritmética decimal em centavos com arredondamento estrito, sem acúmulo de erros de ponto flutuante.
2. **Separação de Domínio (Clean Architecture)**: Regras fiscais e motores de cálculo 100% isolados de qualquer biblioteca de interface gráfica.
3. **Auditoria Fiscal Transparente**: Toda simulação produz um laudo técnico detalhando memória de cálculo, base legal e notas de conformidade.
4. **Acessibilidade Assistida**: Interface pública enxuta para o locador — tipografia ampliada, alvos generosos e rótulos ligados aos campos — com os módulos técnicos recolhidos numa [área reservada](#-área-reservada-modo-profissional) para o profissional que o acompanha.

---

## ⚖️ Fundamentação Legal e Regras de Negócio

### 1. Enquadramento e Habitualidade (Locador PF)

Conforme as diretrizes da **LC 214/2025**, a Pessoa Física que aluga imóveis só se torna contribuinte do IBS/CBS se cumprir **cumulativamente** dois requisitos objetivos:

- Possuir **mais de 3 imóveis alugados**; **E**
- Auferir receita bruta anual de aluguel **superior a R$ 240.000,00**.

> Se qualquer uma das condições não for atingida, o locador PF é classificado como **Não Contribuinte**, ficando com **alíquota ZERO** de IBS/CBS.

Pessoas Jurídicas (Holdings Imobiliárias, administradoras e empresas em geral) são **sempre contribuintes** sob o regime especial de bens imóveis.

### 2. Exclusão Expressa de Encargos Acessórios

Nos termos dos **Arts. 255 e 260 da LC 214/2025**, as despesas acessórias pagas pelo inquilino (como **Taxa Condominial** e **IPTU**) não integram a receita do locador:
$$\text{Base de Cálculo Bruta} = \text{Recibo Total} - (\text{Condomínio} + \text{IPTU}) = \text{Aluguel Base}$$

### 3. Redutor Social Residencial

Para preservar o acesso à moradia e a progressividade da tributação sobre locação residencial (Art. 260, § 1º), aplica-se uma dedução legal de:
$$\text{Redutor Social} = \min(\text{Aluguel Base}, \text{R\$\ } 600{,}00)$$
$$\text{Base de Cálculo Líquida (Residencial)} = \max(0, \text{Aluguel Base} - 600{,}00)$$

_Nota: Em imóveis comerciais, o redutor social não se aplica._

### 4. Cronograma Constitucional de Transição (2026–2033)

A transição parte da alíquota padrão estimada em **26,50%** (8,80% CBS + 17,70% IBS), com **redução de 70%** para operações com bens imóveis (alíquota efetiva plena de **7,95%** em 2033):

|   Ano    | Fase                        | CBS Nominal | IBS Nominal | Fator Transição | CBS Efetiva | IBS Efetiva | Total Efetivo |
| :------: | :-------------------------- | :---------: | :---------: | :-------------: | :---------: | :---------: | :-----------: |
| **2026** | Teste Nacional              |    0,90%    |    0,10%    |  Teste (1,00%)  |    0,27%    |    0,03%    |   **0,30%**   |
| **2027** | CBS Plena / Fim PIS/COFINS  |    8,80%    |    0,00%    |    CBS 100%     |    2,64%    |    0,00%    |   **2,64%**   |
| **2028** | CBS Plena                   |    8,80%    |    0,00%    |    CBS 100%     |    2,64%    |    0,00%    |   **2,64%**   |
| **2029** | Início Transição IBS        |    8,80%    |    1,77%    |     10% IBS     |    2,64%    |    0,53%    |   **3,17%**   |
| **2030** | Transição Gradual           |    8,80%    |    3,54%    |     20% IBS     |    2,64%    |    1,06%    |   **3,70%**   |
| **2031** | Transição Gradual           |    8,80%    |    5,31%    |     30% IBS     |    2,64%    |    1,59%    |   **4,23%**   |
| **2032** | Transição Gradual           |    8,80%    |    7,08%    |     40% IBS     |    2,64%    |    2,12%    |   **4,76%**   |
| **2033** | **Regime Definitivo Pleno** |  **8,80%**  | **17,70%**  |  **100% IBS**   |  **2,64%**  |  **5,31%**  |   **7,95%**   |

### 5. Créditos Operacionais e Cadeia B2B

- **Locador PJ**: Permite creditamento integral da alíquota padrão sobre a taxa de administração imobiliária paga a terceiros (insumo direto de intermediação).
- **Inquilino PJ (B2B)**: Empresas no regime não-cumulativo (Lucro Real) podem apropriar créditos de IBS/CBS sobre o aluguel comercial pago a locadores contribuintes, reduzindo o custo econômico final da locação.

### 6. Comparativo Pré vs. Pós-Reforma

A ferramenta calcula o comparativo tributário completo:

- **Pessoa Física**: Apuração do **Carnê-Leão (IRPF)** pela tabela progressiva mensal do ano-calendário simulado, deduzindo comissão de imobiliária, condomínio e IPTU suportados pelo locador e o próprio IBS/CBS recolhido, versus o novo IBS/CBS.
- **Pessoa Jurídica**: Carga de PIS/COFINS (regime cumulativo a 3,65% no Lucro Presumido) versus IBS/CBS líquido de créditos operacionais.

> ⚠️ **As faixas do IRPF mudam por lei todo ano.** Elas vivem isoladas em [`src/core/domain/irpfTable.ts`](../src/simulador/core/domain/irpfTable.ts), versionadas por ano-calendário — nenhum outro arquivo do sistema contém alíquota de IRPF. Confira os valores contra a tabela oficial da Receita Federal antes de publicar cada exercício. O redutor de isenção ampliada de 2026 é modelado como decaimento linear entre o teto de isenção e o teto do redutor; se a norma regulamentar fixar outra curva, ajuste `exemptionRelief` nesse arquivo.

---

## 🏛 Arquitetura do Software

O projeto segue princípios rigorosos de **Clean Architecture** e **Domain-Driven Design (DDD)**:

```
src/
├── core/                        # 🧠 Núcleo de Domínio (Pure TypeScript, Zero UI Deps)
│   ├── domain/
│   │   ├── constants.ts         # Parâmetros oficiais, limites de habitualidade e alíquotas
│   │   ├── irpfTable.ts         # Tabelas progressivas do IRPF versionadas por ano-calendário
│   │   ├── types.ts             # Modelos de dados e contratos de tipos estritos
│   │   ├── FinancialMath.ts     # Aritmética decimal segura (evita float drift)
│   │   └── ValidationEngine.ts  # Validações semânticas de entrada
│   ├── services/
│   │   ├── EnquadramentoEngine.ts   # Classificação de habitualidade e status tributário
│   │   ├── TransitionCalendar.ts    # Matriz temporal de alíquotas (2026-2033)
│   │   ├── TaxCalculatorEngine.ts   # Motor principal de cálculo do contrato
│   │   ├── ComparativeEngine.ts     # Análise comparativa (Carnê-Leão vs IBS/CBS)
│   │   ├── PortfolioEngine.ts       # Agregação e consolidação de carteiras
│   │   └── AuditTrailEngine.ts      # Geração de laudos e conformidade fiscal
│   └── index.ts                 # Exportação pública da camada de domínio
│
├── ui/                          # 💻 Camada de Apresentação (React 19 + Tailwind)
│   ├── App.tsx                  # Shell da aplicação e navegação de abas
│   └── components/
│       ├── SingleSimulationTab.tsx      # Simulação detalhada de contrato individual
│       ├── ComparativeAnalysisTab.tsx   # Dashboard comparativo Pré x Pós
│       ├── PortfolioSimulationTab.tsx   # Análise consolidada de múltiplos imóveis
│       ├── TransitionApiExplorer.tsx    # Explorador visual do cronograma e API
│       ├── AuditReportView.tsx          # Exibição do parecer de auditoria
│       ├── LegalReferencesModal.tsx     # Modal com o texto legal da LC 214/2025
│       ├── TaxParametersCard.tsx        # Ajuste dinâmico de premissas tributárias (reservado)
│       ├── TransitionYearSelector.tsx   # Seletor interativo da régua temporal
│       ├── SegmentedControl.tsx         # Escolha acessível entre opções exclusivas
│       ├── ProfessionalModeBar.tsx      # Faixa indicativa da área reservada
│       ├── BRLInput.tsx                 # Campo monetário rotulado com máscara em BRL
│       └── Navbar.tsx                   # Cabeçalho e alternância de tema
│
└── __tests__/                   # 🧪 Suíte de Testes Automatizados (Vitest)
    ├── taxEngine.test.ts        # Testes de unidade das regras tributárias
    ├── irpfTable.test.ts        # Testes das tabelas de IRPF e do redutor de isenção
    ├── exceptionFlows.test.ts   # Testes de fluxos de exceção e limites
    ├── webInteraction.test.tsx  # Testes de integração de componentes de tela
    └── setup.ts                 # Configuração do ambiente de testes (JSDOM)
```

---

## 🌐 API Integrada do Cronograma

O servidor de desenvolvimento Vite conta com um **middleware mock API nativo**, acessível localmente para testes e integrações:

- **Endpoint**: `GET /api/cronograma-transicao.json`
- Em desenvolvimento um middleware do Vite responde a essa rota (e aos apelidos `/api/cronograma-transicao` e `/api/transition-schedule`). No build de produção o mesmo payload é emitido como arquivo estático em `dist/api/`, de modo que o endereço funciona sem função serverless.
- **Exemplo de Resposta**:

```json
{
  "metadata": {
    "title": "Cronograma Oficial de Transição IBS e CBS (2026-2033)",
    "legalBasis": "Constituição Federal (EC 132/2023) e LC 214/2025",
    "realEstateReductionPercent": 70,
    "status": "VIGENTE_E_VALIDADO"
  },
  "years": [
    {
      "year": 2026,
      "phaseName": "Ano-Teste Nacional",
      "nominalTotalRate": 1.0,
      "effectiveTotalRate": 0.3,
      "isTestPhase": true,
      "description": "Alíquota-teste de 0,9% CBS + 0,1% IBS compensável com PIS/COFINS."
    },
    {
      "year": 2033,
      "phaseName": "Regime Definitivo Pleno",
      "nominalTotalRate": 26.5,
      "effectiveTotalRate": 7.95,
      "isTestPhase": false,
      "description": "Extinção definitiva de PIS, COFINS, ICMS e ISS."
    }
  ]
}
```

---

## 🚀 Como Instalar e Executar

### Pré-requisitos

- **Node.js**: versão 18.0.0 ou superior (recomendado 20 LTS ou 22)
- **npm** (ou yarn / pnpm)

### Passo a passo

1. **Clone o repositório**:

   ```bash
   git clone https://github.com/francisco-efjr/Simulador-IBS-CBS-do-Aluguel.git
   cd Simulador-IBS-CBS-do-Aluguel
   ```

2. **Instale as dependências**:

   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:

   ```bash
   npm run dev
   ```

   Acesse no navegador: `http://localhost:5173`

4. **Verificação de tipos estáticos**:

   ```bash
   npm run typecheck
   ```

5. **Gere a compilação otimizada para produção**:

   ```bash
   npm run build
   ```

6. **Visualize o build de produção localmente**:
   ```bash
   npm run preview
   ```

---

## 🧪 Suíte de Testes Automatizados

Os testes cobrem tanto a lógica contábil/fiscal pura quanto as interações do usuário na interface:

```bash
# Executar toda a suíte de testes (62 testes distribuídos em 4 arquivos)
npm test

# Executar testes em modo interativo (watch)
npm run test:watch
```

### Principais Casos Testados:

- Enquadramento e habitualidade com limites objetivos (>3 imóveis e >R$ 240k).
- Expurgo contábil de encargos acessórios (IPTU e taxa de condomínio).
- Abatimento obrigatório do redutor social residencial de R$ 600,00.
- Aplicação das alíquotas efetivas para cada ano da transição (2026 a 2033).
- Consistência em centavos: `TotalTaxDue === CBS + IBS`.
- Apropriação de créditos de taxa de administração imobiliária.
- Auditoria tributária e comparativo com Carnê-Leão.
- Agregação consolidada de portfólio imobiliário misto.
- Seleção da tabela de IRPF por ano-calendário, progressividade e redutor de isenção ampliada.
- Separação entre a interface pública e a área reservada (Modo Profissional).

---

## 🔐 Área Reservada (Modo Profissional)

A interface pública é dimensionada para o **locador**, frequentemente idoso e sempre acompanhado por um profissional: poucos campos, tipografia grande, alvos de toque de 48–52 px, rótulos ligados aos campos e nenhum texto explicando o óbvio.

Ela **não pede escolha de ano-calendário**: apura sempre pelo ano corrente da transição (`TransitionCalendar.getCurrentTransitionYear()`, limitado à janela 2026–2033) e estampa o exercício junto do valor — _"Imposto por mês em 2026"_. Escolher exercício é decisão de planejamento, não pergunta a se fazer a quem só quer saber quanto paga agora.

Os módulos técnicos ficam fora dessa visão e só aparecem no **Modo Profissional**:

| Módulo                      | Conteúdo                                                                        |
| :-------------------------- | :------------------------------------------------------------------------------ |
| Ano da apuração             | Régua 2026–2033 e alíquota efetiva do exercício                                 |
| Premissas Econômico-Fiscais | Alíquota de referência, share CBS/IBS, redutor social, limites de habitualidade |
| Parecer de Auditoria        | Laudo de conformidade e memória de cálculo                                      |
| Dossiê Jurídico             | Texto e artigos da LC 214/2025                                                  |
| Integração & Cronograma     | Endpoint, payload JSON e exemplo de `curl`                                      |

**Como destravar:** acesse `https://SEU-DOMINIO/?pro=1` uma vez. O navegador guarda a preferência e o parâmetro é removido da barra de endereços, para que um link compartilhado por engano não leve o acesso junto. Uma faixa no topo indica a sessão privilegiada, com botão **Sair**; `?pro=0` também revoga.

> Isto é **separação de audiência, não controle de segurança**: o código dos módulos vai no mesmo pacote JavaScript. Nada aqui deve receber segredo — o objetivo é que o locador não veja controles que não sabe operar.

---

## 📄 Licença e Autoria

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](../LICENSE) para obter mais informações.

Desenvolvido por **Francisco E. F. Jr.** com foco no fortalecimento do compliance fiscal e na transparência do mercado imobiliário brasileiro.
