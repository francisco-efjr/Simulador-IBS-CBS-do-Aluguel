migrate(
  (app) => {
    const usersId = '_pb_users_auth_'

    const accessRule = "@request.auth.id != ''"

    // 1. imoveis
    const imoveis = new Collection({
      name: 'imoveis',
      type: 'base',
      listRule: accessRule,
      viewRule: accessRule,
      createRule: accessRule,
      updateRule: accessRule,
      deleteRule: accessRule,
      fields: [
        { name: 'endereco', type: 'text', required: true },
        { name: 'numero', type: 'text' },
        { name: 'complemento', type: 'text' },
        { name: 'bairro', type: 'text' },
        { name: 'cidade', type: 'text' },
        { name: 'estado', type: 'text' },
        { name: 'cep', type: 'text' },
        {
          name: 'tipo',
          type: 'select',
          values: ['apartamento', 'casa', 'sala_comercial', 'terreno', 'outro'],
          maxSelect: 1,
        },
        { name: 'valor', type: 'number' },
        { name: 'status', type: 'select', values: ['ativo', 'inativo'], maxSelect: 1 },
        {
          name: 'created_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'updated_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_imoveis_status ON imoveis (status)',
        'CREATE INDEX idx_imoveis_created ON imoveis (created)',
        'CREATE INDEX idx_imoveis_created_by ON imoveis (created_by)',
      ],
    })
    app.save(imoveis)

    // 2. inquilinos
    const inquilinos = new Collection({
      name: 'inquilinos',
      type: 'base',
      listRule: accessRule,
      viewRule: accessRule,
      createRule: accessRule,
      updateRule: accessRule,
      deleteRule: accessRule,
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'cpf', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'status', type: 'select', values: ['ativo', 'inativo'], maxSelect: 1 },
        {
          name: 'created_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'updated_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_inquilinos_cpf ON inquilinos (cpf) WHERE cpf != ''",
        'CREATE INDEX idx_inquilinos_status ON inquilinos (status)',
        'CREATE INDEX idx_inquilinos_created ON inquilinos (created)',
      ],
    })
    app.save(inquilinos)

    // 3. fornecedores
    const fornecedores = new Collection({
      name: 'fornecedores',
      type: 'base',
      listRule: accessRule,
      viewRule: accessRule,
      createRule: accessRule,
      updateRule: accessRule,
      deleteRule: accessRule,
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'cnpj_cpf', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'status', type: 'select', values: ['ativo', 'inativo'], maxSelect: 1 },
        {
          name: 'created_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'updated_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_fornecedores_status ON fornecedores (status)'],
    })
    app.save(fornecedores)

    // 4. categorias_financeiras
    const categoriasFinanceiras = new Collection({
      name: 'categorias_financeiras',
      type: 'base',
      listRule: accessRule,
      viewRule: accessRule,
      createRule: accessRule,
      updateRule: accessRule,
      deleteRule: accessRule,
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'tipo', type: 'select', values: ['receita', 'despesa'], maxSelect: 1 },
        { name: 'status', type: 'select', values: ['ativo', 'inativo'], maxSelect: 1 },
        {
          name: 'created_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'updated_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_categorias_financeiras_tipo ON categorias_financeiras (tipo)',
        'CREATE INDEX idx_categorias_financeiras_status ON categorias_financeiras (status)',
      ],
    })
    app.save(categoriasFinanceiras)

    // Resolve collection IDs for relations
    const imoveisId = app.findCollectionByNameOrId('imoveis').id
    const inquilinosId = app.findCollectionByNameOrId('inquilinos').id
    const fornecedoresId = app.findCollectionByNameOrId('fornecedores').id
    const categoriasId = app.findCollectionByNameOrId('categorias_financeiras').id

    // 5. contratos
    const contratos = new Collection({
      name: 'contratos',
      type: 'base',
      listRule: accessRule,
      viewRule: accessRule,
      createRule: accessRule,
      updateRule: accessRule,
      deleteRule: accessRule,
      fields: [
        {
          name: 'imovel',
          type: 'relation',
          required: true,
          collectionId: imoveisId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'inquilino',
          type: 'relation',
          required: true,
          collectionId: inquilinosId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        { name: 'valor_aluguel', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['ativo', 'encerrado', 'rascunho'],
          maxSelect: 1,
        },
        {
          name: 'created_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'updated_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_contratos_imovel ON contratos (imovel)',
        'CREATE INDEX idx_contratos_inquilino ON contratos (inquilino)',
        'CREATE INDEX idx_contratos_status ON contratos (status)',
        'CREATE INDEX idx_contratos_created ON contratos (created)',
      ],
    })
    app.save(contratos)

    // Resolve contratos collection ID
    const contratosId = app.findCollectionByNameOrId('contratos').id

    // 6. receitas
    const receitas = new Collection({
      name: 'receitas',
      type: 'base',
      listRule: accessRule,
      viewRule: accessRule,
      createRule: accessRule,
      updateRule: accessRule,
      deleteRule: accessRule,
      fields: [
        {
          name: 'imovel',
          type: 'relation',
          required: true,
          collectionId: imoveisId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'contrato',
          type: 'relation',
          collectionId: contratosId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'categoria',
          type: 'relation',
          collectionId: categoriasId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'descricao', type: 'text' },
        { name: 'valor', type: 'number' },
        { name: 'data', type: 'date' },
        { name: 'status', type: 'select', values: ['ativo', 'inativo'], maxSelect: 1 },
        {
          name: 'created_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'updated_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_receitas_imovel ON receitas (imovel)',
        'CREATE INDEX idx_receitas_contrato ON receitas (contrato)',
        'CREATE INDEX idx_receitas_categoria ON receitas (categoria)',
        'CREATE INDEX idx_receitas_data ON receitas (data)',
        'CREATE INDEX idx_receitas_status ON receitas (status)',
      ],
    })
    app.save(receitas)

    // 7. despesas
    const despesas = new Collection({
      name: 'despesas',
      type: 'base',
      listRule: accessRule,
      viewRule: accessRule,
      createRule: accessRule,
      updateRule: accessRule,
      deleteRule: accessRule,
      fields: [
        {
          name: 'imovel',
          type: 'relation',
          required: true,
          collectionId: imoveisId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'fornecedor',
          type: 'relation',
          collectionId: fornecedoresId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'categoria',
          type: 'relation',
          collectionId: categoriasId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'descricao', type: 'text' },
        { name: 'valor', type: 'number' },
        { name: 'data', type: 'date' },
        { name: 'status', type: 'select', values: ['ativo', 'inativo'], maxSelect: 1 },
        {
          name: 'created_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'updated_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_despesas_imovel ON despesas (imovel)',
        'CREATE INDEX idx_despesas_fornecedor ON despesas (fornecedor)',
        'CREATE INDEX idx_despesas_categoria ON despesas (categoria)',
        'CREATE INDEX idx_despesas_data ON despesas (data)',
        'CREATE INDEX idx_despesas_status ON despesas (status)',
      ],
    })
    app.save(despesas)

    // 8. iptu_taxas
    const iptuTaxas = new Collection({
      name: 'iptu_taxas',
      type: 'base',
      listRule: accessRule,
      viewRule: accessRule,
      createRule: accessRule,
      updateRule: accessRule,
      deleteRule: accessRule,
      fields: [
        {
          name: 'imovel',
          type: 'relation',
          required: true,
          collectionId: imoveisId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'tipo',
          type: 'select',
          values: ['iptu', 'taxa_condominio', 'outro'],
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text' },
        { name: 'valor', type: 'number' },
        { name: 'vencimento', type: 'date' },
        { name: 'status', type: 'select', values: ['pago', 'pendente'], maxSelect: 1 },
        {
          name: 'created_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'updated_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_iptu_taxas_imovel ON iptu_taxas (imovel)',
        'CREATE INDEX idx_iptu_taxas_status ON iptu_taxas (status)',
        'CREATE INDEX idx_iptu_taxas_vencimento ON iptu_taxas (vencimento)',
      ],
    })
    app.save(iptuTaxas)

    // 9. documentos_anexos
    const documentosAnexos = new Collection({
      name: 'documentos_anexos',
      type: 'base',
      listRule: accessRule,
      viewRule: accessRule,
      createRule: accessRule,
      updateRule: accessRule,
      deleteRule: accessRule,
      fields: [
        {
          name: 'entidade_tipo',
          type: 'select',
          values: [
            'imovel',
            'inquilino',
            'contrato',
            'fornecedor',
            'despesa',
            'receita',
            'iptu_taxas',
          ],
          maxSelect: 1,
        },
        { name: 'entidade_id', type: 'text' },
        {
          name: 'arquivo',
          type: 'file',
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
        },
        { name: 'descricao', type: 'text' },
        { name: 'status', type: 'select', values: ['ativo', 'inativo'], maxSelect: 1 },
        {
          name: 'created_by',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_documentos_anexos_entidade_tipo ON documentos_anexos (entidade_tipo)',
        'CREATE INDEX idx_documentos_anexos_entidade_id ON documentos_anexos (entidade_id)',
      ],
    })
    app.save(documentosAnexos)
  },
  (app) => {
    const collections = [
      'documentos_anexos',
      'iptu_taxas',
      'despesas',
      'receitas',
      'contratos',
      'categorias_financeiras',
      'fornecedores',
      'inquilinos',
      'imoveis',
    ]
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
