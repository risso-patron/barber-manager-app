import type React from "react"
import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { Cormorant_Garamond, Inter, DM_Sans, DM_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

// ORNO M0 — Inter is the product typeface (--font-sans).
// Cormorant Garamond: wordmark / brand moments only.
// DM Sans + DM Mono stay TEMPORARILY: 6 legacy components reference
// var(--font-dm-sans) directly; they migrate in M1, then remove both.

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Ornō — Gestión que embellece tu negocio",
  description:
    "Citas, empleados e inventario para barberías, salones y espacios de belleza que quieren operar con precisión.",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon.ico" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${GeistMono.variable} ${cormorant.variable} ${dmSans.variable} ${dmMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
