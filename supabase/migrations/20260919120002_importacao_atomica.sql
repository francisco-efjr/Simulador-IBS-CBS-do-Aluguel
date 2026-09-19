-- =============================================================================
-- Importação de extrato atômica
--
-- Até aqui o navegador gravava a importação e depois cada transação numa
-- requisição própria. Se a conexão caísse no meio, ficava no banco uma
-- importação pela metade, com total_transacoes dizendo uma coisa e a tabela
-- dizendo outra (problema 2 do ADR-0006).
--
-- Esta função recebe o lote inteiro e grava tudo numa única transação do
-- Postgres: ou a importação e todas as suas transações existem, ou nenhuma
-- linha dela existe.
--
-- O parsing do arquivo, a detecção de duplicata e a sugestão de classificação
-- continuam no navegador (ver a nota de 19/09/2026 no ADR-0006).
-- =============================================================================

create or replace function public.importar_extrato(p_importacao jsonb, p_transacoes jsonb)
returns uuid
language plpgsql
-- security invoker de propósito: cada insert passa pela RLS com a permissão de
-- quem chama. Gravar a importação exige 'edicao' em importar_extrato; gravar as
-- transações, 'edicao' em classificar_transacoes — exatamente como antes, quando
-- o navegador inseria direto nas tabelas.
security invoker
set search_path = ''
as $$
declare
  -- Um extrato mensal típico tem dezenas ou poucas centenas de linhas. O teto
  -- protege o banco de um corpo de requisição gigante, não o uso normal.
  c_limite constant integer := 5000;
  v_total        integer;
  v_linha        bigint;
  v_arquivo      text;
  v_importacao   uuid;
begin
  -- 1. Forma do pedido --------------------------------------------------------
  if p_importacao is null or jsonb_typeof(p_importacao) <> 'object' then
    raise exception 'Os dados da importação não chegaram completos. Tente novamente.'
      using errcode = '22023';
  end if;

  if p_transacoes is null or jsonb_typeof(p_transacoes) <> 'array' then
    raise exception 'A lista de transações não chegou completa. Tente novamente.'
      using errcode = '22023';
  end if;

  v_total := jsonb_array_length(p_transacoes);

  if v_total = 0 then
    raise exception 'Selecione ao menos uma transação para importar.'
      using errcode = '22023';
  end if;

  if v_total > c_limite then
    raise exception 'O extrato tem % transações, e o limite por importação é de %. Divida o arquivo por período e importe cada parte.',
      v_total, c_limite
      using errcode = '54000';
  end if;

  if nullif(p_importacao ->> 'conta_bancaria', '') is null then
    raise exception 'Selecione uma conta bancária de origem.'
      using errcode = '22023';
  end if;

  -- Conta apagada entre abrir a tela e confirmar cairia na chave estrangeira,
  -- cuja mensagem fala em "remover registro ligado" — que não é o caso aqui.
  -- A consulta passa pela RLS: quem não enxerga a conta também cai aqui.
  if not exists (
    select 1 from public.contas_bancarias c
     where c.id = (p_importacao ->> 'conta_bancaria')::uuid
  ) then
    raise exception 'A conta bancária selecionada não foi encontrada ou você não tem acesso a ela. Atualize a página e escolha a conta de novo.'
      using errcode = '22023';
  end if;

  v_arquivo := nullif(btrim(p_importacao ->> 'arquivo_nome'), '');
  if v_arquivo is null then
    raise exception 'O nome do arquivo importado não foi informado.'
      using errcode = '22023';
  end if;

  -- Linha incompleta é recusada antes de gravar qualquer coisa, apontando a
  -- posição no lote — mais útil que o "null value in column" do Postgres.
  select min(e.ordem)
    into v_linha
    from jsonb_array_elements(p_transacoes) with ordinality as e(tx, ordem)
   where jsonb_typeof(e.tx) <> 'object'
      or nullif(e.tx ->> 'data', '') is null
      or nullif(btrim(e.tx ->> 'descricao'), '') is null
      or nullif(e.tx ->> 'valor', '') is null
      or nullif(e.tx ->> 'tipo', '') is null;

  if v_linha is not null then
    raise exception 'A transação nº % do extrato está incompleta: data, descrição, valor e tipo são obrigatórios.',
      v_linha
      using errcode = '22023';
  end if;

  -- 2. Gravação ---------------------------------------------------------------
  -- Do cliente vem só o que ele sabe: conta, arquivo e formato. Data, contadores
  -- e status nascem aqui, e não podem ser forjados no corpo da requisição.
  insert into public.importacoes (
    conta_bancaria, arquivo_nome, formato, data_importacao,
    total_transacoes, transacoes_classificadas, transacoes_ignoradas, status
  )
  values (
    (p_importacao ->> 'conta_bancaria')::uuid,
    v_arquivo,
    (p_importacao ->> 'formato')::public.importacao_formato,
    now(),
    v_total, 0, 0, 'pendente'
  )
  returning id into v_importacao;

  -- Toda transação nasce pendente: classificada, ignorada e os vínculos com
  -- receita/despesa não são aceitos do cliente — isso é trabalho da tela de
  -- classificação. A duplicata e a sugestão vêm do motor do navegador e ficam
  -- gravadas como estão, porque são consultivas.
  insert into public.transacoes_importadas (
    importacao, data, descricao, valor, tipo, saldo,
    classificada, ignorada, duplicata_detectada, duplicata_ids,
    sugestao_tipo, sugestao_categoria, sugestao_categoria_id,
    sugestao_imovel, sugestao_imovel_id, sugestao_confianca
  )
  select
    v_importacao,
    (e.tx ->> 'data')::date,
    btrim(e.tx ->> 'descricao'),
    (e.tx ->> 'valor')::numeric,
    (e.tx ->> 'tipo')::public.transacao_tipo,
    nullif(e.tx ->> 'saldo', '')::numeric,
    false,
    false,
    coalesce((e.tx ->> 'duplicata_detectada')::boolean, false),
    case
      when jsonb_typeof(e.tx -> 'duplicata_ids') = 'array' then e.tx -> 'duplicata_ids'
      else '[]'::jsonb
    end,
    nullif(e.tx ->> 'sugestao_tipo', '')::public.categoria_tipo,
    nullif(e.tx ->> 'sugestao_categoria', ''),
    nullif(e.tx ->> 'sugestao_categoria_id', '')::uuid,
    nullif(e.tx ->> 'sugestao_imovel', ''),
    nullif(e.tx ->> 'sugestao_imovel_id', '')::uuid,
    nullif(e.tx ->> 'sugestao_confianca', '')::numeric
  from jsonb_array_elements(p_transacoes) with ordinality as e(tx, ordem)
  order by e.ordem;

  -- Qualquer erro acima — cast inválido, chave estrangeira, RLS — aborta a
  -- função inteira, e o Postgres desfaz inclusive a linha de importacoes.
  return v_importacao;
end;
$$;

comment on function public.importar_extrato(jsonb, jsonb) is
  'Grava uma importação de extrato e todas as suas transações numa única transação (tudo ou nada). Devolve o id da importação.';

-- No Supabase, função nova em public ganha EXECUTE para anon e authenticated
-- por privilégio padrão, além do PUBLIC do próprio Postgres: os dois revokes
-- são necessários para que visitante sem login nem chegue a chamar.
revoke all on function public.importar_extrato(jsonb, jsonb) from public;
revoke all on function public.importar_extrato(jsonb, jsonb) from anon;
grant execute on function public.importar_extrato(jsonb, jsonb) to authenticated;
