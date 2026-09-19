# ADR-0006 — Parsing de extrato migra para o servidor

- **Status:** Proposta — gravação atômica implementada (ver atualização de 19/09/2026)
- **Data:** 2026-09-15

## Contexto

`src/lib/extratos-engine.ts` (705 linhas) roda **no navegador**: parseia OFX e os dialetos CSV de Itaú,
Bradesco, Nubank, Inter, Santander e Banco do Brasil, normaliza descrições, detecta duplicatas por
_fuzzy match_ e gera sugestões de classificação a partir do histórico. O cliente então grava
`importacoes` e N `transacoes_importadas` via SDK.

Vantagens reais do desenho atual: o extrato bancário nunca sobe para o servidor enquanto não é
classificado, o parsing é instantâneo e funciona no modo demonstração sem backend.

Problemas:

1. **A confiança está do lado errado.** Deduplicação e sugestão acontecem em código que o usuário pode
   modificar. Com as rules atuais ([ADR-0003](0003-rbac-servidor-e-tenancy.md)), um cliente adulterado
   grava `transacoes_importadas` arbitrárias, com `sugestao_confianca` inventada.
2. **Sem atomicidade.** Um lote de 400 transações é gravado registro a registro; falha de rede na metade
   deixa a importação inconsistente, com contadores errados.
3. **Regra de negócio não testável no servidor.** A deduplicação é regra contábil — é o que impede lançar
   o mesmo aluguel duas vezes — e vive fora do alcance de qualquer teste de API.
4. **O contrato já prevê o oposto.** `POST /importacoes` recebe o arquivo e devolve transações com
   sugestões prontas.
5. **Open Finance não cabe no cliente.** A evolução natural (§4 da Fase 1) é a coleta automatizada via
   Banco Central — que é, por construção, server-side.

## Decisão

**Migrar parsing, deduplicação e sugestão para o servidor, mantendo o motor como código compartilhado.**

1. O motor vira pacote `@app/statement-engine` (mesmo padrão do [ADR-0005](0005-nucleo-tributario-compartilhado.md)),
   consumido pelo servidor. É TypeScript puro — a portabilidade já existe.
2. `POST /importacoes` recebe `multipart/form-data`, valida **tipo por conteúdo** (não por extensão) e
   tamanho (≤ 20 MB), e processa: síncrono até 5 MB, `202` + processamento assíncrono acima disso.
3. **Uma transação de banco por arquivo** — respeitando a serialização de escrita do SQLite. Ou a
   importação inteira existe, ou nenhuma linha dela existe.
4. O cliente mantém o motor **apenas** para pré-visualização local no modo demonstração. Em produção, a
   verdade é a do servidor.
5. O arquivo enviado **não é retido** após o processamento: guarda-se `arquivo_nome` e um hash para
   deduplicação de lote, nunca o extrato bruto. Extrato bancário é dado sensível e reter cria obrigação
   de LGPD sem benefício.
6. A `sugestao_confianca` continua **consultiva**: nenhum lançamento nasce sem confirmação explícita no
   payload de `/transacoes/classificacao` (RN-IMP-02).

## Consequências

**Positivas** — deduplicação passa a ser garantia, não sugestão; importação atômica; regra contábil
testável em CI; caminho aberto para Open Finance; um lote grande não depende mais da aba do navegador
ficar aberta.

**Negativas** — o extrato passa a transitar pelo servidor, o que **aumenta** a superfície de dado
sensível: exige TLS obrigatório, limite de tamanho, validação de tipo por conteúdo, não retenção do
arquivo e ausência de qualquer linha do extrato nos logs. O modo demonstração passa a ter dois caminhos
de código (local e remoto) — divergência a vigiar. Arquivos grandes exigem fila e _polling_/realtime,
que é complexidade nova.

**Alternativa descartada** — manter no cliente e validar no servidor apenas o resultado. Validar
deduplicação sem o arquivo original é reimplementar o motor no servidor de todo modo, com o dobro do
custo e sem o benefício.

## Atualização de 19/09/2026

Com a troca do PocketBase pelo Supabase (sem servidor próprio), o passo de maior valor deste ADR foi
feito primeiro e de forma isolada: **a gravação atômica** (problema 2).

**O que foi feito.** A migração `supabase/migrations/20260919120002_importacao_atomica.sql` cria a função
`public.importar_extrato(p_importacao jsonb, p_transacoes jsonb) returns uuid`. O navegador continua
parseando o arquivo, mas envia o lote inteiro numa chamada (`importarExtrato` em
`src/services/importacoes.ts`); a função grava `importacoes` e todas as `transacoes_importadas` numa
única transação do Postgres. Ou o lote inteiro existe, ou nenhuma linha dele — inclusive a trilha de
auditoria. Detalhes:

- `security invoker`: a RLS continua valendo com a permissão de quem chama (`edicao` em
  `importar_extrato` para a importação e em `classificar_transacoes` para as transações), exatamente como
  quando o cliente inseria direto. Só `authenticated` executa.
- Data, contadores e status da importação nascem no banco; `classificada`, `ignorada` e os vínculos com
  receita/despesa não são aceitos do cliente — toda transação nasce pendente.
- Teto de 5.000 transações por chamada, com mensagem em português; linha incompleta é recusada antes de
  gravar, apontando a posição no lote.

**O que continua proposto.** Parsing, deduplicação e sugestão seguem no navegador, e com eles os
problemas 1, 3 e 5 acima. Em particular, a **detecção de duplicata não foi para a função**: ela é um
_fuzzy match_ (`calculateSimilarity` ≥ 0,65 sobre texto normalizado) que roda na pré-visualização,
*antes* de a pessoa decidir se inclui ou ignora cada duplicata. Levá-la para o banco exigiria ou
reescrever o algoritmo em PL/pgSQL — duas implementações que divergem — ou decidir a duplicata depois
da gravação, mudando a experiência. A função grava as marcas de duplicata e as sugestões que o
navegador calculou, como consultivas que são. O desenho descrito na Decisão (motor compartilhado no
servidor — no Supabase, o lugar natural seria uma Edge Function —, validação por conteúdo, não retenção
do arquivo) continua sendo o alvo; quando vier, ele pode reaproveitar `importar_extrato` como etapa de
gravação.
