# Requisitos de Segurança — Auditoria e Plano de Correção

Auditoria do estado real do repositório em **2026-09-15**, organizada pelos quatro eixos da diretriz:
autenticação/autorização, comunicação externa, validação de entrada, e logs/auditoria.

Cada achado tem severidade, evidência no código e correção. Nada aqui é hipotético — todos foram
verificados no código, nas migrações ou nas regras ativas em `pb_data`.

---

> **Situação em 17/09/2026.** A troca do PocketBase pelo Supabase fechou os quatro achados
> críticos e altos de autenticação e autorização — **S-01** (o token de recuperação não existe
> mais: quem cuida da senha é o Supabase Auth), **S-02** (as permissões viraram tabela e são
> avaliadas por RLS em toda consulta), **S-03** (sem as variáveis de ambiente a aplicação não
> sobe, em vez de subir em modo demonstração) e **S-05** (todo bucket é privado, com link
> assinado de validade curta). Também caiu o *fail-open* do **S-04**: sem permissão registrada,
> o nível é `sem_acesso`, no banco e na tela. Seguem abertos **S-06** (validação de formato na
> borda), **S-09** (tenancy) e **S-11** (mascaramento de dado bancário). O texto abaixo é o
> laudo original; os trechos de código citados descrevem o backend anterior, hoje em
> `pocketbase/` apenas como referência. A modelagem equivalente no Postgres está em
> [`supabase/README.md`](../supabase/README.md).

## Resumo

| #    | Achado                                                                  | Severidade     | Eixo        |
| :--- | :---------------------------------------------------------------------- | :------------- | :---------- |
| S-01 | Token de redefinição de senha devolvido no corpo da resposta HTTP       | 🔴 **Crítica** | AuthN       |
| S-02 | RBAC avaliado apenas no cliente; regras de API planas                   | 🔴 **Crítica** | AuthZ       |
| S-03 | Modo de demonstração é o padrão de build — qualquer credencial entra    | 🔴 **Crítica** | AuthN       |
| S-04 | Autorização _fail-open_ quando a lista de permissões está vazia         | 🟠 Alta        | AuthZ       |
| S-05 | Arquivos anexos não são protegidos — acessíveis sem autenticação        | 🟠 Alta        | AuthZ       |
| S-06 | Nenhuma validação de schema na borda (Zod está instalado e não é usado) | 🟠 Alta        | Entrada     |
| S-07 | Respostas `500` ecoam a exceção interna ao cliente                      | 🟡 Média       | Entrada     |
| S-08 | Filtro construído por concatenação de string com escape manual          | 🟡 Média       | Entrada     |
| S-09 | Sem tenancy: nenhum campo de organização em coleção alguma              | 🟡 Média       | AuthZ       |
| S-10 | Remetente de e-mail em domínio inexistente (`.internal`)                | 🟡 Média       | Comunicação |
| S-11 | Dados pessoais e bancários sem política de mascaramento documentada     | 🟡 Média       | Comunicação |
| S-12 | Sem rotação de refresh token; sessão em `localStorage`                  | 🟡 Média       | AuthN       |
| S-13 | `logs_atividade.detalhes` é prosa livre, sem contrato de conteúdo       | 🟢 Baixa       | Auditoria   |

**Bem resolvido e que deve ser preservado:** geração de tokens com CSPRNG (`$security.randomString`),
expiração de 1 h e uso único no reset, invalidação dos tokens pendentes anteriores, índice único em
`convites.token` e `password_resets.token`, `password_resets` inacessível pela API (só hooks),
`convites` restrito a `perfil = 'administrador'` (verificado **no servidor**), `users` com atualização
restrita ao próprio registro ou a administrador, `ativo = false` derrubando a sessão no refresh, e
trilha de auditoria por hooks que o cliente não consegue burlar.

---

## 1. Autenticação e Autorização

### S-01 🔴 Token de redefinição de senha devolvido na resposta — _account takeover_

`pocketbase/hooks/auth_solicitar_recuperacao.js:148-152`:

```js
return e.json(200, {
  success: true,
  message: 'Se o e-mail estiver cadastrado, as instruções foram enviadas.',
  token: token, // Retornado também para facilitar testes locais/ambientes de preview
})
```

