// Hook de validação no ciclo de vida de users
onRecordCreate((e) => {
  const user = e.record
  const email = user.email()

  // Contar quantos usuários existem
  let totalUsers = 0
  try {
    totalUsers = $app.countRecords('_pb_users_auth_')
  } catch (_) {}

  // O primeiro usuário do sistema é automaticamente Admin
  if (totalUsers === 0) {
    user.set('perfil', 'administrador')
    user.set('ativo', true)
    e.next()
    return
  }

  // Se não for o primeiro usuário, verificar se há um convite válido para este e-mail
  try {
    const convites = $app.findRecordsByFilter(
      'convites',
      "email = '" + email.replace(/'/g, "''") + "' && status = 'pendente'",
      '-created',
      1,
      0,
    )

    if (convites && convites.length > 0) {
      const convite = convites[0]
      const expStr = convite.getString('data_expiracao')
      if (expStr) {
        const expDate = new Date(expStr.length === 10 ? expStr + 'T23:59:59Z' : expStr)
        if (expDate.getTime() < Date.now()) {
          convite.set('status', 'expirado')
          $app.save(convite)
          throw new BadRequestError('O convite associado a este e-mail expirou.')
        }
      }

      // Atribuir o perfil configurado no convite
      const perfilConvite = convite.getString('perfil') || 'usuario'
      user.set('perfil', perfilConvite)
      user.set('ativo', true)

      // Marcar convite como aceito após criar
      // Vamos salvar no onRecordAfterCreateSuccess ou atualizar aqui
    } else {
      // Se não tem convite, mas foi criado por um administrador logado
      // Permitir manter perfil configurado se admin, senão forçar 'usuario'
      if (!user.getString('perfil')) {
        user.set('perfil', 'usuario')
      }
    }
  } catch (err) {
    if (String(err).includes('expirou')) {
      throw err
    }
    // Caso padrão
    if (!user.getString('perfil')) {
      user.set('perfil', 'usuario')
    }
  }

  e.next()
}, 'users')

onRecordAfterCreateSuccess((e) => {
  const user = e.record
  const email = user.email()
  const name = user.getString('name') || email

  // Marcar convite como aceito
  try {
    const convites = $app.findRecordsByFilter(
      'convites',
      "email = '" + email.replace(/'/g, "''") + "' && status = 'pendente'",
      '-created',
      10,
      0,
    )
    for (let i = 0; i < convites.length; i++) {
      convites[i].set('status', 'aceito')
      $app.save(convites[i])
    }
  } catch (_) {}

  // Auditoria de criação de usuário
  try {
    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    log.set('usuario', user.id)
    log.set('acao', 'criou')
    log.set('entidade', 'usuario')
    log.set('detalhes', 'Novo usuário cadastrado no sistema: ' + name + ' (' + email + ')')
    $app.save(log)
  } catch (_) {}

  e.next()
}, 'users')

// Impedir exclusão do próprio admin ou do último admin
onRecordDelete((e) => {
  const user = e.record
  if (user.getString('perfil') === 'administrador') {
    const admins = $app.findRecordsByFilter(
      '_pb_users_auth_',
      "perfil = 'administrador'",
      '-created',
      10,
      0,
    )
    if (admins.length <= 1) {
      throw new BadRequestError('Não é possível remover o único administrador do sistema.')
    }
  }

  e.next()
}, 'users')

// Impedir rebaixamento do último admin
onRecordUpdate((e) => {
  const user = e.record
  const originalPerfil = user.original().getString('perfil')
  const newPerfil = user.getString('perfil')

  if (originalPerfil === 'administrador' && newPerfil !== 'administrador') {
    const admins = $app.findRecordsByFilter(
      '_pb_users_auth_',
      "perfil = 'administrador'",
      '-created',
      10,
      0,
    )
    if (admins.length <= 1) {
      throw new BadRequestError(
        'Não é possível alterar o perfil do único administrador do sistema.',
      )
    }
  }

  e.next()
}, 'users')

onRecordAfterUpdateSuccess((e) => {
  try {
    const user = e.record
    const name = user.getString('name') || user.email()
    const originalAtivo = user.original().getBool('ativo')
    const novoAtivo = user.getBool('ativo')
    let acao = 'editou'
    let detalhes = 'Atualizou cadastro do usuário ' + name

    if (originalAtivo !== novoAtivo) {
      acao = novoAtivo ? 'ativou' : 'desativou'
      detalhes = (novoAtivo ? 'Ativou' : 'Desativou') + ' o acesso do usuário ' + name
    }

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    log.set('usuario', user.id)
    log.set('acao', acao)
    log.set('entidade', 'usuario')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (_) {}

  e.next()
}, 'users')

onRecordAfterDeleteSuccess((e) => {
  try {
    const user = e.record
    const name = user.getString('name') || user.email()
    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    log.set('acao', 'excluiu')
    log.set('entidade', 'usuario')
    log.set('detalhes', 'Excluiu o usuário ' + name)
    $app.save(log)
  } catch (_) {}

  e.next()
}, 'users')
