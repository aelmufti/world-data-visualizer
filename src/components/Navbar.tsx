import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { stockDataService } from '../services/stockDataService'
import { backendStatusService, type BackendStatus } from '../services/backendStatusService'
import type { SearchResult } from '../types/stock-market'

interface NavbarProps {
  activeSection?: 'overview' | 'sectorial' | 'stock-market' | 'politician-trading' | 'congress-tracker' | 'settings'
}

export default function Navbar({ activeSection = 'sectorial' }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null)
  const [showStatusTooltip, setShowStatusTooltip] = useState(false)
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

  // Fetch backend status when hovering over Live indicator
  const handleStatusHover = async () => {
    setShowStatusTooltip(true)
    const status = await backendStatusService.getStatus()
    setBackendStatus(status)
  }

  const handleSelectStock = (symbol: string) => {
    setShowResults(false)
    setSearchQuery('')
    navigate(`/stock-market?symbol=${symbol}`)
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '🏠', path: '/overview' },
    { id: 'sectorial', label: 'Sector Analysis', icon: '📊', path: '/' },
    { id: 'stock-market', label: 'Stock Market', icon: '📈', path: '/stock-market' },
    { id: 'congress-tracker', label: 'Congress Tracker', icon: '🗳️', path: '/congress-tracker' }
  ]

  return (
    <nav style={{
      width: 280,
      height: '100vh',
      background: '#e0e5ec',
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      overflowY: 'auto',
      boxShadow: "8px 0 16px rgba(163, 177, 198, 0.3)"
    }}>
      {/* Logo / Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '24px 20px',
        background: "linear-gradient(145deg, #d1d9e6, #f0f4f8)",
        boxShadow: "0 4px 12px rgba(163, 177, 198, 0.3)"
      }}>
        <div style={{
          width: 50,
          height: 50,
          background: 'linear-gradient(145deg, #3B82F6, #2563EB)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 700,
          color: '#fff',
          boxShadow: "6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.8)"
        }}>
          📊
        </div>
        <div>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#2d3748',
            lineHeight: 1.2,
            marginBottom: 4
          }}>
            Market Intel
          </div>
          <div style={{
            fontSize: 9,
            color: '#718096',
            fontFamily: "'Inter', sans-serif",
            letterSpacing: 1.2,
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            Real-Time Analytics
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div ref={searchRef} style={{
        padding: '16px',
        position: 'relative'
      }}>
        <div style={{
          position: 'relative',
          width: '100%'
        }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              background: '#e0e5ec',
              border: 'none',
              borderRadius: '12px',
              color: '#2d3748',
              fontSize: 13,
              outline: 'none',
              transition: 'all 0.3s',
              fontFamily: "'Poppins', sans-serif",
              boxShadow: "inset 4px 4px 8px rgba(163, 177, 198, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.5)"
            }}
          />
          <div style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#718096',
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
            left: 16,
            right: 16,
            background: '#e0e5ec',
            borderRadius: '16px',
            boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.5)',
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
                    padding: '12px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(163, 177, 198, 0.2)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(145deg, #d1d9e6, #f0f4f8)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#2d3748',
                    marginBottom: 4
                  }}>
                    {result.symbol}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#718096',
                    marginBottom: 6
                  }}>
                    {result.name}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 6
                  }}>
                    <span style={{
                      fontSize: 9,
                      color: '#4a5568',
                      background: '#e0e5ec',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
                    }}>
                      {result.exchange}
                    </span>
                    <span style={{
                      fontSize: 9,
                      color: '#3B82F6',
                      background: '#e0e5ec',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
                    }}>
                      {result.type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#718096',
                fontSize: 12,
                fontWeight: 500
              }}>
                {isSearching ? 'Searching...' : 'No results found'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flex: 1,
        padding: '16px'
      }}>
        {navItems.map((item) => {
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: isActive 
                  ? `linear-gradient(145deg, ${item.id === 'overview' ? '#3B82F620' : '#3B82F615'}, ${item.id === 'overview' ? '#3B82F610' : '#3B82F608'})` 
                  : '#e0e5ec',
                color: isActive ? '#3B82F6' : '#4a5568',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                position: 'relative',
                boxShadow: isActive 
                  ? 'inset 4px 4px 8px rgba(163, 177, 198, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.5)'
                  : '6px 6px 12px rgba(163, 177, 198, 0.4), -6px -6px 12px rgba(255, 255, 255, 0.8)'
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && (
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#3B82F6',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.6)'
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Bottom Section - Status */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '16px',
        background: "linear-gradient(145deg, #d1d9e6, #f0f4f8)",
        boxShadow: "0 -4px 12px rgba(163, 177, 198, 0.3)"
      }}>
        {/* Live Status */}
        <div 
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            background: '#e0e5ec',
            borderRadius: '12px',
            boxShadow: 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)',
            cursor: 'pointer'
          }}
          onMouseEnter={handleStatusHover}
          onMouseLeave={(e) => {
            // Only hide if we're not moving to the tooltip
            const relatedTarget = e.relatedTarget as HTMLElement
            if (!relatedTarget || !relatedTarget.closest('[data-status-tooltip]')) {
              setShowStatusTooltip(false)
            }
          }}
        >
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: backendStatus?.overall === 'operational' ? '#48bb78' : 
                       backendStatus?.overall === 'degraded' ? '#f6ad55' : 
                       backendStatus?.overall === 'down' ? '#f56565' : '#48bb78',
            boxShadow: `0 0 10px ${backendStatus?.overall === 'operational' ? 'rgba(72, 187, 120, 0.6)' : 
                                   backendStatus?.overall === 'degraded' ? 'rgba(246, 173, 85, 0.6)' : 
                                   backendStatus?.overall === 'down' ? 'rgba(245, 101, 101, 0.6)' : 'rgba(72, 187, 120, 0.6)'}`,
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          <span style={{
            fontSize: 12,
            color: backendStatus?.overall === 'operational' ? '#48bb78' : 
                   backendStatus?.overall === 'degraded' ? '#f6ad55' : 
                   backendStatus?.overall === 'down' ? '#f56565' : '#48bb78',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600
          }}>
            LIVE
          </span>

          {/* Status Tooltip */}
          {showStatusTooltip && backendStatus && (
            <div 
              data-status-tooltip
              style={{
                position: 'fixed',
                bottom: 80,
                left: 16,
                width: 248,
                background: '#e0e5ec',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.5)',
                zIndex: 2000
              }}
              onMouseEnter={() => setShowStatusTooltip(true)}
              onMouseLeave={() => setShowStatusTooltip(false)}
            >
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#2d3748',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>Backend Services</span>
                <span style={{
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: backendStatus.overall === 'operational' ? '#48bb7820' : 
                             backendStatus.overall === 'degraded' ? '#f6ad5520' : '#f5656520',
                  color: backendStatus.overall === 'operational' ? '#48bb78' : 
                         backendStatus.overall === 'degraded' ? '#f6ad55' : '#f56565',
                  fontWeight: 600
                }}>
                  {backendStatus.overall.toUpperCase()}
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                {Object.entries(backendStatus.services).map(([key, service]) => (
                  <div key={key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    background: '#e0e5ec',
                    borderRadius: '10px',
                    boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
                  }}>
                    <span style={{ fontSize: 16 }}>{service.icon}</span>
                    <span style={{
                      flex: 1,
                      fontSize: 11,
                      color: '#4a5568',
                      fontWeight: 500
                    }}>
                      {service.name}
                    </span>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: service.status === 'operational' ? '#48bb78' : '#f56565',
                      boxShadow: `0 0 8px ${service.status === 'operational' ? 'rgba(72, 187, 120, 0.6)' : 'rgba(245, 101, 101, 0.6)'}`
                    }} />
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid rgba(163, 177, 198, 0.2)',
                fontSize: 9,
                color: '#718096',
                textAlign: 'center',
                fontFamily: "'Inter', sans-serif"
              }}>
                Last updated: {new Date(backendStatus.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
