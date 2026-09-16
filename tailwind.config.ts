/* Tailwind config for the frontend react app. This is where the app theme should be defined: https://v2.tailwindcss.com/docs/configuration. */
import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'
import typographyPlugin from '@tailwindcss/typography'
import aspectRatioPlugin from '@tailwindcss/aspect-ratio'

// Tokens do Simulador IBS/CBS. Vivem como triplas RGB em src/simulador/simulador.css;
// o placeholder <alpha-value> deixa o Tailwind aplicar opacidade (bg-surface/80)
// sobre a mesma variável.
const simToken = (name: string) => `rgb(var(${name}) / <alpha-value>)`

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter var', 'SF Pro Display', 'system-ui', 'sans-serif'],
        display: ['SF Pro Display', 'Inter var', 'system-ui', 'sans-serif'],
        // Tipografia própria do Simulador IBS/CBS
        sim: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'sim-mono': [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        navy: {
          DEFAULT: '#0A182E',
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#334E68',
          600: '#243B53',
          700: '#102A43',
          800: '#0A182E',
          900: '#060F20',
          950: '#030814',
        },
        gold: {
          DEFAULT: '#C89F53',
          50: '#FBF8EE',
          100: '#F6EFD5',
          200: '#EDDDA9',
          300: '#E4CA7E',
          400: '#DBB854',
          500: '#C89F53',
          600: '#B5883A',
          700: '#946B2A',
          800: '#735022',
          900: '#5A3D1C',
          950: '#38250E',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },

        /* --- Simulador IBS/CBS (escopo .simulador-theme) --- */
        canvas: simToken('--sim-canvas'),
        surface: simToken('--sim-surface'),
        'surface-muted': simToken('--sim-surface-muted'),

        // 'border' já é a chave do shadcn; o simulador usa o prefixo sim-.
        'sim-border': simToken('--sim-border'),
        'sim-border-strong': simToken('--sim-border-strong'),

        'text-primary': simToken('--sim-text-primary'),
        'text-secondary': simToken('--sim-text-secondary'),
        'text-muted': simToken('--sim-text-muted'),

        'accent-bg': simToken('--sim-accent-bg'),
        'accent-fg': simToken('--sim-accent-fg'),

        'positive-bg': simToken('--sim-positive-bg'),
        'positive-border': simToken('--sim-positive-border'),
        'positive-text': simToken('--sim-positive-text'),

        'warning-bg': simToken('--sim-warning-bg'),
        'warning-border': simToken('--sim-warning-border'),
        'warning-text': simToken('--sim-warning-text'),

        'info-bg': simToken('--sim-info-bg'),
        'info-border': simToken('--sim-info-border'),
        'info-text': simToken('--sim-info-text'),

        'danger-bg': simToken('--sim-danger-bg'),
        'danger-border': simToken('--sim-danger-border'),
        'danger-text': simToken('--sim-danger-text'),
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionProperty: {
        width: 'width',
        height: 'height',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        elevation: '0 4px 20px rgba(0, 0, 0, 0.05)',
        gold: '0 4px 20px rgba(200, 159, 83, 0.25)',
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.42, 0, 0.58, 1)',
      },
    },
  },
  plugins: [animatePlugin, typographyPlugin, aspectRatioPlugin],
} satisfies Config
