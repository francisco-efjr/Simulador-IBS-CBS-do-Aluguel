// Validação de convite pública (para permitir ao usuário verificar o convite antes ou durante o cadastro)
routerAdd('GET', '/backend/v1/convites/validar', (e) => {
  const token = e.requestInfo().query['token']
  if (!token) {
    return e.json(400, { valid: false, message: 'Token não fornecido' })
  }

  try {
    const records = $app.findRecordsByFilter(
      'convites',
      "token = '" + token.replace(/'/g, "''") + "'",
      '-created',
      1,
      0,
    )

    if (!records || records.length === 0) {
      return e.json(404, { valid: false, message: 'Convite não encontrado' })
    }

    const convite = records[0]
    const status = convite.getString('status')
    const expStr = convite.getString('data_expiracao')
    const email = convite.getString('email')
    const perfil = convite.getString('perfil') || 'usuario'

    if (status !== 'pendente') {
      return e.json(400, {
        valid: false,
        status: status,
        message: 'Este convite não está mais pendente (status: ' + status + ')',
      })
    }

    if (expStr) {
      const expDate = new Date(expStr.length === 10 ? expStr + 'T23:59:59Z' : expStr)
      if (expDate.getTime() < Date.now()) {
        try {
          convite.set('status', 'expirado')
          $app.save(convite)
        } catch (_) {}
        return e.json(400, { valid: false, status: 'expirado', message: 'Este convite expirou' })
      }
    }

    return e.json(200, {
      valid: true,
      email: email,
      perfil: perfil,
      expiracao: expStr,
    })
  } catch (err) {
    return e.json(500, { valid: false, message: 'Erro ao validar convite: ' + String(err) })
  }
})
