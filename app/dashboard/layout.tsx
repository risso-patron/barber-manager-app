"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Footer } from "@/components/layout/footer"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUserStr = localStorage.getItem("currentUser")
    
    if (!currentUserStr) {
      router.replace("/login")
      return
    }

    try {
      const currentUser = JSON.parse(currentUserStr)
      setUser(currentUser)
      setIsLoading(false)
    } catch (error) {
      console.error("Error parsing user data:", error)
      localStorage.removeItem("currentUser")
      router.replace("/login")
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={user.role || "client"} userName={user.name} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
        <Footer />
      </main>
    </div>
  )
}
