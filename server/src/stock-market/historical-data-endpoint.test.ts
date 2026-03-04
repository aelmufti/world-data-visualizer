import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import historicalDataRouter from './historical-data-endpoint';
import { historicalDataService } from './historical-data-service';

// Mock the historical data service
vi.mock('./historical-data-service', () => ({
  historicalDataService: {
    fetchHistoricalData: vi.fn(),
    getCacheStats: vi.fn(),
  },
}));

describe('Historical Data Endpoint', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', historicalDataRouter);
    vi.clearAllMocks();
  });

  describe('GET /api/stock/history/:symbol', () => {
    it('should return historical data for valid symbol, interval, and range', async () => {
      const mockData = {
        symbol: 'AAPL',
        data: [
          {
            time: 1704067200,
            open: 150.0,
            high: 152.0,
            low: 149.0,
            close: 151.0,
            volume: 1000000,
          },
          {
            time: 1704153600,
            open: 151.0,
            high: 153.0,
            low: 150.0,
            close: 152.0,
            volume: 1100000,
          },
        ],
        meta: {
          currency: 'USD',
          exchangeName: 'NASDAQ',
          instrumentType: 'EQUITY',
          symbol: 'AAPL',
        },
      };

      vi.mocked(historicalDataService.fetchHistoricalData).mockResolvedValueOnce(
        mockData
      );

      const response = await request(app)
        .get('/api/stock/history/AAPL')
        .query({ interval: '1d', range: '5d' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
      expect(historicalDataService.fetchHistoricalData).toHaveBeenCalledWith(
        'AAPL',
        '1d',
        '5d'
      );
    });

    it('should return 400 for missing interval parameter', async () => {
      const response = await request(app)
        .get('/api/stock/history/AAPL')
        .query({ range: '5d' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('interval');
    });

    it('should return 400 for missing range parameter', async () => {
      const response = await request(app)
        .get('/api/stock/history/AAPL')
        .query({ interval: '1d' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('range');
    });

    it('should return 400 for invalid interval', async () => {
      const response = await request(app)
        .get('/api/stock/history/AAPL')
        .query({ interval: 'invalid', range: '5d' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid interval');
      expect(response.body.validIntervals).toBeDefined();
    });

    it('should return 400 for invalid range', async () => {
      const response = await request(app)
        .get('/api/stock/history/AAPL')
        .query({ interval: '1d', range: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid range');
      expect(response.body.validRanges).toBeDefined();
    });

    it('should return 404 when no data is found for symbol', async () => {
      vi.mocked(historicalDataService.fetchHistoricalData).mockResolvedValueOnce(
        null
      );

      const response = await request(app)
        .get('/api/stock/history/INVALID')
        .query({ interval: '1d', range: '5d' });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No historical data found');
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(historicalDataService.fetchHistoricalData).mockRejectedValueOnce(
        new Error('Service error')
      );

      const response = await request(app)
        .get('/api/stock/history/AAPL')
        .query({ interval: '1d', range: '5d' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch historical data');
    });

    it('should convert symbol to uppercase', async () => {
      const mockData = {
        symbol: 'AAPL',
        data: [],
        meta: {
          currency: 'USD',
          exchangeName: 'NASDAQ',
          instrumentType: 'EQUITY',
          symbol: 'AAPL',
        },
      };

      vi.mocked(historicalDataService.fetchHistoricalData).mockResolvedValueOnce(
        mockData
      );

      await request(app)
        .get('/api/stock/history/aapl')
        .query({ interval: '1d', range: '5d' });

      expect(historicalDataService.fetchHistoricalData).toHaveBeenCalledWith(
        'AAPL',
        '1d',
        '5d'
      );
    });

    it('should support all valid intervals', async () => {
      const mockData = {
        symbol: 'AAPL',
        data: [],
        meta: {
          currency: 'USD',
          exchangeName: 'NASDAQ',
          instrumentType: 'EQUITY',
          symbol: 'AAPL',
        },
      };

      vi.mocked(historicalDataService.fetchHistoricalData).mockResolvedValue(
        mockData
      );

      const intervals = ['1m', '5m', '15m', '1h', '1d'];

      for (const interval of intervals) {
        const response = await request(app)
          .get('/api/stock/history/AAPL')
          .query({ interval, range: '5d' });

        expect(response.status).toBe(200);
      }
    });

    it('should support all valid ranges', async () => {
      const mockData = {
        symbol: 'AAPL',
        data: [],
        meta: {
          currency: 'USD',
          exchangeName: 'NASDAQ',
          instrumentType: 'EQUITY',
          symbol: 'AAPL',
        },
      };

      vi.mocked(historicalDataService.fetchHistoricalData).mockResolvedValue(
        mockData
      );

      const ranges = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y'];

      for (const range of ranges) {
        const response = await request(app)
          .get('/api/stock/history/AAPL')
          .query({ interval: '1d', range });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('GET /api/stock/history/cache/stats', () => {
    it('should return cache statistics', async () => {
      const mockStats = { size: 5 };
      vi.mocked(historicalDataService.getCacheStats).mockReturnValueOnce(
        mockStats
      );

      const response = await request(app).get('/api/stock/history/cache/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
    });
  });
});
