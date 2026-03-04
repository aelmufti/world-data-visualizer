import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import searchRouter from './search-endpoint.js';

describe('Stock Search API Endpoint', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', searchRouter);
  });

  describe('GET /api/stock/search', () => {
    it('should return 400 when query parameter is missing', async () => {
      const response = await request(app)
        .get('/api/stock/search')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    it('should return 400 when query parameter is empty', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return search results for valid query', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=Apple')
        .expect(200);

      expect(response.body).toHaveProperty('query', 'Apple');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(0);
    });

    it('should return results with correct structure', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=AAPL')
        .expect(200);

      const results = response.body.results;
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('symbol');
      expect(firstResult).toHaveProperty('name');
      expect(firstResult).toHaveProperty('exchange');
      expect(firstResult).toHaveProperty('type');
      expect(['stock', 'index', 'etf']).toContain(firstResult.type);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=a&limit=3')
        .expect(200);

      expect(response.body.results.length).toBeLessThanOrEqual(3);
    });

    it('should default to 10 results when limit not specified', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=a')
        .expect(200);

      expect(response.body.results.length).toBeLessThanOrEqual(10);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=Apple&limit=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Limit');
    });

    it('should return 400 for limit less than 1', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=Apple&limit=0')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for limit greater than 100', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=Apple&limit=101')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should filter by single type', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=S&P&types=index')
        .expect(200);

      const results = response.body.results;
      results.forEach((result: any) => {
        expect(result.type).toBe('index');
      });
    });

    it('should filter by multiple types', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=S&P&types=index,etf')
        .expect(200);

      const results = response.body.results;
      results.forEach((result: any) => {
        expect(['index', 'etf']).toContain(result.type);
      });
    });

    it('should return 400 for invalid type', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=Apple&types=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid types');
    });

    it('should handle mixed valid and invalid types', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=Apple&types=stock,invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid types');
    });

    it('should be case-insensitive for type parameter', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=Apple&types=STOCK')
        .expect(200);

      const results = response.body.results;
      results.forEach((result: any) => {
        expect(result.type).toBe('stock');
      });
    });

    it('should handle whitespace in types parameter', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=S&P&types=index, etf')
        .expect(200);

      const results = response.body.results;
      results.forEach((result: any) => {
        expect(['index', 'etf']).toContain(result.type);
      });
    });

    it('should find stocks by symbol', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=AAPL')
        .expect(200);

      const results = response.body.results;
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol).toBe('AAPL');
    });

    it('should find stocks by company name', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=Microsoft')
        .expect(200);

      const results = response.body.results;
      expect(results.length).toBeGreaterThan(0);
      const msftResult = results.find((r: any) => r.symbol === 'MSFT');
      expect(msftResult).toBeDefined();
    });

    it('should support fuzzy matching', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=Appl')
        .expect(200);

      const results = response.body.results;
      expect(results.length).toBeGreaterThan(0);
      const appleResult = results.find((r: any) => r.symbol === 'AAPL');
      expect(appleResult).toBeDefined();
    });

    it('should find US stocks', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=Tesla')
        .expect(200);

      const results = response.body.results;
      const teslaResult = results.find((r: any) => r.symbol === 'TSLA');
      expect(teslaResult).toBeDefined();
      expect(teslaResult.exchange).toBe('NASDAQ');
    });

    it('should find European stocks', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=SAP')
        .expect(200);

      const results = response.body.results;
      const sapResult = results.find((r: any) => r.symbol === 'SAP.DE');
      expect(sapResult).toBeDefined();
      expect(sapResult.exchange).toBe('XETRA');
    });

    it('should find Asian stocks', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=Tencent')
        .expect(200);

      const results = response.body.results;
      const tencentResult = results.find((r: any) => r.symbol === '0700.HK');
      expect(tencentResult).toBeDefined();
      expect(tencentResult.exchange).toBe('HKEX');
    });

    it('should find major indexes', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=S&P 500&types=index')
        .expect(200);

      const results = response.body.results;
      const sp500Result = results.find((r: any) => r.symbol === '^GSPC');
      expect(sp500Result).toBeDefined();
      expect(sp500Result.name).toBe('S&P 500');
    });

    it('should find ETFs', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=SPY&types=etf')
        .expect(200);

      const results = response.body.results;
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('etf');
    });

    it('should return empty results for non-existent query', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=NONEXISTENTSYMBOL12345')
        .expect(200);

      expect(response.body.results).toEqual([]);
    });

    it('should handle special characters in query', async () => {
      const response = await request(app)
        .get('/api/stock/search?q=S%26P')
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should complete search within 300ms (performance requirement)', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/stock/search?q=Apple')
        .expect(200);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(300);
    });
  });
});
