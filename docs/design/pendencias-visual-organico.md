# Visual orgânico: pendências para o design (07/10/2026)

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
