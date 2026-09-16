// Hook de auditoria para Imóveis
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('created_by') || ''
    const codigo = record.getString('codigo') || ''
    const nome = record.getString('nome') || record.getString('endereco') || 'Imóvel #' + record.id
    const detalhes = 'Cadastrou o imóvel "' + nome + '"' + (codigo ? ' (Cód: ' + codigo + ')' : '')

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'criou')
    log.set('entidade', 'imovel')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on imovel create', 'error', String(err))
  }
  e.next()
}, 'imoveis')

onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.getString('updated_by') || record.getString('created_by') || ''
    const codigo = record.getString('codigo') || ''
    const nome = record.getString('nome') || record.getString('endereco') || 'Imóvel #' + record.id
    const status = record.getString('status')
    const detalhes =
      'Atualizou dados do imóvel "' + nome + '"' + (status ? ' (Status: ' + status + ')' : '')

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    if (userId) log.set('usuario', userId)
    log.set('acao', 'editou')
    log.set('entidade', 'imovel')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on imovel update', 'error', String(err))
  }
  e.next()
}, 'imoveis')

onRecordAfterDeleteSuccess((e) => {
  try {
    const record = e.record
    const codigo = record.getString('codigo') || ''
    const nome = record.getString('nome') || record.getString('endereco') || 'Imóvel #' + record.id
    const detalhes = 'Excluiu o imóvel "' + nome + '"' + (codigo ? ' (Cód: ' + codigo + ')' : '')

    const logsCol = $app.findCollectionByNameOrId('logs_atividade')
    const log = new Record(logsCol)
    log.set('acao', 'excluiu')
    log.set('entidade', 'imovel')
    log.set('detalhes', detalhes)
    $app.save(log)
  } catch (err) {
    $app.logger().warn('Audit log error on imovel delete', 'error', String(err))
  }
  e.next()
}, 'imoveis')
