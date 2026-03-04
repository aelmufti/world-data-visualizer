import { useState, useEffect } from 'react';
import { congressTrackerService, type CongressTrade, type Politician } from '../services/congressTrackerService';

const tickerColors: Record<string, string> = {
  GOOGL: '#4285F4',
  AMZN: '#FF9900',
  NVDA: '#76B900',
  AAPL: '#A2AAAD',
  MSFT: '#00A4EF',
  TSLA: '#E82127',
  META: '#0668E1',
  PYPL: '#003087',
  DIS: '#1565C0',
  INTC: '#0071C5',
};

export default function CongressTrackerTab() {
  const [trades, setTrades] = useState<CongressTrade[]>([]);
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('All');
  const [filterTicker, setFilterTicker] = useState('All');
  const [filterChamber, setFilterChamber] = useState('All');
  const [selectedPolitician, setSelectedPolitician] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [latestTrade, setLatestTrade] = useState<CongressTrade | null>(null);

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time alerts
    const unsubscribe = congressTrackerService.subscribeToAlerts((trade) => {
      console.log('New trade detected:', trade);
      setLatestTrade(trade);
      setShowNotification(true);
      setUnreadAlerts(prev => prev + 1);
      
      // Add to trades list
      setTrades(prev => [trade, ...prev]);
      
      // Hide notification after 5 seconds
      setTimeout(() => setShowNotification(false), 5000);
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tradesData, politiciansData, status] = await Promise.all([
        congressTrackerService.getTrades(),
        congressTrackerService.getPoliticians(),
        congressTrackerService.getStatus()
      ]);

      setTrades(tradesData);
      setPoliticians(politiciansData.sort((a, b) => (b.winRate || 0) - (a.winRate || 0)));
      setUnreadAlerts(status?.unreadAlerts || 0);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPoliticianTrades = async (lastName: string) => {
    setLoading(true);
    try {
      const tradesData = await congressTrackerService.getTradesByPolitician(lastName);
      setTrades(tradesData);
      setSelectedPolitician(lastName);
    } catch (error) {
      console.error('Error loading politician trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearPoliticianFilter = () => {
    setSelectedPolitician(null);
    loadData();
  };

  const tickers = ['All', ...new Set(trades.map(t => t.ticker).filter(Boolean))];

  const filtered = trades.filter(trade => {
    const actionMatch = filterAction === 'All' || trade.action === filterAction;
    const tickerMatch = filterTicker === 'All' || trade.ticker === filterTicker;
    const chamberMatch = filterChamber === 'All' || trade.chamber === filterChamber;
    return actionMatch && tickerMatch && chamberMatch;
  });

  const totalBuys = trades.filter(t => t.action === 'Purchase').length;
  const totalSells = trades.filter(t => t.action === 'Sale' || t.action === 'Sale (Partial)').length;

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      background: '#080c10',
      minHeight: 'calc(100vh - 64px)',
      color: '#e2e8f0',
      padding: 0,
    }}>
      {/* Real-time notification */}
      {showNotification && latestTrade && (
        <div style={{
          position: 'fixed',
          top: 80,
          right: 20,
          background: '#0d1117',
          border: '2px solid #22c55e',
          borderRadius: 8,
          padding: '16px 20px',
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          minWidth: 320,
          animation: 'slideIn 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>🔔</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', letterSpacing: '0.05em' }}>
                NEW TRADE DETECTED
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                Just now
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#f1f5f9', marginBottom: 4 }}>
            <strong>{latestTrade.full_name}</strong> ({latestTrade.party}-{latestTrade.state})
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {latestTrade.action} <strong style={{ color: '#60a5fa' }}>{latestTrade.ticker}</strong> · {latestTrade.amount_label}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid #1e2a38',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}>
                🏛️
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
                  Congress Trade Tracker
                </div>
                <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Real-time PTR Filings · House & Senate · Win Rate Analysis
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Total', value: trades.length },
              { label: 'Buys', value: totalBuys, color: '#22c55e' },
              { label: 'Sells', value: totalSells, color: '#ef4444' },
              { label: 'Alerts', value: unreadAlerts, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#0d1117',
                border: '1px solid #1e2a38',
                borderRadius: 6,
                padding: '10px 20px',
                textAlign: 'center',
                minWidth: 90,
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color || '#f1f5f9', fontFamily: 'Georgia, serif' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Politicians Leaderboard */}
        <div style={{
          background: '#0d1117',
          border: '1px solid #1e2a38',
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 16, letterSpacing: '0.05em' }}>
            🏆 TOP PERFORMERS BY WIN RATE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {politicians.filter(p => p.winRate !== null).slice(0, 9).map(pol => (
              <div
                key={pol.lastName}
                onClick={() => loadPoliticianTrades(pol.lastName)}
                style={{
                  background: selectedPolitician === pol.lastName ? '#1d4ed822' : '#080c10',
                  border: `1px solid ${selectedPolitician === pol.lastName ? '#3b82f6' : '#1e2a38'}`,
                  borderRadius: 6,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (selectedPolitician !== pol.lastName) {
                    e.currentTarget.style.borderColor = '#1e2a38';
                  }
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
                  {pol.fullName}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}>
                  {pol.party === 'D' ? '🔵 Democrat' : '🔴 Republican'} · {pol.state} · {pol.chamber === 'house' ? 'House' : 'Senate'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', fontFamily: 'Georgia, serif' }}>
                      {((pol.winRate || 0) * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 9, color: '#475569', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Win Rate
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa' }}>
                      {pol.resolvedTrades}/{pol.totalTrades}
                    </div>
                    <div style={{ fontSize: 9, color: '#475569', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Resolved
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedPolitician && (
            <button
              onClick={clearPoliticianFilter}
              style={{
                marginTop: 16,
                background: '#1d4ed8',
                border: 'none',
                color: '#fff',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '8px 16px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ← Show All Politicians
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 8 }}>
            Action:
          </div>
          {['All', 'Purchase', 'Sale', 'Sale (Partial)', 'Exchange'].map(f => (
            <button
              key={f}
              onClick={() => setFilterAction(f)}
              style={{
                background: filterAction === f ? '#1d4ed8' : '#0d1117',
                border: `1px solid ${filterAction === f ? '#3b82f6' : '#1e2a38'}`,
                color: filterAction === f ? '#fff' : '#64748b',
                fontSize: 11,
                letterSpacing: '0.05em',
                padding: '6px 14px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: filterAction === f ? 600 : 400,
              }}
            >
              {f}
            </button>
          ))}

          <div style={{ width: 1, background: '#1e2a38', height: 24, margin: '0 8px' }} />

          <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 8 }}>
            Chamber:
          </div>
          {['All', 'house', 'senate'].map(f => (
            <button
              key={f}
              onClick={() => setFilterChamber(f)}
              style={{
                background: filterChamber === f ? '#1d4ed8' : '#0d1117',
                border: `1px solid ${filterChamber === f ? '#3b82f6' : '#1e2a38'}`,
                color: filterChamber === f ? '#fff' : '#64748b',
                fontSize: 11,
                letterSpacing: '0.05em',
                padding: '6px 14px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: filterChamber === f ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}

          <div style={{ width: 1, background: '#1e2a38', height: 24, margin: '0 8px' }} />

          <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 8 }}>
            Ticker:
          </div>
          {tickers.slice(0, 12).map(t => (
            <button
              key={t}
              onClick={() => setFilterTicker(t)}
              style={{
                background: filterTicker === t ? (tickerColors[t] || '#334155') + '33' : '#0d1117',
                border: `1px solid ${filterTicker === t ? (tickerColors[t] || '#60a5fa') : '#1e2a38'}`,
                color: filterTicker === t ? (tickerColors[t] || '#60a5fa') : '#64748b',
                fontSize: 11,
                letterSpacing: '0.05em',
                padding: '6px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: filterTicker === t ? 600 : 400,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div>Loading congressional trades...</div>
          </div>
        ) : (
          /* Table */
          <div style={{
            background: '#0d1117',
            border: '1px solid #1e2a38',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#080c10', borderBottom: '1px solid #1e2a38' }}>
                  {['Ticker', 'Politician', 'Party', 'Action', 'Amount', 'Date', 'Price', 'Return', 'Result'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#334155',
                      fontWeight: 500,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((trade, i) => (
                  <tr
                    key={trade.id}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderBottom: '1px solid #111820',
                      background: hoveredRow === i ? '#0f1923' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      {trade.ticker ? (
                        <span style={{
                          background: (tickerColors[trade.ticker] || '#334155') + '22',
                          color: tickerColors[trade.ticker] || '#94a3b8',
                          border: `1px solid ${(tickerColors[trade.ticker] || '#334155')}55`,
                          padding: '3px 10px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                        }}>
                          {trade.ticker}
                        </span>
                      ) : (
                        <span style={{ color: '#334155', fontSize: 11 }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#60a5fa', fontSize: 12, fontWeight: 500 }}>
                        {trade.full_name}
                      </div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                        {trade.state} · {trade.chamber === 'house' ? 'House' : 'Senate'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: trade.party === 'D' ? '#3b82f622' : '#ef444422',
                        color: trade.party === 'D' ? '#3b82f6' : '#ef4444',
                        border: `1px solid ${trade.party === 'D' ? '#3b82f655' : '#ef444455'}`,
                        padding: '2px 8px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}>
                        {trade.party === 'D' ? '🔵 DEM' : '🔴 REP'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        color: trade.action === 'Purchase' ? '#22c55e' :
                               trade.action.includes('Sale') ? '#ef4444' : '#f59e0b',
                        fontWeight: 600,
                        fontSize: 11,
                        letterSpacing: '0.05em',
                      }}>
                        {trade.action === 'Purchase' ? '▲ BUY' :
                         trade.action.includes('Sale') ? '▼ SELL' : '↔ EXCH'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 500, fontSize: 11 }}>
                      {trade.amount_label}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: 11 }}>
                      {congressTrackerService.formatDate(trade.transaction_date)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 11 }}>
                      {trade.priceAtTrade !== null && trade.priceAtTrade !== undefined ? (
                        <div>
                          <div style={{ color: '#94a3b8' }}>${trade.priceAtTrade.toFixed(2)}</div>
                          {trade.priceNow !== null && trade.priceNow !== undefined && (
                            <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                              → ${trade.priceNow.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#334155' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {trade.returnPct !== null && trade.returnPct !== undefined ? (
                        <span style={{
                          color: trade.returnPct > 0 ? '#22c55e' : '#ef4444',
                          fontWeight: 700,
                          fontSize: 11,
                        }}>
                          {trade.returnPct > 0 ? '+' : ''}{trade.returnPct.toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ color: '#334155' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 16 }}>
                      {trade.isWin === true && '✅'}
                      {trade.isWin === false && '❌'}
                      {trade.isWin === null && '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #111820',
              fontSize: 10,
              color: '#1e3a5f',
              letterSpacing: '0.05em',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                {filtered.length} TRANSACTIONS · REAL-TIME PTR FILINGS · POWERED BY DUCKDB
              </div>
              <div style={{ color: '#22c55e' }}>
                🟢 LIVE
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
