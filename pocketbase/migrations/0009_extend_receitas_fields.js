migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('receitas')
    var inquilinosId = app.findCollectionByNameOrId('inquilinos').id

    if (!col.fields.getByName('inquilino')) {
      col.fields.add(
        new RelationField({
          name: 'inquilino',
          collectionId: inquilinosId,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    if (!col.fields.getByName('competencia')) {
      col.fields.add(new TextField({ name: 'competencia' }))
    }
    if (!col.fields.getByName('data_vencimento')) {
      col.fields.add(new DateField({ name: 'data_vencimento' }))
    }
    if (!col.fields.getByName('valor_previsto')) {
      col.fields.add(new NumberField({ name: 'valor_previsto' }))
    }
    if (!col.fields.getByName('valor_recebido')) {
      col.fields.add(new NumberField({ name: 'valor_recebido' }))
    }
    if (!col.fields.getByName('data_recebimento')) {
      col.fields.add(new DateField({ name: 'data_recebimento' }))
    }
    if (!col.fields.getByName('status_financeiro')) {
      col.fields.add(
        new SelectField({
          name: 'status_financeiro',
          values: ['previsto', 'recebido', 'em_atraso', 'parcial'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('forma_recebimento')) {
      col.fields.add(new TextField({ name: 'forma_recebimento' }))
    }
    if (!col.fields.getByName('observacoes')) {
      col.fields.add(new TextField({ name: 'observacoes' }))
    }

    col.addIndex('idx_receitas_status_financeiro', false, 'status_financeiro', '')
    col.addIndex('idx_receitas_data_vencimento', false, 'data_vencimento', '')

    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('receitas')

    ;[
      'inquilino',
      'competencia',
      'data_vencimento',
      'valor_previsto',
      'valor_recebido',
      'data_recebimento',
      'status_financeiro',
      'forma_recebimento',
      'observacoes',
    ].forEach(function (n) {
      col.fields.removeByName(n)
    })

    col.removeIndex('idx_receitas_status_financeiro')
    col.removeIndex('idx_receitas_data_vencimento')
    app.save(col)
  },
)
