/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bronn: {
          canvas: '#FAF8F5',
          surface: '#FFFFFF',
          card: '#F5F2EB',
          border: '#E5E0D8',
          charcoal: '#161616',
          muted: '#6B6864',
          sage: '#1E6B2C',
          sageBg: '#EAF4EC',
          nordicBlue: '#1D528F',
          nordicBlueBg: '#EEF3FA',
          warmAmber: '#92400E',
          warmAmberBg: '#FEF7ED',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
