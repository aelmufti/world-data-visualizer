import { useState } from 'react'

interface CompanyInfo {
  company: {
    id: string
    ticker: string
    name: string
    sector: string
  }
  stats: {
    totalMentions: number
    mentions24h: number
    avgSentiment: number
    recentEvents: Array<{ event_type: string; count: number }>
    latestArticle: {
      title: string
      published_at: string
      url: string
    } | null
  }
}

interface NewsArticle {
  id: string
  title: string
  url: string
  published_at: string
  source_domain: string
  raw_sentiment: number
  mention_count: number
  entity_sentiment: number
  is_primary_subject: boolean
  event_tags: string[]
}

const API_BASE_URL = 'http://localhost:8000'

export default function CompanyInfoPanel() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchCompany = async (ticker: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Get company info
      const infoResponse = await fetch(`${API_BASE_URL}/api/companies/${ticker}`)
      
      if (!infoResponse.ok) {
        throw new Error('Company not found')
      }
      
      const infoData = await infoResponse.json()
      setCompanyInfo(infoData)

      // Get company news
      const newsResponse = await fetch(`${API_BASE_URL}/api/companies/${ticker}/news?limit=20`)
      const newsData = await newsResponse.json()
      setNews(newsData.articles || [])
    } catch (err: any) {
      setError(err.message)
      setCompanyInfo(null)
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchCompany(searchQuery.trim().toUpperCase())
    }
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return '#10B981'
    if (sentiment < -0.3) return '#EF4444'
    return '#94A3B8'
  }

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.3) return 'Positif'
    if (sentiment < -0.3) return 'Négatif'
    return 'Neutre'
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: "#64748B", textTransform: "uppercase", marginBottom: 12 }}>
          🔍 Recherche d'Entreprise
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ticker (ex: AAPL, TSLA, MSFT)"
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#E2E8F0",
              fontSize: 14,
              fontFamily: "'DM Mono', monospace"
            }}
          />
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            style={{
              background: loading ? "#475569" : "#3B82F6",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer"
            }}
          >
            {loading ? "..." : "Rechercher"}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 12, marginBottom: 12, color: "#EF4444", fontSize: 12 }}>
          {error}
        </div>
      )}

      {companyInfo && (
        <>
          {/* Company Header */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>
                  {companyInfo.company.ticker}
                </div>
                <div style={{ fontSize: 14, color: "#94A3B8" }}>
                  {companyInfo.company.name}
                </div>
                {companyInfo.company.sector && (
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                    Secteur: {companyInfo.company.sector}
                  </div>
                )}
              </div>
              <div style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: getSentimentColor(companyInfo.stats.avgSentiment) + '22',
                border: `1px solid ${getSentimentColor(companyInfo.stats.avgSentiment)}44`,
                color: getSentimentColor(companyInfo.stats.avgSentiment),
                fontSize: 12,
                fontWeight: 600
              }}>
                {getSentimentLabel(companyInfo.stats.avgSentiment)}
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4 }}>Mentions (24h)</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#60A5FA" }}>
                  {companyInfo.stats.mentions24h}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4 }}>Total Mentions</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#94A3B8" }}>
                  {companyInfo.stats.totalMentions}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4 }}>Sentiment Moyen</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: getSentimentColor(companyInfo.stats.avgSentiment) }}>
                  {companyInfo.stats.avgSentiment.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Recent Events */}
            {companyInfo.stats.recentEvents.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 10, color: "#64748B", marginBottom: 6 }}>Événements Récents</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {companyInfo.stats.recentEvents.slice(0, 5).map((event) => (
                    <span
                      key={event.event_type}
                      style={{
                        fontSize: 10,
                        color: "#A78BFA",
                        background: "rgba(167,139,250,0.1)",
                        border: "1px solid rgba(167,139,250,0.2)",
                        padding: "2px 8px",
                        borderRadius: 4
                      }}
                    >
                      {event.event_type.replace(/_/g, ' ')} ({event.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* News Articles */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#CBD5E1", marginBottom: 12 }}>
              Actualités Récentes ({news.length})
            </div>
            {news.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: "#64748B", fontSize: 12 }}>
                Aucune actualité trouvée
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {news.map((article) => (
                  <div
                    key={article.id}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8,
                      padding: 12
                    }}
                  >
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#F1F5F9",
                        textDecoration: "none",
                        display: 'block',
                        marginBottom: 6
                      }}
                    >
                      {article.title}
                    </a>
                    <div style={{ display: 'flex', gap: 8, fontSize: 10, color: "#64748B", fontFamily: "'DM Mono', monospace" }}>
                      <span>📅 {new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      <span>📰 {article.source_domain}</span>
                      <span style={{ color: getSentimentColor(article.entity_sentiment) }}>
                        {getSentimentLabel(article.entity_sentiment)}
                      </span>
                      {article.is_primary_subject && (
                        <span style={{ color: "#F59E0B" }}>⭐ Sujet principal</span>
                      )}
                    </div>
                    {article.event_tags && article.event_tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {article.event_tags.map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 9,
                              color: "#A78BFA",
                              background: "rgba(167,139,250,0.1)",
                              padding: "1px 6px",
                              borderRadius: 3
                            }}
                          >
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!companyInfo && !loading && !error && (
        <div style={{ textAlign: 'center', padding: 40, color: "#64748B", fontSize: 13 }}>
          Recherchez une entreprise par son ticker pour voir ses actualités et statistiques
        </div>
      )}
    </div>
  )
}
