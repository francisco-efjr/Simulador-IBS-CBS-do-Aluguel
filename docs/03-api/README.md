# Fase 3 — Engenharia de APIs (API-First)

**Especificação:** [`openapi.yaml`](openapi.yaml) — OpenAPI **3.1.0**, 27 recursos, 37 operações,
50 schemas, validada sem referências quebradas.

---

## Por que existe um contrato se o PocketBase já expõe uma API?

O PocketBase gera automaticamente `/api/collections/{coleção}/records`. Consumir isso diretamente —
como o frontend faz hoje, via `src/services/*` — tem três custos:

1. **Acoplamento ao BaaS.** O formato de resposta, a sintaxe de `filter` e a semântica de `expand` são
   do PocketBase. Trocar de backend, ou colocar um cache/gateway na frente, quebraria todo cliente.
2. **Ausência de operações de negócio.** "Ativar contrato e gerar as receitas da vigência" ou
   "classificar 200 transações em lote" não são CRUD. Hoje essas composições vivem no cliente, onde não
   são atômicas nem auditáveis.
3. **Autorização invisível no contrato.** A API gerada não descreve quem pode o quê. O contrato explicita
   `403` por módulo e nível — o que torna testável o requisito NFR-08.

O contrato **não** exige reescrever o backend. Ele pode ser servido por rotas customizadas em hooks
(`routerAdd` do PocketBase) sobre as mesmas coleções — ver
[ADR-0001](../05-adr/0001-pocketbase-como-backend.md).

---

## Decisões de contrato que valem destacar

**Dinheiro em centavos inteiros.** Todo campo monetário é `valorCentavos: integer`. O domínio fiscal já
opera em aritmética decimal de centavos (`FinancialMath`); aceitar float na borda reintroduziria, no
transporte, exatamente o erro que o motor evita. Consequência: os clientes convertem na camada de
apresentação (`BRLInput` já trabalha assim).

**RFC 9457 para erros** (`application/problem+json`), com `ProblemValidacao` carregando
`errors[].field/code/message`. `detail` é texto seguro para exibição: nunca traz SQL, *stack trace*,
credencial ou dado bancário.

**Idempotência onde há efeito colateral composto.** `Idempotency-Key` é **obrigatória** em
`/contratos/{id}/ativacao`, `/contratos/{id}/reajuste` e `/transacoes/classificacao`. Sem isso, um
duplo-clique gera 12 receitas duas vezes. Quando a cobrança (boleto/PIX) entrar, a chave passa a ser a
proteção contra cobrar o inquilino duas vezes.

**`424 Failed Dependency` para falha de dependência externa.** No reajuste, se o índice IGP-M/IPCA da
competência não estiver no snapshot, a API recusa em vez de estimar. Reajuste com índice inventado é
erro que vira disputa contratual.

**Rota pública separada do resto.** `/tributario/simulacoes` e `/tributario/cronograma` são
`security: []`, espelhando a rota pública `/simulador`. Elas não recebem nem persistem dado pessoal —
o que as mantém fora do escopo LGPD e permite cachear o cronograma por 24 h.

**Permissões efetivas calculadas no servidor.** `GET /auth/me` devolve `permissoes` já resolvidas.
O cliente as usa **para desenhar o menu**, nunca como controle de acesso — a decisão real acontece em
cada endpoint. `PUT /usuarios/{id}/permissoes` é **fail-closed**: módulo ausente do payload vira
`sem_acesso`, o oposto do comportamento atual do cliente.

---

## Divergências entre o contrato e a implementação de hoje

| Contrato | Hoje | Ação |
| :--- | :--- | :--- |
| `/auth/refresh` com rotação e revogação de família | `pb.collection('users').authRefresh()`, sem rotação | [ADR-0004](../05-adr/0004-tokens-e-sessao.md) |
| `403` por módulo e nível no servidor | Rules planas `@request.auth.id != ''` | [ADR-0003](../05-adr/0003-rbac-servidor-e-tenancy.md) — **crítico** |
| Parsing do extrato no servidor | Parsing no navegador (`src/lib/extratos-engine.ts`) | [ADR-0006](../05-adr/0006-parsing-extrato-no-servidor.md) |
| Monetário em centavos inteiros | `number` float em trânsito e em repouso | RD-01 na [modelagem](../02-modelagem-de-dados.md) |
| `/contratos/{id}/ativacao` atômica e idempotente | Composição no cliente, sem transação | Implementar como hook `routerAdd` |
| `/contratos/{id}/reajuste` | Não existe (campos existem, sem automação) | RN-CTR-02 — lacuna competitiva vs. Pilota |
| `indiceReajuste` como enum | `text` livre | RD-05 |
| `simulacoes` persistidas com `versaoMotor` | Simulação é efêmera | Coleção proposta na Fase 2 |

---

## Fluxo de trabalho API-First

1. **Alterar o contrato primeiro.** Nenhum endpoint novo começa por código.
2. **Revisar em PR próprio**, separado da implementação.
3. **Gerar tipos** para os clientes a partir do contrato (`openapi-typescript`), em vez de escrever
   interfaces à mão — elimina divergência silenciosa entre cliente e servidor.
4. **Validar contra o contrato em CI** (`spectral lint`, mais testes de contrato nos endpoints).
5. **Versionar por prefixo de caminho** (`/v1`). Mudança incompatível exige `/v2`; adição de campo
   opcional não.

Comandos de referência (nenhuma dependência adicionada ao `package.json` ainda):

```bash
npx @stoplight/spectral-cli lint docs/03-api/openapi.yaml
```

```bash
npx openapi-typescript docs/03-api/openapi.yaml -o src/lib/api/schema.d.ts
```
