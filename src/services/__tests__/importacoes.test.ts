import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
vi.mock('@/lib/dados/supabase', () => ({ supabase: { rpc: (...args: unknown[]) => rpc(...args) } }))

const { importarExtrato } = await import('../importacoes')

const cabecalho = { conta_bancaria: 'conta-1', arquivo_nome: 'extrato.ofx', formato: 'ofx' as const }
const linha = { data: '2026-09-01', descricao: 'PIX aluguel', valor: 1500, tipo: 'credito' as const }

describe('importarExtrato', () => {
  beforeEach(() => rpc.mockReset())

  it('envia o lote inteiro numa chamada só e devolve o id da importação', async () => {
    rpc.mockResolvedValue({ data: 'imp-1', error: null })

    await expect(importarExtrato(cabecalho, [linha, linha])).resolves.toBe('imp-1')
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('importar_extrato', {
      p_importacao: cabecalho,
      p_transacoes: [linha, linha],
    })
  })

  it('repassa a mensagem do banco para o tradutor de erros', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'new row violates row-level security policy for table "importacoes"' },
    })

    await expect(importarExtrato(cabecalho, [linha])).rejects.toThrow('row-level security')
  })

  it('recusa resposta sem id', async () => {
    rpc.mockResolvedValue({ data: null, error: null })

    await expect(importarExtrato(cabecalho, [linha])).rejects.toThrow('não devolveu')
  })
})
