# ADR-0006 — Parsing de extrato migra para o servidor

- **Status:** Proposta
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
