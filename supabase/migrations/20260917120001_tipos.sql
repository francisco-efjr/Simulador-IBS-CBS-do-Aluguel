-- =============================================================================
-- 01 — Tipos enumerados
--
-- Cada select do PocketBase vira um enum do Postgres: o banco passa a recusar
-- valor fora da lista, coisa que hoje só a tela impede.
-- Origem dos valores: src/lib/pocketbase/schema.json.
-- =============================================================================

-- Identidade e autorização -----------------------------------------------------
create type public.perfil_usuario as enum ('administrador', 'usuario');

create type public.nivel_permissao as enum ('sem_acesso', 'visualizacao', 'edicao');

create type public.modulo_permissao as enum (
  'imoveis',
  'inquilinos',
  'fornecedores',
  'contratos',
  'receitas',
  'despesas',
  'iptu_taxas',
  'dashboards',
  'alertas',
  'relatorios',
  'importar_extrato',
  'classificar_transacoes'
);

create type public.convite_status as enum ('pendente', 'aceito', 'cancelado', 'expirado');

-- Cadastros --------------------------------------------------------------------
create type public.cadastro_status as enum ('ativo', 'inativo');

create type public.pessoa_tipo as enum ('pf', 'pj');

create type public.imovel_tipo as enum (
  'casa',
  'apartamento',
  'sala_comercial',
  'loja',
  'galpao',
  'terreno',
  'outro'
);

create type public.imovel_status as enum ('vago', 'alugado', 'em_manutencao', 'inativo');

create type public.fornecedor_tipo as enum (
  'eletricista',
  'encanador',
  'pedreiro',
  'pintor',
  'empresa_manutencao',
  'empresa_limpeza',
  'seguradora',
  'condominio',
  'outros'
);

-- Contratos --------------------------------------------------------------------
create type public.contrato_status as enum ('ativo', 'encerrado', 'cancelado');

create type public.garantia_tipo as enum (
  'caução',
  'fiador',
  'seguro-fiança',
  'título de capitalização',
  'sem garantia',
  'outros'
);

-- Financeiro -------------------------------------------------------------------
create type public.categoria_tipo as enum ('receita', 'despesa');

create type public.receita_status_financeiro as enum ('previsto', 'recebido', 'em_atraso', 'parcial');

create type public.despesa_status_financeiro as enum ('previsto', 'pago', 'em_atraso', 'parcial');

create type public.iptu_tipo as enum (
  'iptu',
  'taxa_condominio',
  'seguro',
  'taxa_municipal',
  'taxa_extraordinaria',
  'outro'
);

create type public.iptu_status as enum ('pago', 'pendente', 'vencido');

-- Conciliação bancária ---------------------------------------------------------
create type public.conta_tipo as enum (
  'Conta Corrente',
  'Conta Poupança',
  'Conta Investimento',
  'Outros'
);

create type public.importacao_formato as enum ('csv', 'ofx');

create type public.importacao_status as enum ('pendente', 'concluida', 'parcial');

create type public.transacao_tipo as enum ('credito', 'debito');

-- Anexos e auditoria -----------------------------------------------------------
create type public.entidade_anexo as enum (
  'imovel',
  'inquilino',
  'contrato',
  'fornecedor',
  'despesa',
  'receita',
  'iptu_taxas'
);

create type public.acao_auditoria as enum ('criou', 'editou', 'excluiu');
