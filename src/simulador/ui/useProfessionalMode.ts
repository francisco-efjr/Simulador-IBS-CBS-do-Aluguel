import { useEffect, useState } from 'react';

const STORAGE_KEY = 'modoProfissional';
const QUERY_PARAM = 'pro';

/**
 * Modo Profissional (área reservada).
 *
 * Destrava com `?pro=1` na URL e permanece destravado neste navegador.
 * `?pro=0` remove o acesso. O locador que abre o endereço limpo nunca vê
 * os módulos técnicos — parâmetros regulatórios, parecer de auditoria,
 * dossiê jurídico e integração de API.
 *
 * Não é controle de segurança: é separação de audiência.
 */
function readInitialState(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const requested = new URLSearchParams(window.location.search).get(QUERY_PARAM);

    if (requested === '1') {
      window.localStorage?.setItem(STORAGE_KEY, '1');
      return true;
    }

    if (requested === '0') {
      window.localStorage?.removeItem(STORAGE_KEY);
      return false;
    }

    return window.localStorage?.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Retira o parâmetro da barra de endereços depois de aplicado, para que a URL
 * compartilhada por engano não carregue o destravamento junto.
 */
function stripQueryParam(): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;

  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(QUERY_PARAM)) return;
    url.searchParams.delete(QUERY_PARAM);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* barra de endereços inalterada é um resultado aceitável */
  }
}

export function useProfessionalMode(): { isProfessional: boolean; exitProfessionalMode: () => void } {
  const [isProfessional, setIsProfessional] = useState<boolean>(readInitialState);

  useEffect(() => {
    stripQueryParam();
  }, []);

  const exitProfessionalMode = () => {
    try {
      window.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      /* segue desligando na sessão corrente */
    }
    setIsProfessional(false);
  };

  return { isProfessional, exitProfessionalMode };
}
