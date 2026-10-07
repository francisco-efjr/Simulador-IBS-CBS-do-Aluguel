-- =============================================================================
-- 20261006120009 — Receita e despesa só aceitam categoria, contrato e inquilino coerentes (FIN-14)
-- =============================================================================
--
-- As chaves estrangeiras de `receitas` e `despesas` garantem que a categoria, o
-- contrato e o inquilino EXISTEM, não que combinam. Pela API (a QA usou um
-- administrador, 06/10/2026) o banco aceitava:
--   · receita com categoria do tipo `despesa` (e despesa com categoria `receita`);
--   · receita de um imóvel apontando para o contrato de OUTRO imóvel;
--   · receita com inquilino diferente do inquilino do contrato.
-- A tela filtra os seletores, mas a regra estava só nela (e trocar o imóvel
-- depois de escolher o contrato mantém o contrato).
--
-- Gatilhos BEFORE, com código próprio (classe "HA" da Holding Aguiar) e mensagem
-- pronta em português, repassada pela tela (src/lib/dados/erros.ts):
--   HA007  categoria de tipo errado           (receitas e despesas)
--   HA008  contrato de outro imóvel           (receitas)
--   HA009  inquilino diferente do contrato    (receitas)
--
-- security definer porque quem lança receita pode não ter permissão de ver
-- `contratos`: pela RLS a consulta voltaria vazia e a regra seria contornada (ou
-- todo lançamento seria recusado). Só confere a existência da combinação e não
-- devolve dado nenhum além da mensagem.
--
-- Num UPDATE só se confere o que MUDOU: linha antiga já incoerente (anterior a
-- esta migração) continua editável — por exemplo, para marcar como recebida —
-- até que alguém corrija o vínculo. Para achar o que já está gravado:
--   select r.id from public.receitas r join public.categorias_financeiras c on c.id = r.categoria
--    where c.tipo <> 'receita';
--   select r.id from public.receitas r join public.contratos k on k.id = r.contrato
--    where k.imovel <> r.imovel or (r.inquilino is not null and k.inquilino <> r.inquilino);
--   select d.id from public.despesas d join public.categorias_financeiras c on c.id = d.categoria
--    where c.tipo <> 'despesa';
--
-- Pode ser rodada de novo sem erro.

-- 1. Receitas --------------------------------------------------------------------

create or replace function public.tg_validar_receita()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tipo     public.categoria_tipo;
  v_imovel   uuid;
  v_inquilino uuid;
begin
  -- Categoria: tem de ser de receita.
  if new.categoria is not null
     and (tg_op = 'INSERT' or new.categoria is distinct from old.categoria) then
    select c.tipo into v_tipo from public.categorias_financeiras c where c.id = new.categoria;

    if v_tipo is not null and v_tipo <> 'receita' then
      raise exception 'Esta categoria é de despesa e não pode ser usada em receitas.'
        using errcode = 'HA007',
              hint    = 'Escolha uma categoria do tipo receita.';
    end if;
  end if;

  -- Contrato: tem de ser do imóvel da receita, e o inquilino, quando informado,
  -- o do contrato.
  if new.contrato is not null
     and (tg_op = 'INSERT'
          or new.contrato  is distinct from old.contrato
          or new.imovel    is distinct from old.imovel
          or new.inquilino is distinct from old.inquilino) then
    select k.imovel, k.inquilino into v_imovel, v_inquilino
      from public.contratos k where k.id = new.contrato;

    if v_imovel is not null and v_imovel <> new.imovel then
      raise exception 'Este contrato é de outro imóvel. Escolha um contrato do imóvel da receita.'
        using errcode = 'HA008',
              hint    = 'Troque o imóvel ou escolha outro contrato.';
    end if;

    if new.inquilino is not null and v_inquilino is not null and v_inquilino <> new.inquilino then
      raise exception 'O inquilino da receita é diferente do inquilino do contrato.'
        using errcode = 'HA009',
              hint    = 'Use o inquilino do contrato ou escolha outro contrato.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.tg_validar_receita() from public, anon, authenticated;

drop trigger if exists validar_receita on public.receitas;
create trigger validar_receita
  before insert or update of categoria, contrato, imovel, inquilino on public.receitas
  for each row execute function public.tg_validar_receita();

-- 2. Despesas --------------------------------------------------------------------

create or replace function public.tg_validar_despesa()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tipo public.categoria_tipo;
begin
  if new.categoria is not null
     and (tg_op = 'INSERT' or new.categoria is distinct from old.categoria) then
    select c.tipo into v_tipo from public.categorias_financeiras c where c.id = new.categoria;

    if v_tipo is not null and v_tipo <> 'despesa' then
      raise exception 'Esta categoria é de receita e não pode ser usada em despesas.'
        using errcode = 'HA007',
              hint    = 'Escolha uma categoria do tipo despesa.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.tg_validar_despesa() from public, anon, authenticated;

drop trigger if exists validar_despesa on public.despesas;
create trigger validar_despesa
  before insert or update of categoria on public.despesas
  for each row execute function public.tg_validar_despesa();
