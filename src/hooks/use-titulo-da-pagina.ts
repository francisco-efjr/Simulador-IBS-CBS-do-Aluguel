import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MODULES_LIST } from '@/lib/constants'
import { NOME_DO_SISTEMA } from '@/lib/marca'

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
    const modulo = MODULES_LIST.find((m) => location.pathname.startsWith(m.path))
    const nomeDaTela = titulo ?? modulo?.title
    document.title = nomeDaTela ? `${nomeDaTela} — ${NOME_DO_SISTEMA}` : NOME_DO_SISTEMA
  }, [location.pathname, titulo])
}
