import { useEffect, useState } from 'react'
import { MarketStatusIndicatorProps } from '../../types/stock-market'

export default function MarketStatusIndicator({ market, status, nextEvent }: MarketStatusIndicatorProps) {
  const [countdown, setCountdown] = useState<string>('')

  // Update countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const eventTime = new Date(nextEvent.time)
      const diff = eventTime.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown('Maintenant')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 24) {
        const days = Math.floor(hours / 24)
        setCountdown(`${days}j ${hours % 24}h`)
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`)
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`)
      } else {
        setCountdown(`${seconds}s`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [nextEvent.time])

  // Determine status color and label
  const getStatusColor = () => {
    if (status.isOpen && status.session === 'regular') {
      return { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#10B981', label: 'Ouvert' }
    } else if (status.session === 'pre-market' || status.session === 'after-hours') {
      return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#F59E0B', label: status.session === 'pre-market' ? 'Pré-marché' : 'Après-marché' }
    } else {
      return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#EF4444', label: 'Fermé' }
    }
  }

  const statusStyle = getStatusColor()

  // Get market display name
  const getMarketName = () => {
    switch (market) {
      case 'US': return 'États-Unis'
      case 'EU': return 'Europe'
      case 'ASIA': return 'Asie'
      default: return market
    }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }}>
      {/* Market Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#F1F5F9'
        }}>
          {getMarketName()}
        </div>
      </div>

      {/* Status Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: statusStyle.bg,
          border: `1px solid ${statusStyle.border}`,
          borderRadius: 6
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusStyle.text,
            animation: status.isOpen ? 'pulse 2s ease-in-out infinite' : 'none'
          }} />
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: statusStyle.text,
            fontFamily: "'DM Mono', monospace"
          }}>
            {statusStyle.label}
          </span>
        </div>

        {/* Next Event Countdown */}
        <div style={{
          fontSize: 11,
          color: '#64748B',
          fontFamily: "'DM Mono', monospace"
        }}>
          {nextEvent.type === 'open' ? 'Ouverture' : 'Fermeture'} dans {countdown}
        </div>
      </div>
    </div>
  )
}
