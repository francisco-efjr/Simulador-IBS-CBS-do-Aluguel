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
    const email = $os.getenv('PB_SEED_ADMIN_EMAIL') || 'jm.deaguiar@gmail.com'
    const senha = $os.getenv('PB_SEED_ADMIN_SENHA')
    if (!senha) {
      console.log(
        'Migration 0001: PB_SEED_ADMIN_SENHA não definida — conta administrativa não criada. ' +
          'Defina a variável e rode novamente para semear o primeiro acesso.',
      )
      return
    }

    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', email)
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail(email)
    record.setPassword(senha)
    record.setVerified(true)
    record.set('name', 'Administrador Aguiar')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        $os.getenv('PB_SEED_ADMIN_EMAIL') || 'jm.deaguiar@gmail.com',
      )
      app.delete(record)
    } catch (_) {}
  },
)
