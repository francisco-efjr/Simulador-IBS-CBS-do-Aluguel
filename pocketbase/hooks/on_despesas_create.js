onRecordAfterCreateSuccess((e) => {
  var valorPrevisto = e.record.get('valor_previsto') || 0
  var valorPago = e.record.get('valor_pago') || 0
  var dataVencimento = e.record.getString('data_vencimento')

  var newStatus = 'previsto'

  if (valorPago > 0 && valorPago >= valorPrevisto) {
    newStatus = 'pago'
  } else if (valorPago > 0) {
    newStatus = 'parcial'
  } else if (dataVencimento) {
    var today = new Date().toISOString().slice(0, 10)
    if (dataVencimento < today) {
      newStatus = 'em_atraso'
    }
  }

  if (newStatus !== e.record.getString('status_financeiro')) {
    try {
      var record = $app.findRecordById('despesas', e.record.id)
      record.set('status_financeiro', newStatus)
      $app.save(record)
    } catch (err) {
      $app.logger().error('Failed to set financial status on despesa create', 'error', String(err))
    }
  }

  return e.next()
}, 'despesas')
