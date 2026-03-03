import { useState } from 'react'

interface NavbarProps {
  activeSection?: 'sectorial' | 'portfolio' | 'alerts' | 'settings'
}

export default function Navbar({ activeSection = 'sectorial' }: NavbarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const navItems = [
    { id: 'sectorial', label: 'Analyse Sectorielle', icon: '📊', path: '/' },
    { id: 'portfolio', label: 'Portfolio', icon: '💼', path: '/portfolio' },
    { id: 'alerts', label: 'Alertes', icon: '🔔', path: '/alerts' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️', path: '/settings' }
  ]

  return (
    <nav style={{
      width: '100%',
      height: 64,
      background: 'rgba(8,14,26,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* Logo / Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 700,
          color: '#fff'
        }}>
          M
        </div>
        <div>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#F1F5F9',
            lineHeight: 1
          }}>
            Market Intelligence
          </div>
          <div style={{
            fontSize: 10,
            color: '#64748B',
            marginTop: 2,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: 1
          }}>
            REAL-TIME ANALYTICS
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        {navItems.map((item) => {
          const isActive = activeSection === item.id
          const isHovered = hoveredItem === item.id

          return (
            <button
              key={item.id}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: isActive 
                  ? 'rgba(59,130,246,0.15)' 
                  : isHovered 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'transparent',
                border: isActive 
                  ? '1px solid rgba(59,130,246,0.3)' 
                  : '1px solid transparent',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: isActive ? '#60A5FA' : '#94A3B8',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#3B82F6',
                  boxShadow: '0 0 8px rgba(59,130,246,0.6)'
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Right Section - Status & User */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}>
        {/* Live Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 6
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#10B981',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          <span style={{
            fontSize: 11,
            color: '#10B981',
            fontFamily: "'DM Mono', monospace",
            fontWeight: 500
          }}>
            LIVE
          </span>
        </div>

        {/* User Avatar */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: '#fff',
          cursor: 'pointer',
          border: '2px solid rgba(255,255,255,0.1)'
        }}>
          U
        </div>
      </div>
    </nav>
  )
}
