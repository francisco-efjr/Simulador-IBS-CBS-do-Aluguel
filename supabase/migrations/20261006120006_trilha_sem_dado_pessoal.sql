-- =============================================================================
-- 20261006120006 — A trilha de auditoria não guarda dado pessoal em claro (SEG-04)
-- =============================================================================
--
-- `tg_registrar_log` gravava em `logs_atividade.payload`, campo a campo, o
-- valor de antes e o de depois de TUDO que mudava: CPF/CNPJ, RG, dados
-- bancários, endereço, telefone, e-mail e até o token de convite. A trilha não
-- tem UPDATE nem DELETE (de propósito: não se reescreve auditoria), então era
-- uma segunda cópia permanente de dado pessoal e bancário, legível por qualquer
-- administrador e transmitida pelo Realtime — e sem como atender o direito de
-- eliminação do titular (LGPD, art. 18, VI). Provado pela QA em 06/10/2026.
--
-- A trilha precisa dizer QUE o campo mudou, quem mudou e quando; não precisa
-- repetir o valor. Para os campos da lista abaixo o payload passa a ser
-- `{"alterado": true}` no lugar de `{"de": ..., "para": ...}`. Os demais campos
-- seguem com de/para. O valor verdadeiro continua na própria tabela, sob RLS.
--
-- O rótulo da linha de log (`detalhes`, ex.: 'editou locadores "Fulano"') segue
-- como estava: ele identifica o registro pelo nome, sem documento nem contato.
--
-- A seção 3 aplica a mesma máscara ao que JÁ está gravado. É irreversível: o
-- valor antigo some da trilha. É o objetivo — ele continua em quem o cadastrou,
-- e o histórico do que mudou fica.
--
-- Pode ser rodada de novo sem erro (mascarar o que já está mascarado não muda nada).

-- 1. Lista de colunas sensíveis, num lugar só ----------------------------------
-- Casa pelo NOME da coluna, em qualquer tabela. Ao criar tabela ou coluna com
-- dado pessoal, acrescente o nome aqui; o teste de regressão
-- (supabase/tests/seguranca_qa.test.ts) confere as colunas atuais.
--
-- `endereco` também mascara o endereço do imóvel (`imoveis.endereco`): a trilha
-- diz que mudou, o valor está na tabela.

create or replace function public.colunas_sensiveis_do_log()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    -- Identificação da pessoa
    'cpf', 'cnpj', 'cpf_cnpj', 'cnpj_cpf', 'rg', 'data_nascimento',
    'conjuge_nome', 'conjuge_cpf', 'estado_civil', 'responsavel',
    -- Contato
    'email', 'telefone', 'contato',
    -- Endereço
    'endereco', 'endereco_completo', 'endereco_secundario', 'endereco_secundario_origem',
    -- Dados bancários (locadores.dados_bancarios; contas_bancarias.agencia/conta)
    'dados_bancarios', 'agencia', 'conta',
    -- Segredo: o token de convite dá acesso a uma conta
    'token'
  ]::text[];
$$;

-- Só os gatilhos (security definer) e a migração usam.
revoke all on function public.colunas_sensiveis_do_log() from public, anon, authenticated;

-- 2. Gatilho de auditoria -----------------------------------------------------
-- Idêntico ao de 20261005120002, trocando apenas a montagem do payload.

create or replace function public.tg_registrar_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entidade  text := tg_argv[0];
  v_linha     jsonb;
  v_acao      public.acao_auditoria;
  v_rotulo    text;
  v_pessoa    text;
  v_payload   jsonb;
  v_sensiveis text[] := public.colunas_sensiveis_do_log();
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
             case
               when novo.key = any (v_sensiveis)
                 then jsonb_build_object('alterado', true)
               else jsonb_build_object('de', to_jsonb(old) -> novo.key, 'para', novo.value)
             end
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

-- 3. O que já está gravado ----------------------------------------------------
-- Troca o de/para das colunas sensíveis por {"alterado": true}, preservando as
-- demais chaves do payload. Roda como dono da tabela (fora da RLS, que não tem
-- UPDATE em logs_atividade de propósito).

update public.logs_atividade l
   set payload = (
         select jsonb_object_agg(
                  e.key,
                  case
                    when e.key = any (public.colunas_sensiveis_do_log())
                      then jsonb_build_object('alterado', true)
                    else e.value
                  end)
           from jsonb_each(l.payload) as e
       )
 where jsonb_typeof(l.payload) = 'object'
   and l.payload ?| public.colunas_sensiveis_do_log()
   and exists (
         select 1
           from jsonb_each(l.payload) as e
          where e.key = any (public.colunas_sensiveis_do_log())
            and e.value is distinct from '{"alterado": true}'::jsonb
       );
