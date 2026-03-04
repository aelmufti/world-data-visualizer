/**
 * StockDetailView Component
 * 
 * Displays comprehensive stock information including:
 * - Current price, change, and percentage change
 * - Volume and market cap
 * - Performance metrics (52-week high/low, YTD change, 30-day avg volume)
 * - Conditional metrics (P/E ratio, dividend yield, beta)
 * - Interactive candlestick chart
 * - Real-time price updates via WebSocket
 */

import { useState, useEffect } from 'react';
import type { StockQuote, StockMetrics, Timeframe } from '../../types/stock-market';
import { CandlestickChart } from './CandlestickChart';
import { stockDataService } from '../../services/stockDataService';
import { stockWebSocket } from '../../services/stockWebSocket';

interface StockDetailViewProps {
  symbol: string;
  onClose?: () => void;
  onAddToWatchlist?: (symbol: string) => void;
  onRemoveFromWatchlist?: (symbol: string) => void;
  isInWatchlist?: boolean;
}

export const StockDetailView: React.FC<StockDetailViewProps> = ({ 
  symbol, 
  onClose,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isInWatchlist = false
}) => {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [metrics, setMetrics] = useState<StockMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch quote
        const quoteData = await stockDataService.fetchQuote(symbol);
        setQuote(quoteData);

        // TODO: Fetch metrics from API when endpoint is available
        // For now, using mock data structure
        setMetrics({
          symbol,
          fiftyTwoWeekHigh: 0,
          fiftyTwoWeekLow: 0,
          ytdChange: 0,
          avgVolume30d: 0,
        });
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  // Subscribe to real-time updates
  useEffect(() => {
    const handleQuoteUpdate = (data: StockQuote) => {
      if (data.symbol === symbol) {
        setQuote(data);
      }
    };

    stockWebSocket.on('quote', handleQuoteUpdate);
    stockWebSocket.subscribe([symbol]);

    return () => {
      stockWebSocket.off('quote', handleQuoteUpdate);
      stockWebSocket.unsubscribe([symbol]);
    };
  }, [symbol]);

  const formatNumber = (num: number | undefined, decimals = 2): string => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatLargeNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercent = (num: number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="bg-[#0A1628] rounded-lg border border-gray-800 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-400">Loading stock data...</span>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="bg-[#0A1628] rounded-lg border border-gray-800 p-8">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 mb-4">{error || 'Failed to load stock data'}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const isPositive = quote.change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const changeBgColor = isPositive ? 'bg-green-900/20' : 'bg-red-900/20';

  return (
    <div className="w-full space-y-4">
      {/* Compact Header */}
      <div className="bg-[#0A1628] rounded-lg border border-gray-800 p-4">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">{symbol}</h2>
            <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-800 rounded">
              {quote.type || 'Stock'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {(onAddToWatchlist || onRemoveFromWatchlist) && (
              <button
                onClick={() => isInWatchlist ? onRemoveFromWatchlist?.(symbol) : onAddToWatchlist?.(symbol)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  isInWatchlist
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {isInWatchlist ? '★ Watchlist' : '☆ Add'}
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1.5"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-3xl font-bold text-white">
            ${formatNumber(quote.price)}
          </span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded ${changeBgColor}`}>
            <span className={`${changeColor} font-semibold text-sm`}>
              {isPositive ? '▲' : '▼'} {formatNumber(Math.abs(quote.change))}
            </span>
            <span className={`${changeColor} text-sm`}>
              ({formatPercent(quote.changePercent)})
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="bg-[#060B14] rounded-lg p-2.5">
            <div className="text-xs text-gray-500 mb-1">Volume</div>
            <div className="text-sm text-white font-semibold truncate">
              {formatLargeNumber(quote.volume)}
            </div>
          </div>
          <div className="bg-[#060B14] rounded-lg p-2.5">
            <div className="text-xs text-gray-500 mb-1">Market Cap</div>
            <div className="text-sm text-white font-semibold truncate">
              {formatLargeNumber(quote.marketCap)}
            </div>
          </div>
          {metrics && (
            <>
              <div className="bg-[#060B14] rounded-lg p-2.5">
                <div className="text-xs text-gray-500 mb-1">52W High</div>
                <div className="text-sm text-white font-semibold truncate">
                  ${formatNumber(metrics.fiftyTwoWeekHigh)}
                </div>
              </div>
              <div className="bg-[#060B14] rounded-lg p-2.5">
                <div className="text-xs text-gray-500 mb-1">52W Low</div>
                <div className="text-sm text-white font-semibold truncate">
                  ${formatNumber(metrics.fiftyTwoWeekLow)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Last update */}
        <div className="text-xs text-gray-600">
          Updated: {new Date(quote.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full">
        <CandlestickChart
          symbol={symbol}
          timeframe={timeframe}
          data={[]}
          onTimeframeChange={setTimeframe}
          realTimeUpdate={true}
        />
      </div>

      {/* Performance Metrics */}
      {metrics && (metrics.ytdChange !== 0 || metrics.avgVolume30d !== 0 || metrics.peRatio || metrics.dividendYield || metrics.beta) && (
        <div className="bg-[#0A1628] rounded-lg border border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Performance Metrics</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {metrics.ytdChange !== 0 && (
              <div className="p-2.5 bg-[#060B14] rounded-lg">
                <div className="text-xs text-gray-500 mb-1">YTD Change</div>
                <div className={`text-base font-semibold ${metrics.ytdChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(metrics.ytdChange)}
                </div>
              </div>
            )}

            {metrics.avgVolume30d !== 0 && (
              <div className="p-2.5 bg-[#060B14] rounded-lg">
                <div className="text-xs text-gray-500 mb-1">30D Avg Volume</div>
                <div className="text-base text-white font-semibold truncate">
                  {formatLargeNumber(metrics.avgVolume30d)}
                </div>
              </div>
            )}

            {metrics.peRatio !== undefined && (
              <div className="p-2.5 bg-[#060B14] rounded-lg">
                <div className="text-xs text-gray-500 mb-1">P/E Ratio</div>
                <div className="text-base text-white font-semibold">
                  {formatNumber(metrics.peRatio)}
                </div>
              </div>
            )}

            {metrics.dividendYield !== undefined && (
              <div className="p-2.5 bg-[#060B14] rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Dividend Yield</div>
                <div className="text-base text-white font-semibold">
                  {formatPercent(metrics.dividendYield)}
                </div>
              </div>
            )}

            {metrics.beta !== undefined && (
              <div className="p-2.5 bg-[#060B14] rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Beta</div>
                <div className="text-base text-white font-semibold">
                  {formatNumber(metrics.beta)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
