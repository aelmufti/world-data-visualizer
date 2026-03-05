import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StockMarketState, StockQuote } from '../../types/stock-market'
import { stockStorage } from '../../services/stockStorage'
import { getStockWebSocketClient } from '../../services/stockWebSocket'
import { useMarketIndexes } from '../../hooks/useMarketIndexes'
import { getAllMarketStatuses } from '../../services/marketHours'
import IndexDisplay from './IndexDisplay'
import MarketStatusIndicator from './MarketStatusIndicator'
import { CandlestickChart } from './CandlestickChart'
import { HeatmapView } from './HeatmapView'
import { ComparisonView } from './ComparisonView'
import { StockSearch } from './StockSearch'
import { StockDetailView } from './StockDetailView'
import { WatchlistPanel } from './WatchlistPanel'
import { AlertPanel } from './AlertPanel'
import FearGreedPanel from '../FearGreedPanel'

export default function StockMarketTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState<StockMarketState>({
    activeView: 'overview',
    selectedSymbol: searchParams.get('symbol') || null,
    watchlist: [],
    alerts: [],
    marketStatus: {
      market: 'US',
      isOpen: false,
      session: 'closed',
      nextEvent: {
        type: 'open',
        time: new Date(),
        countdown: ''
      }
    }
  })

  const [error, setError] = useState<string | null>(null)
  const [backendAvailable, setBackendAvailable] = useState(true)
  const { indexes, loading: loadingIndexes, error: indexesError } = useMarketIndexes()
  const [comparisonSymbols, setComparisonSymbols] = useState<string[]>([])
  const [prices, setPrices] = useState<Map<string, StockQuote>>(new Map())
  const [marketStatuses, setMarketStatuses] = useState(getAllMarketStatuses())

  // Check backend availability
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/health', { 
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        })
        setBackendAvailable(response.ok)
      } catch {
        setBackendAvailable(false)
      }
    }
    
    checkBackend()
    const interval = setInterval(checkBackend, 30000) // Check every 30s
    
    return () => clearInterval(interval)
  }, [])

  // Update market statuses every minute
  useEffect(() => {
    const updateMarketStatuses = () => {
      setMarketStatuses(getAllMarketStatuses())
    }

    // Update immediately
    updateMarketStatuses()

    // Update every minute
    const interval = setInterval(updateMarketStatuses, 60000)

    return () => clearInterval(interval)
  }, [])

  // Initialize WebSocket connection and load persisted data
  useEffect(() => {
    try {
      // Load persisted data from localStorage
      const savedWatchlist = stockStorage.loadWatchlist()
      const savedAlerts = stockStorage.loadAlerts()
      const savedPreferences = stockStorage.loadPreferences()

      setState(prev => ({
        ...prev,
        watchlist: savedWatchlist,
        alerts: savedAlerts,
        activeView: savedPreferences?.defaultView || 'overview'
      }))

      // Initialize WebSocket connection
      const wsClient = getStockWebSocketClient()
      wsClient.connect()

      // Subscribe to watchlist symbols if any
      if (savedWatchlist.length > 0) {
        wsClient.subscribe(savedWatchlist)
      }

      return () => {
        wsClient.disconnect()
      }
    } catch (err) {
      setError('Failed to initialize stock market data')
      console.error('StockMarketTab initialization error:', err)
    }
  }, [])

  // Handle URL parameter changes
  useEffect(() => {
    const symbol = searchParams.get('symbol')
    if (symbol && symbol !== state.selectedSymbol) {
      setState(prev => ({
        ...prev,
        selectedSymbol: symbol,
        activeView: 'chart'
      }))
    } else if (!symbol && state.selectedSymbol && state.activeView === 'chart') {
      // If URL is cleared but we're still in chart view with a symbol, clear the symbol
      setState(prev => ({
        ...prev,
        selectedSymbol: null
      }))
    }
  }, [searchParams])

  const handleViewChange = (view: StockMarketState['activeView']) => {
    // Always change the view immediately
    setState(prev => ({ ...prev, activeView: view }))
    
    // Clear symbol and URL when switching away from chart view
    if (view !== 'chart' && state.selectedSymbol) {
      setState(prev => ({ ...prev, selectedSymbol: null }))
      setSearchParams({})
    }
  }

  const handleSymbolSelect = (symbol: string) => {
    setState(prev => ({ ...prev, selectedSymbol: symbol, activeView: 'chart' }))
    setSearchParams({ symbol })
  }

  const handleClearSymbol = () => {
    setState(prev => ({ ...prev, selectedSymbol: null, activeView: 'overview' }))
    setSearchParams({}) // Clear URL parameters
  }

  const handleAddToWatchlist = (symbol: string) => {
    setState(prev => {
      const newWatchlist = [...prev.watchlist, symbol]
      stockStorage.saveWatchlist(newWatchlist)
      return { ...prev, watchlist: newWatchlist }
    })
  }

  const handleRemoveFromWatchlist = (symbol: string) => {
    setState(prev => {
      const newWatchlist = prev.watchlist.filter(s => s !== symbol)
      stockStorage.saveWatchlist(newWatchlist)
      return { ...prev, watchlist: newWatchlist }
    })
  }

  const handleAddAlert = (alert: any) => {
    setState(prev => {
      const newAlerts = [...prev.alerts, alert]
      stockStorage.saveAlerts(newAlerts)
      return { ...prev, alerts: newAlerts }
    })
  }

  const handleRemoveAlert = (alertId: string) => {
    setState(prev => {
      const newAlerts = prev.alerts.filter(a => a.id !== alertId)
      stockStorage.saveAlerts(newAlerts)
      return { ...prev, alerts: newAlerts }
    })
  }

  const handleReorderWatchlist = (from: number, to: number) => {
    setState(prev => {
      const newWatchlist = [...prev.watchlist];
      const [removed] = newWatchlist.splice(from, 1);
      newWatchlist.splice(to, 0, removed);
      stockStorage.saveWatchlist(newWatchlist);
      return { ...prev, watchlist: newWatchlist };
    });
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#e0e5ec',
      color: '#4a5568',
      fontFamily: "'Poppins', sans-serif",
      padding: '28px 32px'
    }}>
      {/* Error Boundary */}
      {error && (
        <div style={{
          background: 'linear-gradient(145deg, #fef2f2, #fee2e2)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#dc2626',
          fontSize: 14,
          fontWeight: 500,
          boxShadow: 'inset 3px 3px 6px rgba(163, 177, 198, 0.3), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
        }}>
          {error}
        </div>
      )}

      {/* Indexes Error */}
      {indexesError && !error && (
        <div style={{
          background: 'linear-gradient(145deg, #fffbeb, #fef3c7)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#d97706',
          fontSize: 14,
          fontWeight: 500,
          boxShadow: 'inset 3px 3px 6px rgba(163, 177, 198, 0.3), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
        }}>
          ⚠️ Impossible de charger les indices en temps réel. Vérifiez que le backend est démarré.
        </div>
      )}

      {/* Backend Unavailable Warning */}
      {!backendAvailable && (
        <div style={{
          background: '#e0e5ec',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          boxShadow: '8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.5)'
        }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{
              color: '#d97706',
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 6
            }}>
              Backend non disponible
            </div>
            <div style={{
              color: '#78716c',
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 8
            }}>
              Le serveur backend n'est pas démarré. Les fonctionnalités suivantes sont indisponibles :
              recherche d'actions, données en temps réel, graphiques.
            </div>
            <div style={{
              background: '#e0e5ec',
              borderRadius: 8,
              padding: '8px 12px',
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              color: '#57534e',
              boxShadow: 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
            }}>
              <div style={{ marginBottom: 4 }}>💡 Pour démarrer le backend :</div>
              <code style={{ color: '#78716c' }}>cd server && npm run dev</code>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(145deg, #3B82F6, #2563EB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            boxShadow: '8px 8px 16px rgba(163, 177, 198, 0.5), -8px -8px 16px rgba(255, 255, 255, 0.8)'
          }}>
            📈
          </div>
          <div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#2d3748',
              lineHeight: 1.2
            }}>
              Stock Market
            </h1>
            <p style={{
              fontSize: 13,
              color: '#718096',
              marginTop: 4,
              fontWeight: 500
            }}>
              Real-time data · {state.watchlist.length} stocks tracked
            </p>
          </div>
        </div>

        {/* View Selector */}
        <div style={{
          display: 'flex',
          gap: 8,
          background: '#e0e5ec',
          borderRadius: 12,
          padding: 6,
          boxShadow: 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
        }}>
          {(['overview', 'heatmap', 'comparison'] as const).map(view => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              style={{
                padding: '10px 18px',
                background: state.activeView === view ? 'linear-gradient(145deg, #3B82F6, #2563EB)' : '#e0e5ec',
                border: 'none',
                borderRadius: 10,
                color: state.activeView === view ? '#fff' : '#4a5568',
                fontSize: 13,
                fontWeight: state.activeView === view ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.3s',
                textTransform: 'capitalize',
                boxShadow: state.activeView === view 
                  ? '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
                  : 'none'
              }}
            >
              {view === 'overview' ? 'Vue d\'ensemble' : 
               view === 'heatmap' ? 'Carte thermique' :
               'Comparaison'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Market Status Indicators */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 12
        }}>
          {marketStatuses.map((status) => (
            <MarketStatusIndicator
              key={status.market}
              market={status.market}
              status={{ isOpen: status.isOpen, session: status.session }}
              nextEvent={status.nextEvent}
            />
          ))}
        </div>

        {/* Main Content */}
        {state.activeView === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Indexes */}
              <div style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: 24,
                boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)'
              }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  letterSpacing: 1.5,
                  color: '#718096',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                  fontWeight: 600,
                  paddingBottom: 12,
                  borderBottom: '2px solid rgba(163, 177, 198, 0.2)'
                }}>
                  Indices Majeurs
                </div>
                <IndexDisplay
                  indexes={indexes}
                  loading={loadingIndexes}
                  onIndexClick={handleSymbolSelect}
                />
              </div>

              {/* Fear & Greed Index */}
              <FearGreedPanel />
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <WatchlistPanel
                symbols={state.watchlist}
                prices={prices}
                onAdd={handleAddToWatchlist}
                onRemove={handleRemoveFromWatchlist}
                onReorder={handleReorderWatchlist}
              />
              <AlertPanel
                alerts={state.alerts}
                onCreate={handleAddAlert}
                onDelete={handleRemoveAlert}
                onEdit={(id, updates) => {
                  setState(prev => ({
                    ...prev,
                    alerts: prev.alerts.map(a => a.id === id ? { ...a, ...updates } : a)
                  }))
                }}
              />
            </div>
          </div>
        )}

        {state.activeView === 'chart' && state.selectedSymbol && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Back Button */}
            <button
              onClick={handleClearSymbol}
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                background: '#e0e5ec',
                border: 'none',
                borderRadius: 12,
                color: '#4a5568',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.8)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.color = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.color = '#4a5568';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
              Retour à la vue d'ensemble
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <StockDetailView
                  symbol={state.selectedSymbol}
                  onAddToWatchlist={handleAddToWatchlist}
                  onRemoveFromWatchlist={handleRemoveFromWatchlist}
                  isInWatchlist={state.watchlist.includes(state.selectedSymbol)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <WatchlistPanel
                  symbols={state.watchlist}
                  prices={prices}
                  onAdd={handleAddToWatchlist}
                  onRemove={handleRemoveFromWatchlist}
                  onReorder={handleReorderWatchlist}
                />
                <AlertPanel
                  alerts={state.alerts}
                  onCreate={handleAddAlert}
                  onDelete={handleRemoveAlert}
                  onEdit={(id, updates) => {
                    setState(prev => ({
                      ...prev,
                      alerts: prev.alerts.map(a => a.id === id ? { ...a, ...updates } : a)
                    }))
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {state.activeView === 'heatmap' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {state.selectedSymbol && (
              <button
                onClick={handleClearSymbol}
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 18px',
                  background: '#e0e5ec',
                  border: 'none',
                  borderRadius: 12,
                  color: '#4a5568',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.8)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.color = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.color = '#4a5568';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 12L6 8l4-4" />
                </svg>
                Retour à la carte thermique
              </button>
            )}
            <HeatmapView onStockSelect={handleSymbolSelect} />
          </div>
        )}

        {state.activeView === 'comparison' && (
          <ComparisonView
            symbols={comparisonSymbols}
            timeframe="1M"
            onAddSymbol={(symbol) => setComparisonSymbols(prev => [...prev, symbol])}
            onRemoveSymbol={(symbol) => setComparisonSymbols(prev => prev.filter(s => s !== symbol))}
          />
        )}
      </div>
    </div>
  )
}
