import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { CLIENTE, NOME_DO_SISTEMA } from '@/lib/marca'
import { Blob } from './Blob'
import { CreditoAguia } from './CreditoAguia'
import { LogoSistema } from './LogoSistema'

interface LayoutDeAcessoProps {
  /** Título da tela (único `<h1>`). */
  titulo: string
  /** Rótulo em caixa alta acima do título ("Convite recebido", "Recuperar acesso"). */
  etiqueta?: string
  /** Ícone grande em blob, no lugar do broto da marca (ex.: "Confira seu e-mail"). */
  icone?: LucideIcon
  subtitulo?: ReactNode
  children: ReactNode
  /** Bloco informativo no fim da coluna (ex.: aviso de acesso por convite). */
  rodape?: ReactNode
}

/**
 * Moldura das telas de acesso — Login, Cadastro, Recuperar e Redefinir senha
 * (tela 01 do handoff). No computador, painel musgo à esquerda com a frase da
 * marca; no celular, papel claro com duas manchas e o formulário em coluna.
 */
export function LayoutDeAcesso({
  titulo,
  etiqueta,
  icone: Icone,
  subtitulo,
  children,
  rodape,
}: LayoutDeAcessoProps) {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-primary p-14 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Blob
          forma={1}
          cor="secondary"
          className="-bottom-40 -right-28 h-[480px] w-[520px] opacity-45 blur-[70px]"
        />
        <Blob
          forma={2}
          cor="accent"
          className="-left-20 -top-28 h-[360px] w-[380px] opacity-[0.18] blur-[60px]"
        />
        <div className="relative flex items-center gap-3.5">
          <LogoSistema invertido />
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-2xl font-bold">{NOME_DO_SISTEMA}</span>
            <span className="text-sm font-bold">{CLIENTE}</span>
          </span>
        </div>
        <div className="relative flex max-w-[500px] flex-col gap-5">
          <p className="text-balance font-serif text-[3.5rem] font-bold leading-[1.05] tracking-[-0.01em]">
            O patrimônio da família, cuidado com calma.
          </p>
          <p className="text-lg leading-relaxed">
            Imóveis, contratos, receitas e despesas no mesmo lugar, do jeito que a família precisa
            ver.
          </p>
        </div>
        <span aria-hidden="true" />
      </aside>

      <main className="relative flex min-h-dvh flex-col overflow-hidden px-6 pb-10 pt-16 lg:items-center lg:justify-center lg:p-14">
        <Blob
          forma={1}
          cor="primary"
          className="-right-28 -top-24 h-[300px] w-80 opacity-[0.22] blur-[48px] lg:hidden"
        />
        <Blob
          forma={2}
          cor="secondary"
          className="-left-32 top-56 h-60 w-64 opacity-20 blur-[52px] lg:hidden"
        />

        <div className="relative flex w-full max-w-[420px] flex-1 flex-col gap-9 lg:flex-none">
          <div className="flex flex-col gap-5">
            {Icone ? (
              <span
                aria-hidden="true"
                className="blob-2 flex h-[88px] w-[88px] -rotate-[5deg] items-center justify-center bg-primary/[.12] text-primary"
              >
                <Icone className="h-10 w-10" strokeWidth={1.75} />
              </span>
            ) : (
              <LogoSistema tamanho="lg" className="-rotate-6 shadow-hero lg:hidden" />
            )}
            <div className="flex flex-col gap-2.5">
              {etiqueta && (
                <p className="text-sm font-extrabold uppercase tracking-[.08em] text-muted-foreground">
                  {etiqueta}
                </p>
              )}
              <h1 className="text-[2.125rem] leading-[1.1] lg:text-[2.5rem]">{titulo}</h1>
              {subtitulo && (
                <div className="text-base text-accent-foreground lg:text-lg">{subtitulo}</div>
              )}
            </div>
          </div>

          {children}

          {rodape && <div className="mt-auto lg:mt-0">{rodape}</div>}
          <CreditoAguia className="text-center" />
        </div>
      </main>
    </div>
  )
}

/** Bloco informativo das telas de acesso (fundo pedra, canto orgânico, ícone musgo). */
export function AvisoDeAcesso({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3.5 rounded-[1.5rem_2.5rem_1.5rem_1.5rem] bg-muted px-5 py-4 text-[0.9375rem] leading-relaxed text-accent-foreground [&_svg]:h-6 [&_svg]:w-6 [&_svg]:shrink-0 [&_svg]:text-primary">
      {icone}
      <div>{children}</div>
    </div>
  )
}
