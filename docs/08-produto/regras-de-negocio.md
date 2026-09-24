# Catálogo de regras de negócio

> Uma regra por linha, com número estável. A **Parte A** lista o que o sistema já garante hoje; a
> **Parte B**, o que o PO propõe. Onde a regra tem base legal, o artigo está citado — e toda regra
> legal da Parte B passa pela contadora ou pelo advogado antes de ser implementada.

## Convenções

**Numeração.** Estende a de [01-requisitos-e-restricoes.md](../01-requisitos-e-restricoes.md), sem
criar outra: `RN-<MÓDULO>-NN` para regra de negócio e `RT-NN` para regra tributária do simulador. Os
IDs que já existiam (`RN-SEC-01`, `RN-CTR-01`, `RN-CTR-02`, `RN-FIN-01`, `RN-FIN-02`, `RN-IMP-01` a
`RN-IMP-03`, `RT-01` a `RT-08`) mantêm o número e o sentido; os novos continuam a sequência de cada
módulo. Número não se reaproveita: regra abandonada fica marcada como tal.

| Prefixo | Módulo | Prefixo | Módulo |
| :-- | :-- | :-- | :-- |
| `RN-SEC` | Acesso e permissões | `RN-FIN` | Receitas e despesas |
| `RN-AUD` | Trilha de auditoria | `RN-IPTU` | IPTU e taxas |
| `RN-IMV` | Imóveis | `RN-IMP` | Importação e classificação de extrato |
| `RN-INQ` | Inquilinos | `RN-ALR` | Alertas |
| `RN-FOR` | Fornecedores | `RN-REL` | Relatórios |
| `RN-CTR` | Contratos | `RT` | Simulador IBS/CBS |
| `RN-QDR` | Quadro de histórias | | |

**Onde:** *banco* (restrição, gatilho, função ou RLS — vale para qualquer porta de entrada), *tela*
(só no navegador) ou *ambos*. **Testes:** arquivo que confere a regra; "sem teste de banco" é dívida
registrada no [backlog](backlog.md) (item B-04).

## Resumo

| | Implementadas (Parte A) | Propostas (Parte B) |
| :-- | :-: | :-: |
| Regras de negócio `RN-*` | 47 | 29 |
| Regras tributárias `RT-*` | 8 | 1 |
| **Total** | **55** | **30** |

Das 30 propostas, 4 reaproveitam IDs que já estavam em [01](../01-requisitos-e-restricoes.md) e nunca
foram implementadas ou deixaram de valer: `RN-CTR-01`, `RN-CTR-02`, `RN-IMP-01` e `RN-IMP-03`.

### Correções de situação em relação ao documento 01

| ID | O que o 01 diz | Situação real em 19/09/2026 |
| :-- | :-- | :-- |
| RN-SEC-01 | Restrição crítica: permissão avaliada só no cliente | **Implementada** pela RLS ([migração 04](../../supabase/migrations/20260917120004_rls.sql)) |
| RN-CTR-01 | Ao ativar contrato, gerar receitas previstas | **Não implementada** — nem no PocketBase anterior (`pocketbase/hooks/on_contrato_create.js` não cria receitas), nem no Supabase. Passa para a Parte B |
| RN-FIN-01 | Três crons do PocketBase | **Implementada** como uma rotina `pg_cron` às 02:00 de Brasília |
| RN-FIN-02 | Não existe "pago" com valores nulos | **Implementada por construção**: a situação é derivada do valor baixado (RN-FIN-03) |
| RN-IMP-01 | Transação classificada é imutável | **Não aplicada**: "Editar" uma classificada cria outro lançamento, e o banco não impede. Passa para a Parte B |

---

## Parte A — regras implementadas

### Acesso e permissões

| ID | Regra | Justificativa | Origem | Onde | Testes |
| :-- | :-- | :-- | :-- | :-- | :-- |
| <a id="rn-sec-01"></a>RN-SEC-01 | Ver um módulo exige `visualizacao`; criar, alterar ou excluir exige `edicao`, conferido pelo banco em toda consulta | Menu escondido não é segurança (achado S-02) | 01 §1; ADR-0003 | banco — [RLS](../../supabase/migrations/20260917120004_rls.sql) | [`rls.test.ts`](../../supabase/tests/rls.test.ts) |
| <a id="rn-sec-02"></a>RN-SEC-02 | Sem linha de permissão, sem acesso; usuário inativo não vê nada, mesmo com edição concedida | Falhar fechando (S-04) | 06-seguranca | banco — `nivel_no_modulo()` | `rls.test.ts` ("fail-closed") |
| <a id="rn-sec-03"></a>RN-SEC-03 | Só administrador ativo muda perfil ou situação de alguém; ninguém se promove; o primeiro administrador é promovido pelo SQL Editor | Evitar tomada de conta por dentro | migração 11.1 | banco — `tg_proteger_privilegio` | [`privilegio.test.ts`](../../supabase/tests/privilegio.test.ts) |
| <a id="rn-sec-04"></a>RN-SEC-04 | O perfil nasce com o login; quem entra por convite pendente e não vencido recebe o perfil do convite; convite vale 7 dias e reenviar renova por mais 7 | Entrada controlada pelo administrador | migrações 03 e 07; [`convites.ts`](../../src/services/convites.ts) | banco + tela | `privilegio.test.ts` ("perfil nasce junto do login") |
| <a id="rn-sec-05"></a>RN-SEC-05 | Arquivos só em bucket privado, abertos por link assinado e com a permissão do módulo; limite de tamanho e tipo por bucket | Contrato e comprovante não podem ficar em endereço aberto (S-05) | migração 05 | banco (storage) | `rls.test.ts` ("arquivos") |
| <a id="rn-sec-06"></a>RN-SEC-06 | Administrador tem `edicao` em todo módulo sem precisar de linha de permissão; só ele vê Usuários e a trilha | Operação da holding por quem responde por ela | migração 04 | banco + tela | `rls.test.ts` ("administrador") |

