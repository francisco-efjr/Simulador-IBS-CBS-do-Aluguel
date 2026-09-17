# ADR-0008 — Monorepo pnpm em vez de três repositórios

- **Status:** Aceita
- **Data:** 2026-09-15

## Contexto

A diretriz pede segregação em **Backend**, **Frontend Web** e **Mobile**. A questão é o que "segregar"
significa na prática: repositórios separados ou fronteiras de pacote dentro de um repositório.

Estado atual: repositório único, já com `pnpm-workspace.yaml` e `pnpm-lock.yaml` no lugar — a
infraestrutura de workspace existe. Na sessão em que este documento foi escrito, a estrutura passou por
uma consolidação (o app, antes em subpasta, foi promovido à raiz e a cópia autônoma do simulador foi
eliminada), o que **reduziu** a fragmentação em vez de aumentá-la.

Há três candidatos naturais a pacote compartilhado, todos já identificados: `@app/tax-core`
([ADR-0005](0005-nucleo-tributario-compartilhado.md)), `@app/statement-engine`
([ADR-0006](0006-parsing-extrato-no-servidor.md)) e os tipos gerados do contrato OpenAPI
([Fase 3](../03-api/README.md)).

Três repositórios significariam publicar e versionar esses pacotes em registry para consumo cruzado —
com um time pequeno, cada mudança de regra fiscal viraria três PRs coordenados em três repositórios.

## Decisão

**Monorepo pnpm único, com segregação por pacote e fronteira verificada por ferramenta.**

Estrutura-alvo:

```
/
├── apps/
│   ├── web/              # React 19 + Vite (o app de hoje)
│   ├── mobile/           # futuro
│   └── api/              # rotas customizadas e hooks do PocketBase
├── packages/
│   ├── tax-core/         # motor IBS/CBS (ADR-0005)
│   ├── statement-engine/ # parsing e conciliação (ADR-0006)
│   └── api-contract/     # openapi.yaml + tipos gerados
├── pocketbase/           # migrações e hooks
└── docs/                 # esta documentação
```

1. **A fronteira é verificada, não confiada.** Lint de dependência falha o build se `packages/tax-core`
   importar qualquer coisa de `apps/` ou do React. É o que dá sentido ao NFR-03.
2. **Versionamento independente** para os pacotes de domínio (`tax-core` sobretudo), porque o laudo de
   auditoria declara `versaoMotor`.
3. **O contrato OpenAPI é um pacote**, não um arquivo perdido em `docs/`: os tipos gerados são artefato de
   build consumido por web, mobile e api.
4. **Migração incremental.** A estrutura acima é alvo, não pré-requisito: `tax-core` e
   `statement-engine` saem primeiro, porque já são código puro; o resto segue quando houver necessidade
   real, não por simetria.
5. **Se um cliente externo precisar de um repositório isolado** (auditoria do motor fiscal por terceiro, por
   exemplo), a extração de um pacote já isolado é mecânica — o custo de sair depois é baixo, e é
   justamente isso que torna a decisão reversível.

## Consequências

**Positivas** — uma mudança de regra fiscal é um PR, com testes de todos os consumidores rodando junto;
refatoração entre fronteiras é atômica; um único lockfile e um único pipeline; a segregação lógica pedida
pela diretriz é cumprida e, por ser verificada em CI, é mais forte do que a separação por repositório
(que só impede o import por inconveniência).

**Negativas** — o repositório cresce e o CI precisa de execução seletiva por pacote para não ficar lento.
Permissão de acesso passa a ser tudo-ou-nada: não há como dar ao mobile acesso só ao seu diretório.
A fronteira depende de ferramenta configurada — se o lint de dependência quebrar ou for desativado, a
separação evapora silenciosamente.

**Alternativa descartada** — três repositórios com pacotes publicados em registry privado. Correto para
times separados com ciclos de release independentes; desproporcional aqui, onde a mesma pessoa altera
regra fiscal, API e tela no mesmo dia.
