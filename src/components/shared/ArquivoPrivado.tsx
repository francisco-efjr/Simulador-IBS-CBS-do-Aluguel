import type { ReactNode } from 'react'
import { useUrlDeArquivo } from '@/lib/dados/arquivos'

/**
 * Arquivo guardado em bucket privado.
 *
 * O endereço não é fixo: é pedido ao servidor e vale por alguns minutos, o que
 * impede que um link de contrato ou de comprovante vazado continue abrindo o
 * arquivo depois. Como a busca é assíncrona, o link nasce desabilitado e passa
 * a valer quando o endereço chega.
 */
interface ArquivoProps {
  tabela: string
  campo: string
  caminho?: string | null
}

export function LinkDeArquivo({
  tabela,
  campo,
  caminho,
  className,
  children,
}: ArquivoProps & { className?: string; children: ReactNode }) {
  const url = useUrlDeArquivo(tabela, campo, caminho)

  if (!url) {
    return (
      <span className={className} aria-busy="true">
        {children}
      </span>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  )
}

export function ImagemDeArquivo({
  tabela,
  campo,
  caminho,
  alt,
  className,
}: ArquivoProps & { alt: string; className?: string }) {
  const url = useUrlDeArquivo(tabela, campo, caminho)

  if (!url) return <div className={`${className ?? ''} animate-pulse bg-slate-200`} />

  return <img src={url} alt={alt} className={className} />
}
