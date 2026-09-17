-- =============================================================================
-- 02 — Tabelas, chaves e índices
--
-- Espelha as 16 coleções do PocketBase, com quatro correções deliberadas:
--   · dinheiro em numeric(14,2), não float  ......................... (RD-01)
--   · índice único parcial também para o CNPJ do inquilino  .......... (RD-04)
--   · vínculos da conciliação viram chave estrangeira de verdade  .... (RD-08)
--   · logs ganham payload estruturado ao lado da prosa  .............. (RD-09)
--
-- Os nomes de tabela e de coluna são os mesmos do PocketBase (created,
-- updated, created_by…) para que os serviços do frontend mudem de cliente
-- sem mudar de vocabulário.
-- =============================================================================

-- 2.1 Identidade ---------------------------------------------------------------

-- Perfil da pessoa. A senha, o e-mail verificado e a sessão ficam em auth.users,
-- do Supabase: some daqui a coleção password_resets, e com ela o vazamento de
-- token descrito no achado S-01.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  avatar text,
  perfil public.perfil_usuario not null default 'usuario',
  ativo boolean not null default true,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

comment on table public.users is 'Perfil de aplicação. Credenciais e sessão vivem em auth.users.';

create unique index users_email_uidx on public.users (lower(email));
create index users_perfil_idx on public.users (perfil);

-- Permissão por módulo, uma linha por par. Era um blob JSON dentro do usuário —
-- cômodo para o menu e ilegível para o banco, que por isso não conseguia
-- autorizar nada (achado S-02). Normalizada, ela alimenta as políticas de RLS.
create table public.permissoes (
  id uuid primary key default gen_random_uuid(),
  usuario uuid not null references public.users (id) on delete cascade,
  modulo public.modulo_permissao not null,
  nivel public.nivel_permissao not null default 'sem_acesso',
  created timestamptz not null default now(),
  updated timestamptz not null default now(),
  unique (usuario, modulo)
);

create index permissoes_usuario_idx on public.permissoes (usuario);

-- 2.2 Cadastros ----------------------------------------------------------------

create table public.inquilinos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_pessoa public.pessoa_tipo not null default 'pf',
  cpf text,
  rg text,
  data_nascimento date,
  cnpj text,
  nome_fantasia text,
  responsavel text,
  email text,
  telefone text,
  endereco text,
  observacoes text,
  status public.cadastro_status not null default 'ativo',
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

-- Únicos parciais: barram duplicidade sem impedir cadastro incompleto.
create unique index inquilinos_cpf_uidx on public.inquilinos (cpf) where cpf is not null and cpf <> '';
create unique index inquilinos_cnpj_uidx on public.inquilinos (cnpj) where cnpj is not null and cnpj <> '';
create index inquilinos_status_idx on public.inquilinos (status);
create index inquilinos_created_idx on public.inquilinos (created desc);

create table public.imoveis (
  id uuid primary key default gen_random_uuid(),
  codigo text,
  nome text,
  endereco text not null,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text check (estado is null or estado = '' or char_length(estado) = 2),
  cep text,
  matricula text,
  inscricao_imobiliaria text,
  tipo public.imovel_tipo not null default 'outro',
  status public.imovel_status not null default 'vago',
  area numeric(10, 2) check (area is null or area >= 0),
  quartos smallint check (quartos is null or quartos >= 0),
  banheiros smallint check (banheiros is null or banheiros >= 0),
  vagas smallint check (vagas is null or vagas >= 0),
  valor numeric(14, 2) check (valor is null or valor >= 0),
  valor_estimado numeric(14, 2) check (valor_estimado is null or valor_estimado >= 0),
  fotos text[] not null default '{}',
  observacoes text,
  -- Cache do contrato ativo, mantido por gatilho. Nunca é fonte da verdade (RD-03).
  inquilino_atual uuid references public.inquilinos (id) on delete set null,
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create unique index imoveis_codigo_uidx on public.imoveis (codigo) where codigo is not null and codigo <> '';
create index imoveis_status_idx on public.imoveis (status);
create index imoveis_created_idx on public.imoveis (created desc);
create index imoveis_created_by_idx on public.imoveis (created_by);
create index imoveis_inquilino_atual_idx on public.imoveis (inquilino_atual);

create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nome_fantasia text,
  cnpj_cpf text,
  tipo_fornecedor public.fornecedor_tipo not null default 'outros',
  contato text,
  email text,
  telefone text,
  endereco text,
  servicos_prestados text,
  observacoes text,
  status public.cadastro_status not null default 'ativo',
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create unique index fornecedores_documento_uidx
  on public.fornecedores (cnpj_cpf) where cnpj_cpf is not null and cnpj_cpf <> '';
create index fornecedores_status_idx on public.fornecedores (status);

create table public.categorias_financeiras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo public.categoria_tipo not null,
  status public.cadastro_status not null default 'ativo',
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now(),
  unique (nome, tipo)
);

create index categorias_financeiras_tipo_idx on public.categorias_financeiras (tipo);
create index categorias_financeiras_status_idx on public.categorias_financeiras (status);

