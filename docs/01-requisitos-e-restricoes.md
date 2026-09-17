# Fase 1 — Levantamento de Requisitos e Restrições

Mapeamento integral dos fluxos de negócio implementados e planejados, e definição de escopo para
integrações externas. Base: código em `src/` e `pocketbase/`.

---

## 1. Atores e perfis

| Ator                        | Origem no código                                  | Capacidades                                                                   |
| :-------------------------- | :------------------------------------------------ | :---------------------------------------------------------------------------- |
| **Administrador**           | `users.perfil = 'administrador'`                  | Tudo, mais `/usuarios` e `/logs-atividade`; convida usuários                  |
| **Usuário**                 | `users.perfil = 'usuario'` + `users.permissoes[]` | Acesso por módulo, em 3 níveis: `sem_acesso`, `visualizacao`, `edicao`        |
| **Visitante**               | sem sessão                                        | Apenas `/simulador` (rota pública), `/login`, `/signup`, recuperação de senha |
| **Superusuário PocketBase** | `_superusers`                                     | Operação da plataforma; fora do fluxo de produto                              |

Os 12 módulos sujeitos a permissão (`ModuloPermissao` em `src/lib/constants.ts`): `imoveis`,
`inquilinos`, `fornecedores`, `contratos`, `receitas`, `despesas`, `iptu_taxas`, `dashboards`,
`alertas`, `relatorios`, `importar_extrato`, `classificar_transacoes`.

> **Restrição crítica (RN-SEC-01):** esses três níveis são hoje avaliados **exclusivamente no cliente**.
> Requisito obrigatório de Fase 2/3: espelhar cada nível em API rule e/ou hook server-side.
> Ver [06-seguranca.md](06-seguranca.md) e [ADR-0003](05-adr/0003-rbac-servidor-e-tenancy.md).

---

## 2. Fluxos de negócio implementados

### F1 — Ciclo de vida do imóvel

Cadastro (`ImovelFormDialog`) com endereço completo, tipo (`apartamento`/`casa`/`sala_comercial`/
`terreno`/`outro`), matrícula, inscrição imobiliária, métricas físicas (área, quartos, banheiros, vagas),
valor e valor estimado, fotos e `inquilino_atual`. Status `ativo`/`inativo`. Toda criação/edição emite log
via hook `audit_imoveis.js`.

### F2 — Inquilinos e fornecedores

Inquilino PF ou PJ (`tipo_pessoa`), com CPF/CNPJ, RG, data de nascimento, nome fantasia, responsável,
endereço. Fornecedor com `tipo_fornecedor` e `servicos_prestados`. Ambos com anexos via
`documentos_anexos` (padrão polimórfico `entidade_tipo` + `entidade_id`).

### F3 — Contratos de locação

Vincula `imovel` + `inquilino`, com `data_inicio`/`data_fim`, `valor_aluguel`, `dia_vencimento`,
`indice_reajuste`, `periodicidade_reajuste`, `proxima_data_reajuste`, `tipo_garantia` + `valor_garantia`,
e PDF anexo. Hooks `on_contrato_create.js` / `on_contrato_update.js` reagem ao ciclo de vida.

- **RN-CTR-01:** ao ativar um contrato, gerar as receitas previstas da vigência (`competencia`,
  `data_vencimento` derivada de `dia_vencimento`, `valor_previsto`).
- **RN-CTR-02 (lacuna):** os campos de reajuste existem, mas **não há automação** que aplique IGP-M/IPCA
  na `proxima_data_reajuste`. É a funcionalidade que a Pilota usa como principal argumento de venda
  ("até R$ 1.800/ano em reajustes não perdidos"). Requisito prioritário.

### F4 — Financeiro (receitas, despesas, IPTU/taxas)

Três coleções com o mesmo desenho de competência: `competencia`, `data_vencimento`, `valor_previsto`,
`valor_pago`/`valor_recebido`, `data_pagamento`/`data_recebimento`, `status_financeiro`, forma de
pagamento, e `transacao_importada_id` — a chave de rastreabilidade da conciliação (F5).
Categorização por `categorias_financeiras` (`tipo` receita/despesa), com seeds nas migrações 0010 e 0012.

