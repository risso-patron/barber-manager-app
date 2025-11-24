"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/auth/login")
      return
    }

    const user = JSON.parse(currentUser)
    if (user.role !== "client") {
      router.push("/dashboard")
    }
  }, [router])

  return <>{children}</>
}
