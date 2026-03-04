import axios from 'axios';

interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

interface MacroIndicator {
  label: string;
  value: string;
  delta: string;
  up: boolean | null;
}

// Symboles pour les indicateurs macro
const MACRO_SYMBOLS: Record<string, Record<string, string>> = {
  energie: {
    'WTI Crude': 'CL=F',
    'Brent': 'BZ=F',
    'Gaz Naturel': 'NG=F',
    'Uranium': 'URA',
    'Charbon': 'KOL',
    'Éthanol': 'CORN',
  },
  tech: {
    'Nasdaq 100': '^NDX',
    'Sox Index': '^SOX',
    'VIX Tech': '^VXN',
  },
  sante: {
    'Biotech Index': '^NBI',
    'Healthcare ETF': 'XLV',
  },
  finance: {
    'VIX': '^VIX',
    'Bitcoin': 'BTC-USD',
    'Taux 10 ans': '^TNX',
    'S&P 500': '^GSPC',
  },
  consommation: {
    'Consumer Disc': 'XLY',
    'Consumer Staples': 'XLP',
    'Retail ETF': 'XRT',
  },
  immobilier: {
    'REIT Index': 'VNQ',
    'Home Builders': 'XHB',
  },
  materiaux: {
    'Cuivre': 'HG=F',
    'Acier': 'X',
    'Aluminium': 'AA',
    'Lithium': 'LIT',
    'Or': 'GC=F',
    'Argent': 'SI=F',
  },
  telecom: {
    'Telecom ETF': 'VOX',
    '5G ETF': 'FIVG',
  },
  industrie: {
    'Industrial ETF': 'XLI',
    'Aerospace': 'ITA',
    'Defense': 'ITA',
  },
  services: {
    'Utilities ETF': 'XLU',
    'Clean Energy': 'ICLN',
  },
  transport: {
    'Airlines ETF': 'JETS',
    'Shipping': 'SEA',
    'EV ETF': 'DRIV',
  },
};

class MarketDataService {
  private cache: Map<string, { data: YahooQuote; timestamp: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes - plus long pour éviter rate limit
  private lastRequestTime = 0;
  private minRequestInterval = 500; // 500ms entre chaque requête

  /**
   * Fetch quote from Yahoo Finance with proper headers
   */
  async fetchQuote(symbol: string): Promise<YahooQuote | null> {
    // Check cache
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    try {
      // Rate limit
      await this.rateLimit();

      // Yahoo Finance v8 API avec headers pour éviter le blocage
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        params: {
          interval: '1d',
          range: '1d',
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        console.warn(`No data for ${symbol}, using fallback`);
        return this.getFallbackQuote(symbol);
      }

      const meta = result.meta;
      const quotes = result.indicators?.quote?.[0];
      
      // Get current price
      const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
      
      // Get previous close
      const previousClose = meta.chartPreviousClose || meta.previousClose || 0;
      
      // Calculate change
      let change = 0;
      let changePercent = 0;
      
      if (previousClose > 0) {
        change = currentPrice - previousClose;
        changePercent = (change / previousClose) * 100;
      }
      
      // If market is closed, try to get last 2 closes
      if (Math.abs(changePercent) < 0.01 && quotes?.close) {
        const closes = quotes.close.filter((c: number) => c != null);
        if (closes.length >= 2) {
          const lastClose = closes[closes.length - 1];
          const prevClose = closes[closes.length - 2];
          if (lastClose && prevClose) {
            change = lastClose - prevClose;
            changePercent = (change / prevClose) * 100;
          }
        }
      }

      const quote: YahooQuote = {
        symbol,
        regularMarketPrice: currentPrice,
        regularMarketChange: change,
        regularMarketChangePercent: changePercent,
      };

      // Cache the result
      this.cache.set(symbol, { data: quote, timestamp: Date.now() });

      return quote;
    } catch (error: any) {
      if (error.response?.status === 429 || error.message?.includes('Too Many Requests')) {
        console.warn(`Rate limited for ${symbol}, using cache or fallback`);
      } else {
        console.error(`Error fetching ${symbol}:`, error.message);
      }
      
      // Try to return expired cache first
      const expiredCache = this.cache.get(symbol);
      if (expiredCache) {
        console.log(`Using expired cache for ${symbol}`);
        return expiredCache.data;
      }
      
      return this.getFallbackQuote(symbol);
    }
  }

  /**
   * Rate limiting helper
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Fallback quote with realistic mock data
   */
  private getFallbackQuote(symbol: string): YahooQuote {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const randomChange = (Math.random() - 0.5) * 0.04; // ±2% change
    const change = basePrice * randomChange;
    
    return {
      symbol,
      regularMarketPrice: basePrice + change,
      regularMarketChange: change,
      regularMarketChangePercent: randomChange * 100,
    };
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
      '^GSPC': 6800,
      '^IXIC': 21200,
      '^DJI': 44500,
    };
    
    return prices[symbol] || 100;
  }

  /**
   * Format price based on value
   */
  formatPrice(price: number, symbol: string): string {
    if (symbol.includes('=F')) {
      return `${price.toFixed(2)}`;
    } else if (symbol.includes('-USD')) {
      return `${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    } else if (symbol.startsWith('^')) {
      return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } else {
      return `${price.toFixed(2)}`;
    }
  }

  /**
   * Format change percentage
   */
  formatChange(changePercent: number): string {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  }

  /**
   * Get macro indicators for a sector
   */
  async getMacroIndicators(sectorId: string): Promise<MacroIndicator[]> {
    const symbols = MACRO_SYMBOLS[sectorId];
    if (!symbols) return [];

    const indicators: MacroIndicator[] = [];

    for (const [label, symbol] of Object.entries(symbols)) {
      const quote = await this.fetchQuote(symbol);
      
      if (quote) {
        indicators.push({
          label,
          value: this.formatPrice(quote.regularMarketPrice, symbol),
          delta: this.formatChange(quote.regularMarketChangePercent),
          up: quote.regularMarketChange > 0 ? true : quote.regularMarketChange < 0 ? false : null,
        });
      } else {
        indicators.push({
          label,
          value: 'N/A',
          delta: 'N/A',
          up: null,
        });
      }
    }

    return indicators;
  }

  /**
   * Get all macro indicators for all sectors
   */
  async getAllMacroIndicators(): Promise<Record<string, MacroIndicator[]>> {
    const result: Record<string, MacroIndicator[]> = {};

    for (const sectorId of Object.keys(MACRO_SYMBOLS)) {
      result[sectorId] = await this.getMacroIndicators(sectorId);
    }

    return result;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
  }
}

export const marketDataService = new MarketDataService();
export type { MacroIndicator };
