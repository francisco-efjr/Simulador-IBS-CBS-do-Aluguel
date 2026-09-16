migrate(
  (app) => {
    const inquilinos = app.findCollectionByNameOrId('inquilinos')

    if (!inquilinos.fields.getByName('tipo_pessoa')) {
      inquilinos.fields.add(
        new SelectField({ name: 'tipo_pessoa', values: ['pf', 'pj'], maxSelect: 1 }),
      )
    }
    if (!inquilinos.fields.getByName('rg')) {
      inquilinos.fields.add(new TextField({ name: 'rg' }))
    }
    if (!inquilinos.fields.getByName('data_nascimento')) {
      inquilinos.fields.add(new DateField({ name: 'data_nascimento' }))
    }
    if (!inquilinos.fields.getByName('nome_fantasia')) {
      inquilinos.fields.add(new TextField({ name: 'nome_fantasia' }))
    }
    if (!inquilinos.fields.getByName('cnpj')) {
      inquilinos.fields.add(new TextField({ name: 'cnpj' }))
    }
    if (!inquilinos.fields.getByName('responsavel')) {
      inquilinos.fields.add(new TextField({ name: 'responsavel' }))
    }
    if (!inquilinos.fields.getByName('endereco')) {
      inquilinos.fields.add(new TextField({ name: 'endereco' }))
    }
    if (!inquilinos.fields.getByName('observacoes')) {
      inquilinos.fields.add(new TextField({ name: 'observacoes' }))
    }
    app.save(inquilinos)

    app
      .db()
      .newQuery(
        "UPDATE inquilinos SET tipo_pessoa = 'pf' WHERE tipo_pessoa = '' OR tipo_pessoa IS NULL",
      )
      .execute()

    var inquilinosRecords = app.findRecordsByFilter('inquilinos', '1=1', 'created', 500, 0)
    for (var i = 0; i < inquilinosRecords.length; i++) {
      var rec = inquilinosRecords[i]
      if (rec.getString('cnpj') && !rec.getString('cpf')) {
        rec.set('tipo_pessoa', 'pj')
        app.save(rec)
      }
    }

    var fornecedores = app.findCollectionByNameOrId('fornecedores')

    if (!fornecedores.fields.getByName('nome_fantasia')) {
      fornecedores.fields.add(new TextField({ name: 'nome_fantasia' }))
    }
    if (!fornecedores.fields.getByName('tipo_fornecedor')) {
      fornecedores.fields.add(
        new SelectField({
          name: 'tipo_fornecedor',
          values: [
            'eletricista',
            'encanador',
            'pedreiro',
            'pintor',
            'empresa_manutencao',
            'empresa_limpeza',
            'seguradora',
            'condominio',
            'outros',
          ],
          maxSelect: 1,
        }),
      )
    }
    if (!fornecedores.fields.getByName('contato')) {
      fornecedores.fields.add(new TextField({ name: 'contato' }))
    }
    if (!fornecedores.fields.getByName('endereco')) {
      fornecedores.fields.add(new TextField({ name: 'endereco' }))
    }
    if (!fornecedores.fields.getByName('servicos_prestados')) {
      fornecedores.fields.add(new TextField({ name: 'servicos_prestados' }))
    }
    if (!fornecedores.fields.getByName('observacoes')) {
      fornecedores.fields.add(new TextField({ name: 'observacoes' }))
    }
    app.save(fornecedores)

    app
      .db()
      .newQuery(
        "UPDATE fornecedores SET tipo_fornecedor = 'outros' WHERE tipo_fornecedor = '' OR tipo_fornecedor IS NULL",
      )
      .execute()
  },
  (app) => {
    var inquilinos = app.findCollectionByNameOrId('inquilinos')
    ;[
      'tipo_pessoa',
      'rg',
      'data_nascimento',
      'nome_fantasia',
      'cnpj',
      'responsavel',
      'endereco',
      'observacoes',
    ].forEach(function (n) {
      inquilinos.fields.removeByName(n)
    })
    app.save(inquilinos)

    var fornecedores = app.findCollectionByNameOrId('fornecedores')
    ;[
      'nome_fantasia',
      'tipo_fornecedor',
      'contato',
      'endereco',
      'servicos_prestados',
      'observacoes',
    ].forEach(function (n) {
      fornecedores.fields.removeByName(n)
    })
    app.save(fornecedores)
  },
)
