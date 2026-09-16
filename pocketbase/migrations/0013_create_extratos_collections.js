migrate(
  (app) => {
    // 1. Coleção contas_bancarias
    const contasBancarias = new Collection({
      name: 'contas_bancarias',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'banco', type: 'text' },
        { name: 'agencia', type: 'text' },
        { name: 'conta', type: 'text' },
        {
          name: 'tipo',
          type: 'select',
          values: ['Conta Corrente', 'Conta Poupança', 'Conta Investimento', 'Outros'],
          maxSelect: 1,
        },
        { name: 'saldo_inicial', type: 'number' },
        { name: 'ativo', type: 'bool' },
        { name: 'created_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'updated_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_contas_bancarias_ativo ON contas_bancarias (ativo)',
        'CREATE INDEX idx_contas_bancarias_created ON contas_bancarias (created DESC)',
      ],
    })
    app.save(contasBancarias)

    const contasBancariasId = app.findCollectionByNameOrId('contas_bancarias').id

    // 2. Coleção importacoes
    const importacoes = new Collection({
      name: 'importacoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'conta_bancaria',
          type: 'relation',
          collectionId: contasBancariasId,
          maxSelect: 1,
          required: true,
        },
        { name: 'arquivo_nome', type: 'text', required: true },
        {
          name: 'formato',
          type: 'select',
          values: ['csv', 'ofx'],
          maxSelect: 1,
          required: true,
        },
        { name: 'data_importacao', type: 'date' },
        { name: 'total_transacoes', type: 'number' },
        { name: 'transacoes_classificadas', type: 'number' },
        { name: 'transacoes_ignoradas', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'concluida', 'parcial'],
          maxSelect: 1,
        },
        { name: 'created_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'updated_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_importacoes_conta ON importacoes (conta_bancaria)',
        'CREATE INDEX idx_importacoes_status ON importacoes (status)',
        'CREATE INDEX idx_importacoes_created ON importacoes (created DESC)',
      ],
    })
    app.save(importacoes)

    const importacoesId = app.findCollectionByNameOrId('importacoes').id

    // 3. Coleção transacoes_importadas
    const transacoesImportadas = new Collection({
      name: 'transacoes_importadas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'importacao',
          type: 'relation',
          collectionId: importacoesId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'descricao', type: 'text', required: true },
        { name: 'valor', type: 'number', required: true },
        {
          name: 'tipo',
          type: 'select',
          values: ['credito', 'debito'],
          maxSelect: 1,
          required: true,
        },
        { name: 'saldo', type: 'number' },
        { name: 'classificada', type: 'bool' },
        { name: 'ignorada', type: 'bool' },
        { name: 'duplicata_detectada', type: 'bool' },
        { name: 'duplicata_ids', type: 'json' },
        { name: 'sugestao_categoria', type: 'text' },
        { name: 'sugestao_categoria_id', type: 'text' },
        { name: 'sugestao_imovel', type: 'text' },
        { name: 'sugestao_imovel_id', type: 'text' },
        { name: 'sugestao_tipo', type: 'select', values: ['receita', 'despesa'], maxSelect: 1 },
        { name: 'sugestao_confianca', type: 'number' },
        { name: 'categoria_classificada', type: 'text' },
        { name: 'imovel_classificado', type: 'text' },
        { name: 'receita_gerada', type: 'text' },
        { name: 'despesa_gerada', type: 'text' },
        { name: 'created_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'updated_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_transacoes_importacao ON transacoes_importadas (importacao)',
        'CREATE INDEX idx_transacoes_data ON transacoes_importadas (data DESC)',
        'CREATE INDEX idx_transacoes_classificada ON transacoes_importadas (classificada)',
        'CREATE INDEX idx_transacoes_ignorada ON transacoes_importadas (ignorada)',
      ],
    })
    app.save(transacoesImportadas)

    // 4. Adicionar transacao_importada_id nas coleções receitas e despesas
    const receitasCol = app.findCollectionByNameOrId('receitas')
    if (!receitasCol.fields.getByName('transacao_importada_id')) {
      receitasCol.fields.add(new TextField({ name: 'transacao_importada_id' }))
      app.save(receitasCol)
    }

    const despesasCol = app.findCollectionByNameOrId('despesas')
    if (!despesasCol.fields.getByName('transacao_importada_id')) {
      despesasCol.fields.add(new TextField({ name: 'transacao_importada_id' }))
      app.save(despesasCol)
    }

    // 5. Seed inicial de conta bancária para demonstração imediata
    try {
      const existing = app.findFirstRecordByData(
        'contas_bancarias',
        'nome',
        'Conta Principal - Itaú',
      )
    } catch (_) {
      const contaPrincipal = new Record(contasBancarias)
      contaPrincipal.set('nome', 'Conta Principal - Itaú')
      contaPrincipal.set('banco', 'Banco Itaú S.A.')
      contaPrincipal.set('agencia', '1234')
      contaPrincipal.set('conta', '56789-0')
      contaPrincipal.set('tipo', 'Conta Corrente')
      contaPrincipal.set('saldo_inicial', 250000.0)
      contaPrincipal.set('ativo', true)
      app.save(contaPrincipal)

      const contaInvest = new Record(contasBancarias)
      contaInvest.set('nome', 'Conta Investimento - BTG Pactual')
      contaInvest.set('banco', 'BTG Pactual')
      contaInvest.set('agencia', '0001')
      contaInvest.set('conta', '98765-4')
      contaInvest.set('tipo', 'Conta Investimento')
      contaInvest.set('saldo_inicial', 1200000.0)
      contaInvest.set('ativo', true)
      app.save(contaInvest)
    }
  },
  (app) => {
    try {
      const despesasCol = app.findCollectionByNameOrId('despesas')
      despesasCol.fields.removeByName('transacao_importada_id')
      app.save(despesasCol)
    } catch (_) {}

    try {
      const receitasCol = app.findCollectionByNameOrId('receitas')
      receitasCol.fields.removeByName('transacao_importada_id')
      app.save(receitasCol)
    } catch (_) {}

    try {
      const t = app.findCollectionByNameOrId('transacoes_importadas')
      app.delete(t)
    } catch (_) {}

    try {
      const i = app.findCollectionByNameOrId('importacoes')
      app.delete(i)
    } catch (_) {}

    try {
      const c = app.findCollectionByNameOrId('contas_bancarias')
      app.delete(c)
    } catch (_) {}
  },
)
