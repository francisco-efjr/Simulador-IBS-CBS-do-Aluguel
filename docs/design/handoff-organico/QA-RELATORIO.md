# QA Aguia · rodada 1 · 07/10/2026
Escopo: protótipo `Holding Aguiar Organico.dc.html` (5 telas, celular 390 e computador 1280), revisão de capturas e do código. Medição de contraste por cálculo; teste de teclado e leitor de tela não foi feito em navegador real, só inferido do código.

Veredito inicial: **reprovado** (3 altas). Após as correções abaixo: **aprovado com ressalvas** (R1–R3 abertas).

| ID | Sev. | Cat. | Onde | Problema | Critério | Correção aplicada |
|---|---|---|---|---|---|---|
| Q01 | alta | a11y | Contratos, celular | Chips de filtro cortados e com quebra de linha ("Todos · 12" em 2 linhas) | 1.4.10 | `nowrap`, rolagem horizontal sem barra |
| Q02 | alta | UX | Imóveis/Início | Números inconsistentes: 16 unidades no título, 8+3+4+1 nas linhas; "Vence em 24 dias" quebrava em 2 linhas | — | Totais recalculados do mesmo dado (12 unidades, 10 ocupadas, 83%); pílulas `nowrap` |
| Q03 | alta | a11y | Início | Cartão de resultado girado com número grande: leitura pior para 84 anos | UX / 1.4.8 | Rotação removida dos cartões com números; camada de papel deslocada no lugar |
| Q04 | média | a11y | Início, avatar | `div` clicável sem nome e sem teclado | 4.1.2, 2.1.1 | Virou `button` com `aria-label` |
| Q05 | média | a11y | Gaveta e menu | A− / A / A+ eram texto sem função | 4.1.2 | `button` com `aria-pressed` e `aria-label`; alvo 44px; grupo rotulado |
| Q06 | média | a11y | Menu | Item ativo sem `aria-current` | 4.1.2 | `aria-current="page"` |
| Q07 | média | a11y | Todas | Ícones e blobs expostos a leitores | 1.1.1 | `aria-hidden` |
| Q08 | média | a11y | Contratos, computador | Tabela feita de `div` sem papéis | 1.3.1 | `role=table/row/columnheader/cell`, coluna "Ações" oculta visualmente |
| Q09 | média | a11y | Contratos | Botões "Minuta" iguais, sem contexto | 2.4.6, 4.1.2 | `aria-label` com código do contrato |
| Q10 | média | a11y | Todas | Legendas `#6B6B5F` em 14px (5.2:1 passa, mas fica no limite para o público) | 1.4.3 | Legendas passam a `#4A4A40` (9:1) |
| Q11 | média | UX | Simulador | `type=number` não aceita vírgula pt-BR e confunde idoso | — | Texto com `inputmode=decimal`; aceita "3.500" e "26,5" |
| Q12 | média | a11y | Simulador | Resultado muda sem aviso a leitor de tela | 4.1.3 | `aria-live="polite"` |
| Q13 | média | resp | Simulador, computador | "Pessoa física" quebrava em 2 linhas | 1.4.10 | Coluna maior, `nowrap`, 15px |
| Q14 | média | a11y | Login | Sem `autocomplete`; olho de senha sem estado | 1.3.5, 4.1.2 | `autocomplete`, botão alterna senha com `aria-pressed` |
| Q15 | média | resp | Gaveta | Menu cortava itens em tela baixa e escondia o rodapé | 1.4.10 | Lista rola por dentro; crédito Aguia fixo no fim |
| Q16 | baixa | UX | Menu | Faltavam 5 das 27 telas (Histórico, Fornecedores, Dashboards separados, Logs) | — | Menu completo com todos os módulos |
| Q17 | baixa | UX | Início | "Resultado do mês" vs "setembro" ambíguo; faltava dizer como se chega ao valor | — | Rótulo "Resultado de setembro" + "Receitas menos despesas" |
| Q18 | baixa | UX | Imóveis | Casa sem receita mostrava "—" | — | "Sem receita" / "Vaga" |

