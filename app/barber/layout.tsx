"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"

export default function BarberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useRequireAuth(["employee", "barber", "admin"])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
