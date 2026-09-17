# 00 — Pesquisa Ativa e Benchmark Competitivo

> **Princípio Fundamental de Execução:** este documento cumpre a exigência de pesquisa ativa e atualizada
> _antes_ de qualquer decisão de código. Data da coleta: **2026-09-15**. Fontes ao final.

---

## 1. Benchmark dos concorrentes

### 1.1 Órago (`oragoapp.com.br`) — análise de risco de inquilino

Plataforma de _credit & fraud analysis_ vendida para imobiliárias. Não gerencia a carteira do
proprietário; vende consultas.

**Catálogo e preços (Plano Pós-pago vs. avulso):**

| Produto                                                  |        Pós-pago         |  Avulso  |
| :------------------------------------------------------- | :---------------------: | :------: |
| Análise financeira padrão (50+ fontes)                   |         R$ 9,00         | R$ 18,00 |
| Análise financeira simplificada                          |         R$ 6,00         |    —     |
| Análise financeira avançada (nacional)                   |        R$ 16,00         |    —     |
| Análise judicial padrão                                  |         R$ 3,00         | R$ 6,00  |
| Análise judicial avançada (resumo humano, ≤3h úteis)     |        R$ 20,00         |    —     |
| Empréstimos e financiamentos bancários                   |         R$ 8,00         |    —     |
| Importação bancária via **Open Finance** (Banco Central) |         R$ 5,00         |    —     |
| Verificação de identidade: biometria facial (base Gov)   |         R$ 3,00         |    —     |
| Verificação de identidade: PIX de R$ 0,01 (titularidade) |         R$ 1,50         |    —     |
| Verificação de identidade: quiz por WhatsApp             |         R$ 1,50         |    —     |
| Assinatura digital (DocuSign)                            | R$ 3,00 (30 grátis/mês) |    —     |

**Modelo comercial:** pós-pago com **consumo mínimo de R$ 99,90/mês**, desconto progressivo por volume,
sem fidelidade, teste grátis só para CNPJ. Calculadora de preço interativa na própria landing.

**O que vale copiar:** (a) a calculadora de preço que monta o plano na frente do lead;
(b) a tabela comparativa "nós vs. concorrentes"; (c) o uso de **Open Finance** para importar extratos —
é exatamente o _upgrade_ natural do nosso parser OFX/CSV, que hoje exige upload manual.

---

### 1.2 Pilota Imóveis (`pilotaimoveis.com.br`) — automação de cobrança

Concorrente **direto** do nosso módulo financeiro. Alvo declarado: "proprietários de 1 a 1.000 imóveis" —
o mesmo público do nosso produto.

**Funcionalidades:** boletos automáticos mensais (integração **Inter** e **Asaas**), multa de 10% + juros
de 2%/mês aplicados automaticamente, régua de cobrança por WhatsApp (D-3 / D+1 / D+5, gratuita e
ilimitada), reajuste automático por IGP-M, consulta Serasa integrada (R$ 15,90), contratos digitais com
assinatura eletrônica, vistorias pelo sistema, notas fiscais, seguro fiança/incêndio, informe de
rendimentos para o IR, leads e vitrine própria.

**Planos:** Pilota 3 → R$ 49/mês (só anual, até 3 imóveis) · Pilota 5 → R$ 79/mês · Pilota 10 → R$ 99/mês
(mais popular). 7 dias grátis, sem cartão. **Precificação por faixa de imóveis.**

**Provas sociais usadas:** +1.000 proprietários, +5.000 imóveis, "30% menos inadimplência",
economia de "4h/mês", "até R$ 1.800/ano em reajustes não perdidos".

**Leitura estratégica:** a Pilota vende **tempo economizado**, não software. Toda a narrativa é
"15 minutos por mês". Nosso produto hoje vende _controle_ — cadastro, dashboards, relatórios — e exige
trabalho do usuário (upload de extrato, classificação de transação). Sem emissão de cobrança, somos uma
ferramenta de _registro_; a Pilota é uma de _execução_. Essa é a lacuna competitiva nº 1.

---

### 1.3 GeraContratos (`geracontratos.com.br`) — documentos e SEO

Gerador de contratos self-service: aluguel (Lei do Inquilinato), serviços, compra e venda de
imóvel/veículo, empréstimo, procuração, união estável, contrato social, distrato. Preenchimento por
perguntas, prévia grátis antes de pagar, PDF na hora, assinatura digital por e-mail/WhatsApp,
preenchimento automático por CPF/CNPJ/CEP. Métricas exibidas: 11.000+ contratos, nota 4,9.
Há também um app por assinatura (modelos reutilizáveis + clientes cadastrados, 7 dias grátis).

