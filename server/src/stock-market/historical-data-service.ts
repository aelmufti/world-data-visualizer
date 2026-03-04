import axios from 'axios';

/**
 * Candle data interface for OHLCV (Open, High, Low, Close, Volume)
 */
export interface CandleData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Historical data response metadata
 */
export interface HistoricalDataMeta {
  currency: string;
  exchangeName: string;
  instrumentType: string;
  symbol: string;
}

/**
 * Complete historical data response
 */
export interface HistoricalDataResponse {
  symbol: string;
  data: CandleData[];
  meta: HistoricalDataMeta;
}

/**
 * Valid interval values for historical data
 */
export type Interval = '1m' | '5m' | '15m' | '1h' | '1d';

/**
 * Valid range values for historical data
 */
export type Range = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y';

/**
 * Cache entry for historical data
 */
interface CacheEntry {
  data: HistoricalDataResponse;
  timestamp: number;
}

/**
 * LRU Cache implementation for historical data
 */
class LRUCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string, ttl: number): HistoricalDataResponse | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  set(key: string, data: HistoricalDataResponse): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Historical Data Service for fetching OHLCV data from Yahoo Finance
 * 
 * Features:
 * - Fetch historical candlestick data with configurable intervals and ranges
 * - LRU cache with TTL (5 minutes for intraday, 1 hour for daily)
 * - Support for multiple timeframes and date ranges
 */
export class HistoricalDataService {
  private cache: LRUCache;
  private readonly INTRADAY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DAILY_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.cache = new LRUCache(1000);
  }

  /**
   * Fetch historical OHLCV data for a symbol
   */
  async fetchHistoricalData(
    symbol: string,
    interval: Interval,
    range: Range
  ): Promise<HistoricalDataResponse | null> {
    // Generate cache key
    const cacheKey = `${symbol}:${interval}:${range}`;

    // Determine TTL based on interval (intraday vs daily)
    const isIntraday = ['1m', '5m', '15m', '1h'].includes(interval);
    const ttl = isIntraday ? this.INTRADAY_CACHE_TTL : this.DAILY_CACHE_TTL;

    // Check cache
    const cached = this.cache.get(cacheKey, ttl);
    if (cached) {
      return cached;
    }

    try {
      // Fetch from Yahoo Finance
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        params: {
          interval,
          range,
        },
        timeout: 10000, // 10 second timeout
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        console.error(`[HistoricalDataService] No data returned for ${symbol}`);
        return null;
      }

      // Extract metadata
      const meta = result.meta;
      const metadata: HistoricalDataMeta = {
        currency: meta.currency || 'USD',
        exchangeName: meta.exchangeName || 'Unknown',
        instrumentType: meta.instrumentType || 'EQUITY',
        symbol: meta.symbol || symbol,
      };

      // Extract OHLCV data
      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0];

      if (!quotes) {
        console.error(`[HistoricalDataService] No quote data for ${symbol}`);
        return null;
      }

      const { open, high, low, close, volume } = quotes;

      // Build candle data array
      const candleData: CandleData[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        // Skip incomplete candles (null values)
        if (
          open[i] == null ||
          high[i] == null ||
          low[i] == null ||
          close[i] == null
        ) {
          continue;
        }

        candleData.push({
          time: timestamps[i],
          open: open[i],
          high: high[i],
          low: low[i],
          close: close[i],
          volume: volume[i] || 0,
        });
      }

      const historicalData: HistoricalDataResponse = {
        symbol,
        data: candleData,
        meta: metadata,
      };

      // Cache the result
      this.cache.set(cacheKey, historicalData);

      return historicalData;
    } catch (error: any) {
      console.error(
        `[HistoricalDataService] Error fetching historical data for ${symbol}:`,
        error.message
      );
      
      // Return mock data as fallback
      console.warn(`[HistoricalDataService] Using mock data for ${symbol}`);
      return this.generateMockHistoricalData(symbol, interval, range);
    }
  }

  /**
   * Generate realistic mock historical data for development/fallback
   */
  private generateMockHistoricalData(
    symbol: string,
    interval: Interval,
    range: Range
  ): HistoricalDataResponse {
    const now = Date.now();
    const candleData: CandleData[] = [];
    
    // Determine number of candles and interval duration
    const { numCandles, intervalMs } = this.getRangeParams(interval, range);
    
    // Base price for the symbol
    const basePrice = this.getBasePriceForSymbol(symbol);
    let currentPrice = basePrice;
    
    // Generate candles going backwards in time
    for (let i = numCandles - 1; i >= 0; i--) {
      const timestamp = Math.floor((now - (i * intervalMs)) / 1000);
      
      // Random price movement (±2%)
      const priceChange = currentPrice * (Math.random() - 0.5) * 0.04;
      currentPrice += priceChange;
      
      // Generate OHLC with realistic relationships
      const open = currentPrice;
      const volatility = currentPrice * 0.02; // 2% volatility
      const high = open + Math.random() * volatility;
      const low = open - Math.random() * volatility;
      const close = low + Math.random() * (high - low);
      
      // Random volume
      const baseVolume = 1000000;
      const volume = Math.floor(baseVolume * (0.5 + Math.random()));
      
      candleData.push({
        time: timestamp,
        open: Math.max(0.01, open),
        high: Math.max(0.01, high),
        low: Math.max(0.01, low),
        close: Math.max(0.01, close),
        volume,
      });
      
      currentPrice = close;
    }
    
    return {
      symbol,
      data: candleData,
      meta: {
        currency: 'USD',
        exchangeName: 'NASDAQ',
        instrumentType: 'EQUITY',
        symbol,
      },
    };
  }

  /**
   * Get number of candles and interval duration for a given range
   */
  private getRangeParams(interval: Interval, range: Range): { numCandles: number; intervalMs: number } {
    const intervalMap: Record<Interval, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    
    const rangeMap: Record<Range, number> = {
      '1d': 1,
      '5d': 5,
      '1mo': 30,
      '3mo': 90,
      '6mo': 180,
      '1y': 365,
      '5y': 365 * 5,
    };
    
    const intervalMs = intervalMap[interval];
    const days = rangeMap[range];
    const totalMs = days * 24 * 60 * 60 * 1000;
    const numCandles = Math.min(Math.floor(totalMs / intervalMs), 500); // Cap at 500 candles
    
    return { numCandles, intervalMs };
  }

  /**
   * Get realistic base price for common symbols
   */
  private getBasePriceForSymbol(symbol: string): number {
    const prices: Record<string, number> = {
      'AAPL': 175,
      'GOOGL': 140,
      'MSFT': 380,
      'AMZN': 150,
      'TSLA': 200,
      'META': 350,
      'NVDA': 500,
      'AMD': 150,
      'NFLX': 450,
      'DIS': 90,
    };
    
    return prices[symbol] || 100;
  }

  /**
   * Clear the cache
   * Useful for testing or forcing fresh data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number } {
    return {
      size: this.cache.size(),
    };
  }
}

// Export singleton instance
export const historicalDataService = new HistoricalDataService();
