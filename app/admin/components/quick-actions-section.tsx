interface QuickAction {
  label: string
  icon: string
  gradient: string
  onClick: () => void
}

interface QuickActionsSectionProps {
  onNewAppointment: () => void
  onNewClient: () => void
  onManageEmployees: () => void
  onManageInventory: () => void
}

export function QuickActionsSection({
  onNewAppointment,
  onNewClient,
  onManageEmployees,
  onManageInventory
}: QuickActionsSectionProps) {
  const actions: QuickAction[] = [
    {
      label: "📅 Nueva Cita",
      icon: "📅",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      onClick: onNewAppointment
    },
    {
      label: "👤 Nuevo Cliente",
      icon: "👤",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      onClick: onNewClient
    },
    {
      label: "💼 Gestionar Empleados",
      icon: "💼",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      onClick: onManageEmployees
    },
    {
      label: "📦 Inventario",
      icon: "📦",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      onClick: onManageInventory
    }
  ]

  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      marginBottom: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '1rem'
      }}>
        Acciones Rápidas
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            style={{
              padding: '1rem',
              background: action.gradient,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
