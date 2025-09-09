"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "./types"
import { authenticateDemoUser } from "./demo-data"

interface DemoAuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setUser: (user: User | null) => void
}

export const useDemoAuth = create<DemoAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Simular delay de red
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const user = authenticateDemoUser(email, password)

        if (user) {
          set({ user, isAuthenticated: true })
          return { success: true }
        } else {
          return { success: false, error: "Credenciales inválidas" }
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user })
      },
    }),
    {
      name: "demo-auth-storage",
    },
  ),
)
