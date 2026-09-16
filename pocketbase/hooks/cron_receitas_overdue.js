cronAdd('receitas_overdue_check', '0 2 * * *', function () {
  var today = new Date().toISOString().slice(0, 10)

  try {
    var records = $app.findRecordsByFilter(
      'receitas',
      "status_financeiro = 'previsto' && data_vencimento != '' && data_vencimento < '" +
        today +
        "'",
      '',
      500,
      0,
    )

    var updated = 0
    for (var i = 0; i < records.length; i++) {
      var newStatus = 'em_atraso'

      if (newStatus !== records[i].getString('status_financeiro')) {
        records[i].set('status_financeiro', newStatus)
        $app.save(records[i])
        updated++
      }
    }

    $app.logger().info('receitas overdue check completed', 'updated', updated)
  } catch (err) {
    $app.logger().error('receitas overdue cron failed', 'error', String(err))
  }
})
