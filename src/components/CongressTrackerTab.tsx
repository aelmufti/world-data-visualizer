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
  const [sortField, setSortField] = useState<keyof CongressTrade | null>('transaction_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  const handleSort = (field: keyof CongressTrade) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filtered = trades.filter(trade => {
    const actionMatch = filterAction === 'All' || trade.action === filterAction;
    const tickerMatch = filterTicker === 'All' || trade.ticker === filterTicker;
    const chamberMatch = filterChamber === 'All' || trade.chamber === filterChamber;
    return actionMatch && tickerMatch && chamberMatch;
  });

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;

    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle null/undefined values
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    // Compare values
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  const totalBuys = trades.filter(t => t.action === 'Purchase').length;
  const totalSells = trades.filter(t => t.action === 'Sale' || t.action === 'Sale (Partial)').length;

  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      background: '#e0e5ec',
      minHeight: '100vh',
      color: '#4a5568',
      padding: '28px 32px',
    }}>
      {/* Real-time notification */}
      {showNotification && latestTrade && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: '#e0e5ec',
          borderRadius: 16,
          padding: '16px 20px',
          zIndex: 1000,
          boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.5)',
          minWidth: 320,
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>🔔</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#48bb78', letterSpacing: '0.05em' }}>
                NEW TRADE DETECTED
              </div>
              <div style={{ fontSize: 10, color: '#718096', marginTop: 2 }}>
                Just now
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#2d3748', marginBottom: 4 }}>
            <strong>{latestTrade.full_name}</strong> ({latestTrade.party}-{latestTrade.state})
          </div>
          <div style={{ fontSize: 12, color: '#4a5568' }}>
            {latestTrade.action} <strong style={{ color: '#667eea' }}>{latestTrade.ticker}</strong> · {latestTrade.amount_label}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: '2px solid rgba(163, 177, 198, 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(145deg, #667eea, #764ba2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            boxShadow: '8px 8px 16px rgba(163, 177, 198, 0.5), -8px -8px 16px rgba(255, 255, 255, 0.8)',
          }}>
            🏛️
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2d3748', lineHeight: 1.2 }}>
              Congress Trade Tracker
            </h1>
            <p style={{ fontSize: 13, color: '#718096', marginTop: 4, fontWeight: 500 }}>
              Real-time PTR Filings · House & Senate · Win Rate Analysis
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Total', value: trades.length },
            { label: 'Buys', value: totalBuys, color: '#48bb78' },
            { label: 'Sells', value: totalSells, color: '#f56565' },
            { label: 'Alerts', value: unreadAlerts, color: '#ed8936' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#e0e5ec',
              borderRadius: 16,
              padding: '14px 20px',
              textAlign: 'center',
              minWidth: 90,
              boxShadow: '6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.8)',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color || '#2d3748' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: '#718096', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4, fontWeight: 600 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Politicians Leaderboard */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}>
        <div style={{ 
          fontFamily: "'DM Mono', monospace", 
          fontSize: 11, 
          letterSpacing: 2, 
          color: '#64748B', 
          textTransform: 'uppercase', 
          marginBottom: 16 
        }}>
          🏆 Top Performers by Win Rate
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {politicians.filter(p => p.winRate !== null).slice(0, 9).map(pol => (
            <div
              key={pol.lastName}
              onClick={() => loadPoliticianTrades(pol.lastName)}
              style={{
                background: selectedPolitician === pol.lastName ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedPolitician === pol.lastName ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 8,
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
              }}
              onMouseLeave={(e) => {
                if (selectedPolitician !== pol.lastName) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                } else {
                  e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
                }
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', marginBottom: 4 }}>
                {pol.fullName}
              </div>
              <div style={{ fontSize: 10, color: '#64748B', marginBottom: 8 }}>
                {pol.party === 'D' ? '🔵 Democrat' : '🔴 Republican'} · {pol.state} · {pol.chamber === 'house' ? 'House' : 'Senate'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>
                    {((pol.winRate || 0) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 9, color: '#475569', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Win Rate
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#60A5FA' }}>
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
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#60A5FA',
              fontSize: 11,
              letterSpacing: '0.05em',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
            }}
          >
            ← Show All Politicians
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ 
          fontFamily: "'DM Mono', monospace",
          fontSize: 10, 
          color: '#64748B', 
          letterSpacing: '0.1em', 
          textTransform: 'uppercase', 
          marginRight: 8 
        }}>
          Action:
        </div>
        {['All', 'Purchase', 'Sale', 'Sale (Partial)', 'Exchange'].map(f => (
          <button
            key={f}
            onClick={() => setFilterAction(f)}
            style={{
              background: filterAction === f ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filterAction === f ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: filterAction === f ? '#60A5FA' : '#94A3B8',
              fontSize: 11,
              padding: '6px 14px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: filterAction === f ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {f}
          </button>
        ))}

        <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', height: 24, margin: '0 8px' }} />

        <div style={{ 
          fontFamily: "'DM Mono', monospace",
          fontSize: 10, 
          color: '#64748B', 
          letterSpacing: '0.1em', 
          textTransform: 'uppercase', 
          marginRight: 8 
        }}>
          Chamber:
        </div>
        {['All', 'house', 'senate'].map(f => (
          <button
            key={f}
            onClick={() => setFilterChamber(f)}
            style={{
              background: filterChamber === f ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filterChamber === f ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: filterChamber === f ? '#60A5FA' : '#94A3B8',
              fontSize: 11,
              padding: '6px 14px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: filterChamber === f ? 600 : 400,
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {f}
          </button>
        ))}

        <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', height: 24, margin: '0 8px' }} />

        <div style={{ 
          fontFamily: "'DM Mono', monospace",
          fontSize: 10, 
          color: '#64748B', 
          letterSpacing: '0.1em', 
          textTransform: 'uppercase', 
          marginRight: 8 
        }}>
          Ticker:
        </div>
        {tickers.slice(0, 12).map(t => (
          <button
            key={t}
            onClick={() => setFilterTicker(t)}
            style={{
              background: filterTicker === t ? (tickerColors[t] ? `${tickerColors[t]}22` : 'rgba(59,130,246,0.15)') : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filterTicker === t ? (tickerColors[t] ? `${tickerColors[t]}55` : 'rgba(59,130,246,0.3)') : 'rgba(255,255,255,0.06)'}`,
              color: filterTicker === t ? (tickerColors[t] || '#60A5FA') : '#94A3B8',
              fontSize: 11,
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: filterTicker === t ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div>Loading congressional trades...</div>
        </div>
      ) : (
        /* Table */
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { label: 'Ticker', field: 'ticker' as keyof CongressTrade },
                    { label: 'Politician', field: 'full_name' as keyof CongressTrade },
                    { label: 'Party', field: 'party' as keyof CongressTrade },
                    { label: 'Action', field: 'action' as keyof CongressTrade },
                    { label: 'Amount', field: 'amount_label' as keyof CongressTrade },
                    { label: 'Date', field: 'transaction_date' as keyof CongressTrade },
                    { label: 'Price', field: 'priceAtTrade' as keyof CongressTrade },
                    { label: 'Return', field: 'returnPct' as keyof CongressTrade },
                    { label: 'Result', field: 'isWin' as keyof CongressTrade },
                  ].map(h => (
                    <th 
                      key={h.label} 
                      onClick={() => handleSort(h.field)}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: sortField === h.field ? '#60a5fa' : '#334155',
                        fontWeight: sortField === h.field ? 600 : 500,
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#60a5fa';
                      }}
                      onMouseLeave={(e) => {
                        if (sortField !== h.field) {
                          e.currentTarget.style.color = '#334155';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {h.label}
                        {sortField === h.field && (
                          <span style={{ fontSize: 10 }}>
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 100).map((trade, i) => (
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
                {sorted.length} TRANSACTIONS · REAL-TIME PTR FILINGS · POWERED BY DUCKDB
              </div>
              <div style={{ color: '#22c55e' }}>
                🟢 LIVE
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
