import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, cantoOrganico } from '@/components/ui/card'
import { Blob, CreditoAguia, IconeTile, LogoSistema } from '@/components/organico'
import { CLIENTE, NOME_DO_SISTEMA } from '@/lib/marca'
import { AlertTriangle, ArrowRight, Calculator, LogIn, ShieldAlert } from 'lucide-react'
import {
  ANDAMENTO,
  AUDITORIA,
  FEED,
  dataDaUltimaAtualizacao,
  formatarDataPorExtenso,
  formatarMomentoBrasilia,
  progressoDasEntregas,
  resumoDaSaude,
  type SituacaoVerificacao,
} from '@/data/andamento'
import { APARENCIA_DA_VERIFICACAO } from '@/components/produto/aparencia'
import {
  CartaoDeProgresso,
  ListaDeEtapas,
  NovidadesEmCartoes,
} from '@/components/produto/PainelPublico'
import { QuadroDeHistorias } from '@/components/produto/QuadroDeHistorias'
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
 * O conteúdo não mora aqui: o resumo e o "o que falta" estão em
 * `src/data/andamento.json`, as novidades em `src/data/feed.json` e a saúde do
 * sistema em `src/data/auditoria.json`, este último gerado pelo auditor a cada
 * build (ver docs/07-auditor.md). O quadro de histórias vem do banco (tabela
 * `historias`): qualquer pessoa lê, e só quem tem edição no módulo "quadro"
 * mexe. O desenho do corpo é o da seção 10 do handoff Fase 2; a apresentação
 * (cartão de progresso, etapas, novidades) está em `components/produto/PainelPublico`.
 */

const { pendencias: PENDENCIAS } = ANDAMENTO

/** Cores de cada situação da saúde do sistema, nos tokens do visual orgânico. */
const TOM_DA_SAUDE: Record<SituacaoVerificacao, { caixa: string; texto: string }> = {
  ok: { caixa: 'bg-primary/10', texto: 'text-success-ink' },
  atencao: { caixa: 'bg-secondary/15', texto: 'text-warning-ink' },
  falha: { caixa: 'bg-destructive/15', texto: 'text-red-800' },
}

function TituloDeSecao({
  id,
  titulo,
  children,
}: {
  id: string
  titulo: string
  children?: React.ReactNode
}) {
  return (
    <>
      <h2 id={id} className="text-3xl sm:text-4xl">
        {titulo}
      </h2>
      {children && (
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-accent-foreground">
          {children}
        </p>
      )}
    </>
  )
}

