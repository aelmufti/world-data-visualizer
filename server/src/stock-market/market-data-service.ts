import { marketDataService as baseMarketDataService } from '../market-data';

/**
 * Stock quote interface for real-time market data
 */
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  timestamp: string;
}

/**
 * Cache entry for stock quotes
 */
interface CacheEntry {
  data: StockQuote;
  timestamp: number;
}

/**
 * Market Data Service for Live Stock Market Tab
 * 
 * Extends existing Yahoo Finance integration with:
 * - Real-time quote fetching with 1-minute caching
 * - Batch quote endpoint support
 * - Price update polling for WebSocket broadcast
 */
export class MarketDataService {
  private quoteCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute cache
  private pollingInterval: NodeJS.Timeout | null = null;
  private subscribedSymbols: Set<string> = new Set();
  private updateCallback: ((symbol: string, quote: StockQuote) => void) | null = null;

  /**
   * Fetch a single stock quote with 1-minute caching
   */
  async fetchQuote(symbol: string): Promise<StockQuote | null> {
    // Check cache first
    const cached = this.quoteCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Use existing Yahoo Finance integration
      const yahooQuote = await baseMarketDataService.fetchQuote(symbol);
      
      if (!yahooQuote) {
        return null;
      }

      // Transform to StockQuote format
      const quote: StockQuote = {
        symbol: yahooQuote.symbol,
        price: yahooQuote.regularMarketPrice,
        change: yahooQuote.regularMarketChange,
        changePercent: yahooQuote.regularMarketChangePercent,
        volume: 0, // Yahoo Finance v8 API doesn't provide volume in meta
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      this.quoteCache.set(symbol, {
        data: quote,
        timestamp: Date.now(),
      });

      return quote;
    } catch (error: any) {
      console.error(`[MarketDataService] Error fetching quote for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch multiple stock quotes in batch
   * Optimized to reduce API calls by batching requests
   */
  async fetchBatchQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    const results = new Map<string, StockQuote>();
    const uncachedSymbols: string[] = [];

    // Check cache for each symbol
    for (const symbol of symbols) {
      const cached = this.quoteCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        results.set(symbol, cached.data);
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    // Fetch uncached symbols in parallel
    if (uncachedSymbols.length > 0) {
      const fetchPromises = uncachedSymbols.map(async (symbol) => {
        const quote = await this.fetchQuote(symbol);
        if (quote) {
          results.set(symbol, quote);
        }
      });

      await Promise.all(fetchPromises);
    }

    return results;
  }

  /**
   * Start polling for price updates
   * Used by WebSocket server to broadcast real-time updates
   */
  startPricePolling(
    symbols: string[],
    callback: (symbol: string, quote: StockQuote) => void,
    intervalMs: number = 5000 // Poll every 5 seconds
  ): void {
    // Stop existing polling if any
    this.stopPricePolling();

    // Store subscribed symbols and callback
    this.subscribedSymbols = new Set(symbols);
    this.updateCallback = callback;

    // Start polling
    this.pollingInterval = setInterval(async () => {
      await this.pollPriceUpdates();
    }, intervalMs);

    // Initial poll
    this.pollPriceUpdates();
  }

  /**
   * Stop price polling
   */
  stopPricePolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.subscribedSymbols.clear();
    this.updateCallback = null;
  }

  /**
   * Add symbols to polling subscription
   */
  addSymbolsToPolling(symbols: string[]): void {
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
  }

  /**
   * Remove symbols from polling subscription
   */
  removeSymbolsFromPolling(symbols: string[]): void {
    symbols.forEach(symbol => this.subscribedSymbols.delete(symbol));
  }

  /**
   * Get currently subscribed symbols
   */
  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  /**
   * Internal method to poll price updates for subscribed symbols
   */
  private async pollPriceUpdates(): Promise<void> {
    if (this.subscribedSymbols.size === 0 || !this.updateCallback) {
      return;
    }

    const symbols = Array.from(this.subscribedSymbols);
    
    // Fetch quotes in parallel
    const fetchPromises = symbols.map(async (symbol) => {
      try {
        // Force fresh fetch by clearing cache for this symbol
        this.quoteCache.delete(symbol);
        
        const quote = await this.fetchQuote(symbol);
        if (quote && this.updateCallback) {
          this.updateCallback(symbol, quote);
        }
      } catch (error: any) {
        console.error(`[MarketDataService] Error polling ${symbol}:`, error.message);
      }
    });

    await Promise.all(fetchPromises);
  }

  /**
   * Clear the quote cache
   * Useful for testing or forcing fresh data
   */
  clearCache(): void {
    this.quoteCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; symbols: string[] } {
    return {
      size: this.quoteCache.size,
      symbols: Array.from(this.quoteCache.keys()),
    };
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();
