# Histórias de usuário e cenários

> **Desde 23/09/2026 as histórias vivem no Quadro de histórias do sistema** (menu lateral e página inicial;
> qualquer pessoa lê, e edita quem tem o módulo "Quadro de histórias"). Lá cada história tem o "Eu, quero, para", os
> critérios em BDD, observações e atividades, em cinco colunas: Backlog, Desenvolvimento, Teste,
> Homologação e Concluído. Este documento é o **registro de origem** de H-01 a H-24: a carga inicial
> ([`…_carga_do_quadro.sql`](../../supabase/migrations/20260923120003_carga_do_quadro.sql)) as levou
> com o mesmo número e título, e acrescentou H-25 a H-59 — o que o sistema já fazia sem história e o
> que o backlog tinha sem história. **Mudança de história se faz no quadro, não aqui.**

> Histórias no formato **"Como ‹persona›, quero ‹ação›, para ‹valor›"**, cada uma checada por
> **INVEST** e com critérios de aceitação em **Gherkin em português**. As personas estão em
> [personas.md](personas.md); as regras citadas, em [regras-de-negocio.md](regras-de-negocio.md).

## Como ler

- **Implementada** — a história descreve o que o sistema já faz. Os cenários batem com o comportamento
  real e as mensagens entre aspas são as do código ([`erros.ts`](../../src/lib/dados/erros.ts),
  [`esquemas.ts`](../../src/lib/validacao/esquemas.ts), telas em [`src/pages/`](../../src/pages)). Servem de
  roteiro de teste de regressão.
