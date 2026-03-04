/**
 * Type definitions for the Live Stock Market Tab feature
 */

// Stock Quote
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  timestamp: string;
  type?: 'stock' | 'index' | 'etf' | 'bond' | 'trust' | 'commodity' | 'crypto';
}

// Candle Data for charts
export interface CandleData {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Timeframe options
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '1d' | '5d' | '1M' | '3M' | '6M' | '1Y' | '5Y';

// Market Index
export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  lastUpdate: string;
}

// Price Alert
export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  enabled: boolean;
  createdAt: string;
  triggeredAt?: string;
}

// Market Session Status
export interface MarketSessionStatus {
  isOpen: boolean;
  session: 'regular' | 'pre-market' | 'after-hours' | 'closed';
}

// Market Event
export interface MarketEvent {
  type: 'open' | 'close';
  time: Date;
  countdown: string;
}

// Market Status
export interface MarketStatus {
  market: string;
  isOpen: boolean;
  session: 'regular' | 'pre-market' | 'after-hours' | 'closed';
  nextEvent: MarketEvent;
}

// Stock Metrics
export interface StockMetrics {
  symbol: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  ytdChange: number;
  avgVolume30d: number;
  peRatio?: number;
  marketCap?: number;
  dividendYield?: number;
  beta?: number;
}

// Watchlist Item
export interface WatchlistItem {
  symbol: string;
  addedAt: string;
  order: number;
}

// Heatmap Data
export interface HeatmapData {
  symbol: string;
  name: string;
  sector: string;
  marketCap: number;
  changePercent: number;
  volume: number;
}

// Search Result
export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: 'stock' | 'index' | 'etf' | 'bond' | 'trust' | 'commodity' | 'crypto';
}

// Component Props Interfaces

export interface IndexDisplayProps {
  indexes: MarketIndex[];
  loading: boolean;
  onIndexClick: (symbol: string) => void;
}

export interface CandlestickChartProps {
  symbol: string;
  timeframe: Timeframe;
  data: CandleData[];
  onTimeframeChange: (tf: Timeframe) => void;
  realTimeUpdate?: boolean;
}

export interface StockSearchProps {
  onSelect: (symbol: string) => void;
  placeholder?: string;
}

export interface WatchlistPanelProps {
  symbols: string[];
  prices: Map<string, StockQuote>;
  onAdd: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  onReorder: (from: number, to: number) => void;
}

export interface AlertPanelProps {
  alerts: PriceAlert[];
  onCreate: (alert: PriceAlert) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, alert: PriceAlert) => void;
}

export interface MarketStatusIndicatorProps {
  market: 'US' | 'EU' | 'ASIA';
  status: MarketSessionStatus;
  nextEvent: MarketEvent;
}

export interface HeatmapViewProps {
  data: HeatmapData[];
  onCellClick: (symbol: string) => void;
}

export interface ComparisonViewProps {
  symbols: string[];
  timeframe: Timeframe;
  onAddSymbol: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
}

// WebSocket Message Types

export type WSClientMessage = 
  | { type: 'subscribe'; symbols: string[] }
  | { type: 'unsubscribe'; symbols: string[] }
  | { type: 'ping' };

export type WSServerMessage =
  | { type: 'quote'; data: StockQuote }
  | { type: 'error'; message: string }
  | { type: 'pong' };

// API Request/Response Types

export interface HistoricalDataRequest {
  symbol: string;
  interval: '1m' | '5m' | '15m' | '1h' | '1d';
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y';
}

export interface HistoricalDataResponse {
  symbol: string;
  data: CandleData[];
  meta: {
    currency: string;
    exchangeName: string;
    instrumentType: string;
  };
}

export interface SearchRequest {
  q: string;
  limit?: number;
  types?: ('stock' | 'index' | 'etf' | 'bond' | 'trust' | 'commodity' | 'crypto')[];
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

// LocalStorage Schema Types

export interface WatchlistStorage {
  version: 1;
  symbols: string[];
  lastUpdated: string;
}

export interface AlertsStorage {
  version: 1;
  alerts: PriceAlert[];
  lastUpdated: string;
}

export interface PreferencesStorage {
  version: 1;
  defaultTimeframe: Timeframe;
  defaultView: 'overview' | 'chart' | 'heatmap' | 'comparison';
  chartTheme: 'dark' | 'light';
  enableNotifications: boolean;
}

export interface RecentSearchesStorage {
  version: 1;
  searches: string[];
  maxItems: 10;
}

// Backend Types

export interface YahooQuoteResponse {
  chart: {
    result: [{
      meta: {
        symbol: string;
        regularMarketPrice: number;
        previousClose: number;
        currency: string;
        exchangeName: string;
      };
      timestamp: number[];
      indicators: {
        quote: [{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }];
      };
    }];
  };
}

export interface SymbolEntry {
  symbol: string;
  name: string;
  exchange: string;
  type: 'stock' | 'index' | 'etf' | 'bond' | 'trust' | 'commodity' | 'crypto';
  sector?: string;
  country: string;
}

export interface Subscription {
  clientId: string;
  symbols: Set<string>;
  lastPing: number;
}

export interface MarketHours {
  market: string;
  timezone: string;
  regularHours: { open: string; close: string };
  preMarket?: { open: string; close: string };
  afterHours?: { open: string; close: string };
  holidays: string[];
}

// State Management Types

export interface StockMarketState {
  activeView: 'overview' | 'chart' | 'heatmap' | 'comparison';
  selectedSymbol: string | null;
  watchlist: string[];
  alerts: PriceAlert[];
  marketStatus: MarketStatus;
}
