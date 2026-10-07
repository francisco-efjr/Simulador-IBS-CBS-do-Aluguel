/**
 * Regras da minuta contratual que não dependem da tela: qual modelo sugerir e
 * como dizer o prazo. Ficam fora do componente para serem testadas (CAD-06 e
 * CAD-08).
 */

export type ModeloDaMinuta =
  | 'residencial_fiador'
  | 'residencial_caucao'
  | 'residencial_sem_garantia'
  | 'comercial_fiador'
  | 'comercial_caucao'
  | 'comercial_sem_garantia'

const TIPOS_COMERCIAIS = new Set(['comercial', 'sala_comercial', 'sala', 'loja', 'galpao'])

const semAcento = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/**
 * Modelo sugerido: segue a garantia do contrato e o uso do imóvel.
 *
 * Contrato com fiador abre no modelo com fiador (e a qualificação dele), contrato
 * com caução no modelo com caução, o resto sem garantia. Imóvel ou unidade de uso
 * comercial abre nos modelos comerciais. A pessoa ainda pode trocar no seletor.
 */
export function modeloDaMinuta(
  contrato: { tipo_garantia?: string | null } | null | undefined,
  imovel?: { tipo?: string | null } | null,
  unidade?: { tipo_unidade?: string | null } | null,
): ModeloDaMinuta {
  const uso =
    TIPOS_COMERCIAIS.has(semAcento(imovel?.tipo ?? '')) ||
    TIPOS_COMERCIAIS.has(semAcento(unidade?.tipo_unidade ?? ''))
      ? 'comercial'
      : 'residencial'

  const garantia = semAcento(contrato?.tipo_garantia ?? '')
  if (garantia.includes('fiador') && !garantia.includes('seguro')) return `${uso}_fiador`
  if (garantia.includes('caucao')) return `${uso}_caucao`
  return `${uso}_sem_garantia`
}

interface DataCivil {
  ano: number
  mes: number
  dia: number
}

/** Lê `AAAA-MM-DD` (ou o começo de um timestamp) sem passar por fuso horário. */
function lerData(texto: string | null | undefined): DataCivil | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto ?? '')
  if (!m) return null
  const data = { ano: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) }
  if (data.mes < 1 || data.mes > 12 || data.dia < 1 || data.dia > 31) return null
  return data
}

const diaNumero = (d: DataCivil) => Date.UTC(d.ano, d.mes - 1, d.dia) / 86_400_000

/** Prazo em meses completos e dias que sobram, contando o dia final como parte do contrato. */
export function prazoDoContrato(
  inicio: string | null | undefined,
  fim: string | null | undefined,
): { meses: number; dias: number } | null {
  const de = lerData(inicio)
  const ate = lerData(fim)
  if (!de || !ate) return null

  // O término vale até o fim do dia: 01/03 a 28/02 são 12 meses, não 11 e 27 dias.
  const fimExclusivo = new Date(Date.UTC(ate.ano, ate.mes - 1, ate.dia + 1))
  const f: DataCivil = {
    ano: fimExclusivo.getUTCFullYear(),
    mes: fimExclusivo.getUTCMonth() + 1,
    dia: fimExclusivo.getUTCDate(),
  }
  if (diaNumero(f) <= diaNumero(de)) return null

  let meses = (f.ano - de.ano) * 12 + (f.mes - de.mes) - (f.dia < de.dia ? 1 : 0)
  if (meses < 0) meses = 0

  const marco = new Date(Date.UTC(de.ano, de.mes - 1 + meses, de.dia))
  const dias = Math.max(0, Math.round(diaNumero(f) - marco.getTime() / 86_400_000))
  return { meses, dias }
}

/** "12 meses", "1 mês", "6 meses e 10 dias", "15 dias"; vazio quando faltam as datas. */
export function descreverPrazo(
  inicio: string | null | undefined,
  fim: string | null | undefined,
): string {
  const prazo = prazoDoContrato(inicio, fim)
  if (!prazo) return ''
  const meses = prazo.meses === 1 ? '1 mês' : `${prazo.meses} meses`
  const dias = prazo.dias === 1 ? '1 dia' : `${prazo.dias} dias`
  if (prazo.meses === 0) return dias
  return prazo.dias > 0 ? `${meses} e ${dias}` : meses
}
