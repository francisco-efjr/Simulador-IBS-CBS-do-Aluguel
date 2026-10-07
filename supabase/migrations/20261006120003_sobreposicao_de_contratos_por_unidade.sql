-- =============================================================================
-- 20261006120003 — Um contrato ativo por UNIDADE, não por imóvel (CAD-03)
-- =============================================================================
--
-- A restrição `contratos_um_ativo_por_imovel` (20260919120001, seção 8.1) proíbe
-- dois contratos ativos com vigência sobreposta no mesmo imóvel. Ela é anterior
-- à estrutura imóvel → unidades (20261005120002), que trouxe `contratos.unidade_id`
-- e a promessa do ADR-0010 de que um prédio tem "dezenas de inquilinos" sem
-- violar a integridade temporal. Na prática um edifício só conseguia alugar uma
-- sala por vez: a Sala 02 era recusada porque a Sala 01 já estava alugada
-- (QA, 06/10/2026, CAD-03).
--
-- Agora são duas restrições, que não se sobrepõem:
--   · contrato COM unidade: sem sobreposição dentro da mesma unidade;
--   · contrato SEM unidade (imóvel sem unidades cadastradas): sem sobreposição
--     dentro do imóvel — a regra de sempre, no mesmo nome de restrição
--     (`contratos_um_ativo_por_imovel`), que a tela já traduz.
--
-- O intervalo continua fechado nas duas pontas e sem data significa "aberto"
-- (RN-CTR-03), e só contrato `ativo` conta.
--
-- Os contratos que já existem não mudam de situação: a 20261005120002 ligou
-- todos à unidade "Principal" do imóvel, então a regra por unidade é, para
-- eles, a mesma de antes. Como a nova regra é mais folgada que a antiga, esta
-- migração não pode falhar por dado existente.
--
-- Lacuna conhecida (decisão do produto): contrato sem unidade num imóvel que
-- TEM unidades não é confrontado com os contratos das unidades. Fechar isso é
-- exigir `unidade_id` quando o imóvel tem unidades — regra de negócio nova.
--
-- Pode ser rodada de novo sem erro.

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

-- Sem unidade: por imóvel (mesmo nome de antes, agora só para esse caso).
alter table public.contratos drop constraint if exists contratos_um_ativo_por_imovel;

alter table public.contratos
  add constraint contratos_um_ativo_por_imovel
  exclude using gist (
    imovel with =,
    daterange(
      coalesce(data_inicio, '-infinity'::date),
      coalesce(data_fim, 'infinity'::date),
      '[]'
    ) with &&
  )
  where (status = 'ativo' and unidade_id is null);

-- Com unidade: por unidade.
alter table public.contratos drop constraint if exists contratos_um_ativo_por_unidade;

alter table public.contratos
  add constraint contratos_um_ativo_por_unidade
  exclude using gist (
    unidade_id with =,
    daterange(
      coalesce(data_inicio, '-infinity'::date),
      coalesce(data_fim, 'infinity'::date),
      '[]'
    ) with &&
  )
  where (status = 'ativo' and unidade_id is not null);
