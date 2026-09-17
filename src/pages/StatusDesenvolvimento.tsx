import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  CircleDashed,
  Clock,
  LogIn,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useTituloDaPagina } from '@/hooks/use-titulo-da-pagina'

/**
 * Painel de fase de desenvolvimento — tela pública em `/`.
 *
 * TEMPORÁRIA. Existe para que quem abre o endereço durante a construção veja,
 * numa página só, o que já funciona e o que ainda falta, sem precisar de
 * credencial. Quando o sistema for publicado de verdade:
 *
 *   1. apague este arquivo;
 *   2. em `src/App.tsx`, devolva a rota `/` para o `<Index />` dentro do
 *      `<ProtectedRoute>` (hoje ela aponta para cá e o painel vive em `/inicio`);
 *   3. em `src/lib/constants.ts`, devolva o item "Início" para o caminho `/`.
 *
 * Todo o conteúdo mora nas listas abaixo: para atualizar o quadro, mexa só nelas.
 */

const ATUALIZADO_EM = '17 de setembro de 2026'

type Situacao = 'pronto' | 'andamento' | 'pendente'

interface Entrega {
  titulo: string
  detalhe: string
  situacao: Situacao
}

interface Frente {
  nome: string
  entregas: Entrega[]
}

const FRENTES: Frente[] = [
  {
    nome: 'Cadastros',
    entregas: [
      {
        titulo: 'Imóveis',
        detalhe: 'Cadastro, edição, busca e situação de cada propriedade.',
        situacao: 'pronto',
      },
      {
        titulo: 'Inquilinos',
        detalhe: 'Dados de contato, documentos e vínculo com o contrato.',
        situacao: 'pronto',
      },
      {
        titulo: 'Contratos',
        detalhe: 'Prazos, valores, reajuste e anexo do contrato assinado.',
        situacao: 'pronto',
      },
      {
        titulo: 'Fornecedores',
        detalhe: 'Prestadores de serviço e parceiros ligados às despesas.',
        situacao: 'pronto',
      },
    ],
  },
  {
    nome: 'Financeiro',
    entregas: [
      {
        titulo: 'Receitas',
        detalhe: 'Aluguéis e entradas, com baixa por recebimento.',
        situacao: 'pronto',
      },
      {
        titulo: 'Despesas',
        detalhe: 'Custos, obras e manutenção por imóvel e por fornecedor.',
        situacao: 'pronto',
      },
      {
        titulo: 'IPTU e taxas',
        detalhe: 'Parcelas, vencimentos e comprovante de pagamento.',
        situacao: 'pronto',
      },
      {
        titulo: 'Importação de extrato bancário',
        detalhe:
          'Leitura de OFX e CSV de Itaú, Bradesco, Nubank, Inter, Santander e Banco do Brasil.',
        situacao: 'pronto',
      },
      {
        titulo: 'Classificação de transações',
        detalhe: 'Fila de conciliação que transforma a linha do extrato em receita ou despesa.',
        situacao: 'pronto',
      },
      {
        titulo: 'Cobrança por boleto e PIX',
        detalhe: 'Hoje o sistema registra o recebimento; ainda não emite a cobrança.',
        situacao: 'pendente',
      },
      {
        titulo: 'Reajuste automático por IGP-M e IPCA',
        detalhe:
          'Os campos já existem no contrato; falta a coleta do índice e a aplicação na data.',
        situacao: 'pendente',
      },
    ],
  },
  {
    nome: 'Acompanhamento',
    entregas: [
      {
        titulo: 'Dashboard financeiro',
        detalhe: 'Fluxo de caixa, comparativos e indicadores do período.',
        situacao: 'pronto',
      },
      {
        titulo: 'Dashboard de imóveis',
        detalhe: 'Ocupação, rendimento e distribuição da carteira.',
        situacao: 'pronto',
      },
      {
        titulo: 'Alertas',
        detalhe: 'Central de vencimentos de contratos, receitas, despesas e IPTU.',
        situacao: 'pronto',
      },
      {
        titulo: 'Relatórios em PDF e Excel',
        detalhe: 'Geração e exportação dos relatórios de cada módulo.',
        situacao: 'pronto',
      },
      {
        titulo: 'Envio automático de relatório por e-mail',
        detalhe: 'Fechamento mensal chegando na caixa de entrada, sem abrir o sistema.',
        situacao: 'pendente',
      },
    ],
  },
  {
    nome: 'Simulador IBS/CBS',
    entregas: [
      {
        titulo: 'Motor de cálculo da Reforma Tributária',
        detalhe: 'IBS e CBS sobre a locação pela LC 214/2025, com regime de transição ano a ano.',
        situacao: 'pronto',
      },
      {
        titulo: 'Comparativo e simulação de carteira',
        detalhe: 'Pessoa física x pessoa jurídica e projeção do conjunto dos imóveis.',
        situacao: 'pronto',
      },
      {
        titulo: 'Laudo de auditoria',
        detalhe: 'Memória de cálculo passo a passo, com a base legal de cada número.',
        situacao: 'pronto',
      },
      {
        titulo: 'Atualização para a LC 227/2026',
        detalhe: 'O cálculo já está correto; falta citar a lei nova nas referências e no laudo.',
        situacao: 'andamento',
      },
      {
        titulo: 'Página pública e otimização de busca',
        detalhe:
          'O simulador é aberto a qualquer pessoa, mas ainda não tem apresentação própria nem título de busca.',
        situacao: 'pendente',
      },
    ],
  },
  {
    nome: 'Acesso e administração',
    entregas: [
      {
        titulo: 'Entrada no sistema',
        detalhe: 'Login, cadastro por convite, recuperação e redefinição de senha.',
        situacao: 'pronto',
      },
      {
        titulo: 'Usuários e permissões por módulo',
        detalhe: 'Sem acesso, somente ver ou editar, módulo a módulo.',
        situacao: 'pronto',
      },
      {
        titulo: 'Registro de atividade',
        detalhe: 'Auditoria de acessos, criações, edições e exclusões.',
        situacao: 'pronto',
      },
      {
        titulo: 'Acessibilidade WCAG 2.2 AA',
        detalhe: 'Contraste, navegação por teclado, leitor de tela e ajuste do tamanho da letra.',
        situacao: 'pronto',
      },
      {
        titulo: 'Permissões verificadas no servidor',
        detalhe:
          'O banco confere o nível de acesso em toda consulta, por qualquer caminho — não só na tela.',
        situacao: 'pronto',
      },
      {
        titulo: 'Arquivos protegidos por login',
        detalhe:
          'Contrato assinado e comprovante deixaram de ser servidos por endereço aberto: o link é assinado e expira.',
        situacao: 'pronto',
      },
      {
        titulo: 'Banco de dados de produção',
        detalhe:
          'Base no Supabase com as 16 tabelas, as regras de acesso e a varredura diária de vencidos.',
        situacao: 'pronto',
      },
      {
        titulo: 'Separação por organização',
        detalhe: 'Necessária para mais de uma holding usar o mesmo sistema sem se enxergarem.',
        situacao: 'pendente',
      },
      {
        titulo: 'Aplicativo para celular',
        detalhe:
          'As telas funcionam no navegador do celular; um aplicativo próprio é etapa futura.',
        situacao: 'pendente',
      },
    ],
  },
]

