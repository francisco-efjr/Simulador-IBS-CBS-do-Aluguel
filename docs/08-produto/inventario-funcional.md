# Inventário funcional — o que o sistema faz hoje

> Levantamento de 19/09/2026, conferido contra o código da branch `feat/auditor-e-producao`. Toda
> afirmação aponta o arquivo onde se confere. **Onde:** *tela* = só no navegador; *banco* = restrição,
> gatilho ou RLS no Postgres (vale para qualquer porta de entrada); *ambos* = a tela avisa antes e o banco
> é a última barreira.
>
> **Situação:** ✅ pronto · ◐ parcial (existe, mas com lacuna ou defeito conhecido) · ○ pendente.
> A situação "pronto" do quadro público ([`src/data/andamento.json`](../../src/data/andamento.json)) foi
> respeitada; onde o código mostra lacuna que o quadro não diz, está marcado ◐ e explicado.

## Mapa rápido

| Módulo (permissão) | Rotas | Situação | Achados deste levantamento |
| :-- | :-- | :-- | :-- |
| Imóveis (`imoveis`) | `/imoveis` | ◐ | A recusa de inativar com contrato ativo não chega à pessoa: mensagem genérica na lista, nenhuma no formulário |
| Inquilinos (`inquilinos`) | `/inquilinos` | ◐ | Mensagem genérica ao inativar pela lista |
| Fornecedores (`fornecedores`) | `/fornecedores` | ✅ | — |
| Contratos (`contratos`) | `/contratos` | ◐ | Não gera receitas previstas; reajuste é só lembrete; índice e periodicidade em texto livre; anexo `.doc/.docx` aceito na tela e recusado pelo bucket; recusa da data de reajuste sem mensagem |
| Receitas (`receitas`) | `/receitas` | ✅ | — |
| Despesas (`despesas`) | `/despesas` | ✅ | — |
| IPTU e taxas (`iptu_taxas`) | `/iptu-taxas` | ✅ | Parcela a parcela; sem lançamento parcelado de uma vez |
| Importar extrato (`importar_extrato`) | `/importar-extrato`, `/historico-importacoes` | ✅ | Excluir importação apaga também as transações já classificadas |
| Classificar transações (`classificar_transacoes`) | `/classificar-transacoes` | ◐ | **Defeito provável** ao gravar a classificação; "Editar" uma classificada cria segundo lançamento; não concilia com receita prevista |
| Dashboards (`dashboards`) | `/dashboard-financeiro`, `/dashboard-imoveis` | ✅ | Mostram só o que o usuário pode ler nos módulos de origem |
| Alertas (`alertas`) | `/alertas` | ✅ | Idem |
| Relatórios (`relatorios`) | `/relatorios` | ✅ | Idem; sem envio por e-mail (pendente) |
| Usuários e permissões (só administrador) | `/usuarios` | ✅ | — |
| Trilha de auditoria (só administrador) | `/logs-atividade`, feed na tela Início | ✅ | — |
| Simulador IBS/CBS (público) | `/simulador` | ✅ | Falta citar a LC 227/2026 no laudo (em andamento) |
| Entrada e senha (público) | `/login`, `/signup`, `/recuperar-senha`, `/redefinir-senha` | ✅ | Cadastro público ainda aberto no Supabase (pendência 2 do quadro) |
| Quadro de andamento (público) | `/` | ✅ | Temporário (README do repositório) |
| Quadro de histórias (`quadro`) | `/quadro` (menu lateral) e `/`, para quem entrou | ✅ | Editável, no banco; homologar é só de pessoa (RN-QDR-01) |

---

## Transversal — valem para todos os módulos

