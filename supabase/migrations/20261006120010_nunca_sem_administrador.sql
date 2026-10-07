-- =============================================================================
-- 20261006120010 — O sistema nunca fica sem administrador ativo (FIN-15)
-- =============================================================================
--
-- A tela de Usuários já impede o administrador de se rebaixar, desativar ou
-- remover, mas o banco aceitava tudo isso pela API: um
-- `PATCH /rest/v1/users {"perfil":"usuario"}` do próprio administrador (e dele
-- mesmo sendo o único) deixava o sistema sem ninguém que conceda acesso — só o
-- SQL Editor recuperava (QA, 06/10/2026). `tg_proteger_privilegio` só pergunta
-- "quem muda é administrador?", não "o que sobra depois?".
--
-- Gatilho novo, BEFORE UPDATE OF perfil, ativo e BEFORE DELETE em `users`. Só
-- age quando QUEM ESTÁ SENDO ALTERADO é hoje um administrador ATIVO e a operação
-- o tiraria dessa condição (rebaixar, desativar ou apagar):
--   HA005  a própria pessoa logada não pode fazer isso consigo mesma;
--   HA006  ninguém pode fazer isso com o último administrador ativo (vale
--          também para o SQL Editor e a chave de serviço, e para a exclusão em
--          cascata de quem apaga o login em Authentication → Users).
-- Para trocar de administrador: promova o novo primeiro, depois rebaixe o antigo.
-- Mudar nome ou avatar do administrador segue livre.
--
-- security definer: a contagem dos outros administradores não pode depender da
-- RLS de quem chama (usuário comum só enxerga a própria linha).
--
-- Pode ser rodada de novo sem erro.

create or replace function public.tg_proteger_ultimo_administrador()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deixa_de_ser_admin boolean;
begin
  -- Só importa quem hoje é administrador ativo.
  if not (old.perfil = 'administrador' and old.ativo) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    v_deixa_de_ser_admin := true;
  else
    v_deixa_de_ser_admin := new.perfil <> 'administrador' or not new.ativo;
  end if;

  if not v_deixa_de_ser_admin then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if auth.uid() is not null and auth.uid() = old.id then
    raise exception 'Você não pode rebaixar, desativar nem remover a si mesmo.'
      using errcode = 'HA005',
            hint    = 'Peça a outro administrador para alterar o seu acesso.';
  end if;

  if not exists (
    select 1
      from public.users u
     where u.id <> old.id
       and u.perfil = 'administrador'
       and u.ativo
  ) then
    raise exception 'Este é o último administrador ativo e não pode ser rebaixado, desativado nem removido.'
      using errcode = 'HA006',
            hint    = 'Promova outro usuário a administrador antes.';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.tg_proteger_ultimo_administrador() from public, anon, authenticated;

drop trigger if exists proteger_ultimo_administrador on public.users;
create trigger proteger_ultimo_administrador
  before update of perfil, ativo or delete on public.users
  for each row execute function public.tg_proteger_ultimo_administrador();
