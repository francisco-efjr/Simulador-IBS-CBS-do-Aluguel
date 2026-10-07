-- =============================================================================
-- 20261006120001 — Anexos: a permissão vem do módulo dono do arquivo (SEG-01)
-- =============================================================================
--
-- O bucket `documentos-anexos` guarda anexos de sete entidades (imóvel,
-- inquilino, contrato, fornecedor, despesa, receita, IPTU), mas as quatro
-- políticas de storage (20260917120005, seção 5.2) só olhavam o módulo
-- `contratos`. Efeito, provado pela QA em 06/10/2026:
--   · quem só LÊ contratos listava e baixava RG e comprovantes de inquilinos,
--     notas de despesas etc.;
--   · quem EDITA contratos apagava ou trocava anexo de qualquer módulo;
--   · quem edita despesas (sem contratos) não conseguia anexar.
--
-- O caminho do objeto era `<uuid>-<nome>`, sem nada que dissesse a quem ele
-- pertence. Agora a primeira pasta do caminho é o tipo da entidade
-- (`inquilino/<uuid>-<nome>`, o mesmo valor de documentos_anexos.entidade_tipo)
-- e a política deriva o módulo dela. A tela passa a gravar assim
-- (src/lib/dados/arquivos.ts e cliente.ts).
--
-- Falha fechando: caminho sem pasta, ou com pasta desconhecida, não tem módulo;
-- `pode_ver(null)` e `pode_editar(null)` são falsos para quem não é
-- administrador. Os objetos anteriores a esta migração (sem pasta) continuam
-- acessíveis ao administrador, que tem edição em tudo; para os demais só voltam
-- depois de movidos para a pasta certa pela API de storage (storage.move) —
-- renomear por SQL deixaria o arquivo órfão no armazenamento de objetos.
--
-- Pode ser rodada de novo sem erro.

-- 1. Módulo dono do arquivo, a partir do caminho -------------------------------
-- Imutável e sem acesso a tabela: serve de predicado de RLS sem custo. O `case`
-- (e não um cast direto para o enum) é de propósito: nome estranho vira nulo em
-- vez de erro 22P02, que derrubaria a listagem inteira do bucket.

create or replace function public.modulo_do_anexo(p_nome text)
returns public.modulo_permissao
language sql
immutable
set search_path = ''
as $$
  select case
    -- Só vale com pasta: um objeto solto chamado "inquilino" não é anexo de inquilino.
    when strpos(coalesce(p_nome, ''), '/') > 1 then
      case split_part(p_nome, '/', 1)
        when 'imovel'      then 'imoveis'
        when 'inquilino'   then 'inquilinos'
        when 'contrato'    then 'contratos'
        when 'fornecedor'  then 'fornecedores'
        when 'despesa'     then 'despesas'
        when 'receita'     then 'receitas'
        when 'iptu_taxas'  then 'iptu_taxas'
      end
  end::public.modulo_permissao;
$$;

-- Só as políticas de RLS (authenticated) usam; visitante não precisa (SEG-10).
revoke all on function public.modulo_do_anexo(text) from public, anon;
grant execute on function public.modulo_do_anexo(text) to authenticated;

-- 2. Políticas do bucket, uma por operação -------------------------------------

drop policy if exists "documentos-anexos_ler"        on storage.objects;
drop policy if exists "documentos-anexos_enviar"     on storage.objects;
drop policy if exists "documentos-anexos_substituir" on storage.objects;
drop policy if exists "documentos-anexos_apagar"     on storage.objects;
drop policy if exists "documentos-anexos_por_modulo_ler"        on storage.objects;
drop policy if exists "documentos-anexos_por_modulo_enviar"     on storage.objects;
drop policy if exists "documentos-anexos_por_modulo_substituir" on storage.objects;
drop policy if exists "documentos-anexos_por_modulo_apagar"     on storage.objects;

create policy "documentos-anexos_por_modulo_ler" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos-anexos'
         and public.pode_ver(public.modulo_do_anexo(name)));

create policy "documentos-anexos_por_modulo_enviar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos-anexos'
              and public.pode_editar(public.modulo_do_anexo(name)));

-- Substituir tem de valer para o nome de antes e o de depois: senão dá para
-- "mover" um arquivo de um módulo para outro com um UPDATE do nome.
create policy "documentos-anexos_por_modulo_substituir" on storage.objects
  for update to authenticated
  using (bucket_id = 'documentos-anexos'
         and public.pode_editar(public.modulo_do_anexo(name)))
  with check (bucket_id = 'documentos-anexos'
              and public.pode_editar(public.modulo_do_anexo(name)));

create policy "documentos-anexos_por_modulo_apagar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documentos-anexos'
         and public.pode_editar(public.modulo_do_anexo(name)));
