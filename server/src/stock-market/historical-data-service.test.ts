import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import {
  HistoricalDataService,
  CandleData,
  HistoricalDataResponse,
} from './historical-data-service';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('HistoricalDataService', () => {
  let service: HistoricalDataService;

  beforeEach(() => {
    service = new HistoricalDataService();
    service.clearCache();
    vi.clearAllMocks();
  });

  describe('fetchHistoricalData', () => {
    it('should fetch and return historical OHLCV data', async () => {
      // Mock Yahoo Finance response
      const mockResponse = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  currency: 'USD',
                  exchangeName: 'NASDAQ',
                  instrumentType: 'EQUITY',
                  symbol: 'AAPL',
                },
                timestamp: [1704067200, 1704153600, 1704240000],
                indicators: {
                  quote: [
                    {
                      open: [150.0, 151.0, 152.0],
                      high: [152.0, 153.0, 154.0],
                      low: [149.0, 150.0, 151.0],
                      close: [151.0, 152.0, 153.0],
                      volume: [1000000, 1100000, 1200000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.fetchHistoricalData('AAPL', '1d', '5d');

      expect(result).not.toBeNull();
      expect(result?.symbol).toBe('AAPL');
      expect(result?.data).toHaveLength(3);
      expect(result?.meta.currency).toBe('USD');
      expect(result?.meta.exchangeName).toBe('NASDAQ');

      // Verify first candle
      expect(result?.data[0]).toEqual({
        time: 1704067200,
        open: 150.0,
        high: 152.0,
        low: 149.0,
        close: 151.0,
        volume: 1000000,
      });
    });

    it('should skip incomplete candles with null values', async () => {
      const mockResponse = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  currency: 'USD',
                  exchangeName: 'NASDAQ',
                  instrumentType: 'EQUITY',
                  symbol: 'AAPL',
                },
                timestamp: [1704067200, 1704153600, 1704240000],
                indicators: {
                  quote: [
                    {
                      open: [150.0, null, 152.0],
                      high: [152.0, null, 154.0],
                      low: [149.0, null, 151.0],
                      close: [151.0, null, 153.0],
                      volume: [1000000, null, 1200000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.fetchHistoricalData('AAPL', '1d', '5d');

      expect(result).not.toBeNull();
      expect(result?.data).toHaveLength(2); // Only 2 complete candles
    });

    it('should return null when no data is returned from Yahoo Finance', async () => {
      const mockResponse = {
        data: {
          chart: {
            result: [],
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.fetchHistoricalData('INVALID', '1d', '5d');

      expect(result).toBeNull();
    });

    it('should return null when no quote data is available', async () => {
      const mockResponse = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  currency: 'USD',
                  exchangeName: 'NASDAQ',
                  instrumentType: 'EQUITY',
                  symbol: 'AAPL',
                },
                timestamp: [1704067200],
                indicators: {},
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.fetchHistoricalData('AAPL', '1d', '5d');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.fetchHistoricalData('AAPL', '1d', '5d');

      expect(result).toBeNull();
    });

    it('should use correct Yahoo Finance API parameters', async () => {
      const mockResponse = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  currency: 'USD',
                  exchangeName: 'NASDAQ',
                  instrumentType: 'EQUITY',
                  symbol: 'AAPL',
                },
                timestamp: [1704067200],
                indicators: {
                  quote: [
                    {
                      open: [150.0],
                      high: [152.0],
                      low: [149.0],
                      close: [151.0],
                      volume: [1000000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await service.fetchHistoricalData('AAPL', '1h', '1mo');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://query1.finance.yahoo.com/v8/finance/chart/AAPL',
        {
          params: {
            interval: '1h',
            range: '1mo',
          },
          timeout: 10000,
        }
      );
    });
  });

  describe('caching', () => {
    it('should cache historical data and return from cache on subsequent requests', async () => {
      const mockResponse = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  currency: 'USD',
                  exchangeName: 'NASDAQ',
                  instrumentType: 'EQUITY',
                  symbol: 'AAPL',
                },
                timestamp: [1704067200],
                indicators: {
                  quote: [
                    {
                      open: [150.0],
                      high: [152.0],
                      low: [149.0],
                      close: [151.0],
                      volume: [1000000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      // First request - should call API
      const result1 = await service.fetchHistoricalData('AAPL', '1d', '5d');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Second request - should use cache
      const result2 = await service.fetchHistoricalData('AAPL', '1d', '5d');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Still 1, not 2

      expect(result1).toEqual(result2);
    });

    it('should use different cache entries for different symbols', async () => {
      const mockResponse1 = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  currency: 'USD',
                  exchangeName: 'NASDAQ',
                  instrumentType: 'EQUITY',
                  symbol: 'AAPL',
                },
                timestamp: [1704067200],
                indicators: {
                  quote: [
                    {
                      open: [150.0],
                      high: [152.0],
                      low: [149.0],
                      close: [151.0],
                      volume: [1000000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      const mockResponse2 = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  currency: 'USD',
                  exchangeName: 'NASDAQ',
                  instrumentType: 'EQUITY',
                  symbol: 'GOOGL',
                },
                timestamp: [1704067200],
                indicators: {
                  quote: [
                    {
                      open: [140.0],
                      high: [142.0],
                      low: [139.0],
                      close: [141.0],
                      volume: [900000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse1);
      mockedAxios.get.mockResolvedValueOnce(mockResponse2);

      const result1 = await service.fetchHistoricalData('AAPL', '1d', '5d');
      const result2 = await service.fetchHistoricalData('GOOGL', '1d', '5d');

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(result1?.symbol).toBe('AAPL');
      expect(result2?.symbol).toBe('GOOGL');
    });

    it('should use different cache entries for different intervals and ranges', async () => {
      const mockResponse = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  currency: 'USD',
                  exchangeName: 'NASDAQ',
                  instrumentType: 'EQUITY',
                  symbol: 'AAPL',
                },
                timestamp: [1704067200],
                indicators: {
                  quote: [
                    {
                      open: [150.0],
                      high: [152.0],
                      low: [149.0],
                      close: [151.0],
                      volume: [1000000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await service.fetchHistoricalData('AAPL', '1d', '5d');
      await service.fetchHistoricalData('AAPL', '1h', '5d');
      await service.fetchHistoricalData('AAPL', '1d', '1mo');

      // Should make 3 separate API calls (different cache keys)
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should clear cache when clearCache is called', async () => {
      const mockResponse = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  currency: 'USD',
                  exchangeName: 'NASDAQ',
                  instrumentType: 'EQUITY',
                  symbol: 'AAPL',
                },
                timestamp: [1704067200],
                indicators: {
                  quote: [
                    {
                      open: [150.0],
                      high: [152.0],
                      low: [149.0],
                      close: [151.0],
                      volume: [1000000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // First request
      await service.fetchHistoricalData('AAPL', '1d', '5d');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Second request - should call API again
      await service.fetchHistoricalData('AAPL', '1d', '5d');
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const mockResponse = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  currency: 'USD',
                  exchangeName: 'NASDAQ',
                  instrumentType: 'EQUITY',
                  symbol: 'AAPL',
                },
                timestamp: [1704067200],
                indicators: {
                  quote: [
                    {
                      open: [150.0],
                      high: [152.0],
                      low: [149.0],
                      close: [151.0],
                      volume: [1000000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const statsBefore = service.getCacheStats();
      expect(statsBefore.size).toBe(0);

      await service.fetchHistoricalData('AAPL', '1d', '5d');
      await service.fetchHistoricalData('GOOGL', '1d', '5d');

      const statsAfter = service.getCacheStats();
      expect(statsAfter.size).toBe(2);
    });
  });
});
