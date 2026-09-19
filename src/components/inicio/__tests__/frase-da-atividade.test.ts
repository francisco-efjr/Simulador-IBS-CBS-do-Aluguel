import { describe, expect, it } from 'vitest'
import { AUTOR_DO_SISTEMA, fraseDaAtividade, rotuloDosDetalhes } from '../frase-da-atividade'

const maria = {
  usuario: { id: 'u1', name: 'Maria Aguiar', email: 'maria@exemplo.com', perfil: 'administrador' },
}

// Os `detalhes` abaixo seguem o formato exato do gatilho tg_registrar_log:
// format('%s %s "%s"', acao, entidade, rotulo).
function log(acao: string, entidade: string, rotulo?: string, comUsuario = true) {
  return {
    acao,
    entidade,
    detalhes: rotulo === undefined ? undefined : `${acao} ${entidade} "${rotulo}"`,
    expand: comUsuario ? maria : undefined,
  }
}

describe('rotuloDosDetalhes', () => {
  it('extrai o rótulo entre aspas no fim', () => {
    expect(rotuloDosDetalhes('criou imoveis "Apto 101"')).toBe('Apto 101')
  })

  it('preserva aspas internas do próprio rótulo', () => {
    expect(rotuloDosDetalhes('editou fornecedores "Loja "Boa Vista""')).toBe('Loja "Boa Vista"')
  })

  it('devolve null quando não há rótulo', () => {
    expect(rotuloDosDetalhes(undefined)).toBeNull()
    expect(rotuloDosDetalhes('')).toBeNull()
    expect(rotuloDosDetalhes('criou imoveis ""')).toBeNull()
    expect(rotuloDosDetalhes('texto livre sem aspas')).toBeNull()
  })
})

describe('fraseDaAtividade', () => {
  it.each([
    ['criou', 'imoveis', 'Apto 101', 'Maria Aguiar cadastrou o imóvel Apto 101'],
    ['editou', 'imoveis', 'Apto 101', 'Maria Aguiar alterou o imóvel Apto 101'],
    ['excluiu', 'imoveis', 'Apto 101', 'Maria Aguiar excluiu o imóvel Apto 101'],
    ['criou', 'inquilinos', 'João Silva', 'Maria Aguiar cadastrou o inquilino João Silva'],
    ['criou', 'fornecedores', 'Elétrica Sul', 'Maria Aguiar cadastrou o fornecedor Elétrica Sul'],
    ['editou', 'contratos', '2026-001', 'Maria Aguiar alterou o contrato 2026-001'],
    ['criou', 'receitas', 'Aluguel março', 'Maria Aguiar cadastrou a receita Aluguel março'],
    ['excluiu', 'despesas', 'Pintura', 'Maria Aguiar excluiu a despesa Pintura'],
    ['criou', 'iptu_taxas', 'IPTU 2026', 'Maria Aguiar cadastrou o IPTU ou taxa IPTU 2026'],
    [
      'editou',
      'contas_bancarias',
      'Conta Itaú',
      'Maria Aguiar alterou a conta bancária Conta Itaú',
    ],
    ['criou', 'importacoes', 'extrato.ofx', 'Maria Aguiar importou o extrato extrato.ofx'],
    ['criou', 'convites', 'ana@exemplo.com', 'Maria Aguiar enviou o convite para ana@exemplo.com'],
    [
      'excluiu',
      'convites',
      'ana@exemplo.com',
      'Maria Aguiar cancelou o convite para ana@exemplo.com',
    ],
    ['criou', 'documentos_anexos', 'contrato.pdf', 'Maria Aguiar anexou o documento contrato.pdf'],
  ])('%s %s → frase natural', (acao, entidade, rotulo, esperado) => {
    expect(fraseDaAtividade(log(acao, entidade, rotulo)).texto).toBe(esperado)
  })

  it('separa autor e o que foi feito, para destacar o nome na tela', () => {
    const frase = fraseDaAtividade(log('criou', 'imoveis', 'Apto 101'))
    expect(frase.autor).toBe('Maria Aguiar')
    expect(frase.oQue).toBe('cadastrou o imóvel Apto 101')
  })

  it('aceita o nome da entidade no singular', () => {
    expect(fraseDaAtividade(log('criou', 'imovel', 'Apto 101')).oQue).toBe(
      'cadastrou o imóvel Apto 101',
    )
  })

  it('sem rótulo, a frase termina na entidade', () => {
    expect(fraseDaAtividade(log('excluiu', 'receitas')).oQue).toBe('excluiu a receita')
  })

  it('sem usuário, quem fez é o sistema', () => {
    const frase = fraseDaAtividade(log('editou', 'contratos', '2026-001', false))
    expect(frase.autor).toBe(AUTOR_DO_SISTEMA)
    expect(frase.texto).toBe('O sistema alterou o contrato 2026-001')
  })

  it('usuário com nome em branco também vira o sistema', () => {
    const frase = fraseDaAtividade({
      ...log('criou', 'imoveis', 'Apto 101', false),
      expand: { usuario: { ...maria.usuario, name: '  ' } },
    })
    expect(frase.autor).toBe(AUTOR_DO_SISTEMA)
  })

  it('entidade desconhecida: diz o que dá, sem inventar', () => {
    expect(fraseDaAtividade(log('criou', 'transacoes_importadas', 'PIX 123')).oQue).toBe(
      'cadastrou um registro de transacoes importadas: PIX 123',
    )
  })

  it('ação fora do enum: mostra os detalhes crus', () => {
    const frase = fraseDaAtividade({
      acao: 'convidou',
      entidade: 'usuario',
      detalhes: 'convidou ana@exemplo.com',
      expand: maria,
    })
    expect(frase.oQue).toBe('convidou ana@exemplo.com')
  })

  it('ação fora do enum e sem detalhes: frase genérica', () => {
    const frase = fraseDaAtividade({ acao: 'redefiniu', entidade: 'usuario', expand: maria })
    expect(frase.oQue).toBe('registrou uma atividade (redefiniu)')
  })
})