- **RN-FIN-01:** três crons (`cron_receitas_overdue.js`, `cron_despesas_overdue.js`,
  `cron_iptu_taxas_overdue.js`) promovem lançamentos vencidos a _em atraso_. São a base do módulo
  `/alertas`.
- **RN-FIN-02:** nenhum lançamento pode existir com `valor_previsto` e `valor_pago` simultaneamente
  nulos quando `status_financeiro = 'pago'`.

### F5 — Importação e conciliação de extrato (diferencial competitivo)

Fluxo de três telas: `/importar-extrato` → `/classificar-transacoes` → `/historico-importacoes`.
Motor em `src/lib/extratos-engine.ts` (705 linhas):

1. **Parsing** de OFX e de CSV nos dialetos de Itaú, Bradesco, Nubank, Inter, Santander e BB.
2. **Normalização** de descrição (remoção de diacríticos, pontuação, prefixos `PIX`/`TED`/`DOC`/`PAGTO`/
   `TRANSF`, datas e números de documento).
3. **Detecção de duplicata** por _fuzzy match_ → `duplicata_detectada`, `duplicata_motivo`,
   `duplicata_ids`.
4. **Sugestão** de `tipo` (receita/despesa), `categoria` e `imovel` com `sugestao_confianca` e
   `sugestao_origem`, aprendida do histórico de classificações.
5. **Classificação** individual ou em lote, gerando `receita_gerada`/`despesa_gerada`.

- **RN-IMP-01:** uma transação classificada é imutável; reclassificar exige estornar o lançamento gerado.
- **RN-IMP-02:** confiança da sugestão é _advisory_ — jamais persistir lançamento sem confirmação humana.
- **RN-IMP-03 (evolução):** substituir/complementar o upload por **Open Finance** (padrão que a Órago
  cobra R$ 5,00 por consulta), eliminando o download manual do extrato.

### F6 — Dashboards, alertas e relatórios

`/dashboard-financeiro` e `/dashboard-imoveis` (Recharts), `/alertas` (vencimentos e atrasos),
`/relatorios` com exportação PDF (`jspdf` + `jspdf-autotable`) e XLSX (`xlsx`) via
`src/lib/reports-generator.ts` (943 linhas).

### F7 — Identidade e governança

Login/signup por e-mail e senha (PocketBase auth). Recuperação de senha **customizada** via coleção
`password_resets` + hooks `auth_solicitar_recuperacao.js`, `auth_validar_token_reset.js`,
`auth_redefinir_senha.js`. Convites por token com expiração (`convites` + `convite_enviar.js`,
`convite_reenviar.js`, `convite_validate.js`). Auditoria transversal em `logs_atividade` alimentada por
5 hooks de audit. `on_users_lifecycle.js` trata o ciclo de vida da conta; `users.ativo = false` derruba a
sessão no `authRefresh`.

### F8 — Simulador Tributário IBS/CBS (rota pública `/simulador`)

Clean Architecture, domínio puro sem dependência de UI. Quatro abas: simulação individual, análise
comparativa pré/pós-reforma, simulação de carteira e explorador do cronograma de transição. Produz
**laudo de auditoria** com memória de cálculo e base legal. "Modo profissional" (`useProfessionalMode`)
recolhe os módulos técnicos, deixando a interface pública enxuta para o locador.

---

## 3. Regras tributárias (IBS/CBS) — especificação normativa

Fonte: `src/simulador/core/domain/constants.ts` e `core/services/*`. Base legal: EC 132/2023,
LC 214/2025 (Arts. 248–265) e **LC 227/2026** (ver ressalva ao final).

**RT-01 — Enquadramento do locador PF (cumulativo).** PF é contribuinte do regime regular **somente se**
possuir **mais de 3** imóveis alugados **E** auferir receita bruta anual de locação **superior a
R$ 240.000,00**. Falhando qualquer um dos critérios → **Não Contribuinte**, alíquota **zero**.
PJ (holding, administradora) é **sempre** contribuinte no regime específico de bens imóveis.
`pfPropertyThreshold = 3`, `pfAnnualIncomeThreshold = 240000.0`.

**RT-02 — Exclusão de encargos acessórios** (Arts. 255 e 260):
`Base Bruta = Recibo Total − (Condomínio + IPTU)`.

