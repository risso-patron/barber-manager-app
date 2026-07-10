"use client"

// LAND-1 · Navbar pública sticky. ÚNICA isla client de la Landing:
// el estado existe solo para abrir/cerrar el menú mobile.

import { useState } from "react"
import { Menu, X } from "lucide-react"

import { Logo } from "@/components/ui/foundations/logo"
import { LandingCta } from "@/components/landing/shared/landing-cta"
import { DEMO_CTA, LOGIN_CTA } from "@/components/landing/shared/content"
import { NAV_LINKS } from "./content"

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-7 px-6 md:px-8">
        <Logo href="/" height={26} />

        <nav aria-label="Principal" className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-600 transition-colors duration-micro hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 md:flex lg:ml-0">
          <LandingCta href={LOGIN_CTA.href} variant="secondary" size="sm">
            {LOGIN_CTA.label}
          </LandingCta>
          <LandingCta href={DEMO_CTA.href} size="sm">
            {DEMO_CTA.label}
          </LandingCta>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="landing-nav-mobile"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="ml-auto flex size-11 items-center justify-center rounded-lg text-foreground transition-colors duration-micro hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent lg:hidden"
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav
          id="landing-nav-mobile"
          aria-label="Principal móvil"
          className="border-t border-border bg-background px-6 pb-6 pt-3 lg:hidden"
        >
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center border-b border-border text-[15px] font-medium text-ink-600 last:border-0"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2.5 md:hidden">
            <LandingCta href={LOGIN_CTA.href} variant="secondary" size="sm">
              {LOGIN_CTA.label}
            </LandingCta>
            <LandingCta href={DEMO_CTA.href} size="sm">
              {DEMO_CTA.label}
            </LandingCta>
          </div>
        </nav>
      )}
    </header>
  )
}
