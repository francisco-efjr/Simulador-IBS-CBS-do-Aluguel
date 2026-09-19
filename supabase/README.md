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

## Quatro achados de segurança que esta modelagem fecha

Da auditoria em [`docs/06-seguranca.md`](../docs/06-seguranca.md):

- **S-01 — token de recuperação de senha vazando.** A tabela `password_resets` e os três hooks
  de recuperação deixam de existir: quem cuida disso é o Supabase Auth, com o token indo por
  e-mail e nunca pelo corpo da resposta.
- **S-02 — RBAC só no cliente.** As 12 permissões de módulo saíram do blob JSON dentro do
  usuário e viraram a tabela `permissoes`, consultável. Cada tabela tem quatro políticas:
  ver exige `visualizacao`, escrever exige `edicao`. Vale para a tela, para a API e para
  qualquer script.
- **S-04 — autorização _fail-open_.** `nivel_no_modulo()` devolve `sem_acesso` quando não há
  permissão registrada. Sem linha na tabela, sem acesso.
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

O perfil nasce como `usuario` sem permissão nenhuma, então o primeiro acesso precisa de um
empurrão. Depois de criar o login em **Authentication → Users**:

```sql
update public.users set perfil = 'administrador', ativo = true
 where lower(email) = lower('voce@exemplo.com.br');
```

Administrador tem `edicao` em todo módulo por definição — não precisa de linha em `permissoes`.

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
auditoria e `marcar_lancamentos_em_atraso()`. Roda em poucos segundos, no CI também.

- `tests/harness.ts` cria o banco e documenta os stubs do que o Supabase fornece pronto:
  roles `anon`/`authenticated`/`service_role`, `auth.users` e `auth.uid()`, `storage.buckets`/
  `storage.objects`, a publicação `supabase_realtime` e um `cron.schedule()` que não agenda nada
  (o PGlite não tem `pg_cron`). Extensões que o PGlite oferece em `contrib` são carregadas
  sozinhas quando uma migração pede.
- `comoUsuario(id, fn)` e `comoAnonimo(fn)` trocam de role e de sessão dentro de uma transação
  que é desfeita no fim; `criarUsuario({ perfil, permissoes })` monta o cenário.
- Migração nova não precisa de nada: entra no próximo `pnpm test`. Se ela quebrar ao subir, o
  erro diz qual arquivo.
- Testes marcados `it.fails` documentam defeitos conhecidos das migrações; quando alguém
  corrigir, eles passam a falhar e é só trocar para `it`.
