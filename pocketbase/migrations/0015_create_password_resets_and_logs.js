migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Coleção password_resets (para gerenciar tokens de redefinição de senha com expiração)
    try {
      app.findCollectionByNameOrId('password_resets')
    } catch (_) {
      const resetCol = new Collection({
        name: 'password_resets',
        type: 'base',
        listRule: null, // Apenas hooks / superuser têm acesso direto aos dados
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'user',
            type: 'relation',
            collectionId: usersCol.id,
            maxSelect: 1,
            required: true,
            cascadeDelete: true,
          },
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
            name: 'status',
            type: 'select',
            values: ['pendente', 'utilizado', 'expirado'],
            maxSelect: 1,
            required: true,
          },
          {
            name: 'expires_at',
            type: 'text',
            required: true,
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
          'CREATE UNIQUE INDEX idx_pwd_resets_token ON password_resets (token)',
          'CREATE INDEX idx_pwd_resets_email ON password_resets (email)',
          'CREATE INDEX idx_pwd_resets_status ON password_resets (status)',
        ],
      })
      app.save(resetCol)
    }

    // 2. Coleção logs_atividade (Auditoria do sistema)
    try {
      app.findCollectionByNameOrId('logs_atividade')
    } catch (_) {
      const logsCol = new Collection({
        name: 'logs_atividade',
        type: 'base',
        // Somente administradores autenticados podem listar ou visualizar logs
        listRule: "@request.auth.id != '' && @request.auth.perfil = 'administrador'",
        viewRule: "@request.auth.id != '' && @request.auth.perfil = 'administrador'",
        // Criação permitida para requisições autenticadas ou via hooks server-side
        createRule: "@request.auth.id != ''",
        // Ninguém pela interface pode editar ou deletar registros de auditoria
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            collectionId: usersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'acao',
            type: 'text',
            required: true,
          },
          {
            name: 'entidade',
            type: 'text',
            required: true,
          },
          {
            name: 'detalhes',
            type: 'text',
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
          'CREATE INDEX idx_logs_usuario ON logs_atividade (usuario)',
          'CREATE INDEX idx_logs_acao ON logs_atividade (acao)',
          'CREATE INDEX idx_logs_entidade ON logs_atividade (entidade)',
          'CREATE INDEX idx_logs_created ON logs_atividade (created)',
        ],
      })
      app.save(logsCol)
    }
  },
  (app) => {
    try {
      const logsCol = app.findCollectionByNameOrId('logs_atividade')
      app.delete(logsCol)
    } catch (_) {}

    try {
      const resetCol = app.findCollectionByNameOrId('password_resets')
      app.delete(resetCol)
    } catch (_) {}
  },
)
