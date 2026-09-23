/**
 * Critérios de aceitação em Gherkin, com as palavras-chave em destaque.
 *
 * O texto continua sendo o que está no banco, linha por linha e com o recuo
 * original: aqui só se pinta o que já está escrito, para quem lê achar o
 * cenário, o "Dado", o "Quando" e o "Então" de relance.
 */

const TITULOS = /^(\s*)(Funcionalidade:|Contexto:|Esquema do Cenário:|Cenário:|Exemplos:)(.*)$/
const PASSOS = /^(\s*)(Dado que|Dado|Quando|Então|E|Mas)(\s.*)$/

export type TipoDeLinha = 'titulo' | 'passo' | 'etiqueta' | 'comentario' | 'tabela' | 'texto'

export function tipoDaLinha(linha: string): TipoDeLinha {
  const limpa = linha.trim()
  if (limpa.startsWith('@')) return 'etiqueta'
  if (limpa.startsWith('#')) return 'comentario'
  if (limpa.startsWith('|')) return 'tabela'
  if (TITULOS.test(linha)) return 'titulo'
  if (PASSOS.test(linha)) return 'passo'
  return 'texto'
}

function Linha({ linha }: { linha: string }) {
  switch (tipoDaLinha(linha)) {
    case 'titulo': {
      const [, recuo, palavra, resto] = TITULOS.exec(linha)!
      return (
        <>
          {recuo}
          <strong className="font-bold text-indigo-900">{palavra}</strong>
          <strong className="font-bold text-slate-900">{resto}</strong>
        </>
      )
    }
    case 'passo': {
      const [, recuo, palavra, resto] = PASSOS.exec(linha)!
      return (
        <>
          {recuo}
          <strong className="font-bold text-indigo-800">{palavra}</strong>
          {resto}
        </>
      )
    }
    case 'etiqueta':
      return <span className="font-semibold text-emerald-800">{linha}</span>
    case 'comentario':
      return <span className="italic text-slate-600">{linha}</span>
    default:
      return <>{linha}</>
  }
}

export function CriteriosEmBdd({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <pre className="p-4 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-800">
        {texto.split('\n').map((linha, indice) => (
          <span key={indice} className="block">
            <Linha linha={linha} />
            {linha === '' ? ' ' : null}
          </span>
        ))}
      </pre>
    </div>
  )
}
