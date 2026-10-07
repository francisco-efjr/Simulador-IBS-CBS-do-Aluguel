# Prompt para o Claude Code

Cole isto no Claude Code, na raiz do repositório, com a pasta `design_handoff_organico/` copiada para dentro do projeto.

---

Você é engenheiro frontend sênior e especialista em UI, tipografia e acessibilidade. Vamos trocar todo o visual do sistema Controle de Imóveis — Holding Aguiar (React 19 + Tailwind + shadcn/ui/Radix, em produção) para o estilo "Orgânico / Natural" especificado em `design_handoff_organico/README.md`.

Antes de escrever código:
1. Leia `design_handoff_organico/README.md` inteiro e abra `design_handoff_organico/Holding Aguiar Organico.dc.html` como referência visual.
2. Mapeie o repositório: `src/main.css`, `tailwind.config.ts`, `src/components/ui/*`, layout/shell, rotas das 27 telas, testes (757 de app, 233 de banco) e a varredura WCAG.
3. Me devolva um plano curto por fase, com a lista de arquivos que vai mexer, e espere meu ok.

Regras:
- Siga as 5 fases do README, uma por vez. Ao fim de cada fase: rode todos os testes, a varredura WCAG 2.2 AA (zero violações), confira 320/375/768/1366/1920 e me mostre um resumo antes de seguir.
- Tokens centralizados: use `design_handoff_organico/tokens/main.css` e `tailwind.config.ts` como base. Nada de cor hex solta em componente; tudo via classes do tema.
- Mantenha a API dos componentes shadcn (variantes via `cva`). Crie os novos componentes listados no README em `src/components/ui`.
- Mobile-first. Abaixo de 1024px o menu vira gaveta (Sheet à esquerda) com cabeçalho em pílula; não crie barra inferior.
- Não reduza fonte: piso 14px, corpo 17px, controle A− / A / A+ continua funcionando.
- Alvos de toque ≥ 44px. Texto nunca sobre argila #C18C5D. Use `secondary-ink` (#8F6139) para texto argila.
- Rotações e blobs só em elementos decorativos e cartões; tabelas, campos e números não giram. Respeite `prefers-reduced-motion`.
- Não mude regras de negócio, cálculos (inclusive do Simulador), rotas ou permissões. Se uma mudança visual exigir mudar comportamento, pergunte.
- Não piore a performance no celular (login ≤ 2s): fontes self-host, subset latin, só os pesos do README.
- Commits pequenos por fase/componente, mensagens em português.

QA: o subagente `qa-aguia` está em `design_handoff_organico/.claude/agents/qa-aguia.md` (copie para `.claude/agents/` na raiz do repositório). Ao fim de cada fase, chame-o, corrija todas as achadas críticas, altas e médias, e chame de novo até aprovar. A rodada 1 sobre o protótipo está em `QA-RELATORIO.md`; as correções dela já estão no protótipo e valem como requisito.

A empresa desenvolvedora é a **Aguia**: mostrar "Desenvolvido por Aguia" no rodapé do menu, no login e no simulador.

Comece pela leitura e pelo plano.
