-- =============================================================================
-- Quadro de histórias aberto para leitura
--
-- Decisão do dono em 23/09/2026, para o ambiente de teste: qualquer pessoa vê o
-- quadro, sem login — é por ele que a família acompanha a construção. Criar,
-- editar, mover e marcar atividade continuam exigindo login e edição no módulo
-- "quadro" (RN-QDR-03), e homologar continua sendo só de pessoa (RN-QDR-01).
--
-- É a única exceção ao "nada é servido a visitante anônimo" da migração 04: o
-- quadro descreve o sistema, não guarda dado da holding. Quando o sistema sair
-- do ambiente de teste, reveja esta migração.
--
-- Também acerta os dois cenários de aceitação que descreviam o quadro fechado
-- (H-42 e H-44), só se o texto original ainda estiver lá.
--
-- Pode ser rodada de novo sem erro. Rodar de novo a 20260923120002 volta a
-- fechar a leitura: rode esta depois dela.
-- =============================================================================

grant select on public.historias, public.historias_atividades to anon;

drop policy if exists historias_ver on public.historias;
create policy historias_ver on public.historias
  for select to anon, authenticated using (true);

drop policy if exists historias_atividades_ver on public.historias_atividades;
create policy historias_atividades_ver on public.historias_atividades
  for select to anon, authenticated using (true);

update public.historias
   set criterios = replace(criterios,
$antes$  @implementado
  Cenário: O quadro de histórias pede entrada
    Quando Seu Antônio, sem entrar no sistema, chega ao quadro de histórias
    Então vê um convite para entrar, e não as histórias$antes$,
$depois$  @implementado
  Cenário: O quadro de histórias aberto para ler
    Quando Seu Antônio, sem entrar no sistema, chega ao quadro de histórias
    Então vê as histórias e o que falta em cada uma
    Mas não consegue criar, editar nem mover nada$depois$)
 where numero = 42
   and position('Cenário: O quadro de histórias pede entrada' in criterios) > 0;

update public.historias
   set criterios = replace(criterios,
$antes$  @implementado
  Cenário: Quem não tem acesso não vê
    Dado que Marcos está "Sem acesso" no módulo "Quadro de histórias"
    Quando ele abre a página inicial
    Então o quadro não aparece para ele$antes$,
$depois$  @implementado
  Cenário: Quem não tem edição só lê
    Dado que Marcos está "Sem acesso" no módulo "Quadro de histórias"
    Quando ele abre o quadro
    Então vê as histórias
    Mas não vê os campos de edição nem o botão "Nova história"$depois$)
 where numero = 44
   and position('Cenário: Quem não tem acesso não vê' in criterios) > 0;
