"use client"

// M2 · Replaces app/client/layout.tsx — same pattern; client role.

import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { AppShell } from "@/components/shell/app-shell"
import { UserMenu } from "@/components/shell/user-menu"
import { BrandProvider } from "@/components/shell/brand-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = useRequireAuth(["client"])
  const router = useRouter()

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4" role="status" aria-label="Verificando sesión">
          <Skeleton className="size-10 rounded-full" />
          <p className="text-[13px] text-muted-foreground">Un momento…</p>
        </div>
      </div>
    )
  }

  return (
    <BrandProvider>
      <AppShell
        role="client"
        userSlot={
          <UserMenu
            name={user.name ?? "Mi cuenta"}
            roleLabel="Cliente"
            email={user.email ?? undefined}
            onProfile={() => router.push("/client/profile")}
            onSignOut={() => window.dispatchEvent(new CustomEvent("orno:signout"))}
          />
        }
      >
        {children}
      </AppShell>
    </BrandProvider>
  )
}
