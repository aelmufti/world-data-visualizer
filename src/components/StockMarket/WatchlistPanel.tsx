/**
 * WatchlistPanel Component
 * 
 * Manages user's stock watchlist with:
 * - Real-time price updates for all stocks
 * - Add stocks via StockSearch integration
 * - Remove stocks with confirmation
 * - Drag-and-drop reordering
 * - 50-stock capacity limit
 * - Persistence to localStorage
 * - Compact and expanded view modes
 */

import { useState, useEffect, DragEvent } from 'react';
import type { WatchlistPanelProps } from '../../types/stock-market';
import { StockSearch } from './StockSearch';
import { stockWebSocket } from '../../services/stockWebSocket';

const MAX_WATCHLIST_SIZE = 50;

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  symbols,
  prices,
  onAdd,
  onRemove,
  onReorder
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates for watchlist stocks
  useEffect(() => {
    if (symbols.length > 0) {
      stockWebSocket.subscribe(symbols);
    }

    return () => {
      if (symbols.length > 0) {
        stockWebSocket.unsubscribe(symbols);
      }
    };
  }, [symbols]);

  const handleAddStock = (symbol: string) => {
    setError(null);

    // Check if already in watchlist
    if (symbols.includes(symbol)) {
      setError(`${symbol} is already in your watchlist`);
      return;
    }

    // Check capacity limit
    if (symbols.length >= MAX_WATCHLIST_SIZE) {
      setError(`Watchlist is full (maximum ${MAX_WATCHLIST_SIZE} stocks)`);
      return;
    }

    onAdd(symbol);
    setShowSearch(false);
  };

  const handleRemoveStock = (symbol: string) => {
    if (removeConfirm === symbol) {
      onRemove(symbol);
      setRemoveConfirm(null);
    } else {
      setRemoveConfirm(symbol);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => {
        setRemoveConfirm(null);
      }, 3000);
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    onReorder(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const formatNumber = (num: number | undefined, decimals = 2): string => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatPercent = (num: number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 20,
      boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottom: '2px solid rgba(163, 177, 198, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>Watchlist</h3>
          <span style={{ fontSize: 14, color: '#4a5568', fontWeight: 500 }}>
            ({symbols.length}/{MAX_WATCHLIST_SIZE})
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Add button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              padding: 8,
              color: '#667eea',
              background: '#e0e5ec',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
            }}
            aria-label="Add stock"
            title="Add stock"
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Expand/collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: 8,
              color: '#667eea',
              background: '#e0e5ec',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
            }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              style={{
                width: 20,
                height: 20,
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div style={{ padding: 16, borderBottom: '2px solid rgba(163, 177, 198, 0.2)' }}>
          <StockSearch
            onSelect={handleAddStock}
            placeholder="Add stock to watchlist..."
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          margin: '16px 16px 0',
          padding: 12,
          background: 'rgba(220, 38, 38, 0.1)',
          border: '2px solid rgba(220, 38, 38, 0.3)',
          borderRadius: 10,
          color: '#dc2626',
          fontSize: 13,
          fontWeight: 500
        }}>
          {error}
        </div>
      )}

      {/* Watchlist items */}
      {isExpanded && (
        <div style={{ padding: '8px 0' }}>
          {symbols.length === 0 ? (
            <div style={{
              padding: 32,
              textAlign: 'center',
              color: '#4a5568'
            }}>
              <svg style={{
                width: 48,
                height: 48,
                margin: '0 auto 12px',
                color: '#64748b'
              }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p style={{ fontSize: 14, fontWeight: 500 }}>Your watchlist is empty</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Add stocks to start monitoring</p>
            </div>
          ) : (
            symbols.map((symbol, index) => {
              const quote = prices.get(symbol);
              const isPositive = quote && quote.change >= 0;
              const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
              const isDragging = draggedIndex === index;

              return (
                <div
                  key={symbol}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    padding: 12,
                    margin: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: 12,
                    cursor: 'move',
                    transition: 'all 0.2s',
                    opacity: isDragging ? 0.5 : 1,
                    boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Left: Symbol and drag handle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <svg style={{ width: 16, height: 16, color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      <div>
                        <div style={{ color: '#0f172a', fontWeight: 600, fontSize: 14 }}>{symbol}</div>
                        {quote && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            Vol: {formatNumber(quote.volume, 0)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Price and change */}
                    <div style={{ textAlign: 'right', flex: 1 }}>
                      {quote ? (
                        <>
                          <div style={{ color: '#1a202c', fontWeight: 600, fontSize: 14 }}>
                            ${formatNumber(quote.price)}
                          </div>
                          <div style={{ 
                            fontSize: 12, 
                            color: isPositive ? '#10B981' : '#EF4444',
                            marginTop: 2,
                            fontWeight: 600
                          }}>
                            {isPositive ? '▲' : '▼'} {formatNumber(Math.abs(quote.change))} ({formatPercent(quote.changePercent)})
                          </div>
                        </>
                      ) : (
                        <div style={{ color: '#64748b', fontSize: 13 }}>Loading...</div>
                      )}
                    </div>

                    {/* Right: Remove button */}
                    <div style={{ marginLeft: 12 }}>
                      <button
                        onClick={() => handleRemoveStock(symbol)}
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: removeConfirm === symbol ? '#dc2626' : '#e0e5ec',
                          color: removeConfirm === symbol ? '#fff' : '#64748b',
                          boxShadow: removeConfirm === symbol 
                            ? '4px 4px 8px rgba(220, 38, 38, 0.3), -4px -4px 8px rgba(255, 255, 255, 0.5)'
                            : '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
                        }}
                        onMouseEnter={(e) => {
                          if (removeConfirm !== symbol) {
                            e.currentTarget.style.color = '#dc2626'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (removeConfirm !== symbol) {
                            e.currentTarget.style.color = '#64748b'
                          }
                        }}
                        aria-label={removeConfirm === symbol ? 'Confirm remove' : 'Remove stock'}
                        title={removeConfirm === symbol ? 'Click again to confirm' : 'Remove from watchlist'}
                      >
                        <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Footer with info */}
      {isExpanded && symbols.length > 0 && (
        <div style={{ 
          padding: 12, 
          borderTop: '2px solid rgba(163, 177, 198, 0.2)', 
          fontSize: 11, 
          color: '#64748b',
          textAlign: 'center',
          fontWeight: 500
        }}>
          Drag to reorder • Real-time updates enabled
        </div>
      )}
    </div>
  );
};
