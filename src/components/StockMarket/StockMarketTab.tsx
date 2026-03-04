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
    }
  }, [searchParams, state.selectedSymbol])

  const handleViewChange = (view: StockMarketState['activeView']) => {
    setState(prev => ({ ...prev, activeView: view }))
  }

  const handleSymbolSelect = (symbol: string) => {
    setState(prev => ({ ...prev, selectedSymbol: symbol, activeView: 'chart' }))
    setSearchParams({ symbol })
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
      background: '#060B14',
      color: '#E2E8F0',
      fontFamily: "'DM Sans', sans-serif",
      padding: '28px 32px'
    }}>
      {/* Error Boundary */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#EF4444',
          fontSize: 14
        }}>
          {error}
        </div>
      )}

      {/* Indexes Error */}
      {indexesError && !error && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#F59E0B',
          fontSize: 14
        }}>
          ⚠️ Impossible de charger les indices en temps réel. Vérifiez que le backend est démarré.
        </div>
      )}

      {/* Backend Unavailable Warning */}
      {!backendAvailable && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12
        }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{
              color: '#F59E0B',
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 6
            }}>
              Backend non disponible
            </div>
            <div style={{
              color: '#FCD34D',
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 8
            }}>
              Le serveur backend n'est pas démarré. Les fonctionnalités suivantes sont indisponibles :
              recherche d'actions, données en temps réel, graphiques.
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 6,
              padding: '8px 12px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: '#FCD34D'
            }}>
              <div style={{ marginBottom: 4 }}>💡 Pour démarrer le backend :</div>
              <code style={{ color: '#FDE68A' }}>cd server && npm run dev</code>
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
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22
          }}>
            📈
          </div>
          <div>
            <h1 style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#F1F5F9',
              lineHeight: 1
            }}>
              Marché Boursier
            </h1>
            <p style={{
              fontSize: 13,
              color: '#475569',
              marginTop: 4
            }}>
              Données en temps réel · {state.watchlist.length} actions suivies
            </p>
          </div>
        </div>

        {/* View Selector */}
        <div style={{
          display: 'flex',
          gap: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
          padding: 4
        }}>
          {(['overview', 'chart', 'heatmap', 'comparison'] as const).map(view => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              style={{
                padding: '8px 16px',
                background: state.activeView === view ? 'rgba(59,130,246,0.15)' : 'transparent',
                border: state.activeView === view ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                borderRadius: 6,
                color: state.activeView === view ? '#60A5FA' : '#94A3B8',
                fontSize: 13,
                fontWeight: state.activeView === view ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
            >
              {view === 'overview' ? 'Vue d\'ensemble' : 
               view === 'chart' ? 'Graphique' :
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
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: 24
              }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  letterSpacing: 2,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  marginBottom: 20
                }}>
                  Indices Majeurs
                </div>
                <IndexDisplay
                  indexes={indexes}
                  loading={loadingIndexes}
                  onIndexClick={handleSymbolSelect}
                />
              </div>

              {/* Stock Search */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: 24
              }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  letterSpacing: 2,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  marginBottom: 16
                }}>
                  Rechercher une action
                </div>
                <StockSearch onSelect={handleSymbolSelect} />
              </div>
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
        )}

        {state.activeView === 'heatmap' && (
          <HeatmapView onStockSelect={handleSymbolSelect} />
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
