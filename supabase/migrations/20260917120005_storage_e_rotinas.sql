-- =============================================================================
-- 05 — Buckets de arquivo e rotina diária
--
-- Corrige o achado S-05: no PocketBase, contratos.documento,
-- iptu_taxas.comprovante e documentos_anexos.arquivo eram servidos por URL
-- sem autenticação — contrato assinado e comprovante protegidos apenas por um
-- endereço difícil de adivinhar. Aqui todo bucket é privado e o acesso passa
-- pela mesma permissão de módulo da tabela correspondente.
-- =============================================================================

-- 5.1 Buckets --------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('imoveis-fotos', 'imoveis-fotos', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('contratos-documentos', 'contratos-documentos', false, 26214400,
   array['application/pdf', 'image/jpeg', 'image/png']),
  ('iptu-comprovantes', 'iptu-comprovantes', false, 10485760,
   array['application/pdf', 'image/jpeg', 'image/png']),
  ('documentos-anexos', 'documentos-anexos', false, 26214400,
   array['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars', 'avatars', false, 2097152,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 5.2 Políticas dos arquivos ------------------------------------------------------

do $$
declare
  par record;
begin
  for par in
    select * from (values
      ('imoveis-fotos',        'imoveis'),
      ('contratos-documentos', 'contratos'),
      ('iptu-comprovantes',    'iptu_taxas'),
      ('documentos-anexos',    'contratos')
    ) as t(bucket, modulo)
  loop
    execute format(
      'create policy %I on storage.objects for select to authenticated
         using (bucket_id = %L and public.pode_ver(%L))',
      par.bucket || '_ler', par.bucket, par.modulo);

    execute format(
      'create policy %I on storage.objects for insert to authenticated
         with check (bucket_id = %L and public.pode_editar(%L))',
      par.bucket || '_enviar', par.bucket, par.modulo);

    execute format(
      'create policy %I on storage.objects for update to authenticated
         using (bucket_id = %L and public.pode_editar(%L))',
      par.bucket || '_substituir', par.bucket, par.modulo);

    execute format(
      'create policy %I on storage.objects for delete to authenticated
         using (bucket_id = %L and public.pode_editar(%L))',
      par.bucket || '_apagar', par.bucket, par.modulo);
  end loop;
end;
$$;

-- O avatar é de cada um: a primeira pasta do caminho tem de ser o próprio id.
create policy avatars_ler on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and public.usuario_ativo());

create policy avatars_gerenciar on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 5.3 Varredura diária de vencidos -------------------------------------------------
-- Equivale aos três cronAdd() do PocketBase, que rodavam às 02:00. O agendador do
-- Postgres trabalha em UTC: 05:00 UTC é 02:00 em Brasília.
--
-- A extensão precisa estar ligada em Database → Extensions → pg_cron. Se ainda
-- não estiver, ligue e rode apenas o bloco abaixo.

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'marcar-lancamentos-em-atraso',
      '0 5 * * *',
      'select public.marcar_lancamentos_em_atraso()'
    );
  else
    raise notice 'pg_cron não está instalada: a varredura diária de vencidos não foi agendada.';
  end if;
end;
$$;
