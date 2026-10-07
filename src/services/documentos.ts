import { colecao } from '@/lib/dados/cliente'
import { removerArquivo } from '@/lib/dados/arquivos'

const BUCKET_DOS_ANEXOS = 'documentos-anexos'

export const getDocumentos = (entidadeTipo: string, entidadeId: string) =>
  colecao('documentos_anexos').getFullList({
    where: [
      ['entidade_tipo', '=', entidadeTipo],
      ['entidade_id', '=', entidadeId],
    ],
    sort: '-created',
  })

export const createDocumento = (data: FormData) => colecao('documentos_anexos').create(data)

/**
 * Remove o anexo de verdade: primeiro o arquivo no armazenamento, depois a linha. Se o arquivo
 * não puder ser removido, a linha fica (a pessoa vê o documento e pode tentar de novo) em vez
 * de o arquivo ficar retido sem ninguém enxergar (SEG-07, LGPD).
 */
export async function deleteDocumento(id: string) {
  const anexos = colecao('documentos_anexos')
  const linha = await anexos.getOne<{ arquivo?: string | null }>(id)
  if (linha.arquivo) await removerArquivo(BUCKET_DOS_ANEXOS, linha.arquivo)
  return anexos.delete(id)
}
