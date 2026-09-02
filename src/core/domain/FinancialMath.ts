/**
 * Utilitário de Matemática Financeira e Precisão Contábil
 * Previne erros de ponto flutuante binário (IEEE 754) em apurações tributárias
 */
export class FinancialMath {
  /**
   * Arredonda valor para 2 casas decimais com precisão bancária
   */
  public static round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calcula percentual com arredondamento seguro
   */
  public static percentage(base: number, percent: number): number {
    return this.round((base * percent) / 100);
  }

  /**
   * Soma de forma segura para evitar centavos fantasmas
   */
  public static sum(...values: number[]): number {
    const total = values.reduce((acc, v) => acc + Math.round(v * 100), 0);
    return total / 100;
  }

  /**
   * Subtração segura
   */
  public static subtract(a: number, b: number): number {
    return (Math.round(a * 100) - Math.round(b * 100)) / 100;
  }

  /**
   * Divide o tributo entre CBS e IBS garantindo que cbs + ibs === totalExato
   * sem descompasso de R$ 0,01 decorrente de arredondamentos isolados
   */
  public static splitTax(base: number, cbsRate: number, ibsRate: number): { cbs: number; ibs: number; total: number } {
    const cbs = this.percentage(base, cbsRate);
    const totalRate = this.round(cbsRate + ibsRate);
    const total = this.percentage(base, totalRate);
    // O IBS assume o restante exato para garantir que CBS + IBS === Total
    const ibs = this.subtract(total, cbs);

    return { cbs, ibs, total };
  }
}
