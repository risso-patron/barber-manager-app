import Link from "next/link"

import { Logo } from "@/components/ui/foundations/logo"
import { FOOTER } from "./content"

// LAND-1B · Footer (blueprint §14 adaptado): links reales + versión visible.

export function LandingFooter() {
  return (
    <footer className="border-t border-surface/10 bg-ink-900">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-6 py-10 md:px-8">
        <div>
          <Logo theme="dark" height={22} />
          <div className="mt-1.5 text-[12.5px] text-ink-400">{FOOTER.tagline}</div>
        </div>

        <nav aria-label="Pie de página" className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
          {FOOTER.links.map((link) =>
            link.href.startsWith("/") ? (
              <Link key={link.label} href={link.href} className="text-ink-300 transition-colors duration-micro hover:text-surface">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="text-ink-300 transition-colors duration-micro hover:text-surface">
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="text-xs text-ink-400">
          <div>{FOOTER.version}</div>
          <div className="mt-0.5">{FOOTER.copyright}</div>
        </div>
      </div>
    </footer>
  )
}