**O ativo mais relevante deles não é o produto — é a cauda longa de ferramentas gratuitas:**
calculadora de reajuste (IGPM/IPCA), gerador de recibo de aluguel, calculadora de multa rescisória,
gerador de laudo de vistoria, simulador de custo total de aluguel, **simulador de IR sobre aluguel**,
checklist de vistoria, gerador de ficha cadastral, gerador de RPA, PJ×CLT, DAS MEI, rescisão
trabalhista — 20+ utilitários indexáveis que capturam busca orgânica e afunilam para o produto pago.

**Leitura estratégica:** nosso `/simulador` (rota pública de IBS/CBS) é um ativo desse mesmo tipo — e
mais forte, porque é o único no mercado pesquisado que modela a **Reforma Tributária** com laudo de
auditoria. Está subexplorado: não há SEO, título, meta description ou landing dedicada.

---

### 1.4 Matriz consolidada

| Capacidade                                                    |          Órago          |      Pilota       |      GeraContratos      |        **Nosso projeto**         |
| :------------------------------------------------------------ | :---------------------: | :---------------: | :---------------------: | :------------------------------: |
| Cadastro de imóveis/inquilinos/contratos                      |            —            |        ✅         |         parcial         |                ✅                |
| Receitas, despesas, IPTU e taxas                              |            —            |        ✅         |            —            |                ✅                |
| Dashboards e relatórios (PDF/XLSX)                            |         painel          |        ✅         |            —            |                ✅                |
| **Importação e conciliação de extrato (OFX/CSV multi-banco)** | via Open Finance (pago) |         —         |            —            |         ✅ **exclusivo**         |
| **Classificação assistida com sugestão por histórico**        |            —            |         —         |            —            |         ✅ **exclusivo**         |
| **Simulador IBS/CBS com laudo de auditoria legal**            |            —            |         —         | simulador de IR simples |         ✅ **exclusivo**         |
| RBAC por módulo e log de atividade                            |            —            |         —         |            —            |  ✅ (só no cliente — ver risco)  |
| Emissão de boleto/PIX                                         |            —            | ✅ (Inter, Asaas) |            —            |          ❌ **lacuna**           |
| Régua de cobrança automática (WhatsApp)                       |            —            |        ✅         |            —            |          ❌ **lacuna**           |
| Assinatura digital de contratos                               |      ✅ (DocuSign)      |        ✅         |           ✅            |          ❌ **lacuna**           |
| Análise de crédito / antifraude do inquilino                  |        ✅ núcleo        |    ✅ (Serasa)    |            —            |          ❌ **lacuna**           |
| Reajuste automático por índice (IGP-M/IPCA)                   |            —            |        ✅         |       calculadora       | ⚠️ campos existem, sem automação |
| Vistoria e laudo                                              |            —            |        ✅         |         gerador         |                ❌                |
| Geração de contrato a partir de modelo                        |            —            |        ✅         |        ✅ núcleo        |        ❌ (só anexa PDF)         |
| App mobile                                                    |            —            |    web mobile     |           web           |                ❌                |

**Conclusão de posicionamento.** O produto defensável é _"o sistema de gestão de aluguéis que fecha o mês
sozinho e já sabe quanto você vai pagar de IBS/CBS"_: conciliação bancária + apuração tributária. As
lacunas de cobrança, assinatura e crédito são **compráveis via API** (Asaas/Inter, DocuSign/Clicksign,
Serasa) e devem entrar como integrações — não como desenvolvimento próprio.

---

## 2. Melhores práticas vigentes validadas (pesquisa 2026)

Estas conclusões alimentam diretamente os ADRs e o documento de segurança.

**2.1 PocketBase em produção.** É aceitável expor o PocketBase publicamente **desde que** as API rules
estejam configuradas por coleção e a senha de superusuário seja forte — as rules funcionam simultaneamente
como controle de acesso _e_ filtro de query. Multi-tenancy não é nativo: implementa-se por rule, no padrão
`owner = @request.auth.id` ou `tenant.id = @request.auth.tenant.id` (e `tenant = null || tenant.id = …`
para coleções mistas). A documentação oficial separa configurações críticas (obrigatórias) de hardening
opcional, e alerta que o transporte de e-mail default (sendmail) é inadequado em produção — SMTP é
pré-requisito para os fluxos de OTP e recuperação de senha. Rate limiting é item de produção, não opcional.
→ Consequência direta: nossas rules planas `@request.auth.id != ''` **violam** essa prática. Ver
[ADR-0003](05-adr/0003-rbac-servidor-e-tenancy.md).

