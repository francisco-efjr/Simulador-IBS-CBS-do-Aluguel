# Documentação Arquitetural — Plataforma de Gestão Imobiliária

> Gerada em 2026-09-15 conforme as **Diretrizes Arquiteturais e Guia de Execução**.
> Todo conteúdo aqui foi validado contra o código real do repositório
> (`src/`, `pocketbase/`, `pb_data`) e contra pesquisa ativa de mercado/legislação — ver [00-pesquisa-e-benchmark](00-pesquisa-e-benchmark.md).

## Índice

| Fase | Documento | Conteúdo |
| :--- | :--- | :--- |
| — | [00-pesquisa-e-benchmark.md](00-pesquisa-e-benchmark.md) | Pesquisa ativa: 3 concorrentes analisados, melhores práticas vigentes, atualizações legais |
| 1 | [01-requisitos-e-restricoes.md](01-requisitos-e-restricoes.md) | Fluxos de negócio, regras de IBS/CBS, escopo de integrações síncronas/assíncronas |
| 2 | [02-modelagem-de-dados.md](02-modelagem-de-dados.md) | Schemas, tabelas, chaves, relacionamentos, tenancy |
| 3 | [03-api/openapi.yaml](03-api/openapi.yaml) | Especificação OpenAPI 3.1 do backend-alvo · [guia](03-api/README.md) |
| 4 | [04-uml.md](04-uml.md) | Diagramas de classe e de sequência dos fluxos críticos |
| 5 | [05-adr/](05-adr/) | 8 Registros de Decisão Arquitetural |
| — | [06-seguranca.md](06-seguranca.md) | Auditoria de segurança: 13 achados com evidência, severidade e correção |
| — | [simulador.md](simulador.md) | Documentação funcional e legal do Simulador IBS/CBS |

## Sumário executivo

**O que existe hoje.** Uma aplicação React 19 + Vite 8 + TypeScript 6 na raiz do repositório que fala
diretamente com um **PocketBase** (BaaS Go/SQLite) — 17 coleções, 17 migrações e 23 hooks server-side
em JavaScript. São 23 telas roteadas, 15 serviços de acesso a dados e dois motores de domínio próprios:
um **parser/classificador de extratos bancários** (OFX + CSV de Itaú, Bradesco, Nubank, Inter, Santander,
BB — 705 linhas) e o **Simulador Tributário IBS/CBS** (Clean Architecture, 4 suítes Vitest), em
`src/simulador/`, exposto na rota pública `/simulador`.

**Posicionamento.** Os três concorrentes pesquisados ocupam nichos vizinhos e **nenhum** entrega o núcleo
deste projeto: Órago vende *análise de risco de inquilino*; Pilota vende *automação de cobrança*;
GeraContratos vende *geração de contratos*. Nosso diferencial defensável é a dupla
**conciliação bancária assistida + motor tributário auditável da Reforma** — nenhum deles tem.
As lacunas a fechar para competir são cobrança (boleto/PIX), assinatura digital e análise de crédito.

> **Atualização de 17/09/2026.** O backend passou a ser um projeto **Supabase** (Postgres com RLS,
> Auth, Storage e Realtime) — ver [ADR-0009](05-adr/0009-supabase-como-backend.md) e
> [supabase/README.md](../supabase/README.md). Isso fechou os quatro achados listados abaixo:
> não há mais token de recuperação próprio (1), as permissões viraram tabela avaliada por RLS em
> toda consulta (2), a aplicação não sobe sem as variáveis de ambiente em vez de subir em modo
> demonstração (3), e todo bucket de arquivo é privado, com link assinado de validade curta (4).
> O texto abaixo é o diagnóstico original, mantido porque é ele que explica por que o desenho
> mudou.

**Quatro achados que bloqueavam publicação com dados reais** (detalhe e correção em
[06-seguranca.md](06-seguranca.md)):

