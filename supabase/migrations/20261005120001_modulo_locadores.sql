-- =============================================================================
-- Módulo de permissão "locadores"
--
-- Adiciona o valor 'locadores' ao tipo enum 'public.modulo_permissao'.
--
-- Arquivo à parte de propósito: o Postgres não deixa usar um valor novo de enum
-- na mesma transação em que ele foi criado, e a migração seguinte já cria as
-- políticas com 'locadores'. No SQL Editor, rode este arquivo antes do próximo.
--
-- Pode ser rodada de novo sem erro.
-- =============================================================================

alter type public.modulo_permissao add value if not exists 'locadores';