## Ressalvas abertas (validar no sistema real)
- R1. Teclado, foco preso na gaveta e leitor de tela precisam ser testados no código real (protótipo só simula a gaveta).
- R2. Contraste em A+ (200%) e com a granulação ativa: medir com axe.
- R3. Gráficos e telas fora das 5 de referência (kanban, classificar transações) ainda não desenhadas; regras no README.

## Bom
Hierarquia clara no Início (resultado primeiro), alvos de 44–56px, cartões viram lista no celular, foco visível em anel duplo, pílulas com texto e cor, blobs fracos atrás de dados.

---
# QA Aguia · rodada 2 · 07/10/2026 — letras, números e quebras de linha
Método: em cada tela (celular 390 e computador 1280) simulei letra 100%, 118% (A+) e 150% (zoom grande) e medi, em todo texto curto, número, valor, código e pílula, se havia mais de uma linha ou corte.

Antes: quebras indevidas já a 100%, e mais a 118%.

| ID | Sev. | Problema | Correção |
|---|---|---|---|
| Q19 | alta | "R$ 48.320" (60px) quebrava em 2 linhas no computador; "R$ 5.050", "R$ 61.950", "R$ 48.320" quebravam a 118% | Todo número e valor com `white-space:nowrap`; destaques com fonte fluida `clamp(min, cqw, max)` dentro de cartão com `container-type:inline-size` |
| Q20 | alta | Cartões do Início espremidos: 3 colunas fixas e 2 colunas fixas no celular | Grades `repeat(auto-fit,minmax(min(100%,Npx),1fr))`: reorganizam em vez de espremer. Resultado do mês ocupa a linha inteira |
| Q21 | média | "Receitas R$ 61.950 menos despesas R$ 13.630" quebrava no meio do valor | Dividido em duas linhas, uma por valor |
| Q22 | média | Título "4 imóveis, 12 unidades" (32px) quebrava | Título "4 imóveis"; detalhe em linha abaixo |
| Q23 | média | Códigos de contrato (CT-2024-031), valores de aluguel e de recebimento quebravam | `nowrap` |
| Q24 | média | "Pede atenção" e "Próximos recebimentos" lado a lado espremiam nomes a 118% | Grade auto-fit com mínimo 400px: empilha quando não cabe |

Resultado: **0 quebras indevidas a 100% e 118%**. A 150% restam só frases descritivas ("Transportes Ribeiro · 31/10", "Vigência até") que quebram por palavra, o que é aceitável. Nenhum número, valor, código ou pílula é cortado em nenhum tamanho.

## Regras para o código real (valem para todas as telas)
1. Número, moeda, data, código e pílula: `whitespace-nowrap`. Nunca quebrar no meio.
2. Número de destaque: `text-[clamp(...cqw...)]` com `@container` no cartão pai.
3. Grades: `grid-cols-[repeat(auto-fit,minmax(min(100%,Npx),1fr))]` em vez de colunas fixas; tabela vira cartão antes de espremer.
4. Texto descritivo e nomes podem quebrar por palavra; títulos usam `text-wrap: balance`.
5. A−/A/A+ (0,9 / 1 / 1,18) e zoom 200% não podem gerar rolagem horizontal nem corte. Testar 320, 375, 390, 768, 1024, 1366, 1920 em cada tela, com A+ ligado.
6. No teste automatizado: para cada elemento com número/valor, altura ≤ 1 linha e `scrollWidth ≤ clientWidth`.

---
# QA Aguia · rodada 3 · 07/10/2026 — Front-End Design Checklist
Referência: github.com/thedaviddias/Front-End-Design-Checklist. Cada item do checklist foi conferido no protótipo e no handoff.

