import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { stockDataService } from '../services/stockDataService'
import { politicianTradingService } from '../services/politicianTradingService'
import { congressTrackerService } from '../services/congressTrackerService'
import FearGreedPanel from './FearGreedPanel'
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
      background: '#060B14', 
      color: '#E2E8F0',
      padding: '32px',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontSize: 32, 
          fontWeight: 700, 
          color: '#F1F5F9',
          marginBottom: 8
        }}>
          📊 Overview
        </h1>
        <p style={{ fontSize: 14, color: '#64748B' }}>
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
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: 24
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
                color: '#F1F5F9',
                marginBottom: 4
              }}>
                📈 Market Indices
              </h2>
              <p style={{ fontSize: 12, color: '#64748B' }}>
                Live market performance
              </p>
            </div>
            <button
              onClick={() => navigate('/stock-market')}
              style={{
                padding: '8px 16px',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 6,
                color: '#60A5FA',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
              }}
            >
              View All →
            </button>
          </div>

          {loadingMarket ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>
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
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>
                      {index.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      {index.symbol}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: 700, 
                      color: '#F1F5F9',
                      fontFamily: "'DM Mono', monospace"
                    }}>
                      {index.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: index.change >= 0 ? '#10B981' : '#EF4444',
                      marginTop: 2
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

        {/* Politician Trading Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: 24
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
                color: '#F1F5F9',
                marginBottom: 4
              }}>
                💼 Politician Trading
              </h2>
              <p style={{ fontSize: 12, color: '#64748B' }}>
                Recent congressional trades
              </p>
            </div>
            <button
              onClick={() => navigate('/politician-trading')}
              style={{
                padding: '8px 16px',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 6,
                color: '#60A5FA',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
              }}
            >
              View All →
            </button>
          </div>

          {loadingTrades ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>
              Loading...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentTrades.slice(0, 5).map((trade, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 10,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: 4
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>
                      {trade.ticker || 'N/A'}
                    </div>
                    <div style={{ 
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: trade.type === 'purchase' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: trade.type === 'purchase' ? '#10B981' : '#EF4444'
                    }}>
                      {trade.type}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    {trade.representative}
                  </div>
                  <div style={{ 
                    fontSize: 10, 
                    color: '#475569',
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
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: 24
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
                color: '#F1F5F9',
                marginBottom: 4
              }}>
                🗳️ Congress Tracker
              </h2>
              <p style={{ fontSize: 12, color: '#64748B' }}>
                Automated filing monitor
              </p>
            </div>
            <button
              onClick={() => navigate('/congress-tracker')}
              style={{
                padding: '8px 16px',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 6,
                color: '#60A5FA',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
              }}
            >
              View All →
            </button>
          </div>

          {loadingCongress ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>
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
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: 24, 
                      fontWeight: 700, 
                      color: '#F1F5F9',
                      fontFamily: "'DM Mono', monospace"
                    }}>
                      {congressStatus.totalTrades}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                      Total Trades
                    </div>
                  </div>
                  <div style={{ 
                    padding: 12,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: 24, 
                      fontWeight: 700, 
                      color: congressStatus.unreadAlerts > 0 ? '#F59E0B' : '#F1F5F9',
                      fontFamily: "'DM Mono', monospace"
                    }}>
                      {congressStatus.unreadAlerts}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
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
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: 4
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>
                        {trade.ticker}
                      </div>
                      <div style={{ 
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: trade.action.toLowerCase().includes('purchase') 
                          ? 'rgba(16,185,129,0.1)' 
                          : 'rgba(239,68,68,0.1)',
                        color: trade.action.toLowerCase().includes('purchase') 
                          ? '#10B981' 
                          : '#EF4444'
                      }}>
                        {trade.action}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      {trade.full_name} ({trade.party})
                    </div>
                    <div style={{ 
                      fontSize: 10, 
                      color: '#475569',
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
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: 24
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
                color: '#F1F5F9',
                marginBottom: 4
              }}>
                📊 Sectorial Analysis
              </h2>
              <p style={{ fontSize: 12, color: '#64748B' }}>
                11 economic sectors
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '8px 16px',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 6,
                color: '#60A5FA',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
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
                  border: `1px solid ${sector.color}30`,
                  borderRadius: 8,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => navigate('/')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${sector.color}25`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${sector.color}15`
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{sector.icon}</div>
                <div style={{ fontSize: 10, color: sector.color, fontWeight: 500 }}>
                  {sector.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: 24
        }}>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: '#F1F5F9',
            marginBottom: 20
          }}>
            ⚙️ System Status
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: 10,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 6
            }}>
              <span style={{ fontSize: 13, color: '#94A3B8' }}>Market Data</span>
              <span style={{ 
                fontSize: 12, 
                color: loadingMarket ? '#F59E0B' : '#10B981',
                fontWeight: 600
              }}>
                {loadingMarket ? '● Loading' : '● Active'}
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: 10,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 6
            }}>
              <span style={{ fontSize: 13, color: '#94A3B8' }}>Congress Tracker</span>
              <span style={{ 
                fontSize: 12, 
                color: congressStatus?.isPolling ? '#10B981' : '#64748B',
                fontWeight: 600
              }}>
                {congressStatus?.isPolling ? '● Active' : '● Stopped'}
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: 10,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 6
            }}>
              <span style={{ fontSize: 13, color: '#94A3B8' }}>News Aggregation</span>
              <span style={{ 
                fontSize: 12, 
                color: '#10B981',
                fontWeight: 600
              }}>
                ● Active
              </span>
            </div>
          </div>

          <div style={{ 
            marginTop: 20,
            padding: 12,
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 8
          }}>
            <div style={{ fontSize: 11, color: '#60A5FA', marginBottom: 4 }}>
              Last Updated
            </div>
            <div style={{ 
              fontSize: 13, 
              color: '#F1F5F9',
              fontFamily: "'DM Mono', monospace"
            }}>
              {new Date().toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
