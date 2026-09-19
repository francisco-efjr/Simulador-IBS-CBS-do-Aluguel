# Auditor — funções de aptidão

> Governança automática da arquitetura. Script: [`scripts/auditor.mjs`](../scripts/auditor.mjs).
> Resultado: `src/data/auditoria.json`, mostrado na seção **"Saúde do sistema"** da página pública `/`.

## O que é

Uma **função de aptidão** (*fitness function*, em Richards & Ford, *Fundamentos da Arquitetura de
Software*) é uma verificação **objetiva e automática** de uma característica que a arquitetura promete
manter. Em vez de a regra viver só num documento ("a tela não fala direto com o banco", "toda tabela
tem RLS"), ela vira código que roda sozinho e acusa quando é quebrada.

O auditor é o lugar onde essas funções moram. Ele roda em três momentos:

| Quando | Comando | Se houver falha |
| :--- | :--- | :--- |
| Na mão, durante o desenvolvimento | `pnpm auditor` | Mostra, mas sai com código 0 |
| Em todo PR e push para `main` (GitHub Actions, [`auditor.yml`](../.github/workflows/auditor.yml)) | `pnpm auditor --estrito` | **Reprova o job** |
| Em todo build, inclusive o da Vercel | `pnpm build` = `node scripts/auditor.mjs && vite build` | Publica mesmo assim, com a falha visível na página |

O build **nunca** usa `--estrito`: uma verificação quebrada não pode derrubar a publicação — quem barra
é o CI, antes do merge. O build existe para que **cada deploy publique a saúde verificada naquele
commit**: a página em produção mostra sempre o resultado da versão que está no ar.

Cada verificação devolve uma de três situações: `ok` (em ordem), `atencao` (não é defeito, mas pede
olhar, ou não deu para conferir neste ambiente) e `falha` (regra quebrada). Cada uma tem tempo limite;
a falha ou o travamento de uma não impede as outras.

## As funções de aptidão

| `id` | Nome na tela | O que garante | Situação |
| :--- | :--- | :--- | :--- |
| `tipos` | Código coerente | `pnpm typecheck` passa | erro de tipo → `falha` |
| `testes` | Testes automáticos | `pnpm test` passa; conta passados e falhos | teste falho → `falha`; nenhum teste → `atencao` |
| `lint` | Boas práticas de escrita | `oxlint` sem erro, e avisos não passam do teto (`TETO_DE_AVISOS_DO_LINT`) | erro → `falha`; avisos acima do teto → `atencao` |
| `camadas` | Acesso ao banco organizado | Nada em `src/pages/` ou `src/components/` importa `@/lib/dados/supabase` nem `@supabase/supabase-js`: o banco só é acessado por `src/services/` e `src/lib/dados/` | `falha` |
| `sem-modo-demonstracao` | Sem dados de demonstração | Nenhum resto do modo mock (`VITE_USE_MOCK`, `IS_MOCK_MODE`, `src/lib/mock`) — era o achado S-03 | `falha` |
| `rls` | Proteção de cada tabela | Toda `create table public.X` em `supabase/migrations/` tem `enable row level security` — literal ou no laço `foreach t in array[...]` de `…_rls.sql` | `falha` |
| `segredos` | Nenhuma senha exposta | Nenhum `.env` rastreado pelo git (fora `.env.example`), nenhuma chave `sb_secret_…`, nenhum JWT com `role: service_role`, nenhuma atribuição `service_role_key = …` | `falha` (sem git: `.env` na pasta → `atencao`) |
| `decisoes` | Decisões técnicas registradas | Todo ADR `docs/05-adr/NNNN-*.md` tem a linha `Status:` ou `Situação:` | `falha` |
| `feed-em-dia` | Lista de novidades em dia | O commit `feat`/`fix` mais recente do histórico não é de data posterior à entrada mais recente de `src/data/feed.json` (comparação por dia, no calendário de Brasília) | `atencao` |

**A catraca do lint.** O projeto herdou avisos de lint. Em vez de fingir que não existem ou de
reprovar tudo, o auditor aceita até `TETO_DE_AVISOS_DO_LINT` avisos (hoje, 90) e acusa se o número
subir. Quem corrigir avisos **baixa o teto no mesmo PR**; ninguém sobe o teto para acomodar aviso novo.

**Sem histórico.** A Vercel não entrega o `.git` completo ao build. Por isso o auditor não depende de
git para nada essencial: o commit vem de `VERCEL_GIT_COMMIT_SHA` quando existe, e o `feed-em-dia`
devolve `atencao` explicando que a conferência completa roda no CI (que baixa o histórico inteiro,
`fetch-depth: 0`). Também não precisa das variáveis do Supabase — nada no auditor fala com o banco.

## Regra de processo: toda entrega anuncia a si mesma

> **Todo PR que entrega ou corrige algo acrescenta uma entrada em `src/data/feed.json`, no mesmo PR.**

Formato de cada entrada (a lista fica da **mais recente para a mais antiga**):

```json
{
  "data": "2026-09-19",
  "titulo": "Frase curta, sem jargão",
  "texto": "Uma ou duas frases dizendo o que mudou para quem usa.",
  "tipo": "entrega",
  "referencia": "PR #3"
}
```

- `tipo`: `entrega` (aparece como "Novidade"), `correcao` ("Correção"), `seguranca` ("Segurança") ou
  `infra` ("Bastidores").
- `referencia` é opcional e não aparece na tela: serve para rastrear a origem.
- Escreva para o dono e a família, de 40 a 90 anos: nada de nome de biblioteca, sigla técnica ou
  caminho de arquivo.
- Se a entrega mudar o quadro, atualize também `src/data/andamento.json` (situação da entrega).
- A data "Quadro atualizado em" da página é **derivada** da entrada mais recente do feed — não há data
  fixa para lembrar de trocar.

O `feed-em-dia` é a função de aptidão desta regra: um `feat:` ou `fix:` sem novidade correspondente
acende `atencao`. Os testes em `src/data/__tests__/andamento.test.ts` conferem o formato dos três JSONs
(datas, tipos, ordem).

## Como acrescentar uma função de aptidão

1. Em `scripts/auditor.mjs`, acrescente um objeto à lista `VERIFICACOES`:

   ```js
   {
     id: 'identificador-estavel',          // não mude depois: é a chave na tela
     nome: 'Nome para leigo',              // aparece na página pública
     descricao: 'O que a regra garante, em uma frase.',
     tempoLimite: MINUTO,                  // opcional; padrão de 1 minuto
     executar() {
       // Síncrono ou async. Para rodar um comando: await rodar('pnpm', [...], { tempoLimite })
       // Para ler arquivos: listarArquivos('src/…') e lerTexto(caminho). Para git: git(...args)
       return { situacao: 'ok', detalhe: 'Frase para leigo com o resultado.' }
     },
   },
   ```

2. O `detalhe` vai para a tela pública: escreva o resultado em português simples ("Todos os 85 testes
   automáticos passaram", "2 tabelas estão sem a proteção por linha: …"). **Nunca** coloque valor de
   segredo no detalhe — só o caminho do arquivo.
3. Decida a severidade: `falha` só para regra que deve **bloquear o merge** (o CI reprova); `atencao`
   para o que merece olhar mas não impede.
4. Rode `pnpm auditor` e confira o resultado; teste também o caso de erro (quebre a regra de propósito
   numa cópia local).
5. Acrescente a linha na tabela acima e uma entrada no feed.

## Sobre o `src/data/auditoria.json`

O arquivo é **gerado** e está versionado apenas como valor inicial — a tela e o `typecheck` precisam
que ele exista num clone novo. **O build o regenera**: todo `pnpm build` (local ou na Vercel) roda o
auditor e reescreve o arquivo antes do `vite build`, e é essa versão, recém-gerada, que vai para
produção. Por isso:

- não edite o arquivo à mão;
- depois de um `pnpm build` ou `pnpm auditor` local ele aparece modificado no `git status`; tanto faz
  commitar ou descartar (`git checkout src/data/auditoria.json`) — produção não depende dele;
- o CI **não** faz commit automático do arquivo (a Vercel deste projeto não publica commits de autor
  fora da equipe).
