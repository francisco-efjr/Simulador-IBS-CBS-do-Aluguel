import { useCallback, useEffect, useState } from 'react'

/**
 * Escala de leitura do sistema.
 *
 * Aumentar a fonte é o primeiro ajuste que uma pessoa com vista cansada
 * procura, e nem todo mundo sabe fazer isso pelo navegador. O controle vive no
 * cabeçalho, ao alcance do olho, e a preferência acompanha o usuário nas
 * próximas visitas.
 *
 * O valor entra em `--escala-leitura`, que define o `font-size` da raiz. Como
 * todo o sistema está em `rem`, texto, espaçamento e alvos de toque crescem
 * juntos — nada quebra de layout, nada fica ilhado em pixel fixo.
 */
export const ESCALAS = [
  { id: 'normal', rotulo: 'Normal', valor: '100%' },
  { id: 'grande', rotulo: 'Grande', valor: '118%' },
  { id: 'maior', rotulo: 'Maior', valor: '135%' },
] as const

export type EscalaId = (typeof ESCALAS)[number]['id']

const CHAVE = 'controle-imoveis:escala-leitura'

function ler(): EscalaId {
  if (typeof window === 'undefined') return 'normal'
  try {
    const guardado = window.localStorage.getItem(CHAVE)
    if (guardado && ESCALAS.some((e) => e.id === guardado)) return guardado as EscalaId
  } catch {
    /* armazenamento bloqueado: a sessão atual ainda funciona */
  }
  return 'normal'
}

export function useEscalaLeitura() {
  const [escala, setEscalaEstado] = useState<EscalaId>(ler)

  useEffect(() => {
    const definicao = ESCALAS.find((e) => e.id === escala) ?? ESCALAS[0]
    document.documentElement.style.setProperty('--escala-leitura', definicao.valor)
    document.documentElement.dataset.escalaLeitura = definicao.id
  }, [escala])

  const definirEscala = useCallback((proxima: EscalaId) => {
    setEscalaEstado(proxima)
    try {
      window.localStorage.setItem(CHAVE, proxima)
    } catch {
      /* preferência não persiste, mas vale para esta sessão */
    }
  }, [])

  const aumentar = useCallback(() => {
    const indice = ESCALAS.findIndex((e) => e.id === escala)
    definirEscala(ESCALAS[Math.min(indice + 1, ESCALAS.length - 1)].id)
  }, [escala, definirEscala])

  const diminuir = useCallback(() => {
    const indice = ESCALAS.findIndex((e) => e.id === escala)
    definirEscala(ESCALAS[Math.max(indice - 1, 0)].id)
  }, [escala, definirEscala])

  return { escala, definirEscala, aumentar, diminuir, escalas: ESCALAS }
}
