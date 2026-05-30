"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useRequireAuth(["admin"])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  return <div className="min-h-screen bg-stone-50">{children}</div>
}