### Trilha de auditoria

| ID | Regra | Justificativa | Origem | Onde | Testes |
| :-- | :-- | :-- | :-- | :-- | :-- |
| <a id="rn-aud-01"></a>RN-AUD-01 | Toda criação, edição e exclusão nas tabelas de negócio gera registro com autor, rótulo legível e, na edição, o "de → para" de cada campo | Rastreabilidade (NFR-07); memória da organização (Ozorhon *et al.*, 2014) | 01 NFR-07; RD-09 | banco — `tg_registrar_log` | [`gatilhos.test.ts`](../../supabase/tests/gatilhos.test.ts) ("trilha de auditoria") |
| <a id="rn-aud-02"></a>RN-AUD-02 | A trilha não se altera nem se apaga, nem pelo administrador; só o administrador a lê | Trilha que se reescreve não prova nada | migração 04 | banco (RLS sem UPDATE/DELETE) | `rls.test.ts` ("logs_atividade") |
| <a id="rn-aud-03"></a>RN-AUD-03 | Autor do registro vem da sessão; não se cria registro em nome de outra pessoa; autoria original não muda | Autoria forjável invalida a trilha | migração 11.2 | banco — `tg_marcar_autoria` | `gatilhos.test.ts` ("autoria e carimbo") |
| <a id="rn-aud-04"></a>RN-AUD-04 | Promover, desativar, conceder ou retirar permissão entra na trilha; trocar o próprio nome não entra | Privilégio é o dado mais sensível | migração 11.5 | banco | `privilegio.test.ts` ("trilha das mudanças de privilégio") |

### Imóveis