/** O que ainda separa o sistema do primeiro dado real da holding. */
const PENDENCIAS = [
  {
    codigo: '1',
    titulo: 'Criar o primeiro administrador',
    detalhe:
      'O banco está pronto e vazio. Quem se cadastra nasce sem permissão nenhuma — o primeiro acesso precisa ser promovido a administrador no painel do Supabase.',
  },
  {
    codigo: '2',
    titulo: 'Remetente próprio para os e-mails',
    detalhe:
      'Convite e recuperação de senha saem hoje pelo remetente padrão do Supabase, que limita o volume. Para uso diário, ligar um serviço de e-mail com o domínio da holding.',
  },
  {
    codigo: '3',
    titulo: 'Validação de formato na borda',
    detalhe:
      'O banco já recusa valor fora da lista, campo obrigatório vazio e CPF duplicado. Falta a checagem de CPF, CNPJ e CEP antes do envio, para o erro aparecer no campo certo.',
  },
  {
    codigo: '4',
    titulo: 'Separação por organização',
    detalhe:
      'Hoje o sistema atende uma holding. Para atender mais de uma sem que uma enxergue a outra, falta o campo de organização em cada tabela.',
  },
]

const APARENCIA: Record<
  Situacao,
  { rotulo: string; icone: LucideIcon; ponto: string; texto: string; caixa: string }
