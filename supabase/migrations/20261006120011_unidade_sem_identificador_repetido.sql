-- =============================================================================
-- 20261006120011 — Uma unidade por identificador dentro do mesmo imóvel (REG-03)
-- =============================================================================
--
-- O cadastro aceitava duas "Sala 101" no mesmo prédio: nada no banco impedia.
-- Com dois registros iguais, o contrato pode cair na unidade errada e a
-- ocupação conta a mesma sala duas vezes. Achado da regressão da QA em
-- 07/10/2026.
--
-- O índice compara o identificador sem diferença de maiúsculas nem de espaços
-- nas pontas ("Sala 101", "sala 101 " e "SALA 101" são a mesma unidade). O
-- mesmo identificador continua valendo em imóveis diferentes. A tela traduz a
-- recusa em src/lib/dados/erros.ts ("Já existe uma unidade com este
-- identificador neste imóvel.").
--
-- Se já houver repetidas, a migração para com a lista em vez de criar um índice
-- pela metade. Para achá-las antes:
--   select imovel_id, lower(btrim(identificador)), count(*)
--     from public.imovel_unidades group by 1, 2 having count(*) > 1;
--
-- Pode ser rodada de novo sem erro.

do $$
declare
  repetidas text;
begin
  select string_agg(format('%s (%s×)', identificador, quantidade), ', ')
    into repetidas
    from (
      select min(identificador) as identificador, count(*) as quantidade
        from public.imovel_unidades
       group by imovel_id, lower(btrim(identificador))
      having count(*) > 1
    ) r;

  if repetidas is not null then
    raise exception 'Há unidades com o mesmo identificador no mesmo imóvel: %. Renomeie antes de aplicar esta migração.', repetidas;
  end if;
end
$$;

create unique index if not exists imovel_unidades_identificador_uidx
  on public.imovel_unidades (imovel_id, lower(btrim(identificador)));
