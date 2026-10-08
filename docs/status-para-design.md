# Controle de Imóveis — Holding Aguiar · Status para design (07/10/2026)

## O que é
Sistema web de gestão do patrimônio imobiliário de uma holding familiar: imóveis e unidades, inquilinos,
locadores, fiadores, contratos (com minuta em PDF), receitas, despesas, IPTU, importação de extrato
bancário, dashboards, alertas e relatórios. Inclui um **Simulador IBS/CBS** público (`/simulador`) sobre a
reforma tributária na locação. No ar em **fjin.work**.

## Estágio
- **Em produção e estável.** Rodada completa de QA (06–07/10): 89 achados, todos os críticos/altos/médios
  corrigidos. 757 testes de app + 233 de banco. Zero violações WCAG 2.2 AA nas 140 páginas varridas.
- Performance no celular: tela de login de 10,3 s → 1,8 s; demais telas ~1,7 s.
- Próximos passos de produto (backlog WSJF): entrada só por convite, reajuste anual, receitas previstas
  geradas pelo contrato, conciliação de crédito × receita prevista, IPTU parcelado, perfis prontos
  (sócio / contador / operação), resultado do mês por e-mail.

## Quem usa (personas)
| Persona | Idade | Uso | O que pesa |
| :-- | :-- | :-- | :-- |
| Seu Antônio, sócio-fundador | 84 | Mensal, só leitura (dashboards/relatórios) | Ver o resultado sem esforço, letra grande, pouca coisa na tela |
| Helena, sócia-administradora | 52 | Diário, administradora | Nada esquecido, pouca digitação |
| Marcos, assistente | 41 | Diário, financeiro e extrato | Fila clara, sem retrabalho |
| Dra. Rita, contadora externa | 58 | Mensal, leitura | Mês fechado e exportável |

Público de **40 a 90 anos** → a acessibilidade é requisito central, não detalhe.

## Telas (27)
- **Públicas:** Status do desenvolvimento (`/`, com feed de novidades), Login, Cadastro, Recuperar/Redefinir
  senha, Simulador IBS/CBS.
- **Início:** painel resumo.
- **Extratos:** Importar extrato, Histórico de importações, Classificar transações.
- **Cadastros:** Imóveis (imóvel macro → unidades filhas, lista expansível), Inquilinos, Locadores
  (+ fiadores), Fornecedores, Contratos (com minuta).
- **Financeiro:** Receitas, Despesas, IPTU e taxas.
- **Análise:** Dashboard financeiro, Dashboard de imóveis (ocupação), Alertas, Relatórios (PDF).
- **Gestão:** Quadro de andamento (kanban), Usuários e permissões por módulo, Logs de atividade.

## Sistema visual atual
- **Stack:** React 19 + Tailwind + shadcn/ui (Radix). Tema claro e escuro.
- **Cores:** azul-marinho profundo `hsl(218 64% 11%)` como primária; dourado `hsl(40 53% 55%)` como
  destaque; fundo `hsl(218 30% 98%)`. No escuro, fundo `hsl(218 68% 7%)` e o dourado vira primária.
- **Tipografia:** Inter / SF Pro Display. Escala elevada: piso de **14px** (`text-xs`), corpo ~17px.
  Controle **A− / A / A+** no cabeçalho. O Simulador tem identidade própria (Plus Jakarta Sans + JetBrains Mono).
- **Layout:** menu lateral com rolagem interna, cabeçalho, tabelas financeiras que viram cartões quando
  não cabem; alvos de toque grandes; foco devolvido ao fechar diálogos; confirmação antes de excluir.
- **Larguras testadas:** 320, 375, 768, 1366, 1920.

## Restrições que o design precisa respeitar
- WCAG 2.2 AA (e ABNT NBR 17060): contraste, alvo de toque ≥ 24px (preferível 44px), zoom 200%.
- Não reduzir tamanhos de fonte abaixo da escala atual.
- Mobile é uso real (sócios no celular); tablet não pode estourar largura.
- Componentes devem continuar mapeáveis para shadcn/ui + tokens Tailwind (`src/main.css`, `tailwind.config.ts`).

## Pontos onde design ajudaria mais
1. Dashboards para o sócio de 84 anos: "quanto entrou, quanto saiu, o que está vago" em uma olhada.
2. Fluxo de classificar transações do extrato (fila do Marcos) e a futura conciliação crédito × receita.
3. Hierarquia imóvel → unidades e o cadastro de contrato (garantia, fiador, caução, minuta).
4. Consistência entre o app e o Simulador (hoje com identidades diferentes).
