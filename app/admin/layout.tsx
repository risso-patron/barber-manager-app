"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminLayout({
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
    if (user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [router])

  return <>{children}</>
}
