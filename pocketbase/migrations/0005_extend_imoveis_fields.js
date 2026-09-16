migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('imoveis')

    app.db().newQuery("UPDATE imoveis SET status = 'vago' WHERE status = 'ativo'").execute()

    col.fields.removeByName('tipo')
    col.fields.add(
      new SelectField({
        name: 'tipo',
        values: ['casa', 'apartamento', 'sala_comercial', 'loja', 'galpao', 'terreno', 'outro'],
        maxSelect: 1,
      }),
    )

    col.fields.removeByName('status')
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['vago', 'alugado', 'em_manutencao', 'inativo'],
        maxSelect: 1,
      }),
    )

    if (!col.fields.getByName('codigo')) col.fields.add(new TextField({ name: 'codigo' }))
    if (!col.fields.getByName('nome')) col.fields.add(new TextField({ name: 'nome' }))
    if (!col.fields.getByName('matricula')) col.fields.add(new TextField({ name: 'matricula' }))
    if (!col.fields.getByName('inscricao_imobiliaria'))
      col.fields.add(new TextField({ name: 'inscricao_imobiliaria' }))
    if (!col.fields.getByName('observacoes')) col.fields.add(new TextField({ name: 'observacoes' }))
    if (!col.fields.getByName('area')) col.fields.add(new NumberField({ name: 'area' }))
    if (!col.fields.getByName('quartos'))
      col.fields.add(new NumberField({ name: 'quartos', onlyInt: true }))
    if (!col.fields.getByName('banheiros'))
      col.fields.add(new NumberField({ name: 'banheiros', onlyInt: true }))
    if (!col.fields.getByName('vagas'))
      col.fields.add(new NumberField({ name: 'vagas', onlyInt: true }))
    if (!col.fields.getByName('valor_estimado'))
      col.fields.add(new NumberField({ name: 'valor_estimado' }))
    if (!col.fields.getByName('fotos'))
      col.fields.add(
        new FileField({
          name: 'fotos',
          maxSelect: 20,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }),
      )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('imoveis')

    app.db().newQuery("UPDATE imoveis SET status = 'ativo' WHERE status = 'vago'").execute()

    col.fields.removeByName('tipo')
    col.fields.add(
      new SelectField({
        name: 'tipo',
        values: ['apartamento', 'casa', 'sala_comercial', 'terreno', 'outro'],
        maxSelect: 1,
      }),
    )

    col.fields.removeByName('status')
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['ativo', 'inativo'],
        maxSelect: 1,
      }),
    )

    ;[
      'codigo',
      'nome',
      'matricula',
      'inscricao_imobiliaria',
      'observacoes',
      'area',
      'quartos',
      'banheiros',
      'vagas',
      'valor_estimado',
      'fotos',
    ].forEach(function (n) {
      col.fields.removeByName(n)
    })

    app.save(col)
  },
)
