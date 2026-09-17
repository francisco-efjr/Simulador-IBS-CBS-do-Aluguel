# ADR-0009 — Supabase (Postgres) como backend, no lugar do PocketBase

- **Data:** 2026-09-17
- **Situação:** aceita
- **Substitui:** [ADR-0001](0001-pocketbase-como-backend.md) e [ADR-0002](0002-modo-mock-opt-in.md)

## Contexto

O [ADR-0001](0001-pocketbase-como-backend.md) escolheu o PocketBase por ser um backend inteiro
num binário só, o que casava com a fase de construção. A conta chegou na auditoria: dos treze
achados de [06-seguranca.md](../06-seguranca.md), os quatro críticos vinham do desenho, não de
descuido pontual.

- As API rules do PocketBase não conseguem consultar o interior de um campo `json`. Como as
  permissões de módulo moravam num blob dentro do usuário, **nenhuma regra de servidor
  conseguia lê-las** — daí o RBAC existir só no cliente (S-02).
- A recuperação de senha era um hook próprio, e o hook devolvia o token no corpo da resposta
  (S-01). Escrever autenticação à mão é assumir uma dívida que não é do negócio.
- Anexos eram servidos sem autenticação (S-05).
- O modo de demonstração era o padrão do build (S-03), efeito do ADR-0002.

## Decisão

Postgres gerenciado pelo Supabase, com Row Level Security, Auth, Storage e Realtime.

A autorização desce para o banco: uma tabela `permissoes` normalizada, `(usuario, modulo, nivel)`,
e um par de políticas por tabela que exigem `visualizacao` para ler e `edicao` para escrever. A
regra passa a valer para toda porta de entrada — tela, API, importação, script — e não só para a
que passou pelo React.

As regras de negócio que viviam em `pocketbase/hooks/*.js` viraram gatilho: status financeiro
derivado, sincronismo do imóvel com o contrato, trilha de auditoria. Os três `cronAdd` viraram um
procedimento agendado por `pg_cron`.

A aplicação não muda de vocabulário: a camada em `src/lib/dados/` devolve o registro no mesmo
formato que as telas já liam (`expand`, `created`, `created_by`), então as 23 telas seguiram
inalteradas.

## Consequências

**A favor.** Os quatro achados críticos deixam de ser corrigíveis para deixarem de existir:
não há mais token de recuperação próprio, nem permissão que só o cliente enxerga, nem arquivo
em endereço aberto. Dinheiro passa a `numeric` (RD-01), os vínculos frouxos da conciliação
viram chave estrangeira (RD-08) e o banco recusa valor fora da lista.

**Contra.** Some a facilidade de subir o backend inteiro com um binário e um comando — o
desenvolvimento passa a depender de um projeto Supabase ou do CLI local. A sintaxe de consulta
é a do PostgREST, e o filtro em texto do PocketBase deu lugar a filtro estruturado. E há
dependência de um fornecedor, mitigada por o núcleo ser Postgres puro: as migrações em
`supabase/migrations/` rodam em qualquer Postgres.

**Aberto.** S-06 (validação de formato na borda), S-09 (tenancy) e S-11 (mascaramento de dado
bancário) seguem sem endereço. Nenhum deles depende desta decisão.