O endpoint é **público** — precisa ser, para recuperação de senha funcionar. Qualquer pessoa envia o
e-mail de um usuário e **recebe de volta o token válido**, sem acesso à caixa postal. Com o token,
`POST` em `auth_redefinir_senha` troca a senha. Isso vale para qualquer conta, **inclusive
administrador** — e administrador tem acesso total ao sistema.

O comentário mostra a intenção (conveniência em preview), mas não há guarda de ambiente: o `return` é
incondicional. A mensagem genérica "se o e-mail estiver cadastrado", que existe para evitar enumeração de
usuários, é anulada no mesmo objeto — token presente significa conta existente.

**Correção (imediata, bloqueia produção):** remover `token` da resposta. Se for necessário em
desenvolvimento, condicionar a uma variável de ambiente do servidor explícita
(`ALLOW_TOKEN_IN_RESPONSE=true`), nunca ao padrão. Aplicar o mesmo raciocínio a
`convite_enviar.js:154`, que também devolve o token — ali o risco é menor (exige sessão de
administrador), mas o token de convite não precisa trafegar de volta.

**Ação complementar:** como a brecha pode ter sido explorada, invalidar todos os registros pendentes em
`password_resets` ao corrigir.

### S-02 🔴 RBAC apenas no cliente; regras de API planas

Regras ativas, lidas de `pb_data/data.db` — as cinco (list/view/create/update/delete) de **todas** as
coleções de negócio são idênticas:

```
@request.auth.id != ''
```

Coleções afetadas: `imoveis`, `inquilinos`, `fornecedores`, `categorias_financeiras`, `contratos`,
`receitas`, `despesas`, `iptu_taxas`, `documentos_anexos`, `contas_bancarias`, `importacoes`,
`transacoes_importadas`.

Enquanto isso, `src/hooks/use-auth.tsx` e `src/components/ProtectedRoute.tsx` implementam 12 módulos × 3
níveis. Esse controle desenha o menu e bloqueia rotas — e **nada mais**. Qualquer usuário autenticado
lê, cria, altera e apaga qualquer registro chamando `/api/collections/{coleção}/records` diretamente,
independentemente das permissões que o administrador configurou.

