-- =============================================================================
-- 20261006120004 — O contrato só aceita unidade do próprio imóvel (SEG-08)
-- =============================================================================
--
-- `contratos.unidade_id` era uma chave estrangeira simples: aceitava a unidade
-- de QUALQUER imóvel. Pior: o gatilho `sincronizar_imovel` (security definer)
-- marca a unidade escolhida como `alugado` e grava o inquilino nela, mesmo que
-- quem salvou o contrato só tenha o módulo `contratos` e não enxergue
-- `imovel_unidades`. Resultado, provado pela QA em 06/10/2026: contrato do
-- imóvel A com unidade do imóvel B deixava a unidade de B "alugada" para o
-- inquilino errado (ocupação e relatório inconsistentes, e uma gravação em dado
-- de outro módulo).
--
-- A recusa é um gatilho BEFORE, com código próprio `HA004` (classe "HA" da
-- Holding Aguiar, ao lado de HA001 a HA003) e mensagem pronta em português,
-- que a tela repassa (src/lib/dados/erros.ts). Roda antes da restrição de
-- sobreposição e antes do gatilho de sincronização, então nada é gravado.
--
-- security definer porque quem edita contratos pode não ter permissão de ver
-- `imovel_unidades`: pela RLS a consulta voltaria vazia e todo contrato com
-- unidade seria recusado.
--
-- Só contratos novos ou alterados passam pela regra. Para achar o que já está
-- inconsistente em produção:
--   select c.id, c.numero, c.imovel, c.unidade_id
--     from public.contratos c join public.imovel_unidades u on u.id = c.unidade_id
--    where u.imovel_id <> c.imovel;
-- O bloco da seção 2 avisa (notice) se houver linhas assim, sem mexer nelas.
--
-- Pode ser rodada de novo sem erro.

-- 1. Gatilho ---------------------------------------------------------------------

create or replace function public.tg_validar_unidade_do_contrato()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.unidade_id is not null and not exists (
    select 1
      from public.imovel_unidades u
     where u.id = new.unidade_id
       and u.imovel_id = new.imovel
  ) then
    raise exception 'Esta unidade não pertence ao imóvel do contrato.'
      using errcode = 'HA004',
            hint    = 'Escolha uma unidade do imóvel selecionado ou deixe a unidade em branco.';
  end if;

  return new;
end;
$$;

revoke all on function public.tg_validar_unidade_do_contrato() from public, anon, authenticated;

drop trigger if exists validar_unidade_do_contrato on public.contratos;
create trigger validar_unidade_do_contrato
  before insert or update of imovel, unidade_id on public.contratos
  for each row execute function public.tg_validar_unidade_do_contrato();

-- 2. Aviso sobre o que já está gravado ------------------------------------------

do $$
declare
  v_total integer;
begin
  select count(*) into v_total
    from public.contratos c
    join public.imovel_unidades u on u.id = c.unidade_id
   where u.imovel_id <> c.imovel;

  if v_total > 0 then
    raise notice 'Há % contrato(s) com unidade de outro imóvel. Corrija à mão (consulta no cabeçalho desta migração): a regra nova só vale para o que for gravado daqui em diante.', v_total;
  end if;
end;
$$;
