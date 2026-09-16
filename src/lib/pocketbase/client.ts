import PocketBase from 'pocketbase'

import { createMockPocketBase } from '@/lib/mock/client'

/**
 * Em modo de demonstração o app roda inteiro no navegador, sobre dados falsos:
 * não há PocketBase para conversar, e qualquer credencial entra.
 *
 * É o padrão. Para voltar a falar com um PocketBase de verdade, defina
 * VITE_USE_MOCK=false e VITE_POCKETBASE_URL com o endereço do servidor.
 */
const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL as string | undefined

export const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK !== 'false'

const pb = (
  IS_MOCK_MODE ? createMockPocketBase() : new PocketBase(pocketbaseUrl)
) as unknown as PocketBase

pb.autoCancellation(false)

export default pb