| Funcionalidade | Regra | Onde | Situação | Arquivos |
| :-- | :-- | :-- | :-- | :-- |
| Permissão por módulo em 3 níveis | Ver exige `visualizacao`; criar, alterar e excluir exigem `edicao`; administrador tem `edicao` em tudo (RN-SEC-01, RN-SEC-06) | banco (RLS) + tela (esconde botões) | ✅ | [`…_rls.sql`](../../supabase/migrations/20260917120004_rls.sql), [`use-auth.tsx`](../../src/hooks/use-auth.tsx) |
| Falha fechando | Sem linha de permissão = sem acesso; usuário inativo não vê nada (RN-SEC-02) | banco | ✅ | `nivel_no_modulo()` em [`…_rls.sql`](../../supabase/migrations/20260917120004_rls.sql); testes em [`rls.test.ts`](../../supabase/tests/rls.test.ts) |
| Mensagem de permissão | "Você não tem permissão para esta operação." | tela | ✅ | [`erros.ts`](../../src/lib/dados/erros.ts) |
| Autoria e carimbo | `created_by`/`updated_by` vêm da sessão e não se forjam; autoria original imutável (RN-AUD-03) | banco | ✅ | `tg_marcar_autoria()` em [`…_correcoes_da_auditoria.sql`](../../supabase/migrations/20260919120004_correcoes_da_auditoria.sql) |
| Trilha de auditoria | Toda criação, edição (com "de → para") e exclusão nas tabelas de negócio vira registro; ninguém altera nem apaga; só administrador lê (RN-AUD-01, RN-AUD-02) | banco | ✅ | `tg_registrar_log()`; [`gatilhos.test.ts`](../../supabase/tests/gatilhos.test.ts) |
| Tempo real | Tela se atualiza quando outra pessoa grava; cada um só recebe o que pode ler | banco + tela | ✅ | [`…_convite_e_tempo_real.sql`](../../supabase/migrations/20260917120007_convite_e_tempo_real.sql), [`use-realtime.ts`](../../src/hooks/use-realtime.ts) |
| Arquivos protegidos | Buckets privados, link assinado de validade curta, permissão do módulo; limite de tamanho e tipo por bucket (RN-SEC-05) | banco (storage) | ✅ | [`…_storage_e_rotinas.sql`](../../supabase/migrations/20260917120005_storage_e_rotinas.sql), [`arquivos.ts`](../../src/lib/dados/arquivos.ts) |
| Varredura diária de vencidos | 02:00 de Brasília: receita e despesa `previsto` vencidas viram `em_atraso`; IPTU `pendente` vencido vira `vencido` (RN-FIN-01) | banco (pg_cron) | ✅ | `marcar_lancamentos_em_atraso()` em [`…_funcoes_e_gatilhos.sql`](../../supabase/migrations/20260917120003_funcoes_e_gatilhos.sql) |
| Mensagem de erro embaixo do campo | O nome da restrição do banco vira mensagem no campo certo | tela | ◐ — funciona para CPF, CNPJ, e-mail, datas, número e imóvel do contrato; **não** para "Status" do imóvel e "Próxima data de reajuste", que não exibem erro | [`erros.ts`](../../src/lib/dados/erros.ts) |
| Acessibilidade e tamanho de letra | WCAG 2.2 AA; ajuste de escala de leitura | tela | ✅ | [`use-escala-leitura.ts`](../../src/hooks/use-escala-leitura.ts); quadro de andamento |
| Auditor | 9 funções de aptidão em todo build e no CI | CI/build | ✅ | [`07-auditor.md`](../07-auditor.md) |

---

## Imóveis

**Quem pode:** ver com `visualizacao` em `imoveis`; cadastrar, editar e inativar com `edicao`.
Tela: [`Imoveis.tsx`](../../src/pages/Imoveis.tsx), [`ImovelFormDialog.tsx`](../../src/components/imoveis/ImovelFormDialog.tsx).

