# Visual orgânico: pendências para o design (atualizado em 07/10/2026, fase 2)

Release "Gestão de imóveis": nova identidade do sistema, desenvolvido por **Aguia Solutions LTDA**.
Base usada: handoff `design_handoff_organico` (5 telas de referência, tokens e mapa das outras 22).

## O que já foi feito

- **Base em todo o sistema:** cores, Fraunces nos títulos, Nunito no corpo, granulação de papel,
  anel de foco musgo, botões em pílula, cartões com canto orgânico, pílulas de situação, diálogos
  (viram folha de baixo no celular), seletores, abas e notificações.
- **Menu:** lateral fixo a partir de 1024px; abaixo disso, cabeçalho em pílula e menu em gaveta.
  Os itens estão agrupados como no protótipo, e o crédito da Aguia aparece no fim do menu.
- **Telas refeitas pela referência:** Login, Cadastro, Recuperar senha, Redefinir senha, Início,
  Imóveis, Contratos e Simulador IBS/CBS. A página pública de andamento (`/`) ganhou a marca nova.
- **Outras telas:** as demais telas receberam as cores novas por uma paleta de transição, com o
  mesmo contraste de antes, mas o layout delas continua o antigo.
- **Verificação:** zero violações de acessibilidade (WCAG 2.2 AA, axe) nas 25 rotas, em 320, 375,
  768, 1366 e 1920px, com letra normal e com letra A+.

## Fase 2 e rodada 3 (07/10/2026, mesmo dia)

O designer mandou a revisão do protótipo (seções 06 a 09: guia de estilo e estados, erros e
confirmações, 404 e 500, tablet) e a **Fase 2** (seções 10 a 15). As duas estão em
`docs/design/handoff-organico/` e foram implementadas:

- **Base (06, Q25–Q31):** foco em contorno sólido de 3px afastado 3px; estados de link; texto de
  exemplo com contraste; menos animação para quem pede; botão com estado "carregando"
  (`Button carregando`); campo com erro em siena, com ícone e texto ligado ao campo;
  `ResumoDeErros` no topo dos formulários; catálogo de mensagens em `src/lib/mensagens-de-erro.ts`.
- **07:** avisos não somem sozinhos e saem ao trocar de tela; exclusão com foco inicial em
  "Cancelar" e botão "Sim, …"; painel de baixo no celular.