**RT-03 — Redutor social residencial** (Art. 260, § 1º):
`Redutor = min(Aluguel Base; R$ 600,00)` e `Base Líquida = max(0; Aluguel Base − 600,00)`.
Mensal, por imóvel residencial. **Não se aplica a imóveis comerciais.**

**RT-04 — Redução de 70% na alíquota** de operações com bens imóveis: alíquota de referência de
**26,50%** (CBS 8,80% + IBS 17,70%) → efetiva plena de **7,95%** em 2033.

**RT-05 — Cronograma de transição** (`TransitionCalendar.ts`):

|    Ano    | Fase                             | CBS efetiva | IBS efetiva | **Total** |
| :-------: | :------------------------------- | :---------: | :---------: | :-------: |
|   2026    | Ano-teste nacional               |    0,27%    |    0,03%    | **0,30%** |
| 2027–2028 | CBS plena / fim de PIS-COFINS    |    2,64%    |    0,00%    | **2,64%** |
|   2029    | Início da transição do IBS (10%) |    2,64%    |    0,53%    | **3,17%** |
|   2030    | 20% do IBS                       |    2,64%    |    1,06%    | **3,70%** |
|   2031    | 30% do IBS                       |    2,64%    |    1,59%    | **4,23%** |
|   2032    | 40% do IBS                       |    2,64%    |    2,12%    | **4,76%** |
|   2033    | Regime definitivo pleno          |    2,64%    |    5,31%    | **7,95%** |

**RT-06 — Créditos e cadeia B2B.** Locador PJ credita a alíquota padrão sobre a taxa de administração
imobiliária (insumo de intermediação). Inquilino PJ no regime não-cumulativo apropria créditos de IBS/CBS
sobre aluguel comercial pago a locador contribuinte.

**RT-07 — Comparativo pré vs. pós-reforma.** PF: Carnê-Leão (IRPF) pela tabela progressiva **mensal do
ano-calendário simulado**, deduzindo comissão de imobiliária, condomínio, IPTU suportado pelo locador e o
próprio IBS/CBS recolhido. PJ: PIS/COFINS cumulativo a 3,65% (Lucro Presumido) vs. IBS/CBS líquido de
créditos.

**RT-08 — Precisão aritmética.** Todo cálculo em `FinancialMath.ts`, aritmética decimal em centavos com
arredondamento estrito. **Proibido** `number` de ponto flutuante em base de cálculo ou alíquota.

**Restrições de manutenção:**

- As faixas de IRPF mudam por lei todo ano e vivem **isoladas** em `core/domain/irpfTable.ts`,
  versionadas por ano-calendário. Nenhum outro arquivo pode conter alíquota de IRPF. Conferir contra a
  tabela oficial da Receita antes de publicar cada exercício.
- O redutor de isenção ampliada de 2026 é modelado como decaimento linear entre o teto de isenção e o
  teto do redutor (`exemptionRelief`); se a norma regulamentar fixar outra curva, ajustar **somente** ali.
- ⚠️ **Pendência normativa:** `LEGAL_REFERENCES` não menciona a **LC 227/2026**, que esclareceu a
  aplicação mensal da dedução do Art. 260. O cálculo já está correto (tratamos os R$ 600 como mensais),
  mas o laudo de auditoria precisa citar a norma. Bloqueia publicação profissional.

---

## 4. Integrações externas — escopo síncrono vs. assíncrono

Regra geral: **nenhuma chamada externa no caminho crítico de renderização**; tudo com timeout explícito,
_retry_ com backoff exponencial, circuit breaker e valor de _fallback_ declarado no laudo/UI.

