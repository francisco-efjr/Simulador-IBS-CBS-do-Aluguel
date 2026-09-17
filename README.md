# Holding Aguiar — Controle de Imóveis

Sistema de gestão imobiliária e controle financeiro, publicado em
**[fjin.work](https://fjin.work/)**. Inclui o **Simulador IBS/CBS da locação**
como módulo em `/simulador`.

> **Em fase de desenvolvimento.** A raiz do site mostra um quadro público de
> andamento (arquivo `src/pages/StatusDesenvolvimento.tsx`, temporário) e o
> painel do sistema vive em `/inicio`. O banco de produção no Supabase está
> criado e vazio, à espera dos dados reais da holding — ver
> [`supabase/README.md`](supabase/README.md).

---

## Stack

- **React 19** + **Vite 8** + **TypeScript 6**
- **Tailwind CSS 3** + **shadcn/ui** (Radix)
- **React Router 7**, **React Hook Form**, **Zod**, **Recharts**
- **Vitest** para a suíte do motor de cálculo tributário
- **Supabase** (Postgres + Auth + Storage + Realtime) como backend

## Como rodar

```bash
pnpm install
```

```bash
pnpm dev
```

A aplicação sobe em <http://localhost:8081>.

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção em `dist/` |
| `pnpm preview` | Serve o build localmente |
| `pnpm test` | Suíte do motor tributário (63 testes) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | Oxlint |
| `pnpm format` | Oxfmt |

---

## Rotas

Toda opção do menu tem endereço próprio. As rotas abaixo de **Sistema** exigem
sessão aberta; `/simulador` é pública.

### Públicas

| Rota | Tela |
| --- | --- |
| `/login` | Acesso |
| `/signup` | Criar conta |
| `/recuperar-senha` | Solicitar recuperação |
| `/redefinir-senha`, `/resetar-senha` | Definir nova senha |
| `/simulador` | **Simulador IBS/CBS da locação** |

### Sistema

| Rota | Módulo |
| --- | --- |
| `/`, `/inicio` | Início |
| `/alertas` | Central de vencimentos |
| `/relatorios` | Exportação PDF/Excel |
| `/importar-extrato` | Importação de extratos CSV/OFX |
| `/historico-importacoes` | Histórico de importações |
| `/classificar-transacoes` | Fila de conciliação |
| `/imoveis` | Imóveis |
| `/inquilinos` | Inquilinos |
| `/contratos` | Contratos de locação |
| `/receitas` | Receitas |
| `/despesas` | Despesas |
| `/iptu-taxas` | IPTU e taxas |
| `/fornecedores` | Fornecedores |
| `/dashboard-financeiro` | Dashboard financeiro |
| `/dashboard-imoveis` | Dashboard de imóveis |
| `/usuarios` | Usuários e permissões *(admin)* |
| `/logs-atividade` | Auditoria *(admin)* |

### API

| Rota | Conteúdo |
| --- | --- |
| `/api/cronograma-transicao.json` | Cronograma constitucional de transição do IBS/CBS (2026–2033), emitido como arquivo estático no build |

---

## O módulo Simulador

Vive em [`src/simulador/`](src/simulador) e mantém a arquitetura do projeto de
origem: `core/` reúne o motor fiscal — aritmética decimal em centavos, regras da
**LC 214/2025** e da **EC 132/2023** — sem nenhuma dependência de interface;
`ui/` é a camada visual.

A rota `/simulador` se adapta ao contexto:

- **Sem sessão** — simulador autônomo, com cabeçalho, rodapé e alternância
  claro/escuro próprios. É o endereço público.
- **Com sessão** — o mesmo simulador embutido no shell do sistema, com a sidebar
  ao lado e o item correspondente no menu.

O tema do simulador é isolado: os tokens são prefixados (`--sim-*`) e vivem sob
`.simulador-theme`, e o modo escuro entra nessa mesma raiz. Alternar o tema lá
não repinta o restante do sistema.

A fundamentação legal, as regras de enquadramento e a memória de cálculo estão
documentadas em [`docs/simulador.md`](docs/simulador.md).

---

## Backend

O banco é um projeto **Supabase**: Postgres com Row Level Security, autenticação,
arquivos em buckets privados e tempo real. As migrações versionadas e o que cada
uma faz estão em [`supabase/`](supabase/README.md).

Para rodar, copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

| Variável | O que é |
| --- | --- |
| `VITE_SUPABASE_URL` | Endereço do projeto |
| `VITE_SUPABASE_ANON_KEY` | Chave publicável — feita para viver no navegador |

Sem essas duas variáveis a aplicação não sobe: erra no boot, em vez de subir
sobre dados falsos aceitando qualquer senha, que era o comportamento anterior e
o achado **S-03** da auditoria.

A camada de dados fica em [`src/lib/dados/`](src/lib/dados):

- **`supabase.ts`** — o cliente.
- **`cliente.ts`** — `colecao(tabela)` com `getFullList`/`getList`/`getOne`,
  `create`, `update`, `delete`. Traduz `expand` para relação embutida do
  PostgREST e devolve o registro no formato que as telas já conheciam.
- **`arquivos.ts`** — envio para bucket privado e link assinado de validade curta.
- **`esquema.ts`** — mapa de relações e de campos de arquivo. É o único lugar a
  mexer quando entra uma relação nova.

### Quem pode o quê

As 12 permissões de módulo vivem na tabela `permissoes` e são avaliadas **pelo
banco**, em toda consulta. A tela usa as mesmas regras apenas para decidir o que
desenhar: se as duas discordarem, quem decide é o banco.

### O PocketBase anterior

O schema e os hooks do backend anterior seguem versionados em
[`pocketbase/`](pocketbase) como referência histórica — 17 migrações e 23 hooks.
Nada na aplicação os usa. A tradução de cada regra para o Postgres está descrita
em [`supabase/README.md`](supabase/README.md).

---

## Deploy

A Vercel constrói a raiz do repositório com `pnpm build` e publica `dist/`. O
[`vercel.json`](vercel.json) faz o fallback de SPA preservando `/api/` e
`/assets/`, e libera CORS no endpoint do cronograma.

## Licença

MIT — ver [LICENSE](LICENSE).