1. **O token de redefinição de senha é devolvido na resposta HTTP.**
   `pocketbase/hooks/auth_solicitar_recuperacao.js:151` retorna `token` no corpo, sem guarda de
   ambiente. O endpoint é público: qualquer pessoa informa o e-mail de um usuário, recebe o token válido
   e troca a senha — inclusive a de um administrador. Correção de minutos, impacto de tomada de conta.
2. **RBAC é apenas client-side.** As 12 permissões por módulo (`sem_acesso`/`visualizacao`/`edicao`)
   vivem em `use-auth.tsx` e `ProtectedRoute`. No servidor, **todas** as coleções de negócio usam a regra
   plana `@request.auth.id != ''` — qualquer usuário autenticado lê e escreve **todos** os registros via
   API REST, ignorando o menu. Agrava: `getModulePermission` devolve `'edicao'` quando `permissoes` está
   vazio (*fail-open*).
3. **Modo mock é o padrão de build.** `IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK !== 'false'` — sem a
   variável explícita, o app sobe sobre dados falsos onde *qualquer credencial entra*. Um build de
   produção que esqueça `VITE_USE_MOCK=false` publica uma tela de login que não autentica nada.
4. **Anexos não são protegidos.** `contratos.documento`, `iptu_taxas.comprovante` e
   `documentos_anexos.arquivo` têm `protected = false`: são servidos por URL **sem autenticação**.
   Contratos assinados e comprovantes ficam protegidos apenas pela obscuridade da URL.

**Divergência de estrutura.** A diretriz pede segregação em Backend / Frontend Web / Mobile. Hoje há
**um** frontend com lógica de negócio dividida entre `src/services/` (cliente) e `pocketbase/hooks/`
(servidor), sem repositório de backend nem app mobile. O caminho recomendado está em
[ADR-0001](05-adr/0001-pocketbase-como-backend.md) e [ADR-0008](05-adr/0008-monorepo-pnpm.md):
manter PocketBase como núcleo, extrair o domínio tributário/financeiro para pacotes compartilhados e
expor um contrato OpenAPI estável — sem reescrita.

**Núcleo tributário a isolar.** O domínio fiscal (`src/simulador/core/`) é TypeScript puro, sem
dependência de UI, com 4 suítes Vitest — pronto para virar pacote publicável e ser consumido também por
backend e mobile sem recompilar a regra. Ver [ADR-0005](05-adr/0005-nucleo-tributario-compartilhado.md).
A documentação funcional do simulador está em [docs/simulador.md](simulador.md).

---

## Próximos passos recomendados

**Segurança.** S-01, S-02, S-03, S-04 e S-05 foram resolvidos pela mudança de backend. Seguem
abertos S-06 (validação de formato na borda), S-09 (tenancy) e S-11 (mascaramento de agência e
conta na tela e nos logs).

**Conformidade legal do simulador:** citar a **LC 227/2026** em `LEGAL_REFERENCES` e no laudo de
auditoria, e reconferir `irpfTable.ts` contra a tabela oficial do exercício. O cálculo está correto — a
fundamentação documental é que está incompleta, e é ela que sustenta uso profissional. Ver
[§2.3 da pesquisa](00-pesquisa-e-benchmark.md).

**Produto, pelo benchmark:** a lacuna nº 1 frente à Pilota é que vendemos *registro* e ela vende
*execução*. A automação de reajuste por IGP-M/IPCA (RN-CTR-02) é o item de maior razão
impacto/esforço — os campos já existem no schema, falta o job de coleta e o endpoint, que também servem
de implementação de referência para o padrão de integrações
([ADR-0007](05-adr/0007-integracoes-externas.md)).

**Ativo subexplorado:** `/simulador` é público e é o único simulador de IBS/CBS sobre locação com laudo
de auditoria entre os concorrentes pesquisados. O GeraContratos construiu tração com 20+ utilitários
gratuitos indexáveis; o nosso não tem título, meta description nem landing dedicada.
