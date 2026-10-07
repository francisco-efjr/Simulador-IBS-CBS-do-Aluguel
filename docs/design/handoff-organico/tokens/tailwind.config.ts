import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// Holding Aguiar — tema "Orgânico / Natural". Mescle com o tailwind.config.ts atual.
// A escala de fonte NÃO desce: text-xs = 14px é o piso.
const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Nunito", "system-ui", "sans-serif"],
      },
      // rem relativo a 17px (html = 106.25%) — multiplicado por --font-scale
      fontSize: {
        xs: ["0.8235rem", { lineHeight: "1.4" }],   // 14px piso
        sm: ["0.9412rem", { lineHeight: "1.5" }],   // 16px
        base: ["1rem", { lineHeight: "1.55" }],     // 17px
        lg: ["1.1176rem", { lineHeight: "1.5" }],   // 19px
        xl: ["1.2941rem", { lineHeight: "1.35" }],  // 22px
        "2xl": ["1.5294rem", { lineHeight: "1.25" }], // 26px
        "3xl": ["1.8824rem", { lineHeight: "1.15" }], // 32px
        "4xl": ["2.1176rem", { lineHeight: "1.1" }],  // 36px
        "5xl": ["2.5882rem", { lineHeight: "1.05" }], // 44px
        "6xl": ["3.5294rem", { lineHeight: "1.04" }], // 60px
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))", ink: "hsl(var(--secondary-ink))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        sunken: "hsl(var(--surface-sunken))",
        success: { ink: "hsl(var(--success-ink))" },
        warning: { ink: "hsl(var(--warning-ink))" },
      },
      borderRadius: {
        sm: "0.75rem",
        md: "1rem",
        lg: "var(--radius)",       // 24px
        xl: "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
        // cantos orgânicos para cartões (ciclar por índice)
        "organic-tr": "2rem 4rem 2rem 2rem",
        "organic-tl": "4rem 2rem 2rem 2rem",
        "organic-br": "2rem 2rem 4rem 2rem",
        "organic-bl": "2rem 2rem 2rem 4rem",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        float: "var(--shadow-float)",
        lift: "var(--shadow-lift)",
        hero: "var(--shadow-hero)",
      },
      transitionTimingFunction: { organic: "cubic-bezier(.34,.12,.2,1)" },
      transitionDuration: { 400: "400ms", 700: "700ms" },
      keyframes: {
        "drawer-in": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "drawer-in": "drawer-in 400ms cubic-bezier(.34,.12,.2,1)",
        "accordion-down": "accordion-down 400ms ease-out",
        "accordion-up": "accordion-up 300ms ease-out",
      },
    },
  },
  plugins: [animate],
};
export default config;
