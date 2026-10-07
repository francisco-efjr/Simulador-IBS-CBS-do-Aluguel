/**
 * Mapa das relações e dos campos de arquivo.
 *
 * O `expand` do PocketBase pedia a relação pelo nome do campo; no PostgREST a
 * relação é embutida no `select`, com o nome da restrição para não haver
 * ambiguidade quando duas colunas apontam para a mesma tabela. Este mapa é a
 * tradução de um para o outro, e é o único lugar que precisa mudar quando uma
 * relação nova entra.
 */
export const RELACOES: Record<string, Record<string, string>> = {
  imoveis: { inquilino_atual: 'inquilinos', created_by: 'users', updated_by: 'users' },
  imovel_unidades: {
    imovel_id: 'imoveis',
    inquilino_atual: 'inquilinos',
    created_by: 'users',
    updated_by: 'users',
  },
  locadores: { created_by: 'users', updated_by: 'users' },
  fiadores: { created_by: 'users', updated_by: 'users' },
  contratos: {
    imovel: 'imoveis',
    inquilino: 'inquilinos',
    unidade_id: 'imovel_unidades',
    locador_id: 'locadores',
    fiador_id: 'fiadores',
  },
  receitas: {
    imovel: 'imoveis',
    contrato: 'contratos',
    inquilino: 'inquilinos',
    categoria: 'categorias_financeiras',
  },
  despesas: {
    imovel: 'imoveis',
    fornecedor: 'fornecedores',
    categoria: 'categorias_financeiras',
  },
  iptu_taxas: { imovel: 'imoveis' },
  importacoes: { conta_bancaria: 'contas_bancarias' },
  transacoes_importadas: { importacao: 'importacoes' },
  logs_atividade: { usuario: 'users' },
  convites: { criado_por: 'users' },
  permissoes: { usuario: 'users' },
}

/** Campo de arquivo → bucket onde ele mora. */
export const ARQUIVOS: Record<string, Record<string, { bucket: string; varios?: boolean }>> = {
  imoveis: { fotos: { bucket: 'imoveis-fotos', varios: true } },
  contratos: { documento: { bucket: 'contratos-documentos' } },
  iptu_taxas: { comprovante: { bucket: 'iptu-comprovantes' } },
  documentos_anexos: { arquivo: { bucket: 'documentos-anexos' } },
  users: { avatar: { bucket: 'avatars' } },
}

/**
 * Tipos de entidade que recebem anexo (o mesmo enum `entidade_anexo` do banco).
 *
 * O anexo sobe para `<tipo>/<uuid>-<nome>` no bucket `documentos-anexos`: a
 * política de storage deduz da primeira pasta a quem o arquivo pertence e
 * exige a permissão do módulo certo (migração 20261006120001). Caminho sem essa
 * pasta só o administrador alcança.
 */
export const ENTIDADES_DE_ANEXO = [
  'imovel',
  'inquilino',
  'contrato',
  'fornecedor',
  'despesa',
  'receita',
  'iptu_taxas',
] as const

/** Pasta do anexo para o tipo informado; recusa o que o banco também recusaria. */
export function pastaDoAnexo(tipo: unknown): string {
  if (typeof tipo === 'string' && (ENTIDADES_DE_ANEXO as readonly string[]).includes(tipo)) {
    return tipo
  }
  throw new Error('Tipo de anexo inválido.')
}

/**
 * Nome da chave estrangeira. O Postgres batiza toda FK declarada na coluna
 * como <tabela>_<coluna>_fkey, então o nome é dedutível e não precisa de
 * consulta ao catálogo.
 */
export const chaveEstrangeira = (tabela: string, coluna: string) => `${tabela}_${coluna}_fkey`

/** Colunas numéricas que o Postgres devolve como texto e a tela espera número. */
export const ehCampoDeArquivo = (tabela: string, campo: string) =>
  Boolean(ARQUIVOS[tabela]?.[campo])
