import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { stockDataService } from '../services/stockDataService'
import type { SearchResult } from '../types/stock-market'

interface NavbarProps {
  activeSection?: 'sectorial' | 'stock-market' | 'politician-trading' | 'portfolio' | 'alerts' | 'settings'
}

export default function Navbar({ activeSection = 'sectorial' }: NavbarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await stockDataService.searchStocks(searchQuery, { limit: 8 })
        setSearchResults(response.results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [searchQuery])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectStock = (symbol: string) => {
    setShowResults(false)
    setSearchQuery('')
    navigate(`/stock-market?symbol=${symbol}`)
  }

  const navItems = [
    { id: 'sectorial', label: 'Analyse Sectorielle', icon: '📊', path: '/' },
    { id: 'stock-market', label: 'Marché Boursier', icon: '📈', path: '/stock-market' },
    { id: 'politician-trading', label: 'Trading Politique', icon: '🏛️', path: '/politician-trading' },
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
              onClick={() => navigate(item.path)}
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

      {/* Search Bar */}
      <div ref={searchRef} style={{
        flex: 1,
        maxWidth: 400,
        marginLeft: 32,
        position: 'relative'
      }}>
        <div style={{
          position: 'relative',
          width: '100%'
        }}>
          <input
            type="text"
            placeholder="Rechercher des actions, indices..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#E2E8F0',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif"
            }}
          />
          <div style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748B',
            fontSize: 16,
            pointerEvents: 'none'
          }}>
            {isSearching ? '⏳' : '🔍'}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchQuery.length >= 2 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#0A1628',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            maxHeight: 400,
            overflowY: 'auto',
            zIndex: 1000
          }}>
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <div
                  key={result.symbol}
                  onClick={() => handleSelectStock(result.symbol)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#F1F5F9',
                        marginBottom: 2
                      }}>
                        {result.symbol}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: '#64748B'
                      }}>
                        {result.name}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span style={{
                        fontSize: 10,
                        color: '#475569',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontFamily: "'DM Mono', monospace"
                      }}>
                        {result.exchange}
                      </span>
                      <span style={{
                        fontSize: 10,
                        color: '#60A5FA',
                        background: 'rgba(59,130,246,0.1)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontFamily: "'DM Mono', monospace"
                      }}>
                        {result.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#64748B',
                fontSize: 13
              }}>
                {isSearching ? 'Recherche en cours...' : 'Aucun résultat trouvé'}
              </div>
            )}
          </div>
        )}
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
