import { describe, expect, it } from 'vitest'
import { prepararDados, sanearCorpo } from '../cliente'

describe('prepararDados', () => {
  it('objeto simples passa como veio', async () => {
    const corpo = { a: 1, b: null }
    expect(await prepararDados('contratos', corpo)).toBe(corpo)
  })

  it('texto vazio no envio com arquivo limpa a coluna (nulo)', async () => {
    const fd = new FormData()
    fd.append('numero', '001/2026')
    fd.append('fiador_id', '')
    expect(await prepararDados('contratos', fd)).toEqual({ numero: '001/2026', fiador_id: null })
  })
})

describe('sanearCorpo (CAD-01, FIN-01)', () => {
  it('tira do corpo o que veio da leitura e não é coluna para gravar', () => {
    const lido = {
      id: 'abc',
      created: '2026-01-01',
      updated: '2026-01-02',
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
      created_by: 'u1',
      updated_by: 'u2',
      collectionId: 'x',
      collectionName: 'contratos',
      expand: { imovel: { id: 'i' } },
      exp__imovel: { id: 'i' },
      exp__qualquer_outra: 1,
      numero: '001/2026',
      valor_aluguel: 1500,
    }
    expect(sanearCorpo(lido)).toEqual({ numero: '001/2026', valor_aluguel: 1500 })
  })

  it('mantém as colunas editáveis, inclusive as vazias, nulas e falsas', () => {
    const corpo = { observacoes: '', fiador_id: null, ativo: false, valor: 0 }
    expect(sanearCorpo(corpo)).toEqual(corpo)
  })

  it('expand como texto "[object Object]" também sai (o que o formulário reenviava)', () => {
    expect(sanearCorpo({ expand: '[object Object]', status: 'ativo' })).toEqual({ status: 'ativo' })
  })

  it('não muda o objeto original', () => {
    const original = { id: '1', nome: 'a' }
    sanearCorpo(original)
    expect(original).toEqual({ id: '1', nome: 'a' })
  })
})
