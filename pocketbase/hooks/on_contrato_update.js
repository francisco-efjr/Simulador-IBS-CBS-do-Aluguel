onRecordAfterUpdateSuccess((e) => {
  var oldStatus = e.record.original().getString('status')
  var newStatus = e.record.getString('status')
  if (oldStatus === newStatus) {
    return e.next()
  }

  var imovelId = e.record.getString('imovel')
  var inquilinoId = e.record.getString('inquilino')
  if (!imovelId) return e.next()

  try {
    if (newStatus === 'ativo') {
      var imovel = $app.findRecordById('imoveis', imovelId)
      imovel.set('status', 'alugado')
      if (inquilinoId) {
        imovel.set('inquilino_atual', inquilinoId)
      }
      $app.save(imovel)
    } else if (newStatus === 'encerrado') {
      var activeContracts = $app.findRecordsByFilter(
        'contratos',
        "imovel = '" + imovelId + "' && status = 'ativo'",
        '',
        500,
        0,
      )
      if (activeContracts.length === 0) {
        var imovel = $app.findRecordById('imoveis', imovelId)
        imovel.set('status', 'vago')
        imovel.set('inquilino_atual', '')
        $app.save(imovel)
      }
    }
  } catch (err) {
    $app.logger().error('Failed to update property on contract update', 'error', String(err))
  }

  return e.next()
}, 'contratos')
