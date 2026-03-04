import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MarketDataService, StockQuote } from './market-data-service';
import { marketDataService as baseMarketDataService } from '../market-data';

// Mock the base market data service
vi.mock('../market-data', () => ({
  marketDataService: {
    fetchQuote: vi.fn(),
  },
}));

describe('MarketDataService', () => {
  let service: MarketDataService;
  const mockBaseService = baseMarketDataService as any;

  beforeEach(() => {
    service = new MarketDataService();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    service.stopPricePolling();
    service.clearCache();
    vi.useRealTimers();
  });

  describe('fetchQuote', () => {
    it('should fetch a single stock quote successfully', async () => {
      const mockYahooQuote = {
        symbol: 'AAPL',
        regularMarketPrice: 150.25,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.69,
      };

      mockBaseService.fetchQuote.mockResolvedValue(mockYahooQuote);

      const quote = await service.fetchQuote('AAPL');

      expect(quote).toBeDefined();
      expect(quote?.symbol).toBe('AAPL');
      expect(quote?.price).toBe(150.25);
      expect(quote?.change).toBe(2.50);
      expect(quote?.changePercent).toBe(1.69);
      expect(quote?.timestamp).toBeDefined();
      expect(mockBaseService.fetchQuote).toHaveBeenCalledWith('AAPL');
    });

    it('should return null when base service returns null', async () => {
      mockBaseService.fetchQuote.mockResolvedValue(null);

      const quote = await service.fetchQuote('INVALID');

      expect(quote).toBeNull();
    });

    it('should cache quotes for 1 minute', async () => {
      const mockYahooQuote = {
        symbol: 'AAPL',
        regularMarketPrice: 150.25,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.69,
      };

      mockBaseService.fetchQuote.mockResolvedValue(mockYahooQuote);

      // First fetch
      await service.fetchQuote('AAPL');
      expect(mockBaseService.fetchQuote).toHaveBeenCalledTimes(1);

      // Second fetch within 1 minute - should use cache
      await service.fetchQuote('AAPL');
      expect(mockBaseService.fetchQuote).toHaveBeenCalledTimes(1);

      // Advance time by 61 seconds
      vi.advanceTimersByTime(61 * 1000);

      // Third fetch after cache expiry - should fetch again
      await service.fetchQuote('AAPL');
      expect(mockBaseService.fetchQuote).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      mockBaseService.fetchQuote.mockRejectedValue(new Error('Network error'));

      const quote = await service.fetchQuote('AAPL');

      expect(quote).toBeNull();
    });
  });

  describe('fetchBatchQuotes', () => {
    it('should fetch multiple quotes in batch', async () => {
      const mockQuotes = {
        AAPL: {
          symbol: 'AAPL',
          regularMarketPrice: 150.25,
          regularMarketChange: 2.50,
          regularMarketChangePercent: 1.69,
        },
        GOOGL: {
          symbol: 'GOOGL',
          regularMarketPrice: 2800.50,
          regularMarketChange: -15.25,
          regularMarketChangePercent: -0.54,
        },
        MSFT: {
          symbol: 'MSFT',
          regularMarketPrice: 380.75,
          regularMarketChange: 5.00,
          regularMarketChangePercent: 1.33,
        },
      };

      mockBaseService.fetchQuote.mockImplementation((symbol: string) => {
        return Promise.resolve(mockQuotes[symbol as keyof typeof mockQuotes]);
      });

      const results = await service.fetchBatchQuotes(['AAPL', 'GOOGL', 'MSFT']);

      expect(results.size).toBe(3);
      expect(results.get('AAPL')?.price).toBe(150.25);
      expect(results.get('GOOGL')?.price).toBe(2800.50);
      expect(results.get('MSFT')?.price).toBe(380.75);
    });

    it('should use cached quotes when available', async () => {
      const mockYahooQuote = {
        symbol: 'AAPL',
        regularMarketPrice: 150.25,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.69,
      };

      mockBaseService.fetchQuote.mockResolvedValue(mockYahooQuote);

      // Pre-populate cache
      await service.fetchQuote('AAPL');
      expect(mockBaseService.fetchQuote).toHaveBeenCalledTimes(1);

      // Batch fetch should use cache for AAPL
      const results = await service.fetchBatchQuotes(['AAPL', 'GOOGL']);

      // Should only fetch GOOGL (AAPL is cached)
      expect(mockBaseService.fetchQuote).toHaveBeenCalledTimes(2);
      expect(results.size).toBeGreaterThanOrEqual(1);
    });

    it('should handle partial failures in batch', async () => {
      mockBaseService.fetchQuote.mockImplementation((symbol: string) => {
        if (symbol === 'INVALID') {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          symbol,
          regularMarketPrice: 100,
          regularMarketChange: 1,
          regularMarketChangePercent: 1,
        });
      });

      const results = await service.fetchBatchQuotes(['AAPL', 'INVALID', 'GOOGL']);

      expect(results.size).toBe(2);
      expect(results.has('AAPL')).toBe(true);
      expect(results.has('INVALID')).toBe(false);
      expect(results.has('GOOGL')).toBe(true);
    });
  });

  describe('price polling', () => {
    it('should start polling and call callback with updates', async () => {
      vi.useRealTimers(); // Use real timers for this test
      
      const mockYahooQuote = {
        symbol: 'AAPL',
        regularMarketPrice: 150.25,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.69,
      };

      mockBaseService.fetchQuote.mockResolvedValue(mockYahooQuote);

      const callback = vi.fn();
      service.startPricePolling(['AAPL'], callback, 5000);

      // Wait for initial poll to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0]).toBe('AAPL');
      expect(callback.mock.calls[0][1]).toMatchObject({
        symbol: 'AAPL',
        price: 150.25,
      });
      
      vi.useFakeTimers(); // Restore fake timers
    });

    it('should poll at specified interval', async () => {
      vi.useRealTimers(); // Use real timers for this test
      
      const mockYahooQuote = {
        symbol: 'AAPL',
        regularMarketPrice: 150.25,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.69,
      };

      mockBaseService.fetchQuote.mockResolvedValue(mockYahooQuote);

      const callback = vi.fn();
      service.startPricePolling(['AAPL'], callback, 500); // Short interval for testing

      // Wait for initial poll
      await new Promise(resolve => setTimeout(resolve, 100));
      const initialCallCount = callback.mock.calls.length;

      // Wait for next poll
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(callback.mock.calls.length).toBeGreaterThan(initialCallCount);
      
      vi.useFakeTimers(); // Restore fake timers
    });

    it('should stop polling when requested', async () => {
      vi.useRealTimers(); // Use real timers for this test
      
      const mockYahooQuote = {
        symbol: 'AAPL',
        regularMarketPrice: 150.25,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.69,
      };

      mockBaseService.fetchQuote.mockResolvedValue(mockYahooQuote);

      const callback = vi.fn();
      service.startPricePolling(['AAPL'], callback, 500);

      await new Promise(resolve => setTimeout(resolve, 100));
      const callCountBeforeStop = callback.mock.calls.length;

      service.stopPricePolling();

      // Wait - should not trigger more calls
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(callback.mock.calls.length).toBe(callCountBeforeStop);
      
      vi.useFakeTimers(); // Restore fake timers
    });

    it('should add symbols to polling subscription', async () => {
      const mockYahooQuote = {
        symbol: 'AAPL',
        regularMarketPrice: 150.25,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.69,
      };

      mockBaseService.fetchQuote.mockResolvedValue(mockYahooQuote);

      const callback = vi.fn();
      service.startPricePolling(['AAPL'], callback, 5000);

      service.addSymbolsToPolling(['GOOGL', 'MSFT']);

      const subscribed = service.getSubscribedSymbols();
      expect(subscribed).toContain('AAPL');
      expect(subscribed).toContain('GOOGL');
      expect(subscribed).toContain('MSFT');
    });

    it('should remove symbols from polling subscription', async () => {
      const callback = vi.fn();
      service.startPricePolling(['AAPL', 'GOOGL', 'MSFT'], callback, 5000);

      service.removeSymbolsFromPolling(['GOOGL']);

      const subscribed = service.getSubscribedSymbols();
      expect(subscribed).toContain('AAPL');
      expect(subscribed).not.toContain('GOOGL');
      expect(subscribed).toContain('MSFT');
    });

    it('should force fresh fetch during polling (bypass cache)', async () => {
      vi.useRealTimers(); // Use real timers for this test
      
      const mockYahooQuote = {
        symbol: 'AAPL',
        regularMarketPrice: 150.25,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.69,
      };

      mockBaseService.fetchQuote.mockResolvedValue(mockYahooQuote);

      // Pre-populate cache
      await service.fetchQuote('AAPL');
      expect(mockBaseService.fetchQuote).toHaveBeenCalledTimes(1);

      const callback = vi.fn();
      service.startPricePolling(['AAPL'], callback, 5000);

      // Wait for initial poll to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should fetch fresh data (not use cache)
      expect(mockBaseService.fetchQuote).toHaveBeenCalledTimes(2);
      
      vi.useFakeTimers(); // Restore fake timers
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const mockYahooQuote = {
        symbol: 'AAPL',
        regularMarketPrice: 150.25,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.69,
      };

      mockBaseService.fetchQuote.mockResolvedValue(mockYahooQuote);

      await service.fetchQuote('AAPL');
      
      let stats = service.getCacheStats();
      expect(stats.size).toBe(1);

      service.clearCache();

      stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', async () => {
      const mockYahooQuote = {
        symbol: 'AAPL',
        regularMarketPrice: 150.25,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.69,
      };

      mockBaseService.fetchQuote.mockResolvedValue(mockYahooQuote);

      await service.fetchQuote('AAPL');
      await service.fetchQuote('GOOGL');

      const stats = service.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.symbols).toContain('AAPL');
      expect(stats.symbols).toContain('GOOGL');
    });
  });
});
