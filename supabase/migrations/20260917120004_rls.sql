-- =============================================================================
-- 04 — Row Level Security
--
-- Esta é a correção do achado S-02. Hoje as 12 permissões de módulo são
-- conferidas no React, e no servidor a regra é "qualquer autenticado lê e
-- escreve tudo": quem abre o console do navegador passa por cima do menu. Aqui a
-- permissão passa a ser avaliada pelo banco, em toda consulta, por qualquer
-- caminho.
--
-- Também fecha o S-04: ausência de permissão significa 'sem_acesso', nunca
-- 'edicao'. Falha fechando.
-- =============================================================================

-- 4.1 Funções de decisão --------------------------------------------------------
-- security definer para que a checagem leia public.users e public.permissoes
-- sem cair na política da própria tabela (recursão infinita).

create or replace function public.usuario_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select u.ativo from public.users u where u.id = auth.uid()), false);
$$;

create or replace function public.eh_administrador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select u.ativo and u.perfil = 'administrador' from public.users u where u.id = auth.uid()),
    false
  );
$$;

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
    else coalesce(
      (select p.nivel from public.permissoes p
        where p.usuario = auth.uid() and p.modulo = p_modulo),
      'sem_acesso'::public.nivel_permissao
    )
  end;
$$;

create or replace function public.pode_ver(p_modulo public.modulo_permissao)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.nivel_no_modulo(p_modulo) in ('visualizacao', 'edicao');
$$;

create or replace function public.pode_editar(p_modulo public.modulo_permissao)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.nivel_no_modulo(p_modulo) = 'edicao';
$$;

-- Anexo polimórfico herda a permissão do módulo a que pertence.
create or replace function public.modulo_da_entidade(p_entidade public.entidade_anexo)
returns public.modulo_permissao
language sql
immutable
set search_path = ''
as $$
  select case p_entidade
    when 'imovel'      then 'imoveis'
    when 'inquilino'   then 'inquilinos'
    when 'contrato'    then 'contratos'
    when 'fornecedor'  then 'fornecedores'
    when 'despesa'     then 'despesas'
    when 'receita'     then 'receitas'
    when 'iptu_taxas'  then 'iptu_taxas'
  end::public.modulo_permissao;
$$;

-- 4.2 Concessões ----------------------------------------------------------------
-- Nada é servido a visitante anônimo: este sistema não tem dado público.

grant usage on schema public to authenticated;
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- 4.3 RLS ligada em tudo ---------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'users', 'permissoes', 'imoveis', 'inquilinos', 'fornecedores',
    'categorias_financeiras', 'contratos', 'receitas', 'despesas', 'iptu_taxas',
    'contas_bancarias', 'importacoes', 'transacoes_importadas',
    'documentos_anexos', 'convites', 'logs_atividade'
  ] loop
    -- Sem FORCE: os gatilhos security definer (auditoria, criação de perfil,
    -- sincronismo do imóvel) rodam como dono da tabela e precisam escrever em
    -- tabelas que não têm política de escrita para ninguém.
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- 4.4 Políticas por módulo -------------------------------------------------------
-- Um bloco de quatro políticas por tabela de negócio: ver com 'visualizacao',
-- escrever só com 'edicao'.

do $$
declare
  par record;
begin
  for par in
    select * from (values
      ('imoveis',               'imoveis'),
      ('inquilinos',            'inquilinos'),
      ('fornecedores',          'fornecedores'),
      ('contratos',             'contratos'),
      ('receitas',              'receitas'),
      ('despesas',              'despesas'),
      ('iptu_taxas',            'iptu_taxas'),
      ('contas_bancarias',      'importar_extrato'),
      ('importacoes',           'importar_extrato'),
      ('transacoes_importadas', 'classificar_transacoes')
    ) as t(tabela, modulo)
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated
         using (public.pode_ver(%L))',
      par.tabela || '_ver', par.tabela, par.modulo);

    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check (public.pode_editar(%L))',
      par.tabela || '_criar', par.tabela, par.modulo);

    execute format(
      'create policy %I on public.%I for update to authenticated
         using (public.pode_editar(%L)) with check (public.pode_editar(%L))',
      par.tabela || '_editar', par.tabela, par.modulo, par.modulo);

    execute format(
      'create policy %I on public.%I for delete to authenticated
         using (public.pode_editar(%L))',
      par.tabela || '_excluir', par.tabela, par.modulo);
  end loop;
end;
$$;

-- 4.5 Identidade -----------------------------------------------------------------

-- Cada um enxerga a si mesmo; o administrador enxerga todo mundo.
create policy users_ver on public.users
  for select to authenticated
  using (id = auth.uid() or public.eh_administrador());

-- Editar o próprio nome e avatar é permitido; trocar o próprio perfil ou
-- reativar-se, não — o gatilho proteger_privilegio recusa.
create policy users_editar on public.users
  for update to authenticated
  using (id = auth.uid() or public.eh_administrador())
  with check (id = auth.uid() or public.eh_administrador());

create policy users_excluir on public.users
  for delete to authenticated
  using (public.eh_administrador());

-- Sem política de INSERT: o perfil nasce pelo gatilho em auth.users.

create policy permissoes_ver on public.permissoes
  for select to authenticated
  using (usuario = auth.uid() or public.eh_administrador());

create policy permissoes_administrar on public.permissoes
  for all to authenticated
  using (public.eh_administrador())
  with check (public.eh_administrador());

create policy convites_administrar on public.convites
  for all to authenticated
  using (public.eh_administrador())
  with check (public.eh_administrador());

-- 4.6 Apoio ----------------------------------------------------------------------

-- Categorias são vocabulário compartilhado: todo mundo ativo lê.
create policy categorias_ver on public.categorias_financeiras
  for select to authenticated
  using (public.usuario_ativo());

create policy categorias_escrever on public.categorias_financeiras
  for all to authenticated
  using (public.pode_editar('receitas') or public.pode_editar('despesas'))
  with check (public.pode_editar('receitas') or public.pode_editar('despesas'));

create policy anexos_ver on public.documentos_anexos
  for select to authenticated
  using (public.pode_ver(public.modulo_da_entidade(entidade_tipo)));

create policy anexos_escrever on public.documentos_anexos
  for all to authenticated
  using (public.pode_editar(public.modulo_da_entidade(entidade_tipo)))
  with check (public.pode_editar(public.modulo_da_entidade(entidade_tipo)));

-- 4.7 Auditoria ------------------------------------------------------------------
-- Só leitura, só administrador. A escrita é do gatilho, que é security definer
-- e não passa por política. Sem UPDATE e sem DELETE: trilha não se reescreve.

create policy logs_ver on public.logs_atividade
  for select to authenticated
  using (public.eh_administrador());
