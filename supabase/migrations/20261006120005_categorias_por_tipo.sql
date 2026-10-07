-- =============================================================================
-- 20261006120005 — Categoria financeira: quem escreve é o dono do tipo (SEG-05)
-- =============================================================================
--
-- `categorias_escrever` (20260917120004, seção 4.6) liberava criar, renomear e
-- apagar QUALQUER categoria a quem tivesse edição em `receitas` OU em
-- `despesas`, sem olhar o `tipo` da categoria. Quem editava só despesas
-- renomeava e apagava categorias de receita — e, como `receitas.categoria` é
-- `on delete set null`, apagar a categoria zerava a categoria das receitas
-- (relatório por categoria, ou seja, dinheiro, alterado por quem nem enxerga o
-- módulo). Provado pela QA em 06/10/2026.
--
-- Agora a escrita segue o tipo: `receita` exige edição em `receitas`,
-- `despesa` exige edição em `despesas`. O WITH CHECK olha a linha nova, então
-- também não dá para trocar o `tipo` de uma categoria para um módulo que a
-- pessoa não edita. A leitura continua aberta a todo usuário ativo (vocabulário
-- compartilhado, `categorias_ver`). Administrador passa em tudo por definição.
--
-- Pode ser rodada de novo sem erro.

drop policy if exists categorias_escrever on public.categorias_financeiras;

create policy categorias_escrever on public.categorias_financeiras
  for all to authenticated
  using (
    case tipo
      when 'receita' then public.pode_editar('receitas')
      when 'despesa' then public.pode_editar('despesas')
      else false
    end
  )
  with check (
    case tipo
      when 'receita' then public.pode_editar('receitas')
      when 'despesa' then public.pode_editar('despesas')
      else false
    end
  );
