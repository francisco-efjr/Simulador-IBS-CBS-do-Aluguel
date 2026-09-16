// Hook de auditoria para Contas Bancárias, Importações de Extratos e Convites
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('created_by') || ''
    const nome = record.getString('nome') || 'Conta #' + record.id
    const banco = record.getString('banco') || ''
    const detalhes = 'Cadastrou conta bancária "' + nome + '"' + (banco ? ' (' + banco + ')' : '')

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'criou')
    log.set('entidade', 'conta_bancaria')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on conta bancaria create', 'error', String(err))
  }
  e.next()
}, 'contas_bancarias')

// Importações de extrato
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('created_by') || ''
    const nomeArquivo = record.getString('arquivo_nome') || 'extrato'
    const total = record.get('total_transacoes') || 0
    const detalhes = 'Importou extrato "' + nomeArquivo + '" contendo ' + total + ' transações'

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'importou')
    log.set('entidade', 'importacao')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on importacao create', 'error', String(err))
  }
  e.next()
}, 'importacoes')

// Convites
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('criado_por') || ''
    const email = record.getString('email')
    const perfil = record.getString('perfil') || 'usuario'
    const detalhes = 'Enviou convite de acesso para ' + email + ' com perfil ' + perfil

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'convidou')
    log.set('entidade', 'convite')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on convite create', 'error', String(err))
  }
  e.next()
}, 'convites')

onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    const status = record.getString('status')
    const email = record.getString('email')
    let acao = 'editou'
    if (status === 'cancelado') acao = 'cancelou'
    else if (status === 'aceito') acao = 'ativou'

    const detalhes = 'Status do convite de ' + email + ' alterado para ' + status

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    log.set('acao', acao)
    log.set('entidade', 'convite')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on convite update', 'error', String(err))
  }
  e.next()
}, 'convites')
