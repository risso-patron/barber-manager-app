"use client"

import { StatsSection } from "../stats-section"
import { QuickActionsSection } from "../quick-actions-section"
import { RecentAppointmentsTable } from "../recent-appointments-table"

interface OverviewViewProps {
  stats: {
    todayAppointments: number
    monthlyRevenue: number
    totalClients: number
    barbers: number
  }
  recentAppointments: any[]
  onNewAppointment: () => void
  onNewClient: () => void
  onManageEmployees: () => void
  onManageInventory: () => void
}

export function OverviewView({
  stats,
  recentAppointments,
  onNewAppointment,
  onNewClient,
  onManageEmployees,
  onManageInventory
}: OverviewViewProps) {
  return (
    <div>
      <StatsSection stats={stats} />
      <QuickActionsSection
        onNewAppointment={onNewAppointment}
        onNewClient={onNewClient}
        onManageEmployees={onManageEmployees}
        onManageInventory={onManageInventory}
      />
      <RecentAppointmentsTable appointments={recentAppointments} />
    </div>
  )
}
