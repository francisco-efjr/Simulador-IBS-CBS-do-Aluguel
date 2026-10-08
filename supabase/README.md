# Supabase — banco de dados do Controle de Imóveis

Projeto: **controle de imóveis** (`shbxsxkqoxnuwlulqycm`, AWS us-east-2), na organização
Controle de Imóveis. As migrações desta pasta **já foram aplicadas** nele em 17/09/2026.

## O que existe no banco

| | |
| :-- | :-- |
| Tabelas | 16, todas com RLS ligada |
| Políticas | 51 em `public` + 18 em `storage` |
| Gatilhos | 48 (carimbo, autoria, status derivado, auditoria) |
| Funções | 16 |
| Tipos enumerados | 22 |
| Buckets | 5, **todos privados** |
| Rotina diária | `marcar-lancamentos-em-atraso`, 05:00 UTC (02:00 em Brasília) |
| Dados | só as 13 categorias financeiras de referência — nenhum registro de exemplo |

## As migrações

Rode em ordem. Cada arquivo é independente e roda inteiro de uma vez no SQL Editor.

| Arquivo | O que faz |
| :-- | :-- |
| `20260917120001_tipos.sql` | 22 enums, um para cada `select` do PocketBase |
| `20260917120002_tabelas.sql` | 16 tabelas, chaves estrangeiras, índices |
| `20260917120003_funcoes_e_gatilhos.sql` | o que hoje vive em `pocketbase/hooks/*.js` |
| `20260917120004_rls.sql` | permissão de módulo avaliada pelo banco |
| `20260917120005_storage_e_rotinas.sql` | buckets privados e a varredura diária |
| `20260917120006_dados_de_referencia.sql` | categorias financeiras |
| `20260917120007_convite_e_tempo_real.sql` | validação de convite sem login e publicação do tempo real |
| `20260919120001_regras_de_negocio.sql` | um contrato ativo por imóvel no mesmo período (`btree_gist`); imóvel ou inquilino com contrato ativo não é inativado nem excluído (erro `HA001`); CPF/CNPJ com dígito verificador — CNPJ alfanumérico incluso —, e-mail com formato mínimo e datas entre 1900 e 2200 (S-06). Pode ser rodada de novo sem erro |
| `20260919120002_importacao_atomica.sql` | `importar_extrato()`: grava a importação e suas transações numa transação só (ADR-0006). **Aplicar à mão** — é posterior à carga de 17/09 |
| `20260919120003_feed_de_atividades.sql` | põe `logs_atividade` no tempo real, para o feed de atividades da tela Início (só administrador recebe) |
| `20260919120004_correcoes_da_auditoria.sql` | corrige os defeitos que os testes do banco acharam: o primeiro administrador volta a ser promovível pelo SQL Editor; `created_by`/`updated_by` não se forjam no INSERT; trocar o imóvel de um contrato ativo ou apagá-lo libera o imóvel; mudança de perfil, situação e permissão entra em `logs_atividade`; EXECUTE revogado das funções `security definer` de quem não precisa (`marcar_lancamentos_em_atraso()` sai do `/rpc`). Pode ser rodada de novo sem erro. **Aplicar à mão**, junto das outras `20260919*` |
| `20260923120001_modulo_quadro.sql` | acrescenta o módulo de permissão `quadro`. Arquivo à parte porque o valor novo de enum não pode ser usado na mesma transação em que nasce: **rode antes da 02** |
| `20260923120002_quadro_de_historias.sql` | tabelas `historias` e `historias_atividades`, RLS pelo módulo `quadro` (ninguém exclui história), trilha e tempo real, e a regra de que só uma pessoa logada leva para Homologação ou Concluído (`tg_proteger_homologacao`, erro `HA002`). Pode ser rodada de novo sem erro |
| `20260923120003_carga_do_quadro.sql` | carga inicial das 59 histórias do quadro, com atividades. Só carrega com o quadro vazio; nenhuma entra em Homologação ou Concluído |
| `20260923120004_quadro_no_menu.sql` | registra na H-44 (a história do próprio quadro) as entregas de 23/09 como atividades feitas: menu lateral, "Mostrar mais" do Concluído, cartão mais largo e edição direta. Não muda a coluna. Pode ser rodada de novo sem erro |
| `20260923120005_quadro_aberto_para_leitura.sql` | abre a **leitura** do quadro a qualquer pessoa, até sem login (ambiente de teste, decisão do dono); escrever continua pelo módulo `quadro`. Acerta os cenários da H-42 e da H-44 que descreviam o quadro fechado. Pode ser rodada de novo; se a 02 for rodada de novo, rode esta depois |
| `20261005120001_modulo_locadores.sql` | acrescenta o módulo de permissão `locadores`. Arquivo à parte, pela mesma razão da `20260923120001`: **rode antes da 02** |
| `20261005120002_arvore_hierarquica_e_partes.sql` | locadores, fiadores e `imovel_unidades` (imóvel → unidades), contrato com unidade/locador/fiador e número `NNN/AAAA`, limite de 3 imóveis para quem não é administrador (`HA003`) e trilha de auditoria estendida |
| `20261006120001_anexos_por_modulo.sql` | **SEG-01** — o storage de `documentos-anexos` deduz o módulo da 1ª pasta do caminho (`inquilino/<uuid>-<nome>`, função `modulo_do_anexo`) em vez de olhar só `contratos`. Objetos antigos, sem pasta, ficam só com o administrador até serem movidos pela API de storage (`storage.move`, não por SQL) |
| `20261006120002_cadastro_so_com_convite.sql` | **SEG-02 e PRD-02** — o perfil do convite só vale se o token enviado no cadastro (`options.data.convite_token`) bater com o convite pendente, não vencido, do mesmo e-mail; sem convite válido a conta nasce **inativa** e sem permissão, e um administrador libera em `/usuarios` |
| `20261006120003_sobreposicao_de_contratos_por_unidade.sql` | **CAD-03** — um contrato ativo por **unidade** (`contratos_um_ativo_por_unidade`); sem unidade, por imóvel como antes (`contratos_um_ativo_por_imovel`) |
| `20261006120004_unidade_do_imovel_do_contrato.sql` | **SEG-08** — contrato só aceita unidade do próprio imóvel (erro `HA004`) |
| `20261006120005_categorias_por_tipo.sql` | **SEG-05** — escrever categoria de receita exige `receitas: edicao`; de despesa, `despesas: edicao` |
| `20261006120006_trilha_sem_dado_pessoal.sql` | **SEG-04** — `tg_registrar_log` grava `{"alterado": true}` no lugar de de/para nas colunas de `colunas_sensiveis_do_log()` (CPF/CNPJ, RG, contato, endereço, dados bancários, token) e mascara o que já estava gravado (irreversível) |
| `20261006120007_limite_de_imoveis_do_proprio_usuario.sql` | **SEG-17** — o limite de 3 imóveis (`HA003`) conta só os imóveis ativos criados pela própria pessoa; legados sem autoria não entram |
| `20261006120008_privilegios_minimos.sql` | **SEG-10** — `anon` e `authenticated` perdem TRUNCATE, REFERENCES e TRIGGER (e tabela nova já nasce sem eles); `anon` deixa de executar as funções utilitárias |
| `20261006120009_receita_e_despesa_coerentes.sql` | **FIN-14** — receita/despesa só aceitam categoria do tipo certo (`HA007`), receita só aceita contrato do mesmo imóvel (`HA008`) e inquilino do contrato (`HA009`) |
| `20261006120010_nunca_sem_administrador.sql` | **FIN-15** — ninguém rebaixa, desativa ou remove a si mesmo (`HA005`) nem o último administrador ativo (`HA006`) |
| `20261008120001_perfil_gratuito.sql` | **Perfil de acesso** ([ADR-0011](../docs/05-adr/0011-perfil-de-acesso-administrador-e-gratuito.md)) — o perfil `usuario` vira `gratuito` e `nivel_no_modulo()` passa a decidir só pelo perfil: administrador edita tudo; gratuito edita Imóveis, Inquilinos, Locadores e fiadores e Contratos, e nada mais. A tabela `permissoes` deixa de ser lida. Cadastro sem convite nasce `gratuito` (inativo). Pode ser rodada de novo sem erro |

