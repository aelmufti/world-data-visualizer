import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { stockDataService } from '../services/stockDataService'
import { politicianTradingService } from '../services/politicianTradingService'
import { congressTrackerService } from '../services/congressTrackerService'
import FearGreedPanel from './FearGreedPanel'
import CortisolGauge from './CortisolGauge'
import type { PoliticianTrade } from '../services/politicianTradingService'
import type { CongressTrade, SystemStatus } from '../services/congressTrackerService'

interface MarketSnapshot {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

export default function OverviewTab() {
  const navigate = useNavigate()
  
  // Market data
  const [marketIndices, setMarketIndices] = useState<MarketSnapshot[]>([])
  const [loadingMarket, setLoadingMarket] = useState(true)
  
  // Politician trading
  const [recentTrades, setRecentTrades] = useState<PoliticianTrade[]>([])
  const [loadingTrades, setLoadingTrades] = useState(true)
  
  // Congress tracker
  const [congressTrades, setCongressTrades] = useState<CongressTrade[]>([])
  const [congressStatus, setCongressStatus] = useState<SystemStatus | null>(null)
  const [loadingCongress, setLoadingCongress] = useState(true)

  // Fetch market indices
  useEffect(() => {
    async function fetchMarketData() {
      try {
        setLoadingMarket(true)
        const symbols = ['^GSPC', '^DJI', '^IXIC', '^FCHI', '^GDAXI', '^VIX']
        const quotes = await stockDataService.fetchBatchQuotes(symbols)
        
        const snapshots: MarketSnapshot[] = quotes.map(q => ({
          symbol: q.symbol,
          name: getIndexName(q.symbol),
          price: q.price,
          change: q.change,
          changePercent: q.changePercent
        }))
        
        setMarketIndices(snapshots)
      } catch (error) {
        console.error('Error fetching market data:', error)
      } finally {
        setLoadingMarket(false)
      }
    }

    fetchMarketData()
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000) // Refresh every 5 min
    return () => clearInterval(interval)
  }, [])

  // Fetch politician trades
  useEffect(() => {
    async function fetchTrades() {
      try {
        setLoadingTrades(true)
        const trades = await politicianTradingService.getRecentTrades(10)
        setRecentTrades(trades)
      } catch (error) {
        console.error('Error fetching politician trades:', error)
      } finally {
        setLoadingTrades(false)
      }
    }

    fetchTrades()
  }, [])

  // Fetch congress tracker data
  useEffect(() => {
    async function fetchCongressData() {
      try {
        setLoadingCongress(true)
        const [trades, status] = await Promise.all([
          congressTrackerService.getTrades(),
          congressTrackerService.getStatus()
        ])
        
        setCongressTrades(trades.slice(0, 10))
        setCongressStatus(status)
      } catch (error) {
        console.error('Error fetching congress data:', error)
      } finally {
        setLoadingCongress(false)
      }
    }

    fetchCongressData()
  }, [])

