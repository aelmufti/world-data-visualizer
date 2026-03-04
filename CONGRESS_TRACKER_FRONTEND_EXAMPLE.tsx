// Example React component for displaying Congress trades
// This is a reference implementation - adapt to your project structure

import React, { useState, useEffect } from 'react';

interface Trade {
  id: string;
  politician: string;
  full_name: string;
  party: 'D' | 'R';
  state: string;
  chamber: 'house' | 'senate';
  ticker: string;
  asset_name: string;
  action: string;
  transaction_date: string;
  amount_label: string;
  priceAtTrade: number | null;
  priceNow: number | null;
  returnPct: number | null;
  isWin: boolean | null;
}

interface Politician {
  lastName: string;
  fullName: string;
  party: 'D' | 'R';
  state: string;
  chamber: 'house' | 'senate';
  winRate: number | null;
  totalTrades: number;
  resolvedTrades: number;
}

export function CongressTracker() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    politician: '',
    ticker: '',
    action: '',
    chamber: ''
  });

  // Fetch politicians with win rates
  useEffect(() => {
    fetch('/api/congress/politicians')
      .then(res => res.json())
      .then(data => {
        setPoliticians(data.politicians);
      })
      .catch(console.error);
  }, []);

  // Fetch trades with filters
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.politician) params.set('politician', filter.politician);
    if (filter.ticker) params.set('ticker', filter.ticker);
    if (filter.action) params.set('action', filter.action);
    if (filter.chamber) params.set('chamber', filter.chamber);

    fetch(`/api/congress/trades?${params}`)
      .then(res => res.json())
      .then(data => {
        setTrades(data.trades);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [filter]);

  // Real-time alerts
  useEffect(() => {
    const eventSource = new EventSource('/api/congress/alerts/stream');
    
    eventSource.addEventListener('new-trade', (event) => {
      const trade = JSON.parse(event.data);
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New ${trade.action} by ${trade.full_name}`, {
          body: `${trade.ticker}: ${trade.amount_label}`,
          icon: trade.party === 'D' ? '🔵' : '🔴'
        });
      }
      
      // Add to trades list
      setTrades(prev => [trade, ...prev]);
    });

    return () => eventSource.close();
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="congress-tracker">
      <h1>Congress & Senate Trade Tracker</h1>

      {/* Politician Leaderboard */}
      <section className="leaderboard">
        <h2>Top Performers by Win Rate</h2>
        <div className="politician-grid">
          {politicians
            .filter(p => p.winRate !== null)
            .sort((a, b) => (b.winRate || 0) - (a.winRate || 0))
            .slice(0, 10)
            .map(politician => (
              <div key={politician.lastName} className="politician-card">
                <div className="politician-name">
                  {politician.fullName}
                  <span className={`party ${politician.party}`}>
                    {politician.party}
                  </span>
                </div>
                <div className="win-rate">
                  {((politician.winRate || 0) * 100).toFixed(1)}%
                </div>
                <div className="trade-count">
                  {politician.resolvedTrades} / {politician.totalTrades} trades
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Filters */}
      <section className="filters">
        <h2>Filter Trades</h2>
        <div className="filter-row">
          <input
            type="text"
            placeholder="Politician (e.g., Pelosi)"
            value={filter.politician}
            onChange={e => setFilter({ ...filter, politician: e.target.value })}
          />
          <input
            type="text"
            placeholder="Ticker (e.g., NVDA)"
            value={filter.ticker}
            onChange={e => setFilter({ ...filter, ticker: e.target.value.toUpperCase() })}
          />
          <select
            value={filter.action}
            onChange={e => setFilter({ ...filter, action: e.target.value })}
          >
            <option value="">All Actions</option>
            <option value="Purchase">Purchase</option>
            <option value="Sale">Sale</option>
            <option value="Sale (Partial)">Sale (Partial)</option>
            <option value="Exchange">Exchange</option>
          </select>
          <select
            value={filter.chamber}
            onChange={e => setFilter({ ...filter, chamber: e.target.value })}
          >
            <option value="">Both Chambers</option>
            <option value="house">House</option>
            <option value="senate">Senate</option>
          </select>
          <button onClick={() => setFilter({ politician: '', ticker: '', action: '', chamber: '' })}>
            Clear Filters
          </button>
        </div>
      </section>

      {/* Trades Table */}
      <section className="trades">
        <h2>Recent Trades ({trades.length})</h2>
        {loading ? (
          <div className="loading">Loading trades...</div>
        ) : (
          <table className="trades-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Politician</th>
                <th>Ticker</th>
                <th>Action</th>
                <th>Amount</th>
                <th>Price at Trade</th>
                <th>Current Price</th>
                <th>Return</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => (
                <tr key={trade.id} className={trade.isWin ? 'win' : trade.isWin === false ? 'loss' : ''}>
                  <td>{new Date(trade.transaction_date).toLocaleDateString()}</td>
                  <td>
                    <div className="politician-cell">
                      {trade.full_name}
                      <span className={`party ${trade.party}`}>{trade.party}</span>
                      <span className="state">{trade.state}</span>
                    </div>
                  </td>
                  <td className="ticker">{trade.ticker}</td>
                  <td className={`action ${trade.action.toLowerCase().replace(/\s/g, '-')}`}>
                    {trade.action}
                  </td>
                  <td>{trade.amount_label}</td>
                  <td>
                    {trade.priceAtTrade !== null 
                      ? `$${trade.priceAtTrade.toFixed(2)}` 
                      : '—'}
                  </td>
                  <td>
                    {trade.priceNow !== null 
                      ? `$${trade.priceNow.toFixed(2)}` 
                      : '—'}
                  </td>
                  <td className={trade.returnPct && trade.returnPct > 0 ? 'positive' : 'negative'}>
                    {trade.returnPct !== null 
                      ? `${trade.returnPct > 0 ? '+' : ''}${trade.returnPct.toFixed(1)}%` 
                      : '—'}
                  </td>
                  <td>
                    {trade.isWin === true && '✅ Win'}
                    {trade.isWin === false && '❌ Loss'}
                    {trade.isWin === null && '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// Example CSS (adapt to your styling system)
const styles = `
.congress-tracker {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.leaderboard {
  margin-bottom: 3rem;
}

.politician-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.politician-card {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.politician-name {
  font-weight: bold;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.party {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.party.D {
  background: #3b82f6;
  color: white;
}

.party.R {
  background: #ef4444;
  color: white;
}

.win-rate {
  font-size: 2rem;
  font-weight: bold;
  color: #10b981;
}

.trade-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.filters {
  margin-bottom: 2rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.filter-row input,
.filter-row select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
}

.filter-row button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.trades-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.trades-table th {
  background: #f3f4f6;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

.trades-table td {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.trades-table tr.win {
  background: #f0fdf4;
}

.trades-table tr.loss {
  background: #fef2f2;
}

.ticker {
  font-weight: bold;
  font-family: monospace;
}

.action.purchase {
  color: #10b981;
}

.action.sale,
.action.sale-partial {
  color: #ef4444;
}

.positive {
  color: #10b981;
  font-weight: bold;
}

.negative {
  color: #ef4444;
  font-weight: bold;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}
`;

export default CongressTracker;
