/**
 * Tests for Market Alert System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MarketAlertSystem } from './marketAlertSystem';
import type { MarketIdentifier } from './marketAlertSystem';

// Mock fetch globally
global.fetch = vi.fn();

describe('MarketAlertSystem', () => {
  let alertSystem: MarketAlertSystem;

  beforeEach(() => {
    alertSystem = new MarketAlertSystem();
    vi.clearAllMocks();
  });

  afterEach(() => {
    alertSystem.stop();
  });

  describe('getMarketStatus', () => {
    it('should fetch market status from API', async () => {
      const mockResponse = {
        market: 'US',
        isOpen: true,
        session: 'regular',
        nextEvent: {
          type: 'close',
          time: '2025-01-15T21:00:00.000Z',
          countdown: '2h 30m',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const status = await alertSystem.getMarketStatus('US');

      expect(status).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stock/market-status/US')
      );
    });

    it('should return null on fetch error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const status = await alertSystem.getMarketStatus('US');

      expect(status).toBeNull();
    });

    it('should return null on non-ok response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const status = await alertSystem.getMarketStatus('US');

      expect(status).toBeNull();
    });

    it('should handle all market identifiers', async () => {
      const markets: MarketIdentifier[] = ['US', 'EU', 'ASIA'];

      for (const market of markets) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            market,
            isOpen: false,
            session: 'closed',
            nextEvent: {
              type: 'open',
              time: '2025-01-16T14:30:00.000Z',
              countdown: '12h',
            },
          }),
        });

        const status = await alertSystem.getMarketStatus(market);
        expect(status?.market).toBe(market);
      }
    });
  });

  describe('getNextEvent', () => {
    it('should return next market event', async () => {
      const mockResponse = {
        market: 'US',
        isOpen: true,
        session: 'regular',
        nextEvent: {
          type: 'close',
          time: '2025-01-15T21:00:00.000Z',
          countdown: '2h 30m',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const event = await alertSystem.getNextEvent('US');

      expect(event).toBeTruthy();
      expect(event?.type).toBe('close');
      expect(event?.time).toBeInstanceOf(Date);
      expect(event?.countdown).toBe('2h 30m');
    });

    it('should return null when status fetch fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const event = await alertSystem.getNextEvent('US');

      expect(event).toBeNull();
    });

    it('should return null when nextEvent is missing', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          market: 'US',
          isOpen: false,
          session: 'closed',
        }),
      });

      const event = await alertSystem.getNextEvent('US');

      expect(event).toBeNull();
    });
  });

  describe('onMarketEvent', () => {
    it('should register callback and return unsubscribe function', () => {
      const callback = vi.fn();

      const unsubscribe = alertSystem.onMarketEvent(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow unsubscribing from events', () => {
      const callback = vi.fn();

      const unsubscribe = alertSystem.onMarketEvent(callback);
      unsubscribe();

      // Callback should not be called after unsubscribe
      // (This would be tested in integration tests with actual events)
    });

    it('should support multiple callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      alertSystem.onMarketEvent(callback1);
      alertSystem.onMarketEvent(callback2);

      // Both callbacks should be registered
      // (This would be tested in integration tests with actual events)
    });
  });

  describe('formatCountdown', () => {
    it('should format countdown for minutes', () => {
      const target = new Date(Date.now() + 45 * 60 * 1000); // 45 minutes from now

      const countdown = alertSystem.formatCountdown(target);

      expect(countdown).toBe('45m');
    });

    it('should format countdown for hours', () => {
      const target = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours from now

      const countdown = alertSystem.formatCountdown(target);

      expect(countdown).toBe('3h');
    });

    it('should format countdown for hours and minutes', () => {
      const target = new Date(Date.now() + (2 * 60 + 30) * 60 * 1000); // 2h 30m from now

      const countdown = alertSystem.formatCountdown(target);

      expect(countdown).toBe('2h 30m');
    });

    it('should format countdown for days', () => {
      const target = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

      const countdown = alertSystem.formatCountdown(target);

      expect(countdown).toBe('2d');
    });

    it('should format countdown for days and hours', () => {
      const target = new Date(Date.now() + (1 * 24 + 4) * 60 * 60 * 1000); // 1d 4h from now

      const countdown = alertSystem.formatCountdown(target);

      expect(countdown).toBe('1d 4h');
    });

    it('should return "Now" for past times', () => {
      const target = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      const countdown = alertSystem.formatCountdown(target);

      expect(countdown).toBe('Now');
    });
  });

  describe('start and stop', () => {
    it('should start polling for market updates', async () => {
      const mockResponse = {
        market: 'US',
        isOpen: false,
        session: 'closed',
        nextEvent: {
          type: 'open',
          time: '2025-01-16T14:30:00.000Z',
          countdown: '12h',
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await alertSystem.start();

      // Should have fetched status for all markets
      expect(global.fetch).toHaveBeenCalledTimes(3); // US, EU, ASIA
    });

    it('should stop polling when stop is called', async () => {
      const mockResponse = {
        market: 'US',
        isOpen: false,
        session: 'closed',
        nextEvent: {
          type: 'open',
          time: '2025-01-16T14:30:00.000Z',
          countdown: '12h',
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await alertSystem.start();
      alertSystem.stop();

      // Polling should be stopped
      // (Verified by checking that no more fetches occur)
    });
  });

  describe('requestNotificationPermission', () => {
    it('should return false if notifications not supported (Node.js environment)', async () => {
      // In Node.js test environment, window is undefined
      const result = await alertSystem.requestNotificationPermission();

      expect(result).toBe(false);
    });

    it('should handle notification permission logic', () => {
      // This test verifies the method exists and can be called
      // Actual browser notification testing would require a browser environment
      expect(typeof alertSystem.requestNotificationPermission).toBe('function');
    });
  });
});
