-- =============================================================================
-- Árvore Hierárquica de Imóveis, Unidades e Partes Contratuais (Fase 1)
--
-- Implementa a estrutura hierárquica multinível e novas entidades da holding:
--   1. Cadastro de Locadores (módulo 'locadores', RLS e auditoria)
--   2. Cadastro de Fiadores (vinculado a 'contratos', RLS e auditoria)
--   3. Cadastro de Unidades de Imóveis (vinculado a 'imoveis', RLS e auditoria)
--   4. Atualização de Imóveis (matrícula, CIB, IPTUs, valor e teto comercial de 3 imóveis)
--   5. Atualização de Inquilinos (endereço secundário e RG opcional para CIN)
--   6. Atualização de Contratos (vínculos com unidade, locador, fiador e número sequencial NNN/AAAA)
--   7. Compatibilidade retroativa com dados legados existentes
--
-- Pode ser rodada de novo sem erro (idempotente).
-- =============================================================================

-- 1. Novas Tabelas -------------------------------------------------------------

-- 1.1 Locadores
create table if not exists public.locadores (
  id uuid primary key default gen_random_uuid(),
  nome_razao_social text not null,
  tipo_pessoa public.pessoa_tipo not null default 'pf',
  cpf_cnpj text,
  email text,
  telefone text,
  dados_bancarios text,
  status public.cadastro_status not null default 'ativo',
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now(),
  constraint locadores_nome_preenchido check (btrim(nome_razao_social) <> ''),
  constraint locadores_cpf_cnpj_valido check (cpf_cnpj is null or btrim(cpf_cnpj) = '' or public.cpf_cnpj_valido(cpf_cnpj)),
  constraint locadores_email_valido check (email is null or btrim(email) = '' or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create unique index if not exists locadores_cpf_cnpj_uidx
  on public.locadores (cpf_cnpj)
  where cpf_cnpj is not null and cpf_cnpj <> '';

create index if not exists locadores_status_idx on public.locadores (status);
create index if not exists locadores_created_idx on public.locadores (created desc);

-- 1.2 Fiadores
create table if not exists public.fiadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text,
  rg text,
  estado_civil text,
  conjuge_nome text,
  conjuge_cpf text,
  email text,
  telefone text,
  endereco_completo text,
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now(),
  constraint fiadores_nome_preenchido check (btrim(nome) <> ''),
  constraint fiadores_cpf_valido check (cpf is null or btrim(cpf) = '' or public.cpf_valido(cpf)),
  constraint fiadores_conjuge_cpf_valido check (conjuge_cpf is null or btrim(conjuge_cpf) = '' or public.cpf_valido(conjuge_cpf)),
  constraint fiadores_email_valido check (email is null or btrim(email) = '' or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create unique index if not exists fiadores_cpf_uidx
  on public.fiadores (cpf)
  where cpf is not null and cpf <> '';

create index if not exists fiadores_created_idx on public.fiadores (created desc);

-- 1.3 Unidades dos Imóveis
create table if not exists public.imovel_unidades (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  identificador text not null,
  complemento text,
  tipo_unidade text not null default 'residencial',
  codigo_energia text,
  codigo_agua text,
  tem_condominio boolean not null default false,
  valor_condominio numeric(14, 2) check (valor_condominio is null or valor_condominio >= 0),
  taxas_extras numeric(14, 2) check (taxas_extras is null or taxas_extras >= 0) default 0.00,
  taxa_poco numeric(14, 2) check (taxa_poco is null or taxa_poco >= 0) default 0.00,
  status public.imovel_status not null default 'vago',
  inquilino_atual uuid references public.inquilinos (id) on delete set null,
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now(),
  constraint imovel_unidades_identificador_preenchido check (btrim(identificador) <> '')
);

create index if not exists imovel_unidades_imovel_id_idx on public.imovel_unidades (imovel_id);
create index if not exists imovel_unidades_status_idx on public.imovel_unidades (status);
create index if not exists imovel_unidades_inquilino_atual_idx on public.imovel_unidades (inquilino_atual);
create index if not exists imovel_unidades_created_idx on public.imovel_unidades (created desc);


-- 2. Atualizações em Tabelas Existentes ----------------------------------------

-- 2.1 Imóveis
alter table public.imoveis add column if not exists matricula text;
alter table public.imoveis add column if not exists cib text;
alter table public.imoveis add column if not exists iptus text[] not null default '{}';
alter table public.imoveis add column if not exists valor_imovel numeric(14, 2) check (valor_imovel is null or valor_imovel >= 0);

-- Preenche valor_imovel retroativamente a partir dos campos legados se ainda vazio
update public.imoveis
   set valor_imovel = coalesce(valor_imovel, valor_estimado, valor)
 where valor_imovel is null and (valor_estimado is not null or valor is not null);

-- 2.2 Inquilinos
alter table public.inquilinos add column if not exists endereco_secundario text;
alter table public.inquilinos add column if not exists endereco_secundario_origem text;
alter table public.inquilinos alter column rg drop not null;

-- 2.3 Contratos
alter table public.contratos add column if not exists unidade_id uuid references public.imovel_unidades (id) on delete restrict;
alter table public.contratos add column if not exists locador_id uuid references public.locadores (id) on delete restrict;
alter table public.contratos add column if not exists fiador_id uuid references public.fiadores (id) on delete restrict;

create index if not exists contratos_unidade_id_idx on public.contratos (unidade_id);
create index if not exists contratos_locador_id_idx on public.contratos (locador_id);
create index if not exists contratos_fiador_id_idx on public.contratos (fiador_id);


-- 3. Regras de Negócio e Gatilhos Específicos -----------------------------------

-- 3.1 Limite comercial de até 3 imóveis para usuários sem privilégio especial
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
   where (created_by = auth.uid() or created_by is null)
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

drop trigger if exists validar_limite_imoveis on public.imoveis;
create trigger validar_limite_imoveis
  before insert on public.imoveis
  for each row execute function public.tg_validar_limite_imoveis();

-- 3.2 Gerador de número sequencial de contratos no formato 001/2026
create or replace function public.proximo_numero_contrato(p_ano integer default extract(year from current_date)::integer)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_ano text := coalesce(p_ano, extract(year from current_date)::integer)::text;
  v_maior_seq integer := 0;
  v_seq integer;
  r record;
begin
  for r in
    select substring(c.numero from '^([0-9]+)/' || v_ano || '$') as seq_str
      from public.contratos c
     where c.numero ~ ('^[0-9]+/' || v_ano || '$')
  loop
    v_seq := r.seq_str::integer;
    if v_seq > v_maior_seq then
      v_maior_seq := v_seq;
    end if;
  end loop;

  return lpad((v_maior_seq + 1)::text, 3, '0') || '/' || v_ano;
end;
$$;

create or replace function public.tg_gerar_numero_contrato()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ano integer;
begin
  if new.numero is null or btrim(new.numero) = '' then
    v_ano := extract(year from coalesce(new.data_inicio, current_date))::integer;
    new.numero := public.proximo_numero_contrato(v_ano);
  end if;
  return new;
end;
$$;

drop trigger if exists gerar_numero_contrato on public.contratos;
create trigger gerar_numero_contrato
  before insert on public.contratos
  for each row execute function public.tg_gerar_numero_contrato();

-- 3.3 Sincronismo do status da unidade e imóvel com o contrato
create or replace function public.tg_sincronizar_imovel_do_contrato()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 1. O contrato ativo deixou o imóvel ou a unidade antiga?
  if tg_op in ('UPDATE', 'DELETE')
     and old.status = 'ativo'
     and (tg_op = 'DELETE'
          or new.status <> 'ativo'
          or new.imovel is distinct from old.imovel
          or new.unidade_id is distinct from old.unidade_id) then
    -- Só libera a unidade se nenhum outro contrato ativo restar nela
    if old.unidade_id is not null and not exists (
      select 1 from public.contratos c
       where c.unidade_id = old.unidade_id and c.status = 'ativo' and c.id <> old.id
    ) then
      update public.imovel_unidades
         set status = 'vago',
             inquilino_atual = null,
             updated = now()
       where id = old.unidade_id;
    end if;

    -- Só libera o imóvel se nenhum outro contrato ativo restar nele
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

  -- 2. O contrato ativo ocupa o imóvel e a unidade
  if tg_op in ('INSERT', 'UPDATE') and new.status = 'ativo' then
    update public.imoveis
       set status = 'alugado',
           inquilino_atual = new.inquilino,
           updated = now()
     where id = new.imovel;

    if new.unidade_id is not null then
      update public.imovel_unidades
         set status = 'alugado',
             inquilino_atual = new.inquilino,
             updated = now()
       where id = new.unidade_id;
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists sincronizar_imovel on public.contratos;
create trigger sincronizar_imovel
  after insert or update of status, imovel, inquilino, unidade_id or delete on public.contratos
  for each row execute function public.tg_sincronizar_imovel_do_contrato();

-- 3.4 Proteção contra inativação com contrato ativo também para unidades
create or replace function public.tg_impedir_inativar_com_contrato_ativo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quem     text;
  v_acao     text;
  v_contrato text;
begin
  if tg_op = 'UPDATE' and (new.status::text <> 'inativo' or old.status::text = 'inativo') then
    return new;
  end if;

  if tg_table_name = 'imoveis' then
    v_quem := 'Este imóvel';
    v_acao := case when tg_op = 'UPDATE' then 'inativado' else 'excluído' end;
    select coalesce(nullif(c.numero, ''), 'sem número') into v_contrato
      from public.contratos c
     where (c.imovel = old.id or c.unidade_id in (select u.id from public.imovel_unidades u where u.imovel_id = old.id))
       and c.status = 'ativo'
     order by c.data_inicio nulls first
     limit 1;
  elsif tg_table_name = 'imovel_unidades' then
    v_quem := 'Esta unidade';
    v_acao := case when tg_op = 'UPDATE' then 'inativada' else 'excluída' end;
    select coalesce(nullif(c.numero, ''), 'sem número') into v_contrato
      from public.contratos c
     where c.unidade_id = old.id and c.status = 'ativo'
     order by c.data_inicio nulls first
     limit 1;
  else
    v_quem := 'Este inquilino';
    v_acao := case when tg_op = 'UPDATE' then 'inativado' else 'excluído' end;
    select coalesce(nullif(c.numero, ''), 'sem número') into v_contrato
      from public.contratos c
     where c.inquilino = old.id and c.status = 'ativo'
     order by c.data_inicio nulls first
     limit 1;
  end if;

  if v_contrato is not null then
    raise exception '% tem contrato ativo e não pode ser %. Encerre ou cancele o contrato antes.',
      v_quem, v_acao
      using errcode = 'HA001',
            detail  = format('Contrato ativo: %s.', v_contrato),
            hint    = 'Em Contratos, mude a situação do contrato para encerrado ou cancelado.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists impedir_inativar_com_contrato_ativo on public.imovel_unidades;
create trigger impedir_inativar_com_contrato_ativo
  before update of status or delete on public.imovel_unidades
  for each row execute function public.tg_impedir_inativar_com_contrato_ativo();


-- 4. Compatibilidade Retroativa de Dados ---------------------------------------

-- Cria unidade 'Principal' para imóveis que ainda não possuem unidades filhas
insert into public.imovel_unidades (
  imovel_id, identificador, complemento, tipo_unidade, status, inquilino_atual, created_by, updated_by
)
select i.id,
       'Principal',
       coalesce(i.complemento, 'Térreo'),
       case when i.tipo in ('sala_comercial', 'loja', 'galpao') then 'comercial' else 'residencial' end,
       i.status,
       i.inquilino_atual,
       i.created_by,
       i.updated_by
  from public.imoveis i
 where not exists (
   select 1 from public.imovel_unidades u where u.imovel_id = i.id
 );

-- Conecta contratos existentes sem unidade à unidade criada
update public.contratos c
   set unidade_id = u.id
  from public.imovel_unidades u
 where c.imovel = u.imovel_id
   and c.unidade_id is null;


-- 5. Gatilhos Padrão (Carimbo, Autoria e Auditoria) ----------------------------

-- Aprimora identificação do rótulo nos logs preservando campos de usuários, permissões e histórias
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
      nullif(v_linha ->> 'nome_razao_social', ''),
      nullif(v_linha ->> 'identificador', ''),
      nullif(v_linha ->> 'titulo', ''),
      nullif(v_linha ->> 'descricao', ''),
      nullif(v_linha ->> 'endereco', ''),
      nullif(v_linha ->> 'numero', ''),
      nullif(v_linha ->> 'arquivo_nome', ''),
      nullif(v_linha ->> 'email', ''),
      left(v_linha ->> 'id', 8)
    );
  end if;

  if tg_op = 'UPDATE' then
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

revoke all on function public.tg_registrar_log() from public, anon, authenticated;

do $$
declare
  t text;
  novas_tabelas text[] := array['locadores', 'fiadores', 'imovel_unidades'];
begin
  foreach t in array novas_tabelas loop
    execute format('drop trigger if exists marcar_atualizacao on public.%I', t);
    execute format(
      'create trigger marcar_atualizacao before update on public.%I
         for each row execute function public.tg_marcar_atualizacao()', t);

    execute format('drop trigger if exists marcar_autoria on public.%I', t);
    execute format(
      'create trigger marcar_autoria before insert or update on public.%I
         for each row execute function public.tg_marcar_autoria()', t);

    execute format('drop trigger if exists registrar_log on public.%I', t);
    execute format(
      'create trigger registrar_log after insert or update or delete on public.%I
         for each row execute function public.tg_registrar_log(%L)', t, t);
  end loop;
end;
$$;


-- 6. Segurança e Row Level Security (RLS) --------------------------------------

alter table public.locadores enable row level security;
alter table public.fiadores enable row level security;
alter table public.imovel_unidades enable row level security;

-- Políticas de Locadores (módulo 'locadores')
drop policy if exists locadores_ver on public.locadores;
create policy locadores_ver on public.locadores
  for select to authenticated using (public.pode_ver('locadores'));

drop policy if exists locadores_criar on public.locadores;
create policy locadores_criar on public.locadores
  for insert to authenticated with check (public.pode_editar('locadores'));

drop policy if exists locadores_editar on public.locadores;
create policy locadores_editar on public.locadores
  for update to authenticated
  using (public.pode_editar('locadores')) with check (public.pode_editar('locadores'));

drop policy if exists locadores_excluir on public.locadores;
create policy locadores_excluir on public.locadores
  for delete to authenticated using (public.pode_editar('locadores'));

-- Políticas de Fiadores (módulo 'contratos')
drop policy if exists fiadores_ver on public.fiadores;
create policy fiadores_ver on public.fiadores
  for select to authenticated using (public.pode_ver('contratos'));

drop policy if exists fiadores_criar on public.fiadores;
create policy fiadores_criar on public.fiadores
  for insert to authenticated with check (public.pode_editar('contratos'));

drop policy if exists fiadores_editar on public.fiadores;
create policy fiadores_editar on public.fiadores
  for update to authenticated
  using (public.pode_editar('contratos')) with check (public.pode_editar('contratos'));

drop policy if exists fiadores_excluir on public.fiadores;
create policy fiadores_excluir on public.fiadores
  for delete to authenticated using (public.pode_editar('contratos'));

-- Políticas de Unidades de Imóveis (módulo 'imoveis')
drop policy if exists imovel_unidades_ver on public.imovel_unidades;
create policy imovel_unidades_ver on public.imovel_unidades
  for select to authenticated using (public.pode_ver('imoveis'));

drop policy if exists imovel_unidades_criar on public.imovel_unidades;
create policy imovel_unidades_criar on public.imovel_unidades
  for insert to authenticated with check (public.pode_editar('imoveis'));

drop policy if exists imovel_unidades_editar on public.imovel_unidades;
create policy imovel_unidades_editar on public.imovel_unidades
  for update to authenticated
  using (public.pode_editar('imoveis')) with check (public.pode_editar('imoveis'));

drop policy if exists imovel_unidades_excluir on public.imovel_unidades;
create policy imovel_unidades_excluir on public.imovel_unidades
  for delete to authenticated using (public.pode_editar('imoveis'));


-- 7. Concessões e Permissões ---------------------------------------------------

revoke all on public.locadores from anon;
grant select, insert, update, delete on public.locadores to authenticated;

revoke all on public.fiadores from anon;
grant select, insert, update, delete on public.fiadores to authenticated;

revoke all on public.imovel_unidades from anon;
grant select, insert, update, delete on public.imovel_unidades to authenticated;

revoke all on function public.tg_validar_limite_imoveis() from public, anon, authenticated;
revoke all on function public.tg_gerar_numero_contrato() from public, anon, authenticated;
revoke all on function public.tg_sincronizar_imovel_do_contrato() from public, anon, authenticated;
revoke all on function public.tg_impedir_inativar_com_contrato_ativo() from public, anon, authenticated;

revoke all on function public.proximo_numero_contrato(integer) from public, anon;
grant execute on function public.proximo_numero_contrato(integer) to authenticated;


-- 8. Publicação em Tempo Real --------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['locadores', 'fiadores', 'imovel_unidades'] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
