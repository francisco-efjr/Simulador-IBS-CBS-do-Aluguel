# 08 — Produto

> Documentação de produto do **Controle de Imóveis — Holding Aguiar**, escrita do ponto de vista do
> Product Owner (PO). Serve ao dono do produto para decidir o que vem a seguir, e à equipe para saber
> **o que existe, por que existe e como se confere**. Data de referência: 19/09/2026.

## Índice

| Documento | O que tem |
| :-- | :-- |
| Este README | Papel do PO, visão, Product Goal, partes interessadas, gestão do backlog, glossário |
| [personas.md](personas.md) | Cinco personas: quatro usuários e o inquilino, que é parte interessada mas não usa o sistema |
| [inventario-funcional.md](inventario-funcional.md) | Tudo o que o sistema faz hoje, módulo a módulo, com quem pode, regra aplicada, onde está e situação |
| [regras-de-negocio.md](regras-de-negocio.md) | Catálogo de regras (`RN-<MÓDULO>-NN` e `RT-NN`): as já implementadas e as que o PO propõe |
| [historias-e-cenarios.md](historias-e-cenarios.md) | Histórias de usuário checadas por INVEST, com critérios de aceitação em Gherkin |
| [backlog.md](backlog.md) | Backlog priorizado (WSJF + MoSCoW), Definition of Ready e Definition of Done |
| [referencias.md](referencias.md) | Artigos estudados (ABNT NBR 6023:2018), síntese e onde cada ideia foi aplicada |

Documentos que este material estende, sem substituir: [requisitos e restrições](../01-requisitos-e-restricoes.md)
(de onde vêm os IDs `RN-CTR-01`, `RN-FIN-01`, `RN-IMP-01`, `RT-01`…), [modelagem de dados](../02-modelagem-de-dados.md)
(débitos `RD-xx`), [segurança](../06-seguranca.md) (achados `S-xx`) e o [auditor](../07-auditor.md).

---

## O papel do Product Owner neste produto

**Da fonte consolidada (Guia do Scrum 2020, não dos artigos).** O PO responde por **maximizar o valor
do produto**. Na prática isso quer dizer quatro coisas: formular e comunicar o **Product Goal**; criar e
explicar com clareza os itens do backlog; **ordenar** o backlog; e garantir que ele seja visível e
entendido. É uma pessoa, não um comitê — pode ouvir muitos, mas a ordem final é dela.

**Do estudo dos artigos, o que isso significa aqui:**

| O PO nesta holding… | Por quê | Fonte |
| :-- | :-- | :-- |
| Ordena por **importância** e **corta** o que vale pouco | Foram as duas práticas associadas a menos atraso e a mais sucesso financeiro | Stare (2014) |
| Põe quem usa para **conferir cada entrega** com dado real | Teste regular pelo cliente também se associou a sucesso financeiro | Stare (2014) |
| Mede sucesso por **resultado na operação**, não por tela entregue | Prazo, custo e escopo explicam só parte da satisfação | Serrador e Turner (2014) |
| Liga cada item a um **objetivo da família** (caixa, previsibilidade) | É o que a direção olha: desempenho financeiro e execução previsível | Crawford (2014) |
| Pergunta **quem ganha** com cada mudança e procura oportunidade, não só risco | Projetos listam ameaças e esquecem oportunidades | Johansen, Eik-Andresen e Ekambaram (2014) |
| Escreve **como se decide**, e decide rápido | Decisão é processo; decisão lenta gera insatisfação | Rocha (2014); Ramos e Mota (2014) |
| Cuida da **linguagem** e do vocabulário comum | Falta de comunicação é o fator de fracasso mais lembrado; vocabulário comum reduz mal-entendido | Ramos e Mota (2014); Haselberger e Motschnig (2014) |
| Revê a prioridade **a cada ciclo**, olhando o fluxo de caixa | Priorização é contínua e por vários critérios | Purnus e Bodea (2014) |
| Trata divergência pequena **cedo e por escrito** | Diferença não resolvida vira disputa | du Preez (2014) |

