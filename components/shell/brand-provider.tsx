"use client"

// ORNO UI Framework · M2 · Brand
// BrandProvider — multi-brand / white-label root.
//
// A BrandConfig carries identity (name, logo assets) AND semantic color
// tokens. The provider writes tokens to CSS variables on <html>, so every
// component that consumes semantic classes (bg-primary, bg-sidebar, ring…)
// re-brands with ZERO component changes. No shell component references an
// ORNO hex — ORNO itself is just the default BrandConfig.
//
// White-label protocol: fetch the tenant's BrandConfig, pass it to
// <BrandProvider brand={tenantBrand}>. Done.

import * as React from "react"
import { brand as ornoAssets } from "@/lib/brand"

export interface BrandTokens {
  /** HSL triplets, shadcn convention: "143 25% 50%" */
  background: string
  foreground: string
  card: string
  primary: string
  primaryForeground: string
  secondary: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  border: string
  ring: string
  sidebarBackground: string
  sidebarAccent: string
  sidebarAccentForeground: string
}

export interface BrandConfig {
  name: string
  tagline?: string
  /** Signature/brand color — logo accents, brand moments only. */
  signature: string
  assetsReady: boolean
  logo: typeof ornoAssets.logo
  appIcon: typeof ornoAssets.appIcon
  tokens: BrandTokens
}

/** ORNO — the default brand. The ONLY place these values exist in the shell. */
export const ORNO_BRAND: BrandConfig = {
  name: ornoAssets.name,
  tagline: ornoAssets.tagline,
  signature: ornoAssets.color.red,
  assetsReady: ornoAssets.assetsReady,
  logo: ornoAssets.logo,
  appIcon: ornoAssets.appIcon,
  tokens: {
    background: "40 23% 97%",
    foreground: "34 10% 14%",
    card: "0 0% 100%",
    primary: "143 25% 50%",
    primaryForeground: "0 0% 100%",
    secondary: "40 21% 95%",
    muted: "40 21% 95%",
    mutedForeground: "38 7% 51%",
    accent: "143 24% 93%",
    accentForeground: "144 30% 35%",
    border: "36 18% 89%",
    ring: "143 25% 50%",
    sidebarBackground: "40 21% 95%",
    sidebarAccent: "143 24% 93%",
    sidebarAccentForeground: "144 30% 35%",
  },
}

const BrandContext = React.createContext<BrandConfig>(ORNO_BRAND)

export function useBrand(): BrandConfig {
  return React.useContext(BrandContext)
}

const TOKEN_TO_VAR: Record<keyof BrandTokens, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  border: "--border",
  ring: "--ring",
  sidebarBackground: "--sidebar-background",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
}

export function BrandProvider({
  brand = ORNO_BRAND,
  children,
}: {
  brand?: BrandConfig
  children: React.ReactNode
}) {
  React.useEffect(() => {
    // ORNO tokens already ship in globals.css — only override for other brands.
    if (brand === ORNO_BRAND) return
    const root = document.documentElement
    const prev: Array<[string, string]> = []
    for (const key of Object.keys(brand.tokens) as Array<keyof BrandTokens>) {
      const cssVar = TOKEN_TO_VAR[key]
      prev.push([cssVar, root.style.getPropertyValue(cssVar)])
      root.style.setProperty(cssVar, brand.tokens[key])
    }
    return () => {
      for (const [cssVar, value] of prev) {
        if (value) root.style.setProperty(cssVar, value)
        else root.style.removeProperty(cssVar)
      }
    }
  }, [brand])

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
}
