# Supabase local

Um "Supabase" que roda na sua máquina para exercitar as telas logadas sem tocar em produção. É um
servidor Node (`servidor.ts`, só `node:http`) que fala o pedaço do protocolo Supabase que a aplicação
usa, sobre o PGlite do harness dos testes de banco: as **migrações são as reais** e a **RLS vale**,
porque cada requisição roda numa transação sob `set local role anon|authenticated` com os claims do JWT.

## Como subir

```sh
pnpm supabase:local   # http://localhost:54321 (PORT muda a porta); pronto em ~1 s
pnpm dev:local        # o app em http://localhost:8083, apontado para o servidor acima
pnpm smoke:local      # verificação ponta a ponta com o supabase-js (servidor no ar)
```

`dev:local` passa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na própria linha de comando. Não
existe `.env.local`, então o `pnpm dev` normal continua apontando para o `.env` de produção. A chave
anônima local é fixa (role `anon`, assinada com um segredo que só vale aqui) e também sai no log de
boot do servidor.

## Contas de teste

Todas fictícias; só existem neste banco, que vive na memória. As **senhas** são geradas no boot,
sempre iguais, e ficam em `supabase/local/.contas-locais.json` (fora do git):

| E-mail                 | Papel                                                                 |
| :--------------------- | :-------------------------------------------------------------------- |
| `admin@teste.local`    | administrador (vê tudo, inclusive `/usuarios` e `/logs-atividade`)    |
| `gratuito@teste.local` | perfil gratuito: edita Imóveis, Inquilinos, Locadores e fiadores e Contratos; o resto fica fechado |
| `inativo@teste.local`  | `ativo = false`: entra no Auth, mas o perfil inativo derruba a sessão |

Também há um convite pendente para `convidado@teste.local` (token `convite-local-0001`): cadastrar
esse e-mail em `/signup` com `?token=convite-local-0001` aceita o convite pelo gatilho. O token é
obrigatório: cadastro sem ele (ou com o token de outro e-mail) nasce gratuito e inativo, e um
administrador libera em `/usuarios` (migração `20261006120002`).

A semente (`semente.ts`) traz 3 locadores, 2 fiadores, 4 inquilinos (um PJ com CNPJ alfanumérico),
3 imóveis (o Edifício Aguiar Centro com 3 unidades), 2 contratos ativos e 1 encerrado, 1 conta
bancária, 7 receitas e 7 despesas de agosto a novembro (pagas, parciais, em atraso e previstas),
2 IPTU (um vencido), 2 fornecedores e 1 importação com 3 transações a classificar. As datas são
relativas a hoje. Categorias financeiras e o quadro de histórias vêm das migrações.

## Apoio para testes

- `POST /__reset` (só de localhost) recria o banco, aplica a semente de novo e esvazia o storage e a
  caixa de e-mails: ~1 s. As sessões antigas deixam de valer (os usuários ganham novos ids); entre de novo.
- `GET /__saude` responde 200.
- `GET /__emails` (só de localhost) lista os e-mails de recuperação de senha que "foram enviados",
  com o link pronto para colar no navegador (`/redefinir-senha#access_token=…&type=recovery`).

## O que o servidor faz

- **Auth** (`/auth/v1`): `token` (senha e refresh), `user` (GET/PUT), `logout`, `signup` (já
  confirmado, devolve sessão), `recover`, `settings`. JWT HS256; senhas com scrypt em
  `auth.users.encrypted_password`. Erros no formato do GoTrue (`Invalid login credentials`, 400).
- **REST** (`/rest/v1/:tabela`): `select` com colunas, `*` e embeds até qualquer profundidade
  (`apelido:tabela!fk(*)`, `tabela(*)`, um-para-muitos; a chave estrangeira é resolvida no catálogo);
  filtros `eq neq gt gte lt lte like ilike in is cs cd ov` com `not.`, `or=(…)`/`and=(…)`, `order`
  múltiplo, `limit`/`offset`/`Range`, `Prefer: count=exact` com `Content-Range`, `.single()`
  (406 `PGRST116`); `POST` (objeto ou lista, upsert com `resolution` e `on_conflict`), `PATCH` e
  `DELETE` com `return=representation`. PATCH/DELETE sem filtro são recusados, como no Supabase
  hospedado. Erros do Postgres viram os status do PostgREST (`42501` 401/403, `23505`/`23503` 409,
  `42P01` 404, o resto 400). Valores sempre como parâmetros; identificadores validados e entre aspas.
- **RPC** (`/rest/v1/rpc/:fn`): consulta `pg_proc` e responde como o PostgREST (escalar, objeto,
  lista ou 204 para `void`).
- **Storage** (`/storage/v1`): upload (`POST`/`PUT`, multipart ou corpo cru), link assinado
  (`POST /object/sign/…` e o `GET` do link), `DELETE` por `prefixes`. Buckets são os das migrações.

## Limitações

- **Tempo real não existe.** O WebSocket de `/realtime/v1/websocket` é recusado (501) e o cliente
  tenta de novo em segundo plano: erros de WebSocket no console são esperados. As telas só se
  atualizam ao recarregar.
- **Storage sem RLS e em memória.** Os arquivos somem ao reiniciar ou no `/__reset`; qualquer pessoa
  logada sobe, assina e apaga em qualquer bucket (anon é recusado). Limite de tamanho e tipos de
  arquivo dos buckets não são aplicados.
- **E-mail não é enviado** (recuperação, convite): o link da recuperação fica em `/__emails`.
- **Logout não revoga o token**: os tokens são sem estado e valem até expirar (1 hora o de acesso).
- **Só o schema `public`**; sem `Accept-Profile`, sem filtros dentro de embeds (`embed.col=…`), sem
  `Prefer: tx=rollback` nem agregações. O que a aplicação não usa não foi implementado.
- O limite de 3 imóveis por pessoa (erro `HA003`) vale como no banco real: cada conta que não é
  administradora pode criar até 3.
