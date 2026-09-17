# ADR-0003 — RBAC avaliado no servidor e modelo de tenancy

- **Status:** **Proposta — bloqueia produção**
- **Data:** 2026-09-15
- **Relacionadas:** [ADR-0001](0001-pocketbase-como-backend.md), [06-seguranca.md](../06-seguranca.md)

## Contexto

O sistema tem um modelo de autorização bem desenhado — e inteiramente no lugar errado.

**O que existe.** 12 módulos (`ModuloPermissao`) × 3 níveis (`sem_acesso`, `visualizacao`, `edicao`),
gravados em `users.permissoes` (campo `json`) e avaliados em `src/hooks/use-auth.tsx`
(`getModulePermission`, `canViewModule`, `canEditModule`) e em `src/components/ProtectedRoute.tsx`.
O menu lateral e as rotas respeitam isso corretamente.

**O que o servidor faz.** Consultando as regras reais em `pb_data`, **todas** as coleções de negócio —
`imoveis`, `inquilinos`, `fornecedores`, `categorias_financeiras`, `contratos`, `receitas`, `despesas`,
`iptu_taxas`, `documentos_anexos`, `contas_bancarias`, `importacoes`, `transacoes_importadas` — têm as
cinco regras (list/view/create/update/delete) idênticas:

```
@request.auth.id != ''
```

Ou seja: **qualquer usuário autenticado lê e escreve todos os registros de todas as coleções**, bastando
chamar `/api/collections/receitas/records` direto. O menu oculto não protege nada. Um usuário com
`sem_acesso` em `receitas` acessa, altera e apaga receitas via API.

Duas coleções fogem ao padrão, e acertadamente: `convites` exige
`@request.auth.perfil = 'administrador'`, e `password_resets` tem todas as regras nulas (apenas
superusuário), sendo manipulada só por hooks. `users` restringe atualização ao próprio registro ou a
administrador. O padrão correto, portanto, já existe no projeto — só não foi aplicado ao negócio.

**Agrava — fail-open no cliente.** `getModulePermission` devolve `'edicao'` quando `permissoes` é
ausente ou lista vazia, por retrocompatibilidade. Usuário criado sem permissões nasce com acesso total.

**Causa-raiz da arquitetura.** `permissoes` é um campo `json`. Uma API rule do PocketBase não consulta o
interior de um `json` de forma confiável — então a autorização **não podia** ser expressa como rule, o
que empurrou a decisão para o cliente. É um problema de modelagem, não de esquecimento.

**Tenancy.** Nenhuma coleção tem campo de proprietário ou organização. `created_by` registra autoria,
não escopo de acesso. O produto é hoje single-org (uma holding, usuários da mesma casa) e as rules planas
são coerentes com isso — mas qualquer segundo cliente na mesma instância veria a carteira do primeiro.

## Decisão

**1. Normalizar as permissões para que sejam consultáveis por rule.**
Nova coleção `permissoes`: `usuario` (relation), `modulo` (select, 12 valores), `nivel` (select, 3
valores), com índice único em `(usuario, modulo)`. `users.permissoes` fica como cache de leitura,
sincronizado por hook, **nunca** como fonte de decisão.

**2. Aplicar a autorização por rule em cada coleção de negócio**, no padrão:

```
// leitura (listRule, viewRule)
@request.auth.id != '' && (
  @request.auth.perfil = 'administrador' ||
  @collection.permissoes.usuario ?= @request.auth.id &&
  @collection.permissoes.modulo ?= 'receitas' &&
  @collection.permissoes.nivel ?~ 'visualizacao|edicao'
)

// escrita (createRule, updateRule, deleteRule): idem, exigindo nivel = 'edicao'
```

Onde a expressão de rule não bastar (caso de `nivel` hierárquico), a verificação vai para hook
`onRecordsListRequest` / `onRecordCreateRequest`, que responde `403` no formato `Problem`.

**3. Fail-closed em todas as camadas.** Ausência de registro em `permissoes` significa `sem_acesso`, no
cliente e no servidor. `PUT /usuarios/{id}/permissoes` grava explicitamente `sem_acesso` para módulo
ausente do payload. A retrocompatibilidade do cliente é removida — e os usuários existentes recebem suas
permissões por migração de dados, não por default permissivo.

**4. Tenancy declarada, não presumida.** O produto permanece **single-org** por decisão explícita, e isso
passa a constar no README e no contrato de API. Antes de admitir um segundo cliente na mesma instância,
é obrigatório: campo `organizacao` em todas as coleções de negócio, `users.organizacao`, e rules no padrão
`organizacao = @request.auth.organizacao`. Enquanto isso não existir, **cada cliente é uma instância**.

**5. Teste de autorização em CI (NFR-08).** Para cada módulo, um teste que autentica um usuário com
`sem_acesso` e afirma `403` **na API** — não no menu. Sem esse teste, a regressão é invisível.

## Consequências

**Positivas** — fecha a brecha crítica; o modelo de permissão passa a valer de fato; a autorização fica
testável; `permissoes` normalizada habilita auditoria de quem podia o quê e quando.

**Negativas** — as rules com `@collection.*` fazem subconsulta: há custo por requisição (mitigável por
índice único em `(usuario, modulo)` e pelo volume baixo de usuários). Migração de dados necessária para os
usuários existentes. As rules ficam verbosas e precisam ser geradas por migração, não escritas à mão na
UI do PocketBase — 12 coleções × 5 regras é onde erro de digitação vira brecha.

**Risco de não decidir** — qualquer usuário com login é, na prática, administrador de dados. Em uma base
com CPF, CNPJ, RG, endereço, contratos e dados bancários, isso é incidente de LGPD, não bug de UX.