function SaudeDoSistema() {
  const resumo = resumoDaSaude()

  if (!resumo) {
    return (
      <Card className="mt-5 p-6 text-base text-accent-foreground">
        A primeira conferência automática ainda não foi feita. Ela acontece na próxima publicação.
      </Card>
    )
  }

  const tomResumo = TOM_DA_SAUDE[resumo.situacao]
  const IconeResumo = APARENCIA_DA_VERIFICACAO[resumo.situacao].icone

  return (
    <div className="mt-5 space-y-4">
      <div className={`flex items-start gap-3 rounded-3xl px-5 py-4 ${tomResumo.caixa}`}>
        <IconeResumo
          className={`mt-0.5 h-6 w-6 shrink-0 ${tomResumo.texto}`}
          aria-hidden="true"
        />
        <div>
          <p className={`text-lg font-bold ${tomResumo.texto}`}>{resumo.frase}</p>
          <p className="mt-1 text-sm text-accent-foreground">
            Verificado em {formatarMomentoBrasilia(AUDITORIA.geradoEm)} (horário de Brasília)
            {AUDITORIA.commit ? `, na versão ${AUDITORIA.commit}` : ''}.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {AUDITORIA.verificacoes.map((verificacao, indice) => {
          const base =
            APARENCIA_DA_VERIFICACAO[verificacao.situacao] ?? APARENCIA_DA_VERIFICACAO.atencao
          const tom = TOM_DA_SAUDE[verificacao.situacao] ?? TOM_DA_SAUDE.atencao
          const Icone = base.icone
          return (
            <li key={verificacao.id}>
              <Card canto={cantoOrganico(indice)} className="flex h-full gap-3 px-5 py-4">
                <Icone className={`mt-0.5 h-6 w-6 shrink-0 ${tom.texto}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-base font-bold">
                    {verificacao.nome}
                    <span className="sr-only">: {base.rotulo}.</span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-accent-foreground">
                    {verificacao.detalhe}
                  </p>
                  {verificacao.situacao !== 'ok' && (
                    <p
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-extrabold ${tom.caixa} ${tom.texto}`}
                      aria-hidden="true"
                    >
                      {base.rotulo}
                    </p>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function StatusDesenvolvimento() {
  useTituloDaPagina('Fase de desenvolvimento')
  const { isAuthenticated } = useAuth()

  const progresso = progressoDasEntregas()
  const atualizadoEm = dataDaUltimaAtualizacao()
  const saude = resumoDaSaude()

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <a
        href="#quadro"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-6 focus:py-3 focus:text-base focus:font-extrabold focus:text-primary-foreground"
      >
        Ir para o andamento
      </a>

      {/* Faixa de aviso: quem chega aqui precisa saber, na primeira linha, que
          está diante de um sistema em construção e não de um produto publicado. */}
      <div className="bg-secondary/25 text-warning-ink">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-bold">
            Sistema em fase de desenvolvimento. Esta página mostra o andamento e será removida na
            publicação.
          </p>
        </div>
      </div>

      <header className="relative">
        <Blob
          forma={1}
          cor="primary"
          className="-left-28 -top-10 h-[420px] w-[480px] opacity-[0.16] blur-[80px]"
        />
        <Blob
          forma={2}
          cor="secondary"
          className="-right-32 top-24 h-[380px] w-[440px] opacity-[0.18] blur-[80px]"
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-start gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <div className="flex items-center gap-3">
              <LogoSistema />
              <p className="flex flex-col leading-tight">
                <span className="font-serif text-xl font-bold">{NOME_DO_SISTEMA}</span>
                <span className="text-sm font-bold text-accent-foreground">{CLIENTE}</span>
              </p>
            </div>
            <h1 className="mt-6 text-balance text-[2.125rem] leading-[1.1] sm:text-5xl lg:text-[3.5rem]">
              Andamento da construção
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-accent-foreground sm:text-xl">
              Gestão do patrimônio, dos contratos e do caixa da holding, com conciliação do extrato
              bancário e o simulador do IBS/CBS da Reforma Tributária. Aqui você acompanha o que já
              funciona, o que está sendo feito e o que vem a seguir.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link to="/inicio" className={buttonVariants({ size: 'lg' })}>
                  Ir para o painel
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              ) : (
                <Link to="/login" className={buttonVariants({ size: 'lg' })}>
                  <LogIn className="h-5 w-5" aria-hidden="true" />
                  Entrar no sistema
                </Link>
              )}
              <Link to="/simulador" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                <Calculator className="h-5 w-5" aria-hidden="true" />
                Abrir o Simulador IBS/CBS
              </Link>
            </div>

            <div className="mt-6 space-y-1 text-sm text-accent-foreground">
              {atualizadoEm && (
                <p>
                  Quadro atualizado em{' '}
                  <time dateTime={atualizadoEm}>{formatarDataPorExtenso(atualizadoEm)}</time>.
                </p>
              )}
              {saude && (
                <p>
                  {saude.frase}{' '}
                  <a
                    href="#saude"
                    className="font-bold text-primary underline underline-offset-4 hover:text-foreground"
                  >
                    Ver a saúde do sistema
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <CartaoDeProgresso progresso={progresso} />
            <ListaDeEtapas />
          </div>
        </div>
      </header>

      <main id="quadro" tabIndex={-1} className="relative focus:outline-none">
        <section
          id="novidades"
          aria-labelledby="titulo-novidades"
          className="mx-auto max-w-6xl scroll-mt-4 px-4 py-10 sm:px-6"
        >
          <TituloDeSecao id="titulo-novidades" titulo="Novidades">
            O que mudou no sistema, da novidade mais recente para a mais antiga.
          </TituloDeSecao>
          <div className="mt-6">
            <NovidadesEmCartoes feed={FEED} />
          </div>
        </section>

        <section
          aria-labelledby="titulo-historias"
          className="mx-auto max-w-7xl px-4 pb-10 sm:px-6"
        >
          <TituloDeSecao id="titulo-historias" titulo="Quadro de histórias">
            Cada cartão é uma coisa que alguém precisa fazer no dia a dia da holding, escrita com as
            palavras de quem faz, com os critérios para conferir se está pronta. Homologação e
            Concluído são sempre decisão de uma pessoa.
          </TituloDeSecao>
          <QuadroDeHistorias />
        </section>

        <section
          aria-labelledby="titulo-bloqueios"
          className="mx-auto max-w-6xl px-4 pb-10 sm:px-6"
        >
          <TituloDeSecao id="titulo-bloqueios" titulo="O que falta para o primeiro dado real">
            {PENDENCIAS.introducao}
          </TituloDeSecao>

          <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {PENDENCIAS.itens.map((pendencia, indice) => (
              <li key={pendencia.codigo}>
                <Card canto={cantoOrganico(indice)} className="flex h-full gap-4 px-5 py-4">
                  <IconeTile icone={ShieldAlert} tom="argila" blob={2} tamanho="sm" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-base font-bold">
                      <Badge variant="neutral">{pendencia.codigo}</Badge>
                      <p>{pendencia.titulo}</p>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-accent-foreground">
                      {pendencia.detalhe}
                    </p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="saude"
          tabIndex={-1}
          aria-labelledby="titulo-saude"
          className="mx-auto max-w-6xl scroll-mt-4 px-4 pb-14 focus:outline-none sm:px-6"
        >
          <TituloDeSecao id="titulo-saude" titulo="Saúde do sistema">
            A cada nova versão, antes de ir ao ar, o próprio sistema passa por uma série de
            conferências automáticas. Este é o resultado da versão que você está vendo agora.
          </TituloDeSecao>
          <SaudeDoSistema />
        </section>
      </main>

      <footer className="relative">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-dashed border-border px-4 py-8 text-sm text-accent-foreground sm:px-6">
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p>Dúvidas sobre o sistema? Fale com a administração.</p>
            <Link
              to="/simulador"
              className="inline-flex min-h-11 items-center text-base font-bold text-primary underline underline-offset-4 hover:text-foreground"
            >
              Abrir o simulador IBS/CBS
            </Link>
          </div>
          <p>
            {NOME_DO_SISTEMA} · {CLIENTE}. Página de acompanhamento interno, temporária, sem dados
            de clientes.
          </p>
          <CreditoAguia />
        </div>
      </footer>
    </div>
  )
}
