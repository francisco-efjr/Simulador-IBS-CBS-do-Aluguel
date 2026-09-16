/**
 * Utilitário de Matemática Financeira e Precisão Contábil
 * Previne erros de ponto flutuante binário (IEEE 754) em apurações tributárias
 */
export class FinancialMath {
  /**
   * Arredonda para 2 casas decimais no critério "meio para longe do zero",
   * o mesmo adotado pela legislação tributária brasileira.
   * Math.round() sozinho erraria os negativos (-0,005 viraria -0,00 e não -0,01).
   */
  public static round(value: number): number {
    if (!Number.isFinite(value)) return 0;
    const scaled = value * 100;
    // A correção de epsilon é proporcional à magnitude, e não absoluta, para
    // sobreviver a valores altos onde Number.EPSILON é irrelevante.
    const corrected = scaled + Math.sign(scaled) * Math.abs(scaled) * Number.EPSILON;
    return Math.sign(corrected) * Math.round(Math.abs(corrected)) / 100;
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
    const total = values.reduce((acc, v) => acc + Math.round(this.round(v) * 100), 0);
    return total / 100;
  }

  /**
   * Subtração segura
   */
  public static subtract(a: number, b: number): number {
    return (Math.round(this.round(a) * 100) - Math.round(this.round(b) * 100)) / 100;
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
