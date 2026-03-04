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
      background: '#0A1628',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>Watchlist</h3>
          <span style={{ fontSize: 14, color: '#64748B' }}>
            ({symbols.length}/{MAX_WATCHLIST_SIZE})
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Add button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              padding: 8,
              color: '#94A3B8',
              background: 'transparent',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8'
              e.currentTarget.style.background = 'transparent'
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
              color: '#94A3B8',
              background: 'transparent',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8'
              e.currentTarget.style.background = 'transparent'
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
        <div className="p-4 border-b border-gray-800">
          <StockSearch
            onSelect={handleAddStock}
            placeholder="Add stock to watchlist..."
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Watchlist items */}
      {isExpanded && (
        <div className="divide-y divide-gray-800">
          {symbols.length === 0 ? (
            <div style={{
              padding: 32,
              textAlign: 'center',
              color: '#64748B'
            }}>
              <svg style={{
                width: 48,
                height: 48,
                margin: '0 auto 12px',
                color: '#475569'
              }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p style={{ fontSize: 14 }}>Your watchlist is empty</p>
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
                  className={`p-4 hover:bg-gray-800/50 transition-colors cursor-move ${
                    isDragging ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Symbol and drag handle */}
                    <div className="flex items-center gap-3 flex-1">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      <div>
                        <div className="text-white font-semibold">{symbol}</div>
                        {quote && (
                          <div className="text-sm text-gray-500">
                            Vol: {formatNumber(quote.volume, 0)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Price and change */}
                    <div className="text-right flex-1">
                      {quote ? (
                        <>
                          <div className="text-white font-semibold">
                            ${formatNumber(quote.price)}
                          </div>
                          <div className={`text-sm ${changeColor}`}>
                            {isPositive ? '▲' : '▼'} {formatNumber(Math.abs(quote.change))} ({formatPercent(quote.changePercent)})
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">Loading...</div>
                      )}
                    </div>

                    {/* Right: Remove button */}
                    <div className="ml-4">
                      <button
                        onClick={() => handleRemoveStock(symbol)}
                        className={`p-2 rounded transition-colors ${
                          removeConfirm === symbol
                            ? 'bg-red-600 text-white'
                            : 'text-gray-500 hover:text-red-400 hover:bg-gray-800'
                        }`}
                        aria-label={removeConfirm === symbol ? 'Confirm remove' : 'Remove stock'}
                        title={removeConfirm === symbol ? 'Click again to confirm' : 'Remove from watchlist'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="p-3 border-t border-gray-800 text-xs text-gray-600">
          Drag to reorder • Real-time updates enabled
        </div>
      )}
    </div>
  );
};
