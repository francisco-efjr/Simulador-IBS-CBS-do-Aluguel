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
 * Aplica máscara brasileira em tempo real durante a digitação:
 * - Aplica separador de milhar '.' na parte inteira ao vivo: "3500" -> "3.500"
 * - Permite digitar vírgula e decimais: "3500,5" -> "3.500,5"
 * - Elimina zero à esquerda: "05" -> "5"
 * - Converte '.' do numpad para vírgula se for decimal
 */
export function applyLiveBRLMask(raw: string, decimals: number = 2): { display: string; value: number } {
  if (!raw || raw.trim() === '') {
    return { display: '', value: 0 };
  }

  const isNegative = raw.trim().startsWith('-');
  const sign = isNegative ? '-' : '';

  // Remove espaços e sinal negativo para processar
  let sanitized = raw.replace(/^-/, '').trim();

  // Substitui ponto digitado no final por vírgula para suporte a numpad
  if (sanitized.endsWith('.')) {
    sanitized = sanitized.slice(0, -1) + ',';
  }

  // Se tiver vírgula (usuário está digitando parte decimal)
  if (sanitized.includes(',')) {
    const [intPartRaw, ...decParts] = sanitized.split(',');
    const decPartRaw = decParts.join('');

    // Processa a parte inteira (apenas dígitos)
    let intClean = intPartRaw.replace(/\D/g, '');
    if (intClean.length > 1 && intClean.startsWith('0')) {
      intClean = intClean.replace(/^0+/, '') || '0';
    }

    const intNum = intClean === '' ? 0 : parseInt(intClean, 10);
    const intFormatted = intClean === '' ? '0' : intNum.toLocaleString('pt-BR');

    // Limita casas decimais
    const decClean = decPartRaw.replace(/\D/g, '').slice(0, decimals);

    const display = `${sign}${intFormatted},${decClean}`;
    const numVal = (isNegative ? -1 : 1) * parseFloat(`${intNum}.${decClean || '0'}`);

    return { display, value: isNaN(numVal) ? 0 : numVal };
  }

  // Se tiver ponto decimal único (ex: colou "3500.50")
  if (sanitized.includes('.') && decimals > 0) {
    const parts = sanitized.split('.');
    if (parts.length === 2 && parts[1].length <= decimals) {
      return applyLiveBRLMask(`${parts[0]},${parts[1]}`, decimals);
    }
  }

  // Apenas parte inteira (sem vírgula)
  let digits = sanitized.replace(/\D/g, '');
  if (!digits) {
    return { display: sign, value: 0 };
  }

  if (digits.length > 1 && digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '') || '0';
  }

  const intNum = parseInt(digits, 10);
  const display = `${sign}${intNum.toLocaleString('pt-BR')}`;
  const numVal = (isNegative ? -1 : 1) * intNum;

  return { display, value: numVal };
}

