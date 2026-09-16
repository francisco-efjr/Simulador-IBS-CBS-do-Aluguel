migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('iptu_taxas')

    col.fields.removeByName('tipo')
    col.fields.add(
      new SelectField({
        name: 'tipo',
        values: [
          'iptu',
          'taxa_condominio',
          'seguro',
          'taxa_municipal',
          'taxa_extraordinaria',
          'outro',
        ],
        maxSelect: 1,
      }),
    )

    col.fields.removeByName('status')
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['pago', 'pendente', 'vencido'],
        maxSelect: 1,
      }),
    )

    if (!col.fields.getByName('ano_referencia')) {
      col.fields.add(new NumberField({ name: 'ano_referencia', onlyInt: true }))
    }
    if (!col.fields.getByName('data_pagamento')) {
      col.fields.add(new DateField({ name: 'data_pagamento' }))
    }
    if (!col.fields.getByName('forma_pagamento')) {
      col.fields.add(new TextField({ name: 'forma_pagamento' }))
    }
    if (!col.fields.getByName('observacoes')) {
      col.fields.add(new TextField({ name: 'observacoes' }))
    }
    if (!col.fields.getByName('comprovante')) {
      col.fields.add(
        new FileField({
          name: 'comprovante',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('iptu_taxas')

    col.fields.removeByName('tipo')
    col.fields.add(
      new SelectField({
        name: 'tipo',
        values: ['iptu', 'taxa_condominio', 'outro'],
        maxSelect: 1,
      }),
    )

    col.fields.removeByName('status')
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['pago', 'pendente'],
        maxSelect: 1,
      }),
    )

    ;['ano_referencia', 'data_pagamento', 'forma_pagamento', 'observacoes', 'comprovante'].forEach(
      function (n) {
        col.fields.removeByName(n)
      },
    )

    app.save(col)
  },
)
