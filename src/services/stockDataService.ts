/**
 * Stock data service for fetching quotes, historical data, and search
 * Implements caching, debouncing, and exponential backoff retry logic
 * Enhanced with comprehensive error handling and user-friendly messages
 */

import type {
  StockQuote,
  HistoricalDataRequest,
  HistoricalDataResponse,
  SearchRequest,
  SearchResponse
} from '../types/stock-market';
import { 
  logError, 
  getErrorMessage, 
  getRetryAfterTime, 
  formatRetryAfterTime,
  ErrorType 
} from '../utils/errorHandling';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class StockDataService {
  private cache = new Map<string, CacheEntry<any>>();
  private searchDebounceTimer: NodeJS.Timeout | null = null;
  private readonly searchDebounceDelay = 300; // ms
  
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 8000 // 8 seconds
  };

  /**
   * Fetch a single stock quote
   * Returns cached data on failure if available
   */
  async fetchQuote(symbol: string): Promise<StockQuote> {
    const cacheKey = `quote:${symbol}`;
    const cached = this.getFromCache<StockQuote>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const quote = await this.fetchWithRetry<StockQuote>(
        `/api/quote/${symbol}`
      );

      this.setCache(cacheKey, quote, 60 * 1000); // 1 minute cache
      return quote;
    } catch (error) {
      logError(error as Error, {
        component: 'StockDataService',
        action: 'fetchQuote',
        symbol
      });

      // Return cached data if available, even if expired
      const expiredCache = this.cache.get(cacheKey);
      if (expiredCache) {
        console.warn(`Using expired cache for ${symbol} due to fetch failure`);
        return expiredCache.data as StockQuote;
      }

      throw new Error(getErrorMessage(error as Error, ErrorType.NETWORK));
    }
  }

  /**
   * Fetch multiple stock quotes in a batch
   * Returns cached data on failure if available
   */
  async fetchBatchQuotes(symbols: string[]): Promise<StockQuote[]> {
    if (symbols.length === 0) {
      return [];
    }

    const cacheKey = `quotes:${symbols.sort().join(',')}`;
    const cached = this.getFromCache<StockQuote[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const quotes = await this.fetchWithRetry<StockQuote[]>(
        `/api/quotes?symbols=${symbols.join(',')}`
      );

      this.setCache(cacheKey, quotes, 60 * 1000); // 1 minute cache
      return quotes;
    } catch (error) {
      logError(error as Error, {
        component: 'StockDataService',
        action: 'fetchBatchQuotes',
        metadata: { symbolCount: symbols.length }
      });

      // Return cached data if available, even if expired
      const expiredCache = this.cache.get(cacheKey);
      if (expiredCache) {
        console.warn(`Using expired cache for batch quotes due to fetch failure`);
        return expiredCache.data as StockQuote[];
      }

      throw new Error(getErrorMessage(error as Error, ErrorType.NETWORK));
    }
  }

  /**
   * Fetch historical data for a symbol
   * Returns cached data on failure if available
   */
  async fetchHistoricalData(
    request: HistoricalDataRequest
  ): Promise<HistoricalDataResponse> {
    const { symbol, interval, range } = request;
    const cacheKey = `history:${symbol}:${interval}:${range}`;
    const cached = this.getFromCache<HistoricalDataResponse>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.fetchWithRetry<HistoricalDataResponse>(
        `/api/stock/history/${symbol}?interval=${interval}&range=${range}`
      );

      // Cache TTL based on interval
      const cacheTTL = this.getHistoricalDataCacheTTL(interval);
      this.setCache(cacheKey, response, cacheTTL);
      
      return response;
    } catch (error) {
      logError(error as Error, {
        component: 'StockDataService',
        action: 'fetchHistoricalData',
        symbol,
        metadata: { interval, range }
      });

      // Return cached data if available, even if expired
      const expiredCache = this.cache.get(cacheKey);
      if (expiredCache) {
        console.warn(`Using expired cache for ${symbol} historical data due to fetch failure`);
        return expiredCache.data as HistoricalDataResponse;
      }

      throw new Error(getErrorMessage(error as Error, ErrorType.NETWORK));
    }
  }

  /**
   * Search for stocks with debouncing
   */
  searchStocks(
    query: string,
    options?: Partial<SearchRequest>
  ): Promise<SearchResponse> {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }

      // Set new timer
      this.searchDebounceTimer = setTimeout(async () => {
        try {
          const result = await this.performSearch(query, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, this.searchDebounceDelay);
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific key pattern
   */
  clearCachePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Private methods

  private async performSearch(
    query: string,
    options?: Partial<SearchRequest>
  ): Promise<SearchResponse> {
    if (!query.trim()) {
      return { results: [], query };
    }

    const params = new URLSearchParams({
      q: query,
      limit: String(options?.limit ?? 10)
    });

    if (options?.types && options.types.length > 0) {
      params.append('types', options.types.join(','));
    }

    try {
      const response = await this.fetchWithRetry<SearchResponse>(
        `/api/stock/search?${params.toString()}`
      );

      return response;
    } catch (error) {
      logError(error as Error, {
        component: 'StockDataService',
        action: 'performSearch',
        metadata: { query, options }
      });

      // Return empty results on search failure
      return { results: [], query };
    }
  }

  private async fetchWithRetry<T>(
    url: string,
    retryCount = 0
  ): Promise<T> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        // Handle rate limiting with retry-after header
        if (response.status === 429) {
          const retryAfter = getRetryAfterTime(response);
          if (retryAfter) {
            const timeStr = formatRetryAfterTime(retryAfter);
            throw new Error(`Rate limit exceeded. Service will resume in ${timeStr}.`);
          }
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Handle not found errors
        if (response.status === 404) {
          throw new Error('Stock symbol not found. Please try a different search.');
        }

        // Check if we should retry
        if (this.shouldRetry(response.status) && retryCount < this.retryConfig.maxRetries) {
          const delay = this.calculateBackoffDelay(retryCount);
          await this.sleep(delay);
          return this.fetchWithRetry<T>(url, retryCount + 1);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      // Don't retry on rate limit or not found errors
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Rate limit') || errorMessage.includes('not found')) {
        throw error;
      }

      // Retry on network errors
      if (retryCount < this.retryConfig.maxRetries) {
        const delay = this.calculateBackoffDelay(retryCount);
        await this.sleep(delay);
        return this.fetchWithRetry<T>(url, retryCount + 1);
      }

      throw error;
    }
  }

  private shouldRetry(status: number): boolean {
    // Retry on server errors and rate limiting
    return status >= 500 || status === 429;
  }

  private calculateBackoffDelay(retryCount: number): number {
    // Exponential backoff: baseDelay * 2^retryCount
    const delay = this.retryConfig.baseDelay * Math.pow(2, retryCount);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getHistoricalDataCacheTTL(interval: string): number {
    // Intraday data: 5 minutes cache
    if (['1m', '5m', '15m', '1h'].includes(interval)) {
      return 5 * 60 * 1000;
    }
    
    // Daily data: 1 hour cache
    return 60 * 60 * 1000;
  }
}

// Singleton instance
export const stockDataService = new StockDataService();
