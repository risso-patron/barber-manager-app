// ORNO UI Framework · M1 · Brand
// Single source of truth for brand assets. Final art is swapped by replacing
// files in /public/brand/ with these canonical names — ZERO code changes.
// While an SVG is missing, components render the typographic fallback.

export const brand = {
  name: "Ornō",
  tagline: "Gestión que embellece tu negocio",

  /** Set true once final SVGs are placed in /public/brand/. */
  assetsReady: false,

  logo: {
    /** Full wordmark, color. */
    full: {
      light: "/brand/logo-full-light.svg", // for light backgrounds (default)
      dark: "/brand/logo-full-dark.svg", // for dark/photo backgrounds
    },
    /** Monochrome — single ink, for engraving/print/partner co-brand. */
    mono: {
      light: "/brand/logo-mono-light.svg", // ink #26231F
      dark: "/brand/logo-mono-dark.svg", // white
    },
  },

  appIcon: {
    /** Master square icon (SVG). */
    default: "/brand/app-icon.svg",
    mono: "/brand/app-icon-mono.svg",
    /** PWA maskable: art within inner 80% safe zone. */
    maskable512: "/brand/app-icon-maskable-512.png",
    png192: "/brand/app-icon-192.png",
    png512: "/brand/app-icon-512.png",
  },

  favicon: {
    ico: "/favicon/favicon.ico",
    png16: "/favicon/favicon-16x16.png",
    png32: "/favicon/favicon-32x32.png",
    appleTouch: "/favicon/apple-touch-icon.png", // 180×180
  },

  color: {
    red: "#E53935", // wordmark accent + brand moments ONLY
    ink: "#26231F",
    paper: "#FAF9F7",
  },
} as const

export type Brand = typeof brand
