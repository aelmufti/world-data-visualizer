import { useState, useEffect, useCallback } from 'react'
import type { Sector } from '../data/sectors'

interface Props {
  sector: Sector
}

export default function AINewsPanel({ sector }: Props) {
  const [news, setNews] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setNews(null)
    try {
      const prompt = `Tu es un analyste financier senior. Pour le secteur "${sector.label}", génère 4 actualités fictives mais réalistes du jour en JSON strict.
Format OBLIGATOIRE (JSON uniquement, aucun texte autour) :
{"news":[{"title":"...","summary":"...","impact":"positif"|"negatif"|"neutre","category":"..."},...]}
Les catégories possibles: Géopolitique, Réglementation, Résultats, Macro, M&A, Technologie`

      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new Error('API key missing')
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      })
      const data = await res.json()
      const text = data.content.map((b: any) => b.text || "").join("")
      const clean = text.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)
      setNews(parsed.news)
    } catch (e) {
      setNews([{ 
        title: "Erreur de chargement", 
        summary: "Impossible de récupérer les actualités.", 
        impact: "neutre", 
        category: "Système" 
      }])
    }
    setLoading(false)
  }, [sector.id, sector.label])

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
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: "#64748B", textTransform: "uppercase" }}>
          IA · Actualités secteur
        </span>
        <button
          onClick={fetchNews}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 12px", color: "#94A3B8", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}
        >
          ↻ Actualiser
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
