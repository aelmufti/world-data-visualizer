import { useState } from 'react'
import { SECTORS } from './data/sectors'
import { useAIProvider } from './hooks/useAIProvider'
import { useMarketData } from './hooks/useMarketData'
import AINewsPanel from './components/AINewsPanel'
import VesselMap from './components/VesselMap'
import { useAIS } from './contexts/AISContext'

export default function App() {
  const [activeSector, setActiveSector] = useState(SECTORS[0])
  const [alertMsg, setAlertMsg] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)

  // Détecte le provider IA disponible
  const { ollamaAvailable, ollamaModels } = useAIProvider()
  
  // Récupère les données de marché réelles
  const { indicators: realIndicators, loading: loadingMarket } = useMarketData(activeSector.id)
  
  // Récupère les données AIS en temps réel
  const { vesselCount, connected: aisConnected } = useAIS()

  return (
    <div style={{ minHeight: "100vh", background: "#060B14", color: "#E2E8F0", fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .sector-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .stock-row:hover { background: rgba(255,255,255,0.04) !important; }
        .alert-btn:hover { opacity: 0.85; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 220, background: "#080E1A", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "24px 0", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 3, color: "#475569", marginBottom: 6, textTransform: "uppercase" }}>Analyse</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#F1F5F9" }}>Sectorielle</div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            {SECTORS.length} secteurs
          </div>
        </div>
        <div style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingLeft: 8 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, color: "#334155", textTransform: "uppercase" }}>Secteurs</div>
          </div>
          {SECTORS.map((sec) => {
            const active = activeSector.id === sec.id
            return (
              <button
                key={sec.id}
                className="sector-btn"
                onClick={() => setActiveSector(sec)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px",
                  background: active ? `${sec.color}18` : "transparent",
                  border: active ? `1px solid ${sec.color}40` : "1px solid transparent",
                  borderRadius: 8, cursor: "pointer", marginBottom: 4, transition: "all 0.15s"
                }}
              >
                <span style={{ fontSize: 16 }}>{sec.icon}</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "#F1F5F9" : "#94A3B8" }}>{sec.label}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{sec.indicators.length} indicateurs</div>
                </div>
                {active && <div style={{ width: 3, height: 24, background: sec.color, borderRadius: 2 }} />}
              </button>
            )
          })}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, color: "#1E293B", textTransform: "uppercase" }}>
            {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 9, color: "#1E293B", marginBottom: 4 }}>IA: {ollamaAvailable ? '🟢 Ollama' : '🔵 Claude'}</div>
            {ollamaAvailable && ollamaModels.length > 0 && (
              <div style={{ fontSize: 8, color: "#1E293B" }}>{ollamaModels[0]}</div>
            )}
            <div style={{ fontSize: 9, color: aisConnected ? "#10B981" : "#64748B", marginTop: 4 }}>
              🗺️ AIS: {aisConnected ? `${vesselCount} navires` : 'Connexion...'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, animation: "fadeIn 0.4s ease" }} key={activeSector.id}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${activeSector.color}22`, border: `1px solid ${activeSector.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {activeSector.icon}
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#F1F5F9", lineHeight: 1 }}>{activeSector.label}</h1>
            <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
              {activeSector.indicators.length} indicateurs macro · {activeSector.macro.length} thèmes
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, animation: "fadeIn 0.4s ease" }} key={activeSector.id + "_content"}>

          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Macro Indicators */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: "#64748B", textTransform: "uppercase", marginBottom: 16 }}>
                Indicateurs Macro {loadingMarket && <span style={{ fontSize: 10, color: "#475569" }}>(chargement...)</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(realIndicators.length > 0 ? realIndicators : activeSector.indicators).map((ind, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (ind.label === "WTI Crude" && activeSector.id === "energie") {
                        setShowMap(true)
                      }
                    }}
                    style={{ 
                      background: "rgba(255,255,255,0.03)", 
                      border: "1px solid rgba(255,255,255,0.06)", 
                      borderRadius: 8, 
                      padding: "12px 14px",
                      cursor: ind.label === "WTI Crude" && activeSector.id === "energie" ? "pointer" : "default",
                      transition: "all 0.2s",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      if (ind.label === "WTI Crude" && activeSector.id === "energie") {
                        e.currentTarget.style.background = "rgba(245,158,11,0.1)"
                        e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (ind.label === "WTI Crude" && activeSector.id === "energie") {
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"
                      }
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>
                      {ind.label}
                      {ind.label === "WTI Crude" && activeSector.id === "energie" && (
                        <span style={{ marginLeft: 6, fontSize: 10 }}>🗺️</span>
                      )}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#F1F5F9", fontFamily: "'DM Mono', monospace" }}>{ind.value}</div>
                    <div style={{ fontSize: 11, color: ind.up === true ? "#10B981" : ind.up === false ? "#EF4444" : "#64748B", marginTop: 2 }}>
                      {ind.up === true ? "▲ " : ind.up === false ? "▼ " : ""}{ind.delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert Builder */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: "#64748B", textTransform: "uppercase", marginBottom: 14 }}>🔔 Créer une Alerte</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {activeSector.macro.map((tag, i) => (
                  <button
                    key={i}
                    className="alert-btn"
                    onClick={() => setAlertMsg(`✓ Alerte "${tag}" activée pour ${activeSector.label}`)}
                    style={{ background: `${activeSector.color}15`, border: `1px solid ${activeSector.color}30`, borderRadius: 6, padding: "6px 12px", fontSize: 12, color: activeSector.color, cursor: "pointer", transition: "opacity 0.15s" }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              {alertMsg && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#10B981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 6, padding: "8px 12px" }}>
                  {alertMsg}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* AI News */}
            <AINewsPanel sector={activeSector} key={"news_" + activeSector.id} />
          </div>
        </div>
      </div>

      {/* Vessel Map Modal */}
      {showMap && <VesselMap onClose={() => setShowMap(false)} />}
    </div>
  )
}
