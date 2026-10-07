import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ReceitaDetailDialog } from '@/components/receitas/ReceitaDetailDialog'
import { DespesaDetailDialog } from '@/components/despesas/DespesaDetailDialog'
import { IptuTaxaDetailDialog } from '@/components/iptu-taxas/IptuTaxaDetailDialog'
import { rotuloDoLancamento } from '@/lib/rotulo-lancamento'

// Os anexos falam com o banco; aqui só interessa o botão de excluir.
vi.mock('@/components/shared/DocumentUpload', () => ({ DocumentUpload: () => null }))
vi.mock('@/components/shared/ArquivoPrivado', () => ({ LinkDeArquivo: () => null }))

const receita = {
  id: 'r1',
  descricao: 'Aluguel 2026-10',
  valor_previsto: 4500,
  data_vencimento: '2026-10-10',
  status_financeiro: 'parcial',
  expand: { imovel: { nome: 'Sala 01' } },
}
const despesa = {
  id: 'd1',
  descricao: 'Condomínio Sala 01',
  valor_previsto: 650,
  data_vencimento: '2026-10-08',
  status_financeiro: 'previsto',
  expand: { imovel: { nome: 'Sala 01' } },
}
const iptu = {
  id: 'i1',
  descricao: 'IPTU 2026',
  tipo: 'iptu',
  valor: 1890,
  vencimento: '2026-09-06',
  status: 'vencido',
  expand: { imovel: { nome: 'Apartamento Centro' } },
}

const casos = [
  ['receita', () => ReceitaDetailDialog, { receita }, /Sim, excluir receita/],
  ['despesa', () => DespesaDetailDialog, { despesa }, /Sim, excluir despesa/],
  ['obrigação (IPTU/taxa)', () => IptuTaxaDetailDialog, { iptuTaxa: iptu }, /Sim, excluir obrigação/],
] as const

describe('excluir lançamento financeiro pede confirmação (FIN-06)', () => {
  it.each(casos)('%s: só apaga depois do "Sim, excluir"', (_nome, componente, props, rotulo) => {
    const onDelete = vi.fn()
    const Dialogo = componente() as React.ComponentType<Record<string, unknown>>
    render(
      <Dialogo
        {...props}
        open
        onOpenChange={() => {}}
        onEdit={() => {}}
        onDelete={onDelete}
        canEdit
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^Excluir/ }))
    expect(onDelete).not.toHaveBeenCalled()

    const confirmacao = screen.getByRole('alertdialog')
    expect(confirmacao.textContent).toMatch(/Essa ação não pode ser desfeita/)
    expect(confirmacao.textContent).toMatch(/vencimento em/)

    fireEvent.click(screen.getByRole('button', { name: rotulo }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('"Voltar sem alterar" não apaga', () => {
    const onDelete = vi.fn()
    render(
      <ReceitaDetailDialog
        receita={receita}
        open
        onOpenChange={() => {}}
        onEdit={() => {}}
        onDelete={onDelete}
        canEdit
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /^Excluir/ }))
    fireEvent.click(screen.getByRole('button', { name: /Voltar sem alterar/ }))
    expect(onDelete).not.toHaveBeenCalled()
  })
})

describe('rotuloDoLancamento', () => {
  it('usa descrição e imóvel; cai para categoria e depois para o padrão', () => {
    expect(rotuloDoLancamento(receita, 'Receita')).toBe('Aluguel 2026-10 (Sala 01)')
    expect(rotuloDoLancamento({ expand: { categoria: { nome: 'Aluguel' } } }, 'Receita')).toBe(
      'Aluguel',
    )
    expect(rotuloDoLancamento({}, 'Receita')).toBe('Receita')
    expect(rotuloDoLancamento(null, 'Receita')).toBe('Receita')
  })
})
