import { useState, useEffect } from 'react'
import { politicianTradingService, type PoliticianTrade } from '../services/politicianTradingService'

const tickerColors: Record<string, string> = {
  GOOGL: "#4285F4",
  AMZN: "#FF9900",
  NVDA: "#76B900",
  AAPL: "#A2AAAD",
  MSFT: "#00A4EF",
  TSLA: "#E82127",
  META: "#0668E1",
  PYPL: "#003087",
  DIS: "#1565C0",
}

const formatAmount = (amount: string) => {
  const match = amount.match(/\$([0-9,]+)\s*-\s*\$([0-9,]+)/)
  if (match) {
    const min = parseInt(match[1].replace(/,/g, ''))
    const max = parseInt(match[2].replace(/,/g, ''))
    
    const fmt = (n: number) => {
      if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
      if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
      return `$${n}`
    }
    
    return `${fmt(min)} – ${fmt(max)}`
  }
  return amount
}

export default function PoliticianTradingTab() {
  const [recentTrades, setRecentTrades] = useState<PoliticianTrade[]>([])
  const [featuredPoliticians, setFeaturedPoliticians] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dataWarning, setDataWarning] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState('All')
  const [filterTicker, setFilterTicker] = useState('All')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(true)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [showFeaturedOnly])

  const loadData = async () => {
    setLoading(true)
    try {
      if (showFeaturedOnly) {
        const { trades, politicians } = await politicianTradingService.getFeaturedTrades()
        setRecentTrades(trades)
        setFeaturedPoliticians(politicians)
        
        if (trades.length > 0) {
          const latestDate = new Date(trades[0].transaction_date)
          if (latestDate.getFullYear() < 2024) {
            setDataWarning('⚠️ Outdated data (2020). Configure APIFY_API_KEY for 2024-2025 data.')
          } else {
            setDataWarning(null)
          }
        }
      } else {
        const recent = await politicianTradingService.getRecentTrades(100)
        setRecentTrades(recent)
        setFeaturedPoliticians([])
        
        if (recent.length > 0) {
          const latestDate = new Date(recent[0].transaction_date)
          if (latestDate.getFullYear() < 2024) {
            setDataWarning('⚠️ Outdated data (2020). Configure APIFY_API_KEY for 2024-2025 data.')
          } else {
            setDataWarning(null)
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setDataWarning('❌ Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  const tickers = ['All', ...new Set(recentTrades.map(t => t.ticker).filter(Boolean))]
  
  const filtered = recentTrades.filter(trade => {
    const actionMatch = filterAction === 'All' || 
      (filterAction === 'Buy' && trade.type.toLowerCase().includes('purchase')) ||
      (filterAction === 'Sell' && trade.type.toLowerCase().includes('sale'))
    const tickerMatch = filterTicker === 'All' || trade.ticker === filterTicker
    return actionMatch && tickerMatch
  })

  const totalBuys = recentTrades.filter(t => t.type.toLowerCase().includes('purchase')).length
  const totalSells = recentTrades.filter(t => t.type.toLowerCase().includes('sale')).length

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      background: '#080c10',
      minHeight: 'calc(100vh - 64px)',
      color: '#e2e8f0',
      padding: 0,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid #1e2a38',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                color: '#fff',
                fontFamily: 'Georgia, serif',
              }}>
                🏛️
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
                  Congressional Trading
                </div>
                <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  U.S. House & Senate · Stock Disclosures
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Total', value: recentTrades.length },
              { label: 'Buys', value: totalBuys, color: '#22c55e' },
              { label: 'Sells', value: totalSells, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#0d1117',
                border: '1px solid #1e2a38',
                borderRadius: 6,
                padding: '10px 20px',
                textAlign: 'center',
                minWidth: 90,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color || '#f1f5f9', fontFamily: 'Georgia, serif' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Warning */}
        {dataWarning && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#0d2137',
            border: '1px solid #f59e0b',
            borderRadius: 4,
            padding: '8px 14px',
            marginBottom: 24,
            fontSize: 11,
            color: '#f59e0b',
            letterSpacing: '0.05em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            {dataWarning}
            <a href="https://apify.com" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', marginLeft: 8, textDecoration: 'underline' }}>
              Get free API →
            </a>
          </div>
        )}

        {/* Featured Politicians Section */}
        {showFeaturedOnly && featuredPoliticians.length > 0 && (
          <div style={{
            background: '#0d1117',
            border: '1px solid #1e2a38',
            borderRadius: 8,
            padding: 20,
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 16, letterSpacing: '0.05em' }}>
              🏆 TOP PERFORMERS BY RETURN RATE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {featuredPoliticians.map(pol => (
                <div key={pol.name} style={{
                  background: '#080c10',
                  border: '1px solid #1e2a38',
                  borderRadius: 6,
                  padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
                    {pol.fullName}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, letterSpacing: '0.05em' }}>
                    {pol.party === 'D' ? '🔵 Democrat' : '🔴 Republican'} · {pol.state}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e', fontFamily: 'Georgia, serif' }}>
                    {pol.returnRate}
                  </div>
                  <div style={{ fontSize: 9, color: '#475569', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Return Rate
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
          <button
            onClick={() => setShowFeaturedOnly(true)}
            style={{
              background: showFeaturedOnly ? '#1d4ed8' : '#0d1117',
              border: `1px solid ${showFeaturedOnly ? '#3b82f6' : '#1e2a38'}`,
              color: showFeaturedOnly ? '#fff' : '#64748b',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '6px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            🏆 Top Performers
          </button>
          <button
            onClick={() => setShowFeaturedOnly(false)}
            style={{
              background: !showFeaturedOnly ? '#1d4ed8' : '#0d1117',
              border: `1px solid ${!showFeaturedOnly ? '#3b82f6' : '#1e2a38'}`,
              color: !showFeaturedOnly ? '#fff' : '#64748b',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '6px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            📊 All Trades
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['All', 'Buy', 'Sell'].map(f => (
            <button
              key={f}
              onClick={() => setFilterAction(f)}
              style={{
                background: filterAction === f ? '#1d4ed8' : '#0d1117',
                border: `1px solid ${filterAction === f ? '#3b82f6' : '#1e2a38'}`,
                color: filterAction === f ? '#fff' : '#64748b',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '5px 14px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
          
          <div style={{ width: 1, background: '#1e2a38', margin: '0 4px' }} />
          
          {tickers.slice(0, 10).map(t => (
            <button
              key={t}
              onClick={() => setFilterTicker(t)}
              style={{
                background: filterTicker === t ? (tickerColors[t] || '#334155') + '33' : '#0d1117',
                border: `1px solid ${filterTicker === t ? (tickerColors[t] || '#60a5fa') : '#1e2a38'}`,
                color: filterTicker === t ? (tickerColors[t] || '#60a5fa') : '#64748b',
                fontSize: 11,
                letterSpacing: '0.08em',
                padding: '5px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: filterTicker === t ? 600 : 400,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div>Loading congressional trades...</div>
          </div>
        ) : (
          /* Table */
          <div style={{
            background: '#0d1117',
            border: '1px solid #1e2a38',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#080c10', borderBottom: '1px solid #1e2a38' }}>
                  {['Ticker', 'Politician', ...(showFeaturedOnly ? ['Return'] : []), 'Asset', 'Action', 'Date', 'Amount'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#334155',
                      fontWeight: 500,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((trade, i) => (
                  <tr
                    key={i}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderBottom: '1px solid #111820',
                      background: hoveredRow === i ? '#0f1923' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      {trade.ticker ? (
                        <span style={{
                          background: (tickerColors[trade.ticker] || '#334155') + '22',
                          color: tickerColors[trade.ticker] || '#94a3b8',
                          border: `1px solid ${(tickerColors[trade.ticker] || '#334155')}55`,
                          padding: '2px 8px',
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                        }}>
                          {trade.ticker}
                        </span>
                      ) : (
                        <span style={{ color: '#334155', fontSize: 11 }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#60a5fa', fontSize: 11, fontWeight: 500 }}>
                      {trade.representative}
                    </td>
                    {showFeaturedOnly && (trade as any).returnRate && (
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: '#22c55e22',
                          color: '#22c55e',
                          border: '1px solid #22c55e55',
                          padding: '2px 8px',
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                        }}>
                          {(trade as any).returnRate}
                        </span>
                      </td>
                    )}
                    <td style={{ padding: '12px 16px', color: '#94a3b8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trade.asset_description || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        color: trade.type.toLowerCase().includes('purchase') ? '#22c55e' : 
                               trade.type.toLowerCase().includes('exchange') ? '#f59e0b' : '#ef4444',
                        fontWeight: 600,
                        fontSize: 11,
                        letterSpacing: '0.05em',
                      }}>
                        {trade.type.toLowerCase().includes('purchase') ? '▲ BUY' : 
                         trade.type.toLowerCase().includes('exchange') ? '↔ EXCH' : '▼ SELL'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: 11 }}>
                      {politicianTradingService.formatDate(trade.transaction_date)}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {formatAmount(trade.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid #111820',
              fontSize: 10,
              color: '#1e3a5f',
              letterSpacing: '0.05em',
            }}>
              {filtered.length} TRANSACTIONS · DATA: U.S. CONGRESS FINANCIAL DISCLOSURES
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