## Quatro achados de segurança que esta modelagem fecha

Da auditoria em [`docs/06-seguranca.md`](../docs/06-seguranca.md):

- **S-01 — token de recuperação de senha vazando.** A tabela `password_resets` e os três hooks
  de recuperação deixam de existir: quem cuida disso é o Supabase Auth, com o token indo por
  e-mail e nunca pelo corpo da resposta.
- **S-02 — RBAC só no cliente.** O acesso é decidido no banco, por `nivel_no_modulo()`. Cada
  tabela tem quatro políticas: ver exige `visualizacao`, escrever exige `edicao`. Vale para a
  tela, para a API e para qualquer script. Desde a `20261008120001` o nível vem do **perfil**
  (administrador ou gratuito), não mais da tabela `permissoes`.
- **S-04 — autorização _fail-open_.** `nivel_no_modulo()` devolve `sem_acesso` para conta
  inativa e para todo módulo fora do pacote do perfil gratuito.
- **S-05 — anexos sem autenticação.** Os cinco buckets são privados e cada um herda a
  permissão do módulo correspondente. Nada mais é servido por URL adivinhável.

Fica de fora o **S-03** (modo mock como padrão do build), que é do frontend, não do banco.

## Diferenças em relação ao PocketBase

Nomes de tabela e de coluna são os mesmos (`created`, `updated`, `created_by`…) para que os
serviços do frontend mudem de cliente sem mudar de vocabulário. O que mudou de propósito:

- **`id` é `uuid`**, não a string de 15 caracteres do PocketBase.
- **Dinheiro em `numeric(14,2)`**, não float — o débito RD-01 da modelagem.
- **`users`** guarda só o perfil; senha, e-mail verificado e sessão vivem em `auth.users`.
  O perfil nasce por gatilho quando a pessoa se cadastra, já lendo o convite pendente.
