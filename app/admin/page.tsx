"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getCurrentUserRole } from "@/lib/roles"

// Hooks
import { useDashboardStats } from "./hooks/use-dashboard-stats"

// Navigation
import { TabsNavigation } from "./components/tabs-navigation"

// Views
import { OverviewView } from "./components/views/overview-view"
import { AppointmentsView } from "./components/views/appointments-view"
import { CalendarView } from "./components/views/calendar-view"
import { ClientsView } from "./components/views/clients-view"
import { EmployeesView } from "./components/views/employees-view"
import { InventoryView } from "./components/views/inventory-view"

// Modals
import { NewAppointmentModal } from "./components/new-appointment-modal"
import { NewClientModal } from "./components/new-client-modal"
import { EmployeeManagementModal } from "./components/employee-management-modal"
import { InventoryModal } from "./components/inventory-modal"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  const router = useRouter()
  const { stats, recentAppointments, loading, error, refresh } = useDashboardStats()

  // Verificar que el usuario sea admin
  useEffect(() => {
    const checkRole = async () => {
      const user = await getCurrentUserRole()
      if (!user || user.role !== 'admin') {
        router.push('/employee')
        return
      }
      setIsAuthorized(true)
      setCheckingAuth(false)
    }
    checkRole()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (checkingAuth || !isAuthorized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b' }}>Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b' }}>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    router.push('/auth/login')
    return null
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewView
            stats={stats}
            recentAppointments={recentAppointments}
            onNewAppointment={() => setShowAppointmentModal(true)}
            onNewClient={() => setShowClientModal(true)}
            onManageEmployees={() => setShowEmployeeModal(true)}
            onManageInventory={() => setShowInventoryModal(true)}
          />
        )
      case 'appointments':
        return <AppointmentsView />
      case 'calendar':
        return <CalendarView />
      case 'clients':
        return <ClientsView onNewClient={() => setShowClientModal(true)} />
      case 'employees':
        return <EmployeesView onNewEmployee={() => setShowEmployeeModal(true)} />
      case 'inventory':
        return <InventoryView />
      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
              Dashboard Admin
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Gestiona tu barbería desde un solo lugar</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '0.75rem 1.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
            Cerrar Sesión
          </button>
        </div>

        {/* Tabs Navigation */}
        <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Active View Content */}
        {renderActiveView()}
      </div>

      {/* Modals */}
      <NewAppointmentModal isOpen={showAppointmentModal} onClose={() => setShowAppointmentModal(false)} onSuccess={refresh} />
      <NewClientModal isOpen={showClientModal} onClose={() => setShowClientModal(false)} onSuccess={refresh} />
      <EmployeeManagementModal isOpen={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} onSuccess={refresh} />
      <InventoryModal isOpen={showInventoryModal} onClose={() => setShowInventoryModal(false)} onSuccess={refresh} />

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