- **08:** páginas 404 e 500 (`PaginaDeErro`, `ErroDoSistema`).
- **09:** Início a 768px.
- **10:** corpo da página pública de andamento, com os dados reais (o texto "o novo sistema está
  chegando" do protótipo não se aplica: o sistema já está em produção).
- **11:** cadastro por convite, recuperar, "confira seu e-mail" e redefinir, com as regras da
  senha marcando enquanto a pessoa digita (as regras reais do sistema: 8 caracteres e senhas iguais).
- **12 e 13:** Inquilinos e Locadores e fiadores.
- **14:** novo contrato como página (`/contratos/novo`, `/contratos/:id/editar`).
- **15:** vazio, sem resultado e carregando em Inquilinos, Locadores e Contratos (`EstadoVazio`).

Com isso, saem da tabela abaixo os itens 1, 2, 17 e 18 e o formulário de contrato do item 4.

### Decisões tomadas sem o designer na fase 2 (validar)

1. **Fiadores do locador.** No banco o fiador pertence ao contrato, não ao locador. A tela mostra,
   em cada locador, os fiadores dos contratos **ativos** dele. "Adicionar fiador" cadastra o
   fiador, que aparece no locador quando for escolhido num contrato. Não há sexo no cadastro,
   então o texto é sempre "Fiador de …" (o protótipo usa "Fiadora").
2. **Garantia com os 6 tipos do sistema,** não os 4 do protótipo.
3. **Datas com o seletor nativo do navegador** (`type="date"`), com "dia/mês/ano" no texto de ajuda.
4. **Ponto de troca tabela → cartão por largura da área da lista** (container query em `em`), não
   da tela: acompanha o tamanho de letra escolhido.
5. **"Mostrar mais" depois de 5 inquilinos** também no computador, como no protótipo.
6. **Filtros antigos de tipo e situação** saíram de Inquilinos e Locadores (o protótipo não tem);
   inativos seguem na lista com a pílula "Inativo".
7. **Página pública:** "Entregas prontas X de Y" (mesmo termo do Início); as etapas são as frentes
   do quadro. Sem a rotação de 0,5° dos cartões de novidade.
8. **Medidor de força da senha** saiu da tela de redefinir; ficam só as regras.

### Pendências técnicas encontradas

- Estouro lateral a 320px com letra A++ em **Fornecedores** (2px, botões Editar) e **Quadro**
  (9px, chips de coluna). Já existiam antes da fase 2; resolvem-se quando essas telas forem
  redesenhadas.
- O Sonner não marca cada aviso com `role`: o sistema faz isso por observador de DOM
  (`src/components/ui/sonner.tsx`). Funciona, mas vale trocar se a biblioteca passar a oferecer.
- "Tentar de novo" existe só nas falhas de carregamento de Alertas, Importar extrato, Relatórios,
  Contas bancárias e no salvar contrato; os demais avisos de falha não têm ação.
- O quadro de histórias e os resumos de produto do Início ainda usam a paleta de transição.

## 1. Telas sem desenho de referência

O handoff descreve só o padrão destas telas. Precisam de tela desenhada, no celular e no
computador.

| # | Tela | O que falta desenhar |
|---|---|---|
| 1 | Inquilinos | Lista como ResponsiveTable, com busca e chips de filtro |
| 2 | Locadores e fiadores | Lista e fiadores dentro do locador (Collapsible) |
| 3 | Fornecedores | Lista com busca e chips |
| 4 | Formulários de cadastro (imóvel, unidade, contrato, inquilino, locador, fiador, fornecedor, receita, despesa, IPTU) | Seções em cartões, 1 coluna no celular, barra de ações fixa no rodapé. O de contrato é o mais complexo: garantia, fiador, caução e minuta |
| 5 | Importar extrato | Área de soltar o arquivo e as etapas numeradas |
| 6 | Histórico de importações | Lista |
| 7 | Classificar transações | A fila do Marcos: um cartão por transação, Confirmar e Pular, contador. O QA já apontou essa falta (R3) |
| 8 | Receitas e Despesas | Chips por mês e situação, total em cartão de destaque, lista |
| 9 | IPTU e taxas | Parcelas agrupadas por imóvel |
| 10 | Dashboard financeiro | Gráficos no estilo novo e tabela-resumo abaixo de cada gráfico (R3) |
| 11 | Dashboard de imóveis | Mapa de unidades por situação |
| 12 | Alertas | Lista agrupada por urgência, no padrão dos alertas do Início |
| 13 | Relatórios | Grade de cartões com "Baixar PDF" |
| 14 | Quadro de andamento (kanban) | Colunas e, no celular, abas no lugar das colunas (R3) |
| 15 | Usuários e permissões | Lista e permissões por módulo. **Urgente:** no celular a tabela atual esconde o nome atrás dos botões |
| 16 | Logs de atividade | Linha do tempo |
| 17 | Página pública de andamento (`/`) | O corpo da página: feed em cartões e quadro de entregas. O topo já foi feito |
| 18 | Estados de tela | Vazio, erro, carregando e a página 404 |
| 19 | Diálogos de detalhe | Detalhe do imóvel e do contrato, e a pré-visualização da minuta |
| 20 | Simulador: abas internas | Portfólio, Comparativo e o modo profissional (parâmetros, dossiê jurídico, API). A referência mostra só a calculadora simples |
| 21 | Simulador: "Perguntas" | O protótipo tem o link, mas não existe tela nem conteúdo de perguntas frequentes. Por isso o link ficou de fora |
| 22 | Tema escuro (fase 5) | Os tokens existem, mas não há tela de referência nem botão para trocar de tema no sistema |

## 2. Itens de marca que faltam

- **Logo oficial** de "Gestão de imóveis". Hoje um broto genérico (ícone Lucide) num blob ocupa o
  lugar da marca.
- **Logo ou assinatura da Aguia Solutions LTDA**, se houver. Hoje o crédito é só texto.
- **Favicon e imagem de compartilhamento** (`og-image.png`): ainda são os antigos.
- **Foto real de um imóvel da holding** para o painel do login no computador. O protótipo tinha um
  espaço reservado, que ficou de fora para não ir ao ar vazio.
- **PDFs** (relatórios e minuta do contrato): continuam com o azul-marinho e o dourado. Falta
  desenhar a versão impressa no estilo novo.

## 3. Decisões tomadas sem o designer (validar)

1. **Controle de letra "A / A+ / A++".** O protótipo mostra "A− / A / A+", com o menor tamanho
   abaixo do normal. Mantivemos o piso: o menor tamanho é o normal, e os outros dois aumentam
   (118% e 135%).
2. **Argila escura (#A97447) nas despesas dos gráficos.** A argila clara (#C18C5D) dá 2,9:1 sobre o
   papel, abaixo dos 3:1 que barras de gráfico exigem.
3. **Contratos: tabela só a partir de 1500px.** Com o menu lateral, em 1366px a tabela espremia as
   colunas. Abaixo de 1500px a tela usa cartões, seguindo a regra do handoff "se não cabe, vira
   cartão".
4. **Ações de Imóveis dentro do cartão aberto.** No protótipo o cartão inteiro abre e fecha, então
   Detalhes, Editar, + Unidade e Inativar ficaram na área que aparece ao abrir.
5. **"Criar conta" continua no login,** dentro do aviso de acesso por convite, enquanto o cadastro
   aberto existir (ver pendências do dono).
6. **O simulador manteve o modo escuro próprio** (botão de lua na pílula) e o cálculo completo. A
   referência simplifica para `aluguel × alíquota × 0,3`, só para demonstrar o layout.

## 4. Para o produto (PO)

- O cenário de aceitação da história de conta inativa, na carga do quadro, ainda cita
  "administrador do Controle de Imóveis". A mensagem na tela agora é "Sua conta não está ativa.
  Procure um administrador do sistema."
- A documentação de produto ainda usa o nome antigo em vários lugares. O nome mudou na interface,
  no título da aba, no PDF e no feed.
