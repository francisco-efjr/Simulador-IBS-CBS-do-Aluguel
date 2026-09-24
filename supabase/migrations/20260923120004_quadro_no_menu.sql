-- =============================================================================
-- Quadro de histórias — entregas de 23/09/2026 na H-44
--
-- A H-44 ("Organizar as histórias no quadro") é a história do próprio quadro.
-- Estas atividades registram o que entrou depois da primeira versão: o acesso
-- pelo menu lateral, o "Mostrar mais" do Concluído, o cartão mais largo e a
-- edição direta de todos os campos. Entram marcadas, porque estão prontas no
-- código; a coluna da história não muda — homologar é de uma pessoa (RN-QDR-01).
--
-- Só acrescenta a atividade que ainda não existe: pode ser rodada de novo.
-- =============================================================================

insert into public.historias_atividades (historia, titulo, concluida, ordem)
select h.id, a.titulo, true,
       coalesce((select max(x.ordem) from public.historias_atividades x where x.historia = h.id), 0)
         + a.posicao
  from public.historias h
  cross join (values
    ('Acesso pelo menu lateral (Quadro de Histórias, em /quadro)', 1),
    ('Concluído mostra as 15 mais recentes, com "Mostrar mais"', 2),
    ('Cartão aberto mais largo, em duas colunas no computador', 3),
    ('Título, descrição, critérios, observações e etiqueta editáveis direto no cartão', 4)
  ) as a(titulo, posicao)
 where h.numero = 44
   and not exists (
     select 1 from public.historias_atividades x
      where x.historia = h.id and x.titulo = a.titulo
   );
