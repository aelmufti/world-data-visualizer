import { useState, useEffect, useRef } from 'react'
import { SECTORS } from '../data/sectors'

interface NewsArticle {
  id: string
  title: string
  url: string
  publishedAt: string
  sector: string
  relevanceScore: number
  importanceScore: number
  finalScore: number
  sentiment: number
  summary: string
  keyPoints: string[]
  companies: string[]
  events: string[]
}

interface BreakingNewsArticle {
  id: string
  title: string
  url: string
  publishedAt: string
  finalScore: number
  companies: string[]
  events: string[]
}

interface Props {
  sector: string
}

const WS_URL = 'ws://localhost:8000/news-updates'

// Mapping des IDs secteurs français vers anglais
const SECTOR_ID_MAP: Record<string, string> = {
  'energie': 'energy',
  'tech': 'technology',
  'sante': 'healthcare',
  'finance': 'finance',
  'consommation': 'consumer',
  'industrie': 'industrial',
  'materiaux': 'materials',
  'immobilier': 'real_estate',
  'services': 'utilities',
  'transport': 'industrial',
  'automobile': 'consumer',
  'luxe': 'consumer',
  'agriculture': 'materials',
  'telecom': 'telecom',
}

export default function TopNewsPanel({ sector }: Props) {
  const [topNews, setTopNews] = useState<NewsArticle[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connected, setConnected] = useState(false)
  const [notification, setNotification] = useState<BreakingNewsArticle | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get sector label
  const sectorData = SECTORS.find(s => s.id === sector)
  const sectorLabel = sectorData?.label || sector

  useEffect(() => {
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // Subscribe to sector changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const apiSectorId = SECTOR_ID_MAP[sector] || sector
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        sector: apiSectorId
      }))
    }
  }, [sector])

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('📰 Connected to news updates')
        setConnected(true)
        
        // Subscribe to current sector
        const apiSectorId = SECTOR_ID_MAP[sector] || sector
        ws.send(JSON.stringify({
          type: 'subscribe',
          sector: apiSectorId
        }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'top_news') {
            setTopNews(message.data.articles)
            setLastUpdate(new Date(message.data.lastUpdate))
          } else if (message.type === 'breaking_news') {
            // Show notification for breaking news
            const breakingArticle = message.data.articles[0]
            if (breakingArticle) {
              setNotification(breakingArticle)
              showBrowserNotification(breakingArticle)
              
              // Auto-hide notification after 10 seconds
              setTimeout(() => setNotification(null), 10000)
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('📰 Disconnected from news updates')
        setConnected(false)
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('📰 Attempting to reconnect...')
          connectWebSocket()
        }, 5000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
    }
  }

  const showBrowserNotification = (article: BreakingNewsArticle) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Breaking News!', {
        body: article.title,
        icon: '/favicon.ico',
        tag: article.id,
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('🚨 Breaking News!', {
            body: article.title,
            icon: '/favicon.ico',
            tag: article.id,
          })
        }
      })
    }
  }

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return '#10B981'
    if (sentiment < -0.3) return '#EF4444'
    return '#94A3B8'
  }

  const getSentimentBg = (sentiment: number) => {
    if (sentiment > 0.3) return 'rgba(16,185,129,0.1)'
    if (sentiment < -0.3) return 'rgba(239,68,68,0.1)'
    return 'rgba(148,163,184,0.08)'
  }

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.3) return 'positif'
    if (sentiment < -0.3) return 'négatif'
    return 'neutre'
  }

  const getScoreColor = (score: number) => {
    if (score >= 7) return '#10B981'
    if (score >= 5) return '#F59E0B'
    return '#94A3B8'
  }

  const getRankBadge = (index: number) => {
    const badges = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
    return badges[index] || `${index + 1}`
  }

  return (
    <div style={{ 
      background: "#ffffff", 
      borderRadius: "24px",
      padding: 24, 
      marginBottom: 24, 
      boxShadow: "10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "2px solid rgba(163, 177, 198, 0.2)" }}>
        <div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: 1.5, color: "#718096", textTransform: "uppercase", fontWeight: 600 }}>
            🔥 Top 5 · {sectorLabel} · 48h
          </span>
          {lastUpdate && (
            <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 6, fontWeight: 500 }}>
              Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ 
            width: 10, 
            height: 10, 
            borderRadius: '50%', 
            background: connected ? '#48bb78' : '#f56565',
            boxShadow: connected ? '0 0 10px rgba(72, 187, 120, 0.6)' : '0 0 10px rgba(245, 101, 101, 0.6)',
            animation: connected ? 'pulse 2s ease-in-out infinite' : 'none'
          }} />
          <span style={{ fontSize: 11, color: connected ? '#48bb78' : '#f56565', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
            {connected ? 'LIVE' : 'DÉCONNECTÉ'}
          </span>
          {!connected && (
            <button
              onClick={connectWebSocket}
              style={{ 
                background: "#e0e5ec",
                borderRadius: "10px",
                border: "none",
                padding: "6px 12px", 
                color: "#4a5568", 
                fontSize: 11, 
                cursor: "pointer", 
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                boxShadow: "4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)",
                transition: "all 0.3s"
              }}
            >
              Reconnecter
            </button>
          )}
        </div>
      </div>

      {/* Notification Permission */}
      {Notification.permission === 'default' && (
        <div 
          onClick={requestNotificationPermission}
          style={{ 
            background: "rgba(96,165,250,0.1)", 
            border: "1px solid rgba(96,165,250,0.3)", 
            borderRadius: 8, 
            padding: 12, 
            marginBottom: 12, 
            color: "#60A5FA", 
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>🔔</span>
          <span>Cliquez pour activer les notifications de breaking news</span>
        </div>
      )}

      {/* Breaking News Notification */}
      {notification && (
        <div 
          style={{ 
            background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))", 
            border: "2px solid #EF4444", 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 16,
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#EF4444", textTransform: 'uppercase', letterSpacing: 1 }}>
              🚨 Breaking News
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#EF4444', 
                cursor: 'pointer', 
                fontSize: 16,
                padding: 0,
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          <a
            href={notification.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: "#F1F5F9", 
              textDecoration: "none",
              display: 'block',
              marginBottom: 8
            }}
          >
            {notification.title}
          </a>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {notification.companies.map((company) => (
              <span
                key={company}
                style={{ 
                  fontSize: 10, 
                  color: "#60A5FA", 
                  background: "rgba(96,165,250,0.2)", 
                  padding: "2px 8px", 
                  borderRadius: 4,
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 600
                }}
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top News List */}
      {topNews.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748B", fontSize: 13 }}>
          {connected ? 'Chargement des actualités...' : 'Connexion au serveur...'}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {topNews.map((article, index) => {
            const sentimentColor = getSentimentColor(article.sentiment)
            const sentimentBg = getSentimentBg(article.sentiment)
            const scoreColor = getScoreColor(article.finalScore)
            
            return (
              <div 
                key={article.id} 
                style={{ 
                  background: sentimentBg, 
                  border: `1px solid ${sentimentColor}22`, 
                  borderRadius: 8, 
                  padding: "14px 16px",
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Rank Badge */}
                <div style={{ 
                  position: 'absolute', 
                  top: 8, 
                  left: 8, 
                  fontSize: 20,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}>
                  {getRankBadge(index)}
                </div>

                {/* Header avec titre et score */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8, marginLeft: 32 }}>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      flex: 1, 
                      fontSize: 14, 
                      fontWeight: 600, 
                      color: "#F1F5F9", 
                      lineHeight: 1.4, 
                      textDecoration: "none",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#60A5FA"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#F1F5F9"}
                  >
                    {article.title}
                  </a>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                    <span style={{ 
                      fontSize: 10, 
                      color: scoreColor, 
                      background: `${scoreColor}22`, 
                      padding: "3px 8px", 
                      borderRadius: 99, 
                      fontWeight: 700,
                      fontFamily: "'DM Mono', monospace"
                    }}>
                      {article.finalScore.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Résumé */}
                {article.summary && (
                  <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5, marginBottom: 8, marginLeft: 32 }}>
                    {article.summary}
                  </div>
                )}

                {/* Métadonnées */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, fontSize: 10, color: "#64748B", fontFamily: "'DM Mono', monospace", marginLeft: 32 }}>
                  <span>
                    📅 {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span>⚡ {article.importanceScore}/10</span>
                  <span style={{ color: sentimentColor }}>
                    {getSentimentLabel(article.sentiment)}
                  </span>
                </div>

                {/* Entreprises */}
                {article.companies.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginLeft: 32 }}>
                    {article.companies.map((company) => (
                      <span
                        key={company}
                        style={{ 
                          fontSize: 10, 
                          color: "#60A5FA", 
                          background: "rgba(96,165,250,0.1)", 
                          border: "1px solid rgba(96,165,250,0.2)",
                          padding: "2px 8px", 
                          borderRadius: 4,
                          fontFamily: "'DM Mono', monospace",
                          fontWeight: 600
                        }}
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
