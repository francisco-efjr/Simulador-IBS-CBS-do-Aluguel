# Handoff: Controle de Imóveis — Holding Aguiar · Redesign "Orgânico / Natural"

## Visão geral
Redesign completo do sistema (27 telas, em produção em fjin.work) do visual atual (azul-marinho + dourado, Inter) para o estilo **Orgânico / Natural**: papel de arroz, musgo, argila, granulação, formas de blob, cantos assimétricos, leves rotações. O público tem de 40 a 90 anos e a maioria usa **celular**. Acessibilidade (WCAG 2.2 AA + ABNT NBR 17060) continua obrigatória.

Decisões do cliente:
- Intensidade **completa**: blobs, rotações e assimetria em todas as telas. Exceção: **tabelas, formulários e números nunca giram** (legibilidade).
- Navegação no celular: **menu lateral em gaveta** (hambúrguer), sem barra inferior.
- Simulador IBS/CBS **migra** para o estilo orgânico (sai Plus Jakarta Sans + JetBrains Mono).
- Aplicação **em fases** (ver "Plano em fases").
- Tema escuro: tokens prontos em `tokens/main.css` (`.dark`), implementação na fase 5.
- "Pode mudar tudo" — layout, copy e componentes podem ser refeitos, mantendo funcionalidade e testes.

## Sobre os arquivos
`Holding Aguiar Organico.dc.html` é uma **referência de design em HTML** (abrir no navegador; precisa de `support.js` ao lado). Não é código de produção. A tarefa é **recriar o visual no código existente** (React 19 + Tailwind + shadcn/ui/Radix), com os padrões do repositório. Os estilos estão inline no HTML só por conveniência do protótipo; em produção tudo vira token Tailwind + variantes de componente.

`tokens/main.css` e `tokens/tailwind.config.ts` **são** para usar direto: substituem/mesclam `src/main.css` e `tailwind.config.ts`.

## Fidelidade
**Alta fidelidade** para cores, tipografia, raios, sombras, espaçamentos e comportamento das 5 telas de referência. As outras 22 telas seguem os mesmos padrões (ver "Mapa de telas").

---

## Design tokens

### Cores (claro)
| Token | Hex | Uso |
|---|---|---|
| background | #FDFCF8 | fundo da página |
| foreground | #2C2C24 | texto principal (14.5:1) |
| card | #FEFEFA | cartões |
| primary | #5D7052 | musgo — botões, item ativo, destaques (5.2:1) |
| primary-foreground | #F3F4F1 | texto sobre musgo (4.6:1) |
| secondary | #C18C5D | argila — **só decoração** (blobs, sombras). Branco sobre ela dá 2.9:1 e reprova |
| secondary-ink | #8F6139 | argila escura — texto e borda do botão outline (4.5:1) |
| accent | #E6DCCD | areia — avatar, pílulas neutras |
| accent-foreground | #4A4A40 | casca — texto secundário (9:1) |
| muted | #F0EBE5 | pedra — cabeçalho de tabela, blocos informativos |
| muted-foreground | #6B6B5F | rótulos de seção (5.2:1). **Não usar #78786C do guia original** (4.3:1) |
| sunken | #F6F2EC | menu lateral, unidades dentro de imóvel |
| border | #DED8CF | madeira crua; em cartões usar 60% de opacidade |
| destructive | #A85448 | siena (5.0:1) |
| success-ink | #3F5236 | texto de pílula Ocupada/Vigente, sobre musgo 14% |
| warning-ink | #7A4F2B | texto de pílula Vaga/Vencendo, sobre argila 20% |

