onRecordAfterCreateSuccess((e) => {
  var status = e.record.getString('status')
  var vencimento = e.record.getString('vencimento')

  if (status === 'pago' || !vencimento) {
    return e.next()
  }

  var today = new Date().toISOString().slice(0, 10)
  if (vencimento < today) {
    try {
      var record = $app.findRecordById('iptu_taxas', e.record.id)
      record.set('status', 'vencido')
      $app.save(record)
    } catch (err) {
      $app.logger().error('Failed to set overdue status on create', 'error', String(err))
    }
  }

  return e.next()
}, 'iptu_taxas')
