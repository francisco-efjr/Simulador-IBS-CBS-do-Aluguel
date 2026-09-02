import React, { useState, useEffect, useRef } from 'react';
import { formatBRL, applyLiveBRLMask } from '../../core/utils/formatUtils.ts';

export interface BRLInputProps {
  value: number;
  onChange: (value: number) => void;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  autoSelectOnFocus?: boolean;
}

/**
 * Componente de Input Numérico / Monetário no Padrão Brasileiro (0.000,00)
 * Aplica máscara em tempo real durante a digitação ("preenchimento"),
 * resolve o bug de "0 na frente" ao permitir apagar completamente o campo
 * e formata visualmente no padrão BRL (separador de milhar '.' e decimal ',').
 */
export const BRLInput: React.FC<BRLInputProps> = ({
  value,
  onChange,
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
  const [isFocused, setIsFocused] = useState(false);
  const [textValue, setTextValue] = useState<string>(() =>
    value === 0 ? '' : formatBRL(value, decimals)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza valor externo quando não estiver com foco ativo
  useEffect(() => {
    if (!isFocused) {
      setTextValue(value === 0 ? '' : formatBRL(value, decimals));
    }
  }, [value, decimals, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Se for 0 ou vazio, deixa limpo para digitação sem "0" na frente
    if (value === 0) {
      setTextValue('');
    } else {
      setTextValue(formatBRL(value, decimals));
      if (autoSelectOnFocus) {
        setTimeout(() => e.target.select(), 10);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    
    // Permite apagar tudo livremente (sem forçar zero)
    if (raw === '') {
      setTextValue('');
      onChange(0);
      return;
    }

    // Aceita apenas dígitos, vírgula, ponto e sinal de menos
    if (!/^[-0-9.,]*$/.test(raw)) {
      return;
    }

    // Aplica a máscara brasileira ao vivo durante o preenchimento!
    const { display, value: parsedVal } = applyLiveBRLMask(raw, decimals);
    setTextValue(display);

    let finalVal = parsedVal;
    if (min !== undefined && finalVal < min) finalVal = min;
    if (max !== undefined && finalVal > max) finalVal = max;

    onChange(finalVal);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (textValue === '' || isNaN(value) || value === 0) {
      setTextValue('');
    } else {
      setTextValue(formatBRL(value, decimals));
    }
  };

  return (
    <div className="w-full">
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-slate-400 font-semibold text-xs sm:text-sm select-none pointer-events-none font-mono">
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          value={isFocused ? textValue : value === 0 ? '' : formatBRL(value, decimals)}
          placeholder={placeholder}
          onFocus={handleFocus}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full bg-slate-950 border rounded-xl py-2 text-sm sm:text-base font-mono font-bold text-slate-100 placeholder-slate-600 transition-all focus:outline-none ${
            prefix ? 'pl-9 sm:pl-10' : 'pl-3'
          } ${suffix ? 'pr-8' : 'pr-3'} ${
            error
              ? 'border-red-500 bg-red-950/20 focus:border-red-400 text-red-200'
              : 'border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        />
        {suffix && (
          <span className="absolute right-3 text-slate-400 font-semibold text-xs sm:text-sm select-none pointer-events-none font-mono">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
};