| Funcionalidade | Regras aplicadas | Onde | Situação |
| :-- | :-- | :-- | :-- |
| Cadastro e edição (código, nome, endereço, tipo, matrícula, inscrição imobiliária, área, cômodos, valor estimado, fotos) | Endereço obrigatório; UF com 2 letras; área, quartos, banheiros e vagas ≥ 0; valores ≥ 0 e dentro de `numeric(14,2)` (RN-IMV-04) | ambos — [`esquemas.ts`](../../src/lib/validacao/esquemas.ts) e [`…_tabelas.sql`](../../supabase/migrations/20260917120002_tabelas.sql) | ✅ |
| Código único | Dois imóveis não têm o mesmo código, quando informado (RN-IMV-03) | banco (`imoveis_codigo_uidx`) | ✅ |
| Tipos | casa, apartamento, sala comercial, loja, galpão, terreno, outro | banco (enum) | ✅ |
| Situação do imóvel | vago, alugado, em manutenção, inativo; **alugado/vago e inquilino atual seguem o contrato ativo** (RN-IMV-01) | banco (`tg_sincronizar_imovel_do_contrato`) | ✅ |
| Inativar e excluir | Recusado se houver contrato ativo, com o motivo e o que fazer (RN-IMV-02) | banco (erro `HA001`) | ◐ — o banco recusa certo, mas a tela perde o motivo. Pelo **botão da lista**, aparece "Não foi possível inativar o imóvel. Tente novamente." ([`Imoveis.tsx`](../../src/pages/Imoveis.tsx), `handleInactivate`). Pelo **formulário**, o tradutor põe a mensagem no campo `status` ([`erros.ts`](../../src/lib/dados/erros.ts)), mas o campo "Status" do formulário não exibe erro ([`ImovelFormDialog.tsx`](../../src/components/imoveis/ImovelFormDialog.tsx)) e o aviso genérico é suprimido: o formulário **fica aberto sem mensagem nenhuma** |
| Fotos | Bucket `imoveis-fotos`, até 10 MB, JPEG/PNG/WebP/AVIF | banco (storage) | ✅ |
| Anexos | Documentos ligados ao imóvel | banco (herda `imoveis`) | ✅ |

## Inquilinos

**Quem pode:** `visualizacao`/`edicao` em `inquilinos`. Tela: [`Inquilinos.tsx`](../../src/pages/Inquilinos.tsx),
[`InquilinoFormDialog.tsx`](../../src/components/inquilinos/InquilinoFormDialog.tsx).

| Funcionalidade | Regras aplicadas | Onde | Situação |
| :-- | :-- | :-- | :-- |
| Pessoa física | Nome e CPF obrigatórios na tela; CPF com dígito verificador, recusa sequência repetida (RN-INQ-02) | ambos — [`documentos.ts`](../../src/lib/validacao/documentos.ts), `cpf_valido()` | ✅ |
| Pessoa jurídica | Razão social e CNPJ obrigatórios na tela; **CNPJ alfanumérico** aceito (RN-INQ-03) | ambos — `cnpj_valido()` | ✅ |
| CPF e CNPJ únicos | Não se cadastra o mesmo documento duas vezes (RN-INQ-04) | banco (índices parciais) | ✅ |
| E-mail | Formato mínimo `nome@dominio.ext` (RN-INQ-05) | ambos | ✅ |
| Inativar e excluir | Recusado com contrato ativo (RN-INQ-01) | banco (`HA001`) | ◐ — o formulário não tem campo de situação; inativar só pela lista, que mostra "Não foi possível inativar o inquilino. Tente novamente." sem o motivo ([`Inquilinos.tsx`](../../src/pages/Inquilinos.tsx)) |

## Fornecedores

**Quem pode:** `visualizacao`/`edicao` em `fornecedores`. Tela: [`Fornecedores.tsx`](../../src/pages/Fornecedores.tsx).

| Funcionalidade | Regras aplicadas | Onde | Situação |
| :-- | :-- | :-- | :-- |
| Cadastro | Nome obrigatório; CPF ou CNPJ (decide pelo tamanho) com dígito verificador e único; e-mail com formato mínimo; 9 tipos (eletricista… condomínio) (RN-FOR-01) | ambos | ✅ |
| Vínculo com despesa | Despesa aponta o fornecedor; excluir o fornecedor deixa a despesa sem ele (`on delete set null`) | banco | ✅ |

## Contratos

**Quem pode:** `visualizacao`/`edicao` em `contratos`. Tela: [`Contratos.tsx`](../../src/pages/Contratos.tsx),
[`ContratoFormDialog.tsx`](../../src/components/contratos/ContratoFormDialog.tsx). Serviço: [`contratos.ts`](../../src/services/contratos.ts).

