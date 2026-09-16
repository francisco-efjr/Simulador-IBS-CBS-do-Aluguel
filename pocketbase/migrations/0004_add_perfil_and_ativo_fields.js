migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('perfil')) {
      col.fields.add(
        new SelectField({
          name: 'perfil',
          values: ['administrador', 'usuario'],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('ativo')) {
      col.fields.add(new BoolField({ name: 'ativo' }))
    }

    var adminAccessRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.perfil = 'administrador')"
    col.listRule = adminAccessRule
    col.viewRule = adminAccessRule
    col.createRule =
      "@request.body.perfil != 'administrador' || (@request.auth.id != '' && @request.auth.perfil = 'administrador')"
    col.updateRule = adminAccessRule
    col.deleteRule = adminAccessRule

    app.save(col)

    var users = app.findRecordsByFilter('_pb_users_auth_', '1=1', 'created', 500, 0)
    for (var i = 0; i < users.length; i++) {
      var u = users[i]
      u.set('ativo', true)
      if (!u.getString('perfil')) {
        u.set('perfil', 'usuario')
      }
      app.save(u)
    }

    try {
      var admin = app.findAuthRecordByEmail('_pb_users_auth_', 'jm.deaguiar@gmail.com')
      admin.set('perfil', 'administrador')
      admin.set('ativo', true)
      app.save(admin)
    } catch (_) {}
  },
  (app) => {
    var col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.listRule = 'id = @request.auth.id'
    col.viewRule = 'id = @request.auth.id'
    col.createRule = ''
    col.updateRule = 'id = @request.auth.id'
    col.deleteRule = 'id = @request.auth.id'
    app.save(col)
  },
)