**2.2 Autenticação mobile e tokens.** A **RFC 9700** (BCP de segurança OAuth 2.0, jan/2025) tornou o
**PKCE obrigatório** em todos os fluxos e a **rotação de refresh token** prática padrão. OAuth 2.1 exige
rotação para clientes públicos — cada uso do refresh token emite um novo e invalida o anterior; o servidor
rastreia _famílias_ de token e, ao detectar reuso de token invalidado, revoga a família inteira e força
reautenticação. Tokens devem residem em armazenamento seguro da plataforma (Keychain iOS com
`kSecAttrAccessibleWhenUnlockedThisDeviceOnly`; Keystore Android com respaldo em hardware), nunca em
`AsyncStorage`/`localStorage`. Recomenda-se ainda _device attestation_ (App Attest / Play Integrity) e
passkeys/WebAuthn como fator primário. → Ver [ADR-0004](05-adr/0004-tokens-e-sessao.md).

**2.3 Atualização legal — a mais importante deste documento.** O simulador cita EC 132/2023 e
LC 214/2025, com redutor social de R$ 600,00 e redução de 70% na alíquota de locação (Arts. 248–265).
Duas atualizações posteriores **não estão refletidas no código**:

- **LC 227/2026** esclareceu que a dedução do Art. 260 da LC 214/2025 é aplicada **mensalmente**.
  Nosso `DEFAULT_TAX_PARAMETERS.socialDeductionResidential = 600.0` já é tratado como valor mensal por
  imóvel residencial, portanto o cálculo está **correto** — mas nenhuma referência a LC 227/2026 aparece
  em `LEGAL_REFERENCES`, e o laudo de auditoria cita apenas a LC 214/2025. É uma lacuna de
  **fundamentação documental**, não de aritmética.
- Consolidou-se em 2026 o entendimento de que **receita elevada de aluguel, isoladamente, não basta**
  para a incidência de IBS/CBS sobre pessoa física — os dois critérios (receita anual > R$ 240.000 **E**
  mais de 3 imóveis) são cumulativos. Nosso `EnquadramentoEngine` **já implementa a regra cumulativa**,
  o que é a leitura correta e um diferencial de precisão frente a calculadoras genéricas.

→ Ação obrigatória antes de qualquer publicação: adicionar LC 227/2026 a `LEGAL_REFERENCES` e ao laudo;
reconferir a tabela de IRPF de `irpfTable.ts` contra a tabela oficial vigente do exercício.

---

## Fontes

Concorrentes: [Órago — Planos](https://www.oragoapp.com.br/planos) ·
[Pilota Imóveis](https://pilotaimoveis.com.br/) · [GeraContratos](https://geracontratos.com.br/)

PocketBase e segurança de API:
[Discussion #3542 — securing PocketBase in production](https://github.com/pocketbase/pocketbase/discussions/3542) ·
[Discussion #97 — multi-tenant](https://github.com/pocketbase/pocketbase/discussions/97) ·
[Issue #5005 — tenancy-aware auth](https://github.com/pocketbase/pocketbase/issues/5005) ·
[Production Security Configuration](https://deepwiki.com/pocketbase/site/6.3-production-security-configuration)

Autenticação:
[OAuth 2.0 Security Best Practices: PKCE e state](https://www.authgear.com/post/oauth2-security-best-practices-pkce-state/) ·
[Mobile App Authentication Best Practices (iOS/Android 2026)](https://www.securecodinghub.com/blog/mobile-app-authentication-best-practices-ios-android) ·
[Refresh tokens — uso seguro](https://www.obsidiansecurity.com/blog/what-are-refresh-tokens-secure-usage) ·
[Guia de API security: OAuth 2.1 e JWT](https://daily.dev/blog/dev-guide-api-security-oauth-2-1-jwt-vulnerabilities/)

Legislação (IBS/CBS na locação):
[Conjur — incidência de CBS/IBS nas operações com bens imóveis](https://conjur.com.br/2025-jul-21/a-incidencia-do-cbs-ibs-nas-operacoes-com-bens-imoveis-a-luz-da-ec-132-2023-e-da-lc-214-2025/) ·
[Barbieri Advogados — PF contribuinte, redutor social e enquadramento (2026)](https://www.barbieriadvogados.com/en/pessoas-fisicas-como-contribuintes-quando-o-aluguel-vira-atividade-empresarial/) ·
[Teixeira Fortes — receita elevada não basta para incidência](https://www.fortes.adv.br/2026/05/27/receita-elevada-de-aluguel-nao-basta-para-incidencia-de-ibs-e-cbs/) ·
[LC 214/2025 e a locação de imóveis](https://imobiliariasinai.com.br/blog/noticias-mercado/lc-214-2025-locacao-imoveis/)