O que o PO **não** faz: não decide como implementar (é da equipe técnica, registrado em
[ADR](../05-adr/README.md)); não concede acesso a pessoas (é do administrador do sistema); não dá
parecer jurídico ou contábil — regra com base legal passa pela contadora ou pelo advogado antes de
virar código.

---

## Visão do produto

*Modelo de frase de Moore (1991) — fonte externa aos artigos.*

> **Para** a família sócia da Holding Aguiar e para quem administra seus imóveis,
> **que** hoje junta extrato de banco, planilha e papel para saber se o aluguel entrou, quando vence o
> IPTU e quando reajustar,
> **o Controle de Imóveis** é o caderno único dos imóveis da holding
> **que** registra cada contrato e lançamento, confere com o extrato do banco e avisa antes do
> vencimento.
> **Diferente** de sistemas que só cobram ou só geram contrato,
> **ele fecha o mês a partir do extrato** e já mostra o efeito da Reforma Tributária sobre a locação.

A posição competitiva está em [00-pesquisa-e-benchmark.md](../00-pesquisa-e-benchmark.md): conciliação
de extrato assistida e simulador IBS/CBS são exclusivos entre os concorrentes pesquisados; cobrança,
assinatura digital e análise de crédito são lacunas "compráveis" por integração.

## Product Goal

> **Até 31 de dezembro de 2026, a holding fecha cada mês dentro do sistema: todo aluguel previsto é
> conferido com o extrato, nenhum reajuste ou IPTU passa da data por esquecimento, e o sócio recebe o
> resultado do mês sem precisar pedir.**

Um objetivo por vez, como pede o Guia do Scrum. Ele é medido por resultado, não por entrega
(Serrador e Turner, 2014):

| Indicador | Hoje (19/09/2026) | Meta do Goal | Como se mede |
| :-- | :-- | :-- | :-- |
| Receitas do mês com previsão gerada pelo contrato | 0% — não há geração automática (RN-CTR-01 não implementada) | 100% dos contratos ativos | receitas com `contrato` preenchido ÷ contratos ativos × meses |
| Créditos do extrato conciliados contra receita prevista | 0% — a classificação cria receita nova (ver RN-FIN-08) | ≥ 90% sem digitação | transações com vínculo a receita prevista ÷ créditos importados |
| Reajustes aplicados até a data de aniversário | não medido | 100% | reajustes com data ≤ `proxima_data_reajuste` |
| Parcelas de IPTU pagas depois do vencimento | não medido | 0 | `iptu_taxas` com `data_pagamento > vencimento` |
| Dias para fechar o mês | não medido | ≤ 1 dia útil após o último extrato | data do fechamento − data do último extrato do mês |
| Resultado mensal entregue ao sócio | manual | automático até o dia 5 | envio registrado (item pendente do quadro) |

O caminho do Goal está no topo do [backlog](backlog.md): corrigir a classificação, gerar as receitas
previstas, conciliar contra elas e automatizar reajuste e IPTU parcelado.

---

## Partes interessadas

O mapa segue a sugestão de Johansen, Eik-Andresen e Ekambaram (2014): para cada parte, **o que ganha**,
e não só o que teme.

