-- =============================================================================
-- 11 — Correções da auditoria do banco
--
-- Os testes do banco (supabase/tests) expuseram cinco defeitos nas migrações
-- 03 a 05, já aplicadas em produção. Esta migração os corrige sem editar as
-- antigas, e acrescenta a trilha de auditoria das mudanças de privilégio:
--
--   11.1  o primeiro administrador volta a ser possível pelo SQL Editor
--   11.2  a autoria de um registro não pode mais ser forjada no INSERT
--   11.3  trocar o imóvel de um contrato ativo libera o imóvel antigo
--   11.4  apagar um contrato ativo libera o imóvel
--   11.5  mudança de perfil, situação e permissão entra em logs_atividade
--   11.6  EXECUTE revogado de quem não precisa (marcar_lancamentos_em_atraso
--         deixa de ser chamável por /rest/v1/rpc)
--
-- Idempotente: pode ser rodada de novo inteira no SQL Editor. Funções são
-- create or replace; gatilhos são removidos (se existirem) e recriados;
-- revoke/grant repetido não dá erro.
-- =============================================================================

-- 11.1 Primeiro administrador -----------------------------------------------------
-- O README manda promover o primeiro administrador com um UPDATE no SQL Editor.
-- Ali não há sessão: auth.uid() é nulo, eh_administrador() é false e o gatilho
-- recusava — o banco novo não tinha como ganhar o primeiro administrador.
--
-- Regra nova: quem chega sem sessão de usuário e não é uma role da API
-- (anon/authenticated) é o próprio dono do banco — SQL Editor (postgres) ou o
-- service_role, cuja chave já dá acesso total. Esses passam. Quem tem sessão
-- continua precisando ser administrador ativo.
--
-- A função deixa de ser security definer de propósito: dentro de uma função
-- security definer, current_user é o dono da função (postgres), e a regra acima
-- liberaria todo mundo. Como security invoker, current_user é quem de fato fez
-- o UPDATE. Ela não precisa de privilégio extra: eh_administrador() já é
-- security definer e executável por authenticated.
--
-- A condição auth.uid() is null também fecha a porta dos fundos: um UPDATE em
-- public.users feito por outra função security definer, disparada por alguém
-- logado, roda como postgres, mas tem auth.uid() — e cai na regra do
-- administrador.

create or replace function public.tg_proteger_privilegio()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.perfil is not distinct from old.perfil and new.ativo is not distinct from old.ativo then
    return new;
  end if;

  -- Sem sessão e fora das roles da API: SQL Editor, postgres, service_role.
  if auth.uid() is null and current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if not public.eh_administrador() then
    raise exception 'Somente um administrador altera perfil ou situação de acesso.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- 11.2 Autoria não se forja ---------------------------------------------------------
-- No INSERT valia coalesce(new.created_by, auth.uid()): o valor mandado pelo
-- cliente vencia, e qualquer um com edição criava registro em nome de outra
-- pessoa. Agora, havendo sessão, quem está logado vence sempre. Sem sessão
-- (SQL Editor, importação feita pelo dono do banco) o valor informado é aceito,
-- porque ali não há outra fonte de verdade.

create or replace function public.tg_marcar_autoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  else
    new.created_by := old.created_by;  -- autoria original é imutável
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  end if;
  return new;
end;
$$;

-- 11.3 e 11.4 Imóvel segue o contrato — também na troca de imóvel e na exclusão ----
-- O gatilho só olhava o imóvel NOVO e só disparava em INSERT/UPDATE:
--   · trocar o imóvel de um contrato ativo alugava o destino, mas deixava o de
--     origem 'alugado', com inquilino_atual de quem já não mora lá;
--   · apagar um contrato ativo (a RLS permite a quem tem edição) deixava o
--     imóvel 'alugado' para sempre.
--
-- Agora, primeiro se libera o imóvel que o contrato ativo deixou — porque foi
-- encerrado, trocou de imóvel ou foi apagado — desde que nenhum outro contrato
-- ativo reste nele; depois se ocupa o imóvel do contrato ativo.