  function getIndexName(symbol: string): string {
    const names: Record<string, string> = {
      '^GSPC': 'S&P 500',
      '^DJI': 'Dow Jones',
      '^IXIC': 'Nasdaq',
      '^FCHI': 'CAC 40',
      '^GDAXI': 'DAX',
      '^VIX': 'VIX'
    }
    return names[symbol] || symbol
  }

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 64px)', 
      background: '#e0e5ec', 
      color: '#4a5568',
      padding: '32px',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontSize: 32, 
          fontWeight: 700, 
          color: '#2d3748',
          marginBottom: 8
        }}>
          📊 Overview
        </h1>
        <p style={{ fontSize: 14, color: '#718096', fontWeight: 500 }}>
          Real-time snapshot of all market intelligence data
        </p>
      </div>

      {/* Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 24
      }}>
        
        {/* Market Indices Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 20
          }}>
            <div>
              <h2 style={{ 
                fontSize: 18, 
                fontWeight: 600, 
                color: '#0f172a',
                marginBottom: 4
              }}>
                📈 Market Indices
              </h2>
              <p style={{ fontSize: 12, color: '#4a5568', fontWeight: 500 }}>
                Live market performance
              </p>
            </div>
            <button
              onClick={() => navigate('/stock-market')}
              style={{
                padding: '10px 18px',
                background: '#e0e5ec',
                border: 'none',
                borderRadius: 12,
                color: '#667eea',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontWeight: 600,
                boxShadow: '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
              }}
            >
              View All →
            </button>
          </div>

          {loadingMarket ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#4a5568' }}>
              Loading...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {marketIndices.map((index) => (
                <div
                  key={index.symbol}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    background: '#f8fafc',
                    borderRadius: 8,
                    boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {index.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2 }}>
                      {index.symbol}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: 700, 
                      color: '#1a202c',
                      fontFamily: "'DM Mono', monospace"
                    }}>
                      {index.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: index.change >= 0 ? '#10B981' : '#EF4444',
                      marginTop: 2,
                      fontWeight: 600
                    }}>
                      {index.change >= 0 ? '▲' : '▼'} {Math.abs(index.changePercent).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fear & Greed Index Card */}
        <FearGreedPanel />

        {/* Cortisol Gauge Card */}
        <CortisolGauge />

        {/* Politician Trading Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 20
          }}>
            <div>
              <h2 style={{ 
                fontSize: 18, 
                fontWeight: 600, 
                color: '#0f172a',
                marginBottom: 4
              }}>
                💼 Politician Trading
              </h2>
              <p style={{ fontSize: 12, color: '#4a5568', fontWeight: 500 }}>
                Recent congressional trades
              </p>
            </div>
            <button
              onClick={() => navigate('/politician-trading')}
              style={{
                padding: '10px 18px',
                background: '#e0e5ec',
                border: 'none',
                borderRadius: 12,
                color: '#667eea',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontWeight: 600,
                boxShadow: '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
              }}
            >
              View All →
            </button>
          </div>

          {loadingTrades ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#4a5568' }}>
              Loading...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentTrades.slice(0, 5).map((trade, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 10,
                    background: '#f8fafc',
                    borderRadius: 8,
                    boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: 4
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                      {trade.ticker || 'N/A'}
                    </div>
                    <div style={{ 
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: trade.type === 'purchase' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: trade.type === 'purchase' ? '#059669' : '#dc2626',
                      fontWeight: 600
                    }}>
                      {trade.type}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#4a5568' }}>
                    {trade.representative}
                  </div>
                  <div style={{ 
                    fontSize: 10, 
                    color: '#64748b',
                    marginTop: 4,
                    fontFamily: "'DM Mono', monospace"
                  }}>
                    {politicianTradingService.formatDate(trade.transaction_date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Congress Tracker Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 20
          }}>
            <div>
              <h2 style={{ 
                fontSize: 18, 
                fontWeight: 600, 
                color: '#0f172a',
                marginBottom: 4
              }}>
                🗳️ Congress Tracker
              </h2>
              <p style={{ fontSize: 12, color: '#4a5568', fontWeight: 500 }}>
                Automated filing monitor
              </p>
            </div>
            <button
              onClick={() => navigate('/congress-tracker')}
              style={{
                padding: '10px 18px',
                background: '#e0e5ec',
                border: 'none',
                borderRadius: 12,
                color: '#667eea',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontWeight: 600,
                boxShadow: '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
              }}
            >
              View All →
            </button>
          </div>

          {loadingCongress ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#4a5568' }}>
              Loading...
            </div>
          ) : (
            <>
              {congressStatus && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 20
                }}>
                  <div style={{ 
                    padding: 12,
                    background: '#f8fafc',
                    borderRadius: 8,
                    textAlign: 'center',
                    boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
                  }}>
                    <div style={{ 
                      fontSize: 24, 
                      fontWeight: 700, 
                      color: '#0f172a',
                      fontFamily: "'DM Mono', monospace"
                    }}>
                      {congressStatus.totalTrades}
                    </div>
                    <div style={{ fontSize: 11, color: '#4a5568', marginTop: 4, fontWeight: 500 }}>
                      Total Trades
                    </div>
                  </div>
                  <div style={{ 
                    padding: 12,
                    background: '#f8fafc',
                    borderRadius: 8,
                    textAlign: 'center',
                    boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
                  }}>
                    <div style={{ 
                      fontSize: 24, 
                      fontWeight: 700, 
                      color: congressStatus.unreadAlerts > 0 ? '#ea580c' : '#0f172a',
                      fontFamily: "'DM Mono', monospace"
                    }}>
                      {congressStatus.unreadAlerts}
                    </div>
                    <div style={{ fontSize: 11, color: '#4a5568', marginTop: 4, fontWeight: 500 }}>
                      Unread Alerts
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {congressTrades.slice(0, 3).map((trade) => (
                  <div
                    key={trade.id}
                    style={{
                      padding: 10,
                      background: '#f8fafc',
                      borderRadius: 8,
                      boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: 4
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                        {trade.ticker}
                      </div>
                      <div style={{ 
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: trade.action.toLowerCase().includes('purchase') 
                          ? 'rgba(16,185,129,0.15)' 
                          : 'rgba(239,68,68,0.15)',
                        color: trade.action.toLowerCase().includes('purchase') 
                          ? '#059669' 
                          : '#dc2626',
                        fontWeight: 600
                      }}>
                        {trade.action}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#4a5568' }}>
                      {trade.full_name} ({trade.party})
                    </div>
                    <div style={{ 
                      fontSize: 10, 
                      color: '#64748b',
                      marginTop: 4,
                      fontFamily: "'DM Mono', monospace"
                    }}>
                      {congressTrackerService.formatDate(trade.transaction_date)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sectorial Analysis Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 20
          }}>
            <div>
              <h2 style={{ 
                fontSize: 18, 
                fontWeight: 600, 
                color: '#0f172a',
                marginBottom: 4
              }}>
                📊 Sectorial Analysis
              </h2>
              <p style={{ fontSize: 12, color: '#4a5568', fontWeight: 500 }}>
                11 economic sectors
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '10px 18px',
                background: '#e0e5ec',
                border: 'none',
                borderRadius: 12,
                color: '#667eea',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontWeight: 600,
                boxShadow: '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
              }}
            >
              View All →
            </button>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8
          }}>
            {[
              { icon: '⚡', label: 'Energy', color: '#F59E0B' },
              { icon: '💻', label: 'Tech', color: '#3B82F6' },
              { icon: '🏥', label: 'Health', color: '#10B981' },
              { icon: '🏦', label: 'Finance', color: '#8B5CF6' },
              { icon: '🛒', label: 'Consumer', color: '#EC4899' },
              { icon: '🏢', label: 'Real Estate', color: '#F97316' },
              { icon: '⛏️', label: 'Materials', color: '#78716C' },
              { icon: '📡', label: 'Telecom', color: '#06B6D4' },
              { icon: '🏭', label: 'Industrial', color: '#64748B' }
            ].map((sector) => (
              <div
                key={sector.label}
                style={{
                  padding: 12,
                  background: `${sector.color}15`,
                  borderRadius: 8,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '2px 2px 4px rgba(163, 177, 198, 0.3), -2px -2px 4px rgba(255, 255, 255, 0.5)'
                }}
                onClick={() => navigate('/')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '2px 2px 4px rgba(163, 177, 198, 0.3), -2px -2px 4px rgba(255, 255, 255, 0.5)'
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{sector.icon}</div>
                <div style={{ fontSize: 10, color: sector.color, fontWeight: 600 }}>
                  {sector.label}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
