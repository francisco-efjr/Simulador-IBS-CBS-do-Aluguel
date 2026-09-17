# Fase 5 — Registros de Decisão Arquitetural (ADR)

Um arquivo por decisão técnica relevante, com **contexto, decisão, status e consequências**.
Uma ADR nunca é editada para mudar de rumo: cria-se uma nova que a substitui (`Substituída por`).

| # | Decisão | Status |
| :--- | :--- | :--- |
| [0001](0001-pocketbase-como-backend.md) | PocketBase como backend, com contrato OpenAPI à frente | ~~Substituída pela 0009~~ |
| [0002](0002-modo-mock-opt-in.md) | Modo de demonstração passa a ser *opt-in* | ~~Substituída pela 0009~~ — o modo de demonstração foi removido |
| [0003](0003-rbac-servidor-e-tenancy.md) | RBAC avaliado no servidor e modelo de tenancy | Parcialmente implementada pela 0009 — falta a tenancy |
| [0004](0004-tokens-e-sessao.md) | Sessão com rotação de refresh token e armazenamento seguro | Proposta |
| [0005](0005-nucleo-tributario-compartilhado.md) | Núcleo tributário como pacote isolado e versionado | Aceita |
| [0006](0006-parsing-extrato-no-servidor.md) | Parsing de extrato migra para o servidor | Proposta |
| [0007](0007-integracoes-externas.md) | Padrão único para integrações externas | Aceita |
| [0008](0008-monorepo-pnpm.md) | Monorepo pnpm em vez de três repositórios | Aceita |
| [0009](0009-supabase-como-backend.md) | Supabase (Postgres) como backend, no lugar do PocketBase | Aceita |
