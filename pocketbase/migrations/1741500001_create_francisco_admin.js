/**
 * Semente de conta administrativa.
 *
 * A senha vem do ambiente (`PB_SEED_ADMIN_SENHA`) e não do código: senha
 * escrita em migration fica no histórico do Git para sempre, e quem tem acesso
 * ao repositório passa a ter acesso ao sistema. Sem a variável definida, a
 * conta não é criada e a migration registra o motivo — comportamento
 * deliberado, para que a ausência apareça em vez de virar uma senha padrão.
 */
migrate(
  (app) => {
    const email = $os.getenv('PB_SEED_GESTOR_EMAIL') || 'francisco.efjr@gmail.com'
    const senha = $os.getenv('PB_SEED_GESTOR_SENHA')
    if (!senha) {
      console.log('Migration 1741500001: PB_SEED_GESTOR_SENHA não definida — conta não criada.')
      return
    }

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    let user = null
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', email)
    } catch (_) {
      try {
        user = app.findFirstRecordByData('users', 'email', email)
      } catch (_) {
        user = null
      }
    }

    if (!user) {
      user = new Record(usersCol)
      user.setEmail(email)
    }

    user.setPassword(senha)
    user.setVerified(true)
    user.set('name', 'Francisco Junior')
    user.set('perfil', 'administrador')
    user.set('ativo', true)
    user.set('emailVisibility', true)
    app.save(user)
    console.log(`Migration: conta administrativa ${email} criada/atualizada a partir do ambiente`)
  },
  (app) => {},
)
