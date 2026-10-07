/* Tema do Gestão de Imóveis — visual "Orgânico / Natural" (handoff do design, 07/10/2026).
   Tokens semânticos em src/main.css; aqui ficam fontes, escala, raios, sombras e animações. */
import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'
import typographyPlugin from '@tailwindcss/typography'
import aspectRatioPlugin from '@tailwindcss/aspect-ratio'
import paletaOrganica from './tailwind.paleta-organica'

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
  // Hover só onde há ponteiro de verdade: no toque, efeito de hover gruda no botão.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '3rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      /**
       * Escala tipográfica elevada para o público do sistema (40 a 90 anos).
       *
       * Piso de 14px (`text-xs`) e corpo de 17px. Tudo em `rem`, então a escala
       * inteira responde ao ajuste de fonte do navegador e ao controle de
       * tamanho da letra (WCAG 1.4.4). Os degraus grandes seguem o handoff do
       * visual orgânico (H1 32/44px, número de destaque 44/60px).
       */
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.25rem' }], // 14
        sm: ['1rem', { lineHeight: '1.5rem' }], // 16
        base: ['1.0625rem', { lineHeight: '1.65rem' }], // 17
        lg: ['1.1875rem', { lineHeight: '1.75rem' }], // 19
        xl: ['1.375rem', { lineHeight: '1.875rem' }], // 22
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }], // 26
        '3xl': ['2rem', { lineHeight: '1.15' }], // 32
        '4xl': ['2.375rem', { lineHeight: '1.1' }], // 38
        '5xl': ['2.75rem', { lineHeight: '1.05' }], // 44
        '6xl': ['3.75rem', { lineHeight: '1.04' }], // 60
      },
      fontFamily: {
        sans: ['"Nunito Variable"', 'Nunito', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'serif'],
        display: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'serif'],
        // O simulador deixou a tipografia própria e usa a do sistema.
        sim: ['"Nunito Variable"', 'Nunito', 'system-ui', 'sans-serif'],
        'sim-mono': ['"Nunito Variable"', 'Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Paletas legadas (slate, blue, navy, gold...) no matiz orgânico, com a
        // luminância original. Ver scripts/gerar-paleta-organica.mjs.
        ...paletaOrganica,

        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // Argila: SÓ decoração (blobs, sombras). Texto argila usa `secondary-ink`.
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          ink: 'hsl(var(--secondary-ink))',
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
        sunken: 'hsl(var(--surface-sunken))',
        success: { ink: 'hsl(var(--success-ink))' },
        warning: { ink: 'hsl(var(--warning-ink))' },
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
        sm: '0.75rem',
        md: '1rem',
        lg: 'var(--radius)', // 24px
        xl: '1.5rem',
        '2xl': '2rem',
        '3xl': '2.5rem',
        // Cantos orgânicos dos cartões: 32px com um canto de 64px, ciclando por índice.
        'organic-tr': '2rem 4rem 2rem 2rem',
        'organic-tl': '4rem 2rem 2rem 2rem',
        'organic-br': '2rem 2rem 4rem 2rem',
        'organic-bl': '2rem 2rem 2rem 4rem',
        destaque: '2rem 5rem 2rem 2rem',
      },
      transitionProperty: {
        width: 'width',
        height: 'height',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        float: 'var(--shadow-float)',
        lift: 'var(--shadow-lift)',
        hero: 'var(--shadow-hero)',
        papel: '12px 12px 0 -2px hsl(var(--accent)), var(--shadow-hero)',
        'papel-esq': '-12px 12px 0 -2px hsl(var(--accent)), var(--shadow-hero)',
        // Nomes antigos, agora com sombra tingida (nunca preta).
        subtle: 'var(--shadow-soft)',
        elevation: 'var(--shadow-soft)',
        gold: 'var(--shadow-float)',
      },
      transitionTimingFunction: {
        organic: 'cubic-bezier(.34,.12,.2,1)',
        apple: 'cubic-bezier(.34,.12,.2,1)',
      },
      transitionDuration: { 400: '400ms', 700: '700ms' },
    },
  },
  plugins: [animatePlugin, typographyPlugin, aspectRatioPlugin],
} satisfies Config
