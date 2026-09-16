cronAdd('iptu_taxas_overdue_check', '0 2 * * *', function () {
  var today = new Date().toISOString().slice(0, 10)

  try {
    var records = $app.findRecordsByFilter(
      'iptu_taxas',
      "status != 'pago' && status != 'vencido' && vencimento != '' && vencimento < '" + today + "'",
      '',
      500,
      0,
    )

    for (var i = 0; i < records.length; i++) {
      try {
        records[i].set('status', 'vencido')
        $app.save(records[i])
      } catch (err) {
        $app
          .logger()
          .error(
            'Failed to update overdue iptu_taxas record',
            'id',
            records[i].id,
            'error',
            String(err),
          )
      }
    }

    $app.logger().info('iptu_taxas overdue check completed', 'updated', records.length)
  } catch (err) {
    $app.logger().error('iptu_taxas overdue cron failed', 'error', String(err))
  }
})