| Funcionalidade | Regras aplicadas | Onde | Situação |
| :-- | :-- | :-- | :-- |
| Cadastro | Imóvel, inquilino, datas de início e fim e valor do aluguel obrigatórios na tela; dia de vencimento de 1 a 31 (RN-CTR-06) | ambos | ✅ |
| Número único | (RN-CTR-08) | banco (`contratos_numero_uidx`) | ✅ |
| Vigência coerente | Fim ≥ início (RN-CTR-04) | ambos | ✅ |
| **Um contrato ativo por imóvel no mesmo período** | Sem sobreposição de vigência entre contratos ativos do mesmo imóvel; intervalo fechado nas duas pontas; sem data = aberto (RN-CTR-03) | banco (`contratos_um_ativo_por_imovel`, `btree_gist`) | ✅ |
| Reajuste — datas | Próxima data de reajuste ≥ início (RN-CTR-05) | banco (`contratos_reajuste_coerente`) | ◐ — o banco recusa, mas o campo "Próxima data de reajuste" não exibe erro: o formulário fica aberto sem mensagem ([`ContratoFormDialog.tsx`](../../src/components/contratos/ContratoFormDialog.tsx)) |
| Reajuste — aplicação | **Não há aplicação automática**; índice e periodicidade são texto livre ("IPCA, IGP-M…", "Anual, Semestral…"); o sistema só avisa a data em Alertas (RN-CTR-02) | — | ○ |
| Receitas previstas do contrato | Documentada em [01](../01-requisitos-e-restricoes.md) como RN-CTR-01, **não implementada** (nem no PocketBase anterior nem no Supabase) | — | ○ |
| Garantia | **Uma** modalidade por contrato: caução, fiador, seguro-fiança, título de capitalização, sem garantia, outros; valor ≥ 0 (RN-CTR-07) | banco (enum, coluna única) | ✅ — sem limite de 3 aluguéis para caução (proposta RN-CTR-10) |
| Encerrar e cancelar | Confirmação; imóvel volta a vago se não restar outro contrato ativo (RN-IMV-01). O texto da confirmação fala em "parar de gerar cobranças", mas o sistema não gera cobranças | ambos | ✅ (texto a revisar) |
| Documento do contrato | Bucket `contratos-documentos`, até 25 MB, **PDF, JPEG e PNG**. A tela aceita `.doc` e `.docx`, que o bucket recusa | ambos | ◐ |

## Receitas e despesas

**Quem pode:** `visualizacao`/`edicao` em `receitas` e em `despesas`, separadamente. Categorias
financeiras: todos os usuários ativos leem; edita quem tem `edicao` em receitas ou despesas. Telas:
[`Receitas.tsx`](../../src/pages/Receitas.tsx), [`Despesas.tsx`](../../src/pages/Despesas.tsx).

| Funcionalidade | Regras aplicadas | Onde | Situação |
| :-- | :-- | :-- | :-- |
| Lançamento de receita | Imóvel, categoria, vencimento e valor previsto obrigatórios na tela; imóvel obrigatório no banco (RN-FIN-07) | ambos | ✅ |
| Lançamento de despesa | Imóvel obrigatório; fornecedor e categoria opcionais | ambos | ✅ |
| **Situação derivada** | Recebido/pago quando o valor baixado ≥ previsto; parcial quando > 0 e menor; em atraso quando venceu sem baixa; senão previsto. O que o cliente manda é ignorado (RN-FIN-03, RN-FIN-02) | banco (`tg_status_da_receita`, `tg_status_da_despesa`) | ✅ |
| Valores e competência | `numeric(14,2)`, ≥ 0; competência `AAAA-MM` (RN-FIN-04, RN-FIN-05) | ambos | ✅ |
| Datas plausíveis | Entre 1900 e 2200 (RN-FIN-06) | banco | ✅ |
| Categorias de referência | Receita: Aluguel, Multa, Juros, Reembolso, Outras receitas. Despesa: Manutenção, Reforma, Comissão de corretagem, Condomínio, Contas de consumo, Impostos, Seguros, Outros | banco ([`…_dados_de_referencia.sql`](../../supabase/migrations/20260917120006_dados_de_referencia.sql)) | ✅ |
| Formas | Pix, transferência, boleto, dinheiro, cartão, débito automático, (cheque em despesa), outros | tela ([`format.ts`](../../src/lib/format.ts)) | ✅ |
| Rastreio da conciliação | `transacao_importada_id` liga o lançamento à linha do extrato | banco (FK) | ✅ |

## IPTU e taxas

**Quem pode:** `visualizacao`/`edicao` em `iptu_taxas`. Tela: [`IptuTaxas.tsx`](../../src/pages/IptuTaxas.tsx).

