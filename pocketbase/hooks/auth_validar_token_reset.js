// Endpoint público para checar a validade do token de redefinição antes de exibir formulário
routerAdd('GET', '/backend/v1/auth/validar-token-reset', (e) => {
  const token = (e.requestInfo().query['token'] || '').trim()
  if (!token) {
    return e.json(400, { valid: false, message: 'Token não fornecido.' })
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
      return e.json(404, {
        valid: false,
        message: 'Link de redefinição não encontrado ou inválido.',
      })
    }

    const resetRecord = records[0]
    const status = resetRecord.getString('status')
    const expiresAt = resetRecord.getString('expires_at')
    const email = resetRecord.getString('email')

    if (status === 'utilizado') {
      return e.json(400, {
        valid: false,
        status: 'utilizado',
        message: 'Este link de redefinição já foi utilizado.',
      })
    }

    if (status === 'expirado') {
      return e.json(400, {
        valid: false,
        status: 'expirado',
        message: 'Este link de redefinição já expirou.',
      })
    }

    if (expiresAt) {
      const expTime = new Date(expiresAt).getTime()
      if (isNaN(expTime) || expTime < Date.now()) {
        try {
          resetRecord.set('status', 'expirado')
          $app.save(resetRecord)
        } catch (_) {}
        return e.json(400, {
          valid: false,
          status: 'expirado',
          message: 'Este link de redefinição expirou.',
        })
      }
    }

    return e.json(200, {
      valid: true,
      email: email,
      expires_at: expiresAt,
    })
  } catch (err) {
    return e.json(500, { valid: false, message: 'Erro ao validar token: ' + String(err) })
  }
})