| Item do checklist | Antes | Agora |
|---|---|---|
| 1.1 Grade explícita | Só no README (laterais, gaps, breakpoints) | Mantido. Grades auto-fit/minmax documentadas; sem grade fixa de 12 colunas, de propósito |
| 1.2 Cores com nome | Tabela no README | Seção **06** mostra as 12 cores com nome, hex, uso e contraste |
| 1.2 Estados de cor (botão, link, campo) | Só normal e hover | Seção **06**: 4 variantes de botão × 6 estados; 6 estados de campo; 5 de link |
| 1.2 Cores acessíveis | Aprovado | Aprovado; foco corrigido (ver Q25) |
| 1.3 Fontes e reservas | Reserva só "Georgia"/"system-ui" | Pilhas completas na seção 06; WOFF2, subset latino, meta < 300 KB |
| 1.3 Texto real | Sim, pt-BR | Sim |
| 1.4 Links: normal, mouse, foco, ativo, visitado | Faltavam foco, ativo e visitado | Definidos (Q26) |
| 1.5 Favicon 512px PNG | Ausente | **Pendente**: depende do logo final. Proposta: blob musgo com broto, mesmo do menu |
| 1.5 Ícones SVG nomeados `icon-` | Lucide, já `icon-*` | Aprovado |
| 1.6 Formulário com título/legenda | Simulador sem `fieldset` | "Quem aluga" virou `fieldset` + `legend`; cartões com `role=form` e nome |
| 1.6 Estados de campo (foco, desativado) | Só normal | Normal, foco, preenchido, erro, desativado, opcional |
| 1.6 Mensagens de erro | Nenhuma | Catálogo de 10 mensagens + login com erro (seção **07**) |
| 1.6 Obrigatório / opcional | Sem indicação | Regra: sem marcação = obrigatório; "(opcional)" no rótulo; `required` no login |
| 1.6 Primário vs secundário | Aprovado | Aprovado, com uso escrito por variante |
| 1.6 Estados de botão (incl. desativado) | Sem desativado | Incluído; desativado sempre com texto explicando o que falta |
| 1.6 Botão carregando | Ausente | "Aguarde…/Entrando…" com ícone girando e `aria-busy` |
| 1.7 Mobile antes do computador | Sim | Sim |
| 1.7 Tablet | Ausente | Seção **09**: Início a 768px |
| 1.8 Guia de estilo / componentes | README | README + seção 06 viva no protótipo |
| 1.9 Página 404 e 500 | Ausente | Seção **08**: celular e computador |
| 1.9 Popups e alertas | Ausente | Seção **07**: confirmação de exclusão (celular e computador) e 3 avisos |
| 2.1 Títulos e H1 | H1 fora do logo, ordem correta | Aprovado |
| 2.1 Elementos em CSS, não imagem | Sim | Sim |

## Achados novos
| ID | Sev. | Problema | Correção |
|---|---|---|---|
| Q25 | alta | Anel de foco em musgo 55% dava 2,2:1 (WCAG 1.4.11 pede 3:1) e **sumia** nos botões que têm `box-shadow` inline (o estilo do botão sobrescrevia o anel) | Foco agora é `outline: 3px solid #5D7052; outline-offset: 3px` (5,2:1), independente da sombra. Vale para link, botão e campo |
| Q26 | média | Links sem estado de foco (regra só cobria `input` e `button`), ativo e visitado | `:focus-visible` global; ativo #3F5236; visitado #7A4F2B só em links de conteúdo |
| Q27 | média | Placeholder com cor do navegador (cinza claro, abaixo de 4,5:1) | `::placeholder` #6B6B5F, opacidade 1 |
| Q28 | média | "Quem aluga" sem agrupamento semântico | `fieldset` + `legend` |
| Q29 | média | Avisos que somem sozinhos tiram tempo de quem lê devagar (2.2.1) | Avisos ficam até a pessoa fechar ou trocar de tela |
| Q30 | baixa | Exclusão com foco inicial no botão perigoso | Foco inicial em "Cancelar"; botão diz "Sim, excluir" |
| Q31 | baixa | `prefers-reduced-motion` não cobria animações | Regra global zera animação e transição |

## Pendências
- Favicon 512px: aguardando logo final da holding.
- R1–R3 da rodada 1 continuam abertas.

## Fase 2 · regra nova
- Q32 (média): seletor nativo não quebra linha e cortava "Holding Aguiar Participações Ltda" a 390px. Regra: opção de select com no máximo ~24 caracteres; nome jurídico completo e documento vão no texto de ajuda abaixo do campo. Listas com nomes longos (inquilinos, fornecedores) usam seletor em painel (Sheet/Combobox), não select nativo.
