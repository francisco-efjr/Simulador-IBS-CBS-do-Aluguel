-- =============================================================================
-- 08 — Regras de negócio no banco
--
-- Três regras que até aqui só a tela conferia — quando conferia — e que agora
-- valem para toda porta de entrada:
--   · um imóvel não tem dois contratos ativos no mesmo período
--   · imóvel ou inquilino com contrato ativo não é inativado nem excluído
--   · CPF, CNPJ, e-mail e datas são validados na borda  ............. (S-06)
--
-- Idempotente: pode ser rodada de novo inteira no SQL Editor. Cada restrição é
-- removida (se existir) e recriada; cada função é create or replace.
--
-- Os nomes das restrições são lidos por src/lib/dados/erros.ts para traduzir a
-- recusa numa mensagem embaixo do campo certo. Renomear aqui exige renomear lá.
-- =============================================================================

-- 8.1 Um contrato ativo por imóvel no mesmo período ----------------------------
-- O gatilho sincronizar_imovel (03) já supõe isso: ao encerrar um contrato, só
-- libera o imóvel se nenhum outro ativo restar. Mas nada impedia dois ativos
-- sobrepostos, e aí inquilino_atual ficava com quem foi salvo por último.
--
-- Contrato futuro já assinado continua permitido: o que se recusa é sobreposição
-- de vigência. Sem data de início, o contrato vale desde sempre; sem data de
-- fim, para sempre — o lado conservador, porque o cadastro incompleto não pode
-- abrir brecha. Intervalo fechado nas duas pontas: quem termina no dia 31 e
-- quem começa no dia 31 se sobrepõem.
--
-- No Supabase as extensões moram no esquema "extensions". A classe de operador
-- do uuid é achada pelo tipo, não pelo search_path, então a restrição funciona
-- de qualquer esquema.

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

alter table public.contratos drop constraint if exists contratos_um_ativo_por_imovel;

alter table public.contratos
  add constraint contratos_um_ativo_por_imovel
  exclude using gist (
    imovel with =,
    daterange(
      coalesce(data_inicio, '-infinity'::date),
      coalesce(data_fim, 'infinity'::date),
      '[]'
    ) with &&
  )
  where (status = 'ativo');

-- 8.2 Inativar ou excluir só sem contrato ativo ---------------------------------
-- Inativar um imóvel alugado deixava o contrato ativo apontando para algo que a
-- tela já não lista; inativar o inquilino, idem. Excluir já era barrado pela
-- chave estrangeira (on delete restrict), mas com a mensagem genérica de
-- "registro ligado a outro" — aqui a recusa diz o motivo e o que fazer.
--
-- security definer porque quem edita imóveis pode não ter permissão de ver
-- contratos: pela RLS a consulta voltaria vazia e a regra seria contornada.
--
-- errcode HA001 (classe própria "HA", de Holding Aguiar): distingue esta recusa
-- das do Postgres sem colidir com os códigos PTxxx, que o PostgREST usa para
-- escolher o status HTTP.

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
  if tg_op = 'UPDATE' then
    -- Só a passagem para inativo interessa; o resto da edição segue livre.
    if new.status::text <> 'inativo' or old.status::text = 'inativo' then
      return new;
    end if;
    v_acao := 'inativado';
  else
    v_acao := 'excluído';
  end if;

  if tg_table_name = 'imoveis' then
    v_quem := 'Este imóvel';
    select coalesce(nullif(c.numero, ''), 'sem número') into v_contrato
      from public.contratos c
     where c.imovel = old.id and c.status = 'ativo'
     order by c.data_inicio nulls first
     limit 1;
  else
    v_quem := 'Este inquilino';
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

drop trigger if exists impedir_inativar_com_contrato_ativo on public.imoveis;
create trigger impedir_inativar_com_contrato_ativo
  before update of status or delete on public.imoveis
  for each row execute function public.tg_impedir_inativar_com_contrato_ativo();

