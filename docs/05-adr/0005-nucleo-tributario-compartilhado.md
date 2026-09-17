# ADR-0005 — Núcleo tributário como pacote isolado e versionado

- **Status:** Aceita
- **Data:** 2026-09-15

## Contexto

`src/simulador/core/` é o ativo técnico mais valioso do projeto: motor de IBS/CBS sobre locação,
em TypeScript puro, sem nenhuma dependência de React ou DOM, com aritmética decimal em centavos
(`FinancialMath`), regras isoladas por serviço (`EnquadramentoEngine`, `TransitionCalendar`,
`TaxCalculatorEngine`, `ComparativeEngine`, `PortfolioEngine`, `AuditTrailEngine`) e 4 suítes Vitest
(`taxEngine`, `irpfTable`, `exceptionFlows`, `webInteraction`). Nenhum dos três concorrentes pesquisados
tem equivalente.

Três forças pedem que ele seja um pacote, não uma pasta:

1. **O contrato de API expõe `/tributario/simulacoes` e `/tributario/simulacoes/carteira`** — o servidor
   precisa executar exatamente a mesma regra que a tela. Duas implementações da mesma alíquota é
   divergência garantida.
2. **O app mobile** precisará da mesma regra.
3. **Rastreabilidade legal.** O laudo de auditoria declara `versaoMotor`. Isso só tem significado se o
   motor tiver versão própria, independente do release do frontend: um laudo emitido hoje precisa ser
   reproduzível amanhã, mesmo depois de a legislação mudar.

Restrições que já valem no código e devem ser preservadas: as faixas de IRPF vivem **exclusivamente** em
`core/domain/irpfTable.ts`, versionadas por ano-calendário; nenhum outro arquivo contém alíquota de IRPF;
o redutor de isenção ampliada de 2026 é modelado como decaimento linear (`exemptionRelief`).

## Decisão

**Extrair `src/simulador/core/` para um pacote versionado `@app/tax-core` no monorepo**
([ADR-0008](0008-monorepo-pnpm.md)), com:

1. **Versionamento semântico próprio**, desacoplado do app. Mudança de alíquota, de faixa de IRPF ou de
   interpretação legal é **minor** no mínimo, com entrada em CHANGELOG citando a norma.
2. **Zero dependências de runtime.** Lint de dependência falha o build se `react`, `react-dom` ou
   qualquer API de DOM aparecer no pacote (formaliza o NFR-03).
3. **Parâmetros legais como dados versionados por exercício**, não como constantes editáveis em linha.
   `DEFAULT_TAX_PARAMETERS` e `irpfTable` ganham o ano-calendário como chave obrigatória.
4. **A base legal viaja com o cálculo.** `AuditTrailEngine` continua obrigatório na saída, e passa a
   incluir a versão do pacote e a lista de normas aplicadas.
5. **Pendência normativa a corrigir na primeira versão:** `LEGAL_REFERENCES` cita EC 132/2023 e
   LC 214/2025, mas **não menciona a LC 227/2026**, que esclareceu a aplicação **mensal** da dedução do
   Art. 260. O cálculo já trata os R$ 600,00 como mensais — está correto —, mas o laudo precisa citar a
   norma para sustentar uso profissional. Ver [00-pesquisa-e-benchmark §2.3](../00-pesquisa-e-benchmark.md).
6. **Consumidores:** app web (`/simulador`), rotas `/tributario/*` da API e, futuramente, mobile. Todos
   pela mesma versão publicada.

## Consequências

**Positivas** — uma única implementação da regra fiscal para web, API e mobile; laudo reproduzível por
versão; a suíte de testes passa a guardar um pacote com contrato próprio; auditor externo pode revisar o
pacote sem ler o app.

**Negativas** — publicar e versionar dá trabalho: cada mudança de alíquota exige bump, changelog e
atualização dos consumidores. Executar o motor no servidor significa rodar TypeScript compilado dentro de
hooks Goja do PocketBase, cujo suporte a recursos modernos é limitado — pode exigir _build target_
conservador (ES2015) para o pacote, ou executar as rotas `/tributario/*` em um processo Node separado.
Isso precisa ser provado com um protótipo **antes** de prometer o endpoint no contrato.

**Não decidido aqui** — se `/tributario/*` roda em hook Goja ou em processo Node. Depende do resultado do
protótipo acima; ADR própria quando houver dado.
