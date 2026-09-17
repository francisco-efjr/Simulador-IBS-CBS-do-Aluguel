# Fase 4 — Modelagem Visual e UML

Diagramas em **Mermaid** (renderizam nativamente no GitHub). Refletem o código atual; onde descrevem
comportamento-alvo ainda não implementado, isso está marcado como **(proposto)**.

---

## 1. Diagramas de Classe

### 1.1 Núcleo tributário — `src/simulador/core/`

Domínio puro, sem nenhuma dependência de React ou DOM (NFR-03). Este é o ativo técnico mais valioso do
projeto e o que nenhum concorrente pesquisado possui.

```mermaid
classDiagram
    direction TB

    class TaxParameters {
        <<value object>>
        +number referenceRate
        +number cbsShare
        +number ibsShare
        +number realEstateDiscountPercent
        +number socialDeductionResidential
        +number pfPropertyThreshold
        +number pfAnnualIncomeThreshold
        +number transitionYear
    }

    class ContractInput {
        <<value object>>
        +LessorNature naturezaLocador
        +PropertyUse destinacao
        +number aluguelBase
        +number condominio
        +number iptu
        +number taxaAdministracao
        +number quantidadeImoveis
        +number receitaAnual
        +boolean inquilinoContribuinte
    }

    class FinancialMath {
        <<static>>
        +toCents(value) number
        +fromCents(cents) number
        +applyRate(baseCents, rate) number
        +roundHalfUp(cents) number
        +sum(values) number
    }

    class ValidationEngine {
        +validateContract(input) ValidationResult
        +validateParameters(params) ValidationResult
        +assertNonNegative(value, field) void
    }

    class EnquadramentoEngine {
        +classify(input, params) TaxpayerStatus
        -meetsPropertyThreshold(qty) boolean
        -meetsIncomeThreshold(income) boolean
    }

    class TransitionCalendar {
        +ratesForYear(year, params) YearRates
        +schedule(params) YearRates[]
        +transitionFactor(year) number
    }

    class TaxCalculatorEngine {
        +calculate(input, params, year) TaxResult
        -netBase(input, params) number
        -socialDeduction(input, params) number
        -operationalCredits(input, params) number
    }

    class ComparativeEngine {
        +compare(input, params, year) ComparativeResult
        -carneLeao(input, year) number
        -pisCofinsCumulative(input) number
    }

    class PortfolioEngine {
        +aggregate(contracts, params, year) PortfolioResult
        -consolidateThresholds(contracts) ThresholdCheck
    }

    class AuditTrailEngine {
        +buildReport(input, result, params) AuditReport
        -calculationSteps(result) CalculationStep[]
        -legalBasis(input) LegalReference[]
    }

    class IrpfTable {
        <<data, versionado por ano>>
        +bracketsFor(year) IrpfBracket[]
        +exemptionRelief(year, base) number
    }

    TaxCalculatorEngine ..> ValidationEngine : valida antes
    TaxCalculatorEngine ..> EnquadramentoEngine : status do contribuinte
    TaxCalculatorEngine ..> TransitionCalendar : aliquota do ano
    TaxCalculatorEngine ..> FinancialMath : aritmetica em centavos
    TaxCalculatorEngine ..> TaxParameters
    TaxCalculatorEngine ..> ContractInput
    ComparativeEngine ..> TaxCalculatorEngine
    ComparativeEngine ..> IrpfTable
    PortfolioEngine ..> TaxCalculatorEngine
    AuditTrailEngine ..> TaxCalculatorEngine
```

**Leitura do diagrama.** `TaxCalculatorEngine` é o único ponto de entrada de cálculo; `Comparative`,
`Portfolio` e `AuditTrail` orquestram sobre ele, nunca reimplementam regra. `IrpfTable` só é alcançada
pelo `ComparativeEngine` — é o que garante a restrição de que nenhuma alíquota de IRPF vive fora dela.

### 1.2 Domínio de gestão imobiliária

