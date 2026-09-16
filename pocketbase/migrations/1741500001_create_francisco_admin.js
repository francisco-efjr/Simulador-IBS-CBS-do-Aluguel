migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    let user = null
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'francisco.efjr@gmail.com')
    } catch (_) {
      try {
        user = app.findFirstRecordByData('users', 'email', 'francisco.efjr@gmail.com')
      } catch (_) {
        user = null
      }
    }

    if (!user) {
      user = new Record(usersCol)
      user.setEmail('francisco.efjr@gmail.com')
    }

    user.setPassword('12345678')
    user.setVerified(true)
    user.set('name', 'Francisco Junior')
    user.set('perfil', 'administrador')
    user.set('ativo', true)
    user.set('emailVisibility', true)
    app.save(user)
    console.log('Migration: Successfully created/updated admin user francisco.efjr@gmail.com in controle-de-imoveis')
  },
  (app) => {},
)
