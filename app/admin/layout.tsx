"use client"

// M2 · Replaces app/admin/layout.tsx
// Auth guard preserved VERBATIM (useRequireAuth roles untouched).
// All layout chrome now comes from AppShell — the page renders inside.

import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { AppShell } from "@/components/shell/app-shell"
import { UserMenu } from "@/components/shell/user-menu"
import { BrandProvider } from "@/components/shell/brand-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { signOut } from "@/lib/sign-out"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useRequireAuth(["admin"])
  const router = useRouter()

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4" role="status" aria-label="Verificando permisos">
          <Skeleton className="size-10 rounded-full" />
          <p className="text-[13px] text-muted-foreground">Verificando permisos…</p>
        </div>
      </div>
    )
  }

  return (
    <BrandProvider>
      <AppShell
        role="admin"
        shopName={user.businessName ?? undefined}
        contextLabel={undefined}
        onCreateAction={(key) => {
          // Route creation verbs to the existing flows — no business logic here.
          if (key === "appointment") router.push("/admin/appointments?new=1")
          if (key === "sale") router.push("/admin/pos")
          if (key === "client") router.push("/admin/clients?new=1")
          if (key === "block") router.push("/admin/appointments?block=1")
        }}
        userSlot={
          <UserMenu
            name={user.name ?? "Cuenta"}
            roleLabel="Dueño"
            email={user.email ?? undefined}
            onProfile={() => router.push("/admin/settings")}
            onPreferences={() => router.push("/admin/settings")}
            onSignOut={async () => {
              await signOut()
              router.push("/auth/login")
            }}
          />
        }
      >
        {children}
      </AppShell>
    </BrandProvider>
  )
}
