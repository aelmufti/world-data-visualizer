import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { SECTORS } from './data/sectors'
import { useAIProvider } from './hooks/useAIProvider'
import { useMarketData } from './hooks/useMarketData'
import AINewsPanel from './components/AINewsPanel'
import TopNewsPanel from './components/TopNewsPanel'
import CompanyInfoPanel from './components/CompanyInfoPanel'
import VesselMap from './components/VesselMap'
import Navbar from './components/Navbar'
import StockMarketTab from './components/StockMarket/StockMarketTab'
import PoliticianTradingTab from './components/PoliticianTradingTab'
import CongressTrackerTab from './components/CongressTrackerTab'
import OverviewTab from './components/OverviewTab'
import { useAIS } from './contexts/AISContext'

function SectorialAnalysis() {
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
    <div style={{ minHeight: "100vh", background: "#e0e5ec", color: "#1a202c", fontFamily: "'Poppins', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .sector-btn:hover { 
          box-shadow: 4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8) !important;
          transform: translateY(-2px);
        }
        .stock-row:hover { 
          box-shadow: inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5) !important;
        }
        .alert-btn:hover { 
          box-shadow: 4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8) !important;
        }
      `}</style>

      {/* Sidebar */}
      <div style={{ 
        width: 280, 
        background: "#e0e5ec", 
        padding: "0", 
        display: "flex", 
        flexDirection: "column", 
        height: "100vh", 
        flexShrink: 0,
        boxShadow: "8px 0 16px rgba(163, 177, 198, 0.3)"
      }}>
        <div style={{ 
          padding: "24px 20px", 
          background: "linear-gradient(145deg, #d1d9e6, #f0f4f8)",
          boxShadow: "0 4px 12px rgba(163, 177, 198, 0.3)"
        }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase", color: "#4a5568", fontWeight: 600 }}>Analyse</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a" }}>Sectorielle</div>
          <div style={{ fontSize: 13, marginTop: 6, color: "#4a5568", fontWeight: 500 }}>
            {SECTORS.length} secteurs
          </div>
        </div>
        <div style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
          <div style={{ 
            padding: "10px 12px", 
            marginBottom: 12, 
            background: "#e0e5ec",
            borderRadius: "12px",
            boxShadow: "inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)"
          }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#4a5568", fontWeight: 600 }}>Secteurs</div>
          </div>
          {SECTORS.map((sec) => {
            const active = activeSector.id === sec.id
            return (
              <button
                key={sec.id}
                className="sector-btn"
                onClick={() => setActiveSector(sec)}
                style={{
                  width: "100%", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 12, 
                  padding: "14px 16px",
                  background: active ? `linear-gradient(145deg, ${sec.color}15, ${sec.color}08)` : "#e0e5ec",
                  color: active ? sec.color : "#1a202c",
                  border: "none",
                  borderRadius: "16px", 
                  cursor: "pointer", 
                  marginBottom: 10, 
                  transition: "all 0.3s ease",
                  fontWeight: active ? 600 : 500,
                  fontSize: 13,
                  boxShadow: active 
                    ? `inset 4px 4px 8px rgba(163, 177, 198, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.5), 0 0 0 2px ${sec.color}30`
                    : "6px 6px 12px rgba(163, 177, 198, 0.4), -6px -6px 12px rgba(255, 255, 255, 0.8)"
                }}
              >
                <span style={{ fontSize: 18 }}>{sec.icon}</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{sec.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2, color: "#4a5568" }}>{sec.indicators.length} indicateurs</div>
                </div>
                {active && <div style={{ 
                  width: 8, 
                  height: 8, 
                  background: sec.color, 
                  borderRadius: "50%",
                  boxShadow: `0 0 8px ${sec.color}80`
                }} />}
              </button>
            )
          })}
        </div>
        <div style={{ 
          padding: "16px", 
          background: "#e0e5ec",
          boxShadow: "0 -4px 12px rgba(163, 177, 198, 0.3)"
        }}>
          <div style={{ 
            fontFamily: "'Inter', sans-serif", 
            fontSize: 12, 
            letterSpacing: 1, 
            marginBottom: 12, 
            color: "#1a202c",
            fontWeight: 600,
            padding: "10px",
            background: "#e0e5ec",
            borderRadius: "12px",
            boxShadow: "inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)",
            textAlign: "center"
          }}>
            {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ 
            marginTop: 12, 
            paddingTop: 12, 
            borderTop: "1px solid rgba(163, 177, 198, 0.2)",
            fontSize: 11,
            color: "#4a5568"
          }}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>IA: {ollamaAvailable ? '🟢 Ollama' : '🔵 Claude'}</div>
            {ollamaAvailable && ollamaModels.length > 0 && (
              <div style={{ fontSize: 10, opacity: 0.8 }}>{ollamaModels[0]}</div>
            )}
            <div style={{ 
              marginTop: 6, 
              color: aisConnected ? "#48bb78" : "#4a5568",
              fontWeight: 500
            }}>
              🗺️ AIS: {aisConnected ? `${vesselCount} navires` : 'Connexion...'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0", background: "#e0e5ec" }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 20, 
          padding: "28px 32px", 
          background: "linear-gradient(145deg, #d1d9e6, #f0f4f8)",
          boxShadow: "0 4px 12px rgba(163, 177, 198, 0.3)",
          animation: "fadeIn 0.4s ease" 
        }} key={activeSector.id}>
          <div style={{ 
            width: 70, 
            height: 70, 
            background: `linear-gradient(145deg, ${activeSector.color}20, ${activeSector.color}10)`,
            borderRadius: "20px",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: 32,
            boxShadow: `8px 8px 16px rgba(163, 177, 198, 0.5), -8px -8px 16px rgba(255, 255, 255, 0.8), inset 0 0 0 2px ${activeSector.color}30`
          }}>
            {activeSector.icon}
          </div>
          <div>
            <h1 style={{ 
              fontSize: 32, 
              fontWeight: 700, 
              color: "#0f172a", 
              lineHeight: 1.2,
              marginBottom: 8
            }}>
              {activeSector.label}
            </h1>
            <p style={{ fontSize: 14, color: "#4a5568", fontWeight: 500 }}>
              {activeSector.indicators.length} indicateurs macro · {activeSector.macro.length} thèmes
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, animation: "fadeIn 0.3s ease", padding: "24px" }} key={activeSector.id + "_content"}>

          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingRight: "12px" }}>

            {/* Macro Indicators */}
            <div style={{ 
              background: "#ffffff", 
              borderRadius: "24px",
              padding: 24, 
              marginBottom: 24, 
              boxShadow: "10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)"
            }}>
              <div style={{ 
                fontFamily: "'Inter', sans-serif", 
                fontSize: 13, 
                letterSpacing: 1.5, 
                color: "#4a5568", 
                textTransform: "uppercase", 
                marginBottom: 16, 
                fontWeight: 600,
                paddingBottom: 12,
                borderBottom: "2px solid rgba(163, 177, 198, 0.2)"
              }}>
                Indicateurs Macro {loadingMarket && <span style={{ fontSize: 11, opacity: 0.7 }}>(chargement...)</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {(realIndicators.length > 0 ? realIndicators : activeSector.indicators).map((ind, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (ind.label === "WTI Crude" && activeSector.id === "energie") {
                        setShowMap(true)
                      }
                    }}
                    style={{ 
                      background: "#ffffff", 
                      borderRadius: "16px",
                      padding: "16px",
                      cursor: ind.label === "WTI Crude" && activeSector.id === "energie" ? "pointer" : "default",
                      transition: "all 0.3s ease",
                      position: "relative",
                      boxShadow: "6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.9)"
                    }}
                    onMouseEnter={(e) => {
                      if (ind.label === "WTI Crude" && activeSector.id === "energie") {
                        e.currentTarget.style.boxShadow = "inset 4px 4px 8px rgba(163, 177, 198, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.5)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (ind.label === "WTI Crude" && activeSector.id === "energie") {
                        e.currentTarget.style.boxShadow = "6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.9)"
                      }
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 8, fontWeight: 500 }}>
                      {ind.label}
                      {ind.label === "WTI Crude" && activeSector.id === "energie" && (
                        <span style={{ marginLeft: 6, fontSize: 12 }}>🗺️</span>
                      )}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", fontFamily: "'Poppins', sans-serif", marginBottom: 6 }}>{ind.value}</div>
                    <div style={{ 
                      fontSize: 12, 
                      color: ind.up === true ? "#48bb78" : ind.up === false ? "#f56565" : "#4a5568", 
                      marginTop: 4, 
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      {ind.up === true ? "▲" : ind.up === false ? "▼" : "—"} {ind.delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert Builder */}
            <div style={{ 
              background: "#ffffff", 
              borderRadius: "24px",
              padding: 24,
              boxShadow: "10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)"
            }}>
              <div style={{ 
                fontFamily: "'Inter', sans-serif", 
                fontSize: 13, 
                letterSpacing: 1.5, 
                color: "#4a5568", 
                textTransform: "uppercase", 
                marginBottom: 16, 
                fontWeight: 600,
                paddingBottom: 12,
                borderBottom: "2px solid rgba(163, 177, 198, 0.2)"
              }}>
                🔔 Créer une Alerte
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {activeSector.macro.map((tag, i) => (
                  <button
                    key={i}
                    className="alert-btn"
                    onClick={() => setAlertMsg(`✓ Alerte "${tag}" activée pour ${activeSector.label}`)}
                    style={{ 
                      background: "#e0e5ec",
                      borderRadius: "12px",
                      padding: "10px 16px", 
                      fontSize: 12, 
                      color: "#1a202c", 
                      cursor: "pointer", 
                      transition: "all 0.3s ease", 
                      fontWeight: 600,
                      border: "none",
                      boxShadow: "4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.9)"
                    }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              {alertMsg && (
                <div style={{ 
                  marginTop: 16, 
                  fontSize: 13, 
                  color: "#0f172a", 
                  background: "linear-gradient(145deg, #d1f4e0, #e8f8f0)",
                  borderRadius: "12px",
                  padding: "12px 16px", 
                  fontWeight: 500,
                  boxShadow: "inset 3px 3px 6px rgba(163, 177, 198, 0.3), inset -3px -3px 6px rgba(255, 255, 255, 0.5)"
                }}>
                  {alertMsg}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingLeft: "12px" }}>
            {/* Top News - Last 48h */}
            <TopNewsPanel sector={activeSector.id} key={"topnews_" + activeSector.id} />
            
            {/* Company Info */}
            <CompanyInfoPanel />
            
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

export default function App() {
  const location = useLocation()
  
  // Determine active section based on route
  const getActiveSection = () => {
    if (location.pathname === '/overview') return 'overview'
    if (location.pathname === '/stock-market') return 'stock-market'
    if (location.pathname === '/politician-trading') return 'politician-trading'
    if (location.pathname === '/congress-tracker') return 'congress-tracker'
    if (location.pathname === '/settings') return 'settings'
    return 'sectorial'
  }

  return (
    <div style={{ minHeight: "100vh", background: "#e0e5ec", color: "#4a5568", fontFamily: "'Poppins', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .sector-btn:hover { 
          box-shadow: 4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8) !important;
          transform: translateY(-2px);
        }
        .stock-row:hover { 
          box-shadow: inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5) !important;
        }
        .alert-btn:hover { 
          box-shadow: 4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8) !important;
        }
      `}</style>

      {/* Navbar */}
      <Navbar activeSection={getActiveSection()} />

      {/* Main Content with margin for sidebar */}
      <div style={{ marginLeft: 280, flex: 1, display: 'flex', flexDirection: 'column', background: '#e0e5ec' }}>
        {/* Routes */}
        <Routes>
          <Route path="/" element={<SectorialAnalysis />} />
          <Route path="/overview" element={<OverviewTab />} />
          <Route path="/stock-market" element={<StockMarketTab />} />
          <Route path="/politician-trading" element={<PoliticianTradingTab />} />
          <Route path="/congress-tracker" element={<CongressTrackerTab />} />
          <Route path="/settings" element={
            <div style={{ 
              padding: 40, 
              margin: 40,
              textAlign: 'center', 
              color: '#4a5568', 
              fontWeight: 600, 
              fontSize: 18,
              background: "#e0e5ec",
              borderRadius: "24px",
              boxShadow: "10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.5)"
            }}>
              Paramètres - Coming Soon
            </div>
          } />
        </Routes>
      </div>
    </div>
  )
}