| Integração                                 | Status          | Modo                                                    | Timeout / política                                     | Fallback                                                                   |
| :----------------------------------------- | :-------------- | :------------------------------------------------------ | :----------------------------------------------------- | :------------------------------------------------------------------------- |
| Índices IGP-M / IPCA (reajuste)            | a fazer         | **Assíncrono** — cron mensal grava snapshot             | 10 s, 3 retries, cache ≥ 35 dias                       | Último índice publicado, marcado como "não atualizado"                     |
| Cronograma de transição IBS/CBS            | ✅ interno      | **Síncrono local** — tabela versionada em código        | n/a                                                    | n/a (é a fonte da verdade)                                                 |
| Tabela IRPF                                | ✅ interno      | **Síncrono local** — `irpfTable.ts` por ano             | n/a                                                    | Ano mais recente disponível + aviso explícito                              |
| Emissão de boleto/PIX (Asaas, Inter)       | lacuna          | **Assíncrono** — fila + webhook de liquidação           | 15 s, idempotência por chave de lançamento             | Lançamento fica `pendente_emissao`; nunca duplicar cobrança                |
| Régua de cobrança (WhatsApp/e-mail)        | lacuna          | **Assíncrono** — job por gatilho D-3/D+1/D+5            | rate limit do provedor, dedupe por (lançamento, etapa) | Reagenda; jamais reenvia a mesma etapa                                     |
| Assinatura digital (DocuSign/Clicksign)    | lacuna          | **Assíncrono** — envia e recebe callback                | 20 s no envio; webhook assinado (HMAC)                 | Contrato permanece `aguardando_assinatura`                                 |
| Análise de crédito / antifraude            | lacuna          | **Síncrono com espera explícita** (consulta paga)       | 30 s, sem retry automático (evita cobrança dupla)      | Erro explícito ao usuário; não consumir crédito                            |
| Open Finance (extratos)                    | evolução        | **Assíncrono** — consentimento + coleta agendada        | conforme spec do BCB                                   | Upload manual OFX/CSV (fluxo atual)                                        |
| CIB — Cadastro de Bens Imóveis (Art. 265)  | futuro          | **Assíncrono** — enriquecimento em background           | 10 s, cache longo                                      | Campo `inscricao_imobiliaria` manual                                       |
| Preenchimento por CPF/CNPJ/CEP             | futuro          | **Síncrono, não bloqueante** — sugere, não trava o form | 5 s, 1 retry                                           | Digitação manual                                                           |
| SMTP transacional                          | **obrigatório** | Assíncrono                                              | —                                                      | Nenhum: sem SMTP, recuperação de senha e convite não funcionam em produção |
| `$ai.chat` / `$ai.agent` (via `skipAi.ts`) | ✅ presente     | **Streaming (SSE)**                                     | timeout de stream + cancelamento                       | Degradar para resposta não-assistida                                       |

**Restrições de plataforma:**

- SQLite (PocketBase) → escrita serializada; importações grandes de extrato devem ser feitas em lote, com
  transação por arquivo, não por transação bancária.
- `pb.autoCancellation(false)` está ligado em `src/lib/pocketbase/client.ts`: requisições concorrentes não
  se cancelam. Exige atenção a _race conditions_ em telas com filtros rápidos.
- Modo mock (`VITE_USE_MOCK`) é **padrão ligado** — restrição de build tratada em
  [ADR-0002](05-adr/0002-modo-mock-opt-in.md).

---

## 5. Requisitos não funcionais

| ID     | Requisito                             | Critério de aceite                                                                           |
| :----- | :------------------------------------ | :------------------------------------------------------------------------------------------- |
| NFR-01 | Auditabilidade fiscal                 | Toda simulação emite laudo com memória de cálculo e artigo de lei citado                     |
| NFR-02 | Precisão monetária                    | Zero uso de float em base/alíquota; testes de arredondamento em centavos                     |
| NFR-03 | Isolamento de domínio                 | `core/` sem nenhum import de React/DOM (verificável por lint de dependência)                 |
| NFR-04 | Acessibilidade                        | Rótulos ligados a campos, alvos de toque generosos, tipografia ampliada na interface pública |
| NFR-05 | Responsividade                        | Telas operáveis em 375 px de largura                                                         |
| NFR-06 | Cobertura de testes do domínio fiscal | Suítes `taxEngine`, `irpfTable`, `exceptionFlows`, `webInteraction` verdes em CI             |
| NFR-07 | Rastreabilidade de ações              | Toda mutação de entidade de negócio gera registro em `logs_atividade`                        |
| NFR-08 | Autorização verificável no servidor   | Teste de integração: usuário com `sem_acesso` recebe 403 na API, não só menu oculto          |
