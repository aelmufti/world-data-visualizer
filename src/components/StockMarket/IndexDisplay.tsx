import { useEffect, useState } from 'react'
import { IndexDisplayProps, MarketIndex } from '../../types/stock-market'
import { getStockWebSocketClient } from '../../services/stockWebSocket'

export default function IndexDisplay({ indexes, loading, onIndexClick }: IndexDisplayProps) {
  const [liveIndexes, setLiveIndexes] = useState<MarketIndex[]>(indexes)

  useEffect(() => {
    setLiveIndexes(indexes)
  }, [indexes])

  // Subscribe to WebSocket updates for indexes
  useEffect(() => {
    if (indexes.length === 0) return

    const symbols = indexes.map(idx => idx.symbol)
    const wsClient = getStockWebSocketClient()
    
    // Subscribe to updates
    wsClient.subscribe(symbols)

    // Listen for quote updates
    const unsubscribe = wsClient.onMessage((quote) => {
      setLiveIndexes(prev => 
        prev.map(idx => 
          idx.symbol === quote.symbol
            ? {
                ...idx,
                value: quote.price,
                change: quote.change,
                changePercent: quote.changePercent,
                lastUpdate: quote.timestamp
              }
            : idx
        )
      )
    })

    return () => {
      wsClient.unsubscribe(symbols)
      unsubscribe()
    }
  }, [indexes])

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        animation: 'fadeIn 0.4s ease'
      }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '16px 18px',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            <div style={{ height: 60 }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 16,
      animation: 'fadeIn 0.4s ease'
    }}>
      <style>{`
        @media (max-width: 768px) {
          .index-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .index-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
      
      {liveIndexes.map((index) => {
        const isPositive = index.change > 0
        const isNegative = index.change < 0
        const color = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#64748B'
        const bgColor = isPositive ? 'rgba(16,185,129,0.1)' : isNegative ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)'
        const borderColor = isPositive ? 'rgba(16,185,129,0.2)' : isNegative ? 'rgba(239,68,68,0.2)' : 'rgba(100,116,139,0.2)'

        return (
          <div
            key={index.symbol}
            onClick={() => onIndexClick(index.symbol)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '16px 18px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {/* Index Name */}
            <div style={{
              fontSize: 12,
              color: '#64748B',
              marginBottom: 8,
              fontWeight: 500
            }}>
              {index.name}
            </div>

            {/* Index Value */}
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#F1F5F9',
              fontFamily: "'DM Mono', monospace",
              marginBottom: 8
            }}>
              {index.value.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>

            {/* Change Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                color: color
              }}>
                <span>{isPositive ? '▲' : isNegative ? '▼' : '●'}</span>
                <span>
                  {isPositive ? '+' : ''}{index.change.toFixed(2)}
                </span>
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: color
              }}>
                {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
              </div>
            </div>

            {/* Last Update Time */}
            <div style={{
              fontSize: 10,
              color: '#475569',
              marginTop: 8,
              fontFamily: "'DM Mono', monospace"
            }}>
              {new Date(index.lastUpdate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