-- 2.3 Contratos ----------------------------------------------------------------

create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  numero text,
  imovel uuid not null references public.imoveis (id) on delete restrict,
  inquilino uuid not null references public.inquilinos (id) on delete restrict,
  data_inicio date,
  data_fim date,
  valor_aluguel numeric(14, 2) check (valor_aluguel is null or valor_aluguel >= 0),
  dia_vencimento smallint check (dia_vencimento is null or dia_vencimento between 1 and 31),
  indice_reajuste text,
  periodicidade_reajuste text,
  proxima_data_reajuste date,
  tipo_garantia public.garantia_tipo,
  valor_garantia numeric(14, 2) check (valor_garantia is null or valor_garantia >= 0),
  documento text,
  observacoes text,
  status public.contrato_status not null default 'ativo',
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now(),
  constraint contratos_vigencia_coerente check (data_fim is null or data_inicio is null or data_fim >= data_inicio)
);

create unique index contratos_numero_uidx on public.contratos (numero) where numero is not null and numero <> '';
create index contratos_imovel_idx on public.contratos (imovel);
create index contratos_inquilino_idx on public.contratos (inquilino);
create index contratos_status_idx on public.contratos (status);
create index contratos_data_fim_idx on public.contratos (data_fim);
create index contratos_created_idx on public.contratos (created desc);

-- 2.4 Financeiro ---------------------------------------------------------------

