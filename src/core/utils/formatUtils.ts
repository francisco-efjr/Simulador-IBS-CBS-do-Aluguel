/**
 * Utilitários de Formatação Numérica Brasileira (PT-BR)
 */

/**
 * Formata um número para o padrão brasileiro:
 * Ex: 3500 -> "3.500,00"
 * Ex: 240000 -> "240.000,00"
 */
export function formatBRL(value: number, decimals: number = 2): string {
  if (isNaN(value) || value === null || value === undefined) {
    return (0).toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Faz o parse de uma string no padrão brasileiro ou universal para número:
 * "3.500,00" -> 3500.00
 * "3500,50" -> 3500.50
 * "3500" -> 3500
 * "" -> 0
 */
export function parseBRL(raw: string): number {
  if (!raw || typeof raw !== 'string') return 0;
  
  // Remove tudo exceto dígitos, vírgula, ponto e sinal de menos
  const cleaned = raw.replace(/[^\d.,-]/g, '').trim();
  if (!cleaned) return 0;

  // Se tiver vírgula e pontos: ex "1.234,56"
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Se tiver apenas vírgula: ex "1234,56" ou "3500,"
  if (cleaned.includes(',')) {
    const normalized = cleaned.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Se tiver apenas ponto:
  // Se tiver mais de 2 casas após o ponto ou múltiplos pontos: ex "1.000" ou "1.000.000" -> separador de milhar!
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length > 2 || (parts[1] && parts[1].length === 3 && parts.length === 2)) {
      // É separador de milhar: "1.000" -> 1000
      const parsed = parseFloat(cleaned.replace(/\./g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    // Caso contrário é decimal em notação comum "3500.50"
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Apenas dígitos
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Aplica máscara brasileira progressiva em tempo real durante a digitação:
 * - A digitação é progressiva a partir dos centavos (estilo caixa eletrônico / apps bancários):
 *   Ex (decimals = 2):
 *   - digita "1" -> "0,01"
 *   - digita "0" -> "0,10"
 *   - digita "0" -> "1,00"
 *   - digita "0" -> "10,00"
 *   - digita "0" -> "100,00"
 *   - digita "0" -> "1.000,00"
 * - Ao apagar (backspace), os dígitos recuam da direita para a esquerda progressivamente.
 * - Suporta decimais = 0 (inteiros) e decimais customizados.
 * - Suporta valores negativos (sinal '-' preservado).
 */
export function applyLiveBRLMask(raw: string, decimals: number = 2): { display: string; value: number } {
  if (!raw || raw.trim() === '') {
    return { display: '', value: 0 };
  }

  const isNegative = raw.trim().startsWith('-');
  const sign = isNegative ? '-' : '';

  // Extrai apenas os dígitos numéricos
  const cleanDigits = raw.replace(/\D/g, '');

  if (!cleanDigits || cleanDigits === '') {
    return { display: sign, value: 0 };
  }

  const intVal = parseInt(cleanDigits, 10);
  if (isNaN(intVal) || intVal === 0) {
    return { display: '', value: 0 };
  }

  if (decimals === 0) {
    const display = `${sign}${intVal.toLocaleString('pt-BR')}`;
    return { display, value: (isNegative ? -1 : 1) * intVal };
  }

  const factor = Math.pow(10, decimals);
  const numValue = (isNegative ? -1 : 1) * (intVal / factor);

  const display = `${sign}${(intVal / factor).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

  return { display, value: numValue };
}

