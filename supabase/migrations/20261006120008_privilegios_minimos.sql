-- =============================================================================
-- 20261006120008 — Privilégios mínimos nas tabelas e nas funções (SEG-10)
-- =============================================================================
--
-- O Supabase concede, por privilégio padrão, TODOS os privilégios de tabela a
-- `anon` e `authenticated` em tudo que nasce em `public`. A 20260917120004 fechou
-- `anon` e deu a `authenticated` só select/insert/update/delete, mas o
-- privilégio padrão continuou concedendo o resto às tabelas criadas depois, e o
-- `grant ... on all tables` não retira nada. A QA (06/10/2026) achou
-- `authenticated` com TRUNCATE, REFERENCES e TRIGGER em 19 das 21 tabelas.
-- TRUNCATE não passa por RLS: bastaria uma conexão direta (ou uma função futura
-- com SQL dinâmico) para esvaziar `imoveis` — o teste conseguiu como usuário sem
-- permissão nenhuma. O PostgREST não emite TRUNCATE, então hoje é só
-- endurecimento; fecha-se agora, e fecha-se também a porta de tabela nova nascer
-- aberta.
--
--   1. Retira TRUNCATE, REFERENCES e TRIGGER de anon e authenticated nas tabelas
--      que existem.
--   2. Retira os mesmos três dos privilégios padrão de tabelas futuras em
--      `public` (para o dono que roda as migrações). Tabela nova continua
--      nascendo com select/insert/update/delete e quem fecha o resto é a RLS.
--   3. `anon` deixa de executar as quatro funções utilitárias puras
--      (cpf_valido, cnpj_valido, cpf_cnpj_valido, modulo_da_entidade) por /rpc.
--      São `security invoker`, inofensivas, mas só servem a quem grava;
--      `authenticated` continua executando (as CHECK de CPF/CNPJ rodam com o
--      privilégio de quem grava). A única função aberta ao visitante, de
--      propósito, é validar_convite().
--
-- Pode ser rodada de novo sem erro.

-- 1. Tabelas que existem ---------------------------------------------------------

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- 2. Tabelas futuras -----------------------------------------------------------

alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;

-- 3. Funções utilitárias ---------------------------------------------------------

revoke execute on function public.cpf_valido(text)                       from public, anon;
revoke execute on function public.cnpj_valido(text)                      from public, anon;
revoke execute on function public.cpf_cnpj_valido(text)                  from public, anon;
revoke execute on function public.modulo_da_entidade(public.entidade_anexo) from public, anon;

grant execute on function public.cpf_valido(text)                       to authenticated;
grant execute on function public.cnpj_valido(text)                      to authenticated;
grant execute on function public.cpf_cnpj_valido(text)                  to authenticated;
grant execute on function public.modulo_da_entidade(public.entidade_anexo) to authenticated;
