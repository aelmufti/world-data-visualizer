import { useState, useEffect } from 'react'
import type { Sector } from '../data/sectors'

interface NewsArticle {
  id: string
  title: string
  url: string
  publishedAt: string
  relevanceScore: string
  importanceScore: number
  finalScore: string
  sentiment: string
  summary: string
  keyPoints: string[]
  companies: string[]
  events: string[]
}

interface Props {
  sector: Sector
}

const API_BASE_URL = 'http://localhost:8000'

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
  'transport': 'industrial', // Pas de secteur transport, on utilise industrial
  'automobile': 'consumer', // Pas de secteur automobile, on utilise consumer
  'luxe': 'consumer', // Pas de secteur luxe, on utilise consumer
  'agriculture': 'materials', // Pas de secteur agriculture, on utilise materials
  'telecom': 'telecom',
}

export default function AINewsPanel({ sector }: Props) {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchNews = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Mapper l'ID du secteur français vers anglais
      const apiSectorId = SECTOR_ID_MAP[sector.id] || sector.id
      
      const response = await fetch(
        `${API_BASE_URL}/api/aggregated/sector/${apiSectorId}?limit=15`
      )
      
      if (!response.ok) {
        throw new Error('Error fetching news')
      }
      
      const data = await response.json()
      setNews(data.articles || [])
      setLastUpdate(new Date())
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching news:', err)
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [sector.id])

  const getSentimentColor = (sentiment: string) => {
    const score = parseFloat(sentiment)
    if (score > 0.3) return '#10B981'
    if (score < -0.3) return '#EF4444'
    return '#94A3B8'
  }

  const getSentimentBg = (sentiment: string) => {
    const score = parseFloat(sentiment)
    if (score > 0.3) return 'rgba(16,185,129,0.1)'
    if (score < -0.3) return 'rgba(239,68,68,0.1)'
    return 'rgba(148,163,184,0.08)'
  }

  const getSentimentLabel = (sentiment: string) => {
    const score = parseFloat(sentiment)
    if (score > 0.3) return 'positif'
    if (score < -0.3) return 'négatif'
    return 'neutre'
  }

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score)
    if (numScore >= 7) return '#10B981'
    if (numScore >= 5) return '#F59E0B'
    return '#94A3B8'
  }

  return (
    <div style={{ 
      background: "#ffffff", 
      borderRadius: "24px",
      padding: 24, 
      marginBottom: 24, 
      boxShadow: "10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "2px solid rgba(163, 177, 198, 0.2)" }}>
        <div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: 1.5, color: "#718096", textTransform: "uppercase", fontWeight: 600 }}>
            📰 News · {sector.label}
          </span>
          {lastUpdate && (
            <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 6, fontWeight: 500 }}>
              Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          style={{ 
            background: "#e0e5ec",
            borderRadius: "10px",
            border: "none",
            padding: "8px 14px", 
            color: "#4a5568", 
            fontSize: 11, 
            cursor: loading ? "wait" : "pointer", 
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            boxShadow: "4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)",
            transition: "all 0.3s"
          }}
        >
          {loading ? "..." : "↻ Actualiser"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 12, marginBottom: 12, color: "#EF4444", fontSize: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 100, background: "rgba(255,255,255,0.04)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748B", fontSize: 13 }}>
          No relevant news for this sector
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {news.map((article) => {
            const sentimentColor = getSentimentColor(article.sentiment)
            const sentimentBg = getSentimentBg(article.sentiment)
            const scoreColor = getScoreColor(article.finalScore)
            
            return (
              <div key={article.id} style={{ background: sentimentBg, border: `1px solid ${sentimentColor}22`, borderRadius: 8, padding: "14px 16px" }}>
                {/* Header avec titre et score */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      flex: 1, 
                      fontSize: 14, 
                      fontWeight: 600, 
                      color: "#0f172a", 
                      lineHeight: 1.4, 
                      textDecoration: "none",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#3B82F6"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#0f172a"}
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
                      {article.finalScore}
                    </span>
                  </div>
                </div>

                {/* Résumé */}
                {article.summary && (
                  <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5, marginBottom: 8 }}>
                    {article.summary}
                  </div>
                )}

                {/* Métadonnées */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, fontSize: 10, color: "#64748B", fontFamily: "'DM Mono', monospace" }}>
                  <span>
                    📅 {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span>📊 {article.relevanceScore}/10</span>
                  <span>⚡ {article.importanceScore}/10</span>
                  <span style={{ color: sentimentColor }}>
                    {getSentimentLabel(article.sentiment)}
                  </span>
                </div>

                {/* Entreprises */}
                {article.companies.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
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

                {/* Événements */}
                {article.events.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {article.events.map((event) => (
                      <span
                        key={event}
                        style={{ 
                          fontSize: 10, 
                          color: "#A78BFA", 
                          background: "rgba(167,139,250,0.1)", 
                          border: "1px solid rgba(167,139,250,0.2)",
                          padding: "2px 8px", 
                          borderRadius: 4
                        }}
                      >
                        {event.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Points clés */}
                {article.keyPoints.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>
                      Points clés:
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>
                      {article.keyPoints.slice(0, 3).map((point, idx) => (
                        <div key={idx}>• {point}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
