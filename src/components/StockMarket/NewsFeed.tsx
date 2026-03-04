import { useState, useEffect, useRef, useCallback } from 'react'

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

interface NewsFeedProps {
  symbol?: string // Optional: filter news for specific stock
  sector?: string // Optional: sector to fetch news from (default: 'technology')
}

const API_BASE_URL = 'http://localhost:8000'

export default function NewsFeed({ symbol, sector = 'technology' }: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [displayedArticles, setDisplayedArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [hasMore, setHasMore] = useState(true)
  
  const observerTarget = useRef<HTMLDivElement>(null)
  const displayCount = useRef(20)

  // Fetch news from API
  const fetchNews = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/aggregated/sector/${sector}?limit=100`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }
      
      const data = await response.json()
      const fetchedArticles = data.articles || []
      
      // Filter by symbol if provided
      const filteredArticles = symbol
        ? fetchedArticles.filter((article: NewsArticle) => {
            const searchText = `${article.title} ${article.summary} ${article.companies.join(' ')}`.toLowerCase()
            return searchText.includes(symbol.toLowerCase())
          })
        : fetchedArticles
      
      setArticles(filteredArticles)
      setDisplayedArticles(filteredArticles.slice(0, 20))
      displayCount.current = 20
      setHasMore(filteredArticles.length > 20)
      setLastUpdate(new Date())
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching news:', err)
      setArticles([])
      setDisplayedArticles([])
    } finally {
      setLoading(false)
    }
  }

  // Load more articles for infinite scroll
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    
    setTimeout(() => {
      const nextCount = displayCount.current + 20
      const nextArticles = articles.slice(0, nextCount)
      
      setDisplayedArticles(nextArticles)
      displayCount.current = nextCount
      setHasMore(nextCount < articles.length)
      setLoadingMore(false)
    }, 300)
  }, [articles, loadingMore, hasMore])

  // Initial fetch
  useEffect(() => {
    fetchNews()
  }, [sector, symbol])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [sector, symbol])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loadingMore, loadMore])

  // Sentiment helpers
  const getSentimentColor = (sentiment: string) => {
    const score = parseFloat(sentiment)
    if (score > 0.3) return '#10B981'
    if (score < -0.3) return '#EF4444'
    return '#94A3B8'
  }

  const getSentimentBg = (sentiment: string) => {
    const score = parseFloat(sentiment)
    if (score > 0.3) return 'rgba(16,185,129,0.08)'
    if (score < -0.3) return 'rgba(239,68,68,0.08)'
    return 'rgba(148,163,184,0.05)'
  }

  const getSentimentLabel = (sentiment: string) => {
    const score = parseFloat(sentiment)
    if (score > 0.3) return 'Positive'
    if (score < -0.3) return 'Negative'
    return 'Neutral'
  }

  const getSentimentIcon = (sentiment: string) => {
    const score = parseFloat(sentiment)
    if (score > 0.3) return '📈'
    if (score < -0.3) return '📉'
    return '➖'
  }

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: 20,
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: 2,
            color: '#64748B',
            textTransform: 'uppercase'
          }}>
            📰 Market News {symbol && `· ${symbol}`}
          </div>
          {lastUpdate && (
            <div style={{
              fontSize: 9,
              color: '#475569',
              marginTop: 4,
              fontFamily: "'DM Mono', monospace"
            }}>
              Updated: {lastUpdate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '6px 12px',
            color: loading ? '#475569' : '#94A3B8',
            fontSize: 11,
            cursor: loading ? 'wait' : 'pointer',
            fontFamily: "'DM Mono', monospace",
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          {loading ? '...' : '↻ Refresh'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          color: '#EF4444',
          fontSize: 12
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          flex: 1,
          overflow: 'auto'
        }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: 120,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                animation: 'pulse 2s ease-in-out infinite'
              }}
            />
          ))}
        </div>
      ) : displayedArticles.length === 0 ? (
        /* Empty State */
        <div style={{
          textAlign: 'center',
          padding: 60,
          color: '#64748B',
          fontSize: 13,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📰</div>
          <div>No news articles available</div>
          {symbol && (
            <div style={{ fontSize: 11, marginTop: 8, color: '#475569' }}>
              No articles found mentioning {symbol}
            </div>
          )}
        </div>
      ) : (
        /* Articles List */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          flex: 1,
          overflow: 'auto',
          paddingRight: 4
        }}>
          {displayedArticles.map((article) => {
            const sentimentColor = getSentimentColor(article.sentiment)
            const sentimentBg = getSentimentBg(article.sentiment)
            const sentimentLabel = getSentimentLabel(article.sentiment)
            const sentimentIcon = getSentimentIcon(article.sentiment)

            return (
              <div
                key={article.id}
                style={{
                  background: sentimentBg,
                  border: `1px solid ${sentimentColor}22`,
                  borderRadius: 8,
                  padding: '14px 16px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = sentimentBg
                  e.currentTarget.style.borderColor = `${sentimentColor}22`
                }}
              >
                {/* Article Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 8
                }}>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#F1F5F9',
                      lineHeight: 1.4,
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#60A5FA'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#F1F5F9'}
                  >
                    {article.title}
                  </a>
                </div>

                {/* Metadata Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 8,
                  fontSize: 11,
                  fontFamily: "'DM Mono', monospace"
                }}>
                  {/* Source */}
                  <div style={{ color: '#64748B' }}>
                    {article.companies[0] || 'Market News'}
                  </div>
                  
                  {/* Timestamp */}
                  <div style={{ color: '#475569' }}>
                    {getRelativeTime(article.publishedAt)}
                  </div>

                  {/* Sentiment Indicator */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    background: `${sentimentColor}22`,
                    border: `1px solid ${sentimentColor}33`,
                    borderRadius: 4,
                    color: sentimentColor,
                    fontSize: 10,
                    fontWeight: 600
                  }}>
                    <span>{sentimentIcon}</span>
                    <span>{sentimentLabel}</span>
                  </div>
                </div>

                {/* Summary */}
                {article.summary && (
                  <div style={{
                    fontSize: 12,
                    color: '#94A3B8',
                    lineHeight: 1.5,
                    marginBottom: 8
                  }}>
                    {article.summary}
                  </div>
                )}

                {/* Companies Tags */}
                {article.companies.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 8
                  }}>
                    {article.companies.slice(0, 5).map((company) => (
                      <span
                        key={company}
                        style={{
                          fontSize: 10,
                          color: '#60A5FA',
                          background: 'rgba(96,165,250,0.1)',
                          border: '1px solid rgba(96,165,250,0.2)',
                          padding: '2px 8px',
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

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <div
              ref={observerTarget}
              style={{
                padding: 20,
                textAlign: 'center',
                color: '#64748B',
                fontSize: 12
              }}
            >
              {loadingMore ? (
                <div style={{
                  display: 'inline-block',
                  width: 20,
                  height: 20,
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTopColor: '#60A5FA',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}>
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              ) : (
                'Loading more...'
              )}
            </div>
          )}

          {/* End of Feed */}
          {!hasMore && displayedArticles.length > 0 && (
            <div style={{
              padding: 20,
              textAlign: 'center',
              color: '#475569',
              fontSize: 11,
              fontFamily: "'DM Mono', monospace"
            }}>
              End of news feed
            </div>
          )}
        </div>
      )}

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
