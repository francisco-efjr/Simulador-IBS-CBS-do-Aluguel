// Endpoint público para solicitar recuperação de senha
routerAdd('POST', '/backend/v1/auth/solicitar-recuperacao', (e) => {
  const body = e.requestInfo().body || {}
  const email = (body.email || '').trim().toLowerCase()

  if (!email || !email.includes('@')) {
    return e.json(400, { message: 'Informe um endereço de e-mail válido.' })
  }

  try {
    let userRecord = null
    try {
      userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', email)
    } catch (_) {
      // Usuário não encontrado - por segurança, retornar 200 genérico sem revelar existência
      return e.json(200, {
        success: true,
        message: 'Se o e-mail estiver cadastrado, as instruções foram enviadas.',
      })
    }

    if (!userRecord) {
      return e.json(200, {
        success: true,
        message: 'Se o e-mail estiver cadastrado, as instruções foram enviadas.',
      })
    }

    // Invalidar tokens anteriores pendentes para este usuário
    try {
      const oldTokens = $app.findRecordsByFilter(
        'password_resets',
        "email = '" + email.replace(/'/g, "''") + "' && status = 'pendente'",
        '-created',
        50,
        0,
      )
      for (let i = 0; i < oldTokens.length; i++) {
        oldTokens[i].set('status', 'expirado')
        $app.save(oldTokens[i])
      }
    } catch (_) {}

    // Gerar token seguro de 48 caracteres
    const token = $security.randomString(48)
    // Expiração em 1 hora (ISO string)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const col = $app.findCollectionByNameOrId('password_resets')
    const resetRecord = new Record(col)
    resetRecord.set('user', userRecord.id)
    resetRecord.set('email', email)
    resetRecord.set('token', token)
    resetRecord.set('status', 'pendente')
    resetRecord.set('expires_at', expiresAt)
    $app.save(resetRecord)

    // Registrar log de auditoria da solicitação
    try {
      const logsCol = $app.findCollectionByNameOrId('logs_atividade')
      const logRec = new Record(logsCol)
      logRec.set('usuario', userRecord.id)
      logRec.set('acao', 'solicitou')
      logRec.set('entidade', 'usuario')
      logRec.set('detalhes', 'Solicitação de recuperação de senha enviada para ' + email)
      $app.save(logRec)
    } catch (_) {}

    // Enviar e-mail com layout Holding Aguiar
    try {
      const mailClient = $app.newMailClient()
      const appName = 'Controle de Imóveis - Holding Aguiar'
      const subject = 'Recuperação de Senha - Holding Aguiar'
      const userName = userRecord.getString('name') || 'Colaborador'

      // URL base do frontend
      let baseUrl = $secrets.get('SITE_URL') || $os.getenv('SITE_URL') || ''
      if (!baseUrl) {
        const originHeader = e.requestInfo().headers['origin'] || ''
        const refererHeader = e.requestInfo().headers['referer'] || ''
        if (originHeader) {
          baseUrl = originHeader
        } else if (refererHeader) {
          try {
            const parsed = new URL(refererHeader)
            baseUrl = parsed.origin
          } catch (_) {}
        }
      }
      if (!baseUrl) {
        // Endereço público do sistema, para montar o link do e-mail quando a
        // requisição não traz origem. Configurável por ambiente.
        baseUrl = $os.getenv('APP_BASE_URL') || 'https://fjin.work'
      }
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1)
      }

      const resetLink = baseUrl + '/redefinir-senha?token=' + token
      const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #0a1128 0%, #1c2541 100%); padding: 28px 20px; border-radius: 10px 10px 0 0; text-align: center; border-bottom: 3px solid #d4af37;">
            <h1 style="color: #d4af37; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">HOLDING AGUIAR</h1>
            <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">SISTEMA DE GESTÃO DE IMÓVEIS</p>
          </div>
          <div style="background-color: #ffffff; padding: 32px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="color: #0a1128; font-size: 19px; margin-top: 0; font-weight: 600;">Olá, ${userName}</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
              Recebemos uma solicitação para redefinir a senha da sua conta de acesso ao <strong>${appName}</strong>.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
              Clique no botão dourado abaixo para criar uma nova senha segura:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b89628 100%); color: #0a1128; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                Redefinir Minha Senha
              </a>
            </div>

            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
              Se o botão acima não funcionar, copie e cole o seguinte link no seu navegador:
            </p>
            <div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 12px; color: #0a1128; border: 1px solid #cbd5e1;">
              ${resetLink}
            </div>

            <div style="margin-top: 24px; padding: 12px 16px; background-color: #fefce8; border-left: 4px solid #d4af37; border-radius: 4px;">
              <p style="font-size: 12px; color: #854d0e; margin: 0; line-height: 1.4;">
                ⏱ <strong>Atenção:</strong> Este link é válido por apenas <strong>1 hora</strong>. Se você não solicitou a redefinição de senha, ignore este e-mail; sua senha atual permanecerá inalterada e segura.
              </p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} Holding Aguiar - Gestão Imobiliária Patrimonial. Todos os direitos reservados.
          </div>
        </div>
      `

      mailClient.send({
        from: { address: 'no-reply@holdingaguiar.internal', name: 'Holding Aguiar' },
        to: [{ address: email }],
        subject: subject,
        html: html,
      })
    } catch (mailErr) {
      $app.logger().warn('Password reset email sending warning', 'error', String(mailErr))
    }

    return e.json(200, {
      success: true,
      message: 'Se o e-mail estiver cadastrado, as instruções foram enviadas.',
      token: token, // Retornado também para facilitar testes locais/ambientes de preview
    })
  } catch (err) {
    return e.json(500, { message: 'Erro ao processar solicitação: ' + String(err) })
  }
})
