onRecordAfterCreateSuccess((e) => {
  var status = e.record.getString('status')
  if (status !== 'ativo') {
    return e.next()
  }

  var imovelId = e.record.getString('imovel')
  var inquilinoId = e.record.getString('inquilino')
  if (!imovelId) return e.next()

  try {
    var imovel = $app.findRecordById('imoveis', imovelId)
    imovel.set('status', 'alugado')
    if (inquilinoId) {
      imovel.set('inquilino_atual', inquilinoId)
    }
    $app.save(imovel)
  } catch (err) {
    $app.logger().error('Failed to update property on contract create', 'error', String(err))
  }

  return e.next()
}, 'contratos')
