# ADR-0004 — Sessão com rotação de refresh token e armazenamento seguro

- **Status:** Proposta
- **Data:** 2026-09-15

## Contexto

A sessão hoje é a do PocketBase: `pb.collection('users').authRefresh()` no _mount_ do `AuthProvider`,
com o token persistido pelo SDK em `localStorage`. `users.ativo === false` derruba a sessão no refresh —
bom. Mas não há rotação de refresh token, não há noção de família de tokens, e `localStorage` é legível
por qualquer script na página (qualquer XSS vira roubo de sessão persistente).

A pesquisa de práticas vigentes ([00-pesquisa-e-benchmark §2.2](../00-pesquisa-e-benchmark.md)) é
inequívoca: a **RFC 9700** (BCP de segurança OAuth 2.0, jan/2025) tornou PKCE obrigatório em todos os
fluxos e a rotação de refresh token prática padrão; **OAuth 2.1** exige rotação para clientes públicos —
categoria que inclui tanto SPA quanto app mobile. Para mobile, o consenso é armazenamento no Keychain
(iOS, `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`) ou Keystore (Android, com respaldo em hardware),
nunca `AsyncStorage`.

Isso importa agora, não depois: a diretriz prevê um app mobile, e um app mobile escrito contra a sessão
atual nasceria com token de longa duração em armazenamento inseguro.

## Decisão

**1. Dois tokens, papéis separados.** Access token de **15 minutos** em `Authorization: Bearer`.
Refresh token de vida longa, que **nunca** trafega nesse header.

**2. Rotação com detecção de reuso.** Cada `POST /auth/refresh` emite um novo refresh e invalida o
anterior, dentro de uma **família**. Reuso de um refresh já invalidado → revoga a família inteira e
responde `401`. O fluxo está no diagrama [2.1 da Fase 4](../04-uml.md).

**3. Armazenamento por plataforma.**

- **Web:** refresh em cookie `HttpOnly; Secure; SameSite=Strict; Path=/auth`. Access token **em memória**
  (não em `localStorage`), reconstruído por `/auth/refresh` no carregamento.
- **Mobile:** refresh no Keychain/Keystore, com as flags de acesso acima. Nunca em `AsyncStorage`.

**4. PKCE quando houver provedor externo.** Login social ou SSO corporativo entra por **OAuth 2.1 com
PKCE obrigatório** (`code_challenge_method=S256`), sem exceção para o fluxo mobile.

**5. Revogação explícita.** `POST /auth/logout` revoga a família. Trocar senha revoga **todas** as
famílias do usuário. `users.ativo = false` revoga tudo imediatamente — não espera o próximo refresh.

**6. Rate limit no login**, por IP e por conta, com `429` + `Retry-After`. Resposta uniforme para conta
inexistente e senha errada, para não permitir enumeração.

**Fora de escopo por ora:** passkeys/WebAuthn e _device attestation_ (App Attest / Play Integrity).
Ambos recomendados pela pesquisa; entram quando o mobile existir de fato, em ADR própria.

## Consequências

**Positivas** — XSS deixa de render sessão persistente na web; roubo de refresh é detectável e contido a
uma família; o mobile nasce alinhado a RFC 9700/OAuth 2.1; revogação passa a ser imediata e auditável.

**Negativas** — exige _token store_ com estado (famílias), que o PocketBase não oferece pronto: é coleção
nova mais hooks. Access token em memória significa um `/auth/refresh` a cada carregamento de página
(latência pequena, porém real). Cookie `SameSite=Strict` no caminho `/auth` exige que web e API
compartilhem domínio, ou configuração de CORS com credenciais — restrição de infraestrutura a validar
antes de implementar.

**Alternativa descartada** — manter `authRefresh` do PocketBase e apenas reduzir a validade do token.
Reduz a janela, mas não detecta roubo nem permite revogação granular, e não serve ao mobile.