- **`permissoes`** é tabela nova, normalizada (ADR-0003).
- **Vínculos da conciliação viram chave estrangeira** — `receita_gerada`, `imovel_classificado`
  e companhia eram `text` solto (RD-08).
- **`logs_atividade` ganhou `payload jsonb`** com o diff campo a campo, ao lado da prosa (RD-09).
- **Índice único parcial no CNPJ do inquilino** (RD-04), e também em `imoveis.codigo` e
  `fornecedores.cnpj_cpf` — estes dois são acréscimo nosso; se atrapalharem o cadastro real,
  basta um `drop index`.

## Primeiro administrador

O perfil nasce como `usuario`, **inativo** e sem permissão nenhuma (quem se cadastra sem o token
de um convite válido espera a liberação de um administrador — `20261006120002`), então o primeiro
acesso precisa de um empurrão. Depois de criar o login em **Authentication → Users**:

```sql
update public.users set perfil = 'administrador', ativo = true
 where lower(email) = lower('voce@exemplo.com.br');
```

Administrador tem `edicao` em todo módulo por definição — não precisa de linha em `permissoes`.

Isso só funciona depois da `20260919120004_correcoes_da_auditoria.sql`: antes dela, o gatilho
`tg_proteger_privilegio` recusava a mudança, porque no SQL Editor não há sessão de usuário. A
regra agora é: sem sessão (`auth.uid()` nulo) e fora das roles da API (`anon`/`authenticated`)
— ou seja, SQL Editor ou chave `service_role` — a mudança passa; com sessão, só um
administrador ativo muda perfil ou situação. A promoção fica em `logs_atividade`, sem autor.

Depois da `20261006120010` o sistema não fica sem administrador: ninguém rebaixa, desativa ou
remove o último administrador ativo (`HA006`) — nem o SQL Editor, nem apagar o login em
Authentication → Users. Para trocar de administrador, promova o novo antes de rebaixar o antigo.

## A aplicação já usa este banco

O frontend foi migrado: `src/lib/dados/` substituiu o cliente do PocketBase, a autenticação
passou para o Supabase Auth, os anexos vão para bucket privado e o tempo real usa os canais do
Postgres. O pacote `pocketbase` saiu das dependências; `pocketbase/` fica no repositório só como
referência do que cada hook fazia.

## Primeiros passos para começar a registrar

1. **Criar o login.** Authentication → Users → Add user, ou pela própria tela `/signup`.
2. **Promover a administrador**, com a consulta da seção acima.
3. **Conferir o e-mail de saída.** Convite e recuperação de senha saem pelo remetente padrão do
   Supabase, que limita o volume diário. Para uso de verdade, ligar um SMTP próprio em
   Authentication → Emails.
4. **Cadastrar.** Imóveis → Inquilinos → Contratos, nessa ordem: contrato exige os dois.

## Testes do banco

`pnpm test:banco` (e também `pnpm test`) sobe um Postgres embutido — [PGlite](https://pglite.dev),
em WebAssembly, sem Docker nem conta no Supabase — aplica **todas** as migrações desta pasta em
ordem alfabética e testa o que protege os dados: RLS por módulo (inclusive _fail-closed_ e
anônimo), `tg_proteger_privilegio`, status derivado, imóvel ↔ contrato, autoria, trilha de
auditoria (inclusive das mudanças de privilégio), `marcar_lancamentos_em_atraso()` e quem pode
executar cada função `security definer` — função nova que nasça aberta a `anon` quebra a suíte.
Roda em poucos segundos, no CI também.

- `tests/seguranca_qa.test.ts` guarda a regressão da rodada de QA de 06/10/2026, um `describe` por
  achado (SEG-, PRD-, CAD-, FIN-): cada teste falha se a migração correspondente sair da pasta.
- `tests/harness.ts` cria o banco e documenta os stubs do que o Supabase fornece pronto:
  roles `anon`/`authenticated`/`service_role`, `auth.users` e `auth.uid()`, `storage.buckets`/
  `storage.objects`, a publicação `supabase_realtime` e um `cron.schedule()` que não agenda nada
  (o PGlite não tem `pg_cron`). Extensões que o PGlite oferece em `contrib` são carregadas
  sozinhas quando uma migração pede.
- `comoUsuario(id, fn)` e `comoAnonimo(fn)` trocam de role e de sessão dentro de uma transação
  que é desfeita no fim; `criarUsuario({ perfil, ativo, permissoes })` monta o cenário (quem se cadastra sem convite nasce
  inativo; o helper sempre grava o perfil e a situação pedidos).
- Migração nova não precisa de nada: entra no próximo `pnpm test`. Se ela quebrar ao subir, o
  erro diz qual arquivo.
- Testes marcados `it.fails` documentam defeitos conhecidos das migrações; quando alguém
  corrigir, eles passam a falhar e é só trocar para `it`.
