migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('categorias_financeiras')

    var categorias = ['Aluguel', 'Multa', 'Juros', 'Reembolso', 'Outras receitas']

    for (var i = 0; i < categorias.length; i++) {
      var nome = categorias[i]
      try {
        app.findFirstRecordByData('categorias_financeiras', 'nome', nome)
      } catch (_) {
        var record = new Record(col)
        record.set('nome', nome)
        record.set('tipo', 'receita')
        record.set('status', 'ativo')
        app.save(record)
      }
    }
  },
  (app) => {
    var categorias = ['Aluguel', 'Multa', 'Juros', 'Reembolso', 'Outras receitas']
    for (var i = 0; i < categorias.length; i++) {
      try {
        var record = app.findFirstRecordByData('categorias_financeiras', 'nome', categorias[i])
        app.delete(record)
      } catch (_) {}
    }
  },
)
