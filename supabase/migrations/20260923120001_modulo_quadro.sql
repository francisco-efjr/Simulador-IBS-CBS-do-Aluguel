-- =============================================================================
-- Módulo de permissão "quadro" — Quadro de histórias
--
-- O quadro de histórias deixa de ser um arquivo estático da página pública e
-- passa a morar no banco, editável. Quem vê e quem edita segue o mesmo
-- esquema dos outros módulos: sem_acesso, visualizacao ou edicao, e o
-- administrador tem edição em tudo.
--
-- Arquivo à parte de propósito: o Postgres não deixa usar um valor novo de enum
-- na mesma transação em que ele foi criado, e a migração seguinte já cria as
-- políticas com 'quadro'. No SQL Editor, rode este arquivo antes do próximo.
--
-- Pode ser rodada de novo sem erro.
-- =============================================================================

alter type public.modulo_permissao add value if not exists 'quadro';
