import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { ARQUIVOS } from './esquema'

/**
 * Arquivos.
 *
 * Todo bucket é privado: contrato assinado e comprovante de pagamento não são
 * servidos por endereço adivinhável. Quem tem permissão no módulo recebe um
 * link assinado, de validade curta; quem não tem, não recebe link nenhum.
 */

const VALIDADE_EM_SEGUNDOS = 60 * 10

function nomeSeguro(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(-80)
}

/** Sobe o arquivo e devolve o caminho a gravar na coluna. */
export async function enviarArquivo(bucket: string, arquivo: File): Promise<string> {
  const caminho = `${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`

  const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
    contentType: arquivo.type || undefined,
    upsert: false,
  })

  if (error) throw new Error(`Falha ao enviar o arquivo: ${error.message}`)
  return caminho
}

export async function removerArquivo(bucket: string, caminho: string): Promise<void> {
  await supabase.storage.from(bucket).remove([caminho])
}

/** Descobre o bucket pelo par tabela/campo declarado em esquema.ts. */
export function bucketDe(tabela: string, campo: string): string | undefined {
  return ARQUIVOS[tabela]?.[campo]?.bucket
}

export async function urlAssinada(bucket: string, caminho: string): Promise<string | null> {
  if (!caminho) return null
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(caminho, VALIDADE_EM_SEGUNDOS)
  if (error) return null
  return data?.signedUrl ?? null
}

/**
 * Link assinado para usar direto no JSX.
 *
 * Com bucket privado a URL deixa de ser previsível e passa a ser pedida ao
 * servidor, o que torna a operação assíncrona — daí o hook em vez da função
 * síncrona que existia antes.
 */
export function useUrlDeArquivo(
  tabela: string,
  campo: string,
  caminho?: string | null,
): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const bucket = bucketDe(tabela, campo)
    if (!bucket || !caminho) {
      setUrl(null)
      return
    }

    let valido = true
    urlAssinada(bucket, caminho).then((u) => {
      if (valido) setUrl(u)
    })
    return () => {
      valido = false
    }
  }, [tabela, campo, caminho])

  return url
}