| Parte | Relação com o sistema | O que ganha | O que teme | Influência × interesse | Como se envolve |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Sócios da holding (família) | Usuários de leitura; alguns administradores | Ver o resultado sem pedir; previsibilidade | Perder controle, "não entender o sistema" | Alta × alta — **gerir de perto** | Demonstração mensal com dado real; relatório por e-mail |
| Administrador(a) da holding | Usuário diário, perfil administrador | Menos digitação, nada esquecido | Retrabalho, erro que só aparece no fim do ano | Alta × alta — **gerir de perto** | Confere cada entrega (Stare, 2014); decide junto o que corta |
| Operador(a) administrativo(a) | Usuário por módulo (edição) | Fila clara do que fazer | Levar a culpa por erro do sistema | Média × alta — **manter informado** | Testa as histórias de extrato e lançamento |
| Contador(a) externo(a) | Usuário de leitura (visualização) | Mês fechado e exportável; comprovantes | Dado mudar depois de fechado | Média × média — **manter satisfeito** | Valida regras fiscais e o fechamento mensal |
| Inquilinos (PF e PJ) | **Não usam o sistema** | Cobrança correta, recibo discriminado, reajuste explicado | Cobrança indevida, exposição de dados | Baixa × alta — **proteger** | Indireto: regras de recibo, reajuste e LGPD |
| Fornecedores e síndicos | Não usam; aparecem como cadastro | Pagamento em dia | — | Baixa × baixa — **monitorar** | Indireto |
| Prefeitura, Receita, Comitê Gestor do IBS | Não usam; definem regras | Tributo pago em dia | — | Alta × baixa — **acompanhar a norma** | Mudança de lei entra como item de backlog |
| Bancos (extrato OFX/CSV) | Fonte de dado | — | — | Média × baixa — **monitorar formato** | Novo dialeto de extrato vira item |
| Equipe de desenvolvimento | Constrói e mantém | Backlog claro, DoD objetiva | Mudança sem critério | Alta × alta — **parceria diária** | Refinamento; auditor 10/10 |

Regra de engajamento (Rocha, 2014): **alinhar a família antes** de mudar algo que o inquilino sente
(reajuste, recibo, cobrança).

## Como o backlog é gerido

| Item | Como é | Quem decide |
| :-- | :-- | :-- |
| Onde vive | [backlog.md](backlog.md), versionado no repositório; o quadro público em `src/data/andamento.json` mostra a situação para a família | PO |
| Ordem | WSJF (custo do atraso ÷ tamanho), com MoSCoW para a fronteira do Goal — detalhe em [backlog.md](backlog.md#método-de-priorização) | PO, ouvindo a administradora |
| Horizonte | Detalhado para os próximos 3 a 6 meses; o resto fica grosso (Johansen *et al.*, 2014, "nove passos") | PO |
| Revisão | A cada entrega (reordenação) e uma vez por mês (riscos e oportunidades); revisão geral no fechamento do semestre | PO |
| Entrada de item | Precisa cumprir a [Definition of Ready](backlog.md#definition-of-ready-dor) | PO + equipe |
| Saída de item | Só com a [Definition of Done](backlog.md#definition-of-done-dod) inteira, inclusive o auditor 10/10 e a entrada no feed | Equipe, conferido pelo PO |
| Regra com base legal | Conferida pela contadora ou pelo advogado antes de "pronto para desenvolver" | Dono do produto, com parecer |
| Corte | Item de valor baixo que ficou três ciclos sem subir sai do backlog e vai para "descartados", com o motivo (Stare, 2014) | PO |

---

## Glossário

Vocabulário único, igual na tela, no relatório e na documentação (Haselberger e Motschnig, 2014).

| Termo | Significado aqui |
| :-- | :-- |
| **Competência** | Mês a que o lançamento se refere, no formato `AAAA-MM` (ex.: `2026-03`), independente do dia em que foi pago |
| **Previsto** | Lançamento esperado que ainda não entrou nem saiu |
| **Baixa** | Registro de que o valor previsto foi recebido ou pago (preenche valor e data) |
| **Parcial** | Recebeu ou pagou menos que o previsto |
| **Em atraso / vencido** | Venceu e não houve baixa; a varredura das 02:00 marca sozinha |
| **Importação** | Um arquivo de extrato (OFX ou CSV) gravado inteiro, de uma vez |
| **Classificar** | Dizer o que uma linha do extrato é (receita ou despesa, de qual imóvel e categoria) |
| **Conciliar** | Casar a linha do extrato com o lançamento previsto que ela quita — **proposta**, ver RN-FIN-08 |
| **Contrato ativo** | Contrato em vigor; ocupa o imóvel (imóvel "alugado") |
| **Aniversário do contrato** | Mesmo dia e mês do início, a cada ano; data padrão de reajuste |
| **Garantia** | Uma única modalidade por contrato (caução, fiador, seguro-fiança…) |
| **Trilha de auditoria** | Registro automático de quem criou, alterou ou excluiu o quê, com o antes e o depois |
