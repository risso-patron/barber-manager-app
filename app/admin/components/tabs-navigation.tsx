interface Tab {
  id: string
  label: string
  icon: string
}

interface TabsNavigationProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  const tabs: Tab[] = [
    { id: 'overview', label: 'Vista General', icon: '📊' },
    { id: 'appointments', label: 'Citas', icon: '📅' },
    { id: 'clients', label: 'Clientes', icon: '👥' },
    { id: 'employees', label: 'Empleados', icon: '💼' },
    { id: 'inventory', label: 'Inventario', icon: '📦' },
  ]

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '1rem', 
      padding: '0.5rem',
      marginBottom: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      gap: '0.5rem',
      overflowX: 'auto'
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            background: activeTab === tab.id 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'transparent',
            color: activeTab === tab.id ? 'white' : '#64748b',
          }}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