create table public.receitas (
  id uuid primary key default gen_random_uuid(),
  imovel uuid not null references public.imoveis (id) on delete restrict,
  contrato uuid references public.contratos (id) on delete set null,
  inquilino uuid references public.inquilinos (id) on delete set null,
  categoria uuid references public.categorias_financeiras (id) on delete set null,
  descricao text,
  competencia text check (competencia is null or competencia ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  valor numeric(14, 2) check (valor is null or valor >= 0),
  valor_previsto numeric(14, 2) check (valor_previsto is null or valor_previsto >= 0),
  valor_recebido numeric(14, 2) check (valor_recebido is null or valor_recebido >= 0),
  data date,
  data_vencimento date,
  data_recebimento date,
  status_financeiro public.receita_status_financeiro not null default 'previsto',
  status public.cadastro_status not null default 'ativo',
  forma_recebimento text,
  observacoes text,
  transacao_importada_id uuid,
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create index receitas_imovel_idx on public.receitas (imovel);
create index receitas_contrato_idx on public.receitas (contrato);
create index receitas_categoria_idx on public.receitas (categoria);
create index receitas_inquilino_idx on public.receitas (inquilino);
create index receitas_data_idx on public.receitas (data desc);
create index receitas_status_idx on public.receitas (status);
create index receitas_status_financeiro_idx on public.receitas (status_financeiro);
create index receitas_data_vencimento_idx on public.receitas (data_vencimento);
create index receitas_competencia_idx on public.receitas (competencia);

create table public.despesas (
  id uuid primary key default gen_random_uuid(),
  imovel uuid not null references public.imoveis (id) on delete restrict,
  fornecedor uuid references public.fornecedores (id) on delete set null,
  categoria uuid references public.categorias_financeiras (id) on delete set null,
  descricao text,
  competencia text check (competencia is null or competencia ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  valor numeric(14, 2) check (valor is null or valor >= 0),
  valor_previsto numeric(14, 2) check (valor_previsto is null or valor_previsto >= 0),
  valor_pago numeric(14, 2) check (valor_pago is null or valor_pago >= 0),
  data date,
  data_vencimento date,
  data_pagamento date,
  status_financeiro public.despesa_status_financeiro not null default 'previsto',
  status public.cadastro_status not null default 'ativo',
  forma_pagamento text,
  observacoes text,
  transacao_importada_id uuid,
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create index despesas_imovel_idx on public.despesas (imovel);
create index despesas_fornecedor_idx on public.despesas (fornecedor);
create index despesas_categoria_idx on public.despesas (categoria);
create index despesas_data_idx on public.despesas (data desc);
create index despesas_status_idx on public.despesas (status);
create index despesas_status_financeiro_idx on public.despesas (status_financeiro);
create index despesas_data_vencimento_idx on public.despesas (data_vencimento);
create index despesas_competencia_idx on public.despesas (competencia);

create table public.iptu_taxas (
  id uuid primary key default gen_random_uuid(),
  imovel uuid not null references public.imoveis (id) on delete restrict,
  tipo public.iptu_tipo not null default 'iptu',
  descricao text,
  ano_referencia smallint check (ano_referencia is null or ano_referencia between 1900 and 2200),
  valor numeric(14, 2) check (valor is null or valor >= 0),
  vencimento date,
  data_pagamento date,
  forma_pagamento text,
  comprovante text,
  observacoes text,
  status public.iptu_status not null default 'pendente',
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create index iptu_taxas_imovel_idx on public.iptu_taxas (imovel);
create index iptu_taxas_status_idx on public.iptu_taxas (status);
create index iptu_taxas_vencimento_idx on public.iptu_taxas (vencimento);
create index iptu_taxas_ano_idx on public.iptu_taxas (ano_referencia);

-- 2.5 Conciliação bancária -----------------------------------------------------

create table public.contas_bancarias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  banco text,
  agencia text,
  conta text,
  tipo public.conta_tipo not null default 'Conta Corrente',
  saldo_inicial numeric(14, 2) not null default 0,
  ativo boolean not null default true,
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

comment on column public.contas_bancarias.agencia is 'Dado sensível (RD-07): mascarar na tela e nos logs.';
comment on column public.contas_bancarias.conta is 'Dado sensível (RD-07): mascarar na tela e nos logs.';

create index contas_bancarias_ativo_idx on public.contas_bancarias (ativo);
create index contas_bancarias_created_idx on public.contas_bancarias (created desc);

create table public.importacoes (
  id uuid primary key default gen_random_uuid(),
  conta_bancaria uuid not null references public.contas_bancarias (id) on delete restrict,
  arquivo_nome text not null,
  formato public.importacao_formato not null,
  data_importacao timestamptz not null default now(),
  total_transacoes integer not null default 0,
  transacoes_classificadas integer not null default 0,
  transacoes_ignoradas integer not null default 0,
  status public.importacao_status not null default 'pendente',
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create index importacoes_conta_idx on public.importacoes (conta_bancaria);
create index importacoes_status_idx on public.importacoes (status);
create index importacoes_created_idx on public.importacoes (created desc);

create table public.transacoes_importadas (
  id uuid primary key default gen_random_uuid(),
  importacao uuid not null references public.importacoes (id) on delete cascade,
  data date not null,
  descricao text not null,
  valor numeric(14, 2) not null,
  tipo public.transacao_tipo not null,
  saldo numeric(14, 2),
  classificada boolean not null default false,
  ignorada boolean not null default false,
  duplicata_detectada boolean not null default false,
  duplicata_ids jsonb not null default '[]'::jsonb,
  -- Sugestão do motor de classificação.
  sugestao_tipo public.categoria_tipo,
  sugestao_categoria text,
  sugestao_categoria_id uuid references public.categorias_financeiras (id) on delete set null,
  sugestao_imovel text,
  sugestao_imovel_id uuid references public.imoveis (id) on delete set null,
  sugestao_confianca numeric(4, 3) check (sugestao_confianca is null or sugestao_confianca between 0 and 1),
  -- Resultado da classificação. Eram campos text soltos: agora o banco garante
  -- que apontam para algo que existe (RD-08).
  categoria_classificada uuid references public.categorias_financeiras (id) on delete set null,
  imovel_classificado uuid references public.imoveis (id) on delete set null,
  receita_gerada uuid references public.receitas (id) on delete set null,
  despesa_gerada uuid references public.despesas (id) on delete set null,
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create index transacoes_importacao_idx on public.transacoes_importadas (importacao);
create index transacoes_data_idx on public.transacoes_importadas (data desc);
create index transacoes_classificada_idx on public.transacoes_importadas (classificada);
create index transacoes_ignorada_idx on public.transacoes_importadas (ignorada);

-- Fecha o vínculo de mão dupla com a conciliação (o outro lado já é FK acima).
alter table public.receitas
  add constraint receitas_transacao_fk
  foreign key (transacao_importada_id) references public.transacoes_importadas (id) on delete set null;

alter table public.despesas
  add constraint despesas_transacao_fk
  foreign key (transacao_importada_id) references public.transacoes_importadas (id) on delete set null;

-- 2.6 Anexos, convites e auditoria ---------------------------------------------

create table public.documentos_anexos (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo public.entidade_anexo not null,
  -- Polimórfico: não há FK possível. A integridade fica com a aplicação (RD-08).
  entidade_id uuid not null,
  arquivo text not null,
  descricao text,
  status public.cadastro_status not null default 'ativo',
  created_by uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create index documentos_anexos_entidade_idx on public.documentos_anexos (entidade_tipo, entidade_id);

create table public.convites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  perfil public.perfil_usuario not null default 'usuario',
  status public.convite_status not null default 'pendente',
  data_expiracao timestamptz not null,
  criado_por uuid references public.users (id) on delete set null,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create index convites_email_idx on public.convites (lower(email));
create index convites_status_idx on public.convites (status);
create index convites_expiracao_idx on public.convites (data_expiracao);

-- Escrita exclusiva dos gatilhos de auditoria. Ninguém edita nem apaga (ver RLS).
create table public.logs_atividade (
  id uuid primary key default gen_random_uuid(),
  usuario uuid references public.users (id) on delete set null,
  acao public.acao_auditoria not null,
  entidade text not null,
  registro_id uuid,
  detalhes text,
  -- Prosa continua legível na tela; o payload dá consulta e diff (RD-09).
  payload jsonb,
  created timestamptz not null default now()
);

create index logs_usuario_idx on public.logs_atividade (usuario);
create index logs_acao_idx on public.logs_atividade (acao);
create index logs_entidade_idx on public.logs_atividade (entidade, registro_id);
create index logs_created_idx on public.logs_atividade (created desc);
