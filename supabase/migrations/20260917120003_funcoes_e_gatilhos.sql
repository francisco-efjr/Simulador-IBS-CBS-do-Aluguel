-- =============================================================================
-- 03 — Funções e gatilhos
--
-- Porta para o Postgres o que hoje vive em pocketbase/hooks/*.js: carimbo de
-- data e autoria, status financeiro derivado, sincronismo do imóvel com o
-- contrato, trilha de auditoria e a varredura diária de vencidos.
--
-- Regra que passa a valer no banco vale para toda porta de entrada — tela,
-- API, importação, script — e não só para a que passou pelo React.
-- =============================================================================

-- 3.1 Carimbos -----------------------------------------------------------------

create or replace function public.tg_marcar_atualizacao()
returns trigger
language plpgsql
as $$
begin
  new.updated := now();
  return new;
end;
$$;

create or replace function public.tg_marcar_autoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_by := coalesce(new.updated_by, auth.uid());
  else
    new.created_by := old.created_by;  -- autoria original é imutável
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  end if;
  return new;
end;
$$;

-- 3.2 Status financeiro derivado ------------------------------------------------
-- Vem de on_receita_create/update.js e on_despesas_create/update.js. Lá o status
-- era gravado num segundo save, depois do fato; aqui ele é calculado antes de a
-- linha entrar, e nunca existe registro com status inconsistente.

create or replace function public.tg_status_da_receita()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.valor_recebido, 0) > 0
     and new.valor_recebido >= coalesce(new.valor_previsto, new.valor, 0) then
    new.status_financeiro := 'recebido';
  elsif coalesce(new.valor_recebido, 0) > 0 then
    new.status_financeiro := 'parcial';
  elsif new.data_vencimento is not null and new.data_vencimento < current_date then
    new.status_financeiro := 'em_atraso';
  else
    new.status_financeiro := 'previsto';
  end if;
  return new;
end;
$$;

create or replace function public.tg_status_da_despesa()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.valor_pago, 0) > 0
     and new.valor_pago >= coalesce(new.valor_previsto, new.valor, 0) then
    new.status_financeiro := 'pago';
  elsif coalesce(new.valor_pago, 0) > 0 then
    new.status_financeiro := 'parcial';
  elsif new.data_vencimento is not null and new.data_vencimento < current_date then
    new.status_financeiro := 'em_atraso';
  else
    new.status_financeiro := 'previsto';
  end if;
  return new;
end;
$$;

-- Vem de on_iptu_taxas_create/update.js.
create or replace function public.tg_status_do_iptu()
returns trigger
language plpgsql
as $$
begin
  if new.data_pagamento is not null then
    new.status := 'pago';
  elsif new.vencimento is not null and new.vencimento < current_date then
    new.status := 'vencido';
  else
    new.status := 'pendente';
  end if;
  return new;
end;
$$;

-- 3.3 Imóvel segue o contrato ---------------------------------------------------
-- Vem de on_contrato_create.js e on_contrato_update.js.

create or replace function public.tg_sincronizar_imovel_do_contrato()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'ativo' then
    update public.imoveis
       set status = 'alugado',
           inquilino_atual = new.inquilino,
           updated = now()
     where id = new.imovel;

  elsif tg_op = 'UPDATE' and old.status = 'ativo' and new.status <> 'ativo' then
    -- Só libera o imóvel se nenhum outro contrato ativo restar nele.
    if not exists (
      select 1 from public.contratos c
       where c.imovel = new.imovel and c.status = 'ativo' and c.id <> new.id
    ) then
      update public.imoveis
         set status = 'vago',
             inquilino_atual = null,
             updated = now()
       where id = new.imovel;
    end if;
  end if;

  return null;
end;
$$;

-- 3.4 Trilha de auditoria -------------------------------------------------------
-- Vem dos cinco hooks audit_*.js, agora numa função só. O rótulo legível
-- continua em detalhes; o que mudou vai estruturado em payload (RD-09).

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

  v_rotulo := coalesce(
    nullif(v_linha ->> 'nome', ''),
    nullif(v_linha ->> 'descricao', ''),
    -- endereço antes de número: num imóvel sem nome, "Rua X" diz mais que "100".
    nullif(v_linha ->> 'endereco', ''),
    nullif(v_linha ->> 'numero', ''),
    nullif(v_linha ->> 'arquivo_nome', ''),
    nullif(v_linha ->> 'email', ''),
    left(v_linha ->> 'id', 8)
  );

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

-- 3.5 Ninguém promove a si mesmo ------------------------------------------------

create or replace function public.tg_proteger_privilegio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.perfil is distinct from old.perfil or new.ativo is distinct from old.ativo)
     and not public.eh_administrador() then
    raise exception 'Somente um administrador altera perfil ou situação de acesso.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- 3.6 Perfil nasce junto do login -----------------------------------------------
-- Substitui on_users_lifecycle.js. Quem entra por convite já nasce com o perfil
-- que o convite definiu; os demais entram como 'usuario' sem permissão alguma.

create or replace function public.tg_criar_perfil_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.perfil_usuario;
begin
  select c.perfil into v_perfil
    from public.convites c
   where lower(c.email) = lower(new.email)
     and c.status = 'pendente'
     and c.data_expiracao > now()
   order by c.created desc
   limit 1;

  insert into public.users (id, email, name, perfil, ativo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(v_perfil, 'usuario'),
    true
  )
  on conflict (id) do nothing;

  update public.convites
     set status = 'aceito', updated = now()
   where lower(email) = lower(new.email) and status = 'pendente';

  return new;
end;
$$;

create trigger criar_perfil_do_usuario
  after insert on auth.users
  for each row execute function public.tg_criar_perfil_do_usuario();

-- 3.7 Varredura diária de vencidos ----------------------------------------------
-- Vem de cron_receitas_overdue.js, cron_despesas_overdue.js e
-- cron_iptu_taxas_overdue.js — os três num único procedimento.

create or replace function public.marcar_lancamentos_em_atraso()
returns table (receitas integer, despesas integer, iptu integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_receitas integer;
  v_despesas integer;
  v_iptu     integer;
begin
  update public.receitas
     set status_financeiro = 'em_atraso', updated = now()
   where status_financeiro = 'previsto'
     and data_vencimento is not null
     and data_vencimento < current_date;
  get diagnostics v_receitas = row_count;

  update public.despesas
     set status_financeiro = 'em_atraso', updated = now()
   where status_financeiro = 'previsto'
     and data_vencimento is not null
     and data_vencimento < current_date;
  get diagnostics v_despesas = row_count;

  update public.iptu_taxas
     set status = 'vencido', updated = now()
   where status = 'pendente'
     and vencimento is not null
     and vencimento < current_date;
  get diagnostics v_iptu = row_count;

  return query select v_receitas, v_despesas, v_iptu;
end;
$$;

-- 3.8 Ligação dos gatilhos nas tabelas ------------------------------------------

do $$
declare
  t text;
  tabelas_com_autoria text[] := array[
    'imoveis', 'inquilinos', 'fornecedores', 'categorias_financeiras', 'contratos',
    'receitas', 'despesas', 'iptu_taxas', 'contas_bancarias', 'importacoes',
    'transacoes_importadas'
  ];
  tabelas_com_carimbo text[] := array[
    'users', 'permissoes', 'imoveis', 'inquilinos', 'fornecedores',
    'categorias_financeiras', 'contratos', 'receitas', 'despesas', 'iptu_taxas',
    'contas_bancarias', 'importacoes', 'transacoes_importadas',
    'documentos_anexos', 'convites'
  ];
  tabelas_auditadas text[] := array[
    'imoveis', 'inquilinos', 'fornecedores', 'contratos', 'receitas', 'despesas',
    'iptu_taxas', 'contas_bancarias', 'importacoes', 'convites', 'documentos_anexos'
  ];
begin
  foreach t in array tabelas_com_carimbo loop
    execute format(
      'create trigger marcar_atualizacao before update on public.%I
         for each row execute function public.tg_marcar_atualizacao()', t);
  end loop;

  foreach t in array tabelas_com_autoria loop
    execute format(
      'create trigger marcar_autoria before insert or update on public.%I
         for each row execute function public.tg_marcar_autoria()', t);
  end loop;

  foreach t in array tabelas_auditadas loop
    execute format(
      'create trigger registrar_log after insert or update or delete on public.%I
         for each row execute function public.tg_registrar_log(%L)', t, t);
  end loop;
end;
$$;

create trigger status_da_receita
  before insert or update on public.receitas
  for each row execute function public.tg_status_da_receita();

create trigger status_da_despesa
  before insert or update on public.despesas
  for each row execute function public.tg_status_da_despesa();

create trigger status_do_iptu
  before insert or update on public.iptu_taxas
  for each row execute function public.tg_status_do_iptu();

create trigger sincronizar_imovel
  after insert or update of status, imovel, inquilino on public.contratos
  for each row execute function public.tg_sincronizar_imovel_do_contrato();

create trigger proteger_privilegio
  before update on public.users
  for each row execute function public.tg_proteger_privilegio();