A prática vigente do PocketBase é explícita: expor a instância é aceitável **desde que** as API rules
estejam configuradas por coleção — elas são simultaneamente controle de acesso e filtro de query
([discussão #3542](https://github.com/pocketbase/pocketbase/discussions/3542)).

**Correção:** [ADR-0003](05-adr/0003-rbac-servidor-e-tenancy.md) — normalizar `permissoes` em coleção
consultável, aplicar rules por módulo e nível, e cobrir com teste de integração que afirme `403` **na
API** (NFR-08). A causa-raiz é de modelagem: `users.permissoes` é `json`, e rule não inspeciona `json`
de forma confiável.

### S-03 🔴 Modo de demonstração é o padrão

`src/lib/pocketbase/client.ts`:

```ts
export const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK !== 'false'
```

Sem a variável, o mock está **ligado**, e nesse modo — como o README declara — qualquer e-mail e senha
fazem login. Um build de produção que esqueça `VITE_USE_MOCK=false` publica uma interface administrativa
sem autenticação, visualmente idêntica à real. Falha silenciosa: nada avisa.

**Correção:** [ADR-0002](05-adr/0002-modo-mock-opt-in.md) — inverter o padrão, falhar o build de produção
com mock ligado, exigir `VITE_POCKETBASE_URL` quando desligado, e marcar o modo demonstração em runtime.

### S-04 🟠 Autorização _fail-open_

`src/hooks/use-auth.tsx:47-50`:

```ts
// Backward compatibility: If no permissions array or empty array, user sees all with full edit
if (!permissoes || !Array.isArray(permissoes) || permissoes.length === 0) {
  return 'edicao'
}
```

Ausência de configuração concede o nível **máximo**. Usuário recém-criado, ou com `permissoes` perdida em
migração, nasce com acesso de edição a todos os módulos. Autorização deve falhar fechada.

**Correção:** default `'sem_acesso'`; migrar os usuários existentes atribuindo permissões explícitas
(migração de dados, não default permissivo); `PUT /usuarios/{id}/permissoes` grava `sem_acesso` para
módulo ausente do payload.

### S-05 🟠 Anexos acessíveis sem autenticação

Verificado nas definições de campo em `pb_data`:

| Coleção             | Campo         | `protected` |
| :------------------ | :------------ | :---------: |
| `contratos`         | `documento`   |   `false`   |
| `iptu_taxas`        | `comprovante` |   `false`   |
| `documentos_anexos` | `arquivo`     |   `false`   |

Com `protected = false`, o arquivo é servido em
`/api/files/{coleção}/{recordId}/{arquivo}` **sem exigir token de autenticação**. A única barreira é
conhecer a URL — que contém um id de 15 caracteres aleatórios. É segurança por obscuridade, e URLs
vazam: histórico de navegador, log de proxy, encaminhamento de link, referer.

O conteúdo em risco é exatamente o sensível: contratos de locação assinados, comprovantes de pagamento e
documentos pessoais anexados.

**Correção:** marcar os três campos como `protected: true` por migração e passar a gerar _file token_
para exibição autenticada. `imoveis.fotos` pode permanecer desprotegido se houver vitrine pública — mas
isso deve ser decisão declarada, não default.

### S-09 🟡 Sem tenancy

Nenhuma coleção tem campo de organização ou proprietário; `created_by` registra autoria, não escopo.
Coerente com um produto single-org — mas isso nunca foi declarado, e um segundo cliente na mesma
instância veria a carteira do primeiro.

**Correção:** declarar single-org no README e no contrato de API; **cada cliente é uma instância** até
que exista `organizacao` em todas as coleções de negócio, conforme
[ADR-0003](05-adr/0003-rbac-servidor-e-tenancy.md) §4.

### S-12 🟡 Sessão sem rotação, em `localStorage`

O SDK do PocketBase persiste o token em `localStorage`, legível por qualquer script na página: um XSS
vira sessão persistente roubada. Não há rotação de refresh token nem noção de família — roubo de token
não é detectável nem revogável granularmente.

A prática vigente (RFC 9700, jan/2025; OAuth 2.1) exige rotação para clientes públicos, com revogação da
família inteira ao detectar reuso, e armazenamento em Keychain/Keystore no mobile.

**Correção:** [ADR-0004](05-adr/0004-tokens-e-sessao.md).

---

## 2. Comunicação Externa e Segredos

**O que já está correto.** O único segredo do projeto hoje é `VITE_POCKETBASE_URL` — uma URL, não uma
credencial. `.env` está no `.gitignore`. Nenhuma chave de API aparece _hardcoded_ no código. Nada a
corrigir aqui, e há uma regra a preservar:

> **Tudo com prefixo `VITE_` entra no bundle público.** Nenhuma credencial de provedor pode usar esse
> prefixo. Isso torna toda integração que exija chave — boleto, WhatsApp, assinatura, crédito, Open
> Finance — **server-side por definição** ([ADR-0007](05-adr/0007-integracoes-externas.md) §6).

### S-10 🟡 Remetente de e-mail em domínio inexistente

`auth_solicitar_recuperacao.js` e `convite_enviar.js` enviam de
`no-reply@holdingaguiar.internal`. O TLD `.internal` não é roteável na internet pública: a mensagem será
rejeitada ou classificada como _spam_ por falha de SPF/DKIM/DMARC. Como recuperação de senha e convite
dependem de entrega, a falha silenciosa é funcional **e** de segurança — usuários bloqueados recorrem a
caminhos alternativos (pedir a senha a outra pessoa, reutilizar credencial).

A pesquisa de práticas confirma que o transporte de e-mail default do PocketBase (sendmail) é inadequado
em produção, e que SMTP é **pré-requisito** para os fluxos de OTP e recuperação de senha
([Production Security Configuration](https://deepwiki.com/pocketbase/site/6.3-production-security-configuration)).

**Correção:** configurar SMTP transacional com domínio real e registros SPF/DKIM/DMARC; usar remetente
verificado; tratar falha de envio como erro observável, não como `warn` engolido — hoje
`catch (mailErr)` apenas registra e a resposta segue `200`.

### S-11 🟡 Dados pessoais e bancários sem política de mascaramento

A base armazena, em texto claro: CPF, CNPJ, RG, data de nascimento, endereço completo, telefone e e-mail
(`inquilinos`, `fornecedores`); agência e conta (`contas_bancarias`); e o conteúdo de extratos bancários
(`transacoes_importadas`). Isso é dado pessoal sob LGPD — e os concorrentes tratam o tema como
argumento de venda ("dados tratados conforme a LGPD", no GeraContratos).

Não há política documentada de mascaramento em interface, relatório ou log, nem definição de retenção.

**Correção:** (a) mascarar CPF/CNPJ e conta bancária na UI e nos relatórios exportados, exibindo o valor
completo apenas sob ação explícita; (b) proibir dado pessoal em log — ver S-13; (c) definir retenção e
descarte dos extratos importados; (d) não retiner o arquivo de extrato após o processamento
([ADR-0006](05-adr/0006-parsing-extrato-no-servidor.md) §5). Cifra em repouso no nível de campo fica
para avaliação posterior — o ganho depende de onde a instância roda.

**CSRF e CORS.** Hoje a autenticação é por token em header `Authorization`, o que torna o risco de CSRF
baixo. Isso **muda** com o [ADR-0004](05-adr/0004-tokens-e-sessao.md): ao mover o refresh para cookie,
tornam-se obrigatórios `SameSite=Strict`, `Path=/auth` e CORS restrito à origem do frontend — nunca
`*` com credenciais.

---

## 3. Validação de Entrada

### S-06 🟠 Nenhuma validação de schema na borda

`zod` (^4.4.3) e `@hookform/resolvers` (^5.4.0) estão no `package.json`. **Nenhum arquivo em `src/` os
importa** — zero ocorrências de `from 'zod'` e de `zodResolver`. Os formulários usam React Hook Form sem
resolver de schema, e os hooks do servidor leem `e.requestInfo().body` com verificações pontuais
(`auth_redefinir_senha.js` confere token presente, senha ≥ 8 caracteres e confirmação — o mais completo
do conjunto).

Consequência: campos como CPF, CNPJ e CEP não têm validação de dígito verificador ou formato garantida em
nenhuma camada; valores monetários chegam como `number` sem faixa; datas não são comparadas entre si
(`data_fim` anterior a `data_inicio` é aceito).

**Correção:** um schema Zod por entidade, **compartilhado** entre formulário (via `zodResolver`) e borda
do servidor — mesma regra, uma definição. O contrato OpenAPI já declara as restrições
(`pattern` de CPF/CNPJ/CEP, `minimum`/`maximum`, `maxLength`), então os schemas podem ser derivados dele.
Validação no servidor é a que conta: a do cliente é conveniência de UX.

### S-07 🟡 `500` ecoa a exceção interna

Padrão repetido nos hooks:

```js
return e.json(500, { message: 'Erro ao redefinir senha: ' + String(err) })
```

`String(err)` pode carregar nome de coleção, campo, constraint violada ou trecho de expressão de filtro —
informação útil para quem estiver mapeando a aplicação.

**Correção:** responder `Problem` (RFC 9457) com mensagem genérica e `requestId`; registrar o detalhe
técnico apenas no log do servidor, correlacionado por esse id. O contrato já define `Problem` com
`detail` descrito como "mensagem segura para exibição".

### S-08 🟡 Filtro por concatenação com escape manual

`auth_redefinir_senha.js:23`:

```js
"token = '" + token.replace(/'/g, "''") + "'"
```

O escape de apóstrofo está correto e mitiga o caso óbvio, mas construir expressão de filtro por
concatenação é o padrão errado: qualquer manutenção que esqueça o `replace`, ou qualquer campo novo
concatenado sem ele, reabre a brecha. O PocketBase oferece parâmetros nomeados — é para isso que existem.

**Correção:** usar `dbx` com parâmetro ligado (`{:token}`) em todos os hooks que montam filtro, e proibir
concatenação por regra de revisão.

---

## 4. Logs e Auditoria

**O que já funciona bem.** Cinco hooks (`audit_imoveis`, `audit_contratos`, `audit_financeiro`,
`audit_inquilinos_fornecedores`, `audit_extratos_convites`) gravam em `logs_atividade` nos eventos
`onRecordAfterCreateSuccess` / `Update` / `Delete`. Por rodarem no servidor, **o cliente não consegue
burlar nem forjar** a trilha — é o desenho correto. Falha de auditoria é capturada e registrada como
`warn` sem abortar a operação de negócio (decisão defensável: não perder o dado por causa do log).
`logs_atividade` não tem endpoint de escrita e a leitura é restrita a administrador.

### S-13 🟢 `detalhes` é prosa livre, sem contrato de conteúdo

```js
const detalhes = 'Cadastrou o imóvel "' + nome + '"' + (codigo ? ' (Cód: ' + codigo + ')' : '')
```

Hoje o conteúdo é inofensivo (nome e código de imóvel). Mas nada impede que uma mudança futura concatene
CPF, valor de conta bancária ou linha de extrato — e log é justamente o lugar onde dado sensível persiste
fora de qualquer controle de acesso de negócio.

**Correção:** adicionar `payload` (json) estruturado com **ids**, nunca valores pessoais, mantendo
`detalhes` como rótulo legível; documentar a regra "log registra _quem_, _o quê_ e _quando_, jamais o
conteúdo sensível"; revisar os cinco hooks contra essa regra.

**Lacunas de observabilidade a cobrir:**

- **`X-Request-Id` em toda resposta**, correlacionando log de aplicação, trilha de auditoria e erro do
  cliente. Já previsto no contrato; não implementado.
- **Registro de tentativa de autenticação falha** — hoje não há. Sem isso não se detecta força bruta.
- **Rate limiting** no login, na recuperação de senha e na simulação pública, com `429` + `Retry-After`.
  A prática vigente trata _rate limiting_ como item de produção, não opcional.
- **Log de decisão de autorização negada** (`403`), para distinguir configuração errada de tentativa de
  acesso indevido.

---

## 5. Ordem de execução

**Bloqueia qualquer publicação com dados reais:**

1. **S-01** — remover o token da resposta de recuperação de senha e invalidar os resets pendentes.
   Correção de minutos; impacto: _account takeover_ de administrador.
2. **S-03** — inverter o padrão do modo mock e falhar o build ([ADR-0002](05-adr/0002-modo-mock-opt-in.md)).
3. **S-02 + S-04** — RBAC no servidor, _fail-closed_, com teste de `403` na API
   ([ADR-0003](05-adr/0003-rbac-servidor-e-tenancy.md)).
4. **S-05** — proteger os campos de arquivo.

**Antes de operar com usuários externos:**

5. **S-10** — SMTP com domínio real e DMARC; falha de envio observável.
6. **S-06** — schemas Zod compartilhados entre cliente e servidor.
7. **S-12** — rotação de refresh token ([ADR-0004](05-adr/0004-tokens-e-sessao.md)).
8. **S-07, S-08** — `Problem` sem vazamento e filtros parametrizados.
9. Rate limiting e log de autenticação falha.

**Antes do primeiro cliente externo na mesma instância:**

10. **S-09** — tenancy explícita, ou uma instância por cliente.
11. **S-11** — mascaramento, retenção e descarte de dado pessoal.
12. **S-13** — contrato de conteúdo de log.

---

## Fontes de prática consultadas

[Securing PocketBase in production (#3542)](https://github.com/pocketbase/pocketbase/discussions/3542) ·
[Production Security Configuration](https://deepwiki.com/pocketbase/site/6.3-production-security-configuration) ·
[Multi-tenancy com API rules (#97)](https://github.com/pocketbase/pocketbase/discussions/97) ·
[OAuth 2.0 Security Best Practices — PKCE e state](https://www.authgear.com/post/oauth2-security-best-practices-pkce-state/) ·
[Refresh tokens — uso seguro](https://www.obsidiansecurity.com/blog/what-are-refresh-tokens-secure-usage) ·
[Mobile App Authentication Best Practices (2026)](https://www.securecodinghub.com/blog/mobile-app-authentication-best-practices-ios-android)
