-- =============================================================================
-- 20261008120001 — Perfil de acesso: administrador ou gratuito
-- =============================================================================
--
-- Decisão do dono em 08/10/2026. O sistema passa a ter dois perfis, e é o
-- PERFIL que define o acesso — não mais uma lista de permissões marcada módulo
-- a módulo para cada pessoa:
--
--   · administrador — acessa e edita tudo, sem limite algum (inclusive o de 3
--     imóveis). Igual a antes.
--   · gratuito — acessa e EDITA só Início, Imóveis (com unidades), Inquilinos,
--     Locadores e fiadores, e Contratos. Continua limitado a 3 imóveis ativos
--     cadastrados por ele (20261006120007). Os dados seguem compartilhados:
--     o gratuito enxerga os mesmos imóveis, inquilinos e contratos que os
--     demais.
--
-- O valor `usuario` do enum vira `gratuito` (RENAME VALUE preserva quem já
-- está cadastrado, os convites pendentes e os defaults das colunas). Toda conta
-- que não é administradora passa a ser gratuita: quem tinha permissão em
-- Receitas, Despesas, Dashboards etc. perde esse acesso até ser promovido a
-- administrador em /usuarios.
--
-- A tabela `permissoes` deixa de ser consultada (nivel_no_modulo não a lê
-- mais). Fica no banco, sem uso, só para não apagar histórico; pode ser
-- removida numa migração futura.
--
-- Fiadores: no banco a permissão de fiador vem de 'contratos'; a tela os
-- mostra junto de Locadores. O gratuito tem os dois, então não há conflito.
--
-- Início não é módulo: é a tela de entrada, aberta a todo usuário ativo; cada
-- bloco dela só mostra o que a RLS deixa ler.
--
-- Pode ser rodada de novo sem erro.

-- 1. O perfil `usuario` passa a se chamar `gratuito` -------------------------------

do $$
begin
  if exists (
    select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
     where t.typnamespace = 'public'::regnamespace
       and t.typname = 'perfil_usuario'
       and e.enumlabel = 'usuario'
  ) then
    alter type public.perfil_usuario rename value 'usuario' to 'gratuito';
  end if;
end;
$$;

-- 2. Módulos do perfil gratuito --------------------------------------------------
-- Lista única, consultada por nivel_no_modulo. Mudar o pacote do gratuito é
-- mudar só aqui (e em MODULOS_DO_GRATUITO, em src/lib/constants.ts).

create or replace function public.modulos_do_gratuito()
returns public.modulo_permissao[]
language sql
immutable
set search_path = ''
as $$
  select array['imoveis', 'inquilinos', 'locadores', 'contratos']::public.modulo_permissao[];
$$;

-- 3. A decisão de acesso passa a ler o perfil -------------------------------------

create or replace function public.nivel_no_modulo(p_modulo public.modulo_permissao)
returns public.nivel_permissao
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.eh_administrador() then 'edicao'::public.nivel_permissao
    when not public.usuario_ativo() then 'sem_acesso'::public.nivel_permissao
    when p_modulo = any (public.modulos_do_gratuito()) then 'edicao'::public.nivel_permissao
    else 'sem_acesso'::public.nivel_permissao
  end;
$$;

-- 4. Cadastro sem convite nasce gratuito -----------------------------------------
-- Mesmo corpo de 20261006120002; só o literal do perfil padrão muda (o antigo
-- 'usuario' não existe mais no enum e quebraria o cadastro).

create or replace function public.tg_criar_perfil_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token   text := nullif(btrim(new.raw_user_meta_data ->> 'convite_token'), '');
  v_convite public.convites%rowtype;
begin
  if v_token is not null then
    -- `for update`: dois cadastros simultâneos com o mesmo token não aceitam o
    -- mesmo convite duas vezes.
    select c.* into v_convite
      from public.convites c
     where c.token = v_token
       and lower(c.email) = lower(new.email)
       and c.status = 'pendente'
       and c.data_expiracao > now()
     limit 1
       for update;
  end if;

  insert into public.users (id, email, name, perfil, ativo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(v_convite.perfil, 'gratuito'),
    -- Sem convite casado a conta espera a liberação de um administrador.
    v_convite.id is not null
  )
  on conflict (id) do nothing;

  if v_convite.id is not null then
    update public.convites
       set status = 'aceito', updated = now()
     where id = v_convite.id;
  end if;

  return new;
end;
$$;

-- Funções de gatilho e de decisão: o mesmo tratamento das anteriores.
revoke all on function public.tg_criar_perfil_do_usuario() from public, anon, authenticated;
revoke execute on function public.modulos_do_gratuito() from public, anon;
grant execute on function public.modulos_do_gratuito() to authenticated;
