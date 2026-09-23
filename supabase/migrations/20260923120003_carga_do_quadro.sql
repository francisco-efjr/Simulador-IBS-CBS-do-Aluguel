-- =============================================================================
-- Carga inicial do Quadro de histórias
--
-- As histórias de usuário do sistema, reescritas no formato do quadro: "Eu…
-- quero… para…", critérios de aceitação em BDD (Gherkin em português),
-- observações e atividades.
--
-- De onde vêm:
--   · H-01 a H-24 — docs/08-produto/historias-e-cenarios.md, com o mesmo número e
--     o mesmo título (o auditor confere: docs/07-auditor.md, "historias-conferem");
--   · H-25 a H-45 — o que o sistema já faz e ainda não tinha história
--     (docs/08-produto/inventario-funcional.md);
--   · H-46 a H-59 — o que está no backlog e ainda não tinha história
--     (docs/08-produto/backlog.md).
--
-- Em que coluna cada uma entra:
--   · Backlog — nada do valor principal foi desenvolvido;
--   · Desenvolvimento — parte funciona e parte falta: as atividades pendentes
--     ficam desmarcadas no cartão;
--   · Teste — pronta no código, esperando a homologação de uma pessoa.
-- Nenhuma entra em Homologação ou Concluído: isso é de gente (RN-QDR-01), e o
-- banco recusaria.
--
-- Só carrega com o quadro vazio: rodar de novo não duplica nem desfaz o que
-- alguém já editou. A trilha de auditoria fica desligada durante a carga para
-- não encher o feed do Início com 59 "criou"; fora dela, tudo é registrado.
--
-- Depende de 20260923120002_quadro_de_historias.sql.
-- =============================================================================

