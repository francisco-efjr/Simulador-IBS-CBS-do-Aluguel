migrate(
  (app) => {
    // 1. Criar a coleção convites se não existir
    try {
      app.findCollectionByNameOrId('convites')
    } catch (_) {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const collection = new Collection({
        name: 'convites',
        type: 'base',
        listRule: "@request.auth.id != '' && @request.auth.perfil = 'administrador'",
        viewRule: "@request.auth.id != '' && @request.auth.perfil = 'administrador'",
        createRule: "@request.auth.id != '' && @request.auth.perfil = 'administrador'",
        updateRule: "@request.auth.id != '' && @request.auth.perfil = 'administrador'",
        deleteRule: "@request.auth.id != '' && @request.auth.perfil = 'administrador'",
        fields: [
          {
            name: 'email',
            type: 'email',
            required: true,
          },
          {
            name: 'token',
            type: 'text',
            required: true,
          },
          {
            name: 'perfil',
            type: 'select',
            values: ['administrador', 'usuario'],
            maxSelect: 1,
            required: true,
          },
          {
            name: 'status',
            type: 'select',
            values: ['pendente', 'aceito', 'cancelado', 'expirado'],
            maxSelect: 1,
            required: true,
          },
          {
            name: 'data_expiracao',
            type: 'date',
            required: true,
          },
          {
            name: 'criado_por',
            type: 'relation',
            collectionId: usersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_convites_token ON convites (token)',
          'CREATE INDEX idx_convites_email ON convites (email)',
          'CREATE INDEX idx_convites_status ON convites (status)',
          'CREATE INDEX idx_convites_expiracao ON convites (data_expiracao)',
        ],
      })
      app.save(collection)
    }

    // 2. Garantir regras e campos atualizados em users
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // Regras do users:
    // list/view: admin vê todos; usuário só vê ele mesmo
    // update: admin pode atualizar qualquer um; usuário pode atualizar a si mesmo
    // delete: admin pode deletar outros (nunca a si mesmo pela regra de app/hook)
    // create: público pode criar (mas com papel 'usuario' se aberto ou validado por convite)
    usersCol.listRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.perfil = 'administrador')"
    usersCol.viewRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.perfil = 'administrador')"
    usersCol.createRule = '' // público pode criar conta (com verificação de convite/primeiro usuário via hook)
    usersCol.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.perfil = 'administrador')"
    usersCol.deleteRule = "@request.auth.id != '' && @request.auth.perfil = 'administrador'"
    app.save(usersCol)

    // 3. Garantir que se só existir 1 usuário ou se não houver admin, o primeiro usuário é administrador
    const allUsers = app.findRecordsByFilter('_pb_users_auth_', '1=1', 'created', 500, 0)
    let hasAdmin = false
    for (let i = 0; i < allUsers.length; i++) {
      if (allUsers[i].getString('perfil') === 'administrador') {
        hasAdmin = true
        break
      }
    }
    if (!hasAdmin && allUsers.length > 0) {
      allUsers[0].set('perfil', 'administrador')
      allUsers[0].set('ativo', true)
      app.save(allUsers[0])
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('convites')
      app.delete(collection)
    } catch (_) {}
  },
)
