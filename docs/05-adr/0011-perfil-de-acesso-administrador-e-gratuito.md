# ADR-0011 — Perfil de acesso: administrador ou gratuito

- **Status:** Aceita
- **Data:** 2026-10-08
- **Relacionadas:** [ADR-0003](0003-rbac-servidor-e-tenancy.md), [ADR-0009](0009-supabase-como-backend.md), [ADR-0010](0010-estrutura-hierarquica-de-imoveis-unidades-e-partes.md)

## Contexto

Desde a ADR-0009 o acesso é decidido pelo banco (RLS), mas a partir de uma **permissão marcada módulo a
módulo para cada pessoa** (tabela `permissoes`: 14 módulos × `sem_acesso` / `visualizacao` / `edicao`).
Os perfis eram dois — `administrador`, que ignora a tabela e edita tudo, e `usuario`, que dependia dela.

O dono do produto definiu (08/10/2026) que o acesso passa a ser um **pacote fixo por perfil**, com dois
perfis:

- **Administrador** — acessa tudo, sem limitação alguma.
- **Gratuito** — acesso limitado a Início, Imóveis, Inquilinos, Locadores e fiadores, e Contratos.

Marcar módulo a módulo era trabalho manual para cada conta nova e abria espaço para conceder acesso a
mais por engano.

## Decisão

1. O valor `usuario` do enum `perfil_usuario` passa a se chamar `gratuito` (`RENAME VALUE`: contas,
   convites pendentes e defaults das colunas acompanham).
2. `public.nivel_no_modulo` decide pelo perfil: administrador → `edicao` em tudo; gratuito → `edicao`
   nos módulos de `public.modulos_do_gratuito()` (`imoveis`, `inquilinos`, `locadores`, `contratos`) e
   `sem_acesso` no resto; conta inativa → `sem_acesso`. Fiadores herdam de `contratos` no banco.
3. Nos módulos liberados o gratuito **edita** (não só vê). O limite de **3 imóveis ativos** cadastrados
   por ele continua (20261006120007); o administrador não tem limite.
4. Os dados continuam **compartilhados**: o gratuito vê os mesmos imóveis, inquilinos e contratos que os
   demais. Isolamento por conta (tenancy, ADR-0003) segue fora de escopo.
5. A tabela `permissoes` deixa de ser lida e a tela de Usuários perde a matriz de permissões: escolhe-se
   só o perfil. A tabela fica no banco, sem uso, e pode ser removida numa migração futura.
6. A tela espelha a regra em `MODULOS_DO_GRATUITO` / `nivelDoPerfil` (`src/lib/constants.ts`) só para
   decidir o que desenhar; quem autoriza é o banco.

Migração: `supabase/migrations/20261008120001_perfil_gratuito.sql`.

## Consequências

- Toda conta que não é administradora vira gratuita: quem tinha acesso a Receitas, Despesas,
  Dashboards etc. perde esse acesso até ser promovido a administrador em **Usuários**.
- Quadro de andamento e Simulador saem do menu do gratuito. A leitura do quadro segue pública
  (20260923120005) e o Simulador continua abrindo sem login em `/simulador`.
- O Início do gratuito mostra só ocupação e alertas: os números financeiros somem em vez de aparecer
  como R$ 0.
- Mudar o pacote do gratuito exige mudar `modulos_do_gratuito()` e `MODULOS_DO_GRATUITO` juntos (há
  teste dos dois lados).
