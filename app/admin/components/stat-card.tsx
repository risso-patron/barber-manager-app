interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  gradient: string
  icon?: string
}

export function StatCard({ title, value, subtitle, gradient, icon }: StatCardProps) {
  return (
    <div style={{
      background: gradient,
      padding: '1.5rem',
      borderRadius: '0.75rem',
      color: 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        fontSize: '0.875rem', 
        opacity: 0.9, 
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {icon && <span>{icon}</span>}
        {title}
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
        {subtitle}
      </div>
    </div>
  )
}