create or replace function public.tg_sincronizar_imovel_do_contrato()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 1. O contrato ativo deixou o imóvel antigo? ----------------------------------
  if tg_op in ('UPDATE', 'DELETE')
     and old.status = 'ativo'
     and (tg_op = 'DELETE'
          or new.status <> 'ativo'
          or new.imovel is distinct from old.imovel) then
    -- Só libera o imóvel se nenhum outro contrato ativo restar nele.
    if not exists (
      select 1 from public.contratos c
       where c.imovel = old.imovel and c.status = 'ativo' and c.id <> old.id
    ) then
      update public.imoveis
         set status = 'vago',
             inquilino_atual = null,
             updated = now()
       where id = old.imovel;
    end if;
  end if;

  -- 2. O contrato ativo ocupa o imóvel (novo ou o mesmo) --------------------------
  if tg_op in ('INSERT', 'UPDATE') and new.status = 'ativo' then
    update public.imoveis
       set status = 'alugado',
           inquilino_atual = new.inquilino,
           updated = now()
     where id = new.imovel;
  end if;

  return null;
end;
$$;

drop trigger if exists sincronizar_imovel on public.contratos;
create trigger sincronizar_imovel
  after insert or update of status, imovel, inquilino or delete on public.contratos
  for each row execute function public.tg_sincronizar_imovel_do_contrato();

-- 11.5 Mudança de privilégio entra na trilha ---------------------------------------
-- Até aqui, promover alguém a administrador, desativar um acesso ou dar edição
-- num módulo não deixava rastro: users e permissoes não eram auditadas. Agora
-- são, pelo mesmo tg_registrar_log das outras tabelas.
--
-- O enum acao_auditoria (criou/editou/excluiu) e a coluna entidade (text) já
-- comportam as duas tabelas — nada a acrescentar no tipo. O que faltava era um
-- rótulo legível em detalhes:
--   · users tem "name", não "nome": entra na lista antes do e-mail;
--   · permissoes não tem nome nenhum: o rótulo vira "<pessoa> — <módulo>: <nível>",
--     com a pessoa lida de public.users (o gatilho é security definer, então a
--     RLS não esconde o nome).

create or replace function public.tg_registrar_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entidade text := tg_argv[0];
  v_linha    jsonb;
  v_acao     public.acao_auditoria;
  v_rotulo   text;
  v_pessoa   text;
  v_payload  jsonb;
begin
  if tg_op = 'DELETE' then
    v_acao := 'excluiu';
    v_linha := to_jsonb(old);
  elsif tg_op = 'UPDATE' then
    v_acao := 'editou';
    v_linha := to_jsonb(new);
  else
    v_acao := 'criou';
    v_linha := to_jsonb(new);
  end if;

  if v_entidade = 'permissoes' then
    -- Na exclusão em cascata (login apagado) o perfil pode já ter saído; aí
    -- fica o começo do id, que ainda identifica a pessoa na trilha.
    select coalesce(nullif(u.name, ''), u.email) into v_pessoa
      from public.users u
     where u.id = (v_linha ->> 'usuario')::uuid;

    v_rotulo := format('%s — %s: %s',
      coalesce(v_pessoa, left(v_linha ->> 'usuario', 8)),
      v_linha ->> 'modulo',
      v_linha ->> 'nivel');
  else
    v_rotulo := coalesce(
      nullif(v_linha ->> 'nome', ''),
      nullif(v_linha ->> 'name', ''),
      nullif(v_linha ->> 'descricao', ''),
      -- endereço antes de número: num imóvel sem nome, "Rua X" diz mais que "100".
      nullif(v_linha ->> 'endereco', ''),
      nullif(v_linha ->> 'numero', ''),
      nullif(v_linha ->> 'arquivo_nome', ''),
      nullif(v_linha ->> 'email', ''),
      left(v_linha ->> 'id', 8)
    );
  end if;

  if tg_op = 'UPDATE' then
    -- Só o que mudou, campo a campo, sem o ruído dos carimbos.
    select jsonb_object_agg(
             novo.key,
             jsonb_build_object('de', to_jsonb(old) -> novo.key, 'para', novo.value)
           )
      into v_payload
      from jsonb_each(to_jsonb(new)) as novo
     where novo.key not in ('updated', 'updated_by')
       and novo.value is distinct from to_jsonb(old) -> novo.key;
  end if;

  insert into public.logs_atividade (usuario, acao, entidade, registro_id, detalhes, payload)
  values (
    auth.uid(),
    v_acao,
    v_entidade,
    (v_linha ->> 'id')::uuid,
    format('%s %s "%s"', v_acao, v_entidade, v_rotulo),
    v_payload
  );

  return null;
end;
$$;