| ID | Regra | Justificativa | Origem | Onde | Testes |
| :-- | :-- | :-- | :-- | :-- | :-- |
| <a id="rn-imv-01"></a>RN-IMV-01 | A situação do imóvel segue o contrato: contrato ativo deixa o imóvel "alugado" e grava o inquilino atual; encerrar, cancelar, trocar de imóvel ou apagar o contrato devolve o imóvel a "vago" se não restar outro contrato ativo nele | Uma fonte da verdade (RD-03) | migrações 03 e 11.3–11.4 | banco — `tg_sincronizar_imovel_do_contrato` | `gatilhos.test.ts` ("imóvel segue o contrato") |
| <a id="rn-imv-02"></a>RN-IMV-02 | Imóvel com contrato ativo não pode ser inativado nem excluído; a recusa diz o motivo e o que fazer | Contrato ativo apontando para imóvel invisível | migração 08.2 | banco (erro `HA001`); a tela ainda não mostra o motivo — genérico na lista, nada no formulário (ver [inventário](inventario-funcional.md#imóveis)) | **sem teste de banco** |
| <a id="rn-imv-03"></a>RN-IMV-03 | Código do imóvel é único quando informado | Identificação sem ambiguidade | migração 02 | banco (`imoveis_codigo_uidx`) | — |
| <a id="rn-imv-04"></a>RN-IMV-04 | Endereço obrigatório; UF com 2 letras; área, quartos, banheiros e vagas ≥ 0; valores ≥ 0 e até o teto de `numeric(14,2)` | Dado físico impossível estraga relatório | S-06; migração 02 | ambos | [`esquemas.test.ts`](../../src/lib/validacao/__tests__/esquemas.test.ts) ("imovelSchema") |

### Inquilinos e fornecedores

| ID | Regra | Justificativa | Origem | Onde | Testes |
| :-- | :-- | :-- | :-- | :-- | :-- |
| <a id="rn-inq-01"></a>RN-INQ-01 | Inquilino com contrato ativo não pode ser inativado nem excluído | Idem RN-IMV-02 | migração 08.2 | banco (`HA001`) | **sem teste de banco** |
| <a id="rn-inq-02"></a>RN-INQ-02 | CPF com dígitos verificadores corretos; sequência repetida recusada; aceita com ou sem máscara; na tela, obrigatório para pessoa física | Documento errado impede cobrança e contrato | S-06 | ambos — [`documentos.ts`](../../src/lib/validacao/documentos.ts), `cpf_valido()` | [`documentos.test.ts`](../../src/lib/validacao/__tests__/documentos.test.ts); **sem teste de banco** |
| <a id="rn-inq-03"></a>RN-INQ-03 | CNPJ com dígitos verificadores corretos, **inclusive o alfanumérico** (letras nas 12 primeiras posições); na tela, obrigatório para pessoa jurídica | Receita Federal emite CNPJ alfanumérico desde julho de 2026 (IN RFB nº 2.229/2024, conforme a migração) | S-06 | ambos — `cnpj_valido()` | `documentos.test.ts` ("exemplo oficial"); **sem teste de banco** |
| <a id="rn-inq-04"></a>RN-INQ-04 | CPF e CNPJ não se repetem entre inquilinos | Evita cadastro duplicado da mesma pessoa | RD-04 | banco (índices parciais) | — |
| <a id="rn-inq-05"></a>RN-INQ-05 | E-mail, quando informado, tem o formato `nome@dominio.ext`, sem espaços | Barrar telefone no campo errado | S-06 | ambos | `esquemas.test.ts` ("emailValido") |
| <a id="rn-for-01"></a>RN-FOR-01 | Fornecedor exige nome; CPF ou CNPJ (decidido pelo tamanho) válido e único; e-mail com formato mínimo | Pagamento ao fornecedor certo | S-06 | ambos | `esquemas.test.ts` ("fornecedorSchema") |

### Contratos

| ID | Regra | Justificativa | Origem | Onde | Testes |
| :-- | :-- | :-- | :-- | :-- | :-- |
| <a id="rn-ctr-03"></a>RN-CTR-03 | Um imóvel não tem dois contratos **ativos** com vigências que se sobrepõem. O intervalo é fechado nas duas pontas: quem termina em 31/03 e quem começa em 31/03 se sobrepõem; quem começa em 01/04 não. Sem data de início, vale "desde sempre"; sem data de fim, "para sempre". Contrato futuro já assinado é permitido | O imóvel só tem um locatário por vez; "inquilino atual" não pode depender de quem foi salvo por último | migração 08.1 | banco (`contratos_um_ativo_por_imovel`) | **sem teste de banco** (citado em comentário de `gatilhos.test.ts`) |
| <a id="rn-ctr-04"></a>RN-CTR-04 | Data de fim ≥ data de início (pode ser no mesmo dia) | Vigência impossível | migração 02 | ambos | `esquemas.test.ts` ("contratoSchema") |
| <a id="rn-ctr-05"></a>RN-CTR-05 | Próxima data de reajuste ≥ data de início | Reajuste antes de o contrato existir não existe | migração 08.5 | banco (`contratos_reajuste_coerente`); a tela não mostra a recusa | **sem teste** |
| <a id="rn-ctr-06"></a>RN-CTR-06 | Na tela: imóvel, inquilino, início, fim e valor do aluguel obrigatórios; dia de vencimento inteiro de 1 a 31; aluguel e garantia ≥ 0 | Contrato sem esses dados não gera cobrança | S-06 | ambos | `esquemas.test.ts` |
| <a id="rn-ctr-07"></a>RN-CTR-07 | Cada contrato tem **uma única** modalidade de garantia (caução, fiador, seguro-fiança, título de capitalização, sem garantia, outros) | Lei 8.245/1991, art. 37, parágrafo único: é vedada mais de uma modalidade de garantia no mesmo contrato, sob pena de nulidade | Lei | banco (enum em coluna única) | — (garantido pela estrutura) |
| <a id="rn-ctr-08"></a>RN-CTR-08 | Número do contrato é único quando informado | Referência sem ambiguidade | migração 02 | banco | — |

> **Nota legal sobre RN-CTR-07.** O art. 37 lista caução, fiança, seguro de fiança locatícia e cessão
> fiduciária de quotas de fundo de investimento. O "título de capitalização" da lista do sistema não
> está no texto do artigo; no mercado costuma ser tratado como forma de caução. A "cessão fiduciária de
> quotas" não tem opção própria (cai em "outros"). **Conferir com o advogado** — decisão D-03 do
> [backlog](backlog.md#decisões-pendentes-do-dono).

### Receitas e despesas

| ID | Regra | Justificativa | Origem | Onde | Testes |
| :-- | :-- | :-- | :-- | :-- | :-- |
| <a id="rn-fin-01"></a>RN-FIN-01 | Todo dia às 02:00 (Brasília), receitas e despesas "previstas" com vencimento passado viram "em atraso", e IPTU/taxas "pendentes" vencidos viram "vencidos" | Base dos alertas; ninguém precisa lembrar | 01 F4 | banco (`pg_cron` + `marcar_lancamentos_em_atraso()`, executável só pelo dono do banco) | `gatilhos.test.ts` ("marcar_lancamentos_em_atraso"); `rls.test.ts` (EXECUTE) |
| <a id="rn-fin-02"></a>RN-FIN-02 | Não existe lançamento "recebido"/"pago" sem valor baixado | Situação sem valor engana o relatório | 01 F4 | banco (por RN-FIN-03) | `gatilhos.test.ts` |
| <a id="rn-fin-03"></a>RN-FIN-03 | A situação é **derivada** a cada gravação: recebido/pago se o valor baixado ≥ previsto (ou ≥ valor, sem previsto); parcial se > 0 e menor; em atraso se venceu sem baixa (vencer **hoje** ainda é "previsto"); senão previsto. O que a tela manda é ignorado | Uma só verdade para a situação | migração 03 | banco | `gatilhos.test.ts` ("status derivado") |
| <a id="rn-fin-04"></a>RN-FIN-04 | Dinheiro em `numeric(14,2)`, nunca negativo; a tela aceita "1.500,50" e "1500.50" | Sem erro de arredondamento (RD-01) | migração 02; S-06 | ambos | `esquemas.test.ts` |
| <a id="rn-fin-05"></a>RN-FIN-05 | Competência no formato `AAAA-MM` | Agrupar por mês sem ambiguidade | migração 02 | ambos | `esquemas.test.ts` |
| <a id="rn-fin-06"></a>RN-FIN-06 | Datas de receitas, despesas, IPTU e contratos entre 01/01/1900 e 31/12/2200 | "0226" digitado às pressas some de todo filtro | migração 08.5 | banco (`*_plausivel`) | **sem teste de banco** |
| <a id="rn-fin-07"></a>RN-FIN-07 | Receita exige imóvel, categoria, vencimento e valor previsto na tela; imóvel no banco | Receita sem imóvel não entra no resultado por imóvel | S-06 | ambos | `esquemas.test.ts` |

### IPTU e taxas

| ID | Regra | Justificativa | Origem | Onde | Testes |
| :-- | :-- | :-- | :-- | :-- | :-- |
| <a id="rn-iptu-01"></a>RN-IPTU-01 | Situação derivada: pago se há data de pagamento; vencido se o vencimento passou; senão pendente | Uma só verdade | migração 03 | banco — `tg_status_do_iptu` | `gatilhos.test.ts` ("status derivado do IPTU") |
| <a id="rn-iptu-02"></a>RN-IPTU-02 | Descrição, valor e vencimento obrigatórios na tela; ano de referência entre 1900 e 2200 | Obrigação sem vencimento não gera alerta | S-06; migração 02 | ambos | `esquemas.test.ts` |

### Importação e classificação de extrato

| ID | Regra | Justificativa | Origem | Onde | Testes |
| :-- | :-- | :-- | :-- | :-- | :-- |
| <a id="rn-imp-02"></a>RN-IMP-02 | A sugestão de tipo, categoria e imóvel é **consultiva**: nada vira lançamento sem ação de uma pessoa; toda transação nasce pendente | Máquina sugere, pessoa decide | 01 F5 | ambos (`importar_extrato()` força pendente) | [`importacoes.test.ts`](../../src/services/__tests__/importacoes.test.ts) (serviço); **sem teste de banco** |
| <a id="rn-imp-04"></a>RN-IMP-04 | A importação grava o arquivo inteiro ou nada: se falhar no meio, não fica importação pela metade | Queda de conexão não pode deixar total dizendo uma coisa e tabela outra | ADR-0006; `…_importacao_atomica.sql` | banco — `importar_extrato()` | **sem teste de banco** |
| <a id="rn-imp-05"></a>RN-IMP-05 | No máximo 5.000 transações por importação; acima disso, pedir para dividir por período | Proteger o banco de corpo gigante | `…_importacao_atomica.sql` | ambos | **sem teste de banco** |
| <a id="rn-imp-06"></a>RN-IMP-06 | Conta bancária de origem obrigatória e visível para quem importa; linha sem data, descrição, valor ou tipo é recusada apontando o número dela | Erro útil em vez de "null value" | `…_importacao_atomica.sql` | banco | **sem teste de banco** |
| <a id="rn-imp-07"></a>RN-IMP-07 | Aviso de duplicata: mesma data, diferença de valor menor que R$ 0,05, mesmo sentido e descrição parecida (similaridade ≥ 0,65); a pessoa desmarca ou importa mesmo assim | Extrato baixado duas vezes | 01 F5 | tela — [`extratos-engine.ts`](../../src/lib/extratos-engine.ts) | — |
| <a id="rn-imp-08"></a>RN-IMP-08 | Data da importação, contadores e situação nascem no banco, não no pedido | Não se forja contador | `…_importacao_atomica.sql` | banco | **sem teste de banco** |

### Alertas e relatórios

| ID | Regra | Justificativa | Origem | Onde | Testes |
| :-- | :-- | :-- | :-- | :-- | :-- |
| <a id="rn-alr-01"></a>RN-ALR-01 | Alertas de término e de reajuste de contrato ativo, de IPTU/taxas e de receitas e despesas a vencer e vencidas; filtro por 7, 15 ou 30 dias ou só vencidos; mais urgentes primeiro; cada pessoa só vê o que pode ler nos módulos de origem | Lembrar pela Helena | 01 F6 | tela ([`Alertas.tsx`](../../src/pages/Alertas.tsx)) + banco (RLS) | — |
| <a id="rn-rel-01"></a>RN-REL-01 | Relatórios financeiro, de imóveis, de contratos e de inadimplência, em PDF e Excel, por período | Prestação de contas à família e à contadora | 01 F6 | tela ([`reports-generator.ts`](../../src/lib/reports-generator.ts)) | — |

### Quadro de histórias

| ID | Regra | Justificativa | Origem | Onde | Testes |
| :-- | :-- | :-- | :-- | :-- | :-- |
| <a id="rn-qdr-01"></a>RN-QDR-01 | Só uma pessoa que entrou no sistema leva a história para Homologação ou Concluído, ou a tira de lá. Sem sessão — migração, SQL Editor, automação, agente de código — a história só anda entre Backlog, Desenvolvimento e Teste | Homologar é aceitar com dado real; isso é decisão de gente, não de quem escreveu o código (decisão do dono, 23/09/2026) | Dono | banco (`tg_proteger_homologacao`, erro `HA002`) | [`quadro.test.ts`](../../supabase/tests/quadro.test.ts) |
| <a id="rn-qdr-02"></a>RN-QDR-02 | Concluído só a partir de Homologação; ninguém cria história já concluída | "Tudo precisa ser homologado" | Dono | banco + tela (`destinosPermitidos`) | [`quadro.test.ts`](../../supabase/tests/quadro.test.ts), [`services/__tests__/quadro.test.ts`](../../src/services/__tests__/quadro.test.ts) |
| <a id="rn-qdr-03"></a>RN-QDR-03 | Ver o quadro exige visualização no módulo `quadro`; criar e editar história e atividade, edição. Ninguém exclui história — a que não vale mais volta ao Backlog com a observação; atividade pode ser excluída. Visitante sem login não vê o quadro | A história é a documentação do sistema; o que foi combinado não some | PO | banco (RLS) + tela | [`quadro.test.ts`](../../supabase/tests/quadro.test.ts) |
| <a id="rn-qdr-04"></a>RN-QDR-04 | História e atividade têm título preenchido (até 160 e 200 caracteres); a etiqueta tem até 40 | Cartão sem título não se acha no quadro | PO | ambos | [`quadro.test.ts`](../../supabase/tests/quadro.test.ts) |

### Simulador IBS/CBS

As regras `RT-01` a `RT-08` (enquadramento do locador PF, exclusão de encargos, redutor social,
redução de 70%, cronograma 2026–2033, créditos, comparativo e aritmética em centavos) estão
especificadas em [01, §3](../01-requisitos-e-restricoes.md#3-regras-tributárias-ibscbs--especificação-normativa)
e documentadas com a base legal em [simulador.md](../simulador.md). Implementadas em
[`src/simulador/core/`](../../src/simulador/core), com testes em
[`src/simulador/__tests__/`](../../src/simulador/__tests__). Este catálogo não as repete para não criar
duas versões.

---

## Parte B — regras propostas pelo PO

Cada proposta tem enunciado, justificativa, cenários (em [histórias](historias-e-cenarios.md)) e o item
do [backlog](backlog.md). "Onde implementar" é sugestão; a decisão técnica é da equipe.

### Contratos

<a id="rn-ctr-01"></a>
**RN-CTR-01 — Receitas previstas geradas pelo contrato** *(ID do 01, nunca implementado)*

- **Regra.** Ao ativar um contrato, o sistema cria uma receita "prevista" por competência da vigência,
  com vencimento no `dia_vencimento` (no mês curto, o último dia do mês), valor do aluguel vigente,
  categoria "Aluguel", ligada ao contrato, ao imóvel e ao inquilino. Editar o valor ou o dia do contrato
  ajusta só as previstas futuras ainda sem baixa. Encerrar ou cancelar: ver RN-CTR-13.
- **Justificativa.** É o que faz o sistema "lembrar" do aluguel e o que torna possível conciliar
  (RN-FIN-08). Sem ela, a Helena lança duas vezes.
- **Onde implementar.** banco (gatilho ou função chamada na ativação). **Decisão pendente D-01:** primeiro
  mês proporcional ou cheio. · **Backlog:** B-06 · **Cenários:** H-08.

<a id="rn-ctr-02"></a>
**RN-CTR-02 — Reajuste anual automático pelo índice do contrato** *(ID do 01)*

- **Regra.** No aniversário do contrato (ou na `proxima_data_reajuste`), o sistema calcula o índice
  acumulado dos 12 meses anteriores publicados, propõe o novo valor arredondado ao centavo, e **só aplica
  depois da confirmação** do administrador. Aplicado, ajusta as receitas previstas futuras, registra o
  reajuste (valor anterior, índice, percentual, valor novo, quem aprovou) e move a próxima data em 12
  meses. Índice do mês ainda não publicado: o reajuste fica "aguardando índice", nunca estimado.
- **Justificativa.** Reajuste perdido é dinheiro que não volta; é o principal argumento de venda do
  concorrente ([00](../00-pesquisa-e-benchmark.md)). Lei 10.192/2001, art. 2º, admite reajuste por
  índice de preços.
- **Onde implementar.** banco + rotina de coleta do índice ([ADR-0007](../05-adr/0007-integracoes-externas.md));
  tabelas `indices_economicos` e `reajustes` já desenhadas em [02, §5](../02-modelagem-de-dados.md).
  **Decisão pendente D-02:** índice acumulado negativo reduz o aluguel ou mantém. · **Backlog:** B-08a (índice digitado) e B-08b (coleta automática) ·
  **Cenários:** H-09.

<a id="rn-ctr-09"></a>
**RN-CTR-09 — Índice de lista fechada e periodicidade mínima anual**

- **Regra.** `indice_reajuste` passa a ser escolhido numa lista (IGP-M, IPCA, INPC, IVAR, "sem reajuste
  por índice"); `periodicidade_reajuste` em meses, **mínimo 12**. Não se aceita reajuste vinculado a
  moeda estrangeira, câmbio ou salário mínimo.
- **Justificativa.** Lei 10.192/2001, art. 2º, § 1º: é nula a estipulação de reajuste com periodicidade
  inferior a um ano. Lei 8.245/1991, art. 17: é livre a convenção do aluguel, vedada a estipulação em
  moeda estrangeira e a vinculação à variação cambial ou ao salário mínimo. Hoje o campo é texto livre
  ("Anual, Semestral…") — débito RD-05.
- **Onde.** ambos (enum + CHECK). · **Backlog:** B-08a · **Cenários:** H-09.

<a id="rn-ctr-10"></a>
**RN-CTR-10 — Caução em dinheiro limitada a 3 aluguéis**

- **Regra.** Com garantia "caução" em dinheiro, `valor_garantia` ≤ 3 × `valor_aluguel`. O sistema
  registra onde a caução está depositada e, na devolução, o valor com os rendimentos.
- **Justificativa.** Lei 8.245/1991, art. 38, § 2º: a caução em dinheiro não pode exceder o equivalente
  a três meses de aluguel e é depositada em caderneta de poupança, revertendo ao locatário as vantagens
  dela decorrentes.
- **Onde.** ambos (CHECK com mensagem própria). · **Backlog:** B-10 · **Cenários:** H-10.

<a id="rn-ctr-11"></a>
**RN-CTR-11 — Valor de garantia coerente com a modalidade**

- **Regra.** "Sem garantia" e "fiador" não têm `valor_garantia` (fica vazio); "caução" e "título de
  capitalização" exigem valor > 0; "seguro-fiança" registra o valor da apólice, se houver.
- **Justificativa.** Evitar contrato "sem garantia" com R$ 9.600 de caução no campo — dado incoerente que
  confunde a devolução.
- **Onde.** ambos. · **Backlog:** B-10 · **Cenários:** H-10.

<a id="rn-ctr-12"></a>
**RN-CTR-12 — Multa rescisória proporcional ao tempo que falta**

- **Regra.** Na devolução antecipada pelo inquilino, a multa calculada é
  `multa pactuada × meses que faltavam ÷ meses do prazo`, arredondada ao centavo, e lançada como receita
  "Multa" ligada ao contrato. Isenta quando a devolução decorre de transferência do inquilino pelo
  empregador para outra localidade, com aviso por escrito de pelo menos 30 dias.
- **Justificativa.** Lei 8.245/1991, art. 4º, *caput* (multa proporcional ao período de cumprimento) e
  parágrafo único (dispensa por transferência). A forma de contar (meses ou dias) segue o contrato —
  **conferir com o advogado** (D-04).
- **Onde.** tela (calculadora na rescisão) + banco (lançamento). · **Backlog:** B-17 · **Cenários:** H-12.

<a id="rn-ctr-13"></a>
**RN-CTR-13 — Encerramento registra a data efetiva e limpa o futuro**

- **Regra.** Encerrar ou cancelar pede a data efetiva da saída; receitas previstas de competências
  posteriores, sem baixa, são canceladas (não apagadas) e ficam na trilha.
- **Justificativa.** Sem isso, RN-CTR-01 deixaria aluguel "em atraso" de quem já saiu.
- **Onde.** banco. · **Backlog:** B-06 · **Cenários:** H-08.

### Imóveis

<a id="rn-imv-05"></a>
**RN-IMV-05 — Contrato novo em imóvel em manutenção pede confirmação**

- **Regra.** Ao ativar contrato de imóvel "em manutenção", a tela avisa e pede confirmação; confirmado,
  o imóvel vira "alugado" (como já faz RN-IMV-01).
- **Justificativa.** Imóvel vago em reforma alugado por engano é situação real de carteira; hoje o
  gatilho troca a situação em silêncio.
- **Onde.** tela. · **Backlog:** B-26 · **Cenários:** H-02.

<a id="rn-imv-06"></a>
**RN-IMV-06 — Valor estimado com data e método**

- **Regra.** Todo `valor_estimado` registra a data da estimativa, o método (comparativo, custo, renda,
  laudo) e quem estimou; estimativa com mais de 24 meses aparece como "desatualizada".
- **Justificativa.** Zujo, Car-Pusic e Zileska-Pancovska (2014): estimativa sem metodologia gera dúvida
  e disputa; Hanák e Korytárová (2014): valor desatualizado é a maior limitação para seguro e sinistro.
- **Onde.** banco + tela. · **Backlog:** B-29.

### Inquilinos

<a id="rn-inq-06"></a>
**RN-INQ-06 — Dados mínimos do inquilino**

- **Regra.** Só se guarda o necessário para o contrato e a cobrança (nome, documento, contato,
  endereço); RG e data de nascimento ficam opcionais e visíveis só a quem tem `edicao` em
  `inquilinos`; nenhum dado pessoal vai para a trilha em texto livre (S-13).
- **Justificativa.** Lei 13.709/2018 (LGPD): tratamento limitado ao necessário para a execução do
  contrato. Inquilino é parte interessada que não tem voz no sistema (Johansen, Eik-Andresen e
  Ekambaram, 2014).
- **Onde.** banco + tela. · **Backlog:** B-27.

### Receitas e despesas

<a id="rn-fin-08"></a>
**RN-FIN-08 — Conciliar contra a receita prevista antes de criar outra**

- **Regra.** Ao classificar um crédito do extrato como aluguel, o sistema procura receita **prevista,
  parcial ou em atraso** do mesmo imóvel (ou do inquilino identificado na descrição) com competência do
  mês ou anterior; havendo uma só, **baixa essa receita** com o valor e a data do extrato e liga a
  transação a ela; havendo várias, a pessoa escolhe; não havendo, cria receita nova como hoje.
- **Justificativa.** É a promessa central do produto ("fecha o mês a partir do extrato"). Hoje a
  classificação cria receita nova e o aluguel previsto fica em atraso para sempre, ou é contado duas
  vezes.
- **Onde.** banco (função atômica, junto de RN-IMP-09). · **Backlog:** B-07 · **Cenários:** H-17.

<a id="rn-fin-09"></a>
**RN-FIN-09 — Recebimento parcial deixa saldo em aberto e o combinado registrado**

- **Regra.** Baixa menor que o previsto deixa a receita "parcial" (já acontece, RN-FIN-03) **e** mostra
  o saldo devedor em Alertas; a pessoa pode registrar o combinado com o inquilino (novo vencimento do
  saldo, abatimento autorizado, motivo). Abatimento concedido fecha a receita como recebida com
  desconto, com o motivo na trilha.
- **Justificativa.** du Preez (2014): divergência pequena resolvida cedo e registrada por escrito não
  vira disputa.
- **Onde.** banco + tela. · **Backlog:** B-13 · **Cenários:** H-17.

<a id="rn-fin-10"></a>
**RN-FIN-10 — Multa e juros de atraso conforme o contrato, em lançamento próprio**

- **Regra.** O contrato registra o percentual de multa moratória e de juros de mora; ao baixar aluguel
  pago depois do vencimento, o sistema propõe os valores e os lança nas categorias "Multa" e "Juros"
  (que já existem), separados do aluguel.
- **Justificativa.** Separar principal de acessório no relatório e no recibo. O percentual é o do
  contrato — o sistema não impõe teto; **conferir com o advogado** (D-04).
- **Onde.** banco + tela. · **Backlog:** B-18.

<a id="rn-fin-11"></a>
**RN-FIN-11 — Recibo discriminado**

- **Regra.** Toda receita recebida pode gerar recibo em PDF com aluguel, encargos, multa e juros em
  linhas separadas, competência, imóvel e forma de pagamento.
- **Justificativa.** Lei 8.245/1991, art. 22, VI: o locador deve fornecer recibo discriminado das
  importâncias pagas, vedada a quitação genérica.
- **Onde.** tela. · **Backlog:** B-19 · **Cenários:** H-17.

<a id="rn-fin-12"></a>
**RN-FIN-12 — Fechamento de competência**

- **Regra.** O administrador fecha um mês (`AAAA-MM`); receitas, despesas e IPTU daquela competência não
  se alteram nem se excluem até ele reabrir, com motivo na trilha.
- **Justificativa.** A contadora escritura sobre número que não muda; o sócio recebe resultado que não
  é revisado depois (previsibilidade — Crawford, 2014).
- **Onde.** banco (RLS/gatilho). · **Backlog:** B-16 · **Cenários:** H-22.

### IPTU e taxas

<a id="rn-iptu-03"></a>
**RN-IPTU-03 — Quem paga o IPTU**

- **Regra.** Por padrão o IPTU é despesa do locador. Se o contrato transfere o IPTU ao inquilino, cada
  parcela paga pela holding gera uma receita "Reembolso" prevista, ligada ao contrato.
- **Justificativa.** Lei 8.245/1991, art. 22, VIII: cabe ao locador pagar impostos e taxas do imóvel,
  salvo disposição expressa em contrário no contrato. O IPTU incide sobre a propriedade de imóvel
  urbano (CTN, art. 32).
- **Onde.** banco + tela. · **Backlog:** B-24.

<a id="rn-iptu-04"></a>
**RN-IPTU-04 — IPTU parcelado de uma vez**

- **Regra.** Cadastrar o IPTU do ano como cota única **ou** em N parcelas (N de 2 a 12, conforme o
  carnê do município), gerando N registros com vencimentos mensais a partir da primeira data; a soma
  das parcelas é exatamente o total, com a diferença de centavos na última.
- **Justificativa.** Muitos municípios parcelam o IPTU em até 10 vezes; hoje a Helena digita parcela
  por parcela, em cada imóvel.
- **Onde.** tela + banco (inserção em lote). · **Backlog:** B-09 · **Cenários:** H-14.

### Importação e classificação

<a id="rn-imp-01"></a>
**RN-IMP-01 — Classificação só se refaz desfazendo o lançamento** *(ID do 01)*

- **Regra.** Transação classificada não é reclassificada por cima. "Desfazer classificação" exclui (ou
  estorna, se o mês estiver fechado) o lançamento gerado e devolve a transação à fila, numa operação
  só; se o lançamento era baixa de receita prevista (RN-FIN-08), desfaz a baixa em vez de excluir.
- **Justificativa.** Hoje "Editar" cria um segundo lançamento.
- **Onde.** banco. · **Backlog:** B-11 · **Cenários:** H-18.

<a id="rn-imp-03"></a>
**RN-IMP-03 — Extrato por Open Finance** *(ID do 01, evolução)*

- **Regra.** Mantida como está no 01: complementar o upload por coleta autorizada via Open Finance. Fora
  do horizonte do Product Goal. · **Backlog:** B-31.

<a id="rn-imp-09"></a>
**RN-IMP-09 — Classificação atômica e com vínculos corretos**

- **Regra.** Criar (ou baixar) o lançamento e marcar a transação como classificada acontecem numa única
  transação do banco; os campos de vínculo gravam **identificadores** (categoria, imóvel, receita ou
  despesa), nunca nomes; se algo falhar, nada fica gravado.
- **Justificativa.** Corrige o defeito provável descrito no [inventário](inventario-funcional.md#classificação-de-transações):
  hoje a tela manda nome para coluna de identificador, e a receita é criada antes da marcação.
- **Onde.** banco (função no molde de `importar_extrato()`). · **Backlog:** B-01 · **Cenários:** H-16.

<a id="rn-imp-10"></a>
**RN-IMP-10 — Importação com transação classificada não se exclui**

- **Regra.** Excluir uma importação só é possível se nenhuma transação dela estiver classificada; caso
  contrário, a tela explica quantas estão e oferece desfazer (RN-IMP-01) antes.
- **Justificativa.** Hoje a exclusão apaga em cascata inclusive as classificadas, e os lançamentos
  perdem a origem — contra a rastreabilidade (NFR-07).
- **Onde.** banco. · **Backlog:** B-12 · **Cenários:** H-15.

<a id="rn-imp-11"></a>
**RN-IMP-11 — Aviso de arquivo repetido**

- **Regra.** Se a mesma conta já tem importação com o mesmo nome de arquivo e o mesmo período de datas,
  a tela avisa antes de processar.
- **Justificativa.** O aviso por transação (RN-IMP-07) já existe; o aviso por arquivo evita o trabalho.
- **Onde.** tela. · **Backlog:** B-30.

### Alertas e relatórios

<a id="rn-alr-02"></a>
**RN-ALR-02 — Janelas fixas de aviso**

- **Regra.** Independentemente do filtro da tela: término de contrato avisado a 90, 60 e 30 dias;
  reajuste a 30 dias; parcela de IPTU a 7 dias; aluguel no dia seguinte ao vencimento sem baixa.
- **Justificativa.** Término exige negociação com antecedência; os avisos alimentam o resumo por e-mail
  (RN-REL-02).
- **Onde.** banco (consulta) + tela. · **Backlog:** B-20 · **Cenários:** H-23.

<a id="rn-rel-02"></a>
**RN-REL-02 — Resultado do mês por e-mail**

- **Regra.** Até o dia 5 de cada mês, cada pessoa que optou recebe o resultado do mês anterior em PDF:
  entradas, saídas, resultado por imóvel, vagos, inadimplência e os avisos da RN-ALR-02. Só vai o que ela
  poderia ver no sistema.
- **Justificativa.** O sócio quer o resultado sem pedir (persona Seu Antônio; Crawford, 2014). Pendente
  no quadro.
- **Onde.** rotina agendada + SMTP próprio (depende de B-05). · **Backlog:** B-15 · **Cenários:** H-22.

### Acesso

<a id="rn-sec-07"></a>
**RN-SEC-07 — Entrada só por convite**

- **Regra.** O cadastro público fica desligado; conta nova só nasce por convite do administrador.
- **Justificativa.** Pendência 2 do quadro: hoje qualquer pessoa cria conta pela API (sem acesso, mas
  existe).
- **Onde.** configuração do Supabase + tela `/signup`. · **Backlog:** B-03.

<a id="rn-sec-08"></a>
**RN-SEC-08 — Agência e conta mascaradas**

- **Regra.** Agência e conta aparecem mascaradas na tela e nos registros (ex.: `****-7`); o número
  completo só sob ação explícita de quem tem `edicao`.
- **Justificativa.** Achado S-11 e débito RD-07.
- **Onde.** tela + banco (trilha). · **Backlog:** B-21.

<a id="rn-sec-09"></a>
**RN-SEC-09 — Perfis de acesso prontos e coerentes**

- **Regra.** A tela de permissões oferece perfis prontos — "Sócio (leitura)", "Contador(a)",
  "Operação" — que concedem juntos os módulos de origem de que dashboards, alertas e relatórios
  dependem; conceder Relatórios sem Receitas mostra aviso.
- **Justificativa.** Hoje é possível dar acesso a um relatório que sai vazio, porque a RLS dos módulos
  de origem decide (ver [personas](personas.md#1-seu-antônio--sócio-fundador)).
- **Onde.** tela. · **Backlog:** B-22 · **Cenários:** H-19.

<a id="rn-sec-10"></a>
**RN-SEC-10 — Separação por organização**

- **Regra.** Mantida como débito RD-10 / S-09: toda tabela ganha a organização dona antes de o sistema
  atender uma segunda holding. · **Backlog:** B-32 (fora do Goal).

### Trilha de auditoria

<a id="rn-aud-05"></a>
**RN-AUD-05 — Excluir lançamento financeiro exige motivo**

- **Regra.** Excluir receita, despesa ou IPTU pede um motivo curto, gravado na trilha junto do registro
  excluído.
- **Justificativa.** A trilha já guarda o quê e quem (RN-AUD-01); falta o porquê, que é o que a
  contadora pergunta.
- **Onde.** banco + tela. · **Backlog:** B-28.

### Simulador

<a id="rt-09"></a>
**RT-09 — Laudo cita a LC 227/2026**

- **Regra.** `LEGAL_REFERENCES` e o laudo de auditoria citam a LC 227/2026 ao aplicar a dedução mensal
  do art. 260 da LC 214/2025 (conforme a pendência registrada em [01, §3](../01-requisitos-e-restricoes.md)).
- **Justificativa.** O cálculo já está certo; a fundamentação é que sustenta o uso profissional. Em
  andamento no quadro.
- **Onde.** [`src/simulador/core/`](../../src/simulador/core). · **Backlog:** B-02.
