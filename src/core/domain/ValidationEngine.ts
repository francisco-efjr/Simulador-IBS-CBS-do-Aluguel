import { LeaseContractInput, PortfolioItem } from './types.ts';
import { FinancialMath } from './FinancialMath.ts';

export interface ValidationErrorItem {
  field: string;
  code: string;
  message: string;
}

export interface ValidationOutput<T> {
  isValid: boolean;
  errors: ValidationErrorItem[];
  warnings: string[];
  sanitized: T;
}

export class DomainValidationError extends Error {
  public readonly errors: ValidationErrorItem[];

  constructor(message: string, errors: ValidationErrorItem[]) {
    super(message);
    this.name = 'DomainValidationError';
    this.errors = errors;
  }
}

/**
 * Motor de Validação e Sanitização de Entradas Fiscais
 * Garante a integridade de domínio antes da execução de cálculos
 */
export class ValidationEngine {
  /**
   * Valida e sanitiza os parâmetros de um contrato de locação
   */
  public static validateLeaseInput(input: LeaseContractInput): ValidationOutput<LeaseContractInput> {
    const errors: ValidationErrorItem[] = [];
    const warnings: string[] = [];

    // 1. Validação do Aluguel Base
    if (input.baseRent === undefined || input.baseRent === null || isNaN(input.baseRent)) {
      errors.push({
        field: 'baseRent',
        code: 'INVALID_RENT',
        message: 'O valor do aluguel base é obrigatório e deve ser numérico.',
      });
    } else if (input.baseRent < 0) {
      errors.push({
        field: 'baseRent',
        code: 'NEGATIVE_RENT',
        message: 'O valor do aluguel base não pode ser negativo.',
      });
    } else if (input.baseRent === 0) {
      warnings.push('O aluguel base está zerado (R$ 0,00). Não haverá fato gerador de IBS/CBS.');
    }

    // 2. Validação de Encargos Acessórios
    const condo = input.condominiumFee ?? 0;
    if (condo < 0) {
      errors.push({
        field: 'condominiumFee',
        code: 'NEGATIVE_CONDO',
        message: 'A taxa condominial não pode ser negativa.',
      });
    }

    const iptu = input.iptuAmount ?? 0;
    if (iptu < 0) {
      errors.push({
        field: 'iptuAmount',
        code: 'NEGATIVE_IPTU',
        message: 'O valor do IPTU não pode ser negativo.',
      });
    }

    // 3. Validação de Dados do Locador
    const landlord = input.landlord;
    const mgmtFee = landlord.managementFeePercent ?? 10;
    if (mgmtFee < 0 || mgmtFee > 100) {
      errors.push({
        field: 'managementFeePercent',
        code: 'INVALID_MANAGEMENT_FEE',
        message: 'A taxa de administração da imobiliária deve estar entre 0% e 100%.',
      });
    }

    if (landlord.personType === 'pf') {
      const propCount = landlord.totalPropertiesRented ?? 0;
      const annualInc = landlord.totalAnnualRentalIncome ?? 0;

      if (propCount < 0) {
        errors.push({
          field: 'totalPropertiesRented',
          code: 'NEGATIVE_PROPERTIES_COUNT',
          message: 'O número de imóveis alugados não pode ser negativo.',
        });
      }

      if (annualInc < 0) {
        errors.push({
          field: 'totalAnnualRentalIncome',
          code: 'NEGATIVE_ANNUAL_INCOME',
          message: 'A receita anual com aluguéis não pode ser negativa.',
        });
      }

      // Verificação de consistência: se a receita anual for menor que o aluguel anual deste único imóvel
      if (input.baseRent > 0 && annualInc > 0 && (input.baseRent * 12) > annualInc) {
        warnings.push(
          `Inconsistência cadastral: a receita anual declarada (R$ ${annualInc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) é inferior à projeção anual deste único imóvel (R$ ${(input.baseRent * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`
        );
      }
    }

    // Objeto sanitizado com precisão contábil
    const sanitized: LeaseContractInput = {
      ...input,
      baseRent: Math.max(0, FinancialMath.round(input.baseRent || 0)),
      condominiumFee: Math.max(0, FinancialMath.round(condo)),
      iptuAmount: Math.max(0, FinancialMath.round(iptu)),
      landlord: {
        ...landlord,
        totalPropertiesRented: Math.max(0, Math.floor(landlord.totalPropertiesRented || 0)),
        totalAnnualRentalIncome: Math.max(0, FinancialMath.round(landlord.totalAnnualRentalIncome || 0)),
        managementFeePercent: Math.min(100, Math.max(0, mgmtFee)),
      },
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized,
    };
  }

  /**
   * Valida itens de uma carteira de imóveis
   */
  public static validatePortfolio(items: PortfolioItem[]): { isValid: boolean; errors: ValidationErrorItem[]; warnings: string[] } {
    const errors: ValidationErrorItem[] = [];
    const warnings: string[] = [];

    if (!items || items.length === 0) {
      warnings.push('A carteira está vazia. Adicione ao menos um imóvel para simular a apuração agregada.');
      return { isValid: true, errors, warnings };
    }

    items.forEach((item, index) => {
      if (!item.name || item.name.trim().length === 0) {
        errors.push({
          field: `items[${index}].name`,
          code: 'EMPTY_NAME',
          message: `O imóvel #${index + 1} precisa ter um nome ou identificador.`,
        });
      }

      if (item.monthlyRent < 0) {
        errors.push({
          field: `items[${index}].monthlyRent`,
          code: 'NEGATIVE_RENT',
          message: `O aluguel do imóvel "${item.name || `#${index + 1}`}" não pode ser negativo.`,
        });
      }

      if ((item.condominiumFee ?? 0) < 0) {
        errors.push({
          field: `items[${index}].condominiumFee`,
          code: 'NEGATIVE_CONDO',
          message: `O condomínio do imóvel "${item.name || `#${index + 1}`}" não pode ser negativo.`,
        });
      }

      if ((item.iptuAmount ?? 0) < 0) {
        errors.push({
          field: `items[${index}].iptuAmount`,
          code: 'NEGATIVE_IPTU',
          message: `O IPTU do imóvel "${item.name || `#${index + 1}`}" não pode ser negativo.`,
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
