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

// Symboles Yahoo Finance pour les indicateurs macro
const MACRO_SYMBOLS: Record<string, Record<string, string>> = {
  energie: {
    'WTI Crude': 'CL=F',
    'Brent': 'BZ=F',
    'Gaz Naturel': 'NG=F',
    'Uranium': 'URA',           // Global X Uranium ETF
    'Charbon': 'KOL',           // VanEck Coal ETF
    'Éthanol': 'CORN',          // Corn futures (proxy)
  },
  tech: {
    'Nasdaq 100': '^NDX',
    'Sox Index': '^SOX',
    'VIX Tech': '^VXN',         // Nasdaq VIX
  },
  sante: {
    'Biotech Index': '^NBI',    // Nasdaq Biotech
    'Healthcare ETF': 'XLV',    // Health Care Select Sector
  },
  finance: {
    'VIX': '^VIX',
    'Bitcoin': 'BTC-USD',
    'Taux 10 ans': '^TNX',
    'S&P 500': '^GSPC',
  },
  consommation: {
    'Consumer Disc': 'XLY',     // Consumer Discretionary ETF
    'Consumer Staples': 'XLP',  // Consumer Staples ETF
    'Retail ETF': 'XRT',
  },
  immobilier: {
    'REIT Index': 'VNQ',        // Vanguard Real Estate ETF
    'Home Builders': 'XHB',     // SPDR Homebuilders ETF
  },
  materiaux: {
    'Cuivre': 'HG=F',
    'Acier': 'X',               // US Steel
    'Aluminium': 'AA',          // Alcoa
    'Lithium': 'LIT',           // Global X Lithium ETF
    'Or': 'GC=F',               // Gold futures
    'Argent': 'SI=F',           // Silver futures
  },
  telecom: {
    'Telecom ETF': 'VOX',       // Vanguard Telecom ETF
    '5G ETF': 'FIVG',           // Defiance 5G ETF
  },
  industrie: {
    'Industrial ETF': 'XLI',    // Industrial Select Sector
    'Aerospace': 'ITA',         // iShares Aerospace ETF
    'Defense': 'ITA',           // Same as aerospace
  },
  services: {
    'Utilities ETF': 'XLU',     // Utilities Select Sector
    'Clean Energy': 'ICLN',     // iShares Clean Energy ETF
  },
  transport: {
    'Airlines ETF': 'JETS',     // US Global Jets ETF
    'Shipping': 'SEA',          // Shipping ETF
    'EV ETF': 'DRIV',           // Global X Autonomous & EV ETF
  },
};

class MarketDataService {
  private cache: Map<string, { data: YahooQuote; timestamp: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch quote from Yahoo Finance
   */
  async fetchQuote(symbol: string): Promise<YahooQuote | null> {
    // Check cache
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    try {
      // Yahoo Finance v8 API (unofficial but widely used)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        params: {
          interval: '1d',
          range: '5d',
        },
        timeout: 5000,
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta;
      const quotes = result.indicators?.quote?.[0];
      
      // Get current price (regularMarketPrice or last close)
      const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
      
      // Get previous close
      const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
      
      // Calculate change
      let change = 0;
      let changePercent = 0;
      
      if (previousClose > 0) {
        change = currentPrice - previousClose;
        changePercent = (change / previousClose) * 100;
      }
      
      // If market is closed, try to get last 2 closes to calculate change
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
      console.error(`Error fetching ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Format price based on value
   */
  formatPrice(price: number, symbol: string): string {
    if (symbol.includes('=F')) {
      // Futures
      return `$${price.toFixed(2)}`;
    } else if (symbol.includes('-USD')) {
      // Crypto
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    } else if (symbol.startsWith('^')) {
      // Indices
      return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } else {
      // Stocks/ETFs
      return `$${price.toFixed(2)}`;
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
        // Fallback to placeholder if fetch fails
        indicators.push({
          label,
          value: 'N/A',
          delta: 'N/A',
          up: null,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
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
