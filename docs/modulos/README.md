# Wiki de Engenharia & Módulos do Sistema — Águia Systems

![](https://img.shields.io/badge/marca-Águia%20Systems-green?logo=azuredevops&logoColor=white)
![](https://img.shields.io/badge/domínio-aguiasystems.com.br-blue?logo=googlechrome&logoColor=white)
![](https://img.shields.io/badge/inpi-classe%2042-purple)

[[_TOC_]]

## Visão Geral

Este repositório documental reúne as especificações técnicas, arquiteturais e de negócio dos módulos da **Águia Systems** (plataforma de gestão imobiliária, governança patrimonial e simulador tributário).

O sistema opera sob o modelo de **árvore hierárquica** (Imóvel Macro → Unidades Habitacionais/Comerciais → Contrato de Locação), suportando perfis gratuitos (com limite de até 3 imóveis cadastrados) e governança completa das partes contratuais.

A documentação adota um padrão padronizado com foco em:
1. **Fidelidade ao Código:** Especificações derivadas diretamente das implementações em `src/`, `supabase/migrations/` e diretrizes estratégicas acordadas.
2. **Engenharia de Confiabilidade:** Mapeamento explícito de fluxos atuais vs propostos (V1 x V2), pontos de falha, cenários de concorrência e integridade transacional.
3. **Padrão de Ciclo de Vida & Rastreabilidade:** Modelagem de estados, transições, regras de negócio e políticas de segurança RLS (Row Level Security).

---

## Índice dos Módulos

| Módulo | Documento | Finalidade Principal | Situação |
| :--- | :--- | :--- | :---: |
| **01. Login / Autenticação** | [01-login-autenticacao.md](01-login-autenticacao.md) | Gestão de credenciais, sessões, convites de 7 dias e RBAC fail-closed no Postgres. | ✅ Em Produção |
| **02. Início** | [02-inicio.md](02-inicio.md) | Hub operacional, cartões de indicadores com debounce realtime e feed de auditoria. | ✅ Em Produção |
| **03. Inquilinos** | [03-inquilinos.md](03-inquilinos.md) | Cadastro PF/PJ (CNPJ alfanumérico), RG opcional (CIN), endereço de contato secundário e validação de e-mail. | ✅ Alinhado |
| **04. Imóveis** | [04-imoveis.md](04-imoveis.md) | Inventário macro, limite gratuito (3 imóveis), CIB, matrícula, múltiplos cadastros de IPTU e valor do imóvel. | ✅ Alinhado |
| **05. Unidades** | [05-unidades.md](05-unidades.md) | Estrutura hierárquica multiunidade (salas, apartamentos), códigos de energia/água, condomínio e taxas extras (poço). | 🚀 V2 Alinhada |
| **06. Pessoas (Locador, Fiador, Inquilino)** | [06-pessoas.md](06-pessoas.md) | Menu lateral dedicado de Locadores, cadastro de Fiadores, qualificação de Testemunhas e relação contratual. | 🚀 V2 Alinhada |
| **07. Contratos** | [07-contratos.md](07-contratos.md) | Numeração sequencial `número/ano` (001/2026), 6 minutas padrão, lista expansível e geração de PDF com e-mails. | 🚀 V2 Alinhada |

---

## Convenções Adotadas

Cada documento segue estritamente a anatomia padronizada:
- **Badge e Sumário Automático (`[[_TOC_]]`)**
- **Objetivo** e **Contexto Operacional/Tecnológico**
- **Fluxo Atual** com diagramas e **O Problema** (tabela de cenários, comportamentos esperados vs reais)
- **Fluxo Proposto (V2)** com arquitetura alvo e diagramas de sequência/estados
- **Rastreabilidade, Ciclo de Vida e Regras de Negócio** com tabelas de transição e tratamento de exceções
- **Comparativo Técnico V1 x V2**
- **Importante (Impacto, Migração e Segurança)**
