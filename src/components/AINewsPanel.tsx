import { useState, useEffect, useCallback } from 'react'
import type { Sector } from '../data/sectors'
import { generateNews } from '../services/aiApi'

interface Props {
  sector: Sector
}

export default function AINewsPanel({ sector }: Props) {
  const [news, setNews] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setNews(null)
    
    try {
      const newsData = await generateNews(sector.label)
      setNews(newsData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching news:', error)
      setNews([{
        title: "Erreur de chargement",
        summary: "Impossible de récupérer les actualités.",
        impact: "neutre",
        category: "Système"
      }])
    }
    
    setLoading(false)
  }, [sector.label])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const impactColor: Record<string, string> = { 
    positif: "#10B981", 
    negatif: "#EF4444", 
    neutre: "#94A3B8" 
  }
  const impactBg: Record<string, string> = { 
    positif: "rgba(16,185,129,0.1)", 
    negatif: "rgba(239,68,68,0.1)", 
    neutre: "rgba(148,163,184,0.08)" 
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: "#64748B", textTransform: "uppercase" }}>
            IA · Actualités secteur
          </span>
          {lastUpdate && (
            <div style={{ fontSize: 9, color: "#334155", marginTop: 2 }}>
              Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          style={{ 
            background: "rgba(255,255,255,0.05)", 
            border: "1px solid rgba(255,255,255,0.1)", 
            borderRadius: 6, 
            padding: "4px 12px", 
            color: loading ? "#475569" : "#94A3B8", 
            fontSize: 11, 
            cursor: loading ? "wait" : "pointer", 
            fontFamily: "'DM Mono', monospace" 
          }}
        >
          {loading ? "..." : "↻ Actualiser"}
        </button>
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 72, background: "rgba(255,255,255,0.04)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(news || []).map((item, i) => (
            <div key={i} style={{ background: impactBg[item.impact] || impactBg.neutre, border: `1px solid ${impactColor[item.impact] || impactColor.neutre}22`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9", marginBottom: 4, lineHeight: 1.4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>{item.summary}</div>
                  {item.date && (
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                      📅 {item.date}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: impactColor[item.impact], background: `${impactColor[item.impact]}22`, padding: "2px 8px", borderRadius: 99, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {item.impact}
                  </span>
                  <span style={{ fontSize: 10, color: "#475569", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 99 }}>
                    {item.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
