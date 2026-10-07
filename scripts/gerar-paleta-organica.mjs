#!/usr/bin/env node
/**
 * Gera `tailwind.paleta-organica.ts`: as paletas do Tailwind (slate, blue, red...)
 * e as antigas `navy`/`gold` refeitas nas cores do visual "Orgânico / Natural".
 *
 * Por quê: as telas têm cerca de 3.000 classes como `bg-slate-50`, `text-navy-800`
 * ou `border-blue-200`. Trocar cada uma levaria semanas e arriscaria contraste.
 * Aqui cada degrau ganha o matiz da nova paleta (musgo, argila, siena, pedra,
 * lagoa) mantendo **a mesma luminância relativa** do original. Como o contraste
 * WCAG depende só da luminância, todo par texto/fundo que passava continua
 * passando, com a mesma razão.
 *
 * Uso: node scripts/gerar-paleta-organica.mjs
 * A migração tela a tela para os tokens semânticos (bg-card, text-primary...)
 * continua sendo o destino; esta paleta é a ponte.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const cores = require('tailwindcss/colors')

// Paletas próprias que existiam no tailwind.config.ts antes do redesign.
const NAVY = {
  50: '#F0F4F8', 100: '#D9E2EC', 200: '#BCCCDC', 300: '#9FB3C8', 400: '#829AB1', 500: '#334E68',
  600: '#243B53', 700: '#102A43', 800: '#0A182E', 900: '#060F20', 950: '#030814',
}
const GOLD = {
  50: '#FBF8EE', 100: '#F6EFD5', 200: '#EDDDA9', 300: '#E4CA7E', 400: '#DBB854', 500: '#C89F53',
  600: '#B5883A', 700: '#946B2A', 800: '#735022', 900: '#5A3D1C', 950: '#38250E',
}

// ---- conversões sRGB <-> OKLab ------------------------------------------------
const paraLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const deLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function hexParaRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255)
}
const rgbParaHex = (rgb) =>
  '#' + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()

function luminancia(rgb) {
  const [r, g, b] = rgb.map(paraLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function rgbParaOklch(rgb) {
  const [r, g, b] = rgb.map(paraLinear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [L, Math.hypot(a, bb), ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360]
}

function oklchParaRgbLinear([L, C, H]) {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}
const dentroDoGamut = (lin) => lin.every((v) => v >= -1e-4 && v <= 1 + 1e-4)

/** Cor de matiz H e croma C (reduzido se sair do sRGB) com luminância Y exata. */
function corComLuminancia(Y, H, C) {
  for (let croma = C; croma >= 0; croma -= 0.002) {
    let lo = 0
    let hi = 1
    let achou = null
    for (let i = 0; i < 40; i++) {
      const L = (lo + hi) / 2
      const lin = oklchParaRgbLinear([L, croma, H])
      const y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
      if (y < Y) lo = L
      else hi = L
      achou = lin
    }
    if (achou && dentroDoGamut(achou)) return rgbParaHex(achou.map((v) => deLinear(Math.min(1, Math.max(0, v)))))
  }
  throw new Error('sem cor possível')
}

// ---- destinos ----------------------------------------------------------------
const matiz = (hex) => rgbParaOklch(hexParaRgb(hex))[2]
const FAMILIAS = {
  pedra: { H: matiz('#6B6B5F'), max: 0.018, fator: 0.35 }, // neutros quentes
  floresta: { H: matiz('#5D7052'), max: 0.045, fator: 0.6 }, // o antigo navy
  musgo: { H: matiz('#5D7052'), max: 0.075, fator: 0.45 },
  argila: { H: matiz('#C18C5D'), max: 0.1, fator: 0.6 },
  siena: { H: matiz('#A85448'), max: 0.12, fator: 0.55 },
  lagoa: { H: 215, max: 0.055, fator: 0.35 }, // informação, sem azul elétrico
}

const DE_PARA = {
  slate: 'pedra', gray: 'pedra', zinc: 'pedra', neutral: 'pedra', stone: 'pedra',
  navy: 'floresta',
  emerald: 'musgo', green: 'musgo', lime: 'musgo', teal: 'musgo',
  gold: 'argila', amber: 'argila', yellow: 'argila', orange: 'argila',
  red: 'siena', rose: 'siena', pink: 'siena',
  blue: 'lagoa', sky: 'lagoa', indigo: 'lagoa', cyan: 'lagoa', violet: 'lagoa', purple: 'lagoa', fuchsia: 'lagoa',
}

const saida = {}
for (const [nome, familia] of Object.entries(DE_PARA)) {
  const original = nome === 'navy' ? NAVY : nome === 'gold' ? GOLD : cores[nome]
  const { H, max, fator } = FAMILIAS[familia]
  saida[nome] = {}
  for (const [degrau, hex] of Object.entries(original)) {
    const rgb = hexParaRgb(hex)
    const C = Math.min(max, rgbParaOklch(rgb)[1] * fator + 0.008)
    saida[nome][degrau] = corComLuminancia(luminancia(rgb), H, C)
  }
  saida[nome].DEFAULT = saida[nome][nome === 'navy' ? 800 : 500]
}

const corpo = `// GERADO por scripts/gerar-paleta-organica.mjs — não edite à mão.
// Paletas do Tailwind no matiz do visual "Orgânico / Natural", com a mesma
// luminância de cada degrau original (contraste WCAG preservado).
const paletaOrganica = ${JSON.stringify(saida, null, 2)} as const

export default paletaOrganica
`
fs.writeFileSync(path.join(RAIZ, 'tailwind.paleta-organica.ts'), corpo)
console.log('tailwind.paleta-organica.ts gerado:', Object.keys(saida).length, 'paletas')
