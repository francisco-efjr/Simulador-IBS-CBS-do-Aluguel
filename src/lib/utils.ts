/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// O tema tem raios e sombras com nomes próprios (rounded-organic-tr, shadow-soft...).
// Sem declarar, o twMerge não sabe que `rounded-lg` passado por quem usa o
// componente deve substituir o raio padrão dele.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      borderRadius: ['organic-tr', 'organic-tl', 'organic-br', 'organic-bl', 'destaque'],
    },
    classGroups: {
      shadow: [
        {
          shadow: [
            'soft',
            'float',
            'lift',
            'hero',
            'papel',
            'papel-esq',
            'subtle',
            'elevation',
            'gold',
          ],
        },
      ],
    },
  },
})

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add any other utility functions here
