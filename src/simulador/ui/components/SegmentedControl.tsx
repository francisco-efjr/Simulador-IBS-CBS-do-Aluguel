import React, { useId } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SegmentedControlProps<T extends string> {
  legend: string;
  value: T;
  // NoInfer em tudo menos `value`: o literal de `options` alarga para string e
  // um setter de useState entra como SetStateAction<T>. Qualquer um dos dois
  // sequestraria a inferência. Quem define o tipo do grupo é `value`.
  onChange: (value: NoInfer<T>) => void;
  options: SegmentedOption<NoInfer<T>>[];
  columns?: 2 | 3;
}

/**
 * Escolha entre poucas opções mutuamente exclusivas.
 *
 * Implementado sobre <input type="radio"> dentro de um <fieldset>: o leitor de
 * tela anuncia o grupo e a posição, as setas do teclado navegam entre as opções
 * e o clique no rótulo inteiro seleciona — área de toque generosa em vez do
 * alvo minúsculo de um botão de texto.
 */
export function SegmentedControl<T extends string>({
  legend,
  value,
  onChange,
  options,
  columns = 2,
}: SegmentedControlProps<T>) {
  const groupName = useId();

  return (
    <fieldset className="w-full border-0 p-0 m-0">
      <legend className="block text-base font-semibold text-text-primary mb-2 p-0">{legend}</legend>
      <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const Icon = option.icon;
          return (
            <label
              key={option.value}
 className={`flex items-center justify-center gap-2 min-h-[52px] px-3 rounded-xl border-2 text-base font-semibold text-center cursor-pointer transition-colors select-none has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent-bg/40 ${
                isSelected
                  ? 'bg-accent-bg border-accent-bg text-accent-fg'
                  : 'bg-surface-muted border-sim-border-strong text-text-secondary hover:border-accent-bg hover:text-text-primary'
              }`}
            >
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
 className="sr-only"
              />
              {Icon && <Icon className="w-5 h-5 shrink-0" />}
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
