/**
 * Fixa a coluna "Ações" à direita da área rolável da tabela. Em tablet e notebook a
 * tabela costuma ser mais larga que a tela; sem isso, o botão de editar/excluir some
 * para fora do alcance e só aparece depois de rolar de lado.
 */
export const COLUNA_ACOES_CABECALHO =
  'sticky right-0 z-[1] bg-slate-50 shadow-[-6px_0_6px_-6px_rgba(15,23,42,0.2)]'

export const COLUNA_ACOES_CELULA =
  'sticky right-0 z-[1] bg-white [tr:hover_&]:bg-slate-50 shadow-[-6px_0_6px_-6px_rgba(15,23,42,0.2)]'