drop trigger if exists impedir_inativar_com_contrato_ativo on public.inquilinos;
create trigger impedir_inativar_com_contrato_ativo
  before update of status or delete on public.inquilinos
  for each row execute function public.tg_impedir_inativar_com_contrato_ativo();

-- 8.3 CPF e CNPJ com dígito verificador (S-06) ----------------------------------
-- Aceitam com ou sem máscara ("123.456.789-09" ou "12345678909"), mas recusam
-- qualquer outro caractere: "123abc" não vira "123" por limpeza silenciosa.
--
-- O CNPJ já segue o formato alfanumérico da Receita Federal (IN RFB 2.229/2024,
-- emitido desde julho de 2026): as 12 primeiras posições podem ter letras, que
-- entram no cálculo pelo código ASCII menos 48; os dois dígitos verificadores
-- continuam numéricos. Para um CNPJ só de números, o cálculo é o de sempre.
--
-- immutable: o resultado depende só da entrada, o que permite usá-las em CHECK
-- e em índice.

create or replace function public.cpf_valido(p_valor text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_digitos text;
  v_soma    integer;
  v_dv      integer;
begin
  if p_valor is null then
    return null;
  end if;
  if p_valor !~ '^[0-9.[:space:]-]+$' then
    return false;
  end if;

  v_digitos := regexp_replace(p_valor, '[^0-9]', '', 'g');
  -- 000.000.000-00, 111.111.111-11… passam na conta e não existem.
  if length(v_digitos) <> 11 or v_digitos ~ '^(.)\1{10}$' then
    return false;
  end if;

  -- 10º dígito: pesos 10..2 sobre os 9 primeiros; 11º: pesos 11..2 sobre os 10.
  for v_pos in 10..11 loop
    v_soma := 0;
    for i in 1..v_pos - 1 loop
      v_soma := v_soma + substr(v_digitos, i, 1)::integer * (v_pos + 1 - i);
    end loop;
    v_dv := (v_soma * 10) % 11 % 10;  -- resto 10 vira 0
    if v_dv <> substr(v_digitos, v_pos, 1)::integer then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

create or replace function public.cnpj_valido(p_valor text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_base text;
  v_soma integer;
  v_dv   integer;
begin
  if p_valor is null then
    return null;
  end if;
  if p_valor !~ '^[0-9A-Za-z./[:space:]-]+$' then
    return false;
  end if;

  v_base := upper(regexp_replace(p_valor, '[^0-9A-Za-z]', '', 'g'));
  if v_base !~ '^[0-9A-Z]{12}[0-9]{2}$' or v_base ~ '^(.)\1{13}$' then
    return false;
  end if;

  -- 13º dígito: pesos 5,4,3,2,9,8,7,6,5,4,3,2; 14º: 6,5,4,3,2,9,8,7,6,5,4,3,2.
  -- Nos dois casos, da direita para a esquerda o peso vai de 2 a 9 e recomeça.
  for v_pos in 13..14 loop
    v_soma := 0;
    for i in 1..v_pos - 1 loop
      v_soma := v_soma + (ascii(substr(v_base, i, 1)) - 48) * (2 + (v_pos - 1 - i) % 8);
    end loop;
    v_dv := v_soma % 11;
    v_dv := case when v_dv < 2 then 0 else 11 - v_dv end;
    if v_dv <> substr(v_base, v_pos, 1)::integer then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

-- Para a coluna que aceita os dois (fornecedores.cnpj_cpf): decide pelo tamanho.
create or replace function public.cpf_cnpj_valido(p_valor text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case length(regexp_replace(p_valor, '[^0-9A-Za-z]', '', 'g'))
    when 11 then public.cpf_valido(p_valor)
    when 14 then public.cnpj_valido(p_valor)
    else case when p_valor is null then null else false end
  end;
$$;

-- Vazio continua aceito: o inquilino PF não tem CNPJ, o PJ não tem CPF, e o
-- cadastro pode nascer incompleto. O que não entra é documento inválido.

alter table public.inquilinos drop constraint if exists inquilinos_cpf_valido;
alter table public.inquilinos
  add constraint inquilinos_cpf_valido
  check (cpf is null or btrim(cpf) = '' or public.cpf_valido(cpf));

alter table public.inquilinos drop constraint if exists inquilinos_cnpj_valido;
alter table public.inquilinos
  add constraint inquilinos_cnpj_valido
  check (cnpj is null or btrim(cnpj) = '' or public.cnpj_valido(cnpj));

alter table public.fornecedores drop constraint if exists fornecedores_cnpj_cpf_valido;
alter table public.fornecedores
  add constraint fornecedores_cnpj_cpf_valido
  check (cnpj_cpf is null or btrim(cnpj_cpf) = '' or public.cpf_cnpj_valido(cnpj_cpf));

-- 8.4 E-mail com formato mínimo (S-06) ------------------------------------------
-- Só o esqueleto "algo@algo.algo", sem espaço. Validar de verdade é mandar
-- e-mail; aqui o objetivo é barrar o telefone digitado no campo errado.

alter table public.inquilinos drop constraint if exists inquilinos_email_valido;
alter table public.inquilinos
  add constraint inquilinos_email_valido
  check (email is null or btrim(email) = '' or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

alter table public.fornecedores drop constraint if exists fornecedores_email_valido;
alter table public.fornecedores
  add constraint fornecedores_email_valido
  check (email is null or btrim(email) = '' or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

-- 8.5 Datas plausíveis e coerentes ----------------------------------------------
-- Valores negativos já eram recusados desde a 02 em receitas, despesas,
-- iptu_taxas e contratos. Faltavam as datas: um "0226-05-10" digitado às pressas
-- entrava e sumia de todo filtro por período. O intervalo é o mesmo já usado em
-- iptu_taxas.ano_referencia (1900 a 2200).
--
-- Uma restrição por coluna, com o nome <tabela>_<coluna>_plausivel, para que a
-- tela saiba embaixo de qual campo mostrar a mensagem.

do $$
declare
  v_par    text[];
  v_nome   text;
  v_colunas text[][] := array[
    array['receitas',   'data'],
    array['receitas',   'data_vencimento'],
    array['receitas',   'data_recebimento'],
    array['despesas',   'data'],
    array['despesas',   'data_vencimento'],
    array['despesas',   'data_pagamento'],
    array['iptu_taxas', 'vencimento'],
    array['iptu_taxas', 'data_pagamento'],
    array['contratos',  'data_inicio'],
    array['contratos',  'data_fim'],
    array['contratos',  'proxima_data_reajuste']
  ];
begin
  foreach v_par slice 1 in array v_colunas loop
    v_nome := format('%s_%s_plausivel', v_par[1], v_par[2]);
    execute format('alter table public.%I drop constraint if exists %I', v_par[1], v_nome);
    execute format(
      'alter table public.%I add constraint %I
         check (%I is null or %I between date %L and date %L)',
      v_par[1], v_nome, v_par[2], v_par[2], '1900-01-01', '2200-12-31');
  end loop;
end;
$$;

-- Reajuste antes do início do contrato não existe.
alter table public.contratos drop constraint if exists contratos_reajuste_coerente;
alter table public.contratos
  add constraint contratos_reajuste_coerente
  check (proxima_data_reajuste is null or data_inicio is null or proxima_data_reajuste >= data_inicio);

-- Contadores da importação: nunca abaixo de zero. A soma contra o total fica de
-- fora de propósito — a tela atualiza um contador por vez, e uma checagem
-- cruzada recusaria estados intermediários legítimos.
alter table public.importacoes drop constraint if exists importacoes_contagens_nao_negativas;
alter table public.importacoes
  add constraint importacoes_contagens_nao_negativas
  check (total_transacoes >= 0 and transacoes_classificadas >= 0 and transacoes_ignoradas >= 0);
