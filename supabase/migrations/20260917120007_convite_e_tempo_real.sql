-- =============================================================================
-- 07 — Validação de convite e tempo real
-- =============================================================================

-- 7.1 Validar convite sem estar logado -------------------------------------------
--
-- Quem abre um convite ainda não tem conta, e a tabela de convites é fechada a
-- administradores. Esta função é a única porta aberta: recebe o token e devolve
-- só o e-mail e o perfil daquele convite — nunca a lista, nunca outro token.

create or replace function public.validar_convite(p_token text)
returns table (valido boolean, email text, perfil public.perfil_usuario, situacao text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_convite public.convites%rowtype;
begin
  select * into v_convite from public.convites c where c.token = p_token;

  if not found then
    return query select false, null::text, null::public.perfil_usuario, null::text;
    return;
  end if;

  if v_convite.status <> 'pendente' then
    return query select false, null::text, null::public.perfil_usuario, v_convite.status::text;
    return;
  end if;

  if v_convite.data_expiracao <= now() then
    return query select false, null::text, null::public.perfil_usuario, 'expirado'::text;
    return;
  end if;

  return query select true, v_convite.email, v_convite.perfil, 'pendente'::text;
end;
$$;

revoke all on function public.validar_convite(text) from public;
grant execute on function public.validar_convite(text) to anon, authenticated;

-- 7.2 Tempo real ------------------------------------------------------------------
--
-- As telas se atualizam sozinhas quando outra pessoa grava algo. O Postgres só
-- publica mudança de tabela que esteja nesta publicação; fora dela o canal abre
-- e nunca recebe evento. A publicação respeita a RLS: cada assinante só recebe
-- o que teria direito de ler.

do $$
declare
  t text;
begin
  foreach t in array array[
    'imoveis', 'inquilinos', 'fornecedores', 'contratos', 'receitas', 'despesas',
    'iptu_taxas', 'contas_bancarias', 'importacoes', 'transacoes_importadas',
    'documentos_anexos', 'convites'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
