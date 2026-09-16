migrate(
  (app) => {
    // 1. Ensure admin user exists.
    // A busca e a criação precisam usar o mesmo endereço: com e-mail vindo do
    // ambiente, procurar por um valor fixo faria a migration tentar criar uma
    // conta que já existe e falhar na restrição de unicidade.
    const emailAdmin = $os.getenv('PB_SEED_ADMIN_EMAIL') || 'jm.deaguiar@gmail.com'
    let adminUser
    try {
      adminUser = app.findAuthRecordByEmail('_pb_users_auth_', emailAdmin)
    } catch (_) {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      adminUser = new Record(usersCol)
      adminUser.setEmail(emailAdmin)
      // Sem senha no ambiente, gera uma aleatória: a conta existe para
      // referenciar os dados de exemplo, não para servir de acesso conhecido.
      adminUser.setPassword($os.getenv('PB_SEED_ADMIN_SENHA') || $security.randomString(24))
      adminUser.setVerified(true)
      adminUser.set('name', 'Administrador Aguiar')
      app.save(adminUser)
    }
    const adminUserId = adminUser.id

    // Helper: find or create
    function findOrCreate(collectionName, fieldName, fieldValue, setFields) {
      try {
        const existing = app.findFirstRecordByData(collectionName, fieldName, fieldValue)
        return existing
      } catch (_) {
        const col = app.findCollectionByNameOrId(collectionName)
        const record = new Record(col)
        setFields(record)
        app.save(record)
        return record
      }
    }

    // 2. Seed imoveis
    const imovel1 = findOrCreate('imoveis', 'endereco', 'Av. Paulista', (r) => {
      r.set('endereco', 'Av. Paulista')
      r.set('numero', '1578')
      r.set('complemento', 'Apto 92')
      r.set('bairro', 'Bela Vista')
      r.set('cidade', 'São Paulo')
      r.set('estado', 'SP')
      r.set('cep', '01310-200')
      r.set('tipo', 'apartamento')
      r.set('valor', 4500)
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    const imovel2 = findOrCreate('imoveis', 'endereco', 'Rua das Flores', (r) => {
      r.set('endereco', 'Rua das Flores')
      r.set('numero', '245')
      r.set('complemento', '')
      r.set('bairro', 'Centro')
      r.set('cidade', 'Campinas')
      r.set('estado', 'SP')
      r.set('cep', '13010-010')
      r.set('tipo', 'casa')
      r.set('valor', 3200)
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    const imovel3 = findOrCreate('imoveis', 'endereco', 'Rua Comercial', (r) => {
      r.set('endereco', 'Rua Comercial')
      r.set('numero', '500')
      r.set('complemento', 'Sala 12')
      r.set('bairro', 'Centro')
      r.set('cidade', 'São Paulo')
      r.set('estado', 'SP')
      r.set('cep', '01010-000')
      r.set('tipo', 'sala_comercial')
      r.set('valor', 2800)
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    // 3. Seed inquilinos
    const inquilino1 = findOrCreate('inquilinos', 'cpf', '123.456.789-00', (r) => {
      r.set('nome', 'Carlos Eduardo Santos')
      r.set('cpf', '123.456.789-00')
      r.set('email', 'carlos.santos@email.com')
      r.set('telefone', '(11) 98765-4321')
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    const inquilino2 = findOrCreate('inquilinos', 'cpf', '987.654.321-00', (r) => {
      r.set('nome', 'Maria Fernanda Oliveira')
      r.set('cpf', '987.654.321-00')
      r.set('email', 'maria.oliveira@email.com')
      r.set('telefone', '(19) 99876-5432')
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    // 4. Seed fornecedores
    const fornecedor1 = findOrCreate('fornecedores', 'cnpj_cpf', '12.345.678/0001-90', (r) => {
      r.set('nome', 'Eletricista Profissional Ltda')
      r.set('cnpj_cpf', '12.345.678/0001-90')
      r.set('email', 'contato@eletricista.com.br')
      r.set('telefone', '(11) 3333-4444')
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    const fornecedor2 = findOrCreate('fornecedores', 'cnpj_cpf', '98.765.432/0001-10', (r) => {
      r.set('nome', 'Encanador Rápido ME')
      r.set('cnpj_cpf', '98.765.432/0001-10')
      r.set('email', 'servico@encanadorrapido.com.br')
      r.set('telefone', '(11) 5555-6666')
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    // 5. Seed categorias_financeiras
    const catReceita = findOrCreate('categorias_financeiras', 'nome', 'Aluguel', (r) => {
      r.set('nome', 'Aluguel')
      r.set('tipo', 'receita')
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    const catDespesa = findOrCreate('categorias_financeiras', 'nome', 'Manutenção', (r) => {
      r.set('nome', 'Manutenção')
      r.set('tipo', 'despesa')
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    const catDespesa2 = findOrCreate('categorias_financeiras', 'nome', 'IPTU', (r) => {
      r.set('nome', 'IPTU')
      r.set('tipo', 'despesa')
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    // 6. Seed contrato
    findOrCreate('contratos', 'imovel', imovel1.id, (r) => {
      r.set('imovel', imovel1.id)
      r.set('inquilino', inquilino1.id)
      r.set('data_inicio', '2025-01-01')
      r.set('data_fim', '2026-12-31')
      r.set('valor_aluguel', 4500)
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    // Resolve contrato record
    let contrato1
    try {
      contrato1 = app.findFirstRecordByFilter('contratos', 'imovel = {:imovelId}', {
        imovelId: imovel1.id,
      })
    } catch (_) {
      contrato1 = null
    }

    // 7. Seed receita
    findOrCreate('receitas', 'descricao', 'Aluguel referente a Janeiro/2025', (r) => {
      r.set('imovel', imovel1.id)
      r.set('contrato', contrato1 ? contrato1.id : '')
      r.set('categoria', catReceita.id)
      r.set('descricao', 'Aluguel referente a Janeiro/2025')
      r.set('valor', 4500)
      r.set('data', '2025-01-05')
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    // 8. Seed despesa
    findOrCreate('despesas', 'descricao', 'Reparo elétrico no apartamento', (r) => {
      r.set('imovel', imovel1.id)
      r.set('fornecedor', fornecedor1.id)
      r.set('categoria', catDespesa.id)
      r.set('descricao', 'Reparo elétrico no apartamento')
      r.set('valor', 350)
      r.set('data', '2025-01-15')
      r.set('status', 'ativo')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })

    // 9. Seed iptu_taxas
    findOrCreate('iptu_taxas', 'descricao', 'IPTU 2025 - 1ª parcela', (r) => {
      r.set('imovel', imovel2.id)
      r.set('tipo', 'iptu')
      r.set('descricao', 'IPTU 2025 - 1ª parcela')
      r.set('valor', 280)
      r.set('vencimento', '2025-02-10')
      r.set('status', 'pendente')
      r.set('created_by', adminUserId)
      r.set('updated_by', adminUserId)
    })
  },
  (app) => {
    const collections = [
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
        const records = app.findRecordsByFilter(name, '1=1', '-created', 500, 0)
        for (const record of records) {
          app.delete(record)
        }
      } catch (_) {}
    }
  },
)