do $carga$
begin
  if exists (select 1 from public.historias) then
    raise notice 'O quadro já tem histórias; a carga inicial não roda de novo.';
    return;
  end if;

  alter table public.historias disable trigger registrar_log;

  insert into public.historias (numero, titulo, tag, coluna, eu, quero, para, criterios, observacoes) values

  -- ── Cadastros ───────────────────────────────────────────────────────────────

  (1, 'Inativar imóvel vendido', 'Cadastros', 'desenvolvimento',
   'Helena, sócia-administradora',
   'inativar um imóvel que a holding vendeu',
   'que ele saia das listas e dos relatórios sem perder o histórico',
   $g$# language: pt
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
    Então aparece a mensagem "Imóvel marcado como inativo."$g$,
   $o$Regras: RN-IMV-02, RN-AUD-01. Backlog: B-14 (mostrar o motivo da recusa), B-04 (teste de banco).$o$),

  (2, 'Imóvel vago em reforma', 'Cadastros', 'desenvolvimento',
   'Helena, sócia-administradora',
   'marcar a casa vazia como "em manutenção" e lançar os gastos da reforma',
   'saber quanto a vacância custou e não alugá-la antes de ficar pronta',
   $g$# language: pt
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
    Então a casa passa a "Vago"$g$,
   $o$Regras: RN-IMV-01, RN-FIN-03, RN-IMV-05 (proposta). Backlog: B-26.$o$),

  (3, 'Cadastrar inquilino pessoa física', 'Cadastros', 'teste',
   'Helena, sócia-administradora',
   'cadastrar a inquilina com CPF conferido',
   'não emitir contrato nem recibo com documento errado',
   $g$# language: pt
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
    Então embaixo do nome aparece "Informe o nome do inquilino."$g$,
   $o$Regras: RN-INQ-02, RN-INQ-04, RN-INQ-05. Pronta no código; espera a homologação.$o$),

  (4, 'Cadastrar inquilino com CNPJ alfanumérico', 'Cadastros', 'teste',
   'Helena, sócia-administradora',
   'cadastrar a padaria que tem CNPJ com letras',
   'alugar a loja a uma empresa aberta depois de julho de 2026',
   $g$# language: pt
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
    Então o banco recusa, e a tela traduz para "CNPJ inválido. Confira os caracteres digitados."$g$,
   $o$Regras: RN-INQ-03, RN-INQ-04. Pronta no código; espera a homologação.$o$),

  (5, 'Inativar inquilino que saiu', 'Cadastros', 'desenvolvimento',
   'Helena, sócia-administradora',
   'inativar o inquilino que devolveu o imóvel',
   'que a lista mostre só quem está com a holding',
   $g$# language: pt
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
    Então aparece "Inquilino marcado como inativo."$g$,
   $o$Regras: RN-INQ-01. Backlog: B-14 (mostrar o motivo da recusa), B-04 (teste de banco).$o$),

  -- ── Contratos ───────────────────────────────────────────────────────────────

  (6, 'Contrato novo sem sobrepor o anterior', 'Contratos', 'desenvolvimento',
   'Helena, sócia-administradora',
   'cadastrar o contrato do novo inquilino no dia seguinte ao fim do anterior',
   'não haver dois inquilinos no mesmo imóvel ao mesmo tempo',
   $g$# language: pt
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
    Então embaixo da próxima data de reajuste aparece "O reajuste não pode ser antes do início do contrato."$g$,
   $o$Regras: RN-CTR-03, RN-CTR-04, RN-CTR-05, RN-CTR-06, RN-FIN-06. Backlog: B-14 (mensagem do reajuste), B-04 (testes de banco).$o$),

  (7, 'Imóvel acompanha o contrato', 'Contratos', 'teste',
   'Helena, sócia-administradora',
   'que o imóvel mude de "vago" para "alugado" sozinho quando o contrato começa e volte quando ele termina',
   'o painel de ocupação estar sempre certo',
   $g$# language: pt
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
    E o "Apto 302" passa a "Alugado"$g$,
   $o$Regras: RN-IMV-01. Pronta no código; espera a homologação.$o$),

  (8, 'Aluguéis previstos gerados pelo contrato', 'Contratos', 'backlog',
   'Helena, sócia-administradora',
   'que ao ativar o contrato o sistema já crie os aluguéis previstos de cada mês',
   'não lançar à mão e ser avisada quando um não entrar',
   $g$# language: pt
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
    E a trilha registra cada cancelamento$g$,
   $o$Regras: RN-CTR-01, RN-CTR-13. Backlog: B-06.
Decisão pendente D-01 (advogado): quando o contrato começa depois do dia de vencimento, o primeiro aluguel é proporcional aos dias ou vira um mês cheio no mês seguinte?$o$),

  (9, 'Reajuste anual pelo índice', 'Contratos', 'backlog',
   'Helena, sócia-administradora',
   'que o sistema calcule o reajuste no aniversário do contrato e me peça para confirmar',
   'não perder reajuste nem cobrar errado',
   $g$# language: pt
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
      | variação do dólar        | 12    | o índice não está na lista de opções                                                        |$g$,
   $o$Regras: RN-CTR-02, RN-CTR-09. Backlog: B-08a (cálculo com índice digitado) e B-08b (coleta automática do índice).
Decisão pendente D-02 (advogado): quando o índice do ano fecha negativo, o aluguel cai junto ou fica como está?
Decisão pendente D-06 (contadora): quais índices o sistema aceita — IGP-M, IPCA, INPC, IVAR e "sem reajuste por índice"?
Hoje o reajuste é só um lembrete em Alertas.$o$),

  (10, 'Garantia coerente e caução até 3 aluguéis', 'Contratos', 'backlog',
   'Helena, sócia-administradora',
   'que o sistema confira o valor da garantia',
   'não aceitar caução acima do que a lei permite nem guardar valor em contrato "sem garantia"',
   $g$# language: pt
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
    Então o contrato é salvo$g$,
   $o$Regras: RN-CTR-10, RN-CTR-11. Backlog: B-10.
Decisão pendente D-03 (advogado): quais modalidades de garantia ficam na lista — manter o título de capitalização e acrescentar a cessão fiduciária de quotas de fundo?$o$),

  (11, 'Uma garantia por contrato', 'Contratos', 'teste',
   'Helena, sócia-administradora',
   'registrar uma única modalidade de garantia por contrato',
   'o contrato não ter cláusula nula',
   $g$# language: pt
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
    E a trilha registra a troca de "seguro-fiança" para "fiador"$g$,
   $o$Regras: RN-CTR-07. Pronta no código; espera a homologação.$o$),

  (12, 'Multa proporcional na saída antecipada', 'Contratos', 'backlog',
   'Helena, sócia-administradora',
   'que o sistema calcule a multa quando o inquilino sai antes do prazo',
   'cobrar o valor que a lei permite, sem conta de cabeça',
   $g$# language: pt
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
    E o aviso por escrito fica anexado ao contrato$g$,
   $o$Regras: RN-CTR-12. Backlog: B-17.
Decisão pendente D-04 (advogado): a multa da saída antecipada é contada por mês cumprido ou por dia, e com qual percentual quando o contrato não disser?$o$),

  -- ── Financeiro ──────────────────────────────────────────────────────────────

  (13, 'Situação do aluguel sem digitar', 'Financeiro', 'teste',
   'Marcos, assistente administrativo',
   'que a situação do lançamento se ajuste sozinha pelo valor recebido e pela data',
   'não marcar "recebido" por engano',
   $g$# language: pt
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
    E aparece em Alertas no filtro de vencidos$g$,
   $o$Regras: RN-FIN-01, RN-FIN-02, RN-FIN-03. Pronta no código; espera a homologação.$o$),

  (14, 'IPTU parcelado em 10 vezes', 'Financeiro', 'backlog',
   'Helena, sócia-administradora',
   'lançar o IPTU do ano em 10 parcelas de uma vez',
   'não digitar dez registros por imóvel e ser avisada de cada vencimento',
   $g$# language: pt
Funcionalidade: IPTU parcelado de uma vez

  @proposto
  Cenário: Parcelamento com diferença de centavos na última parcela
    Quando Helena lança o IPTU 2027 do "Apto 302", total de R$ 2.487,53, em 10 parcelas, a primeira vencendo em 10/02/2027
    Então são criadas 10 obrigações do tipo "IPTU" com vencimentos de 10/02/2027 a 10/11/2027
    E as 9 primeiras são de R$ 248,75 e a última de R$ 248,78
    E a soma das 10 é R$ 2.487,53

  @proposto
  Cenário: Cota única
    Quando Helena lança o IPTU 2027 da "Sala 5 — Ed. Central", total de R$ 1.940,00, em cota única com vencimento em 10/02/2027
    Então é criada 1 obrigação de R$ 1.940,00$g$,
   $o$Regras: RN-IPTU-04. Backlog: B-09.
O que já funciona do IPTU — parcela a parcela, situação calculada e comprovante — está na H-29.$o$),

  -- ── Extrato bancário ────────────────────────────────────────────────────────

  (15, 'Importar o extrato OFX do Itaú', 'Extrato bancário', 'desenvolvimento',
   'Marcos, assistente administrativo',
   'importar o extrato OFX da conta do Itaú',
   'não digitar os PIX recebidos e as contas pagas',
   $g$# language: pt
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
      | acao                         | mensagem                                            |
      | escolhe pelo botão           | Formato não aceito. Envie um arquivo .CSV ou .OFX.  |
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
      | descricao                  | sentido | valor       | data       | aviso    |
      | PIX RECEBIDO CARLA MENDES  | crédito | R$ 3.200,00 | 10/09/2026 | fica     |
      | PIX RECEBIDO CARLA M       | crédito | R$ 3.200,00 | 10/09/2026 | fica     |
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
    E nada é excluído$g$,
   $o$Regras: RN-IMP-02, RN-IMP-04 a RN-IMP-08, RN-IMP-10 (proposta). Backlog: B-12 (não excluir importação usada), B-04 (testes de banco).
Os extratos CSV dos outros bancos estão na H-30.$o$),

  (16, 'Classificar o PIX do inquilino', 'Extrato bancário', 'desenvolvimento',
   'Marcos, assistente administrativo',
   'aceitar a sugestão do sistema para o PIX da inquilina',
   'lançar o aluguel recebido com um clique',
   $g$# language: pt
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
    E a receita fica ligada à transação$g$,
   $o$Regras: RN-IMP-02, RN-IMP-09 (proposta). Backlog: B-01 — pré-requisito de tudo que mexe com extrato.
Defeito provável a confirmar antes de importar extrato real.$o$),

  (17, 'Conciliar o PIX com o aluguel previsto', 'Extrato bancário', 'backlog',
   'Helena, sócia-administradora',
   'que o PIX da inquilina dê baixa no aluguel previsto do mês',
   'não contar o aluguel duas vezes e ver na hora quem pagou a menos',
   $g$# language: pt
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
    Então o PDF mostra aluguel e multa em linhas separadas, a competência "2026-09", o imóvel e a forma "Pix"$g$,
   $o$Regras: RN-FIN-08, RN-FIN-09, RN-FIN-11. Backlog: B-07 (conciliação), B-13 (recebimento parcial), B-19 (recibo discriminado).
Depende da H-08 (aluguéis previstos) e da H-16 (classificação tudo ou nada).$o$),

  (18, 'Desfazer uma classificação errada', 'Extrato bancário', 'backlog',
   'Marcos, assistente administrativo',
   'desfazer uma classificação que fiz no imóvel errado',
   'corrigir sem deixar lançamento em dobro',
   $g$# language: pt
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
    Mas ela não é excluída$g$,
   $o$Regras: RN-IMP-01. Backlog: B-11. Depende da H-16 (B-01, classificação tudo ou nada).$o$),

  -- ── Acesso e governança ─────────────────────────────────────────────────────

  (19, 'Contadora com acesso só de leitura', 'Acesso e governança', 'desenvolvimento',
   'Dra. Rita, contadora externa',
   'ver receitas, despesas e relatórios sem poder alterar',
   'escriturar com segurança de que não mudei nada por engano',
   $g$# language: pt
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
    Então aparece "Sem acesso a Receitas, o relatório financeiro de Rita sairá vazio."$g$,
   $o$Regras: RN-SEC-01, RN-SEC-02, RN-SEC-09 (proposta). Backlog: B-22 (perfis prontos).
Decisão pendente D-05 (família): o sócio vê só os painéis e relatórios ou também as telas de origem, em leitura?$o$),

  (20, 'Convidar quem vai usar', 'Acesso e governança', 'desenvolvimento',
   'Helena, sócia-administradora',
   'convidar a contadora por e-mail',
   'que ela crie a própria senha sem eu conhecê-la',
   $g$# language: pt
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
    Então a conta não é criada$g$,
   $o$Regras: RN-SEC-04, RN-SEC-07 (proposta). Backlog: B-03 (entrada só por convite — primeiro da fila), B-05 (remetente de e-mail próprio).$o$),

  (21, 'Saber quem mudou o valor do aluguel', 'Acesso e governança', 'teste',
   'Helena, sócia-administradora',
   'ver quem alterou um contrato e o que mudou',
   'esclarecer divergência com a inquilina sem depender de memória',
   $g$# language: pt
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
    Então ela não aparece no menu dele$g$,
   $o$Regras: RN-AUD-01, RN-AUD-02, RN-AUD-03, RN-AUD-04. Pronta no código; espera a homologação.$o$),

  (22, 'Resultado do mês para o sócio', 'Acesso e governança', 'backlog',
   'Seu Antônio, sócio-fundador',
   'receber o resultado do mês sem pedir',
   'acompanhar a holding sem precisar usar o sistema',
   $g$# language: pt
Funcionalidade: Resultado mensal

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
    E o e-mail só traz o que ele poderia ver no sistema$g$,
   $o$Regras: RN-FIN-12, RN-REL-02. Backlog: B-16 (fechamento de competência), B-15 (resultado por e-mail), que depende de B-05 (remetente próprio).
O painel do mês e o relatório em PDF, que já existem, estão na H-31 e na H-33.$o$),

  (23, 'Ser avisada antes do vencimento', 'Acesso e governança', 'desenvolvimento',
   'Helena, sócia-administradora',
   'ver o que vai vencer e o que venceu',
   'agir antes de virar problema',
   $g$# language: pt
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
    Então em cada data o término do contrato "2024/011" entra no resumo de avisos, independentemente do filtro da tela$g$,
   $o$Regras: RN-ALR-01, RN-ALR-02 (proposta). Backlog: B-20.$o$),

  -- ── Simulador ───────────────────────────────────────────────────────────────

  (24, 'Saber se a holding paga IBS/CBS', 'Simulador', 'desenvolvimento',
   'Dra. Rita, contadora externa',
   'simular o enquadramento de um locador pessoa física',
   'orientar a família sobre ter imóveis na pessoa física ou na holding',
   $g$# language: pt
Funcionalidade: Enquadramento do locador pessoa física

  @implementado
  Esquema do Cenário: Mais de 3 imóveis e mais de R$ 240.000,00 por ano, os dois
    Quando Rita simula um locador pessoa física com <imoveis> imóveis alugados e receita anual de <receita>
    Então o locador é enquadrado como <enquadramento>

    Exemplos:
      | imoveis | receita         | enquadramento    |
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
    Então a base legal do redutor cita a LC 214/2025 e a LC 227/2026$g$,
   $o$Regras: RT-01 a RT-08 (docs/simulador.md), RT-09 (proposta). Backlog: B-02 — em andamento: o cálculo já está certo, falta citar a lei nova.$o$),

  -- ── O que o sistema já faz e ainda não tinha história ───────────────────────

  (25, 'Cadastrar imóvel da carteira', 'Cadastros', 'teste',
   'Helena, sócia-administradora',
   'cadastrar cada imóvel da holding com endereço, tipo, matrícula e fotos',
   'ter a carteira inteira num lugar só, com o que preciso para contrato, IPTU e seguro',
   $g$# language: pt
Funcionalidade: Cadastro de imóvel

  @implementado
  Cenário: Cadastrar um apartamento
    Quando Helena cadastra o imóvel "Apto 302", tipo "Apartamento", no endereço "Rua das Acácias, 120"
    Então aparece "Imóvel cadastrado com sucesso."
    E o "Apto 302" entra na lista como "Vago"

  @implementado
  Cenário: Endereço obrigatório
    Quando Helena tenta salvar um imóvel sem endereço
    Então embaixo do endereço aparece "Informe o endereço do imóvel (rua ou avenida)."

  @implementado
  Cenário: Área negativa
    Quando Helena informa a área de -80 m² e salva
    Então embaixo da área aparece "A área não pode ser negativa. Informe a metragem em m²."

  @implementado
  Cenário: Código repetido
    Dado que já existe um imóvel com o código "AP-302"
    Quando Helena cadastra outro imóvel com o código "AP-302"
    Então embaixo do código aparece "Já existe um imóvel com este código."

  @implementado
  Cenário: Fotos protegidas
    Quando Helena envia duas fotos JPEG do "Apto 302"
    Então aparece "Fotos enviadas com sucesso."
    E as fotos só abrem para quem tem acesso a Imóveis, por um link que expira$g$,
   $o$Regras: RN-IMV-03, RN-IMV-04, RN-SEC-05. Tipos: casa, apartamento, sala comercial, loja, galpão, terreno, outro. Fotos até 10 MB (JPEG, PNG, WebP, AVIF).$o$),

  (26, 'Cadastrar fornecedor', 'Cadastros', 'teste',
   'Helena, sócia-administradora',
   'cadastrar o eletricista, a construtora e o condomínio com o documento conferido',
   'ligar cada despesa a quem prestou o serviço',
   $g$# language: pt
Funcionalidade: Cadastro de fornecedor

  @implementado
  Cenário: Cadastrar o eletricista
    Quando Helena cadastra o fornecedor "José Elétrica", tipo "Eletricista", com o CPF "123.456.789-09"
    Então aparece "Fornecedor cadastrado com sucesso."

  @implementado
  Cenário: Documento repetido
    Dado que já existe um fornecedor com o CNPJ "12.345.678/0001-95"
    Quando Helena cadastra outro fornecedor com o mesmo CNPJ
    Então aparece "Já existe um fornecedor com este CNPJ/CPF."

  @implementado
  Cenário: O banco confere o documento por qualquer caminho
    Quando um fornecedor com o CNPJ "12.345.678/0001-96" chega ao banco
    Então o banco recusa, e a tela traduz para "CNPJ ou CPF inválido. Confira os caracteres digitados."

  @implementado
  Cenário: Inativar o fornecedor
    Quando Helena escolhe "Inativar" na linha de "José Elétrica" e confirma
    Então aparece "Fornecedor marcado como inativo."$g$,
   $o$Regras: RN-FOR-01. Tipos: eletricista, encanador, pedreiro, pintor, empresa de manutenção, empresa de limpeza, seguradora, condomínio, outros.$o$),

  (27, 'Lançar receita do imóvel', 'Financeiro', 'teste',
   'Marcos, assistente administrativo',
   'lançar o aluguel, a multa ou o reembolso recebido de cada imóvel',
   'saber quanto cada imóvel rende no mês',
   $g$# language: pt
Funcionalidade: Lançamento de receita

  Contexto:
    Dado que Marcos tem "Edição" em Receitas

  @implementado
  Cenário: Lançar o aluguel recebido
    Quando Marcos lança uma receita do "Apto 302" na categoria "Aluguel", competência "2026-09", vencimento em 10/09/2026, valor previsto de R$ 3.200,00 e recebido de R$ 3.200,00 em 10/09/2026, forma "Pix"
    Então aparece "Receita cadastrada com sucesso."
    E a receita fica "Recebido"

  @implementado
  Cenário: Categorias de receita
    Quando Marcos abre o campo de categoria
    Então as opções incluem "Aluguel", "Multa", "Juros", "Reembolso" e "Outras receitas"

  @implementado
  Cenário: Receita sem imóvel
    Quando uma receita sem imóvel chega ao banco
    Então o banco recusa

  @implementado
  Cenário: Excluir uma receita
    Quando Marcos exclui a receita e confirma
    Então aparece "Receita excluída com sucesso."
    E a trilha registra a exclusão$g$,
   $o$Regras: RN-FIN-04, RN-FIN-05, RN-FIN-07. A situação (previsto, recebido, parcial, em atraso) é calculada pelo banco — ver H-13.$o$),

  (28, 'Lançar despesa do imóvel', 'Financeiro', 'teste',
   'Marcos, assistente administrativo',
   'lançar o condomínio, a conta de consumo e a manutenção de cada imóvel, com o fornecedor',
   'saber quanto cada imóvel custa e com quem gastei',
   $g$# language: pt
Funcionalidade: Lançamento de despesa

  @implementado
  Cenário: Lançar a manutenção com o fornecedor
    Dado que hoje é 23/09/2026
    Quando Marcos lança uma despesa do "Apto 302" na categoria "Manutenção", fornecedor "José Elétrica", valor previsto de R$ 450,00 com vencimento em 25/09/2026
    Então aparece "Despesa cadastrada com sucesso."
    E a despesa fica "Previsto"

  @implementado
  Cenário: Categorias de despesa
    Quando Marcos abre o campo de categoria
    Então as opções incluem "Manutenção", "Reforma", "Comissão de corretagem", "Condomínio", "Contas de consumo", "Impostos", "Seguros" e "Outros"

  @implementado
  Cenário: Excluir o fornecedor não apaga a despesa
    Dado a despesa de R$ 450,00 ligada a "José Elétrica"
    Quando o fornecedor é excluído
    Então a despesa continua, sem fornecedor$g$,
   $o$Regras: RN-FIN-02, RN-FIN-04, RN-FIN-07. Fornecedor e categoria são opcionais; o imóvel é obrigatório.$o$),

  (29, 'Controlar IPTU e taxas por imóvel', 'Financeiro', 'teste',
   'Marcos, assistente administrativo',
   'registrar cada parcela de IPTU, condomínio e taxa do imóvel com o comprovante',
   'não pagar multa por esquecimento e ter o comprovante à mão',
   $g$# language: pt
Funcionalidade: IPTU e taxas

  @implementado
  Cenário: Cadastrar uma parcela
    Quando Marcos cadastra a obrigação "IPTU 2026 — 9/10", tipo "IPTU", do "Apto 302", de R$ 248,75 com vencimento em 25/09/2026
    Então aparece "Obrigação cadastrada com sucesso."

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

  @implementado
  Cenário: Comprovante protegido
    Quando Marcos anexa o comprovante em PDF da parcela paga
    Então o comprovante só abre para quem tem acesso a IPTU e Taxas, por um link que expira$g$,
   $o$Regras: RN-IPTU-01, RN-IPTU-02, RN-SEC-05. Tipos: IPTU, condomínio, seguro, taxa municipal, taxa extraordinária, outro. Comprovante até 10 MB (PDF, JPEG, PNG).
O lançamento das dez parcelas de uma vez está na H-14.$o$),

  (30, 'Importar extrato CSV de outros bancos', 'Extrato bancário', 'teste',
   'Marcos, assistente administrativo',
   'importar o extrato em CSV do Bradesco, do Nubank, do Inter, do Santander e do Banco do Brasil',
   'conciliar todas as contas da holding, e não só a do Itaú',
   $g$# language: pt
Funcionalidade: Extrato de vários bancos

  @implementado
  Cenário: Cadastrar a conta de origem
    Quando Marcos cadastra a conta "Nubank — Conta PJ"
    Então aparece "Conta bancária cadastrada com sucesso."

  @implementado
  Esquema do Cenário: Extrato CSV de cada banco
    Quando Marcos envia o extrato CSV do <banco> e escolhe a conta de origem
    Então as transações aparecem para conferência antes de importar

    Exemplos:
      | banco           |
      | Bradesco        |
      | Nubank          |
      | Inter           |
      | Santander       |
      | Banco do Brasil |

  @implementado
  Cenário: Transação incompleta
    Quando chega ao banco uma importação cuja 12ª transação não tem valor
    Então o banco recusa com "A transação nº 12 do extrato está incompleta: data, descrição, valor e tipo são obrigatórios."
    E nada é salvo$g$,
   $o$Regras: RN-IMP-04, RN-IMP-06. O OFX do Itaú e as regras comuns da importação estão na H-15.$o$),

  (31, 'Acompanhar o caixa no painel financeiro', 'Acompanhamento', 'teste',
   'Helena, sócia-administradora',
   'ver receitas, despesas e o resultado do mês num painel',
   'saber se a holding está no azul sem somar planilha',
   $g$# language: pt
Funcionalidade: Dashboard financeiro

  @implementado
  Cenário: Painel do mês
    Dado que Helena tem acesso a Dashboards, Receitas e Despesas
    Quando ela abre o Dashboard Financeiro em setembro de 2026
    Então vê "Receitas × Despesas Realizadas", "Evolução do Resultado Mensal", "Despesas por Categoria" e "Resumo Financeiro por Imóvel"

  @implementado
  Cenário: O painel mostra só o que a pessoa pode ler
    Dado que Seu Antônio tem "Visualização" em Dashboards e em Receitas, mas "Sem acesso" em Despesas
    Quando ele abre o Dashboard Financeiro
    Então as despesas não entram nos números dele$g$,
   $o$Regras: RN-SEC-01 (o painel lê pela permissão dos módulos de origem). Ver também a H-19 e a decisão D-05.$o$),

  (32, 'Ver a ocupação no painel de imóveis', 'Acompanhamento', 'teste',
   'Helena, sócia-administradora',
   'ver quantos imóveis estão alugados, vagos e em manutenção',
   'agir rápido quando a vacância aumenta',
   $g$# language: pt
Funcionalidade: Dashboard de imóveis

  Contexto:
    Dado que a holding tem 14 imóveis ativos: 11 alugados, 2 vagos e 1 em manutenção

  @implementado
  Cenário: Taxa de ocupação
    Quando Helena abre o Dashboard de Imóveis
    Então a "Taxa de Ocupação" considera 11 alugados sobre 14 imóveis ativos

  @implementado
  Cenário: Evolução e resumo
    Quando Helena abre o Dashboard de Imóveis
    Então vê a "Evolução da Ocupação" mês a mês, o IPTU por situação e o "Resumo por Imóvel"$g$,
   $o$Taxa de ocupação = alugados ÷ ativos (inativos ficam de fora).$o$),

  (33, 'Gerar relatórios em PDF e Excel', 'Acompanhamento', 'teste',
   'Dra. Rita, contadora externa',
   'gerar os relatórios financeiro, de imóveis, de contratos e de inadimplência em PDF e Excel',
   'escriturar e prestar contas sem redigitar',
   $g$# language: pt
Funcionalidade: Relatórios

  @implementado
  Esquema do Cenário: Relatório por tipo
    Quando Rita gera o relatório <relatorio> do período "Mês Anterior"
    Então o arquivo é baixado
    E aparece "<mensagem>"

    Exemplos:
      | relatorio     | mensagem                                     |
      | financeiro    | Relatório financeiro gerado com sucesso.     |
      | de imóveis    | Relatório de imóveis gerado com sucesso.     |
      | de contratos  | Relatório de contratos gerado com sucesso.   |
      | inadimplência | Relatório de inadimplência gerado com sucesso. |

  @implementado
  Cenário: Período personalizado
    Quando Rita escolhe o período de 01/01/2026 a 30/06/2026
    Então o relatório traz só os lançamentos desse intervalo

  @implementado
  Cenário: O relatório respeita a permissão de origem
    Dado que Rita tem "Visualização" em Relatórios e "Sem acesso" em Receitas
    Quando ela gera o relatório financeiro
    Então as receitas não aparecem no arquivo$g$,
   $o$Regras: RN-REL-01. O envio automático por e-mail está na H-22.$o$),

  (34, 'Ver as atividades da equipe ao vivo', 'Acesso e governança', 'teste',
   'Helena, sócia-administradora',
   'ver na tela Início quem cadastrou, alterou ou excluiu o quê, na hora em que acontece',
   'acompanhar a operação sem abrir relatório',
   $g$# language: pt
Funcionalidade: Atividades ao vivo

  @implementado
  Cenário: A atividade aparece na hora
    Dado que Helena, administradora, está na tela Início
    Quando Marcos cadastra o imóvel "Apto 101"
    Então aparece no feed de Helena que Marcos cadastrou o imóvel "Apto 101", sem ela recarregar a página

  @implementado
  Cenário: Só o administrador recebe
    Quando Marcos, que não é administrador, abre a tela Início
    Então o feed de atividades não aparece para ele

  @implementado
  Cenário: A tela se atualiza quando outra pessoa grava
    Dado que Helena e Marcos estão com a lista de receitas aberta
    Quando Marcos lança uma receita
    Então a receita aparece na lista de Helena sem ela recarregar a página$g$,
   $o$Regras: RN-AUD-01. O feed usa a mesma trilha da H-21.$o$),

  (35, 'Entrar no sistema e recuperar a senha', 'Acesso e governança', 'teste',
   'Marcos, assistente administrativo',
   'entrar com e-mail e senha e, se esquecer, receber um link para criar outra',
   'usar o sistema sem depender de ninguém para trocar a senha',
   $g$# language: pt
Funcionalidade: Entrada e senha

  @implementado
  Cenário: Senha errada
    Quando Marcos erra a senha
    Então aparece "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente."

  @implementado
  Cenário: Conta desativada
    Dado que Helena desativou o acesso de Marcos
    Quando Marcos entra com e-mail e senha corretos
    Então aparece "Sua conta não está ativa no sistema. Procure um administrador do Controle de Imóveis."

  @implementado
  Cenário: Pedir outra senha
    Quando Marcos pede para recuperar a senha informando o e-mail
    Então aparece "Verifique sua caixa de entrada e siga as orientações enviadas."

  @implementado
  Cenário: Link vencido
    Quando Marcos abre um link de recuperação que já expirou
    Então aparece "O link de recuperação é inválido ou expirou."

  @implementado
  Cenário: Nova senha
    Quando Marcos cria a nova senha pelo link
    Então aparece "Senha redefinida com sucesso. Você já pode entrar com a sua nova senha."

  @implementado
  Cenário: Qualquer tela abre pelo endereço
    Quando Marcos abre direto o endereço da tela de Receitas, ou atualiza o navegador nela
    Então a tela certa abre, e não "página não encontrada"$g$,
   $o$Regras: RN-SEC-02. Em 23/09/2026 foi corrigida a política de segurança do site que impedia o navegador de falar com o banco (login e cadastro davam "Failed to fetch").$o$),

  (36, 'Guardar o contrato assinado e os comprovantes', 'Contratos', 'desenvolvimento',
   'Helena, sócia-administradora',
   'anexar o contrato assinado e os documentos de cada imóvel, contrato e lançamento',
   'achar o papel certo sem procurar em pasta, e só quem pode vê-lo',
   $g$# language: pt
Funcionalidade: Documentos anexados

  @implementado
  Cenário: Anexar um documento
    Quando Helena anexa o PDF do laudo de vistoria à ficha do contrato "2026/003"
    Então aparece "Documento anexado com sucesso."

  @implementado
  Cenário: Arquivo protegido
    Quando alguém sem acesso a Contratos tenta abrir o documento
    Então o documento não abre
    E quem tem acesso abre por um link que expira

  @implementado
  Cenário: Tamanho máximo do contrato assinado
    Quando Helena envia como contrato assinado um PDF de 30 MB
    Então o arquivo é recusado, porque o limite é de 25 MB

  @lacuna
  Cenário: Hoje o formulário aceita .docx que o armazenamento recusa
    Quando Helena escolhe "contrato-2026-003.docx" como contrato assinado
    Então o formulário aceita o arquivo
    Mas o armazenamento recusa ao enviar

  @proposto
  Cenário: O formulário só oferece o que o armazenamento aceita
    Quando Helena escolhe "contrato-2026-003.docx" como contrato assinado
    Então aparece que só são aceitos PDF, JPEG e PNG
    E nada é enviado$g$,
   $o$Regras: RN-SEC-05. Backlog: B-23. Contrato assinado: até 25 MB, PDF, JPEG e PNG.$o$),

  (37, 'Ler com letra maior e usar pelo teclado', 'Acessibilidade', 'teste',
   'Seu Antônio, sócio-fundador',
   'aumentar a letra e usar o sistema pelo teclado ou pelo leitor de tela',
   'usar o sistema sem esforço para enxergar',
   $g$# language: pt
Funcionalidade: Acessibilidade

  @implementado
  Cenário: Aumentar a letra
    Quando Seu Antônio usa o botão "Aumentar o tamanho da letra"
    Então o texto da tela fica maior, sem cortar nem sobrepor

  @implementado
  Cenário: Usar só o teclado
    Quando Seu Antônio navega com a tecla Tab
    Então cada botão e campo mostra um contorno visível ao receber o foco

  @implementado
  Cenário: Leitor de tela anuncia o erro do campo
    Quando o formulário recusa o CPF
    Então o leitor de tela anuncia a mensagem que aparece embaixo do campo

  @implementado
  Cenário: Alvos de toque generosos
    Quando Seu Antônio usa o sistema no celular
    Então os botões têm área de toque de pelo menos 44 px$g$,
   $o$Norma: WCAG 2.2, nível AA. Vale para toda tela nova (Definition of Done).$o$),

  (38, 'Comparar o imposto na pessoa física e na holding', 'Simulador', 'teste',
   'Dra. Rita, contadora externa',
   'comparar o imposto do aluguel na pessoa física e na holding, ano a ano da transição',
   'mostrar à família o que muda de 2026 a 2033',
   $g$# language: pt
Funcionalidade: Comparativo antes e depois da Reforma

  @implementado
  Cenário: Pessoa física
    Quando Rita simula um aluguel de pessoa física
    Então vê o Carnê-Leão pela tabela do ano ao lado do IBS/CBS

  @implementado
  Cenário: Pessoa jurídica
    Quando Rita simula a holding, pessoa jurídica, no Lucro Presumido
    Então vê o PIS/COFINS cumulativo de 3,65% ao lado do IBS/CBS líquido de créditos

  @implementado
  Cenário: Condomínio e IPTU ficam fora da base
    Quando o recibo tem aluguel, condomínio e IPTU
    Então só o aluguel entra na base de cálculo do IBS/CBS

  @implementado
  Cenário: Redutor social só no residencial
    Quando Rita simula um aluguel residencial
    Então a base desconta o redutor social de até R$ 600,00
    Mas no aluguel comercial o redutor não se aplica

  @implementado
  Esquema do Cenário: Transição ano a ano
    Quando Rita escolhe o ano <ano> no Modo Profissional
    Então a alíquota efetiva sobre a locação é <aliquota>

    Exemplos:
      | ano  | aliquota |
      | 2026 | 0,30%    |
      | 2027 | 2,64%    |
      | 2033 | 7,95%    |$g$,
   $o$Regras: RT-02 a RT-08 (docs/simulador.md). Aritmética em centavos.$o$),

  (39, 'Simular a carteira inteira', 'Simulador', 'teste',
   'Dra. Rita, contadora externa',
   'simular todos os imóveis da carteira de uma vez',
   'ver o efeito da Reforma no conjunto, e não imóvel por imóvel',
   $g$# language: pt
Funcionalidade: Gestão de Portfólio

  @implementado
  Cenário: Projeção do conjunto
    Quando Rita cadastra na "Gestão de Portfólio" quatro imóveis alugados, com o aluguel de cada um
    Então vê a projeção do imposto do conjunto dos imóveis$g$,
   $o$Módulo "Gestão de Portfólio" do simulador.$o$),

  (40, 'Laudo com a memória de cálculo', 'Simulador', 'teste',
   'Dra. Rita, contadora externa',
   'gerar o laudo com a memória de cálculo e a base legal de cada número',
   'entregar à família um documento que se sustenta numa conferência',
   $g$# language: pt
Funcionalidade: Parecer de auditoria

  @implementado
  Cenário: Memória de cálculo
    Quando Rita abre o "Parecer de Auditoria" de uma simulação no Modo Profissional
    Então vê o cálculo passo a passo, da base ao imposto
    E cada número traz a base legal na LC 214/2025

  @implementado
  Cenário: Dossiê jurídico
    Quando Rita abre o "Dossiê Jurídico"
    Então vê o texto e os artigos da LC 214/2025 usados na simulação$g$,
   $o$A citação da LC 227/2026 no laudo está na H-24 (B-02).$o$),

  (41, 'Consultar o cronograma da transição por API', 'Simulador', 'teste',
   'Dra. Rita, contadora externa',
   'consultar o cronograma oficial da transição num endereço fixo',
   'usar as mesmas alíquotas na planilha do escritório',
   $g$# language: pt
Funcionalidade: API do cronograma

  @implementado
  Cenário: Consultar o cronograma
    Quando um sistema consulta "GET /api/cronograma-transicao.json"
    Então recebe, em JSON, a alíquota de cada ano de 2026 a 2033
    E a base legal: EC 132/2023 e LC 214/2025$g$,
   $o$Módulo "Integração & Cronograma" do simulador. No site publicado, o endereço é um arquivo estático.$o$),

  (42, 'Acompanhar a construção pela página pública', 'Acompanhamento', 'teste',
   'Seu Antônio, sócio-fundador',
   'abrir um endereço e ver o que já funciona, o que mudou e a saúde do sistema',
   'acompanhar a construção pelo celular, sem senha',
   $g$# language: pt
Funcionalidade: Página de andamento

  @implementado
  Cenário: Ver o andamento sem senha
    Quando Seu Antônio abre o endereço do sistema no celular
    Então vê a faixa "Sistema em fase de desenvolvimento. Esta página mostra o andamento e será removida na publicação."
    E vê o resumo das entregas e as últimas atualizações

  @implementado
  Cenário: Saúde do sistema a cada publicação
    Quando uma nova versão é publicada
    Então a página mostra o resultado das conferências automáticas daquela versão

  @implementado
  Cenário: O quadro de histórias pede entrada
    Quando Seu Antônio, sem entrar no sistema, chega ao quadro de histórias
    Então vê um convite para entrar, e não as histórias$g$,
   $o$Página temporária: sai quando o sistema for publicado de verdade (ver o README do repositório).$o$),

  (43, 'Ver o andamento na tela Início', 'Acompanhamento', 'teste',
   'Helena, sócia-administradora',
   'ver, ao entrar no sistema, os números do dia, o objetivo da holding e os próximos passos',
   'saber em que pé as coisas estão sem abrir cada tela',
   $g$# language: pt
Funcionalidade: Andamento na tela Início

  @implementado
  Cenário: Números e andamento ao entrar
    Quando Helena entra no sistema
    Então a tela Início mostra os números e, logo abaixo, o objetivo da holding até o fim de 2026, quantas entregas estão prontas e os três próximos passos

  @implementado
  Cenário: Indicador ainda não medido
    Quando um resultado do objetivo ainda não tem medição
    Então ele aparece assim mesmo, sem número inventado

  @implementado
  Cenário: Quadro completo a um clique
    Quando Helena escolhe "Ver o quadro completo"
    Então abre a página de andamento$g$,
   $o$Objetivos e indicadores: docs/08-produto/README.md (Product Goal).$o$),

  (44, 'Organizar as histórias no quadro', 'Acompanhamento', 'teste',
   'Helena, sócia-administradora',
   'criar, editar e mover as histórias do sistema num quadro, e homologar o que ficou pronto',
   'decidir o que entra e saber o que falta sem depender de documento técnico',
   $g$# language: pt
Funcionalidade: Quadro de histórias

  Contexto:
    Dado que Helena tem "Edição" no módulo "Quadro de histórias"

  @implementado
  Cenário: O cartão por fora
    Quando Helena abre o quadro
    Então vê as colunas Backlog, Desenvolvimento, Teste, Homologação e Concluído
    E cada cartão mostra o número, o título, a etiqueta e as atividades feitas, como "3/5"

  @implementado
  Cenário: O cartão por dentro
    Quando Helena abre o cartão "H-07 — Imóvel acompanha o contrato"
    Então vê o título, o "Eu, quero, para", os critérios de aceitação em BDD, as observações e as atividades com caixa de seleção

  @implementado
  Cenário: Criar uma história
    Quando Helena cria a história "Enviar o recibo por WhatsApp" com a etiqueta "Financeiro"
    Então ela entra no Backlog com o próximo número livre

  @implementado
  Cenário: Marcar uma atividade
    Quando Helena marca uma atividade como feita
    Então o cartão passa a contar uma atividade feita a mais

  @implementado
  Cenário: Homologar
    Dado que a H-07 está em "Teste"
    Quando Helena a move para "Homologação" e, conferida, para "Concluído"
    Então a trilha registra que foi Helena quem moveu

  @implementado
  Cenário: Sem sessão não se homologa
    Quando uma gravação sem pessoa logada — migração, SQL Editor ou automação — tenta levar a H-07 para "Homologação"
    Então o banco recusa com "Só uma pessoa que entrou no sistema leva a história para Homologação ou Concluído, ou a tira de lá. Sem sessão, a história fica entre Backlog, Desenvolvimento e Teste."

  @implementado
  Cenário: Concluído só depois da Homologação
    Dado que a H-07 está em "Teste"
    Quando Helena tenta movê-la direto para "Concluído"
    Então aparece "A história só vai para Concluído depois de passar pela Homologação. Mova para Homologação primeiro."

  @implementado
  Cenário: Quem não tem acesso não vê
    Dado que Marcos está "Sem acesso" no módulo "Quadro de histórias"
    Quando ele abre a página inicial
    Então o quadro não aparece para ele

  @implementado
  Cenário: Ninguém exclui história
    Quando um pedido para excluir a H-07 chega ao banco
    Então o banco recusa$g$,
   $o$Regras: RN-QDR-01 a RN-QDR-04. As colunas Homologação e Concluído são das pessoas: o agente de código só move entre Backlog, Desenvolvimento e Teste.$o$),

  (45, 'Administrar quem usa o sistema', 'Acesso e governança', 'teste',
   'Helena, sócia-administradora',
   'dar a cada pessoa acesso só aos módulos de que ela precisa, e tirar quando ela sair',
   'que ninguém veja ou altere mais do que deve',
   $g$# language: pt
Funcionalidade: Usuários e permissões

  @implementado
  Cenário: Dar acesso por módulo
    Quando Helena dá "Edição" em Receitas e "Visualização" em Relatórios a Marcos
    Então aparece "Usuário atualizado com sucesso."
    E Marcos passa a lançar receitas e a ver relatórios, sem mexer no resto

  @implementado
  Cenário: Ninguém se promove
    Quando um pedido de Marcos para se dar o perfil de administrador chega ao banco
    Então o banco recusa

  @implementado
  Cenário: Não desativar a si mesma
    Quando Helena tenta desativar a própria conta
    Então aparece "Você não pode desativar a sua própria conta."

  @implementado
  Cenário: Desativar quem saiu
    Quando Helena desativa o acesso de Marcos
    Então Marcos não vê mais nada, mesmo com as permissões que tinha$g$,
   $o$Regras: RN-SEC-01, RN-SEC-02, RN-SEC-03, RN-SEC-06, RN-AUD-04. O primeiro administrador é promovido pelo SQL Editor.$o$),

  -- ── Backlog que ainda não tinha história ────────────────────────────────────

  (46, 'Mascarar agência e conta', 'Acesso e governança', 'backlog',
   'Helena, sócia-administradora',
   'que a agência e a conta da holding apareçam mascaradas nas telas',
   'não expor os dados bancários a quem só precisa conferir o extrato',
   $g$# language: pt
Funcionalidade: Agência e conta mascaradas

  Contexto:
    Dado que a conta "Itaú — Conta Corrente PJ" tem agência 0123 e conta 45678-7

  @proposto
  Cenário: A tela mostra só o final
    Quando Marcos abre a lista de contas bancárias
    Então a conta aparece como "****-7"

  @proposto
  Cenário: Número completo só para quem edita
    Dado que Helena tem "Edição" em "Importar Extrato"
    Quando ela escolhe "Mostrar número completo"
    Então vê a agência 0123 e a conta 45678-7
    Mas Rita, com "Visualização", não tem essa opção

  @proposto
  Cenário: A trilha também mascara
    Quando Helena altera a conta
    Então a trilha registra a agência e a conta mascaradas$g$,
   $o$Regras: RN-SEC-08. Backlog: B-21 (achado S-11).$o$),

  (47, 'Aviso de arquivo de extrato repetido', 'Extrato bancário', 'backlog',
   'Marcos, assistente administrativo',
   'ser avisado quando escolho um extrato que já importei',
   'não perder tempo conferindo transação por transação',
   $g$# language: pt
Funcionalidade: Aviso de arquivo repetido

  Contexto:
    Dado que "extrato-itau-2026-09.ofx", de 01/09/2026 a 18/09/2026, já foi importado na conta "Itaú — Conta Corrente PJ"

  @proposto
  Cenário: Mesmo arquivo, mesma conta, mesmo período
    Quando Marcos escolhe o mesmo arquivo para a mesma conta
    Então a tela avisa que esse extrato já foi importado, antes de processar
    E Marcos escolhe se segue mesmo assim

  @proposto
  Cenário: Mesmo nome, período diferente
    Quando o novo "extrato-itau-2026-09.ofx" vai de 19/09/2026 a 30/09/2026
    Então nenhum aviso de arquivo aparece$g$,
   $o$Regras: RN-IMP-11. Backlog: B-30. O aviso por transação (RN-IMP-07) já existe — ver H-15.$o$),

  (48, 'Motivo para excluir lançamento', 'Financeiro', 'backlog',
   'Dra. Rita, contadora externa',
   'que toda exclusão de receita, despesa ou IPTU traga o motivo',
   'entender a diferença no fechamento sem precisar perguntar',
   $g$# language: pt
Funcionalidade: Exclusão com motivo

  Contexto:
    Dado a receita de R$ 3.200,00 do "Apto 302", competência "2026-09"

  @proposto
  Cenário: Excluir pede o motivo
    Quando Marcos escolhe "Excluir" na receita
    Então o sistema pede um motivo curto
    E sem motivo a receita não é excluída

  @proposto
  Cenário: O motivo fica na trilha
    Quando Marcos exclui a receita com o motivo "Lançada em dobro — a original é a de 10/09"
    Então a trilha registra a exclusão, o registro excluído e o motivo$g$,
   $o$Regras: RN-AUD-05. Backlog: B-28.$o$),

  (49, 'Guardar só os dados necessários do inquilino', 'Cadastros', 'backlog',
   'Helena, sócia-administradora',
   'guardar do inquilino só o necessário para o contrato e a cobrança',
   'cumprir a LGPD e não expor dado pessoal a quem não precisa',
   $g$# language: pt
Funcionalidade: Dados mínimos do inquilino

  @proposto
  Cenário: RG e data de nascimento são opcionais
    Quando Helena cadastra Carla Mendes só com nome, CPF, telefone e endereço
    Então o inquilino é cadastrado

  @proposto
  Cenário: Dado opcional só para quem edita
    Dado que Carla Mendes tem RG e data de nascimento cadastrados
    Quando Rita, com "Visualização" em Inquilinos, abre a ficha
    Então o RG e a data de nascimento não aparecem

  @proposto
  Cenário: A trilha não descreve dado pessoal
    Quando Helena altera o telefone de Carla Mendes
    Então a descrição na trilha não traz o CPF nem o telefone$g$,
   $o$Regras: RN-INQ-06 (Lei 13.709/2018 — LGPD). Backlog: B-27 (achado S-13).$o$),

  (50, 'Conferir o CEP antes de salvar', 'Cadastros', 'backlog',
   'Helena, sócia-administradora',
   'que o CEP seja conferido no próprio campo, antes de salvar',
   'não guardar endereço com CEP errado',
   $g$# language: pt
Funcionalidade: Conferência do CEP

  @proposto
  Esquema do Cenário: CEP no cadastro do imóvel
    Quando Helena informa o CEP "<cep>" e salva
    Então <resultado>

    Exemplos:
      | cep       | resultado                                   |
      | 01310-100 | o imóvel é salvo                            |
      | 01310100  | o imóvel é salvo                            |
      | 1310-100  | embaixo do CEP aparece que ele tem 8 números |$g$,
   $o$Backlog: B-34 (pendência 4 do quadro público).$o$),

  (51, 'IPTU repassado ao inquilino vira reembolso', 'Financeiro', 'backlog',
   'Helena, sócia-administradora',
   'que o IPTU pago pela holding vire reembolso previsto quando o contrato o repassa ao inquilino',
   'não esquecer de cobrar o que o inquilino deve devolver',
   $g$# language: pt
Funcionalidade: IPTU repassado

  @proposto
  Cenário: Parcela paga gera reembolso previsto
    Dado que o contrato "2026/003" do "Apto 302" transfere o IPTU a Carla Mendes
    Quando Marcos registra o pagamento da parcela "IPTU 2027 — 1/10", de R$ 248,75, em 10/02/2027
    Então é criada uma receita "Previsto" de R$ 248,75 na categoria "Reembolso", ligada ao contrato "2026/003"

  @proposto
  Cenário: Contrato sem repasse
    Dado que o contrato "2024/011" não transfere o IPTU
    Quando Marcos registra o pagamento de uma parcela do imóvel desse contrato
    Então nenhuma receita de reembolso é criada$g$,
   $o$Regras: RN-IPTU-03 (Lei 8.245/1991, art. 22, VIII). Backlog: B-24. Depende da H-14.$o$),

  (52, 'Multa e juros de atraso em lançamento próprio', 'Financeiro', 'backlog',
   'Marcos, assistente administrativo',
   'que o sistema proponha a multa e os juros quando o aluguel é pago com atraso',
   'lançar o acessório separado do aluguel, pelo que o contrato diz',
   $g$# language: pt
Funcionalidade: Multa e juros de atraso

  Contexto:
    Dado que o contrato "2026/003" registra multa moratória e juros de mora
    E o aluguel de setembro/2026, de R$ 3.200,00, venceu em 10/09/2026

  @proposto @decisao-pendente
  Cenário: Aluguel pago com atraso
    Quando Marcos baixa o recebimento em 20/09/2026
    Então o sistema propõe multa e juros pelos percentuais do contrato
    E, confirmados, eles são lançados nas categorias "Multa" e "Juros", separados do aluguel

  @proposto
  Cenário: Contrato sem percentual
    Dado que o contrato não informa multa nem juros de atraso
    Quando o aluguel é pago com atraso
    Então nenhuma multa nem juro é proposto$g$,
   $o$Regras: RN-FIN-10. Backlog: B-18. O percentual é o do contrato — o sistema não impõe teto.
Decisão pendente D-04 (advogado).$o$),

  (53, 'Valor estimado do imóvel com data e método', 'Cadastros', 'backlog',
   'Helena, sócia-administradora',
   'registrar junto do valor estimado a data, o método e quem estimou',
   'saber se o valor ainda serve para seguro, venda ou partilha',
   $g$# language: pt
Funcionalidade: Valor estimado

  @proposto
  Cenário: Estimativa completa
    Quando Helena informa o valor estimado de R$ 680.000,00 para o "Apto 302", pelo método "comparativo", em 15/09/2026
    Então o imóvel guarda o valor, a data, o método e quem estimou

  @proposto
  Cenário: Estimativa antiga
    Dado que a última estimativa da "Sala 5 — Ed. Central" é de 10/08/2024
    Quando Helena abre o imóvel em 23/09/2026
    Então o valor estimado aparece como "desatualizado"$g$,
   $o$Regras: RN-IMV-06 (desatualizada depois de 24 meses). Backlog: B-29.$o$),

  (54, 'Página própria do simulador', 'Simulador', 'backlog',
   'Dra. Rita, contadora externa',
   'que o simulador tenha apresentação e título próprios',
   'indicar a outros contadores um endereço que se explica sozinho',
   $g$# language: pt
Funcionalidade: Apresentação do simulador

  @proposto
  Cenário: Título da página
    Quando alguém abre o endereço do simulador
    Então a aba do navegador mostra um título que diz o que a página faz

  @proposto
  Cenário: Encontrado na busca
    Quando um contador busca por "simulador IBS CBS aluguel"
    Então encontra a página do simulador com uma descrição própria$g$,
   $o$Backlog: B-25 (Could). Oportunidade: o simulador com laudo é porta de entrada para contadores.$o$),

  (55, 'Histórico de sinistros por imóvel', 'Cadastros', 'backlog',
   'Helena, sócia-administradora',
   'registrar cada sinistro do imóvel, com o custo e se o seguro cobriu',
   'negociar a renovação do seguro com o histórico na mão',
   $g$# language: pt
Funcionalidade: Sinistros

  @proposto
  Cenário: Registrar um sinistro
    Quando Helena registra no "Apto 302" o sinistro "Infiltração pelo telhado", de 14/03/2026, com R$ 4.300,00 de reparo e o seguro acionado
    Então o sinistro fica no histórico do imóvel

  @proposto
  Cenário: Ver o histórico
    Quando Helena abre o histórico de sinistros do "Apto 302"
    Então vê cada sinistro com a data, o custo e se o seguro cobriu$g$,
   $o$Backlog: B-36 (oportunidade). Aproveita o tipo "seguro" que já existe em IPTU e taxas.$o$),

  (56, 'Cobrança por boleto e PIX', 'Financeiro', 'backlog',
   'Helena, sócia-administradora',
   'emitir a cobrança do aluguel por boleto ou PIX pelo sistema',
   'que o pagamento dê baixa sozinho no aluguel previsto',
   $g$# language: pt
Funcionalidade: Cobrança

  @proposto
  Cenário: Emitir a cobrança
    Dado o aluguel previsto de setembro/2026 de Carla Mendes, de R$ 3.200,00, com vencimento em 10/09/2026
    Quando Helena emite a cobrança
    Então Carla recebe um boleto ou um PIX de R$ 3.200,00 com esse vencimento

  @proposto
  Cenário: O pagamento dá baixa sozinho
    Quando o banco confirma o pagamento da cobrança
    Então o aluguel previsto passa a "Recebido"$g$,
   $o$Backlog: B-33 — fora do Product Goal atual (Won't). Depende da H-08. Hoje o sistema registra o recebimento, mas não emite a cobrança.$o$),

  (57, 'Extrato por Open Finance', 'Extrato bancário', 'backlog',
   'Marcos, assistente administrativo',
   'que as transações do banco entrem sozinhas, sem baixar arquivo',
   'não depender de exportar o extrato todo mês',
   $g$# language: pt
Funcionalidade: Extrato automático

  @proposto
  Cenário: Transações do dia anterior
    Dado que Helena autorizou o acesso à conta do Itaú pelo Open Finance
    Quando chega o dia seguinte
    Então as transações do dia anterior entram na fila de classificação sem ninguém importar arquivo$g$,
   $o$Regras: RN-IMP-03 (evolução). Backlog: B-31 — fora do Product Goal atual (Won't).$o$),

  (58, 'Separação por organização', 'Acesso e governança', 'backlog',
   'Helena, sócia-administradora',
   'que outra holding possa usar o sistema sem enxergar os dados da Holding Aguiar',
   'oferecer o sistema a outras famílias com segurança',
   $g$# language: pt
Funcionalidade: Organizações separadas

  @proposto
  Cenário: Duas holdings não se enxergam
    Dado que a Holding Aguiar e outra holding usam o mesmo sistema
    Quando Helena abre Imóveis
    Então vê só os imóveis da Holding Aguiar$g$,
   $o$Regras: RN-SEC-10. Backlog: B-32 — fora do Product Goal atual (Won't). Débito RD-10 / S-09.$o$),

  (59, 'Aplicativo para celular', 'Acompanhamento', 'backlog',
   'Seu Antônio, sócio-fundador',
   'instalar um aplicativo da holding no celular',
   'abrir o sistema com um toque, sem digitar endereço',
   $g$# language: pt
Funcionalidade: Aplicativo

  @proposto
  Cenário: Entrar pelo aplicativo
    Quando Seu Antônio instala o aplicativo e entra com o mesmo e-mail e senha
    Então vê as mesmas telas que vê no navegador$g$,
   $o$Backlog: B-35 — fora do Product Goal atual (Won't). Hoje as telas já funcionam no navegador do celular.$o$);

  -- Atividades: o que foi entregue (marcado) e o que falta (desmarcado).
  -- Histórias do Backlog não têm atividade: elas nascem quando a história entra
  -- em desenvolvimento.
  insert into public.historias_atividades (historia, titulo, concluida, ordem)
  select h.id, a.titulo, a.concluida, a.ordem
    from (values
      (1,  'O banco recusa inativar ou excluir imóvel com contrato ativo, com o motivo', true, 1),
      (1,  'Inativar pela lista o imóvel sem contrato ativo', true, 2),
      (1,  'A trilha registra a mudança de situação', true, 3),
      (1,  'Mostrar o motivo da recusa ao inativar pela lista (B-14)', false, 4),
      (1,  'Mostrar o motivo embaixo do campo Status no formulário (B-14)', false, 5),
      (1,  'Teste de banco da recusa com contrato ativo (B-04)', false, 6),

      (2,  'Situação "Em manutenção" no cadastro do imóvel', true, 1),
      (2,  'Despesa de reforma ligada ao imóvel e ao fornecedor', true, 2),
      (2,  'Fim do contrato devolve o imóvel a vago', true, 3),
      (2,  'Pedir confirmação antes de alugar imóvel em manutenção (B-26)', false, 4),

      (3,  'CPF com dígito verificador, na tela e no banco', true, 1),
      (3,  'CPF único entre os inquilinos', true, 2),
      (3,  'E-mail com formato mínimo', true, 3),
      (3,  'Nome obrigatório', true, 4),

      (4,  'CNPJ alfanumérico aceito na tela', true, 1),
      (4,  'O banco confere o CNPJ por qualquer caminho', true, 2),
      (4,  'CNPJ único entre os inquilinos', true, 3),
      (4,  'Razão social obrigatória', true, 4),

      (5,  'O banco recusa inativar inquilino com contrato ativo', true, 1),
      (5,  'Inativar depois de encerrar o contrato', true, 2),
      (5,  'Mensagem com o motivo da recusa e atalho para o contrato (B-14)', false, 3),
      (5,  'Teste de banco da recusa (B-04)', false, 4),

      (6,  'Um contrato ativo por imóvel no mesmo período', true, 1),
      (6,  'Término não pode ser antes do início', true, 2),
      (6,  'Dia de vencimento entre 1 e 31', true, 3),
      (6,  'Datas entre 1900 e 2200', true, 4),
      (6,  'Mostrar a recusa do reajuste antes do início (B-14)', false, 5),
      (6,  'Testes de banco da sobreposição e das datas (B-04)', false, 6),

      (7,  'Contrato ativo aluga o imóvel', true, 1),
      (7,  'Encerrar o contrato devolve o imóvel a vago', true, 2),
      (7,  'Trocar o imóvel do contrato libera o antigo', true, 3),
      (7,  'Apagar o contrato ativo libera o imóvel', true, 4),

      (11, 'Modalidade de garantia é escolha única', true, 1),
      (11, 'Trocar a modalidade substitui a anterior e fica na trilha', true, 2),

      (13, 'Situação da receita calculada pelo banco', true, 1),
      (13, 'Situação da despesa calculada pelo banco', true, 2),
      (13, 'A situação enviada pela tela é ignorada', true, 3),
      (13, 'Varredura diária às 02:00 marca o atraso', true, 4),

      (15, 'Leitura do OFX e escolha da conta de origem', true, 1),
      (15, 'Aviso de transação já importada', true, 2),
      (15, 'Limite de 5.000 transações por importação', true, 3),
      (15, 'Gravação tudo ou nada (importar_extrato)', true, 4),
      (15, 'Não excluir importação com transação classificada (B-12)', false, 5),
      (15, 'Testes de banco de importar_extrato() (B-04)', false, 6),

      (16, 'Sugestão de tipo, categoria e imóvel, com confiança', true, 1),
      (16, 'Aceitar a sugestão cria o lançamento', true, 2),
      (16, 'Ignorar e reabrir a transação', true, 3),
      (16, 'Confirmar o defeito com um teste que reproduza a classificação (B-01)', false, 4),
      (16, 'Classificar numa gravação só, tudo ou nada (B-01)', false, 5),
      (16, 'Guardar os vínculos da transação como identificadores (B-01)', false, 6),

      (19, 'Permissão por módulo em três níveis, conferida pelo banco', true, 1),
      (19, 'Sem permissão registrada, sem acesso', true, 2),
      (19, 'Usuário desativado não vê nada', true, 3),
      (19, 'Perfil pronto "Contador(a)" (B-22)', false, 4),
      (19, 'Aviso de relatório que sairia vazio (B-22)', false, 5),

      (20, 'Convite com validade de 7 dias', true, 1),
      (20, 'Validar o convite sem login, sem expor a lista', true, 2),
      (20, 'Reenviar renova o prazo', true, 3),
      (20, 'Desligar o cadastro público no Supabase (B-03)', false, 4),
      (20, 'Tela de cadastro só com convite (B-03)', false, 5),
      (20, 'Remetente de e-mail próprio, com o domínio da holding (B-05)', false, 6),

      (21, 'Criação, edição e exclusão viram registro, com o antes e o depois', true, 1),
      (21, 'Ninguém altera nem apaga a trilha', true, 2),
      (21, 'Mudança de acesso também entra na trilha', true, 3),
      (21, 'Só o administrador vê a trilha', true, 4),

      (23, 'Tela de alertas: término e reajuste de contrato, IPTU, receitas e despesas', true, 1),
      (23, 'Filtro por período e por vencidos', true, 2),
      (23, 'Mais urgente primeiro', true, 3),
      (23, 'Janelas fixas de aviso: 90, 60 e 30 dias antes do término (B-20)', false, 4),

      (24, 'Enquadramento do locador pessoa física pelos dois critérios', true, 1),
      (24, 'Pessoa jurídica é sempre contribuinte', true, 2),
      (24, 'Laudo cita a LC 227/2026 nas referências (B-02)', false, 3),

      (25, 'Cadastro com endereço, tipo, matrícula, área e valores', true, 1),
      (25, 'Código do imóvel único', true, 2),
      (25, 'Fotos em armazenamento protegido', true, 3),

      (26, 'Nome obrigatório e nove tipos de fornecedor', true, 1),
      (26, 'CPF ou CNPJ com dígito verificador e único', true, 2),
      (26, 'E-mail com formato mínimo', true, 3),
      (26, 'Despesa guarda o fornecedor', true, 4),

      (27, 'Receita com imóvel, categoria, vencimento e valor', true, 1),
      (27, 'Categorias de receita de referência', true, 2),
      (27, 'Competência no formato AAAA-MM', true, 3),

      (28, 'Despesa com imóvel, fornecedor e categoria', true, 1),
      (28, 'Categorias de despesa de referência', true, 2),
      (28, 'Excluir o fornecedor mantém a despesa', true, 3),

      (29, 'Obrigação por imóvel, com seis tipos', true, 1),
      (29, 'Situação pago, vencido ou pendente calculada pelo banco', true, 2),
      (29, 'Comprovante protegido, até 10 MB', true, 3),

      (30, 'Leitura dos CSV de Itaú, Bradesco, Nubank, Inter, Santander e Banco do Brasil', true, 1),
      (30, 'Cadastro da conta bancária de origem', true, 2),
      (30, 'Transação incompleta recusada com o número dela', true, 3),

      (31, 'Receitas × despesas, evolução do resultado e despesas por categoria', true, 1),
      (31, 'Resumo financeiro por imóvel', true, 2),
      (31, 'Mostra só o que a pessoa pode ler nos módulos de origem', true, 3),

      (32, 'Taxa de ocupação e evolução da ocupação', true, 1),
      (32, 'IPTU por situação e resumo por imóvel', true, 2),

      (33, 'Relatórios financeiro, de imóveis, de contratos e de inadimplência', true, 1),
      (33, 'PDF e Excel', true, 2),
      (33, 'Períodos prontos ou personalizado', true, 3),

      (34, 'Feed de atividades na tela Início, ao vivo', true, 1),
      (34, 'Só o administrador recebe', true, 2),
      (34, 'Telas se atualizam quando outra pessoa grava', true, 3),

      (35, 'Entrada com e-mail e senha', true, 1),
      (35, 'Recuperação e redefinição de senha', true, 2),
      (35, 'Conta desativada não entra', true, 3),
      (35, 'Qualquer tela abre direto pelo endereço', true, 4),
      (35, 'Política de segurança do site liberando o banco (corrigido em 23/09/2026)', true, 5),

      (36, 'Arquivos privados, com link que expira', true, 1),
      (36, 'A permissão do módulo vale para o arquivo', true, 2),
      (36, 'Limite de tamanho e tipo por tipo de documento', true, 3),
      (36, 'Formulário do contrato aceitar só PDF, JPEG e PNG, como o armazenamento (B-23)', false, 4),

      (37, 'Botões para aumentar e diminuir a letra', true, 1),
      (37, 'Uso completo pelo teclado, com foco visível', true, 2),
      (37, 'Erros de campo anunciados pelo leitor de tela', true, 3),
      (37, 'Contraste e alvos de toque de 44 px', true, 4),

      (38, 'Comparativo pessoa física e pessoa jurídica', true, 1),
      (38, 'Base sem condomínio e IPTU, e redutor social no residencial', true, 2),
      (38, 'Transição ano a ano de 2026 a 2033', true, 3),

      (39, 'Módulo "Gestão de Portfólio"', true, 1),

      (40, 'Memória de cálculo passo a passo', true, 1),
      (40, 'Base legal de cada número e dossiê jurídico', true, 2),

      (41, 'Cronograma em JSON num endereço fixo', true, 1),

      (42, 'Resumo, últimas atualizações e saúde do sistema', true, 1),
      (42, 'Conferência automática a cada publicação', true, 2),

      (43, 'Objetivo, entregas prontas e próximos passos na tela Início', true, 1),
      (43, 'Indicador sem medição aparece sem número inventado', true, 2),

      (44, 'Quadro com cinco colunas ligado ao banco', true, 1),
      (44, 'Criar e editar história', true, 2),
      (44, 'Atividades com caixa de seleção', true, 3),
      (44, 'Só uma pessoa leva para Homologação ou Concluído (banco)', true, 4),
      (44, 'Concluído só depois da Homologação (banco)', true, 5),
      (44, 'Permissão pelo módulo "Quadro de histórias"', true, 6),

      (45, 'Permissões por módulo na tela de usuários', true, 1),
      (45, 'Ninguém se promove a administrador', true, 2),
      (45, 'Desativar e reativar o acesso', true, 3)
    ) as a(numero, titulo, concluida, ordem)
    join public.historias h on h.numero = a.numero;

  -- A próxima história criada pelo quadro continua a numeração.
  perform setval(
    pg_get_serial_sequence('public.historias', 'numero'),
    (select max(numero) from public.historias)
  );

  alter table public.historias enable trigger registrar_log;
end;
$carga$;
