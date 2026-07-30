"use client"

// M2 · Replaces app/employee/layout.tsx — same pattern as admin.

import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { AppShell } from "@/components/shell/app-shell"
import { UserMenu } from "@/components/shell/user-menu"
import { BrandProvider } from "@/components/shell/brand-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = useRequireAuth(["employee"])
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
        role="employee"
        shopName={user.businessName ?? undefined}
        onCreateAction={(key) => {
          if (key === "block") router.push("/employee/agenda?block=1")
        }}
        userSlot={
          <UserMenu
            name={user.name ?? "Cuenta"}
            roleLabel="Barbero"
            email={user.email ?? undefined}
            onProfile={() => router.push("/employee/perfil")}
            onSignOut={() => window.dispatchEvent(new CustomEvent("orno:signout"))}
          />
        }
      >
        {children}
      </AppShell>
    </BrandProvider>
  )
}
