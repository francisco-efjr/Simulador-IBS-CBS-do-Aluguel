migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('despesas')

    if (!col.fields.getByName('competencia')) {
      col.fields.add(new TextField({ name: 'competencia' }))
    }
    if (!col.fields.getByName('data_vencimento')) {
      col.fields.add(new DateField({ name: 'data_vencimento' }))
    }
    if (!col.fields.getByName('valor_previsto')) {
      col.fields.add(new NumberField({ name: 'valor_previsto' }))
    }
    if (!col.fields.getByName('valor_pago')) {
      col.fields.add(new NumberField({ name: 'valor_pago' }))
    }
    if (!col.fields.getByName('data_pagamento')) {
      col.fields.add(new DateField({ name: 'data_pagamento' }))
    }
    if (!col.fields.getByName('status_financeiro')) {
      col.fields.add(
        new SelectField({
          name: 'status_financeiro',
          values: ['previsto', 'pago', 'em_atraso', 'parcial'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('forma_pagamento')) {
      col.fields.add(new TextField({ name: 'forma_pagamento' }))
    }
    if (!col.fields.getByName('observacoes')) {
      col.fields.add(new TextField({ name: 'observacoes' }))
    }

    col.addIndex('idx_despesas_status_financeiro', false, 'status_financeiro', '')
    col.addIndex('idx_despesas_data_vencimento', false, 'data_vencimento', '')

    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('despesas')

    ;[
      'competencia',
      'data_vencimento',
      'valor_previsto',
      'valor_pago',
      'data_pagamento',
      'status_financeiro',
      'forma_pagamento',
      'observacoes',
    ].forEach(function (n) {
      col.fields.removeByName(n)
    })

    col.removeIndex('idx_despesas_status_financeiro')
    col.removeIndex('idx_despesas_data_vencimento')
    app.save(col)
  },
)
