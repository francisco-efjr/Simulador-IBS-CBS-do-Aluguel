// Endpoint público para validar token e redefinir a senha do usuário
routerAdd('POST', '/backend/v1/auth/redefinir-senha', (e) => {
  const body = e.requestInfo().body || {}
  const token = (body.token || '').trim()
  const password = body.password || ''
  const passwordConfirm = body.passwordConfirm || ''

  if (!token) {
    return e.json(400, { message: 'Token de redefinição não fornecido.' })
  }

  if (!password || password.length < 8) {
    return e.json(400, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  }

  if (password !== passwordConfirm) {
    return e.json(400, { message: 'A confirmação de senha não confere com a nova senha.' })
  }

  try {
    const records = $app.findRecordsByFilter(
      'password_resets',
      "token = '" + token.replace(/'/g, "''") + "'",
      '-created',
      1,
      0,
    )

    if (!records || records.length === 0) {
      return e.json(400, { message: 'Link de redefinição inválido ou não encontrado.' })
    }

    const resetRecord = records[0]
    const status = resetRecord.getString('status')
    const expiresAt = resetRecord.getString('expires_at')
    const userId = resetRecord.getString('user')
    const email = resetRecord.getString('email')

    if (status === 'utilizado') {
      return e.json(400, {
        message: 'Este link de redefinição já foi utilizado anteriormente.',
      })
    }

    if (status === 'expirado') {
      return e.json(400, {
        message: 'Este link de redefinição expirou. Solicite um novo link.',
      })
    }

    // Verificar expiração temporal
    if (expiresAt) {
      const expTime = new Date(expiresAt).getTime()
      if (isNaN(expTime) || expTime < Date.now()) {
        resetRecord.set('status', 'expirado')
        $app.save(resetRecord)
        return e.json(400, {
          message: 'Este link de redefinição expirou. Por favor, solicite uma nova recuperação.',
        })
      }
    }

    // Buscar usuário associado
    let userRecord = null
    try {
      if (userId) {
        userRecord = $app.findRecordById('_pb_users_auth_', userId)
      } else if (email) {
        userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', email)
      }
    } catch (_) {}

    if (!userRecord) {
      return e.json(404, { message: 'Usuário associado a este token não foi localizado.' })
    }

    // Atualizar a senha do usuário
    userRecord.setPassword(password)
    $app.save(userRecord)

    // Marcar token como utilizado
    resetRecord.set('status', 'utilizado')
    $app.save(resetRecord)

    // Registrar log de auditoria
    try {
      const logsCol = $app.findCollectionByNameOrId('logs_atividade')
      const logRec = new Record(logsCol)
      logRec.set('usuario', userRecord.id)
      logRec.set('acao', 'redefiniu')
      logRec.set('entidade', 'usuario')
      logRec.set('detalhes', 'Senha redefinida com sucesso via token de recuperação')
      $app.save(logRec)
    } catch (_) {}

    return e.json(200, {
      success: true,
      message: 'Sua senha foi redefinida com sucesso! Você já pode entrar com a nova senha.',
    })
  } catch (err) {
    return e.json(500, { message: 'Erro ao redefinir senha: ' + String(err) })
  }
})
