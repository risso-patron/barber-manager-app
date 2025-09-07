import { create } from "zustand"
import type { User, Appointment, InventoryItem } from "./types"

interface AppState {
  user: User | null
  appointments: Appointment[]
  inventory: InventoryItem[]
  setUser: (user: User | null) => void
  setAppointments: (appointments: Appointment[]) => void
  setInventory: (inventory: InventoryItem[]) => void
  addAppointment: (appointment: Appointment) => void
  updateAppointment: (id: string, updates: Partial<Appointment>) => void
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  appointments: [],
  inventory: [],
  setUser: (user) => set({ user }),
  setAppointments: (appointments) => set({ appointments }),
  setInventory: (inventory) => set({ inventory }),
  addAppointment: (appointment) => set((state) => ({ appointments: [...state.appointments, appointment] })),
  updateAppointment: (id, updates) =>
    set((state) => ({
      appointments: state.appointments.map((apt) => (apt.id === id ? { ...apt, ...updates } : apt)),
    })),
  updateInventoryItem: (id, updates) =>
    set((state) => ({
      inventory: state.inventory.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    })),
}))
