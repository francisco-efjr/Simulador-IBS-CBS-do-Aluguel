/**
 * Chaves e senhas do Supabase local.
 *
 * O segredo abaixo só existe para assinar tokens deste servidor, que roda na
 * máquina de quem testa e não guarda nada real. Fica fixo de propósito: a chave
 * anônima precisa ser sempre a mesma para ir no script `dev:local` do
 * package.json, e as sessões sobrevivem a um reinício do servidor.
 */
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const SEGREDO_JWT = 'supabase-local-segredo-fixo-so-para-teste-nao-use-fora-desta-maquina'

const codificar = (objeto: unknown) => Buffer.from(JSON.stringify(objeto)).toString('base64url')
const assinatura = (corpo: string) =>
  createHmac('sha256', SEGREDO_JWT).update(corpo).digest('base64url')

/** JWT HS256, como o GoTrue assina. */
export function assinar(claims: Record<string, unknown>): string {
  const corpo = `${codificar({ alg: 'HS256', typ: 'JWT' })}.${codificar(claims)}`
  return `${corpo}.${assinatura(corpo)}`
}

/** Devolve os claims se a assinatura confere e o token não venceu; senão, `null`. */
export function verificar(token: string | undefined): Record<string, any> | null {
  const [cabecalho, claims, recebida] = (token ?? '').split('.')
  if (!cabecalho || !claims || !recebida) return null
  const esperada = assinatura(`${cabecalho}.${claims}`)
  if (esperada.length !== recebida.length) return null
  if (!timingSafeEqual(Buffer.from(esperada), Buffer.from(recebida))) return null
  try {
    const dados = JSON.parse(Buffer.from(claims, 'base64url').toString('utf8'))
    return dados.exp && dados.exp < Date.now() / 1000 ? null : dados
  } catch {
    return null
  }
}

/** Chave "anon": role anon, validade até 2100. iat e exp fixos mantêm a chave estável. */
export const CHAVE_ANONIMA = assinar({
  iss: 'supabase-local',
  role: 'anon',
  iat: 1_700_000_000,
  exp: 4_102_444_800,
})

/** scrypt com sal próprio: é o que fica em auth.users.encrypted_password. */
export function guardarSenha(senha: string): string {
  const sal = randomBytes(16).toString('hex')
  return `${sal}:${scryptSync(senha, sal, 32).toString('hex')}`
}

export function conferirSenha(senha: string, guardada: string | null): boolean {
  const [sal, hash] = (guardada ?? '').split(':')
  if (!sal || !hash) return false
  const calculado = scryptSync(senha, sal, 32)
  const esperado = Buffer.from(hash, 'hex')
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
}

/**
 * Senha de uma conta de teste: derivada do e-mail, então igual a cada boot e
 * sem texto de senha no código. O servidor grava o resultado em
 * `.contas-locais.json` (fora do git) para quem for testar ler.
 */
export function senhaDaConta(email: string): string {
  const resumo = createHash('sha256').update(`${SEGREDO_JWT}:conta:${email}`).digest('base64url')
  return `${resumo.slice(0, 14)}-Aa9!`
}
