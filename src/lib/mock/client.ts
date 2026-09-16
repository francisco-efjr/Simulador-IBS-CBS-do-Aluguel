/**
 * Cliente PocketBase falso, para a versão de demonstração.
 *
 * Implementa em memória a fatia da API que a aplicação realmente usa —
 * getFullList/getList/getOne, create/update/delete, expand, sort, filter,
 * realtime e authStore — para que nenhum service ou página precise saber que
 * não existe backend do outro lado. O conjunto de dados inicial vem de
 * `dataset.ts`; as alterações feitas durante a navegação ficam no localStorage,
 * então criar um imóvel e recarregar a página não desfaz o que foi feito.
 *
 * Login: qualquer e-mail e senha entram, como um administrador. É uma vitrine,
 * não um controle de acesso.
 */

import { buildFilterPredicate } from './filter'
import { buildSeedData, RELATIONS, type MockRecord } from './dataset'

const STORAGE_KEY = 'controle-imoveis:mock-db:v1'
const AUTH_KEY = 'controle-imoveis:mock-auth:v1'

type Database = Record<string, MockRecord[]>

/* -------------------------------------------------------------- utilidades */

const clone = <T>(value: T): T =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value))

const pad = (value: number) => String(value).padStart(2, '0')

function nowStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}:${pad(d.getSeconds())}.000Z`
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 9)
}

function notFound(collection: string, id: string) {
  return Object.assign(new Error(`Registro não encontrado em ${collection}.`), {
    status: 404,
    response: { code: 404, message: 'The requested resource wasn’t found.', data: {} },
    isAbort: false,
  })
}

/** FormData não é persistível: extrai os campos e descarta os arquivos. */
function normalizeInput(data: unknown): Record<string, unknown> {
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const plain: Record<string, unknown> = {}
    data.forEach((value, key) => {
      if (typeof File !== 'undefined' && value instanceof File) return
      plain[key] = value
    })
    return plain
  }
  return { ...((data as Record<string, unknown>) ?? {}) }
}

/* ------------------------------------------------------------ persistência */

function loadDatabase(): Database {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Database
      // Coleções novas (após um deploy) entram com o seed; o que já existe é
      // preservado para não descartar o que a pessoa criou na demonstração.
      const seed = buildSeedData()
      for (const collection of Object.keys(seed)) {
        if (!Array.isArray(parsed[collection])) parsed[collection] = seed[collection]
      }
      return parsed
    }
  } catch {
    /* sem localStorage utilizável, segue só em memória */
  }
  return buildSeedData()
}

const db: Database = loadDatabase()

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    /* cota estourada ou armazenamento bloqueado: a sessão atual continua */
  }
}

/** Zera os dados de demonstração e recarrega o seed original. */
export function resetMockDatabase(): void {
  const seed = buildSeedData()
  for (const collection of Object.keys(db)) delete db[collection]
  Object.assign(db, seed)
  persist()
}

function table(collection: string): MockRecord[] {
  if (!db[collection]) db[collection] = []
  return db[collection]
}

/* ------------------------------------------------------------ consultas */

function applySort(records: MockRecord[], sort?: string): MockRecord[] {
  if (!sort) return records

  const keys = sort
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
    .map((key) => ({
      field: key.startsWith('-') || key.startsWith('+') ? key.slice(1) : key,
      descending: key.startsWith('-'),
    }))

  if (!keys.length) return records

  return [...records].sort((a, b) => {
    for (const { field, descending } of keys) {
      const left = a[field]
      const right = b[field]
      if (left === right) continue

      // Vazio sempre por último, independentemente da direção: uma data em
      // branco não é "a mais antiga", é ausência de data.
      const leftEmpty = left === undefined || left === null || left === ''
      const rightEmpty = right === undefined || right === null || right === ''
      if (leftEmpty || rightEmpty) return leftEmpty ? 1 : -1

      const numeric = typeof left === 'number' && typeof right === 'number'
      const comparison = numeric
        ? (left as number) - (right as number)
        : String(left).localeCompare(String(right), 'pt-BR')

      if (comparison !== 0) return descending ? -comparison : comparison
    }
    return 0
  })
}

/**
 * Resolve `expand` como o PocketBase: aceita lista separada por vírgula e
 * caminhos aninhados ("importacao.conta_bancaria").
 */
function applyExpand(collection: string, record: MockRecord, expand?: string): MockRecord {
  if (!expand) return record

  const result = clone(record)
  const expanded: Record<string, unknown> = (result.expand as Record<string, unknown>) ?? {}

  for (const path of expand.split(',').map((item) => item.trim())) {
    if (!path) continue

    const [field, ...rest] = path.split('.')
    const targetCollection = RELATIONS[collection]?.[field]
    if (!targetCollection) continue

    const rawValue = record[field]
    if (rawValue === undefined || rawValue === null || rawValue === '') continue

    const resolveOne = (id: string): MockRecord | undefined => {
      const related = table(targetCollection).find((item) => item.id === id)
      if (!related) return undefined
      return rest.length
        ? applyExpand(targetCollection, related, rest.join('.'))
        : (clone(related) as MockRecord)
    }

    if (Array.isArray(rawValue)) {
      const items = rawValue
        .map((id) => resolveOne(String(id)))
        .filter((item): item is MockRecord => Boolean(item))
      if (items.length) expanded[field] = items
    } else {
      const item = resolveOne(String(rawValue))
      if (item) expanded[field] = item
    }
  }

  if (Object.keys(expanded).length) result.expand = expanded
  return result
}

interface QueryOptions {
  sort?: string
  filter?: string
  expand?: string
  [key: string]: unknown
}

function queryRecords(collection: string, options: QueryOptions = {}): MockRecord[] {
  const predicate = buildFilterPredicate(options.filter)
  const matched = table(collection).filter((record) =>
    predicate(record as Record<string, unknown>),
  )
  return applySort(matched, options.sort).map((record) =>
    applyExpand(collection, record, options.expand),
  )
}

/* ------------------------------------------------------------- realtime */

type RealtimeEvent = { action: 'create' | 'update' | 'delete'; record: MockRecord }

const subscribers = new Map<string, Set<(event: RealtimeEvent) => void>>()

function emit(collection: string, action: RealtimeEvent['action'], record: MockRecord): void {
  const listeners = subscribers.get(collection)
  if (!listeners?.size) return
  const event: RealtimeEvent = { action, record: clone(record) }
  // Assíncrono, como o websocket real: o chamador termina seu próprio update
  // antes de qualquer listener reagir.
  listeners.forEach((listener) => queueMicrotask(() => listener(event)))
}

/* ------------------------------------------------------------- authStore */

interface AuthState {
  token: string
  record: MockRecord | null
}

function loadAuth(): AuthState {
  try {
    const stored = window.localStorage.getItem(AUTH_KEY)
    if (stored) return JSON.parse(stored) as AuthState
  } catch {
    /* sessão apenas em memória */
  }
  return { token: '', record: null }
}

function buildDemoUser(email: string): MockRecord {
  const normalized = email.trim().toLowerCase() || 'demo@holdingaguiar.com.br'
  const localPart = normalized.split('@')[0]
  const name = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  // Sempre administrador: a demonstração precisa abrir todos os módulos,
  // inclusive Usuários e Logs de Atividade.
  return {
    id: 'usr_demo',
    collectionId: 'mock_users',
    collectionName: 'users',
    created: nowStamp(),
    updated: nowStamp(),
    email: normalized,
    name: name || 'Usuário da Demonstração',
    perfil: 'administrador',
    ativo: true,
    permissoes: [],
    avatar: '',
    emailVisibility: true,
    verified: true,
  }
}

class MockAuthStore {
  private state: AuthState = loadAuth()
  private listeners = new Set<(token: string, record: MockRecord | null) => void>()

  get token(): string {
    return this.state.token
  }

  get record(): MockRecord | null {
    return this.state.record
  }

  /** Alias histórico do SDK; parte do código antigo ainda lê `model`. */
  get model(): MockRecord | null {
    return this.state.record
  }

  get isValid(): boolean {
    return Boolean(this.state.token && this.state.record)
  }

  save(token: string, record: MockRecord | null): void {
    this.state = { token, record }
    try {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(this.state))
    } catch {
      /* sessão apenas em memória */
    }
    this.notify()
  }

  clear(): void {
    this.state = { token: '', record: null }
    try {
      window.localStorage.removeItem(AUTH_KEY)
    } catch {
      /* nada a limpar */
    }
    this.notify()
  }

  onChange(
    callback: (token: string, record: MockRecord | null) => void,
    fireImmediately = false,
  ): () => void {
    this.listeners.add(callback)
    if (fireImmediately) callback(this.state.token, this.state.record)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state.token, this.state.record))
  }
}

const authStore = new MockAuthStore()

/* ------------------------------------------------------------- collection */

function createCollection(collection: string) {
  const currentUserId = () => authStore.record?.id ?? 'usr_demo'

  return {
    async getFullList(options: QueryOptions = {}) {
      return queryRecords(collection, options)
    },

    async getList(page = 1, perPage = 30, options: QueryOptions = {}) {
      const items = queryRecords(collection, options)
      const start = (page - 1) * perPage
      return {
        page,
        perPage,
        totalItems: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / perPage)),
        items: items.slice(start, start + perPage),
      }
    },

    async getOne(id: string, options: QueryOptions = {}) {
      const found = table(collection).find((record) => record.id === id)
      if (!found) throw notFound(collection, id)
      return applyExpand(collection, found, options.expand)
    },

    async getFirstListItem(filter: string, options: QueryOptions = {}) {
      const [first] = queryRecords(collection, { ...options, filter })
      if (!first) throw notFound(collection, filter)
      return first
    },

    async create(data: unknown, options: QueryOptions = {}) {
      const fields = normalizeInput(data)
      const stamp = nowStamp()

      const created: MockRecord = {
        id: randomId(),
        collectionId: `mock_${collection}`,
        collectionName: collection,
        created: stamp,
        updated: stamp,
        created_by: currentUserId(),
        updated_by: currentUserId(),
        ...fields,
      }

      table(collection).unshift(created)
      persist()
      emit(collection, 'create', created)
      return applyExpand(collection, created, options.expand)
    },

    async update(id: string, data: unknown, options: QueryOptions = {}) {
      const records = table(collection)
      const index = records.findIndex((record) => record.id === id)
      if (index === -1) throw notFound(collection, id)

      const updated: MockRecord = {
        ...records[index],
        ...normalizeInput(data),
        id,
        updated: nowStamp(),
        updated_by: currentUserId(),
      }

      records[index] = updated
      persist()
      emit(collection, 'update', updated)
      return applyExpand(collection, updated, options.expand)
    },

    async delete(id: string) {
      const records = table(collection)
      const index = records.findIndex((record) => record.id === id)
      if (index === -1) throw notFound(collection, id)

      const [removed] = records.splice(index, 1)
      persist()
      emit(collection, 'delete', removed)
      return true
    },

    async subscribe(_topic: string, callback: (event: RealtimeEvent) => void) {
      if (!subscribers.has(collection)) subscribers.set(collection, new Set())
      const listeners = subscribers.get(collection)!
      listeners.add(callback)

      return async () => {
        listeners.delete(callback)
      }
    },

    async unsubscribe() {
      subscribers.delete(collection)
    },

    /** Qualquer credencial entra. */
    async authWithPassword(email: string, _password: string) {
      const user = buildDemoUser(email)
      authStore.save(`mock-token-${randomId()}`, user)
      return { token: authStore.token, record: user }
    },

    async authRefresh() {
      if (!authStore.isValid) {
        throw Object.assign(new Error('Sessão expirada.'), { status: 401 })
      }
      return { token: authStore.token, record: authStore.record }
    },

    async requestPasswordReset(_email: string) {
      return true
    },

    async confirmPasswordReset() {
      return true
    },

    async listAuthMethods() {
      return { usernamePassword: true, emailPassword: true, authProviders: [] }
    },
  }
}

/* ----------------------------------------------------------- endpoints pb */

function handleSend(path: string, options: { method?: string; body?: unknown } = {}) {
  const [route, queryString] = path.split('?')
  const query = new URLSearchParams(queryString ?? '')
  const body = (options.body ?? {}) as Record<string, unknown>

  switch (route) {
    case '/backend/v1/auth/solicitar-recuperacao':
      return {
        success: true,
        message:
          'Ambiente de demonstração: nenhum e-mail é enviado. Use o link de redefinição direto.',
        token: 'demo-token-reset',
      }

    case '/backend/v1/auth/validar-token-reset':
      return {
        valid: true,
        email: String(query.get('token') ? 'demo@holdingaguiar.com.br' : ''),
        status: 'pendente',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      }

    case '/backend/v1/auth/redefinir-senha':
      return { success: true, message: 'Senha redefinida no ambiente de demonstração.' }

    case '/backend/v1/convites/enviar': {
      const expira = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
      const convite: MockRecord = {
        id: randomId(),
        collectionId: 'mock_convites',
        collectionName: 'convites',
        created: nowStamp(),
        updated: nowStamp(),
        email: String(body.email ?? '')
          .trim()
          .toLowerCase(),
        token: `demo-${randomId()}`,
        perfil: String(body.perfil ?? 'usuario'),
        status: 'pendente',
        data_expiracao: expira,
        criado_por: authStore.record?.id ?? 'usr_demo',
      }
      table('convites').unshift(convite)
      persist()
      emit('convites', 'create', convite)
      return { success: true, convite, message: 'Convite registrado (demonstração).' }
    }

    case '/backend/v1/convites/reenviar': {
      const convites = table('convites')
      const index = convites.findIndex((item) => item.id === body.id)
      if (index === -1) throw notFound('convites', String(body.id))

      convites[index] = {
        ...convites[index],
        status: 'pendente',
        token: `demo-${randomId()}`,
        data_expiracao: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        updated: nowStamp(),
      }
      persist()
      emit('convites', 'update', convites[index])
      return { success: true, convite: convites[index] }
    }

    case '/backend/v1/convites/validar': {
      const token = query.get('token') ?? ''
      const convite = table('convites').find((item) => item.token === token)
      if (!convite) return { valid: false, message: 'Convite não encontrado.' }
      if (convite.status !== 'pendente') {
        return { valid: false, status: convite.status, message: 'Convite não está mais pendente.' }
      }
      return { valid: true, email: convite.email, perfil: convite.perfil }
    }

    default:
      throw Object.assign(new Error(`Endpoint não disponível na demonstração: ${route}`), {
        status: 404,
        response: { code: 404, message: 'Not found', data: {} },
      })
  }
}

/* ------------------------------------------------------------------ client */

export function createMockPocketBase() {
  const collections = new Map<string, ReturnType<typeof createCollection>>()

  return {
    authStore,

    collection(name: string) {
      if (!collections.has(name)) collections.set(name, createCollection(name))
      return collections.get(name)!
    },

    files: {
      // Sem servidor de arquivos: o seed não referencia anexos, então qualquer
      // chamada aqui é de um registro criado durante a demonstração.
      getURL: () => '',
      getUrl: () => '',
    },

    async send(path: string, options: { method?: string; body?: unknown } = {}) {
      return handleSend(path, options)
    },

    autoCancellation() {
      /* sem requisições em voo para cancelar */
    },

    cancelAllRequests() {
      /* idem */
    },
  }
}