-- users: entra quem nasce e quem sai; na edição, só perfil e situação — trocar o
-- próprio nome ou avatar não é assunto de auditoria e só encheria o feed.
drop trigger if exists registrar_log on public.users;
create trigger registrar_log
  after insert or delete on public.users
  for each row execute function public.tg_registrar_log('users');

drop trigger if exists registrar_log_privilegio on public.users;
create trigger registrar_log_privilegio
  after update of perfil, ativo on public.users
  for each row
  when (old.perfil is distinct from new.perfil or old.ativo is distinct from new.ativo)
  execute function public.tg_registrar_log('users');

-- permissoes: toda linha é privilégio, então tudo entra.
drop trigger if exists registrar_log on public.permissoes;
create trigger registrar_log
  after insert or update or delete on public.permissoes
  for each row execute function public.tg_registrar_log('permissoes');

-- 11.6 EXECUTE só para quem precisa ------------------------------------------------
-- No Supabase, toda função criada em public nasce executável por anon e
-- authenticated (privilégio padrão), além do PUBLIC do próprio Postgres; e a
-- migração 04 ainda fez "grant execute on all functions ... to authenticated".
-- Função security definer executável por anon é escrita no banco aberta a quem
-- não se identificou: marcar_lancamentos_em_atraso() podia ser disparada por
-- qualquer visitante em /rest/v1/rpc.
--
-- Revisão de todas as security definer das migrações:
--
--   · funções de gatilho — o gatilho dispara sem que ninguém precise de
--     EXECUTE (o Postgres só confere o privilégio ao criar o gatilho). Nenhuma
--     role da API precisa chamá-las: revoga de todas.
--   · marcar_lancamentos_em_atraso() — só a rotina do pg_cron, agendada pelo
--     postgres, que é o dono e não perde o EXECUTE. Revoga de todas as roles
--     da API. O service_role não entra: se um dia uma Edge Function precisar
--     disparar a varredura, conceda-se então, de propósito.
--   · usuario_ativo(), eh_administrador(), nivel_no_modulo(), pode_ver(),
--     pode_editar() — usadas nas políticas de RLS (tabelas e storage), que são
--     avaliadas com o privilégio de quem consulta: authenticated PRECISA
--     continuar executando. As políticas são todas "to authenticated", então
--     anon não precisa: revoga de public e anon.
--   · validar_convite() — é a única porta aberta ao visitante, de propósito
--     (migração 07). Continua como está: anon e authenticated.
--
-- As funções que não são security definer (carimbo, status derivado,
-- modulo_da_entidade, cpf_valido e companhia, importar_extrato) rodam com o
-- privilégio de quem chama e não dão acesso a nada que a pessoa já não tenha;
-- ficam como estão — cpf_valido e afins, aliás, são usadas em CHECK e precisam
-- continuar executáveis por quem grava.

-- Funções de gatilho: ninguém da API chama.
revoke all on function public.tg_marcar_autoria()                      from public, anon, authenticated;
revoke all on function public.tg_sincronizar_imovel_do_contrato()      from public, anon, authenticated;
revoke all on function public.tg_registrar_log()                       from public, anon, authenticated;
revoke all on function public.tg_proteger_privilegio()                 from public, anon, authenticated;
revoke all on function public.tg_criar_perfil_do_usuario()             from public, anon, authenticated;
revoke all on function public.tg_impedir_inativar_com_contrato_ativo() from public, anon, authenticated;

-- Varredura diária: só o dono (postgres), que é quem o pg_cron usa.
revoke all on function public.marcar_lancamentos_em_atraso() from public, anon, authenticated;

-- Decisão de acesso usada pela RLS: authenticated sim, visitante não.
revoke all on function public.usuario_ativo()                                   from public, anon;
revoke all on function public.eh_administrador()                                from public, anon;
revoke all on function public.nivel_no_modulo(public.modulo_permissao)          from public, anon;
revoke all on function public.pode_ver(public.modulo_permissao)                 from public, anon;
revoke all on function public.pode_editar(public.modulo_permissao)              from public, anon;
grant execute on function public.usuario_ativo()                                to authenticated;
grant execute on function public.eh_administrador()                             to authenticated;
grant execute on function public.nivel_no_modulo(public.modulo_permissao)       to authenticated;
grant execute on function public.pode_ver(public.modulo_permissao)              to authenticated;
grant execute on function public.pode_editar(public.modulo_permissao)           to authenticated;