> = {
  pronto: {
    rotulo: 'Pronto',
    icone: CheckCircle2,
    ponto: 'bg-emerald-600',
    texto: 'text-emerald-800',
    caixa: 'border-emerald-200 bg-emerald-50',
  },
  andamento: {
    rotulo: 'Em andamento',
    icone: Clock,
    ponto: 'bg-amber-500',
    texto: 'text-amber-900',
    caixa: 'border-amber-200 bg-amber-50',
  },
  pendente: {
    rotulo: 'Pendente',
    icone: CircleDashed,
    ponto: 'bg-slate-400',
    texto: 'text-slate-700',
    caixa: 'border-slate-200 bg-slate-50',
  },
}

export default function StatusDesenvolvimento() {
  useTituloDaPagina('Fase de desenvolvimento')
  const { isAuthenticated } = useAuth()

  const entregas = FRENTES.flatMap((frente) => frente.entregas)
  const total = entregas.length
  const contagem: Record<Situacao, number> = {
    pronto: entregas.filter((e) => e.situacao === 'pronto').length,
    andamento: entregas.filter((e) => e.situacao === 'andamento').length,
    pendente: entregas.filter((e) => e.situacao === 'pendente').length,
  }
  const percentualPronto = Math.round((contagem.pronto / total) * 100)

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#quadro"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy-950 focus:px-5 focus:py-3 focus:text-base focus:font-bold focus:text-white"
      >
        Ir para o quadro de entregas
      </a>

      {/* Faixa de aviso: quem chega aqui precisa saber, na primeira linha, que
          está diante de um sistema em construção e não de um produto publicado. */}
      <div className="bg-amber-400 text-navy-950">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-bold">
            Sistema em fase de desenvolvimento. Esta página mostra o andamento e será removida na
            publicação.
          </p>
        </div>
      </div>

      <header className="bg-gradient-to-br from-navy-950 via-indigo-900 to-navy-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-200">
            Holding Aguiar
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Controle de Imóveis — andamento da construção
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-indigo-100">
            Gestão do patrimônio, dos contratos e do caixa da holding, com conciliação do extrato
            bancário e o simulador do IBS/CBS da Reforma Tributária. Abaixo, o que já funciona e o
            que ainda está sendo feito.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link
                to="/inicio"
                className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-base font-bold text-navy-950 transition-colors hover:bg-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-300"
              >
                Ir para o painel
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-base font-bold text-navy-950 transition-colors hover:bg-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-300"
              >
                <LogIn className="h-5 w-5" aria-hidden="true" />
                Entrar no sistema
              </Link>
            )}
            <Link
              to="/simulador"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white/40 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
            >
              <Calculator className="h-5 w-5" aria-hidden="true" />
              Abrir o Simulador IBS/CBS
            </Link>
          </div>

          <p className="mt-6 text-sm text-indigo-200">Quadro atualizado em {ATUALIZADO_EM}.</p>
        </div>
      </header>

      <main id="quadro" tabIndex={-1} className="focus:outline-none">
        <section aria-labelledby="titulo-resumo" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h2 id="titulo-resumo" className="text-2xl font-bold text-slate-900">
            Resumo
          </h2>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-lg font-bold text-slate-900">
                {contagem.pronto} de {total} entregas concluídas
              </p>
              <p className="text-lg font-bold text-emerald-700">{percentualPronto}%</p>
            </div>

            <div
              className="mt-3 h-4 w-full overflow-hidden rounded-full bg-slate-200"
              role="img"
              aria-label={`${percentualPronto} por cento das entregas concluídas`}
            >
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${percentualPronto}%` }}
              />
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(['pronto', 'andamento', 'pendente'] as const).map((situacao) => {
                const estilo = APARENCIA[situacao]
                const Icone = estilo.icone
                return (
                  <div
                    key={situacao}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${estilo.caixa}`}
                  >
                    <Icone className={`h-6 w-6 shrink-0 ${estilo.texto}`} aria-hidden="true" />
                    <div>
                      <dt className={`text-sm font-semibold ${estilo.texto}`}>{estilo.rotulo}</dt>
                      <dd className="text-2xl font-bold text-slate-900">{contagem[situacao]}</dd>
                    </div>
                  </div>
                )
              })}
            </dl>
          </div>
        </section>

        <section aria-labelledby="titulo-entregas" className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
          <h2 id="titulo-entregas" className="text-2xl font-bold text-slate-900">
            Entregas por frente
          </h2>

          <div className="mt-5 space-y-6">
            {FRENTES.map((frente) => (
              <article
                key={frente.nome}
                className="rounded-xl border border-slate-200 bg-white shadow-xs"
              >
                <h3 className="border-b border-slate-200 px-6 py-4 text-lg font-bold text-slate-900">
                  {frente.nome}
                  <span className="ml-2 text-sm font-medium text-slate-600">
                    {frente.entregas.filter((e) => e.situacao === 'pronto').length} de{' '}
                    {frente.entregas.length} prontas
                  </span>
                </h3>

                <ul className="divide-y divide-slate-100">
                  {frente.entregas.map((entrega) => {
                    const estilo = APARENCIA[entrega.situacao]
                    return (
                      <li
                        key={entrega.titulo}
                        className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                      >
                        <div className="min-w-0">
                          <p className="text-base font-bold text-slate-900">{entrega.titulo}</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            {entrega.detalhe}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3 py-1 text-sm font-semibold ${estilo.caixa} ${estilo.texto}`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${estilo.ponto}`}
                            aria-hidden="true"
                          />
                          {estilo.rotulo}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="titulo-bloqueios"
          className="mx-auto max-w-5xl px-4 pb-14 sm:px-6"
        >
          <h2 id="titulo-bloqueios" className="text-2xl font-bold text-slate-900">
            O que falta para o primeiro dado real
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
            As quatro correções críticas de segurança apontadas na auditoria foram fechadas com a
            mudança de banco. O que resta é preparo de operação.
          </p>

          <ul className="mt-5 space-y-3">
            {PENDENCIAS.map((pendencia) => (
              <li
                key={pendencia.codigo}
                className="flex gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4"
              >
                <ShieldAlert
                  className="mt-0.5 h-6 w-6 shrink-0 text-indigo-700"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-base font-bold text-indigo-950">
                    <span className="mr-2 rounded bg-indigo-200 px-2 py-0.5 text-sm font-bold text-indigo-950">
                      {pendencia.codigo}
                    </span>
                    {pendencia.titulo}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-indigo-950/90">
                    {pendencia.detalhe}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-600 sm:px-6">
          <p>
            Holding Aguiar · Controle de Imóveis. Página de acompanhamento interno, temporária, sem
            dados de clientes.
          </p>
        </div>
      </footer>
    </div>
  )
}
