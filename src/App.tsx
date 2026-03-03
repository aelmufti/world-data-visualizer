import { useState, useMemo } from 'react'
import { SECTORS } from './data/sectors'
import { calcPortfolioValue, calcCost, calcPnl, pct, fmt } from './utils/portfolio'
import { useStockPrices } from './hooks/useStockPrices'
import { useAIProvider } from './hooks/useAIProvider'
import AINewsPanel from './components/AINewsPanel'
import AIAnalysis from './components/AIAnalysis'
import Sparkline from './components/Sparkline'

export default function App() {
  const [activeSector, setActiveSector] = useState(SECTORS[0])
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  // Détecte le provider IA disponible
  const { ollamaAvailable, ollamaModels, provider } = useAIProvider()

  // Récupère tous les symboles du portfolio
  const allSymbols = useMemo(() => {
    return SECTORS.flatMap(sec => sec.stocks.map(st => st.ticker))
  }, [])

  // Hook pour récupérer les prix en temps réel (rafraîchit toutes les 60 secondes)
  const { prices: liveQuotes, loading: pricesLoading, refetch } = useStockPrices(allSymbols, 60000)

  // Fonction pour obtenir le prix actuel (live ou fallback sur prix initial)
  const getPrice = (st: { ticker: string; price: number }) => {
    const quote = liveQuotes.get(st.ticker)
    return quote ? quote.price : st.price
  }

  // Fonction pour obtenir le changement du jour
  const getChange = (st: { ticker: string; change: number }) => {
    const quote = liveQuotes.get(st.ticker)
    return quote ? quote.changePercent : st.change
  }

  // Calcul du portfolio avec les prix live
  const sectorsWithLivePrices = useMemo(() => {
    return SECTORS.map(sec => ({
      ...sec,
      stocks: sec.stocks.map(st => ({
        ...st,
        price: getPrice(st),
        change: getChange(st)
      }))
    }))
  }, [liveQuotes])

  const totalPortfolio = sectorsWithLivePrices.reduce((s, sec) => s + calcPortfolioValue(sec.stocks), 0)
  const totalCost = sectorsWithLivePrices.reduce((s, sec) => s + calcCost(sec.stocks), 0)
  const totalPnl = totalPortfolio - totalCost
  const totalPct = parseFloat(pct(totalPortfolio, totalCost))

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
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 3, color: "#475569", marginBottom: 6, textTransform: "uppercase" }}>Portfolio</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#F1F5F9" }}>{fmt(totalPortfolio)}</div>
          <div style={{ fontSize: 13, color: totalPct >= 0 ? "#10B981" : "#EF4444", marginTop: 2 }}>
            {totalPct >= 0 ? "▲" : "▼"} {Math.abs(totalPct)}% · {totalPct >= 0 ? "+" : ""}{fmt(totalPnl)}
          </div>
        </div>
        <div style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingLeft: 8 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, color: "#334155", textTransform: "uppercase" }}>Secteurs</div>
            <button 
              onClick={refetch}
              disabled={pricesLoading}
              style={{ 
                background: "transparent", 
                border: "none", 
                color: pricesLoading ? "#1E293B" : "#475569", 
                cursor: pricesLoading ? "wait" : "pointer", 
                fontSize: 12,
                animation: pricesLoading ? "spin 1s linear infinite" : "none"
              }}
              title="Rafraîchir les cours"
            >
              ↻
            </button>
          </div>
          {sectorsWithLivePrices.map((sec) => {
            const val = calcPortfolioValue(sec.stocks)
            const p = parseFloat(pct(val, calcCost(sec.stocks)))
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
                  <div style={{ fontSize: 11, color: p >= 0 ? "#10B981" : "#EF4444" }}>{p >= 0 ? "+" : ""}{p}%</div>
                </div>
                {active && <div style={{ width: 3, height: 24, background: sec.color, borderRadius: 2 }} />}
              </button>
            )
          })}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, color: "#1E293B", textTransform: "uppercase" }}>
            {pricesLoading ? "Mise à jour..." : `Live · ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <div style={{ 
              width: 6, 
              height: 6, 
              borderRadius: "50%", 
              background: pricesLoading ? "#F59E0B" : "#10B981", 
              boxShadow: pricesLoading ? "0 0 6px #F59E0B" : "0 0 6px #10B981" 
            }} />
            <span style={{ fontSize: 11, color: "#334155" }}>
              {pricesLoading ? "Chargement..." : `${liveQuotes.size}/${allSymbols.length} cours`}
            </span>
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 9, color: "#1E293B", marginBottom: 4 }}>IA: {ollamaAvailable ? '🟢 Ollama' : '🔵 Claude'}</div>
            {ollamaAvailable && ollamaModels.length > 0 && (
              <div style={{ fontSize: 8, color: "#1E293B" }}>{ollamaModels[0]}</div>
            )}
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
              {activeSector.stocks.length} positions · {fmt(calcPortfolioValue(activeSector.stocks))} ·{" "}
              <span style={{ color: calcPnl(activeSector.stocks) >= 0 ? "#10B981" : "#EF4444" }}>
                {calcPnl(activeSector.stocks) >= 0 ? "+" : ""}{fmt(calcPnl(activeSector.stocks))} ({pct(calcPortfolioValue(activeSector.stocks), calcCost(activeSector.stocks))}%)
              </span>
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, animation: "fadeIn 0.4s ease" }} key={activeSector.id + "_content"}>

          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Macro Indicators */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: "#64748B", textTransform: "uppercase", marginBottom: 16 }}>Indicateurs Macro</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {activeSector.indicators.map((ind, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>{ind.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#F1F5F9", fontFamily: "'DM Mono', monospace" }}>{ind.value}</div>
                    <div style={{ fontSize: 11, color: ind.up === true ? "#10B981" : ind.up === false ? "#EF4444" : "#64748B", marginTop: 2 }}>
                      {ind.up === true ? "▲ " : ind.up === false ? "▼ " : ""}{ind.delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stocks Table */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: "#64748B", textTransform: "uppercase", marginBottom: 16 }}>Positions</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Ticker", "Cours", "J.", "P&L", "Valeur"].map((h) => (
                      <th key={h} style={{ textAlign: h === "Ticker" ? "left" : "right", padding: "6px 8px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#334155", fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeSector.stocks.map((st) => {
                    const livePrice = getPrice(st)
                    const stPnl = (livePrice - st.buy) * st.shares
                    const stPct = pct(livePrice, st.buy)
                    const val = livePrice * st.shares
                    return (
                      <tr key={st.ticker} className="stock-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", cursor: "default" }}>
                        <td style={{ padding: "10px 8px" }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: activeSector.color }}>{st.ticker}</div>
                          <div style={{ fontSize: 11, color: "#475569" }}>{st.name}</div>
                        </td>
                        <td style={{ textAlign: "right", padding: "10px 8px" }}>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#F1F5F9" }}>{livePrice.toFixed(2)}</div>
                          <Sparkline up={st.change >= 0} />
                        </td>
                        <td style={{ textAlign: "right", padding: "10px 8px", fontFamily: "'DM Mono', monospace", fontSize: 12, color: st.change >= 0 ? "#10B981" : "#EF4444" }}>
                          {st.change >= 0 ? "+" : ""}{st.change}%
                        </td>
                        <td style={{ textAlign: "right", padding: "10px 8px" }}>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: stPnl >= 0 ? "#10B981" : "#EF4444" }}>
                            {stPnl >= 0 ? "+" : ""}{fmt(stPnl)}
                          </div>
                          <div style={{ fontSize: 10, color: "#475569" }}>{stPct >= 0 ? "+" : ""}{stPct}%</div>
                        </td>
                        <td style={{ textAlign: "right", padding: "10px 8px", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#CBD5E1" }}>
                          {fmt(val)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* AI Analysis */}
            <AIAnalysis sector={activeSector} key={"analysis_" + activeSector.id} />

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
            {/* Sector Allocation */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: "#64748B", textTransform: "uppercase", marginBottom: 16 }}>Allocation Portefeuille</div>
              {sectorsWithLivePrices.map((sec) => {
                const val = calcPortfolioValue(sec.stocks)
                const share = ((val / totalPortfolio) * 100).toFixed(1)
                const active = sec.id === activeSector.id
                return (
                  <div key={sec.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: active ? "#F1F5F9" : "#64748B", fontWeight: active ? 600 : 400 }}>{sec.icon} {sec.label}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: active ? sec.color : "#475569" }}>{share}%</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${share}%`, background: active ? sec.color : `${sec.color}60`, borderRadius: 2, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* AI News */}
            <AINewsPanel sector={activeSector} key={"news_" + activeSector.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
