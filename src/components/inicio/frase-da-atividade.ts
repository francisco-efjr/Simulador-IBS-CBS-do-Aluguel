import type { LogAtividadeRecord } from '@/services/logs-atividade'

/**
 * Monta, em linguagem natural, a frase de uma linha do log de auditoria.
 *
 * O gatilho `tg_registrar_log` grava:
 * - `acao`: um valor do enum `acao_auditoria` ('criou' | 'editou' | 'excluiu');
 * - `entidade`: o nome da tabela auditada ('imoveis', 'iptu_taxas'…);
 * - `detalhes`: `<acao> <entidade> "<rótulo>"`, em que o rótulo é o nome,
 *   a descrição, o endereço, o número, o arquivo ou o e-mail do registro.
 *
 * Daqui sai "Maria cadastrou o imóvel Apto 101". Função pura, sem rede, para
 * poder ser testada sozinha.
 */

type Acao = 'criou' | 'editou' | 'excluiu'

interface DescricaoDaEntidade {
  /** "o imóvel", "a receita" — com o artigo, para "alterou a receita X". */
  comArtigo: string
  /** Verbo por ação quando o genérico soa estranho ("enviou o convite"). */
  verbos?: Partial<Record<Acao, string>>
}

const VERBOS_PADRAO: Record<Acao, string> = {
  criou: 'cadastrou',
  editou: 'alterou',
  excluiu: 'excluiu',
}

// Chaves pelas tabelas auditadas (o que o gatilho grava de fato). Os nomes no
// singular ficam como sinônimos, para linhas antigas ou filtros que os usam.
const ENTIDADES: Record<string, DescricaoDaEntidade> = {
  imoveis: { comArtigo: 'o imóvel' },
  inquilinos: { comArtigo: 'o inquilino' },
  fornecedores: { comArtigo: 'o fornecedor' },
  contratos: { comArtigo: 'o contrato' },
  receitas: { comArtigo: 'a receita' },
  despesas: { comArtigo: 'a despesa' },
  iptu_taxas: { comArtigo: 'o IPTU ou taxa' },
  contas_bancarias: { comArtigo: 'a conta bancária' },
  importacoes: {
    comArtigo: 'o extrato',
    verbos: { criou: 'importou' },
  },
  convites: {
    comArtigo: 'o convite para',
    verbos: { criou: 'enviou', excluiu: 'cancelou' },
  },
  documentos_anexos: {
    comArtigo: 'o documento',
    verbos: { criou: 'anexou' },
  },
  users: { comArtigo: 'o usuário' },
  historias: { comArtigo: 'a história' },
  permissoes: {
    comArtigo: 'a permissão de',
    verbos: { criou: 'concedeu', editou: 'alterou', excluiu: 'retirou' },
  },
}

const SINONIMOS: Record<string, string> = {
  imovel: 'imoveis',
  inquilino: 'inquilinos',
  fornecedor: 'fornecedores',
  contrato: 'contratos',
  receita: 'receitas',
  despesa: 'despesas',
  iptu_taxa: 'iptu_taxas',
  conta_bancaria: 'contas_bancarias',
  importacao: 'importacoes',
  convite: 'convites',
  documento_anexo: 'documentos_anexos',
  usuario: 'users',
  permissao: 'permissoes',
  historia: 'historias',
}

/** Quem fez, quando a linha não traz usuário (rotina automática do banco). */
export const AUTOR_DO_SISTEMA = 'O sistema'

/** Extrai o rótulo entre aspas do fim de `detalhes`. */
export function rotuloDosDetalhes(detalhes?: string | null): string | null {
  if (!detalhes) return null
  const achado = /"([\s\S]*)"\s*$/.exec(detalhes)
  const rotulo = achado?.[1]?.trim()
  return rotulo ? rotulo : null
}

function ehAcaoConhecida(acao: string): acao is Acao {
  return acao === 'criou' || acao === 'editou' || acao === 'excluiu'
}

export interface FraseDaAtividade {
  /** Quem fez: o nome da pessoa ou "O sistema". */
  autor: string
  /** O que fez, começando pelo verbo: "cadastrou o imóvel Apto 101". */
  oQue: string
  /** A frase inteira, para leitor de tela e testes. */
  texto: string
}

export function fraseDaAtividade(
  log: Pick<LogAtividadeRecord, 'acao' | 'entidade' | 'detalhes' | 'expand'>,
): FraseDaAtividade {
  const autor = log.expand?.usuario?.name?.trim() || AUTOR_DO_SISTEMA
  const chave = SINONIMOS[log.entidade] ?? log.entidade
  const entidade = ENTIDADES[chave]
  const rotulo = rotuloDosDetalhes(log.detalhes)

  let oQue: string
  if (entidade && ehAcaoConhecida(log.acao)) {
    const verbo = entidade.verbos?.[log.acao] ?? VERBOS_PADRAO[log.acao]
    oQue = rotulo ? `${verbo} ${entidade.comArtigo} ${rotulo}` : `${verbo} ${entidade.comArtigo}`
  } else if (ehAcaoConhecida(log.acao)) {
    // Tabela que ainda não tem nome amigável: diz o que dá, sem inventar.
    const nome = log.entidade.replace(/_/g, ' ')
    const verbo = VERBOS_PADRAO[log.acao]
    oQue = rotulo ? `${verbo} um registro de ${nome}: ${rotulo}` : `${verbo} um registro de ${nome}`
  } else {
    oQue = log.detalhes?.trim() || `registrou uma atividade (${log.acao})`
  }

  return { autor, oQue, texto: `${autor} ${oQue}` }
}
