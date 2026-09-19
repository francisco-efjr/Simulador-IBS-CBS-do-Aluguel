-- Feed de atividades do Início ---------------------------------------------------
--
-- O painel do administrador mostra, ao vivo, o que a equipe acabou de fazer. As
-- linhas vêm do gatilho de auditoria (tg_registrar_log); para o canal receber o
-- evento, a tabela precisa estar na publicação supabase_realtime.
--
-- A RLS continua valendo para o tempo real: a política logs_ver só deixa o
-- administrador ler, então só ele recebe os eventos. Quem não é administrador
-- abre o canal e simplesmente não recebe nada.
--
-- Idempotente, no mesmo padrão da …_07_convite_e_tempo_real.sql.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'logs_atividade'
  ) then
    alter publication supabase_realtime add table public.logs_atividade;
  end if;
end;
$$;
