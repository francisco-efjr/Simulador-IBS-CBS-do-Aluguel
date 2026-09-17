# ADR-0002 — Modo de demonstração passa a ser _opt-in_

> **Substituída em 17/09/2026 pelo [ADR-0009](0009-supabase-como-backend.md)**, que trocou o PocketBase pelo Supabase. O registro abaixo fica como está: ele conta por que a escolha fez sentido quando foi feita.

- **Status:** **Proposta — bloqueia publicação com dados reais**
- **Data:** 2026-09-15

## Contexto

`src/lib/pocketbase/client.ts` define:

```ts
export const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK !== 'false'
```

A negação inverte o padrão seguro: **na ausência da variável, o modo mock está ligado**. Nesse modo o app
roda inteiro no navegador sobre `src/lib/mock/dataset.ts`, e — como o próprio README declara —
_qualquer e-mail e senha fazem login_. Não há credencial válida ou inválida.

Isso é ótimo para uma vitrine navegável e é, de fato, o estado atual publicado em
[fjin.work](https://fjin.work/). O problema é o modo de falha: um build de produção que esqueça
`VITE_USE_MOCK=false` publica uma tela de login que **não autentica nada**, com aparência idêntica à do
sistema real. O erro é silencioso — nenhum aviso em build, nenhum erro em runtime.

Agrava: `.env` está no `.gitignore` (correto), então o valor não vem do repositório. Depende
inteiramente da configuração do ambiente de deploy.

## Decisão

1. **Inverter o padrão.** `IS_MOCK_MODE` passa a exigir ativação explícita:

   ```ts
   export const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true'
   ```

2. **Falhar o build** quando `mode === 'production'` e `VITE_USE_MOCK === 'true'` sem um segundo sinal
   explícito (`VITE_DEMO_BUILD=true`). Vitrine é build próprio, nomeado.
3. **Exigir `VITE_POCKETBASE_URL`** quando o mock estiver desligado: ausente, o build falha em vez de
   subir apontando para `undefined`.
4. **Marcar visualmente** o modo demonstração em runtime — faixa persistente em todas as telas, não
   apenas na de login. Hoje um usuário não distingue mock de produção.
5. Documentar as duas variáveis no README, com a matriz de combinações válidas.

## Consequências

**Positivas** — elimina a classe de falha "publicado sem autenticação"; torna a vitrine uma decisão
declarada; o build passa a reclamar em vez de enganar.

**Negativas** — quem hoje roda `pnpm dev` sem `.env` e vê dados de imediato passará a precisar de
`VITE_USE_MOCK=true` (ou de um `.env.development` versionado com esse valor). Custo real, pago uma vez.
Todo pipeline de deploy existente precisa revisar suas variáveis antes do merge.

**Risco de não decidir** — alto e assimétrico: expor a interface administrativa de uma carteira
imobiliária sem autenticação. A correção custa cinco linhas; o incidente, não.
