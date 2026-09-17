# ADR-0001 — PocketBase como backend, com contrato OpenAPI à frente

> **Substituída em 17/09/2026 pelo [ADR-0009](0009-supabase-como-backend.md)**, que trocou o PocketBase pelo Supabase. O registro abaixo fica como está: ele conta por que a escolha fez sentido quando foi feita.

- **Status:** Aceita
- **Data:** 2026-09-15
- **Decisores:** Equipe de arquitetura
- **Relacionadas:** [ADR-0003](0003-rbac-servidor-e-tenancy.md), [ADR-0006](0006-parsing-extrato-no-servidor.md), [ADR-0008](0008-monorepo-pnpm.md)

## Contexto

A diretriz arquitetural pede segregação em três frentes — Backend, Frontend Web e Mobile. O que existe
hoje é diferente: uma aplicação React 19 que fala direto com um **PocketBase** (BaaS em Go sobre SQLite),
com a lógica de negócio dividida entre `src/services/` (no cliente) e `pocketbase/hooks/` (no servidor,
23 arquivos JavaScript: 5 de auditoria, 3 de recuperação de senha, 3 de convite, 3 crons de inadimplência,
8 de ciclo de vida de registro).

Considerando o porte do produto — carteira imobiliária de um a alguns milhares de imóveis, poucos usuários
simultâneos por organização — três caminhos foram avaliados:

1. **Reescrever o backend** em Node/NestJS ou Go, com Postgres. Cumpre a diretriz à risca.
2. **Manter o PocketBase puro**, com o cliente consumindo `/api/collections/*` direto. É o estado atual.
3. **Manter o PocketBase como núcleo**, expondo um contrato de API versionado à frente dele.

A opção 1 descarta ativos que funcionam: 17 migrações versionadas, hooks de auditoria e crons já em
operação, realtime nativo, autenticação, gestão de arquivos. Custaria meses para chegar ao mesmo lugar.
A opção 2 não sustenta o produto: não existe operação de negócio composta e atômica (ativar contrato,
classificar lote), a autorização não é expressável no contrato e todo cliente fica acoplado ao formato
interno do BaaS. A opção 3 preserva o investimento e resolve os dois problemas.

## Decisão

**Manter o PocketBase como backend e colocar um contrato OpenAPI 3.1 versionado à frente dele.**

1. O contrato em [`docs/03-api/openapi.yaml`](../03-api/openapi.yaml) é a **única** interface que web e
   mobile consomem. Nenhum cliente chama `/api/collections/*` diretamente.
2. Operações de negócio compostas são implementadas como **rotas customizadas** em hooks
   (`routerAdd`), com transação e idempotência: `/contratos/{id}/ativacao`, `/contratos/{id}/reajuste`,
   `/transacoes/classificacao`.
3. CRUD simples pode ser servido por um _adapter_ fino que traduz o formato PocketBase para o contrato,
   mantendo a liberdade de trocar a implementação depois.
4. Toda regra de negócio nova nasce **no servidor** (hook), não em `src/services/`. O que hoje está no
   cliente migra oportunisticamente, priorizando o que tem efeito colateral.
5. Segregação por **pacotes** dentro de um monorepo, não por repositórios ([ADR-0008](0008-monorepo-pnpm.md)).

## Consequências

**Positivas**

- Preserva migrações, hooks, crons, realtime, auth e storage já prontos.
- Os clientes passam a depender de um contrato estável; trocar o backend depois é possível sem tocar neles.
- Operações compostas ganham atomicidade e auditabilidade que hoje não têm.
- O mobile nasce contra o mesmo contrato do web, sem duplicar regra.

**Negativas**

- O _adapter_ é código adicional a manter, e uma camada a mais para depurar.
- Hooks do PocketBase são JavaScript (Goja), fora do sistema de tipos do projeto — não há checagem de
  tipos entre o hook e o contrato. Mitigação: testes de contrato em CI.
- SQLite serializa escrita: importações grandes precisam de transação por arquivo, não por transação
  bancária. Se a concorrência crescer, a migração para Postgres volta à mesa.
- Manter duas fontes de lógica (hook e serviço de cliente) durante a transição exige disciplina; sem ela,
  a regra divergirá.

**Riscos aceitos**

- Dependência de um projeto de mantenedor único. Mitigado por: schema em migrações versionadas, dados em
  SQLite (portável) e clientes falando apenas com o contrato.