```mermaid
classDiagram
    direction LR

    class Usuario {
        +string id
        +string nome
        +string email
        +Perfil perfil
        +boolean ativo
        +Permissao[] permissoes
    }

    class Permissao {
        +ModuloPermissao modulo
        +NivelPermissao nivel
    }

    class Imovel {
        +string id
        +string codigo
        +Endereco endereco
        +TipoImovel tipo
        +StatusImovel status
        +string matricula
        +number valor
    }

    class Inquilino {
        +string id
        +string nome
        +TipoPessoa tipoPessoa
        +string cpf
        +string cnpj
        +Status status
    }

    class Fornecedor {
        +string id
        +string nome
        +string cnpjCpf
        +string tipoFornecedor
    }

    class Contrato {
        +string id
        +string numero
        +Date dataInicio
        +Date dataFim
        +number valorAluguel
        +number diaVencimento
        +string indiceReajuste
        +TipoGarantia tipoGarantia
        +StatusContrato status
        +ativar() void
        +reajustar(indice, competencia) Reajuste
    }

    class Lancamento {
        <<abstract>>
        +string id
        +string competencia
        +Date dataVencimento
        +number valorPrevisto
        +StatusFinanceiro statusFinanceiro
        +string transacaoImportadaId
        +liquidar(valor, data) void
    }

    class Receita {
        +number valorRecebido
        +Date dataRecebimento
    }

    class Despesa {
        +number valorPago
        +Date dataPagamento
    }

    class IptuTaxa {
        +TipoTaxa tipo
        +number anoReferencia
        +Date vencimento
    }

    class CategoriaFinanceira {
        +string nome
        +TipoCategoria tipo
    }

    class LogAtividade {
        +string acao
        +string entidade
        +string detalhes
        +Date created
    }

    Usuario "1" --> "*" Permissao
    Usuario "1" --> "*" LogAtividade : gera
    Imovel "1" --> "*" Contrato
    Inquilino "1" --> "*" Contrato
    Imovel "0..1" --> "0..1" Inquilino : inquilinoAtual (cache)
    Contrato "1" --> "*" Receita : gera na ativacao
    Lancamento <|-- Receita
    Lancamento <|-- Despesa
    Lancamento <|-- IptuTaxa
    Imovel "1" --> "*" Lancamento
    Fornecedor "1" --> "*" Despesa
    CategoriaFinanceira "1" --> "*" Receita
    CategoriaFinanceira "1" --> "*" Despesa
```

> `Lancamento` é abstração de **modelagem**, não de persistência: `receitas`, `despesas` e `iptu_taxas`
> são coleções separadas que compartilham o mesmo contrato de competência. A herança existe para que
> dashboards e relatórios agreguem os três com uma única lógica.

### 1.3 Motor de conciliação bancária — `src/lib/extratos-engine.ts`

```mermaid
classDiagram
    direction TB

    class ExtratoParser {
        <<facade>>
        +parse(file, formato) ParsedTransaction[]
        -parseOfx(content) ParsedTransaction[]
        -parseCsv(content, dialeto) ParsedTransaction[]
        -detectDialeto(header) BancoDialeto
    }

    class Normalizer {
        <<static>>
        +normalizeText(str) string
        +normalizeDescriptionForMatching(str) string
    }

    class DuplicateDetector {
        +detect(novas, existentes) DuplicateReport[]
        -similarity(a, b) number
        -sameAmountAndWindow(a, b) boolean
    }

    class SuggestionEngine {
        +suggest(tx, historico, catalogos) Sugestao
        -matchByHistory(tx, historico) Sugestao
        -matchByCatalog(tx, imoveis, categorias) Sugestao
        -confidence(score) number
    }

    class ParsedTransaction {
        +string data
        +string descricao
        +number valor
        +TipoTransacao tipo
        +boolean duplicataDetectada
        +string[] duplicataIds
        +string sugestaoTipo
        +number sugestaoConfianca
    }

    class ClassificationService {
        +classificar(itens) ClassificacaoResultado[]
        -gerarLancamento(item) Lancamento
        -vincular(tx, lancamento) void
    }

    ExtratoParser --> ParsedTransaction : produz
    ExtratoParser ..> Normalizer
    DuplicateDetector ..> Normalizer
    DuplicateDetector --> ParsedTransaction : marca
    SuggestionEngine --> ParsedTransaction : enriquece
    ClassificationService ..> ParsedTransaction : consome confirmada
    ClassificationService --> Lancamento : cria
```

Dialetos suportados hoje: **OFX** e CSV de **Itaú, Bradesco, Nubank, Inter, Santander e Banco do Brasil**.

---

## 2. Diagramas de Sequência — fluxos críticos

### 2.1 Autenticação com rotação de refresh token **(proposto — ADR-0004)**

Implementa RFC 9700 / OAuth 2.1: cada uso do refresh emite um novo e invalida o anterior; reuso de token
invalidado revoga a família inteira.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant C as Cliente (web/mobile)
    participant API as API /auth
    participant AS as Token Store (famílias)
    participant DB as PocketBase

    U->>C: e-mail + senha
    C->>API: POST /auth/login
    API->>API: rate limit por IP e por conta
    API->>DB: autentica credencial
    DB-->>API: usuário + perfil + ativo

    alt conta desativada (ativo = false)
        API-->>C: 403 Problem (conta desativada)
    else credencial válida
        API->>DB: resolve permissões efetivas
        API->>AS: cria família F, emite access (15 min) + refresh R1
        alt cliente web
            API-->>C: 200 + access; Set-Cookie refresh HttpOnly Secure SameSite=Strict
        else cliente mobile
            API-->>C: 200 + access + refresh
            C->>C: grava refresh no Keychain / Keystore
        end
    end

    Note over C,API: 15 minutos depois, access expira

    C->>API: POST /auth/refresh (R1)
    API->>AS: valida R1 na família F
    alt R1 válido e não usado
        AS->>AS: invalida R1, emite R2 na família F
        API-->>C: 200 + novo access + R2
    else R1 já usado (indício de roubo de token)
        AS->>AS: revoga TODA a família F
        API-->>C: 401 Problem (reautenticação obrigatória)
        C->>C: limpa armazenamento seguro
        C-->>U: redireciona para login
    end
