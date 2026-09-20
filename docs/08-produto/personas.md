# Personas

> Cinco personas: quatro pessoas que usam o sistema e uma que não usa mas é afetada por ele. Os nomes
> e detalhes são **fictícios**; qualquer semelhança com pessoas reais é coincidência. Nenhum dado
> pessoal da família foi usado.
>
> Cada persona diz o **perfil de acesso** que teria no sistema como ele é hoje
> ([`src/lib/constants.ts`](../../src/lib/constants.ts) e a tabela `permissoes`,
> [migração 02](../../supabase/migrations/20260917120002_tabelas.sql)): perfil `administrador` ou
> `usuario`, e para o usuário um nível por módulo — `sem_acesso`, `visualizacao` ou `edicao`.

## Resumo

| Persona | Idade | Papel | Perfil no sistema | Frequência | O que mais pesa |
| :-- | :-- | :-- | :-- | :-- | :-- |
| [Seu Antônio](#1-seu-antônio--sócio-fundador) | 84 | Sócio-fundador | `usuario`, visualização em dashboards e relatórios | Mensal | Ver o resultado sem esforço |
| [Helena](#2-helena--sócia-administradora) | 52 | Sócia-administradora | `administrador` | Diária | Nada esquecido, pouca digitação |
| [Marcos](#3-marcos--assistente-administrativo) | 41 | Assistente administrativo (contratado) | `usuario`, edição em financeiro e extrato | Diária | Fila clara, sem retrabalho |
| [Dra. Rita](#4-dra-rita--contadora-externa) | 58 | Contadora externa | `usuario`, visualização no financeiro e relatórios | Mensal | Mês fechado e exportável |
| [Os inquilinos](#5-os-inquilinos--parte-interessada-não-usuária) | — | Locatários PF e PJ | **nenhum** (não usam) | — | Cobrança correta e explicada |

---

## 1. Seu Antônio — sócio-fundador

- **Quem é.** 84 anos, fundou a holding para organizar o patrimônio da família. Lê bem no papel, usa o
  celular para WhatsApp e fotos. Óculos de leitura; prefere letra grande.
- **O que quer.** Saber, uma vez por mês, **quanto entrou, quanto saiu e se algum imóvel está vago**.
  Não quer operar nada.
- **O que o frustra.** Ter de pedir o resultado; números que mudam depois de informados; tela com
  muita coisa.
- **Acesso sugerido.** `usuario` com `visualizacao` em `dashboards` e `relatorios`; `sem_acesso` no
  resto. Observação: os relatórios e dashboards leem as tabelas de origem pela RLS — sem
  `visualizacao` em `receitas`, `despesas`, `imoveis` e `contratos`, os gráficos dele ficam vazios. Por
  isso, na prática, o acesso de leitura precisa incluir esses módulos (ver RN-SEC-09 proposta em
  [regras](regras-de-negocio.md#rn-sec-09)).
- **O que o sistema já faz por ele.** Dashboards financeiro e de imóveis, relatórios em PDF, ajuste de
  tamanho da letra (quadro de andamento, item "Acessibilidade WCAG 2.2 AA").
- **O que falta.** Resultado do mês **chegando por e-mail** (pendente no quadro); números que não mudam
  depois do fechamento (proposta RN-FIN-12).
- **Plano de adoção.** Não aprender o sistema: receber o PDF. A tela é plano B, com a Helena ao lado na
  primeira vez (Haselberger e Motschnig, 2014: a mudança anda com um exemplo a seguir).

## 2. Helena — sócia-administradora

- **Quem é.** 52 anos, filha do fundador, administra os 14 imóveis da holding (fictício: 9 residenciais,
  3 salas comerciais, 1 loja, 1 galpão) no tempo livre da profissão dela. Confortável com computador,
  usa planilha há anos.
- **O que quer.** Que **o sistema lembre por ela**: aluguel que não entrou, contrato vencendo, reajuste,
  parcela de IPTU. Que o extrato do Itaú vire lançamento sem redigitar.
- **O que a frustra.** Lançar o aluguel duas vezes (previsto e recebido); descobrir em dezembro que um
  reajuste passou em abril; erro de sistema que "some" sem dizer o motivo.
- **Acesso.** `administrador` — edição em tudo, mais usuários e trilha de auditoria.
- **O que o sistema já faz por ela.** Cadastros completos, alertas de vencimento, importação de extrato
  com sugestão, feed de atividades ao vivo na tela Início, convites e permissões.
- **O que falta.** Receitas previstas geradas pelo contrato (RN-CTR-01), conciliação contra o previsto
  (RN-FIN-08), reajuste automático (RN-CTR-02), IPTU parcelado de uma vez (RN-IPTU-04).
- **Papel no produto.** É quem **confere cada entrega** com dado real antes de ela ser dada como pronta
  (Stare, 2014).

## 3. Marcos — assistente administrativo

- **Quem é.** 41 anos, contratado meio período. Faz os lançamentos, baixa boletos, importa o extrato
  toda segunda-feira.
- **O que quer.** Uma **fila** do que falta classificar, com a sugestão certa na maioria das vezes, e
  poder corrigir quando errar.
- **O que o frustra.** Não conseguir desfazer uma classificação errada; mensagem "tente novamente" sem
  dizer o quê.
- **Acesso sugerido.** `usuario` com `edicao` em `receitas`, `despesas`, `iptu_taxas`,
  `importar_extrato`, `classificar_transacoes` e `fornecedores`; `visualizacao` em `imoveis`,
  `inquilinos`, `contratos` e `alertas`; `sem_acesso` em `dashboards` e `relatorios` se a família
  preferir.
- **O que o sistema já faz por ele.** Importação atômica (se cair a conexão, nada fica pela metade),
  aviso de duplicata, classificação individual e em lote, ignorar e reabrir transação ignorada.
- **O que falta.** Desfazer classificação (RN-IMP-01), classificação que não falha nem duplica
  (RN-IMP-09), mensagem explicando por que não pode inativar um cadastro pela lista.

## 4. Dra. Rita — contadora externa

- **Quem é.** 58 anos, escritório de contabilidade que atende a holding e outras empresas. Recebe os
  números mensalmente para escrituração e apuração.
- **O que quer.** **Mês fechado** (que não muda depois), exportação em Excel, comprovante de cada
  lançamento, categorias estáveis. A partir de 2026, acompanhar o efeito do IBS/CBS.
- **O que a frustra.** Lançamento alterado depois que ela já escriturou; categoria diferente para a
  mesma coisa.
- **Acesso sugerido.** `usuario` com `visualizacao` em `receitas`, `despesas`, `iptu_taxas`,
  `contratos`, `imoveis` e `relatorios`. Nunca edição.
- **O que o sistema já faz por ela.** Relatórios financeiro, de contratos e de inadimplência em Excel e
  PDF; trilha de auditoria (lida pelo administrador) mostra quem mudou o quê; simulador IBS/CBS com
  laudo e base legal.
- **O que falta.** Fechamento de competência (RN-FIN-12); citação da LC 227/2026 no laudo (RT-09,
  em andamento no quadro).
- **Papel no produto.** Valida as regras fiscais e contábeis antes de serem implementadas.

## 5. Os inquilinos — parte interessada não usuária

- **Quem são.** Duas figuras típicas da carteira (fictícias):
  - **Carla**, 34 anos, pessoa física, aluga um apartamento de R$ 3.200,00, paga por PIX todo dia 10;
  - **Padaria Pão de Ontem Ltda.**, pessoa jurídica com **CNPJ alfanumérico** emitido em 2026, aluga a
    loja de R$ 8.500,00 com seguro-fiança.
- **Não usam o sistema.** Não têm login e não devem ter: o sistema é interno. Aparecem só como cadastro
  e como nome na descrição do PIX no extrato.
- **O que ganham com ele.** Cobrança certa no valor certo; reajuste aplicado na data e pelo índice do
  contrato, explicado; recibo discriminado (proposta RN-FIN-11); divergência de pagamento tratada cedo
  e registrada (du Preez, 2014).
- **O que temem.** Cobrança indevida; reajuste fora do combinado; exposição de CPF, RG e dados de
  contato.
- **Como o produto os protege.** Regras de reajuste e garantia com base na Lei do Inquilinato (seção de
  propostas em [regras](regras-de-negocio.md)); dados pessoais só para quem tem permissão no módulo
  `inquilinos` (RLS); proposta RN-INQ-06 de dados mínimos (LGPD).
