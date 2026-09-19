import React, { useState, useEffect, useRef, useId } from 'react'
import { formatBRL, applyLiveBRLMask } from '../../core/utils/formatUtils.ts'

export interface BRLInputProps {
  value: number
  onChange: (value: number) => void
  /** Rótulo visível, associado ao campo por id — obrigatório para leitores de tela */
  label: string
  id?: string
  decimals?: number
  prefix?: string
  suffix?: string
  placeholder?: string
  className?: string
  error?: string
  min?: number
  max?: number
  disabled?: boolean
  autoSelectOnFocus?: boolean
}

/**
 * Campo monetário no padrão brasileiro (0.000,00) com máscara progressiva.
 * O rótulo é renderizado aqui e ligado ao input, de modo que tocar no texto
 * foque o campo e o leitor de tela anuncie o que está sendo preenchido.
 */
export const BRLInput: React.FC<BRLInputProps> = ({
  value,
  onChange,
  label,
  id,
  decimals = 2,
  prefix,
  suffix,
  placeholder = '0,00',
  className = '',
  error,
  min,
  max,
  disabled = false,
  autoSelectOnFocus = true,
}) => {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-erro`

  const [isFocused, setIsFocused] = useState(false)
  const [textValue, setTextValue] = useState<string>(() =>
    value === 0 ? '' : formatBRL(value, decimals),
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const isTypingRef = useRef(false)

  // Sincroniza valor externo quando não estiver com foco ativo
  useEffect(() => {
    if (!isFocused) {
      setTextValue(value === 0 ? '' : formatBRL(value, decimals))
    }
  }, [value, decimals, isFocused])

  // Mantém o cursor no final durante a digitação progressiva
  useEffect(() => {
    if (isTypingRef.current && isFocused && inputRef.current) {
      isTypingRef.current = false
      const len = textValue.length
      try {
        inputRef.current.setSelectionRange(len, len)
      } catch {
        // Alguns tipos de campo não aceitam seleção; o cursor fica onde estiver.
      }
    }
  }, [textValue, isFocused])

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    if (value === 0) {
      setTextValue('')
    } else {
      setTextValue(formatBRL(value, decimals))
      if (autoSelectOnFocus) {
        setTimeout(() => e.target.select(), 10)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTypingRef.current = true
    const raw = e.target.value

    if (raw === '') {
      setTextValue('')
      onChange(0)
      return
    }

    if (!/^[-0-9.,]*$/.test(raw)) {
      return
    }

    const { display, value: parsedVal } = applyLiveBRLMask(raw, decimals)

    // O clamp precisa alcançar o texto na tela, senão o campo exibe um número
    // e o cálculo recebe outro.
    let finalVal = parsedVal
    if (min !== undefined && finalVal < min) finalVal = min
    if (max !== undefined && finalVal > max) finalVal = max

    setTextValue(finalVal === parsedVal ? display : formatBRL(finalVal, decimals))
    onChange(finalVal)
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (textValue === '' || isNaN(value) || value === 0) {
      setTextValue('')
    } else {
      setTextValue(formatBRL(value, decimals))
    }
  }

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block text-base font-semibold text-text-primary mb-2">
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span
            aria-hidden="true"
            className="absolute left-3.5 text-text-secondary font-semibold text-base select-none pointer-events-none"
          >
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={isFocused ? textValue : value === 0 ? '' : formatBRL(value, decimals)}
          placeholder={placeholder}
          onFocus={handleFocus}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full min-h-[52px] bg-surface-muted border rounded-xl text-lg font-semibold tabular-nums text-text-primary placeholder-text-muted transition-colors focus:outline-none focus-visible:ring-4 ${
            prefix ? 'pl-11' : 'pl-3.5'
          } ${suffix ? 'pr-11' : 'pr-3.5'} ${
            error
              ? 'border-danger-border bg-danger-bg focus:border-red-600 focus-visible:ring-red-300 text-danger-text'
              : 'border-sim-border-strong hover:border-text-muted focus:border-accent-bg focus-visible:ring-accent-bg/40'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-surface-muted' : ''} ${className}`}
        />
        {suffix && (
          <span
            aria-hidden="true"
            className="absolute right-3.5 text-text-secondary font-semibold text-base select-none pointer-events-none"
          >
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger-text mt-1.5 font-semibold">
          {error}
        </p>
      )}
    </div>
  )
}