```

### 2.2 Ativação de contrato e geração das receitas da vigência

Operação composta, atômica e idempotente — hoje feita no cliente, sem nenhuma dessas três garantias.

```mermaid
sequenceDiagram
    autonumber
    actor U as Gestor
    participant C as Frontend
    participant API as POST /contratos/{id}/ativacao
    participant AZ as Autorização (servidor)
    participant TX as Transação
    participant DB as PocketBase
    participant H as Hooks de auditoria

    U->>C: "Ativar contrato"
    C->>API: Idempotency-Key: uuid
    API->>AZ: nível em `contratos` >= edicao?
    alt sem_acesso ou visualizacao
        AZ-->>C: 403 Problem
    else edicao
        API->>DB: chave de idempotência já processada?
        alt já processada
            DB-->>API: resultado anterior
            API-->>C: 200 (mesma resposta, sem reexecutar)
        else primeira execução
            API->>DB: imóvel tem outro contrato ativo no período?
            alt conflito de ocupação
                DB-->>API: contrato concorrente
                API-->>C: 409 Problem
            else livre
                TX->>DB: contrato.status = ativo
                TX->>DB: imovel.status = alugado; imovel.inquilinoAtual = inquilino
                loop para cada competência da vigência
                    TX->>DB: cria receita (competência, dataVencimento, valorPrevisto)
                end
                TX->>DB: grava chave de idempotência
                TX-->>API: commit
                DB->>H: onRecordAfterUpdateSuccess(contratos)
                H->>DB: log em logs_atividade
                API-->>C: 200 { contrato, receitasGeradas: 12 }
                C-->>U: "Contrato ativado — 12 receitas previstas"
            end
        end
    end
```

### 2.3 Importação de extrato e classificação assistida

O diferencial competitivo do produto. A sugestão do motor é **consultiva**: nenhum lançamento nasce sem
confirmação humana (RN-IMP-02).

```mermaid
sequenceDiagram
    autonumber
    actor U as Gestor
    participant C as Frontend
    participant API as API /importacoes
    participant P as ExtratoParser
    participant D as DuplicateDetector
    participant S as SuggestionEngine
    participant DB as PocketBase

    U->>C: seleciona conta + arquivo (OFX/CSV)
    C->>API: POST /importacoes (multipart)
    API->>API: valida tamanho (<=20MB) e tipo por conteúdo

    alt tipo ou tamanho inválido
        API-->>C: 415 / 413 Problem
    else arquivo aceito
        API->>P: parse(arquivo, formato)
        P->>P: detecta dialeto do banco
        P-->>API: transações normalizadas
        API->>D: detect(novas, histórico da conta)
        D-->>API: marca duplicatas (+ motivo, ids)
        API->>S: suggest(tx, histórico, imóveis, categorias)
        S-->>API: tipo, categoria, imóvel, confiança
        API->>DB: cria `importacoes` + N `transacoes_importadas` (1 transação por arquivo)
        API-->>C: 201 { importação, duplicatasDetectadas, transações }
    end

    C-->>U: tela de classificação, sugestões pré-marcadas
    U->>C: revisa, ajusta e confirma (individual ou em lote)
    C->>API: POST /transacoes/classificacao (Idempotency-Key)

    loop para cada item confirmado
        API->>DB: transação já classificada?
        alt já classificada
            DB-->>API: conflito
            API->>API: registra falha do item (409 no resultado)
        else pendente
            API->>DB: cria receita ou despesa
            API->>DB: vincula receitaGerada/despesaGerada <-> transacaoImportadaId
            API->>DB: transacao.classificada = true
        end
    end

    API->>DB: atualiza contadores da importação e seu status
    API-->>C: 200 { processadas, falhas, resultados[] }
    C-->>U: "187 classificadas, 3 conflitos"
