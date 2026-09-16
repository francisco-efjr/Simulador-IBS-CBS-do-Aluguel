// Hook de auditoria para Receitas, Despesas e IPTU/Taxas
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('created_by') || ''
    const desc = record.getString('descricao') || 'Receita'
    const valor = record.get('valor') || record.get('valor_previsto') || 0
    const detalhes = 'Registrou receita "' + desc + '" no valor de R$ ' + valor

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'criou')
    log.set('entidade', 'receita')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on receita create', 'error', String(err))
  }
  e.next()
}, 'receitas')

onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('updated_by') || record.getString('created_by') || ''
    const desc = record.getString('descricao') || 'Receita'
    const statusFin = record.getString('status_financeiro') || ''
    const detalhes =
      'Atualizou receita "' + desc + '"' + (statusFin ? ' (Status: ' + statusFin + ')' : '')

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'editou')
    log.set('entidade', 'receita')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on receita update', 'error', String(err))
  }
  e.next()
}, 'receitas')

onRecordAfterDeleteSuccess((e) => {
  try {
    const record = e.record
    const desc = record.getString('descricao') || 'Receita #' + record.id
    const detalhes = 'Excluiu a receita "' + desc + '"'

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    log.set('acao', 'excluiu')
    log.set('entidade', 'receita')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on receita delete', 'error', String(err))
  }
  e.next()
}, 'receitas')

// Despesas
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('created_by') || ''
    const desc = record.getString('descricao') || 'Despesa'
    const valor = record.get('valor') || record.get('valor_previsto') || 0
    const detalhes = 'Registrou despesa "' + desc + '" no valor de R$ ' + valor

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'criou')
    log.set('entidade', 'despesa')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on despesa create', 'error', String(err))
  }
  e.next()
}, 'despesas')

onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('updated_by') || record.getString('created_by') || ''
    const desc = record.getString('descricao') || 'Despesa'
    const statusFin = record.getString('status_financeiro') || ''
    const detalhes =
      'Atualizou despesa "' + desc + '"' + (statusFin ? ' (Status: ' + statusFin + ')' : '')

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'editou')
    log.set('entidade', 'despesa')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on despesa update', 'error', String(err))
  }
  e.next()
}, 'despesas')

onRecordAfterDeleteSuccess((e) => {
  try {
    const record = e.record
    const desc = record.getString('descricao') || 'Despesa #' + record.id
    const detalhes = 'Excluiu a despesa "' + desc + '"'

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    log.set('acao', 'excluiu')
    log.set('entidade', 'despesa')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on despesa delete', 'error', String(err))
  }
  e.next()
}, 'despesas')

// IPTU e Taxas
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('created_by') || ''
    const desc = record.getString('descricao') || 'Taxa/IPTU'
    const tipo = record.getString('tipo') || ''
    const valor = record.get('valor') || 0
    const detalhes =
      'Cadastrou lançamento de ' + (tipo || 'taxa') + ' "' + desc + '" (R$ ' + valor + ')'

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'criou')
    log.set('entidade', 'iptu_taxa')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on iptu create', 'error', String(err))
  }
  e.next()
}, 'iptu_taxas')

onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('updated_by') || record.getString('created_by') || ''
    const desc = record.getString('descricao') || 'Taxa/IPTU'
    const status = record.getString('status') || ''
    const detalhes =
      'Atualizou taxa/IPTU "' + desc + '"' + (status ? ' (Status: ' + status + ')' : '')

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'editou')
    log.set('entidade', 'iptu_taxa')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on iptu update', 'error', String(err))
  }
  e.next()
}, 'iptu_taxas')

onRecordAfterDeleteSuccess((e) => {
  try {
    const record = e.record
    const desc = record.getString('descricao') || 'Taxa #' + record.id
    const detalhes = 'Excluiu taxa/IPTU "' + desc + '"'

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    log.set('acao', 'excluiu')
    log.set('entidade', 'iptu_taxa')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on iptu delete', 'error', String(err))
  }
  e.next()
}, 'iptu_taxas')