Regra: texto secundário usa `accent-foreground` (#4A4A40). `muted-foreground` só para rótulos curtos em caixa alta.

### Tipografia
- Títulos: **Fraunces** 700 (500–800 disponíveis), tracking −0.01em, `text-wrap: balance`.
- Corpo e interface: **Nunito** 400/600/700/800.
- Base **17px** (`html { font-size: 106.25% }`), multiplicada por `--font-scale` do controle A− / A / A+ (manter: 0.9 / 1 / 1.18).
- Piso **14px** (`text-xs`). Nada menor, nem em legenda.

| Uso | Celular | Computador |
|---|---|---|
| H1 página | 32px Fraunces 700 | 44px |
| H1 hero (login/simulador) | 34px | 56–60px |
| H2 seção | 24px | 26px |
| Número de destaque | 44px Fraunces 700 | 60px |
| Número de cartão | 32px | 36px |
| Corpo | 17px | 17px |
| Secundário | 15–16px | 16px |
| Rótulo de seção (caixa alta, 800, tracking .08em) | 14px | 14px |
| Pílula | 14px 800 | 14px 800 |

### Raios
- Pílula: `rounded-full` (botões, inputs, chips, itens de menu, cabeçalho flutuante mobile).
- Cartão: 32px base com **um canto de 64px**, ciclando por índice: `organic-tr`, `organic-tl`, `organic-br`, `organic-bl`.
- Cartão de destaque (resultado do mês): `2rem 5rem 2rem 2rem`.
- Blocos internos (unidades, resumo dentro de cartão): 18–20px.
- Ícone/avatar/logo: blobs `blob-1`…`blob-4`.
- Moldura do celular nas referências (44px) é só apresentação.

### Sombras
- `soft` 0 4px 20px -2px rgba(93,112,82,.15) — cartões, botão primário.
- `float` 0 10px 40px -10px rgba(193,140,93,.3) — formulário do simulador, gaveta.
- `lift` 0 20px 40px -10px rgba(93,112,82,.2) — hover de cartão.
- `hero` 0 18px 40px -14px rgba(93,112,82,.55) — cartão musgo de destaque.
Nunca sombra preta.

### Espaçamento
Escala Tailwind padrão. Página: 16px laterais no celular, 48px no computador. Gap entre cartões 12px (celular) / 16–24px (computador). Seções 24–32px.

### Textura e blobs
- Granulação global: `body::after` em `main.css` (4%, multiply). Obrigatória.
- Blobs ambientes: `div` absoluto, `aria-hidden`, `pointer-events:none`, `filter: blur(48–80px)`, opacidade 0.12–0.22 (musgo) ou 0.14–0.20 (argila); 1 por tela interna, 2 em login/simulador. Container pai com `overflow-hidden`. Nunca atrás de tabela com opacidade acima de 0.14.

---

## Componentes (mapeamento shadcn/ui)

Crie/ajuste em `src/components/ui` mantendo a API do shadcn:

1. **Button** (`cva`)
   - `default`: bg-primary text-primary-foreground shadow-soft, `rounded-full`, h-12 (sm h-11, lg h-14), px-7, font-extrabold. Hover `scale-105` + sombra maior; active `scale-95`; `transition-all duration-300`.
   - `outline`: border-2 border-secondary-ink text-secondary-ink; hover bg-secondary-ink text-white.
   - `ghost`: text-primary; hover bg-primary/10.
   - `destructive`: bg-destructive text-white.
   - `icon`: 48×48 redondo (mínimo 44).
2. **Input / Select trigger / Textarea**: `rounded-full` (textarea `rounded-3xl`), h-14 no celular e h-13/14 no computador, border-[1.5px] border-input, bg-white/60, px-6, text-base. Foco: anel duplo (ver `:focus-visible`). Label sempre visível acima, 16px 700.
3. **Card**: bg-card border border-border/60 shadow-soft `rounded-organic-*` (prop `corner` ou cálculo por índice); hover `-translate-y-1 shadow-lift`; cartões clicáveis (alertas, explicações) também `rotate-[.5deg]` no hover.
4. **HighlightCard** (novo): bg-primary text-primary-foreground shadow-hero, `rotate-organic`, blob de argila desfocado no canto inferior direito.
5. **Badge / StatusPill**: `rounded-full` 14px 800 px-3 py-1.5. Variantes: `ok` (bg-primary/14 text-success-ink), `warn` (bg-secondary/20 text-warning-ink), `neutral` (bg-accent text-accent-foreground), `danger` (bg-destructive/14 text-destructive).
6. **Blob** (novo, decorativo): props `shape 1–4`, `color primary|secondary|accent`, `size`, `className` para posição. `aria-hidden`.
7. **AppShell**
   - ≥ 1024px: menu lateral fixo 288px, bg-sunken, borda direita, rolagem interna. Grupos com rótulo em caixa alta 14px; itens h-11 `rounded-full`, ícone Lucide 20px; ativo = bg-primary text-primary-foreground 800; hover bg-primary/10.
   - < 1024px: **cabeçalho flutuante em pílula** (`sticky top-3`, bg-white/75 backdrop-blur-md, borda 60%, shadow-soft) com botão hambúrguer musgo 48px, título da página em Fraunces 19px, ação contextual à direita (avatar ou botão `+` outline).
   - Gaveta = shadcn **Sheet** `side="left"`, largura `min(330px, 85vw)`, `rounded-r-[2.5rem]`, shadow-float, overlay `bg-foreground/40`. Contém logo, botão fechar 48px, controle A− / A / A+ e os mesmos grupos do menu (itens h-12, 17px). Foco preso; Esc fecha; foco volta ao hambúrguer; fecha ao navegar.
8. **FontScaleToggle**: grupo segmentado `rounded-full` bg-muted p-1; selecionado bg-card shadow-soft. Usar `ToggleGroup` com `aria-label="Tamanho da letra"`.
9. **ResponsiveTable**: ≥ 1024px tabela em cartão `rounded-organic-tr`, cabeçalho bg-muted 15px 800, linhas py-[18px] com borda top border/60, hover bg-primary/5. < 1024px cada linha vira **Card** (título em Fraunces 20px, pílula de status, bloco sunken com 2 colunas de dados-chave, ação primária full-width). Manter a lógica atual de "não cabe → cartões".
10. **FilterChips**: `ToggleGroup type="single"`, chips h-11 `rounded-full` border-[1.5px]; ativo bg-primary text-primary-foreground; no celular rolagem horizontal sem barra visível. Rótulo com contagem ("Vigentes · 9").
11. **ExpandableRow** (imóvel → unidades): Radix **Collapsible**/Accordion `type="multiple"`. Gatilho é o cartão inteiro (`button`, `aria-expanded`), chevron gira 180° em 400ms. Conteúdo: grade `auto-fill minmax(240px,1fr)` no computador; lista no celular.
12. **IconTile**: 52–56px, `rounded-2xl` bg-primary/10 text-primary (em imóveis usar `blob-n`); hover do cartão pai → bg-primary text-primary-foreground.
13. **Dialog / AlertDialog**: `rounded-[2rem]`, shadow-float, overlay foreground/40. No celular vira bottom sheet (`rounded-t-[2rem]`). Manter confirmação antes de excluir e devolução de foco.
14. **Toast**: `rounded-3xl` bg-card shadow-float, ícone em IconTile.
15. Ícones: **Lucide**, stroke 2, cor primary; 20px no menu, 22–24px em listas, 28px em cartões de destaque.

---

## Telas de referência

### 01 Login
- **Celular**: fundo com 2 blobs (musgo canto sup. direito, argila esquerda). Logo blob 72px musgo girado −6°. H1 "Que bom ver você de novo" 34px + subtítulo. Campos E-mail e Senha (botão olho 44px dentro do input). Botão "Entrar" h-14 full-width. Link "Esqueci minha senha". No rodapé, bloco muted `2rem 2.5rem 2rem 2rem` com ícone escudo: "O acesso é feito por convite. Se ainda não recebeu o seu, fale com a administração." (prepara o backlog "entrada só por convite"; o Cadastro público sai do fluxo quando isso entrar).
- **Computador**: grade 1.1fr / 1fr. Esquerda painel musgo com 2 blobs, logo + "Holding Aguiar", H1 56px "O patrimônio da família, cuidado com calma.", subtítulo, e moldura de foto girada −3° com borda 4px (espaço para foto real de um imóvel). Direita formulário max-w 420px centralizado.
- Recuperar/Redefinir senha e Cadastro usam o mesmo layout.

### 02 Início (painel)
- Saudação ("Bom dia, Helena · terça, 7 de outubro") + H1 com frase do resultado ("Setembro fechou no azul" quando positivo; "Setembro fechou no vermelho" quando negativo, com HighlightCard em destructive).
- **HighlightCard** "Resultado de setembro" R$ 48.320 (60px) + comparação com mês anterior. Pensado para o Seu Antônio: é a primeira coisa e a maior da tela.
- 2 cartões: Receitas (com despesas abaixo) e Ocupação (88% · 14 de 16). Celular: grade 2 colunas, "Ocupação" e "A receber".
- "Pede atenção": até 3 alertas como cartões-link (IconTile tingido por tipo + título 17px + linha secundária + chevron). Link para Alertas.
- "Próximos recebimentos" (computador): bloco muted `organic-br`, data em Fraunces 22px, nome, valor; separador tracejado.
- Perfil só leitura (sócio/contadora) vê o mesmo painel sem botões de ação.

### 03 Imóveis (macro → unidades)
- Cabeçalho: H1, resumo "4 imóveis, 16 unidades · 14 ocupadas, 2 vagas", busca em pílula, botão "Novo imóvel".
- Cada imóvel é um cartão expansível (raio ciclando). Gatilho: IconTile blob, nome em Fraunces 21px, endereço, barra de ocupação (h-2.5 rounded-full, musgo sobre muted), aluguel mensal, chevron.
- Unidades em blocos sunken `20px 28px 20px 20px`: nome, StatusPill, inquilino, valor/mês ou "Disponível".
- Celular: gatilho com IconTile + nome + "8 unidades · 7 ocupadas" + chevron; unidades em lista.

### 04 Contratos
- FilterChips: Todos · 12 / Vigentes · 9 / Vencendo · 2 / Encerrados · 1 (filtram de verdade).
- Computador: ResponsiveTable com colunas Inquilino (+código), Unidade, Aluguel, Vigência até, Situação, botão outline "Minuta" (gera o PDF atual).
- Celular: cartões com código + pílula, inquilino em Fraunces, unidade, bloco sunken (Aluguel | Vigência até), botão outline "Minuta em PDF" full-width h-12.
- "Vence em N dias" usa pílula warn; Encerrado neutral.

### 05 Simulador IBS/CBS (público)
- Navegação pública: pílula flutuante (logo, "Como funciona", "Perguntas", botão "Entrar").
- Hero 2 colunas: etiqueta "Reforma tributária na locação", H1 60px "Quanto a reforma tributária pesa no seu aluguel?", texto. Direita: cartão `2rem 5rem 2rem 2rem` shadow-float com Aluguel mensal (input 60px, 22px bold), "Quem aluga" (segmentado Empresa / Pessoa física), Alíquota de referência (%). Abaixo HighlightCard girado +1° com estimativa mensal (52px) e "Alíquota efetiva de X% · R$ Y por ano".
- Se Pessoa física: nota em bloco muted.
- 3 cartões explicativos (O que muda / Redutor de 70% / Transição até 2033), hover sobe e gira 1°.
- Rodapé: aviso de estimativa ilustrativa.
- **Manter a lógica de cálculo atual do simulador**; a referência usa só `aluguel × alíquota × 0,3` para demonstrar o layout.

---

## Mapa das outras telas (aplicar os mesmos padrões)
| Tela | Padrões |
|---|---|
| Status do desenvolvimento `/` | nav pública do simulador; hero com 2 blobs; feed de novidades em Cards com rotação alternada ±0.5° |
| Cadastro, Recuperar, Redefinir senha | layout do Login |
| Importar extrato | Card com área de soltar arquivo `rounded-organic-tr` borda tracejada 2px border; etapas numeradas em blobs |
| Histórico de importações | ResponsiveTable |
| Classificar transações | fila em cartões grandes (1 transação por cartão no celular), Select em pílula para categoria, botões 48px "Confirmar" / "Pular"; contador da fila no HighlightCard |
| Inquilinos, Locadores (+fiadores), Fornecedores | ResponsiveTable + busca + FilterChips; fiadores como Collapsible dentro do locador |
| Formulários de cadastro | 1 coluna no celular, 2 no computador; seções em Cards; ações fixas no rodapé no celular (barra bg-card/90 blur com botão primário full-width) |
| Receitas, Despesas | FilterChips por mês/situação, total do período em HighlightCard, ResponsiveTable |
| IPTU e taxas | Collapsible por imóvel → parcelas com StatusPill |
| Dashboard financeiro | HighlightCard + cartões; gráficos com musgo (receita), argila #C18C5D (despesa), areia (previsto); barras com cantos 8px; rótulos 15px; tabela-resumo abaixo de cada gráfico (acessível) |
| Dashboard de imóveis | barras de ocupação do padrão Imóveis; mapa de unidades em blocos sunken coloridos por status |
| Alertas | lista de cartões-link do Início, agrupada por urgência |
| Relatórios | grade de Cards de relatório com IconTile e botão outline "Baixar PDF" |
| Quadro de andamento (kanban) | colunas bg-sunken `rounded-3xl`; cartões card com rotação ±0.5° alternada; no celular colunas viram abas (ToggleGroup) |
| Usuários e permissões | ResponsiveTable; permissões por módulo em Switch (trilho `rounded-full`, polegar musgo, 44px de alvo) |
| Logs de atividade | linha do tempo com marcadores em blob e linha tracejada |
| Vazio / erro / carregando | blob grande + ícone + frase + 1 ação; skeleton bg-muted `rounded-2xl` com pulso suave 1.5s |

---

## Regras de texto e números (QA rodada 2)
Números, valores em R$, datas, códigos e pílulas nunca quebram linha (`whitespace-nowrap`). Números de destaque usam fonte fluida com container query (`clamp` + `cqw`). Grades usam `auto-fit/minmax` e reorganizam antes de espremer. Só texto descritivo quebra por palavra. Detalhes e método de teste em `QA-RELATORIO.md` (rodada 2).

## Interações e comportamento
- Transições: `transition-all duration-300` (botões, chips), 400ms (chevron, cartões), 700ms (zoom de imagem). Easing `ease-organic`.
- Hover só em `@media (hover:hover)`. Toque: só o `active:scale-95`.
- `prefers-reduced-motion`: sem transições e **sem rotações** (já em `main.css`).
- Gaveta: abre em 400ms da esquerda; fecha com Esc, overlay, botão X ou navegação.
- Expansão de imóveis: múltiplos abertos; estado na URL (`?abertos=1,3`) para o voltar do navegador.
- Filtros de contratos: estado na URL (`?situacao=vigentes`).
- Simulador: recalcula ao digitar; input numérico aceita vírgula (pt-BR).

## Responsividade (mobile-first)
- Base = celular 320–390px. `sm` 640, `md` 768, `lg` 1024 (entra menu lateral), `xl` 1280, `2xl` 1920 (conteúdo max-w 1280 centralizado).
- 320px: nada pode estourar; chips rolam na horizontal; números grandes caem de 44 para 36px (`clamp`).
- 768px (tablet): ainda gaveta; grades de cartões em 2 colunas; tabelas em cartões.
- Zoom 200% e A+: layout deve virar o do celular sem rolagem horizontal.
- Alvos: 44px mínimo em tudo (48px nos botões principais).

## Acessibilidade (não negociável)
- Contrastes da tabela de cores acima. Não colocar texto sobre `secondary` (#C18C5D).
- Blobs, granulação e rotações são decorativos (`aria-hidden`), não afetam leitura.
- Foco visível: `outline: 3px solid #5D7052; outline-offset: 3px` em link, botão e campo (5,2:1). Não usar `box-shadow` para foco: some quando o componente tem sombra própria.
- Campos sem marcação são obrigatórios (`required`); os outros levam "(opcional)" no rótulo. Erro: borda siena 2px + ícone + texto ligado por `aria-describedby`, `aria-invalid`, resumo no topo do formulário com `role=alert` que recebe o foco. Textos no catálogo da seção 07 do protótipo.
- Botão carregando: mantém largura, texto "Aguarde…" ou a ação ("Entrando…"), `aria-busy`, bloqueia novo toque. Desativado sempre com texto dizendo o que falta.
- Avisos (toast) não somem sozinhos. Confirmação de exclusão começa com foco em "Cancelar".
- Mantém: foco devolvido ao fechar diálogos, confirmação antes de excluir, landmarks, ordem de títulos.
- Rodar a varredura axe/WCAG das 140 páginas ao fim de cada fase: **zero violações** continua sendo o critério.

## Plano em fases
1. **Tokens e base** — `main.css`, `tailwind.config.ts`, fontes (Fraunces + Nunito, `font-display: swap`, preload), granulação, foco, reduced-motion. Remover Inter/SF Pro, Plus Jakarta Sans e JetBrains Mono. Critério: build verde, testes verdes, telas já com cores novas.
2. **Componentes shadcn** — Button, Input, Select, Card, Badge, Dialog, Sheet, Toggle/ToggleGroup, Switch, Collapsible, Toast, Table + novos Blob, HighlightCard, StatusPill, IconTile, ResponsiveTable, FilterChips, FontScaleToggle. Atualizar snapshots de teste.
3. **AppShell** — menu lateral ≥ lg, cabeçalho em pílula + gaveta < lg. Testar 320/375/768/1366/1920.
4. **Telas** — na ordem: Login (e família) → Início → Imóveis → Contratos → Simulador → demais cadastros → financeiro → análise → gestão → públicas.
5. **Tema escuro** — tokens `.dark` já prontos; revisar contrastes e blobs.
Ao fim de cada fase: testes de app e banco, varredura WCAG, medir carregamento no celular (meta mantida: login ≤ 2s; fontes não podem piorar isso — usar subset latin e só os pesos listados).

## Assets
- Ícones: Lucide (já é dependência via shadcn).
- Fontes: Google Fonts — Fraunces (opsz, wght 500–800), Nunito (400, 600, 700, 800). Preferir self-host com `@fontsource-variable/fraunces` e `@fontsource-variable/nunito`.
- Foto do login: espaço reservado; usar foto real de um imóvel da holding.
- Nenhuma imagem gerada; blobs e granulação são CSS.

## QA e crédito
- Software desenvolvido pela **Aguia**: texto "Desenvolvido por Aguia" (14px, `accent-foreground`) no fim do menu lateral/gaveta, abaixo do login e no rodapé do simulador.
- Agente de QA: `.claude/agents/qa-aguia.md`. Relatório da rodada 1 do protótipo: `QA-RELATORIO.md` (18 achados corrigidos; use como lista de requisitos de a11y).
- Alterações da rodada 1 já refletidas neste README: chips sem quebra, A−/A/A+ como botões `aria-pressed`, `aria-current` no menu, tabela com papéis ARIA, campos de valor em texto com `inputmode=decimal` aceitando vírgula, `aria-live` no resultado do simulador, cartões com número sem rotação (usar camada de papel deslocada `shadow-[12px_12px_0_-2px_hsl(var(--accent))]`), legendas em `accent-foreground`.

## Arquivos
- `.claude/agents/qa-aguia.md`, `QA-RELATORIO.md` — QA.
- `Holding Aguiar Organico.dc.html` + `support.js` — referência visual das 5 telas (celular e computador) e, desde a rodada 3: 06 guia de estilo e estados, 07 erros/confirmações/avisos, 08 páginas 404 e 500, 09 tablet 768. Abrir no navegador.
- `tokens/main.css` — variáveis claro/escuro, base, granulação, utilitários de blob.
- `tokens/tailwind.config.ts` — fontes, escala, cores, raios, sombras, animações.
- `PROMPT-CLAUDE-CODE.md` — prompt para colar no Claude Code.
