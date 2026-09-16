// Hook de auditoria para Contratos
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('created_by') || ''
    const numero = record.getString('numero') || '#' + record.id
    const valor = record.get('valor_aluguel') || 0
    const detalhes = 'Criou contrato de locação ' + numero + ' (Valor: R$ ' + valor + ')'

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'criou')
    log.set('entidade', 'contrato')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on contrato create', 'error', String(err))
  }
  e.next()
}, 'contratos')

onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('updated_by') || record.getString('created_by') || ''
    const numero = record.getString('numero') || '#' + record.id
    const status = record.getString('status') || ''
    let acao = 'editou'
    if (status === 'encerrado') acao = 'encerrou'
    else if (status === 'cancelado') acao = 'cancelou'

    const detalhes = 'Alterou contrato ' + numero + (status ? ' (Status: ' + status + ')' : '')

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', acao)
    log.set('entidade', 'contrato')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on contrato update', 'error', String(err))
  }
  e.next()
}, 'contratos')

onRecordAfterDeleteSuccess((e) => {
  try {
    const record = e.record
    const numero = record.getString('numero') || '#' + record.id
    const detalhes = 'Excluiu o contrato ' + numero

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    log.set('acao', 'excluiu')
    log.set('entidade', 'contrato')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on contrato delete', 'error', String(err))
  }
  e.next()
}, 'contratos')
