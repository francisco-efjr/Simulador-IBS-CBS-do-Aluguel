-- =============================================================================
-- 20261006120007 — O limite de 3 imóveis conta os imóveis da própria pessoa (SEG-17)
-- =============================================================================
--
-- A regra de produto (docs/modulos/04-imoveis.md, ADR-0010) é: quem não é
-- administrador cadastra, no máximo, 3 imóveis ATIVOS seus; imóvel inativo
-- libera a vaga ("Usuário inativa 1 imóvel … permite cadastrar um novo imóvel
-- substituto").
--
-- O gatilho de 20261005120002 contava `created_by = auth.uid() OR created_by IS
-- NULL`. Imóvel legado, criado antes da autoria (`created_by` nulo — os migrados
-- do PocketBase e os criados pelo SQL Editor), entrava na conta de TODO mundo:
-- com 3 imóveis legados, o primeiro imóvel de um editor que não é administrador
-- já era recusado com HA003. Provado pela QA em 06/10/2026.
--
-- Agora só conta o que a pessoa cadastrou (`created_by = auth.uid()`) e não está
-- inativo. Administrador e processo sem sessão (`auth.uid()` nulo: migração,
-- SQL Editor) seguem isentos. O código, a mensagem e o formato do erro não
-- mudam (a tela já os traduz).
--
-- Que inativar libera vaga é o que a documentação descreve; se o dono decidir
-- que o limite é mesmo um teto de cadastros (e não de imóveis ativos), é só
-- tirar o `status <> 'inativo'` daqui.
--
-- Pode ser rodada de novo sem erro.

create or replace function public.tg_validar_limite_imoveis()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer;
begin
  -- Administradores ou processos internos de sistema/migração sem auth.uid() são isentos
  if auth.uid() is null or public.eh_administrador() then
    return new;
  end if;

  select count(*) into v_total
    from public.imoveis
   where created_by = auth.uid()
     and status <> 'inativo';

  if v_total >= 3 then
    raise exception 'Limite de até 3 imóveis atingido no plano gratuito.'
      using errcode = 'HA003',
            detail  = 'Usuários sem privilégio especial podem cadastrar no máximo 3 imóveis ativos.',
            hint    = 'Inative imóveis sem uso ou faça upgrade para o plano ilimitado.';
  end if;

  return new;
end;
$$;

revoke all on function public.tg_validar_limite_imoveis() from public, anon, authenticated;
