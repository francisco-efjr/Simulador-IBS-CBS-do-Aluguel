-- =============================================================================
-- 06 — Dados de referência
--
-- Só vocabulário do sistema: as categorias financeiras que as migrações 0010 e
-- 0012 do PocketBase já traziam. Nenhum imóvel, contrato ou lançamento de
-- exemplo — a base nasce vazia para receber os dados reais da holding.
-- =============================================================================

insert into public.categorias_financeiras (nome, tipo, status)
values
  ('Aluguel',                'receita', 'ativo'),
  ('Multa',                  'receita', 'ativo'),
  ('Juros',                  'receita', 'ativo'),
  ('Reembolso',              'receita', 'ativo'),
  ('Outras receitas',        'receita', 'ativo'),
  ('Manutenção',             'despesa', 'ativo'),
  ('Reforma',                'despesa', 'ativo'),
  ('Comissão de corretagem', 'despesa', 'ativo'),
  ('Condomínio',             'despesa', 'ativo'),
  ('Contas de consumo',      'despesa', 'ativo'),
  ('Impostos',               'despesa', 'ativo'),
  ('Seguros',                'despesa', 'ativo'),
  ('Outros',                 'despesa', 'ativo')
on conflict (nome, tipo) do nothing;

-- -----------------------------------------------------------------------------
-- Primeiro administrador
--
-- O perfil nasce sozinho quando a pessoa se cadastra pela tela de login, mas
-- nasce como 'usuario' sem permissão nenhuma — e sem nenhum administrador não há
-- quem conceda a primeira. Depois de criar o seu login em Authentication →
-- Users, rode as duas linhas abaixo com o seu e-mail:
--
--   update public.users set perfil = 'administrador', ativo = true
--    where lower(email) = lower('voce@exemplo.com.br');
--
-- Administrador tem 'edicao' em todo módulo por definição (ver nivel_no_modulo),
-- então não precisa de linha em public.permissoes.
--
-- Para dar acesso a alguém que não é administrador:
--
--   insert into public.permissoes (usuario, modulo, nivel)
--   select u.id, m.modulo, 'visualizacao'
--     from public.users u
--    cross join (values ('imoveis'::public.modulo_permissao), ('contratos')) as m(modulo)
--    where lower(u.email) = lower('pessoa@exemplo.com.br')
--   on conflict (usuario, modulo) do update set nivel = excluded.nivel;
-- -----------------------------------------------------------------------------
