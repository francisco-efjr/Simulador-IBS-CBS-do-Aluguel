import { describe, it, expect } from 'vitest'
import {
  formatarCpf,
  formatarCnpj,
  formatarCpfCnpj,
  formatarTelefone,
  aplicarMascaraDocumento,
} from '@/lib/format'
import { OPCOES_MINUTA_PADRAO } from '@/components/contratos/MinutaContratoDialog'
import { locadorSchema, fiadorSchema, unidadeSchema } from '@/lib/validacao/esquemas'

describe('Fase 3 - Utilitários de UI e Formatação', () => {
  it('aplica máscara e formatação de CPF corretamente', () => {
    expect(formatarCpf('12345678909')).toBe('123.456.789-09')
    expect(aplicarMascaraDocumento('12345678909', 'pf')).toBe('123.456.789-09')
  })

  it('aplica máscara e formatação de CNPJ numérico e alfanumérico', () => {
    expect(formatarCnpj('12345678000195')).toBe('12.345.678/0001-95')
    expect(aplicarMascaraDocumento('12345678000195', 'pj')).toBe('12.345.678/0001-95')
  })

  it('formata telefones com 10 e 11 dígitos', () => {
    expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321')
    expect(formatarTelefone('1133334444')).toBe('(11) 3333-4444')
  })

  it('disponibiliza exatamente as 6 minutas padrão de contrato', () => {
    expect(OPCOES_MINUTA_PADRAO).toHaveLength(6)
    const ids = OPCOES_MINUTA_PADRAO.map((o) => o.id)
    expect(ids).toContain('residencial_fiador')
    expect(ids).toContain('residencial_caucao')
    expect(ids).toContain('residencial_sem_garantia')
    expect(ids).toContain('comercial_fiador')
    expect(ids).toContain('comercial_caucao')
    expect(ids).toContain('comercial_sem_garantia')
  })

  it('valida dados de Locador com schema Zod', () => {
    const locadorValido = {
      tipo_pessoa: 'pf',
      nome_razao_social: 'José Aguiar',
      cpf_cnpj: '12345678909',
      email: 'jose@aguiar.com.br',
    }
    const resultado = locadorSchema.safeParse(locadorValido)
    expect(resultado.success).toBe(true)
  })

  it('valida outorga conjugal em Fiador casado', () => {
    const fiadorCasadoSemConjuge = {
      nome: 'Carlos Aguiar',
      cpf: '12345678909',
      estado_civil: 'casado',
    }
    const resInvalido = fiadorSchema.safeParse(fiadorCasadoSemConjuge)
    expect(resInvalido.success).toBe(false)

    const fiadorCasadoComConjuge = {
      nome: 'Carlos Aguiar',
      cpf: '12345678909',
      estado_civil: 'casado',
      conjuge_nome: 'Maria Aguiar',
      conjuge_cpf: '12345678909',
      email: 'carlos@aguiar.com.br',
    }
    const resValido = fiadorSchema.safeParse(fiadorCasadoComConjuge)
    expect(resValido.success).toBe(true)
  })

  it('valida esquema de unidade de imóvel com taxas', () => {
    const unidadeValida = {
      imovel_id: 'imovel-1',
      identificador: 'Apto 101',
      tem_condominio: true,
      valor_condominio: '350,00',
      taxa_poco: '30,00',
      status: 'vago',
    }
    const res = unidadeSchema.safeParse(unidadeValida)
    expect(res.success).toBe(true)
  })
})
