migrate(
  (app) => {
    app
      .db()
      .newQuery("UPDATE contratos SET status = 'cancelado' WHERE status = 'rascunho'")
      .execute()

    var contratos = app.findCollectionByNameOrId('contratos')

    contratos.fields.removeByName('status')
    contratos.fields.add(
      new SelectField({
        name: 'status',
        values: ['ativo', 'encerrado', 'cancelado'],
        maxSelect: 1,
      }),
    )

    if (!contratos.fields.getByName('numero')) {
      contratos.fields.add(new TextField({ name: 'numero' }))
    }
    if (!contratos.fields.getByName('dia_vencimento')) {
      contratos.fields.add(new NumberField({ name: 'dia_vencimento', onlyInt: true }))
    }
    if (!contratos.fields.getByName('indice_reajuste')) {
      contratos.fields.add(new TextField({ name: 'indice_reajuste' }))
    }
    if (!contratos.fields.getByName('periodicidade_reajuste')) {
      contratos.fields.add(new TextField({ name: 'periodicidade_reajuste' }))
    }
    if (!contratos.fields.getByName('proxima_data_reajuste')) {
      contratos.fields.add(new DateField({ name: 'proxima_data_reajuste' }))
    }
    if (!contratos.fields.getByName('tipo_garantia')) {
      contratos.fields.add(
        new SelectField({
          name: 'tipo_garantia',
          values: [
            'caução',
            'fiador',
            'seguro-fiança',
            'título de capitalização',
            'sem garantia',
            'outros',
          ],
          maxSelect: 1,
        }),
      )
    }
    if (!contratos.fields.getByName('valor_garantia')) {
      contratos.fields.add(new NumberField({ name: 'valor_garantia' }))
    }
    if (!contratos.fields.getByName('observacoes')) {
      contratos.fields.add(new TextField({ name: 'observacoes' }))
    }
    if (!contratos.fields.getByName('documento')) {
      contratos.fields.add(
        new FileField({
          name: 'documento',
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

    contratos.addIndex('idx_contratos_data_fim', false, 'data_fim', '')
    app.save(contratos)

    var imoveis = app.findCollectionByNameOrId('imoveis')
    var inquilinosId = app.findCollectionByNameOrId('inquilinos').id

    if (!imoveis.fields.getByName('inquilino_atual')) {
      imoveis.fields.add(
        new RelationField({
          name: 'inquilino_atual',
          collectionId: inquilinosId,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    app.save(imoveis)
  },
  (app) => {
    app
      .db()
      .newQuery("UPDATE contratos SET status = 'rascunho' WHERE status = 'cancelado'")
      .execute()

    var contratos = app.findCollectionByNameOrId('contratos')
    contratos.fields.removeByName('status')
    contratos.fields.add(
      new SelectField({
        name: 'status',
        values: ['ativo', 'encerrado', 'rascunho'],
        maxSelect: 1,
      }),
    )

    ;[
      'numero',
      'dia_vencimento',
      'indice_reajuste',
      'periodicidade_reajuste',
      'proxima_data_reajuste',
      'tipo_garantia',
      'valor_garantia',
      'observacoes',
      'documento',
    ].forEach(function (n) {
      contratos.fields.removeByName(n)
    })

    contratos.removeIndex('idx_contratos_data_fim')
    app.save(contratos)

    var imoveis = app.findCollectionByNameOrId('imoveis')
    imoveis.fields.removeByName('inquilino_atual')
    app.save(imoveis)
  },
)