| Funcionalidade | Regras aplicadas | Onde | Situação |
| :-- | :-- | :-- | :-- |
| Obrigação por imóvel | Tipos: IPTU, condomínio, seguro, taxa municipal, taxa extraordinária, outro; descrição, valor e vencimento obrigatórios na tela; ano entre 1900 e 2200 (RN-IPTU-02) | ambos | ✅ |
| Situação derivada | Pago quando há data de pagamento; vencido quando o vencimento passou; senão pendente (RN-IPTU-01) | banco (`tg_status_do_iptu`) | ✅ |
| Parcelas | Cada parcela é um registro próprio, cadastrado à mão | tela | ◐ — sem cadastro parcelado de uma vez (proposta RN-IPTU-04) |
| Comprovante | Bucket `iptu-comprovantes`, até 10 MB, PDF/JPEG/PNG | banco (storage) | ✅ |

## Importação de extrato

**Quem pode:** gravar a importação exige `edicao` em `importar_extrato`; gravar as transações,
`edicao` em `classificar_transacoes`. Telas: [`ImportarExtrato.tsx`](../../src/pages/ImportarExtrato.tsx),
[`HistoricoImportacoes.tsx`](../../src/pages/HistoricoImportacoes.tsx). Motor: [`extratos-engine.ts`](../../src/lib/extratos-engine.ts).
Banco: [`…_importacao_atomica.sql`](../../supabase/migrations/20260919120002_importacao_atomica.sql).

| Funcionalidade | Regras aplicadas | Onde | Situação |
| :-- | :-- | :-- | :-- |
| Leitura do arquivo | OFX e CSV nos dialetos de Itaú, Bradesco, Nubank, Inter, Santander e BB; só `.csv` e `.ofx` | tela | ✅ |
| Conta de origem | Obrigatória e visível para quem importa (RN-IMP-06) | ambos | ✅ |
| Aviso de duplicata | Mesma data, valor com diferença menor que R$ 0,05, mesmo sentido (crédito/débito) e descrição parecida (similaridade ≥ 0,65); a pessoa desmarca ou importa mesmo assim (RN-IMP-07) | tela | ✅ |
| Sugestão de classificação | Tipo, categoria e imóvel sugeridos pelo histórico, com confiança; consultiva (RN-IMP-02) | tela | ✅ |
| **Gravação tudo ou nada** | A importação e todas as transações numa transação só; se cair, nada fica salvo e a tela diz "Nenhuma transação foi salva." (RN-IMP-04) | banco (`importar_extrato()`) | ✅ |
| Limite | Até 5.000 transações por importação, avisado antes do envio (RN-IMP-05) | ambos | ✅ |
| Linha incompleta | Recusada apontando o número da linha (RN-IMP-06) | banco | ✅ |
| Campos do servidor | Data, contadores e situação da importação nascem no banco; toda transação nasce pendente (RN-IMP-08) | banco | ✅ |
| Histórico e exclusão | Lista as importações; excluir remove a importação **e todas as transações dela**, inclusive as já classificadas (a confirmação fala em "não classificadas") — os lançamentos gerados ficam, sem o vínculo | banco (`on delete cascade`) + tela | ◐ (proposta RN-IMP-10) |

## Classificação de transações

**Quem pode:** `edicao` em `classificar_transacoes`, e em `receitas` ou `despesas` para gerar o lançamento.
Tela: [`ClassificarTransacoes.tsx`](../../src/pages/ClassificarTransacoes.tsx),
[`ClassificarTransacaoDialog.tsx`](../../src/components/extratos/ClassificarTransacaoDialog.tsx),
[`ClassificarLoteDialog.tsx`](../../src/components/extratos/ClassificarLoteDialog.tsx).

| Funcionalidade | Regras aplicadas | Onde | Situação |
| :-- | :-- | :-- | :-- |
| Fila | Pendentes, classificadas, ignoradas, todas; busca | tela | ✅ |
| Aceitar sugestão / classificar à mão / em lote | Cria **uma receita recebida ou despesa paga nova**, com o valor, a data e a forma "pix", e marca a transação como classificada | tela | ◐ — ver achados abaixo |
| Ignorar e reabrir | Ignorada sai dos cálculos; pode ser reaberta | tela | ✅ |
| Conciliar com o previsto | **Não existe**: a classificação não procura a receita prevista do contrato; se a Helena lançou o aluguel previsto, o extrato gera um segundo lançamento | — | ○ (proposta RN-FIN-08) |

