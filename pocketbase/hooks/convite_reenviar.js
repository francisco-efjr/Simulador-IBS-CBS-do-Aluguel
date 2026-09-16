// Endpoint para reenviar convite por email e renovar token/expiração
routerAdd(
  'POST',
  '/backend/v1/convites/reenviar',
  (e) => {
    const auth = e.auth
    if (!auth || auth.getString('perfil') !== 'administrador') {
      return e.json(403, { message: 'Apenas administradores podem reenviar convites.' })
    }

    const body = e.requestInfo().body || {}
    const conviteId = (body.id || body.conviteId || '').trim()

    if (!conviteId) {
      return e.json(400, { message: 'ID do convite é obrigatório.' })
    }

    let convite = null
    try {
      convite = $app.findRecordById('convites', conviteId)
    } catch (_) {
      return e.json(404, { message: 'Convite não encontrado.' })
    }

    const email = convite.getString('email')
    const perfil = convite.getString('perfil') || 'usuario'

    // Verificar se o usuário já existe no sistema
    try {
      const existingUser = $app.findAuthRecordByEmail('_pb_users_auth_', email)
      if (existingUser) {
        return e.json(400, { message: 'Este usuário já possui conta ativa no sistema.' })
      }
    } catch (_) {}

    // Gerar novo token seguro de 32 caracteres hex
    const novoToken = $security.randomString(32)

    // Nova data de expiração: 7 dias a partir de hoje (YYYY-MM-DD)
    const expDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const expDateStr = expDate.toISOString().slice(0, 10)

    try {
      convite.set('token', novoToken)
      convite.set('status', 'pendente')
      convite.set('data_expiracao', expDateStr)
      $app.save(convite)

      // Determinar a URL base do frontend
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

      const activationLink = baseUrl + '/signup?token=' + encodeURIComponent(novoToken)

      // Enviar e-mail de reenvio com layout Holding Aguiar
      try {
        const mailClient = $app.newMailClient()
        const appName = 'Controle de Imóveis - Holding Aguiar'
        const subject = 'Convite de Acesso (Reenvio) - Holding Aguiar'
        const roleLabel = perfil === 'administrador' ? 'Administrador' : 'Usuário'
        const adminName = auth.getString('name') || 'um Administrador'
        const expDateFormatted = expDateStr.split('-').reverse().join('/')

        const html = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;">
            <div style="background: linear-gradient(135deg, #0a1128 0%, #1c2541 100%); padding: 28px 20px; border-radius: 10px 10px 0 0; text-align: center; border-bottom: 3px solid #d4af37;">
              <h1 style="color: #d4af37; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">HOLDING AGUIAR</h1>
              <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">SISTEMA DE GESTÃO DE IMÓVEIS</p>
            </div>
            <div style="background-color: #ffffff; padding: 32px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <h2 style="color: #0a1128; font-size: 19px; margin-top: 0; font-weight: 600;">Olá,</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
                Seu convite para acessar o sistema <strong>${appName}</strong> foi renovado por <strong>${adminName}</strong> com perfil de <strong>${roleLabel}</strong>.
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                Para concluir seu cadastro e definir seu nome e sua senha de acesso, clique no botão dourado abaixo:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationLink}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b89628 100%); color: #0a1128; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                  Ativar Meu Acesso
                </a>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px; margin-bottom: 8px;">
                Se o botão acima não funcionar, copie e cole o link abaixo diretamente no seu navegador:
              </p>
              <div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 12px; color: #0a1128; border: 1px solid #cbd5e1; margin-bottom: 20px;">
                <a href="${activationLink}" style="color: #0a1128; text-decoration: none;">${activationLink}</a>
              </div>

              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 14px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
                <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Código / Token de Convite:</span>
                <strong style="font-size: 16px; color: #0f172a; letter-spacing: 2px; font-family: monospace;">${novoToken}</strong>
              </div>

              <div style="margin-top: 20px; padding: 12px 16px; background-color: #fefce8; border-left: 4px solid #d4af37; border-radius: 4px;">
                <p style="font-size: 12px; color: #854d0e; margin: 0; line-height: 1.4;">
                  ⏱ <strong>Validade:</strong> Este convite foi renovado e é válido até <strong>${expDateFormatted}</strong> (7 dias).
                </p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
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
        $app.logger().warn('Email sending skipped or failed on resend', 'error', String(mailErr))
      }

      return e.json(200, {
        success: true,
        convite: {
          id: convite.id,
          email: convite.getString('email'),
          token: convite.getString('token'),
          perfil: convite.getString('perfil'),
          status: convite.getString('status'),
          data_expiracao: convite.getString('data_expiracao'),
        },
      })
    } catch (err) {
      return e.json(500, { message: 'Erro ao reenviar convite: ' + String(err) })
    }
  },
  $apis.requireAuth(),
)
