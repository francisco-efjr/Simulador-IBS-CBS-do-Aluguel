-- =============================================================================
-- 20261006120002 — Cadastro só vale com o token do convite (SEG-02 e PRD-02)
-- =============================================================================
--
-- Dois defeitos no gatilho que cria o perfil junto do login
-- (tg_criar_perfil_do_usuario, 20260917120003, seção 3.6), provados pela QA em
-- 06/10/2026:
--
--   SEG-02 (alta). O convite era escolhido só pelo e-mail: o token nunca era
--   conferido no cadastro. Quem soubesse o e-mail convidado se cadastrava antes
--   dele e nascia com o perfil do convite — inclusive `administrador`.
--
--   PRD-02 (média). O Auth de produção aceita cadastro de qualquer origem
--   (`disable_signup: false`) e todo cadastro nascia `ativo`. A trava "só por
--   convite" existia apenas na tela; quem chamava `/auth/v1/signup` direto
--   criava conta ativa (lia categorias financeiras e avatares, e disparava
--   e-mail de confirmação para endereços de terceiros).
--
-- Regra nova, imposta no banco:
--   · O token do convite vai no cadastro, em `options.data.convite_token`
--     (vira `raw_user_meta_data ->> 'convite_token'`). O convite só vale se o
--     token bater, o e-mail for o mesmo (sem diferenciar maiúsculas), o status
--     for `pendente` e a validade não tiver passado. Só esse convite vira
--     `aceito` — antes, todos os pendentes do e-mail viravam.
--   · Com convite válido: perfil do convite, conta `ativa`.
--   · Sem convite válido (sem token, token de outro convite, e-mail diferente,
--     vencido, já usado): perfil `usuario`, conta INATIVA e sem permissão
--     alguma. `usuario_ativo()` barra a conta em toda política de RLS; um
--     administrador libera em /usuarios. O login recusa conta inativa com a
--     mensagem "Sua conta não está ativa no sistema".
--
-- Quem foi criado antes desta migração não muda. O primeiro administrador
-- continua sendo promovido pelo SQL Editor (supabase/README.md).
--
-- A recusa na origem (desligar "Allow new users to sign up" no Auth e emitir o
-- convite por `auth.admin.inviteUserByEmail` numa Edge Function) é decisão de
-- configuração de produção, fora das migrações.
--
-- Pode ser rodada de novo sem erro.

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
    coalesce(v_convite.perfil, 'usuario'),
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

-- Função de gatilho: ninguém da API chama (mesmo revoke da 20260919120004).
revoke all on function public.tg_criar_perfil_do_usuario() from public, anon, authenticated;