**Achados deste levantamento (para a equipe confirmar):**

1. **Gravação da classificação.** Ao marcar a transação como classificada, a tela envia o **nome** da
   categoria e do imóvel para `categoria_classificada` e `imovel_classificado`, e texto vazio para
   `receita_gerada`/`despesa_gerada`; no banco essas quatro colunas são **uuid com chave estrangeira**
   ([`…_tabelas.sql`](../../supabase/migrations/20260917120002_tabelas.sql), seção 2.5). O Postgres recusa
   texto que não é uuid, e o cliente de dados não converte ([`cliente.ts`](../../src/lib/dados/cliente.ts),
   `prepararDados`). Como a receita é criada **antes** dessa marcação e as duas gravações não são
   atômicas, o efeito provável é: lançamento criado, transação continua pendente, e uma nova tentativa
   cria outro lançamento. Nenhum teste cobre esse caminho.
2. **"Editar" uma transação classificada** reabre o diálogo de classificação e cria **outro**
   lançamento, sem desfazer o primeiro — contraria RN-IMP-01.

## Dashboards, alertas e relatórios

**Quem pode:** `dashboards`, `alertas` e `relatorios`, cada um com `visualizacao`. Os três leem os dados
das tabelas de origem **pela RLS**: quem tem acesso a Relatórios mas não a Receitas vê o relatório
financeiro vazio.

| Funcionalidade | O que mostra | Onde | Situação |
| :-- | :-- | :-- | :-- |
| Dashboard financeiro ([`DashboardFinanceiro.tsx`](../../src/pages/DashboardFinanceiro.tsx)) | Receitas × despesas realizadas, evolução do resultado mensal, receitas e despesas por imóvel, despesas por categoria, resumo por imóvel | tela | ✅ |
| Dashboard de imóveis ([`DashboardImoveis.tsx`](../../src/pages/DashboardImoveis.tsx)) | Taxa de ocupação (alugados ÷ ativos), situação dos imóveis, evolução da ocupação, IPTU por situação, resumo por imóvel | tela | ✅ |
| Alertas ([`Alertas.tsx`](../../src/pages/Alertas.tsx)) | Término e reajuste de contrato ativo, IPTU, receitas e despesas a vencer e vencidas; filtro 7/15/30 dias ou vencidos; mais urgentes primeiro (RN-ALR-01) | tela | ✅ |
| Relatórios ([`Relatorios.tsx`](../../src/pages/Relatorios.tsx), [`reports-generator.ts`](../../src/lib/reports-generator.ts)) | Financeiro, imóveis, contratos e inadimplência, em PDF e Excel; períodos pré-definidos ou personalizado (RN-REL-01) | tela | ✅ |
| Resultado por e-mail | Fechamento mensal na caixa de entrada | — | ○ (pendente no quadro) |

## Usuários, acesso e auditoria

**Quem pode:** só administrador (menu `adminOnly` e RLS). Telas: [`Usuarios.tsx`](../../src/pages/Usuarios.tsx),
[`LogsAtividade.tsx`](../../src/pages/LogsAtividade.tsx), feed em [`FeedDeAtividades.tsx`](../../src/components/inicio/FeedDeAtividades.tsx).

| Funcionalidade | Regras aplicadas | Onde | Situação |
| :-- | :-- | :-- | :-- |
| Convite | Vale 7 dias; reenviar gera novo link por mais 7; quem entra por convite pendente nasce com o perfil do convite (RN-SEC-04) | banco + tela ([`convites.ts`](../../src/services/convites.ts)) | ✅ |
| Validar convite sem login | Única função aberta ao visitante: devolve só o e-mail e o perfil daquele token | banco (`validar_convite`) | ✅ |
| Perfil e situação | Só administrador ativo muda perfil ou ativa/desativa; ninguém se promove; primeiro administrador pelo SQL Editor (RN-SEC-03) | banco (`tg_proteger_privilegio`) | ✅ |
| Permissões por módulo | Administrador concede `sem_acesso`, `visualizacao` ou `edicao` por módulo | banco + tela | ✅ |
| Mudança de privilégio auditada | Promover, desativar, conceder e retirar permissão entra na trilha (RN-AUD-04) | banco | ✅ |
| Feed ao vivo na tela Início | Só o administrador recebe | banco (tempo real + RLS) | ✅ |
| Cadastro público | O Supabase aceita cadastro pela API; a conta nasce sem permissão | configuração | ○ (pendência 2 do quadro; proposta RN-SEC-07) |