- **Proposta** — o comportamento desejado; mensagens entre aspas são sugestão de texto.
- **Etiquetas** nos cenários: `@implementado`, `@proposto`, `@lacuna` (o sistema hoje faz diferente
  do desejado — o cenário descreve o **hoje**, e o `@proposto` seguinte descreve o desejado),
  `@defeito-provavel` (achado deste levantamento, a confirmar), `@decisao-pendente` (depende de uma
  decisão do dono — ver [backlog](backlog.md#decisões-pendentes-do-dono)).
- Datas em 2026; "hoje" é 19/09/2026 quando não dito o contrário. Nomes, documentos e valores são
  fictícios. O CPF 123.456.789-09 e o CNPJ alfanumérico 12.ABC.345/01DE-35 são exemplos de
  documentação amplamente usados (o segundo é o exemplo oficial da Receita citado nos testes).

## Checagem INVEST

**I**ndependente · **N**egociável · **V**aliosa · **E**stimável · **S**mall (pequena) · **T**estável.
✓ atende; ⚠ atende com ressalva (explicada).

| ID | História | Situação | I | N | V | E | S | T | Ressalva |
| :-- | :-- | :-- | :-: | :-: | :-: | :-: | :-: | :-: | :-- |
| H-01 | Inativar imóvel vendido | implementada + proposta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-02 | Imóvel vago em reforma | implementada + proposta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-03 | Cadastrar inquilino pessoa física | implementada | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-04 | Cadastrar inquilino com CNPJ alfanumérico | implementada | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-05 | Inativar inquilino que saiu | implementada + proposta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-06 | Contrato novo sem sobrepor o anterior | implementada | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-07 | Imóvel acompanha o contrato | implementada | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-08 | Aluguéis previstos gerados pelo contrato | proposta | ✓ | ⚠ | ✓ | ✓ | ✓ | ✓ | N: forma do 1º mês depende da decisão D-01 |
| H-09 | Reajuste anual pelo índice | proposta | ⚠ | ⚠ | ✓ | ⚠ | ⚠ | ✓ | I: depende de H-08 para ajustar previstas; N: D-02; E/S: coleta de índice é integração nova — fatiar em "cálculo com índice digitado" e "coleta automática" |
| H-10 | Garantia coerente e caução até 3 aluguéis | implementada + proposta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-11 | Uma garantia por contrato | implementada | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-12 | Multa proporcional na saída antecipada | proposta | ✓ | ⚠ | ✓ | ✓ | ✓ | ✓ | N: forma de contagem a confirmar com advogado (D-04) |
| H-13 | Situação do aluguel sem digitar | implementada | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-14 | IPTU parcelado em 10 vezes | implementada + proposta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-15 | Importar o extrato OFX do Itaú | implementada + proposta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-16 | Classificar o PIX do inquilino | implementada, com defeito provável | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-17 | Conciliar o PIX com o aluguel previsto | proposta | ⚠ | ✓ | ✓ | ⚠ | ⚠ | ✓ | I: depende de H-08 e de B-01; E/S: fatiar em "casamento exato" e "parcial com saldo" |
| H-18 | Desfazer uma classificação errada | proposta | ⚠ | ✓ | ✓ | ✓ | ✓ | ✓ | I: depende de B-01 (classificação atômica) |
| H-19 | Contadora com acesso só de leitura | implementada + proposta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-20 | Convidar quem vai usar | implementada + proposta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-21 | Saber quem mudou o valor do aluguel | implementada | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-22 | Resultado do mês para o sócio | implementada + proposta | ✓ | ✓ | ✓ | ⚠ | ⚠ | ✓ | E/S: e-mail depende do SMTP próprio (B-05); fatiar fechamento (RN-FIN-12) e envio (RN-REL-02) |
| H-23 | Ser avisada antes do vencimento | implementada + proposta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| H-24 | Saber se a holding paga IBS/CBS | implementada + proposta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |

---

## Cadastros

### H-01 — Inativar imóvel vendido

> **Como** Helena, **quero** inativar um imóvel que a holding vendeu, **para** que ele saia das listas
> e dos relatórios sem perder o histórico.

Regras: RN-IMV-02, RN-AUD-01. Backlog: B-14 (mensagem), B-04 (teste de banco).

```gherkin
# language: pt
Funcionalidade: Inativar imóvel
  Imóvel com contrato em vigor não pode sair das listas, senão o contrato fica apontando
  para algo que ninguém vê.

  Contexto:
    Dado que Helena está no sistema como administradora
    E o imóvel "Sala 5 — Ed. Central" está "Vago" e não tem contrato ativo
    E o imóvel "Apto 302 — Rua das Acácias, 120" está "Alugado" pelo contrato "2026/003", ativo de 01/04/2026 a 31/03/2029, de Carla Mendes

  @implementado
  Cenário: Inativar imóvel sem contrato ativo
    Quando Helena escolhe "Inativar" na linha da "Sala 5 — Ed. Central" e confirma
    Então aparece a mensagem "Imóvel marcado como inativo."
    E a "Sala 5 — Ed. Central" passa a "Inativo"
    E a trilha de auditoria registra que Helena editou o imóvel, com a situação de "vago" para "inativo"

  @implementado
  Cenário: O banco recusa inativar imóvel com contrato ativo, por qualquer caminho
    Quando um pedido para mudar a situação do "Apto 302" para "inativo" chega ao banco
    Então o banco recusa com "Este imóvel tem contrato ativo e não pode ser inativado. Encerre ou cancele o contrato antes."
    E o "Apto 302" continua "Alugado"

  @implementado
  Cenário: O banco recusa excluir imóvel com contrato ativo
    Quando um pedido para excluir o "Apto 302" chega ao banco
    Então o banco recusa com "Este imóvel tem contrato ativo e não pode ser excluído. Encerre ou cancele o contrato antes."

  @lacuna
  Cenário: Hoje, pela lista, o motivo da recusa não aparece
    Quando Helena escolhe "Inativar" na linha do "Apto 302" e confirma
    Então aparece a mensagem "Não foi possível inativar o imóvel. Tente novamente."
    Mas a mensagem não diz que há contrato ativo nem o que fazer

  @lacuna
  Cenário: Hoje, pelo formulário, nenhuma mensagem aparece
    Quando Helena abre o "Apto 302" para edição, muda o Status para "Inativo" e salva
    Então o formulário continua aberto
    Mas nenhuma mensagem é mostrada

  @proposto
  Cenário: A recusa explica o motivo, pela lista e pelo formulário
    Quando Helena tenta inativar o "Apto 302" pela lista ou pelo formulário
    Então aparece "Este imóvel tem contrato ativo e não pode ser inativado. Encerre ou cancele o contrato antes."
    E no formulário a mensagem fica embaixo do campo Status e é anunciada pelo leitor de tela

  @implementado
  Cenário: Depois de encerrar o contrato, o imóvel pode ser inativado
    Dado que o contrato "2026/003" foi encerrado
    Quando Helena escolhe "Inativar" na linha do "Apto 302" e confirma
    Então aparece a mensagem "Imóvel marcado como inativo."
```

### H-02 — Imóvel vago em reforma

> **Como** Helena, **quero** marcar a casa vazia como "em manutenção" e lançar os gastos da reforma,
> **para** saber quanto a vacância custou e não alugá-la antes de ficar pronta.

Regras: RN-IMV-01, RN-FIN-03, RN-IMV-05 (proposta). Backlog: B-26.

```gherkin
# language: pt
Funcionalidade: Imóvel em reforma

  Contexto:
    Dado que a "Casa — Rua dos Ipês, 45" ficou vaga em 31/05/2026
    E Helena mudou a situação dela para "Em manutenção" em 03/06/2026
    E o fornecedor "Construtora Bom Lar Ltda." está cadastrado

  @implementado
  Cenário: Lançar a despesa da reforma já paga
    Quando Marcos lança uma despesa para a "Casa — Rua dos Ipês, 45" com
      | campo          | valor                      |
      | categoria      | Reforma                    |
      | fornecedor     | Construtora Bom Lar Ltda.  |
      | valor previsto | 18.400,00                  |
      | vencimento     | 15/07/2026                 |
      | valor pago     | 18.400,00                  |
      | data pagamento | 15/07/2026                 |
    Então a despesa fica com a situação "Pago"
    E o painel financeiro mostra R$ 18.400,00 em "Despesas por Imóvel" para a casa em julho de 2026

  @implementado
  Cenário: Hoje, ativar contrato muda a situação sem avisar
    Quando Helena cadastra um contrato ativo para a "Casa — Rua dos Ipês, 45" com início em 01/10/2026
    Então a casa passa de "Em manutenção" para "Alugado" sem nenhum aviso

  @proposto
  Cenário: Ativar contrato em imóvel em manutenção pede confirmação
    Quando Helena salva um contrato ativo para a "Casa — Rua dos Ipês, 45"
    Então o sistema pergunta "Este imóvel está em manutenção. Ele já pode ser alugado?"
    E só depois da confirmação a casa passa a "Alugado"
    Mas se Helena responder "Não", o contrato não é salvo e nada muda

  @implementado
  Cenário: Encerrado o contrato, o imóvel volta a vago, e não a em manutenção
    Dado que a casa está "Alugado" pelo contrato "2026/019"
    Quando Helena encerra o contrato "2026/019"
    Então a casa passa a "Vago"
```

### H-03 — Cadastrar inquilino pessoa física

> **Como** Helena, **quero** cadastrar a inquilina com CPF conferido, **para** não emitir contrato nem
> recibo com documento errado.

Regras: RN-INQ-02, RN-INQ-04, RN-INQ-05.

```gherkin
# language: pt
Funcionalidade: Cadastro de inquilino pessoa física

  Contexto:
    Dado que Helena abre "Novo inquilino" e escolhe "Pessoa Física"
    E preenche o nome "Carla Mendes"

  @implementado
  Esquema do Cenário: Conferência do CPF antes de salvar
    Quando Helena informa o CPF "<cpf>" e salva
    Então <resultado>

    Exemplos:
      | cpf            | resultado                                                                                              |
      | 123.456.789-09 | o inquilino é cadastrado e aparece "Inquilino cadastrado com sucesso."                                 |
      | 12345678909    | o inquilino é cadastrado e aparece "Inquilino cadastrado com sucesso."                                 |
      | 123.456.789-00 | embaixo do CPF aparece "Este CPF não é válido. Confira os 11 números, por exemplo 123.456.789-09."     |
      | 111.111.111-11 | embaixo do CPF aparece "Este CPF não é válido. Confira os 11 números, por exemplo 123.456.789-09."     |
      |                | embaixo do CPF aparece "Informe o CPF do inquilino."                                                   |

  @implementado
  Cenário: CPF já cadastrado para outra pessoa
    Dado que já existe o inquilino "Carla M. Souza" com o CPF "123.456.789-09"
    Quando Helena informa o CPF "123.456.789-09" e salva
    Então embaixo do CPF aparece "Já existe um inquilino com este CPF."

  @implementado
  Cenário: E-mail incompleto
    Quando Helena informa o CPF "123.456.789-09", o e-mail "carla.mendes@" e salva
    Então embaixo do e-mail aparece "Este e-mail parece incompleto. Confira se tem o @ e o domínio, como nome@exemplo.com.br."

  @implementado
  Cenário: Nome em branco
    Dado que Helena apagou o nome
    Quando ela informa o CPF "123.456.789-09" e salva
    Então embaixo do nome aparece "Informe o nome do inquilino."
```

### H-04 — Cadastrar inquilino com CNPJ alfanumérico

> **Como** Helena, **quero** cadastrar a padaria que tem CNPJ com letras, **para** alugar a loja a uma
> empresa aberta depois de julho de 2026.

Regras: RN-INQ-03, RN-INQ-04.

```gherkin
# language: pt
Funcionalidade: Cadastro de inquilino pessoa jurídica

  Contexto:
    Dado que Helena abre "Novo inquilino" e escolhe "Pessoa Jurídica"
    E preenche a razão social "Padaria Pão de Ontem Ltda."

  @implementado
  Esquema do Cenário: CNPJ numérico e alfanumérico
    Quando Helena informa o CNPJ "<cnpj>" e salva
    Então <resultado>

    Exemplos:
      | cnpj               | resultado                                                                                                   |
      | 12.ABC.345/01DE-35 | o inquilino é cadastrado                                                                                    |
      | 12ABC34501DE35     | o inquilino é cadastrado                                                                                    |
      | 12.abc.345/01de-35 | o inquilino é cadastrado (letras minúsculas valem como maiúsculas)                                          |
      | 12.345.678/0001-95 | o inquilino é cadastrado                                                                                    |
      | 12.ABC.345/01DE-36 | embaixo do CNPJ aparece "Este CNPJ não é válido. Confira os 14 caracteres, por exemplo 12.345.678/0001-95." |
      | 00.000.000/0000-00 | embaixo do CNPJ aparece "Este CNPJ não é válido. Confira os 14 caracteres, por exemplo 12.345.678/0001-95." |

  @implementado
  Cenário: Razão social em branco
    Dado que Helena apagou a razão social
    Quando ela informa o CNPJ "12.ABC.345/01DE-35" e salva
    Então embaixo da razão social aparece "Informe a razão social da empresa."

  @implementado
  Cenário: O banco confere o CNPJ mesmo sem passar pela tela
    Quando um cadastro com o CNPJ "12.ABC.345/01DE-36" chega ao banco por outro caminho
    Então o banco recusa, e a tela traduz para "CNPJ inválido. Confira os caracteres digitados."
```

### H-05 — Inativar inquilino que saiu

> **Como** Helena, **quero** inativar o inquilino que devolveu o imóvel, **para** que a lista mostre só
> quem está com a holding.

Regras: RN-INQ-01. Backlog: B-14.

```gherkin
# language: pt
Funcionalidade: Inativar inquilino

  Contexto:
    Dado que Roberto Lima tem o contrato "2024/007" ativo no "Apto 101"

  @lacuna
  Cenário: Hoje, inativar com contrato ativo mostra mensagem genérica
    Quando Helena escolhe "Inativar" na linha de Roberto Lima e confirma
    Então aparece "Não foi possível inativar o inquilino. Tente novamente."
    E Roberto Lima continua ativo

  @proposto
  Cenário: A recusa explica o motivo
    Quando Helena escolhe "Inativar" na linha de Roberto Lima e confirma
    Então aparece "Este inquilino tem contrato ativo e não pode ser inativado. Encerre ou cancele o contrato antes."
    E aparece um atalho para o contrato "2024/007"

  @implementado
  Cenário: Depois de encerrar o contrato
    Dado que Helena encerrou o contrato "2024/007"
    Quando Helena escolhe "Inativar" na linha de Roberto Lima e confirma
    Então aparece "Inquilino marcado como inativo."
```

---

## Contratos

### H-06 — Contrato novo sem sobrepor o anterior

> **Como** Helena, **quero** cadastrar o contrato do novo inquilino no dia seguinte ao fim do anterior,
> **para** não haver dois inquilinos no mesmo imóvel ao mesmo tempo.

Regras: RN-CTR-03, RN-CTR-04, RN-CTR-05, RN-CTR-06, RN-FIN-06. Backlog: B-04, B-14.

```gherkin
# language: pt
Funcionalidade: Vigência de contratos no mesmo imóvel

  Contexto:
    Dado que o "Apto 302" tem o contrato "2023/021" de Roberto Lima, ativo de 01/04/2023 a 31/03/2026
    E Helena está cadastrando o contrato de Carla Mendes para o "Apto 302", com aluguel de R$ 3.200,00, vencimento no dia 10 e situação "Ativo"

  @implementado
  Esquema do Cenário: Início do novo contrato em relação ao fim do anterior
    Quando Helena informa início em <inicio> e término em <fim> e salva
    Então <resultado>

    Exemplos:
      | inicio     | fim        | resultado                                                                          |
      | 01/04/2026 | 31/03/2029 | o contrato é cadastrado e aparece "Contrato cadastrado com sucesso."               |
      | 31/03/2026 | 30/03/2029 | embaixo do imóvel aparece "Este imóvel já tem um contrato ativo nesse período."     |
      | 15/03/2026 | 14/03/2029 | embaixo do imóvel aparece "Este imóvel já tem um contrato ativo nesse período."     |

  @implementado
  Cenário: Contrato anterior encerrado não bloqueia
    Dado que Helena encerrou o contrato "2023/021"
    Quando Helena informa início em 20/03/2026 e término em 19/03/2029 e salva
    Então o contrato é cadastrado

  @implementado
  Cenário: Contrato futuro já assinado é aceito
    Quando Helena cadastra, em 19/09/2026, um contrato ativo para a "Sala 5 — Ed. Central" com início em 01/11/2026
    Então o contrato é cadastrado

  @implementado
  Cenário: Término antes do início
    Quando Helena informa início em 01/04/2026 e término em 31/03/2026 e salva
    Então embaixo do término aparece "A data de término não pode ser anterior à data de início. Confira as duas datas."

  @implementado
  Cenário: Término no mesmo dia do início é aceito
    Quando Helena informa início e término em 01/04/2026 e salva
    Então nenhuma mensagem de data aparece

  @implementado
  Cenário: Dia de vencimento fora do mês
    Quando Helena informa o dia de vencimento "32" e salva
    Então embaixo do dia de vencimento aparece "O dia de vencimento precisa estar entre 1 e 31."

  @implementado
  Cenário: Ano digitado errado
    Quando Helena informa início em 01/04/0226 e salva
    Então embaixo do início aparece "Data fora do intervalo aceito. Confira o ano digitado."

  @lacuna
  Cenário: Hoje, reajuste antes do início é recusado sem mensagem
    Quando Helena informa início em 01/04/2026, próxima data de reajuste em 01/03/2026 e salva
    Então o banco recusa e o formulário continua aberto
    Mas nenhuma mensagem é mostrada

  @proposto
  Cenário: Reajuste antes do início mostra o motivo
    Quando Helena informa início em 01/04/2026, próxima data de reajuste em 01/03/2026 e salva
    Então embaixo da próxima data de reajuste aparece "O reajuste não pode ser antes do início do contrato."
```

### H-07 — Imóvel acompanha o contrato

> **Como** Helena, **quero** que o imóvel mude de "vago" para "alugado" sozinho quando o contrato
> começa e volte quando ele termina, **para** o painel de ocupação estar sempre certo.

Regras: RN-IMV-01.

```gherkin
# language: pt
Funcionalidade: Situação do imóvel segue o contrato

  @implementado
  Cenário: Contrato ativo aluga o imóvel
    Dado que o "Apto 302" está "Vago"
    Quando Helena cadastra o contrato "2026/003" ativo para Carla Mendes no "Apto 302"
    Então o "Apto 302" passa a "Alugado"
    E o inquilino atual do "Apto 302" é Carla Mendes

  @implementado
  Cenário: Encerrar o contrato devolve o imóvel a vago
    Dado que o "Apto 302" está "Alugado" pelo contrato "2026/003"
    Quando Helena escolhe "Encerrar" no contrato "2026/003" e confirma em "Encerrar este contrato?"
    Então o "Apto 302" passa a "Vago" e fica sem inquilino atual

  @implementado
  Cenário: Trocar o imóvel de um contrato ativo libera o antigo
    Dado que o contrato "2026/003" foi cadastrado por engano no "Apto 301"
    Quando Helena corrige o imóvel do contrato para "Apto 302"
    Então o "Apto 301" volta a "Vago"
    E o "Apto 302" passa a "Alugado"
```

### H-08 — Aluguéis previstos gerados pelo contrato

> **Como** Helena, **quero** que ao ativar o contrato o sistema já crie os aluguéis previstos de cada
> mês, **para** não lançar à mão e ser avisada quando um não entrar.

Regras: RN-CTR-01, RN-CTR-13. Backlog: B-06.

```gherkin
# language: pt
Funcionalidade: Receitas previstas do contrato

  Contexto:
    Dado que Helena cadastra o contrato "2026/003" ativo do "Apto 302" para Carla Mendes, de 01/04/2026 a 31/03/2029, aluguel de R$ 3.200,00 com vencimento no dia 10

  @proposto
  Cenário: Uma receita prevista por mês de vigência
    Quando o contrato é salvo
    Então existem 36 receitas "Previsto" de R$ 3.200,00 na categoria "Aluguel", ligadas ao contrato
    E a primeira tem competência "2026-04" e vencimento em 10/04/2026
    E a última tem competência "2029-03" e vencimento em 10/03/2029

  @proposto
  Cenário: Dia de vencimento que não existe no mês
    Dado que o dia de vencimento do contrato é 31
    Quando o contrato é salvo
    Então a receita de competência "2027-02" vence em 28/02/2027
    E a de competência "2026-04" vence em 30/04/2026

  @proposto @decisao-pendente
  Esquema do Cenário: Primeiro mês quando o contrato começa depois do dia de vencimento
    Dado que o contrato começa em 15/04/2026
    E a regra escolhida pelo dono para o primeiro mês é "<regra>"
    Quando o contrato é salvo
    Então a primeira receita é <primeira>

    Exemplos:
      | regra        | primeira                                                                   |
      | proporcional | de R$ 1.706,67 (16 de 30 dias), competência "2026-04", vencimento 10/05/2026 |
      | mês cheio    | de R$ 3.200,00, competência "2026-05", vencimento 10/05/2026                 |

  @proposto
  Cenário: Encerrar antes do fim cancela o que ainda não venceu
    Dado que as receitas até a competência "2026-09" foram recebidas
    Quando Helena encerra o contrato com data de saída em 30/09/2026
    Então as receitas previstas das competências "2026-10" em diante ficam "Cancelado"
    Mas as receitas já recebidas não mudam
    E a trilha registra cada cancelamento
```

### H-09 — Reajuste anual pelo índice

> **Como** Helena, **quero** que o sistema calcule o reajuste no aniversário do contrato e me peça para
> confirmar, **para** não perder reajuste nem cobrar errado.

Regras: RN-CTR-02, RN-CTR-09. Backlog: B-08a e B-08b. Fatiamento: (1) índice digitado pela Helena;
(2) coleta automática do índice.

```gherkin
# language: pt
Funcionalidade: Reajuste anual

  @proposto
  Esquema do Cenário: Novo valor no aniversário
    Dado que o contrato "<contrato>" tem aluguel de <atual>, índice "<indice>" e aniversário em <aniversario>
    E o <indice> acumulado nos 12 meses anteriores publicados é <acumulado>
    Quando chega o dia <aniversario>
    Então o sistema propõe o novo aluguel de <novo> e aguarda a confirmação de Helena

    Exemplos:
      | contrato | atual       | indice | aniversario | acumulado | novo        |
      | 2025/004 | R$ 3.200,00 | IGP-M  | 01/04/2026  | 3,15%     | R$ 3.300,80 |
      | 2024/011 | R$ 2.850,00 | IPCA   | 01/10/2026  | 4,50%     | R$ 2.978,25 |

  @proposto
  Cenário: Confirmado, o reajuste vale dali em diante
    Dado a proposta de R$ 3.300,80 para o contrato "2025/004"
    Quando Helena confirma
    Então o aluguel do contrato passa a R$ 3.300,80
    E as receitas previstas a partir da competência "2026-04" ainda sem baixa passam a R$ 3.300,80
    E a próxima data de reajuste passa a 01/04/2027
    E o reajuste fica registrado com valor anterior, índice, percentual, valor novo e quem confirmou

  @proposto
  Cenário: Índice do mês ainda não publicado
    Dado que o aniversário é 01/10/2026 e o IPCA de setembro de 2026 ainda não foi publicado
    Quando chega o dia 01/10/2026
    Então o contrato aparece em Alertas como "Reajuste aguardando índice"
    Mas nenhum valor é estimado nem aplicado

  @proposto @decisao-pendente
  Cenário: Índice acumulado negativo
    Dado que o IGP-M acumulado para o contrato "2023/015", de R$ 8.500,00, é -1,20%
    Quando chega o aniversário
    Então o sistema segue a regra escolhida pelo dono para deflação (manter R$ 8.500,00 ou reduzir para R$ 8.398,00)
    E mostra à Helena qual regra foi aplicada

  @proposto
  Esquema do Cenário: Periodicidade e índice aceitos
    Quando Helena informa o índice "<indice>" com periodicidade de <meses> meses e salva
    Então <resultado>

    Exemplos:
      | indice                   | meses | resultado                                                                                   |
      | IGP-M                    | 12    | o contrato é salvo                                                                          |
      | IPCA                     | 6     | aparece "O reajuste precisa ser de pelo menos 12 em 12 meses (Lei 10.192/2001)."            |
      | variação do dólar        | 12    | o índice não está na lista de opções                                                        |
```

### H-10 — Garantia coerente e caução até 3 aluguéis

> **Como** Helena, **quero** que o sistema confira o valor da garantia, **para** não aceitar caução acima
> do que a lei permite nem guardar valor em contrato "sem garantia".

Regras: RN-CTR-10, RN-CTR-11. Backlog: B-10.

```gherkin
# language: pt
Funcionalidade: Valor da garantia

  Contexto:
    Dado que Helena cadastra um contrato com aluguel de R$ 3.200,00

  @proposto
  Esquema do Cenário: Caução em dinheiro
    Quando Helena escolhe a garantia "Caução" com valor <valor> e salva
    Então <resultado>

    Exemplos:
      | valor       | resultado                                                                                                  |
      | R$ 9.600,00 | o contrato é salvo                                                                                         |
      | R$ 6.400,00 | o contrato é salvo                                                                                         |
      | R$ 9.600,01 | embaixo do valor aparece "A caução em dinheiro não pode passar de 3 aluguéis (R$ 9.600,00). Lei do Inquilinato, art. 38." |
      | vazio       | embaixo do valor aparece "Informe o valor da caução."                                                      |

  @proposto
  Cenário: Sem garantia não guarda valor
    Quando Helena escolhe "Sem garantia" com valor R$ 9.600,00 e salva
    Então embaixo do valor aparece "Contrato sem garantia não tem valor de garantia. Apague o valor ou escolha a modalidade."

  @implementado
  Cenário: Hoje o valor da garantia só é conferido como não negativo
    Quando Helena escolhe "Caução" com valor R$ 20.000,00 e salva
    Então o contrato é salvo
```

### H-11 — Uma garantia por contrato

> **Como** Helena, **quero** registrar uma única modalidade de garantia por contrato, **para** o contrato
> não ter cláusula nula.

Regras: RN-CTR-07.

```gherkin
# language: pt
Funcionalidade: Modalidade de garantia

  @implementado
  Cenário: A modalidade é escolha única
    Quando Helena abre o campo "Tipo de garantia" do contrato
    Então as opções são "Caução", "Fiador", "Seguro-fiança", "Título de capitalização", "Sem garantia" e "Outros"
    E só uma pode ficar escolhida

  @implementado
  Cenário: Trocar a modalidade substitui a anterior
    Dado que o contrato "2024/011" da Padaria Pão de Ontem Ltda. tem garantia "Seguro-fiança"
    Quando Helena muda a garantia para "Fiador" e salva
    Então o contrato fica só com "Fiador"
    E a trilha registra a troca de "seguro-fiança" para "fiador"
```

### H-12 — Multa proporcional na saída antecipada

> **Como** Helena, **quero** que o sistema calcule a multa quando o inquilino sai antes do prazo,
> **para** cobrar o valor que a lei permite, sem conta de cabeça.

Regras: RN-CTR-12. Backlog: B-17.

```gherkin
# language: pt
Funcionalidade: Multa por devolução antecipada

  Contexto:
    Dado o contrato "2025/009" de 30 meses, aluguel de R$ 3.000,00 e multa pactuada de 3 aluguéis (R$ 9.000,00)

  @proposto @decisao-pendente
  Esquema do Cenário: Multa proporcional ao que falta cumprir
    Quando o inquilino devolve o imóvel depois de cumprir <cumpridos> meses
    Então a multa calculada é <multa>
    E ela é lançada como receita na categoria "Multa", ligada ao contrato

    Exemplos:
      | cumpridos | multa       |
      | 6         | R$ 7.200,00 |
      | 12        | R$ 5.400,00 |
      | 29        | R$ 300,00   |
      | 30        | R$ 0,00     |

  @proposto
  Cenário: Transferência pelo empregador dispensa a multa
    Dado que o inquilino foi transferido pelo empregador para outra cidade
    E avisou por escrito com 35 dias de antecedência
    Quando Helena registra a devolução com o motivo "Transferência pelo empregador"
    Então a multa calculada é R$ 0,00
    E o aviso por escrito fica anexado ao contrato
```

---

## Financeiro

### H-13 — Situação do aluguel sem digitar

> **Como** Marcos, **quero** que a situação do lançamento se ajuste sozinha pelo valor recebido e pela
> data, **para** não marcar "recebido" por engano.

Regras: RN-FIN-01, RN-FIN-02, RN-FIN-03.

```gherkin
# language: pt
Funcionalidade: Situação derivada da receita

  Contexto:
    Dado que hoje é 19/09/2026
    E há uma receita de aluguel do "Apto 302" com valor previsto de R$ 3.200,00

  @implementado
  Esquema do Cenário: Situação calculada a cada gravação
    Dado que o vencimento é <vencimento> e o valor recebido é <recebido>
    Quando Marcos salva a receita
    Então a situação fica "<situacao>"

    Exemplos:
      | vencimento | recebido    | situacao  |
      | 10/09/2026 | R$ 3.200,00 | Recebido  |
      | 10/09/2026 | R$ 3.500,00 | Recebido  |
      | 10/09/2026 | R$ 1.600,00 | Parcial   |
      | 10/09/2026 | vazio       | Em atraso |
      | 19/09/2026 | vazio       | Previsto  |
      | 10/10/2026 | vazio       | Previsto  |

  @implementado
  Cenário: A situação enviada pela tela é ignorada
    Dado que o vencimento é 10/10/2026 e não há valor recebido
    Quando a receita chega ao banco com a situação "Recebido"
    Então ela é gravada como "Previsto"

  @implementado
  Cenário: A varredura da madrugada marca o atraso
    Dado que a receita vence em 19/09/2026, está "Previsto" e não recebeu nada
    Quando a varredura diária roda às 02:00 de 20/09/2026
    Então a receita passa a "Em atraso"
    E aparece em Alertas no filtro de vencidos
```

### H-14 — IPTU parcelado em 10 vezes

> **Como** Helena, **quero** lançar o IPTU do ano em 10 parcelas de uma vez, **para** não digitar dez
> registros por imóvel e ser avisada de cada vencimento.

Regras: RN-IPTU-01, RN-IPTU-02, RN-IPTU-04. Backlog: B-09.

```gherkin
# language: pt
Funcionalidade: IPTU e taxas

  @proposto
  Cenário: Parcelamento com diferença de centavos na última parcela
    Quando Helena lança o IPTU 2027 do "Apto 302", total de R$ 2.487,53, em 10 parcelas, a primeira vencendo em 10/02/2027
    Então são criadas 10 obrigações do tipo "IPTU" com vencimentos de 10/02/2027 a 10/11/2027
    E as 9 primeiras são de R$ 248,75 e a última de R$ 248,78
    E a soma das 10 é R$ 2.487,53

  @proposto
  Cenário: Cota única
    Quando Helena lança o IPTU 2027 da "Sala 5 — Ed. Central", total de R$ 1.940,00, em cota única com vencimento em 10/02/2027
    Então é criada 1 obrigação de R$ 1.940,00

  @implementado
  Cenário: Parcela paga
    Dado a parcela "IPTU 2026 — 7/10" do "Apto 302", de R$ 248,75, com vencimento em 10/08/2026
    Quando Marcos informa a data de pagamento 08/08/2026 e salva
    Então a parcela fica "Pago"

  @implementado
  Cenário: Parcela vencida sem pagamento
    Dado a parcela "IPTU 2026 — 8/10" do "Apto 302", com vencimento em 10/09/2026 e sem data de pagamento
    Quando a varredura diária roda
    Então a parcela fica "Vencido"

  @implementado
  Cenário: Descrição obrigatória
    Quando Marcos tenta salvar uma obrigação sem descrição
    Então embaixo da descrição aparece 'Descreva a obrigação, por exemplo "IPTU 2025 — cota única".'
```

---

## Extrato bancário

### H-15 — Importar o extrato OFX do Itaú

> **Como** Marcos, **quero** importar o extrato OFX da conta do Itaú, **para** não digitar os PIX
> recebidos e as contas pagas.

Regras: RN-IMP-02, RN-IMP-04 a RN-IMP-08, RN-IMP-10 (proposta). Backlog: B-04, B-12.

```gherkin
# language: pt
Funcionalidade: Importação de extrato

  Contexto:
    Dado que a conta "Itaú — Conta Corrente PJ" está cadastrada
    E Marcos tem edição em "Importar Extrato" e em "Classificar Transações"
    E o arquivo "extrato-itau-2026-09.ofx" tem 38 lançamentos de 01/09/2026 a 18/09/2026, entre eles "PIX RECEBIDO CARLA MENDES" de R$ 3.200,00 em 10/09/2026

  @implementado
  Cenário: Importação completa
    Quando Marcos envia o arquivo, escolhe a conta "Itaú — Conta Corrente PJ" e confirma
    Então aparece "Importação de 38 transações concluída. Levando você para a tela de classificação."
    E as 38 transações aparecem como pendentes na fila de classificação
    E o histórico mostra a importação com 38 transações

  @implementado
  Cenário: A conexão cai no meio da gravação
    Quando Marcos confirma a importação e a conexão cai enquanto o banco grava
    Então aparece uma mensagem que começa com "Nenhuma transação foi salva."
    E o histórico não mostra importação nova
    E ao importar o mesmo arquivo de novo entram as 38 transações, uma vez só

  @implementado
  Cenário: Sem conta de origem
    Quando Marcos confirma a importação sem escolher a conta
    Então aparece "Selecione uma conta bancária de origem."

  @implementado
  Esquema do Cenário: Arquivo em formato não aceito
    Quando Marcos <acao> o arquivo "extrato-itau-2026-09.pdf"
    Então aparece "<mensagem>"

    Exemplos:
      | acao                    | mensagem                                            |
      | escolhe pelo botão      | Formato não aceito. Envie um arquivo .CSV ou .OFX.  |
      | arrasta para a área de envio | Só são aceitos arquivos .CSV e .OFX.                |

  @implementado
  Cenário: Extrato grande demais
    Dado um arquivo com 5001 transações selecionadas
    Quando Marcos confirma a importação
    Então aparece "Foram selecionadas 5001 transações, e o limite por importação é de 5000. Divida o arquivo por período e importe cada parte."
    E nada é enviado ao banco

  @implementado
  Esquema do Cenário: Aviso de transação já importada
    Dado que uma importação anterior já trouxe "PIX RECEBIDO CARLA MENDES", crédito de R$ 3.200,00 em 10/09/2026
    Quando o novo arquivo tem "<descricao>", <sentido> de <valor> em <data>
    Então a linha <aviso> marcada como possível duplicata

    Exemplos:
      | descricao                  | sentido | valor       | data       | aviso   |
      | PIX RECEBIDO CARLA MENDES  | crédito | R$ 3.200,00 | 10/09/2026 | fica    |
      | PIX RECEBIDO CARLA M       | crédito | R$ 3.200,00 | 10/09/2026 | fica    |
      | PIX RECEBIDO CARLA MENDES  | crédito | R$ 3.200,10 | 10/09/2026 | não fica |
      | PIX RECEBIDO CARLA MENDES  | crédito | R$ 3.200,00 | 11/09/2026 | não fica |
      | PIX ENVIADO CARLA MENDES   | débito  | R$ 3.200,00 | 10/09/2026 | não fica |

  @implementado
  Cenário: Desmarcar as duplicadas
    Dado que 1 linha do arquivo foi marcada como possível duplicata
    Quando Marcos escolhe desmarcar as duplicadas
    Então aparece "1 transação duplicada foi desmarcada."
    E a importação segue com 37 transações

  @lacuna
  Cenário: Hoje, excluir a importação apaga também o que já foi classificado
    Dado que 30 das 38 transações já foram classificadas
    Quando Helena exclui a importação no histórico e confirma
    Então as 38 transações somem, inclusive as 30 classificadas
    Mas as receitas e despesas geradas continuam, sem o vínculo com o extrato

  @proposto
  Cenário: Importação com transação classificada não se exclui
    Dado que 30 das 38 transações já foram classificadas
    Quando Helena tenta excluir a importação
    Então aparece "Esta importação tem 30 transações classificadas. Desfaça as classificações antes de excluir."
    E nada é excluído
```

### H-16 — Classificar o PIX do inquilino

> **Como** Marcos, **quero** aceitar a sugestão do sistema para o PIX da inquilina, **para** lançar o
> aluguel recebido com um clique.

Regras: RN-IMP-02, RN-IMP-09 (proposta). Backlog: **B-01**.

```gherkin
# language: pt
Funcionalidade: Classificação de transação

  Contexto:
    Dado que a transação "PIX RECEBIDO CARLA MENDES", crédito de R$ 3.200,00 em 10/09/2026, está pendente
    E a sugestão é "Receita", categoria "Aluguel", imóvel "Apto 302", com confiança de 92%

  @implementado @defeito-provavel
  Cenário: Aceitar a sugestão
    Quando Marcos aceita a sugestão
    Então é criada uma receita "Recebido" de R$ 3.200,00 no "Apto 302", competência "2026-09", forma "Pix"
    E aparece "Transação lançada como receita na categoria Aluguel."
    E a transação passa para "Já Classificadas"
    # Achado B-01: a marcação da transação envia nomes para colunas que guardam identificadores.
    # Se o banco recusar, a receita já terá sido criada e a transação continua pendente.

  @implementado
  Cenário: Sugestão incompleta abre o formulário
    Dado que a sugestão não tem imóvel
    Quando Marcos aceita a sugestão
    Então abre o formulário de classificação para ele escolher o imóvel

  @implementado
  Cenário: Ignorar e reabrir
    Quando Marcos ignora a transação
    Então aparece "Transação ignorada. Ela não entra nos cálculos."
    E quando ele escolhe "Reabrir" na transação ignorada
    Então aparece "Transação reaberta para classificação."

  @proposto
  Cenário: Classificar é tudo ou nada
    Quando Marcos aceita a sugestão e a gravação falha no meio
    Então nenhuma receita é criada
    E a transação continua pendente
    E aparece "Nada foi lançado. Tente de novo."

  @proposto
  Cenário: A transação classificada guarda os vínculos
    Quando Marcos aceita a sugestão
    Então a transação fica ligada à categoria "Aluguel", ao imóvel "Apto 302" e à receita criada
    E a receita fica ligada à transação
```

### H-17 — Conciliar o PIX com o aluguel previsto

> **Como** Helena, **quero** que o PIX da inquilina dê baixa no aluguel previsto do mês, **para** não
> contar o aluguel duas vezes e ver na hora quem pagou a menos.

Regras: RN-FIN-08, RN-FIN-09, RN-FIN-11. Backlog: B-07, B-13, B-19. Depende de H-08.

```gherkin
# language: pt
Funcionalidade: Conciliação do extrato com as receitas previstas

  Contexto:
    Dado que o contrato "2026/003" de Carla Mendes gerou a receita prevista de R$ 3.200,00, competência "2026-09", vencimento em 10/09/2026, no "Apto 302"

  @proposto
  Cenário: Valor exato dá baixa na receita prevista
    Dado a transação "PIX RECEBIDO CARLA MENDES", crédito de R$ 3.200,00 em 10/09/2026
    Quando Marcos classifica a transação como aluguel do "Apto 302"
    Então a receita de competência "2026-09" passa a "Recebido", com R$ 3.200,00 em 10/09/2026
    E nenhuma receita nova é criada
    E a transação fica ligada a essa receita

  @proposto
  Cenário: Pagamento a menor deixa saldo em aberto
    Dado a transação "PIX RECEBIDO CARLA MENDES", crédito de R$ 3.100,00 em 10/09/2026
    Quando Marcos classifica a transação como aluguel do "Apto 302"
    Então a receita de competência "2026-09" passa a "Parcial", com R$ 3.100,00 recebidos
    E Alertas mostra "Carla Mendes — saldo de R$ 100,00 do aluguel de setembro/2026"

  @proposto
  Cenário: Registrar o combinado com a inquilina
    Dado que a receita de setembro/2026 está "Parcial" com saldo de R$ 100,00
    Quando Helena registra "Desconto de R$ 100,00 pela troca do chuveiro, autorizado por Helena em 12/09/2026"
    Então a receita fica "Recebido" com desconto de R$ 100,00
    E o motivo fica na trilha de auditoria

  @proposto
  Cenário: Dois aluguéis em aberto — a pessoa escolhe
    Dado que as receitas de agosto e de setembro de 2026 de Carla Mendes estão em aberto
    Quando Marcos classifica um PIX de R$ 3.200,00 como aluguel do "Apto 302"
    Então o sistema pergunta qual competência o PIX quita, sugerindo a mais antiga
    E só dá baixa depois da escolha

  @proposto
  Cenário: Sem receita prevista, cria uma nova como hoje
    Dado que não há receita em aberto para o "Apto 302"
    Quando Marcos classifica um PIX de R$ 3.200,00 como aluguel do "Apto 302"
    Então é criada uma receita "Recebido" de R$ 3.200,00

  @proposto
  Cenário: Recibo discriminado
    Dado que a receita de setembro/2026 de Carla Mendes foi recebida com R$ 3.200,00 de aluguel e R$ 64,00 de multa
    Quando Helena gera o recibo
    Então o PDF mostra aluguel e multa em linhas separadas, a competência "2026-09", o imóvel e a forma "Pix"
```

### H-18 — Desfazer uma classificação errada

> **Como** Marcos, **quero** desfazer uma classificação que fiz no imóvel errado, **para** corrigir sem
> deixar lançamento em dobro.

Regras: RN-IMP-01. Backlog: B-11.

```gherkin
# language: pt
Funcionalidade: Desfazer classificação

  Contexto:
    Dado que Marcos classificou o PIX de R$ 3.200,00 de 10/09/2026 como aluguel do "Apto 301", por engano

  @lacuna
  Cenário: Hoje, "Editar" cria um segundo lançamento
    Quando Marcos escolhe "Editar" na transação e classifica de novo no "Apto 302"
    Então passam a existir duas receitas de R$ 3.200,00, uma no "Apto 301" e outra no "Apto 302"

  @proposto
  Cenário: Desfazer apaga o lançamento e devolve a transação à fila
    Quando Marcos escolhe "Desfazer classificação" e confirma
    Então a receita do "Apto 301" é excluída
    E a transação volta a "Pendente"
    E a trilha registra a exclusão com o motivo "Classificação desfeita"

  @proposto
  Cenário: Desfazer uma baixa não apaga o aluguel previsto
    Dado que a classificação tinha dado baixa na receita prevista de setembro do "Apto 301"
    Quando Marcos desfaz a classificação
    Então a receita prevista volta a "Previsto", sem valor recebido
    Mas ela não é excluída
```

---

## Acesso e governança

### H-19 — Contadora com acesso só de leitura

> **Como** Dra. Rita, **quero** ver receitas, despesas e relatórios sem poder alterar, **para**
> escriturar com segurança de que não mudei nada por engano.

Regras: RN-SEC-01, RN-SEC-02, RN-SEC-09 (proposta). Backlog: B-22.

```gherkin
# language: pt
Funcionalidade: Acesso por módulo

  Contexto:
    Dado que Rita tem "Visualização" em Receitas, Despesas e Relatórios
    E "Sem acesso" em Contratos

  @implementado
  Cenário: Vê, mas não altera
    Quando Rita abre Receitas
    Então vê a lista de receitas
    Mas não vê os botões de criar, editar ou excluir

  @implementado
  Cenário: O banco recusa escrita mesmo fora da tela
    Quando um pedido de Rita para alterar uma receita chega ao banco por outro caminho
    Então o banco recusa, e a tela traduz para "Você não tem permissão para esta operação."

  @implementado
  Cenário: Módulo sem acesso
    Quando Rita digita o endereço da tela de Contratos
    Então ela volta para o Início
    E aparece "Você não tem permissão para acessar esta área. Fale com quem administra o sistema."

  @implementado
  Cenário: Usuário desativado não vê nada, mesmo com acesso concedido
    Dado que Helena desativou o acesso de Rita
    Quando um pedido de Rita para ler receitas chega ao banco
    Então nenhuma receita é devolvida

  @proposto
  Cenário: Perfil pronto "Contador(a)"
    Quando Helena aplica o perfil "Contador(a)" a Rita
    Então Rita recebe "Visualização" em Receitas, Despesas, IPTU e Taxas, Imóveis, Contratos e Relatórios
    E nenhum módulo com "Edição"

  @proposto
  Cenário: Aviso de relatório que sairia vazio
    Quando Helena dá "Visualização" em Relatórios a Rita sem dar acesso a Receitas
    Então aparece "Sem acesso a Receitas, o relatório financeiro de Rita sairá vazio."
```

### H-20 — Convidar quem vai usar

> **Como** Helena, **quero** convidar a contadora por e-mail, **para** que ela crie a própria senha sem eu
> conhecê-la.

Regras: RN-SEC-04, RN-SEC-07 (proposta). Backlog: B-03, B-05.

```gherkin
# language: pt
Funcionalidade: Convite

  Contexto:
    Dado que Helena convidou "rita@contabilidade.exemplo" com perfil "usuario" em 01/09/2026

  @implementado
  Cenário: Convite aceito no prazo
    Quando Rita abre o link em 05/09/2026 e cria a senha
    Então a conta dela nasce com o perfil "usuario" e sem permissão em nenhum módulo
    E o convite fica "aceito"

  @implementado
  Cenário: Convite vencido
    Quando Rita abre o link em 09/09/2026
    Então aparece "Este convite expirou. Peça um novo ao administrador."

  @implementado
  Cenário: Reenviar renova o prazo
    Quando Helena reenvia o convite em 09/09/2026
    Então aparece "Convite reenviado para rita@contabilidade.exemplo. O novo link vale por 7 dias."

  @proposto
  Cenário: Sem convite, não há cadastro
    Quando alguém sem convite tenta criar conta pela tela de cadastro ou pela API
    Então a conta não é criada
```

### H-21 — Saber quem mudou o valor do aluguel

> **Como** Helena, **quero** ver quem alterou um contrato e o que mudou, **para** esclarecer divergência
> com a inquilina sem depender de memória.

Regras: RN-AUD-01 a RN-AUD-04.

```gherkin
# language: pt
Funcionalidade: Trilha de auditoria

  @implementado
  Cenário: Alteração com antes e depois
    Dado que Marcos, com "Edição" em Contratos, mudou o aluguel do contrato "2025/004" de R$ 3.200,00 para R$ 3.300,80
    Quando Helena abre a trilha de auditoria
    Então vê que Marcos editou o contrato "2025/004"
    E vê o valor do aluguel anterior e o novo

  @implementado
  Cenário: A trilha não se apaga
    Quando alguém, mesmo administrador, tenta alterar ou excluir um registro da trilha
    Então o banco recusa

  @implementado
  Cenário: Mudança de acesso também fica registrada
    Quando Helena dá "Edição" em Receitas a Marcos
    Então a trilha registra "Marcos — receitas: edicao" com Helena como autora

  @implementado
  Cenário: Só o administrador vê a trilha
    Quando Marcos procura a trilha de auditoria
    Então ela não aparece no menu dele
```

### H-22 — Resultado do mês para o sócio

> **Como** Seu Antônio, **quero** receber o resultado do mês sem pedir, **para** acompanhar a holding
> sem precisar usar o sistema.

Regras: RN-REL-01, RN-FIN-12 e RN-REL-02 (propostas). Backlog: B-15, B-16.

```gherkin
# language: pt
Funcionalidade: Resultado mensal

  @implementado
  Cenário: Painel financeiro do mês
    Dado que Seu Antônio tem "Visualização" em Dashboards, Receitas, Despesas, Imóveis e Contratos
    Quando ele abre o Dashboard Financeiro em setembro de 2026
    Então vê "Receitas × Despesas Realizadas", "Evolução do Resultado Mensal" e "Resumo Financeiro por Imóvel"

  @implementado
  Cenário: Relatório em PDF
    Dado que Helena tem acesso a Relatórios
    Quando ela gera o relatório financeiro de "Mês Anterior" em PDF
    Então o arquivo é baixado com receitas, despesas e resultado por imóvel

  @proposto
  Cenário: Fechar a competência
    Dado que todas as transações de agosto de 2026 foram classificadas
    Quando Helena fecha a competência "2026-08"
    Então receitas, despesas e IPTU de "2026-08" não podem mais ser alterados nem excluídos
    E quem tentar vê "A competência 2026-08 está fechada. Peça ao administrador para reabrir."

  @proposto
  Cenário: O resultado chega por e-mail
    Dado que Seu Antônio optou por receber o resultado mensal
    E a competência "2026-08" foi fechada
    Quando chega 05/09/2026
    Então Seu Antônio recebe por e-mail o PDF do resultado de agosto de 2026
    E o e-mail só traz o que ele poderia ver no sistema
```

### H-23 — Ser avisada antes do vencimento

> **Como** Helena, **quero** ver o que vai vencer e o que venceu, **para** agir antes de virar problema.

Regras: RN-ALR-01, RN-ALR-02 (proposta). Backlog: B-20.

```gherkin
# language: pt
Funcionalidade: Alertas

  Contexto:
    Dado que hoje é 19/09/2026
    E o contrato "2024/011" da Padaria Pão de Ontem Ltda. termina em 31/10/2026
    E a parcela "IPTU 2026 — 9/10" do "Apto 302" vence em 25/09/2026
    E o aluguel de setembro/2026 de Roberto Lima venceu em 10/09/2026 sem baixa

  @implementado
  Esquema do Cenário: Filtro por período
    Quando Helena abre Alertas com o filtro "<filtro>"
    Então <parcela> a parcela do IPTU
    E <contrato> o término do contrato "2024/011"
    E aparece o aluguel vencido de Roberto Lima

    Exemplos:
      | filtro  | parcela | contrato    |
      | 7 dias  | aparece | não aparece |
      | 30 dias | aparece | não aparece |
      | Todos   | aparece | aparece     |

  @implementado
  Cenário: Mais urgente primeiro
    Quando Helena abre Alertas com o filtro "Todos"
    Então o aluguel vencido de Roberto Lima aparece antes da parcela do IPTU
    E a parcela do IPTU aparece antes do término do contrato

  @proposto
  Cenário: Término avisado com 90, 60 e 30 dias
    Quando chegam 02/08/2026, 01/09/2026 e 01/10/2026
    Então em cada data o término do contrato "2024/011" entra no resumo de avisos, independentemente do filtro da tela
```

---

## Simulador

### H-24 — Saber se a holding paga IBS/CBS

> **Como** Dra. Rita, **quero** simular o enquadramento de um locador pessoa física, **para** orientar a
> família sobre ter imóveis na pessoa física ou na holding.

Regras: RT-01 (e demais RT-02 a RT-08, em [simulador.md](../simulador.md)); RT-09 (proposta). Backlog: B-02.

```gherkin
# language: pt
Funcionalidade: Enquadramento do locador pessoa física

  @implementado
  Esquema do Cenário: Mais de 3 imóveis e mais de R$ 240.000,00 por ano, os dois
    Quando Rita simula um locador pessoa física com <imoveis> imóveis alugados e receita anual de <receita>
    Então o locador é enquadrado como <enquadramento>

    Exemplos:
      | imoveis | receita         | enquadramento   |
      | 3       | R$ 300.000,00   | não contribuinte |
      | 4       | R$ 240.000,00   | não contribuinte |
      | 4       | R$ 240.000,01   | contribuinte     |
      | 5       | R$ 180.000,00   | não contribuinte |

  @implementado
  Cenário: Pessoa jurídica é sempre contribuinte
    Quando Rita simula a holding, pessoa jurídica, com 1 imóvel alugado e receita anual de R$ 60.000,00
    Então o locador é enquadrado como contribuinte

  @proposto
  Cenário: O laudo cita a LC 227/2026
    Quando Rita gera o laudo de uma simulação residencial com redutor social
    Então a base legal do redutor cita a LC 214/2025 e a LC 227/2026
```

---

## Totais

| | Histórias | Cenários `@implementado` | Cenários `@lacuna` | Cenários `@proposto` | Total de cenários |
| :-- | :-: | :-: | :-: | :-: | :-: |
| Cadastros (H-01 a H-05) | 5 | 15 | 3 | 3 | 21 |
| Contratos (H-06 a H-12) | 7 | 13 | 1 | 14 | 28 |
| Financeiro (H-13 e H-14) | 2 | 6 | 0 | 2 | 8 |
| Extrato (H-15 a H-18) | 4 | 10 | 2 | 11 | 23 |
| Acesso e governança (H-19 a H-23) | 5 | 15 | 0 | 6 | 21 |
| Simulador (H-24) | 1 | 2 | 0 | 1 | 3 |
| **Total** | **24** | **61** | **6** | **37** | **104** |

> Cada `Esquema do Cenário` conta como um cenário, qualquer que seja o número de linhas de `Exemplos`.
> Cenário com duas etiquetas (`@proposto @decisao-pendente`) conta uma vez, pela primeira.
