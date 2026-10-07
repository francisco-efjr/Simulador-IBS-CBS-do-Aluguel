import { beforeEach, describe, expect, it, vi } from 'vitest'

const { chamadas, getOne, apagarLinha, removerArquivo } = vi.hoisted(() => {
  const chamadas: string[] = []
  return {
    chamadas,
    getOne: vi.fn(),
    apagarLinha: vi.fn(async (id: string) => {
      chamadas.push(`linha:${id}`)
      return true
    }),
    removerArquivo: vi.fn(async (bucket: string, caminho: string) => {
      chamadas.push(`arquivo:${bucket}/${caminho}`)
    }),
  }
})

vi.mock('@/lib/dados/cliente', () => ({
  colecao: () => ({ getOne, delete: apagarLinha, getFullList: vi.fn(), create: vi.fn() }),
}))
vi.mock('@/lib/dados/arquivos', () => ({ removerArquivo }))

import { deleteDocumento } from '../documentos'

beforeEach(() => {
  chamadas.length = 0
  vi.clearAllMocks()
})

describe('deleteDocumento (SEG-07)', () => {
  it('apaga o arquivo do bucket e só depois a linha', async () => {
    getOne.mockResolvedValue({ arquivo: 'receita/abc-contrato.pdf' })
    await deleteDocumento('doc1')
    expect(chamadas).toEqual(['arquivo:documentos-anexos/receita/abc-contrato.pdf', 'linha:doc1'])
  })

  it('se o arquivo não puder ser removido, a linha fica (dá para tentar de novo)', async () => {
    getOne.mockResolvedValue({ arquivo: 'receita/abc-contrato.pdf' })
    removerArquivo.mockRejectedValueOnce(new Error('sem permissão'))
    await expect(deleteDocumento('doc1')).rejects.toThrow('sem permissão')
    expect(apagarLinha).not.toHaveBeenCalled()
  })

  it('anexo sem arquivo gravado só apaga a linha', async () => {
    getOne.mockResolvedValue({ arquivo: null })
    await deleteDocumento('doc2')
    expect(removerArquivo).not.toHaveBeenCalled()
    expect(chamadas).toEqual(['linha:doc2'])
  })
})
