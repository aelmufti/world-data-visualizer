import { useState, useEffect, useCallback } from 'react'
import type { Sector } from '../data/sectors'
import { generateAnalysis } from '../services/aiApi'

interface Props {
  sector: Sector
}

export default function AIAnalysis({ sector }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setAnalysis(null)
    
    try {
      const text = await generateAnalysis(sector.label)
      setAnalysis(text)
    } catch (error) {
      console.error('Error fetching analysis:', error)
      setAnalysis("Analyse indisponible.")
    }
    
    setLoading(false)
  }, [sector.label])

  useEffect(() => { 
    fetchAnalysis() 
  }, [fetchAnalysis])

  return (
    <div style={{ background: `linear-gradient(135deg, ${sector.color}15, rgba(255,255,255,0.02))`, border: `1px solid ${sector.color}30`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: sector.color, textTransform: "uppercase" }}>
          ✦ Analyse IA
        </span>
        <button onClick={fetchAnalysis} style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 14 }}>↻</button>
      </div>
      {loading ? (
        <div style={{ height: 60, background: "rgba(255,255,255,0.04)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
      ) : (
        <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.7, margin: 0 }}>{analysis}</p>
      )}
    </div>
  )
}
