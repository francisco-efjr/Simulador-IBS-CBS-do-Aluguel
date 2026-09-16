// Hook de auditoria para Inquilinos e Fornecedores
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('created_by') || ''
    const nome = record.getString('nome') || 'Inquilino #' + record.id
    const doc = record.getString('cpf') || record.getString('cnpj') || ''
    const detalhes = 'Cadastrou o inquilino "' + nome + '"' + (doc ? ' (Doc: ' + doc + ')' : '')

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'criou')
    log.set('entidade', 'inquilino')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on inquilino create', 'error', String(err))
  }
  e.next()
}, 'inquilinos')

onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('updated_by') || record.getString('created_by') || ''
    const nome = record.getString('nome') || 'Inquilino #' + record.id
    const status = record.getString('status') || ''
    const detalhes =
      'Atualizou dados do inquilino "' + nome + '"' + (status ? ' (Status: ' + status + ')' : '')

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'editou')
    log.set('entidade', 'inquilino')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on inquilino update', 'error', String(err))
  }
  e.next()
}, 'inquilinos')

onRecordAfterDeleteSuccess((e) => {
  try {
    const record = e.record
    const nome = record.getString('nome') || 'Inquilino #' + record.id
    const detalhes = 'Excluiu o inquilino "' + nome + '"'

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    log.set('acao', 'excluiu')
    log.set('entidade', 'inquilino')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on inquilino delete', 'error', String(err))
  }
  e.next()
}, 'inquilinos')

// Fornecedores
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('created_by') || ''
    const nome = record.getString('nome') || 'Fornecedor #' + record.id
    const tipo = record.getString('tipo_fornecedor') || ''
    const detalhes =
      'Cadastrou o fornecedor/parceiro "' + nome + '"' + (tipo ? ' (' + tipo + ')' : '')

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'criou')
    log.set('entidade', 'fornecedor')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on fornecedor create', 'error', String(err))
  }
  e.next()
}, 'fornecedores')

onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('updated_by') || record.getString('created_by') || ''
    const nome = record.getString('nome') || 'Fornecedor #' + record.id
    const detalhes = 'Atualizou dados do fornecedor "' + nome + '"'

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'editou')
    log.set('entidade', 'fornecedor')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on fornecedor update', 'error', String(err))
  }
  e.next()
}, 'fornecedores')

onRecordAfterDeleteSuccess((e) => {
  try {
    const record = e.record
    const nome = record.getString('nome') || 'Fornecedor #' + record.id
    const detalhes = 'Excluiu o fornecedor "' + nome + '"'

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    log.set('acao', 'excluiu')
    log.set('entidade', 'fornecedor')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on fornecedor delete', 'error', String(err))
  }
  e.next()
}, 'fornecedores')
