import '@testing-library/jest-dom/vitest'

/**
 * O ambiente jsdom desta suíte não fornece window.localStorage.
 * O código de produção sobrevive a isso (todo acesso é opcional e protegido),
 * mas os testes do Modo Profissional precisam de um armazenamento real.
 */
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = new Map<string, string>()

  const localStorageStub: Storage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(key, String(value)),
  }

  Object.defineProperty(window, 'localStorage', {
    value: localStorageStub,
    configurable: true,
  })
}
