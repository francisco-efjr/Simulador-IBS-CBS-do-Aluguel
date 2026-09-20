# Backlog de produto

> Ordenado pelo PO em 19/09/2026. A ordem é revista a cada entrega e uma vez por mês (ver
> [Como o backlog é gerido](README.md#como-o-backlog-é-gerido)). O quadro público
> ([`src/data/andamento.json`](../../src/data/andamento.json)) continua sendo a vitrine para a família;
> este arquivo é o instrumento de decisão.

## Método de priorização

**WSJF para ordenar, MoSCoW para marcar a fronteira do Product Goal.**

- **WSJF** (*Weighted Shortest Job First* — Reinertsen, 2009; fonte externa aos artigos): faz primeiro o
  item de **maior custo do atraso por unidade de tamanho**.
  `WSJF = (Valor ao usuário + Criticidade no tempo + Redução de risco ou habilitação) ÷ Tamanho`.
  Cada componente vale 1, 2, 3, 5, 8 ou 13, **relativo aos outros itens** — não é hora nem dinheiro.
- **MoSCoW** (Clegg e Barker, 1994; fonte externa): **M**ust = sem ele o Product Goal não se cumpre;
  **S**hould = importante, mas o Goal se cumpre sem; **C**ould = desejável; **W**on't = não neste Goal.

**Por que esse método, pelo estudo:**

| Escolha | Fundamento |
| :-- | :-- |
| Ordenar por importância e cortar o que vale pouco | Stare (2014): atribuir importância às funções associou-se a menos atraso e custo; eliminar as menos importantes, a mais sucesso financeiro |
| Vários critérios, não só "valor" | Purnus e Bodea (2014): priorizar por um critério só leva a resultado pior; o fluxo de caixa é critério explícito — daí a "criticidade no tempo" (reajuste e IPTU têm data) |
| "Valor ao usuário" pesa tanto quanto o resto somado, em média | Serrador e Turner (2014): eficiência explica só parte da satisfação; o que a pessoa ganha conta mais |
| Componente "redução de risco" | Johansen, Eik-Andresen e Ekambaram (2014) e Johansen *et al.* (2014, nove passos): incerteza tratada de forma contínua, olhando 3 a 6 meses |
| Processo escrito e revisão contínua | Rocha (2014): decidir como decidir; Purnus e Bodea (2014): a priorização muda com o contexto |

**Regra de corte.** Item "Could" que passar três revisões mensais sem subir sai para
[Descartados](#descartados), com o motivo.

---

## Backlog ordenado

VU = valor ao usuário · CT = criticidade no tempo · RR = redução de risco ou habilitação ·
CoD = custo do atraso (VU + CT + RR) · T = tamanho · **WSJF = CoD ÷ T**.
"Serve a" liga o item a um indicador do [Product Goal](README.md#product-goal) (Crawford, 2014).

| Ordem | ID | Item | Regras | VU | CT | RR | CoD | T | WSJF | MoSCoW | Serve a | Depende de |
| :-: | :-- | :-- | :-- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-- | :-- |
| 1 | B-03 | Entrada só por convite (desligar cadastro público) | RN-SEC-07 | 2 | 8 | 8 | 18 | 1 | **18,0** | M | segurança da base | — |
| 2 | B-02 | Laudo do simulador cita a LC 227/2026 | RT-09 | 3 | 5 | 5 | 13 | 1 | **13,0** | M | uso profissional do simulador | — |
| 3 | B-14 | Recusa do banco sempre visível: inativar imóvel/inquilino com contrato ativo, reajuste antes do início; corrigir o texto "para de gerar cobranças" | RN-IMV-02, RN-INQ-01, RN-CTR-05 | 5 | 3 | 2 | 10 | 1 | **10,0** | M | confiança da operação | — |
| 4 | B-10 | Garantia coerente e caução até 3 aluguéis | RN-CTR-10, RN-CTR-11 | 3 | 2 | 5 | 10 | 1 | **10,0** | S | — | D-03 |
| 5 | B-01 | **Classificação atômica e com vínculos corretos** (defeito provável) | RN-IMP-09 | 8 | 8 | 13 | 29 | 3 | **9,7** | M | créditos conciliados | confirmar o defeito |
| 6 | B-21 | Agência e conta mascaradas | RN-SEC-08 | 1 | 2 | 5 | 8 | 1 | **8,0** | S | — | — |
| 7 | B-23 | Anexo do contrato: tela aceita `.doc/.docx`/WebP que o bucket recusa | — | 3 | 3 | 2 | 8 | 1 | **8,0** | S | — | — |
| 8 | B-04 | Testes de banco para as regras sem teste (sobreposição de contratos, `HA001`, CPF/CNPJ, datas, `importar_extrato()`) | RN-CTR-03, RN-CTR-05, RN-IMV-02, RN-INQ-01 a 03, RN-FIN-06, RN-IMP-02, RN-IMP-04 a 08 | 2 | 5 | 8 | 15 | 2 | **7,5** | M | DoD | — |
| 9 | B-05 | Remetente de e-mail próprio (SMTP com o domínio da holding) | — | 5 | 5 | 5 | 15 | 2 | **7,5** | M | resultado ao sócio | — |
| 10 | B-08a | Reajuste anual — fatia 1: cálculo e confirmação com índice digitado; índice em lista e periodicidade ≥ 12 meses | RN-CTR-02, RN-CTR-09 | 8 | 8 | 5 | 21 | 3 | **7,0** | M | reajustes na data | D-02, D-06 |
| 11 | B-12 | Importação com transação classificada não se exclui | RN-IMP-10 | 3 | 2 | 8 | 13 | 2 | **6,5** | S | — | — |
| 12 | B-09 | IPTU parcelado de uma vez | RN-IPTU-04 | 8 | 8 | 2 | 18 | 3 | **6,0** | S | IPTU na data | — |
| 13 | B-26 | Confirmação ao alugar imóvel em manutenção | RN-IMV-05 | 3 | 1 | 2 | 6 | 1 | **6,0** | C | — | — |
| 14 | B-30 | Aviso de arquivo de extrato repetido | RN-IMP-11 | 3 | 1 | 2 | 6 | 1 | **6,0** | C | — | — |
| 15 | B-22 | Perfis de acesso prontos (sócio, contador, operação) | RN-SEC-09 | 5 | 3 | 3 | 11 | 2 | **5,5** | S | resultado ao sócio | D-05 |
| 16 | B-06 | **Receitas previstas geradas pelo contrato** e encerramento que limpa o futuro | RN-CTR-01, RN-CTR-13 | 13 | 8 | 5 | 26 | 5 | **5,2** | M | receitas com previsão | D-01 |
| 17 | B-20 | Janelas fixas de aviso (90/60/30, 30, 7) | RN-ALR-02 | 5 | 3 | 2 | 10 | 2 | **5,0** | S | reajustes e IPTU na data | — |
| 18 | B-13 | Recebimento parcial com saldo em aberto e o combinado registrado | RN-FIN-09 | 8 | 3 | 3 | 14 | 3 | **4,7** | S | créditos conciliados | B-07 |
| 19 | B-17 | Multa proporcional na saída antecipada | RN-CTR-12 | 5 | 1 | 3 | 9 | 2 | **4,5** | C | — | D-04 |
| 20 | B-28 | Motivo obrigatório para excluir lançamento | RN-AUD-05 | 3 | 1 | 5 | 9 | 2 | **4,5** | C | — | — |
| 21 | B-11 | **Desfazer classificação** (e tirar o "Editar" que duplica) | RN-IMP-01 | 5 | 3 | 5 | 13 | 3 | **4,3** | M | créditos conciliados | B-01 |
| 22 | B-27 | Dados mínimos do inquilino (LGPD) | RN-INQ-06 | 1 | 2 | 5 | 8 | 2 | **4,0** | C | — | — |
| 23 | B-34 | Conferir CEP antes de salvar (pendência 4 do quadro) | — | 2 | 1 | 1 | 4 | 1 | **4,0** | C | — | — |
| 24 | B-19 | Recibo discriminado | RN-FIN-11 | 5 | 2 | 3 | 10 | 3 | **3,3** | S | — | B-07 |
| 25 | B-24 | IPTU repassado ao inquilino gera reembolso | RN-IPTU-03 | 5 | 3 | 2 | 10 | 3 | **3,3** | C | — | B-09 |
| 26 | B-07 | **Conciliar o crédito contra a receita prevista** | RN-FIN-08 | 13 | 5 | 8 | 26 | 8 | **3,2** | M | créditos conciliados | B-01, B-06 |
| 27 | B-18 | Multa e juros de atraso em lançamento próprio | RN-FIN-10 | 5 | 2 | 2 | 9 | 3 | **3,0** | C | — | D-04 |
| 28 | B-29 | Valor estimado com data e método | RN-IMV-06 | 3 | 1 | 1 | 5 | 2 | **2,5** | C | — | — |
| 29 | B-16 | **Fechamento de competência** | RN-FIN-12 | 5 | 2 | 5 | 12 | 5 | **2,4** | M | dias para fechar o mês | B-07 |
| 30 | B-15 | **Resultado do mês por e-mail** | RN-REL-02 | 8 | 2 | 1 | 11 | 5 | **2,2** | M | resultado ao sócio | B-05, B-16 |
| 31 | B-08b | Reajuste anual — fatia 2: coleta automática de IGP-M e IPCA | RN-CTR-02 | 5 | 3 | 2 | 10 | 5 | **2,0** | S | reajustes na data | B-08a |
| 32 | B-25 | Página pública do simulador e otimização de busca | — | 3 | 2 | 1 | 6 | 3 | **2,0** | C | — | — |
| 33 | B-36 | Histórico de sinistros por imóvel (oportunidade) | — | 2 | 1 | 2 | 5 | 3 | **1,7** | C | — | — |
| 34 | B-33 | Cobrança por boleto e PIX | — | 13 | 2 | 2 | 17 | 13 | **1,3** | W | próximo Goal | B-06 |
| — | B-31 | Extrato por Open Finance | RN-IMP-03 | — | — | — | — | — | — | W | — | — |
| — | B-32 | Separação por organização | RN-SEC-10 | — | — | — | — | — | — | W | — | — |
| — | B-35 | Aplicativo para celular | — | — | — | — | — | — | — | W | — | — |

> **Leitura da tabela.** WSJF ordena; dependência manda. B-07, entre os maiores custos do atraso (26,
> igual ao de B-06), tem WSJF baixo porque é grande — e só pode começar depois de B-01 e B-06. É o caso típico de
> **fatiar** (Stare, 2014): a primeira fatia de B-07 é "casamento exato de valor e competência";
> "várias receitas em aberto" e "parcial" vêm depois (B-13).

### Caminho do Product Goal (os "Must", na ordem de dependência)

1. **B-03** convite obrigatório · **B-02** LC 227 no laudo · **B-14** recusas visíveis — pequenos, de
   risco alto, fecham pendências do quadro.
2. **B-01** classificação atômica — pré-requisito de tudo que mexe com extrato. Começa confirmando o
   defeito com um teste que reproduza a classificação contra o banco.
3. **B-04** testes de banco e **B-05** SMTP — dívida e habilitador.
4. **B-08a** reajuste com índice digitado — antes do próximo aniversário da carteira.
5. **B-06** receitas previstas → **B-11** desfazer classificação → **B-07** conciliação.
6. **B-16** fechamento de competência → **B-15** resultado por e-mail.

---

## Decisões pendentes do dono

Decisões que o PO não toma sozinho porque dependem da família, da contadora ou do advogado. Enquanto
abertas, os itens dependentes não estão "prontos para desenvolver" (ver DoR).

| ID | Decisão | Opções | Recomendação do PO | Quem confere | Bloqueia |
| :-- | :-- | :-- | :-- | :-- | :-- |
| D-01 | Primeiro aluguel quando o contrato começa depois do dia de vencimento | proporcional aos dias / mês cheio no mês seguinte | Seguir o que o contrato-modelo da holding diz; na falta, proporcional | Advogado | B-06 |
| D-02 | Índice acumulado negativo | reduzir o aluguel / manter | Seguir a cláusula; se o contrato for omisso, manter e registrar a decisão | Advogado | B-08a |
| D-03 | Modalidades de garantia da lista | manter "título de capitalização"; acrescentar "cessão fiduciária de quotas de fundo" (art. 37, IV) | Acrescentar a cessão fiduciária; confirmar o enquadramento do título | Advogado | B-10 |
| D-04 | Multa rescisória e moratória | contagem por mês ou por dia; percentuais padrão | Por mês, como no contrato; percentuais vindos de cada contrato | Advogado | B-17, B-18 |
| D-05 | O que o sócio pode ver | só dashboards e relatórios / também os módulos de origem em leitura | Leitura nos módulos de origem (senão os painéis saem vazios) | Família | B-22 |
| D-06 | Índices aceitos | IGP-M, IPCA, INPC, IVAR; outros | Os quatro, mais "sem reajuste por índice" | Contadora | B-08a |

---

## Oportunidades antes das ameaças

Johansen, Eik-Andresen e Ekambaram (2014) observam que projetos listam ameaças com facilidade e
esquecem as oportunidades. Por isso elas vêm primeiro.

**Oportunidades**

- **Simulador público como porta de entrada.** Único simulador IBS/CBS sobre locação com laudo entre os
  concorrentes pesquisados ([00](../00-pesquisa-e-benchmark.md)); com B-02 e B-25, vira referência para
  contadores — gente como a Dra. Rita.
- **CNPJ alfanumérico já aceito** no formulário e no banco, antes de muitos sistemas do mercado.
- **Conciliação contra o previsto (B-07)** transforma o "caderno" em "fechamento": é o que nenhum
  concorrente pesquisado faz com extrato multibanco.
- **Trilha de auditoria completa** já existe: base pronta para o fechamento de competência (B-16) e
  para o motivo de exclusão (B-28).
- **Histórico de sinistros (B-36)** aproveita o tipo "seguro" que já existe em IPTU e taxas (Hanák e
  Korytárová, 2014).

**Ameaças (riscos)**

| Risco | Efeito | Resposta | Item |
| :-- | :-- | :-- | :-- |
| Classificação falhar ou duplicar lançamento em produção | Números errados no primeiro mês de uso real | Confirmar e corrigir antes de importar extrato real | B-01, B-11 |
| Recusa silenciosa na tela | Usuário idoso acha que "o sistema travou" e desiste | Toda recusa com mensagem | B-14 |
| Adoção lenta (hábito da planilha) | Sistema vazio, Goal não medido | Demonstração mensal com dado real; resultado por e-mail | B-15; Ozorhon *et al.* (2014) |
| Mudança de norma (IBS/CBS, índices) | Laudo ou reajuste desatualizado | Norma nova entra como item com prioridade de risco | B-02, B-08 |
| Limite de envio do remetente padrão | Convite e recuperação de senha não chegam | SMTP próprio | B-05 |
| Regra legal implementada sem conferência | Cobrança indevida ao inquilino | DoR exige conferência | D-01 a D-04 |

---

## Definition of Ready (DoR)

Um item só entra em desenvolvimento quando:

1. Está escrito como história **"Como ‹persona›, quero ‹ação›, para ‹valor›"**, com uma persona de
   [personas.md](personas.md).
2. Passou pela checagem **INVEST**; ressalva ⚠ foi aceita pelo PO ou o item foi fatiado.
3. Tem **critérios de aceitação em Gherkin em português**, com pelo menos um caminho feliz e um de
   exceção, e dados de exemplo plausíveis (valores em R$, datas reais do calendário).
4. Cada mensagem ao usuário está **escrita** e diz o que fazer, em linguagem para 40 a 90 anos
   (Ramos e Mota, 2014).
5. As regras estão no [catálogo](regras-de-negocio.md) com ID; a regra com **base legal foi conferida**
   pela contadora ou pelo advogado, e a conferência está registrada no item.
6. As **decisões do dono** de que ele depende estão fechadas (tabela acima).
7. O impacto em **permissão** está definido: qual módulo, qual nível, e o que a RLS deve recusar.
8. **Dependências** resolvidas ou sequenciadas, e a equipe estimou o tamanho.

## Definition of Done (DoD)

Um item só está pronto quando **tudo** abaixo vale:

1. **Critérios de aceitação** atendidos; cenários viram teste automático sempre que possível.
2. **Toda regra nova no banco tem teste em [`supabase/tests/`](../../supabase/tests)** (PGlite), com
   pelo menos um caso aceito e um recusado — inclusive por usuário sem permissão. Regra de tela tem teste
   Vitest.
3. `pnpm test`, `pnpm typecheck` e `pnpm lint` passam (lint sem subir o teto de avisos).
4. **Auditor 10/10 em ordem**: `pnpm auditor` sem `falha` nem `atencao`, e `pnpm auditor --estrito` verde
   no CI ([07-auditor.md](../07-auditor.md)).
5. **Nenhuma recusa silenciosa**: toda recusa do banco aparece para a pessoa, no campo certo quando há
   campo, com a mensagem do item.
6. **Acessibilidade WCAG 2.2 AA** na parte tocada: operável só por teclado, foco visível, rótulo ligado a
   cada campo, erro ligado ao campo e anunciado pelo leitor de tela, contraste mínimo, alvo de toque
   generoso (o projeto usa 44 px), funciona com a letra ampliada e em tela de 375 px.
7. **Segurança**: tabela nova com RLS e políticas por módulo; função `security definer` nova sem
   EXECUTE para `anon`; mutação nova coberta pela trilha de auditoria.
8. **Migração idempotente** e registrada em [`supabase/README.md`](../../supabase/README.md).
9. **Documentação** atualizada: situação da regra no [catálogo](regras-de-negocio.md), linha do
   [inventário](inventario-funcional.md) e, se mudar o quadro, `src/data/andamento.json`. Mexeu numa
   história daqui, acerte `src/data/historias.json` no mesmo PR — o auditor reprova a divergência
   (`historias-conferem`).
10. **Entrada no topo de [`src/data/feed.json`](../../src/data/feed.json)**, no mesmo PR, em linguagem
    para leigo (regra do [auditor](../07-auditor.md#regra-de-processo-toda-entrega-anuncia-a-si-mesma)).
11. **Demonstrado à administradora** com dado real ou cópia fiel, e aceito por ela (Stare, 2014).

---

## Descartados

Itens tirados do backlog, com o motivo. Voltam se o contexto mudar.

| Item | Motivo |
| :-- | :-- |
| Estimativa de dano por evento climático em escala regional | Metodologia de Hanák e Korytárová (2014) serve a território, não a 14 imóveis; fica só o histórico de sinistros (B-36) |
| Valor do projeto por risco (RPV) | Sato (2014, lido o resumo) exige rede de atividades e probabilidades que a operação não tem |
| Geração de contrato a partir de modelo | Concorrente especializado já faz; a holding usa contrato do advogado. Reavaliar no próximo Goal |
| Análise de crédito do inquilino | Carteira pequena e estável; contratação por integração se a vacância crescer |