## Quadro de histórias

**Quem pode:** `visualizacao`/`edicao` no módulo `quadro`; administrador tem edição. Telas: item
"Quadro de Histórias" do menu lateral ([`Quadro.tsx`](../../src/pages/Quadro.tsx), em `/quadro`) e
página inicial ([`StatusDesenvolvimento.tsx`](../../src/pages/StatusDesenvolvimento.tsx)), as duas com
[`QuadroDeHistorias.tsx`](../../src/components/produto/QuadroDeHistorias.tsx). Serviço:
[`quadro.ts`](../../src/services/quadro.ts). Banco:
[`…_quadro_de_historias.sql`](../../supabase/migrations/20260923120002_quadro_de_historias.sql).

| Funcionalidade | Regras aplicadas | Onde | Situação |
| :-- | :-- | :-- | :-- |
| Cinco colunas: Backlog, Desenvolvimento, Teste, Homologação, Concluído | Cartão por fora: número, título, etiqueta e atividades feitas. Em tela estreita as colunas rolam de lado (no celular, uma por vez); Concluído mostra as 15 mais recentes e abre o resto em "Mostrar mais" | tela | ✅ |
| História | Título, etiqueta, "Eu, quero, para", critérios em BDD e observações, todos editáveis direto no cartão aberto (salvos juntos em "Salvar alterações"; fechar com alteração pendente pede confirmação); número sequencial que não se reaproveita; ninguém exclui (RN-QDR-03, RN-QDR-04) | ambos | ✅ |
| Atividades | Título + caixa de seleção; incluir, renomear, marcar e excluir | ambos | ✅ |
| Mover | Pelo diálogo ou arrastando o cartão no computador; **só pessoa logada leva para Homologação ou Concluído**, e Concluído só depois da Homologação (RN-QDR-01, RN-QDR-02) | banco (`tg_proteger_homologacao`) + tela | ✅ |
| Trilha e tempo real | Mudança de história entra na trilha (com quem homologou); o quadro se atualiza quando outra pessoa grava | banco | ✅ |
| Carga inicial | 59 histórias: H-01 a H-24 da documentação, H-25 a H-45 do que já funcionava, H-46 a H-59 do backlog | banco ([`…_carga_do_quadro.sql`](../../supabase/migrations/20260923120003_carga_do_quadro.sql)) | ✅ |

## Simulador IBS/CBS

**Quem pode:** qualquer pessoa, logada ou não ([`Simulador.tsx`](../../src/pages/Simulador.tsx), módulo
[`src/simulador/`](../../src/simulador)). Documentação funcional e legal: [simulador.md](../simulador.md).

| Funcionalidade | Regras | Situação |
| :-- | :-- | :-- |
| Enquadramento do locador PF | Contribuinte só com **mais de 3** imóveis alugados **e** receita anual **acima de R$ 240.000,00** (RT-01) | ✅ |
| Base de cálculo, redutor social, redução de 70%, transição 2026–2033, créditos, comparativo, aritmética em centavos | RT-02 a RT-08 ([01, §3](../01-requisitos-e-restricoes.md#3-regras-tributárias-ibscbs--especificação-normativa)) | ✅ |
| Laudo com base legal | Memória de cálculo | ◐ — falta citar a LC 227/2026 (RT-09, em andamento) |
| Página própria e busca | Título e apresentação pública | ○ |

---

## O que não existe (e não é defeito)

Para não criar expectativa errada: o sistema **não** emite boleto ou PIX, **não** envia cobrança ao
inquilino, **não** gera contrato a partir de modelo, **não** colhe assinatura digital, **não** consulta
crédito, **não** separa organizações (uma holding só) e **não** tem aplicativo próprio — as telas
funcionam no navegador do celular. Todos estão no [backlog](backlog.md) com a prioridade que o PO
atribuiu.
