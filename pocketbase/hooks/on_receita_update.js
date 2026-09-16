onRecordAfterUpdateSuccess((e) => {
  var original = e.record.original()

  var valorPrevistoChanged = e.record.get('valor_previsto') !== original.get('valor_previsto')
  var valorRecebidoChanged = e.record.get('valor_recebido') !== original.get('valor_recebido')
  var dataVencimentoChanged =
    e.record.getString('data_vencimento') !== original.getString('data_vencimento')
  var dataRecebimentoChanged =
    e.record.getString('data_recebimento') !== original.getString('data_recebimento')

  if (
    !valorPrevistoChanged &&
    !valorRecebidoChanged &&
    !dataVencimentoChanged &&
    !dataRecebimentoChanged
  ) {
    return e.next()
  }

  var valorPrevisto = e.record.get('valor_previsto') || 0
  var valorRecebido = e.record.get('valor_recebido') || 0
  var dataVencimento = e.record.getString('data_vencimento')

  var newStatus = 'previsto'

  if (valorRecebido > 0 && valorRecebido >= valorPrevisto) {
    newStatus = 'recebido'
  } else if (valorRecebido > 0) {
    newStatus = 'parcial'
  } else if (dataVencimento) {
    var today = new Date().toISOString().slice(0, 10)
    if (dataVencimento < today) {
      newStatus = 'em_atraso'
    }
  }

  if (newStatus !== e.record.getString('status_financeiro')) {
    try {
      var record = $app.findRecordById('receitas', e.record.id)
      record.set('status_financeiro', newStatus)
      $app.save(record)
    } catch (err) {
      $app.logger().error('Failed to set financial status on receita update', 'error', String(err))
    }
  }

  return e.next()
}, 'receitas')
