import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MODULES_LIST } from '@/lib/constants'

const NOME_DO_SISTEMA = 'Holding Aguiar'

/**
 * Mantém o título da aba coerente com a tela aberta.
 *
 * Numa aplicação de página única o título fica congelado no primeiro
 * carregamento, e quem usa leitor de tela ou trabalha com várias abas perde a
 * única pista de onde está (WCAG 2.4.2).
 */
export function useTituloDaPagina(titulo?: string) {
  const location = useLocation()

  useEffect(() => {
    const modulo = MODULES_LIST.find((m) =>
      m.path === '/' ? location.pathname === '/' : location.pathname.startsWith(m.path),
    )
    const nomeDaTela = titulo ?? modulo?.title ?? 'Controle de Imóveis'
    document.title = `${nomeDaTela} — ${NOME_DO_SISTEMA}`
  }, [location.pathname, titulo])
}
