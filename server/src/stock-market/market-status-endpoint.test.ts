/**
 * Tests for Market Status API Endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import marketStatusRouter from './market-status-endpoint.js';
import { marketHoursService } from './market-hours-service.js';

const app = express();
app.use(express.json());
app.use('/api', marketStatusRouter);

describe('Market Status API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/stock/market-status/:market', () => {
    it('should return market status for US market', async () => {
      const response = await request(app)
        .get('/api/stock/market-status/US')
        .expect(200);

      expect(response.body).toHaveProperty('market', 'US');
      expect(response.body).toHaveProperty('isOpen');
      expect(response.body).toHaveProperty('session');
      expect(response.body).toHaveProperty('nextEvent');
      expect(response.body.nextEvent).toHaveProperty('type');
      expect(response.body.nextEvent).toHaveProperty('time');
      expect(response.body.nextEvent).toHaveProperty('countdown');
    });

    it('should return market status for EU market', async () => {
      const response = await request(app)
        .get('/api/stock/market-status/EU')
        .expect(200);

      expect(response.body).toHaveProperty('market', 'EU');
      expect(response.body).toHaveProperty('isOpen');
      expect(response.body).toHaveProperty('session');
    });

    it('should return market status for ASIA market', async () => {
      const response = await request(app)
        .get('/api/stock/market-status/ASIA')
        .expect(200);

      expect(response.body).toHaveProperty('market', 'ASIA');
      expect(response.body).toHaveProperty('isOpen');
      expect(response.body).toHaveProperty('session');
    });

    it('should handle lowercase market parameter', async () => {
      const response = await request(app)
        .get('/api/stock/market-status/us')
        .expect(200);

      expect(response.body).toHaveProperty('market', 'US');
    });

    it('should return 400 for invalid market', async () => {
      const response = await request(app)
        .get('/api/stock/market-status/INVALID')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid market parameter');
    });

    it('should return session type in response', async () => {
      const response = await request(app)
        .get('/api/stock/market-status/US')
        .expect(200);

      expect(['regular', 'pre-market', 'after-hours', 'closed']).toContain(
        response.body.session
      );
    });

    it('should return next event type as open or close', async () => {
      const response = await request(app)
        .get('/api/stock/market-status/US')
        .expect(200);

      expect(['open', 'close']).toContain(response.body.nextEvent.type);
    });

    it('should return next event time as ISO string', async () => {
      const response = await request(app)
        .get('/api/stock/market-status/US')
        .expect(200);

      const time = new Date(response.body.nextEvent.time);
      expect(time).toBeInstanceOf(Date);
      expect(time.getTime()).not.toBeNaN();
    });

    it('should return countdown string', async () => {
      const response = await request(app)
        .get('/api/stock/market-status/US')
        .expect(200);

      expect(response.body.nextEvent.countdown).toBeTruthy();
      expect(typeof response.body.nextEvent.countdown).toBe('string');
    });
  });

  describe('GET /api/stock/market-status', () => {
    it('should return status for all markets', async () => {
      const response = await request(app)
        .get('/api/stock/market-status')
        .expect(200);

      expect(response.body).toHaveProperty('markets');
      expect(Array.isArray(response.body.markets)).toBe(true);
      expect(response.body.markets).toHaveLength(3);
    });

    it('should include US, EU, and ASIA markets', async () => {
      const response = await request(app)
        .get('/api/stock/market-status')
        .expect(200);

      const marketIds = response.body.markets.map((m: any) => m.market);
      expect(marketIds).toContain('US');
      expect(marketIds).toContain('EU');
      expect(marketIds).toContain('ASIA');
    });

    it('should return complete status for each market', async () => {
      const response = await request(app)
        .get('/api/stock/market-status')
        .expect(200);

      response.body.markets.forEach((market: any) => {
        expect(market).toHaveProperty('market');
        expect(market).toHaveProperty('isOpen');
        expect(market).toHaveProperty('session');
        expect(market).toHaveProperty('nextEvent');
        
        if (market.nextEvent) {
          expect(market.nextEvent).toHaveProperty('type');
          expect(market.nextEvent).toHaveProperty('time');
          expect(market.nextEvent).toHaveProperty('countdown');
        }
      });
    });
  });

  describe('Market Status Integration', () => {
    it('should correctly identify market open status', async () => {
      const response = await request(app)
        .get('/api/stock/market-status/US')
        .expect(200);

      expect(typeof response.body.isOpen).toBe('boolean');
    });

    it('should provide next event based on current status', async () => {
      const response = await request(app)
        .get('/api/stock/market-status/US')
        .expect(200);

      // If market is open, next event should be close
      // If market is closed, next event should be open
      if (response.body.isOpen && response.body.session === 'regular') {
        expect(response.body.nextEvent.type).toBe('close');
      } else {
        expect(response.body.nextEvent.type).toBe('open');
      }
    });
  });
});
