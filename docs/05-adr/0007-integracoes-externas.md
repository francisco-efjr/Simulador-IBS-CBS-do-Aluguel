# ADR-0007 — Padrão único para integrações externas

- **Status:** Aceita
- **Data:** 2026-09-15

## Contexto

O sistema hoje quase não depende de terceiros: o cronograma de IBS/CBS e a tabela de IRPF são dados
versionados **em código**, e o extrato chega por upload. Isso é uma virtude de projeto — o cálculo fiscal
não tem modo de falha de rede — e deve ser preservado onde for possível.

O benchmark, porém, mostra que competir exige integrações: a Pilota emite boleto via **Inter e Asaas**,
roda régua de cobrança por WhatsApp, consulta **Serasa** e reajusta por IGP-M automaticamente; a Órago
usa **Open Finance** do Banco Central, biometria contra base do Governo Federal e **DocuSign**; o
GeraContratos preenche dados por CPF/CNPJ/CEP.

Cada uma dessas integrações tem consequência financeira ou jurídica em caso de erro: cobrar o inquilino
duas vezes, reajustar com índice errado, consumir consulta paga em duplicidade. Definir o padrão **antes**
de escrever a primeira integração é mais barato do que corrigir três implementações divergentes.

## Decisão

**Toda chamada a serviço externo obedece ao padrão abaixo. Sem exceção não documentada em ADR própria.**

**1. Classificação obrigatória.** Cada integração é declarada como síncrona ou assíncrona no
[§4 da Fase 1](../01-requisitos-e-restricoes.md), com timeout e fallback explícitos. **Nenhuma** chamada
externa no caminho crítico de renderização.

**2. Timeout, retry e circuit breaker.** Timeout explícito sempre (nunca o default da biblioteca). Retry
com backoff exponencial **apenas** para operações idempotentes — `429` respeita o `Retry-After` do
provedor em vez do backoff próprio. Circuit breaker por provedor; aberto, não chama e alerta.
Ver diagrama [2.4 da Fase 4](../04-uml.md).

**3. Idempotência em toda operação com efeito financeiro.** Chave derivada do domínio
(`cobrancas.idempotency_key`, única) e não de um UUID aleatório por tentativa: é o que impede emitir dois
boletos para a mesma receita. Consultas **pagas** (crédito, antifraude) **não têm retry automático** —
retry cobra o cliente de novo.

**4. Webhooks: assinados, idempotentes e registrados.** Verificação de assinatura HMAC obrigatória.
`webhooks_recebidos` com `id_externo` **único** absorve reentrega do provedor. Payload persistido para
_replay_, sem dado sensível.

**5. Fallback declarado ao usuário, nunca silencioso.** Índice indisponível → `424` e contrato
inalterado, jamais estimativa. Boleto não emitido → lançamento em `pendente_emissao`. Assinatura → contrato
em `aguardando_assinatura`. Cada estado desses é visível na interface.

**6. Segredos fora do código e fora do bundle.** Credencial de provedor **nunca** em variável `VITE_*`:
tudo com prefixo `VITE_` vai para o bundle público. Chaves vivem no ambiente do servidor ou em secret
manager, e qualquer integração que exija chave é, por isso, server-side por definição.

**7. Dado externo é entrada não confiável.** Resposta de terceiro passa por validação de schema (Zod) na
borda, antes de qualquer persistência. Provedor mudar contrato é evento esperado, não excepcional.

**8. Observabilidade sem vazamento.** Logar provedor, operação, latência, status e `requestId`.
**Nunca** logar corpo com dado bancário, CPF completo, token ou chave de API.

## Consequências

**Positivas** — o modo de falha de cada integração é decidido uma vez; cobrança duplicada e reajuste com
índice inventado passam a ser impossíveis por construção; segredo em bundle público fica barrado por regra
explícita; o padrão vale igual para boleto, WhatsApp, assinatura, crédito e Open Finance.

**Negativas** — a primeira integração paga o custo da infraestrutura (breaker, fila, registro de webhook,
tabela de idempotência) e vai parecer desproporcional. Estado intermediário (`pendente_emissao`,
`aguardando_assinatura`) é trabalho de UI que só existe por causa do padrão. Circuit breaker mal calibrado
pode abrir sob carga legítima — exige métrica antes de ajustar limiar.

**Aplicação imediata** — a coleta de índices IGP-M/IPCA (RN-CTR-02) é a primeira integração e serve de
implementação de referência: é de baixo risco (job mensal, sem efeito financeiro direto) e exercita
timeout, retry, `429`, breaker, snapshot e fallback por recusa.
