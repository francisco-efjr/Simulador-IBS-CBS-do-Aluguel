onRecordAfterUpdateSuccess((e) => {
  var original = e.record.original()

  var valorPrevistoChanged = e.record.get('valor_previsto') !== original.get('valor_previsto')
  var valorPagoChanged = e.record.get('valor_pago') !== original.get('valor_pago')
  var dataVencimentoChanged =
    e.record.getString('data_vencimento') !== original.getString('data_vencimento')
  var dataPagamentoChanged =
    e.record.getString('data_pagamento') !== original.getString('data_pagamento')

  if (
    !valorPrevistoChanged &&
    !valorPagoChanged &&
    !dataVencimentoChanged &&
    !dataPagamentoChanged
  ) {
    return e.next()
  }

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
      $app.logger().error('Failed to set financial status on despesa update', 'error', String(err))
    }
  }

  return e.next()
}, 'despesas')
