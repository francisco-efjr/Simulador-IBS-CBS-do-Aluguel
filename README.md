# Holding Aguiar — Controle de Imóveis

Sistema de gestão imobiliária e controle financeiro, publicado em
**[fjin.work](https://fjin.work/)**. Inclui o **Simulador IBS/CBS da locação**
como módulo em `/simulador`.

> **Modo demonstração.** A aplicação roda inteiramente no navegador, sobre dados
> fictícios. **Qualquer e-mail e senha fazem login** — não há backend, não há
> credencial válida ou inválida. É uma vitrine navegável, não um controle de
> acesso. Veja [Modo demonstração](#modo-demonstração) antes de publicar isto
> com dados reais.

---

## Stack

- **React 19** + **Vite 8** + **TypeScript 6**
- **Tailwind CSS 3** + **shadcn/ui** (Radix)
- **React Router 7**, **React Hook Form**, **Zod**, **Recharts**
- **Vitest** para a suíte do motor de cálculo tributário
- **PocketBase** como backend real (hoje desligado — ver abaixo)

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

## Modo demonstração

O cliente do PocketBase em [`src/lib/pocketbase/client.ts`](src/lib/pocketbase/client.ts)
resolve para uma implementação falsa em [`src/lib/mock/`](src/lib/mock):

- **`dataset.ts`** — 8 imóveis, 8 inquilinos, 7 contratos, 51 receitas, 18
  despesas, 10 obrigações de IPTU, extratos e auditoria. As datas são calculadas
  a partir de hoje, então alertas e gráficos continuam coerentes com o
  calendário em qualquer dia.
- **`client.ts`** — implementa `getFullList`/`getList`/`getOne`, `create`,
  `update`, `delete`, `expand` (inclusive aninhado), `sort`, `filter`, realtime
  e `authStore`. Nenhum service ou página sabe que não há backend.
- **`filter.ts`** — avaliador da sintaxe de filtro do PocketBase.

As alterações feitas durante a navegação ficam no `localStorage`: criar um
imóvel e recarregar a página não desfaz o que foi feito. Para voltar ao estado
inicial, limpe o armazenamento do site ou chame `resetMockDatabase()`.

### Voltar a usar o PocketBase de verdade

O schema versionado continua no repositório: 17 migrations e 23 hooks em
[`pocketbase/`](pocketbase) (auditoria por domínio, crons de inadimplência,
fluxo de convite e recuperação de senha).

```bash
VITE_USE_MOCK=false VITE_POCKETBASE_URL=https://seu-pocketbase pnpm build
```

Com `VITE_USE_MOCK=false` a aplicação volta a falar com o servidor, e o login
passa a exigir credenciais válidas de novo.

---

## Deploy

A Vercel constrói a raiz do repositório com `pnpm build` e publica `dist/`. O
[`vercel.json`](vercel.json) faz o fallback de SPA preservando `/api/` e
`/assets/`, e libera CORS no endpoint do cronograma.

## Licença

MIT — ver [LICENSE](LICENSE).
