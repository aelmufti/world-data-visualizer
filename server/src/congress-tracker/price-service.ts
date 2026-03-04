// Yahoo Finance price lookup and win rate calculation
import { congressDb } from './database.js';

interface YahooQuote {
  date: string;
  close: number;
}

export class PriceService {
  private yahooBaseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';

  async getHistoricalPrice(ticker: string, date: string): Promise<number | null> {
    // Check cache first
    const cached = await congressDb.getCachedPrice(ticker, date);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const timestamp = Math.floor(new Date(date).getTime() / 1000);
      const period1 = timestamp - 86400; // 1 day before
      const period2 = timestamp + 86400; // 1 day after

      const url = `${this.yahooBaseUrl}/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, { signal: controller.signal });
        
        if (!response.ok) {
          await congressDb.setCachedPrice(ticker, date, null);
          return null;
        }

        const data = await response.json();
        
        const result = data?.chart?.result?.[0];
        if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
          await congressDb.setCachedPrice(ticker, date, null);
          return null;
        }

        const timestamps = result.timestamp;
        const closes = result.indicators.quote[0].close;

        // Find closest date
        let closestPrice = null;
        let minDiff = Infinity;

        for (let i = 0; i < timestamps.length; i++) {
          const ts = timestamps[i];
          const close = closes[i];
          
          if (close !== null) {
            const diff = Math.abs(ts - timestamp);
            if (diff < minDiff) {
              minDiff = diff;
              closestPrice = close;
            }
          }
        }

        await congressDb.setCachedPrice(ticker, date, closestPrice);
        return closestPrice;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.error(`Error fetching price for ${ticker} on ${date}:`, error);
      await congressDb.setCachedPrice(ticker, date, null);
      return null;
    }
  }

  async getCurrentPrice(ticker: string): Promise<number | null> {
    try {
      const url = `${this.yahooBaseUrl}/${ticker}?range=1d&interval=1d`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, { signal: controller.signal });
        
        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        
        const result = data?.chart?.result?.[0];
        const currentPrice = result?.meta?.regularMarketPrice;

        return currentPrice || null;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.error(`Error fetching current price for ${ticker}:`, error);
      return null;
    }
  }

  async calculateTradePerformance(trade: any): Promise<{
    priceAtTrade: number | null;
    priceNow: number | null;
    returnPct: number | null;
    isWin: boolean | null;
  }> {
    const priceAtTrade = await this.getHistoricalPrice(trade.ticker, trade.transaction_date);
    const priceNow = await this.getCurrentPrice(trade.ticker);

    if (priceAtTrade === null || priceNow === null) {
      return {
        priceAtTrade,
        priceNow,
        returnPct: null,
        isWin: null
      };
    }

    const returnPct = ((priceNow - priceAtTrade) / priceAtTrade) * 100;

    let isWin: boolean | null = null;
    
    if (trade.action === 'Purchase') {
      // Purchase is a win if price went UP
      isWin = returnPct > 0;
    } else if (trade.action === 'Sale' || trade.action === 'Sale (Partial)') {
      // Sale is a win if price went DOWN
      isWin = returnPct < 0;
    }

    return {
      priceAtTrade,
      priceNow,
      returnPct: Math.round(returnPct * 10) / 10,
      isWin
    };
  }

  async calculatePoliticianWinRate(politician: string): Promise<{
    winRate: number | null;
    totalTrades: number;
    resolvedTrades: number;
  }> {
    const trades = await congressDb.getTradesByPolitician(politician);
    
    let wins = 0;
    let resolved = 0;

    for (const trade of trades) {
      const perf = await this.calculateTradePerformance(trade);
      
      if (perf.isWin !== null) {
        resolved++;
        if (perf.isWin) {
          wins++;
        }
      }
    }

    const winRate = resolved > 0 ? wins / resolved : null;

    return {
      winRate,
      totalTrades: trades.length,
      resolvedTrades: resolved
    };
  }
}

export const priceService = new PriceService();