```

### 2.4 Consumo de API externa com rate limit, retry e fallback

A tributação IBS/CBS é calculada **localmente** (tabela versionada em código), portanto não tem modo de
falha de rede. A dependência externa real do domínio fiscal/financeiro é o **índice de reajuste**
(IGP-M / IPCA). Este é o padrão obrigatório para toda integração externa do sistema.

```mermaid
sequenceDiagram
    autonumber
    participant CR as Cron mensal
    participant J as Job de coleta
    participant CB as Circuit Breaker
    participant EXT as API externa de índices
    participant DB as indices_economicos
    participant OBS as Observabilidade

    CR->>J: dispara coleta da competência
    J->>DB: índice da competência já existe?
    alt já coletado
        DB-->>J: snapshot presente
        J-->>CR: encerra (idempotente)
    else ausente
        J->>CB: estado do circuito?
        alt circuito aberto
            CB-->>J: aberto — não chama
            J->>OBS: alerta "índice indisponível, circuito aberto"
        else circuito fechado
            loop até 3 tentativas, backoff exponencial 1s/2s/4s
                J->>EXT: GET índice (timeout 10s)
                alt 200
                    EXT-->>J: valor do índice
                    J->>DB: grava snapshot (valor, fonte, coletadoEm)
                    J->>CB: registra sucesso
                else 429 Too Many Requests
                    EXT-->>J: 429 + Retry-After
                    J->>J: aguarda Retry-After (respeita o header, não o backoff)
                else 5xx ou timeout
                    EXT-->>J: falha
                    J->>CB: registra falha
                end
            end
            alt todas as tentativas falharam
                CB->>CB: abre o circuito
                J->>OBS: alerta de falha de coleta
            end
        end
    end
```

E o consumo desse snapshot pelo reajuste — que **recusa** em vez de estimar:

```mermaid
sequenceDiagram
    autonumber
    actor U as Gestor
    participant API as POST /contratos/{id}/reajuste
    participant DB as indices_economicos
    participant TX as Transação

    U->>API: reajustar competência 2026-09 por IGP-M
    API->>DB: snapshot do IGP-M em 2026-09?
    alt snapshot ausente
        DB-->>API: nada
        API-->>U: 424 Failed Dependency — "índice indisponível; contrato inalterado"
        Note over API,U: jamais reajustar com índice estimado — erro aqui vira disputa contratual
    else snapshot presente
        DB-->>API: percentual + fonte
        TX->>DB: registra `reajustes` (valorAnterior, valorNovo, índice, fonte)
        TX->>DB: contrato.valorAluguel = novo; proximaDataReajuste += periodicidade
        TX-->>API: commit
        API-->>U: 200 { reajuste aplicado, fonte declarada }
    end
```

### 2.5 Autorização por módulo no servidor **(proposto — ADR-0003)**

O fluxo que corrige o achado crítico: hoje a decisão acontece só no cliente.

```mermaid
sequenceDiagram
    autonumber
    participant C as Cliente
    participant API as Endpoint de negócio
    participant RULE as API Rule / hook
    participant PERM as Coleção `permissoes`
    participant DB as Coleção de negócio

    C->>API: GET /receitas (Bearer access token)
    API->>RULE: avalia autorização
    RULE->>PERM: nível de (usuario, 'receitas')
    alt sem registro ou nivel = sem_acesso
        PERM-->>RULE: sem_acesso (fail-closed)
        RULE-->>C: 403 Problem
    else nivel = visualizacao
        PERM-->>RULE: visualizacao
        RULE->>DB: permite GET; bloqueia POST/PATCH/DELETE
        DB-->>C: 200 página de receitas
    else nivel = edicao
        PERM-->>RULE: edicao
        RULE->>DB: permite todos os métodos
        DB-->>C: 200 / 201
    end

    Note over C,RULE: O menu do cliente continua usando /auth/me,<br/>mas ele é cosmético — a decisão é sempre aqui.
```

---

## 3. Rastreabilidade dos diagramas

| Diagrama                 | Código / documento de origem                                                                        |
| :----------------------- | :-------------------------------------------------------------------------------------------------- |
| 1.1 Núcleo tributário    | `src/simulador/core/{domain,services}/*`                                                            |
| 1.2 Domínio de gestão    | `pocketbase/migrations/*`, [Fase 2](02-modelagem-de-dados.md)                                       |
| 1.3 Conciliação          | `src/lib/extratos-engine.ts`                                                                        |
| 2.1 Autenticação         | `src/hooks/use-auth.tsx` + [ADR-0004](05-adr/0004-tokens-e-sessao.md)                               |
| 2.2 Ativação de contrato | `pocketbase/hooks/on_contrato_create.js`, `src/services/contratos.ts`                               |
| 2.3 Importação           | `src/pages/ImportarExtrato.tsx`, `ClassificarTransacoes.tsx`, `src/services/importacoes.ts`         |
| 2.4 Índices externos     | Fase 1 §4 + [ADR-0007](05-adr/0007-integracoes-externas.md)                                         |
| 2.5 Autorização          | `src/hooks/use-auth.tsx`, `ProtectedRoute.tsx` + [ADR-0003](05-adr/0003-rbac-servidor-e-tenancy.md) |
