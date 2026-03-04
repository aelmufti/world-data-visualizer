import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MarketHoursService,
  MarketSessionStatus,
  MarketEvent,
  MarketHours,
} from './market-hours-service';

describe('MarketHoursService', () => {
  let service: MarketHoursService;

  beforeEach(() => {
    service = new MarketHoursService();
  });

  describe('getMarketHours', () => {
    it('should return market hours for US market', () => {
      const hours = service.getMarketHours('US');

      expect(hours).toBeDefined();
      expect(hours?.market).toBe('US');
      expect(hours?.timezone).toBe('America/New_York');
      expect(hours?.regularHours).toEqual({ open: '09:30', close: '16:00' });
      expect(hours?.preMarket).toEqual({ open: '04:00', close: '09:30' });
      expect(hours?.afterHours).toEqual({ open: '16:00', close: '20:00' });
      expect(hours?.holidays).toBeInstanceOf(Array);
      expect(hours?.holidays.length).toBeGreaterThan(0);
    });

    it('should return market hours for EU market', () => {
      const hours = service.getMarketHours('EU');

      expect(hours).toBeDefined();
      expect(hours?.market).toBe('EU');
      expect(hours?.timezone).toBe('Europe/Paris');
      expect(hours?.regularHours).toEqual({ open: '09:00', close: '17:30' });
      expect(hours?.holidays).toBeInstanceOf(Array);
    });

    it('should return market hours for ASIA market', () => {
      const hours = service.getMarketHours('ASIA');

      expect(hours).toBeDefined();
      expect(hours?.market).toBe('ASIA');
      expect(hours?.timezone).toBe('Asia/Tokyo');
      expect(hours?.regularHours).toEqual({ open: '09:00', close: '15:00' });
      expect(hours?.holidays).toBeInstanceOf(Array);
    });

    it('should return null for invalid market', () => {
      const hours = service.getMarketHours('INVALID');
      expect(hours).toBeNull();
    });
  });

  describe('isHoliday', () => {
    it('should detect US holidays', () => {
      // New Year's Day 2025
      const newYears = new Date('2025-01-01T12:00:00Z');
      expect(service.isHoliday('US', newYears)).toBe(true);

      // Independence Day 2025
      const july4th = new Date('2025-07-04T12:00:00Z');
      expect(service.isHoliday('US', july4th)).toBe(true);

      // Christmas 2025
      const christmas = new Date('2025-12-25T12:00:00Z');
      expect(service.isHoliday('US', christmas)).toBe(true);
    });

    it('should detect EU holidays', () => {
      // New Year's Day 2025
      const newYears = new Date('2025-01-01T12:00:00Z');
      expect(service.isHoliday('EU', newYears)).toBe(true);

      // Labour Day 2025
      const labourDay = new Date('2025-05-01T12:00:00Z');
      expect(service.isHoliday('EU', labourDay)).toBe(true);
    });

    it('should detect ASIA holidays', () => {
      // New Year's Day 2025
      const newYears = new Date('2025-01-01T12:00:00Z');
      expect(service.isHoliday('ASIA', newYears)).toBe(true);

      // Constitution Day 2025
      const constitutionDay = new Date('2025-05-03T12:00:00Z');
      expect(service.isHoliday('ASIA', constitutionDay)).toBe(true);
    });

    it('should return false for non-holidays', () => {
      // Regular trading day
      const regularDay = new Date('2025-03-15T12:00:00Z');
      expect(service.isHoliday('US', regularDay)).toBe(false);
      expect(service.isHoliday('EU', regularDay)).toBe(false);
      expect(service.isHoliday('ASIA', regularDay)).toBe(false);
    });

    it('should return false for invalid market', () => {
      const date = new Date('2025-01-01T12:00:00Z');
      expect(service.isHoliday('INVALID', date)).toBe(false);
    });
  });

  describe('isWeekend', () => {
    it('should detect Saturday', () => {
      const saturday = new Date('2025-01-04T12:00:00Z'); // Saturday
      expect(service.isWeekend(saturday)).toBe(true);
    });

    it('should detect Sunday', () => {
      const sunday = new Date('2025-01-05T12:00:00Z'); // Sunday
      expect(service.isWeekend(sunday)).toBe(true);
    });

    it('should return false for weekdays', () => {
      const monday = new Date('2025-01-06T12:00:00Z'); // Monday
      expect(service.isWeekend(monday)).toBe(false);

      const friday = new Date('2025-01-10T12:00:00Z'); // Friday
      expect(service.isWeekend(friday)).toBe(false);
    });
  });

  describe('getMarketStatus', () => {
    it('should return closed status for weekends', () => {
      // Mock a Saturday
      vi.setSystemTime(new Date('2025-01-04T14:00:00Z')); // Saturday

      const status = service.getMarketStatus('US');
      expect(status.isOpen).toBe(false);
      expect(status.session).toBe('closed');

      vi.useRealTimers();
    });

    it('should return closed status for holidays', () => {
      // Mock New Year's Day 2025 (Wednesday)
      vi.setSystemTime(new Date('2025-01-01T14:00:00Z'));

      const status = service.getMarketStatus('US');
      expect(status.isOpen).toBe(false);
      expect(status.session).toBe('closed');

      vi.useRealTimers();
    });

    it('should return open status during US regular hours', () => {
      // Mock a weekday at 10:00 AM ET (15:00 UTC)
      vi.setSystemTime(new Date('2025-01-06T15:00:00Z')); // Monday 10:00 AM ET

      const status = service.getMarketStatus('US');
      expect(status.isOpen).toBe(true);
      expect(status.session).toBe('regular');

      vi.useRealTimers();
    });

    it('should return pre-market status during US pre-market hours', () => {
      // Mock a weekday at 7:00 AM ET (12:00 UTC)
      vi.setSystemTime(new Date('2025-01-06T12:00:00Z')); // Monday 7:00 AM ET

      const status = service.getMarketStatus('US');
      expect(status.isOpen).toBe(false);
      expect(status.session).toBe('pre-market');

      vi.useRealTimers();
    });

    it('should return after-hours status during US after-hours', () => {
      // Mock a weekday at 5:00 PM ET (22:00 UTC)
      vi.setSystemTime(new Date('2025-01-06T22:00:00Z')); // Monday 5:00 PM ET

      const status = service.getMarketStatus('US');
      expect(status.isOpen).toBe(false);
      expect(status.session).toBe('after-hours');

      vi.useRealTimers();
    });

    it('should return closed status outside all trading hours', () => {
      // Mock a weekday at 11:00 PM ET (04:00 UTC next day)
      vi.setSystemTime(new Date('2025-01-07T04:00:00Z')); // Monday 11:00 PM ET

      const status = service.getMarketStatus('US');
      expect(status.isOpen).toBe(false);
      expect(status.session).toBe('closed');

      vi.useRealTimers();
    });

    it('should handle EU market hours correctly', () => {
      // Mock a weekday at 10:00 AM CET (09:00 UTC)
      vi.setSystemTime(new Date('2025-01-06T09:00:00Z')); // Monday 10:00 AM CET

      const status = service.getMarketStatus('EU');
      expect(status.isOpen).toBe(true);
      expect(status.session).toBe('regular');

      vi.useRealTimers();
    });

    it('should handle ASIA market hours correctly', () => {
      // Mock a weekday at 10:00 AM JST (01:00 UTC)
      vi.setSystemTime(new Date('2025-01-06T01:00:00Z')); // Monday 10:00 AM JST

      const status = service.getMarketStatus('ASIA');
      expect(status.isOpen).toBe(true);
      expect(status.session).toBe('regular');

      vi.useRealTimers();
    });

    it('should return closed for invalid market', () => {
      const status = service.getMarketStatus('INVALID');
      expect(status.isOpen).toBe(false);
      expect(status.session).toBe('closed');
    });
  });

  describe('getNextMarketEvent', () => {
    it('should return close event when market is open', () => {
      // Mock a weekday at 10:00 AM ET (15:00 UTC) - market is open
      vi.setSystemTime(new Date('2025-01-06T15:00:00Z')); // Monday 10:00 AM ET

      const event = service.getNextMarketEvent('US');

      expect(event).toBeDefined();
      expect(event?.type).toBe('close');
      expect(event?.time).toBeInstanceOf(Date);
      expect(event?.countdown).toBeDefined();
      expect(event?.countdown).toMatch(/\d+h/); // Should have hours

      vi.useRealTimers();
    });

    it('should return open event when market is closed', () => {
      // Mock a weekday at 11:00 PM ET (04:00 UTC next day) - market is closed
      vi.setSystemTime(new Date('2025-01-07T04:00:00Z')); // Monday 11:00 PM ET

      const event = service.getNextMarketEvent('US');

      expect(event).toBeDefined();
      expect(event?.type).toBe('open');
      expect(event?.time).toBeInstanceOf(Date);
      expect(event?.countdown).toBeDefined();

      vi.useRealTimers();
    });

    it('should skip weekends when calculating next open', () => {
      // Mock Friday evening after close
      vi.setSystemTime(new Date('2025-01-10T22:00:00Z')); // Friday 5:00 PM ET

      const event = service.getNextMarketEvent('US');

      expect(event).toBeDefined();
      expect(event?.type).toBe('open');
      
      // Next open should be Monday
      const nextEventDay = event?.time.getDay();
      expect(nextEventDay).toBe(1); // Monday

      vi.useRealTimers();
    });

    it('should skip holidays when calculating next open', () => {
      // Mock December 24, 2025 (day before Christmas)
      vi.setSystemTime(new Date('2025-12-24T22:00:00Z')); // Wednesday evening

      const event = service.getNextMarketEvent('US');

      expect(event).toBeDefined();
      expect(event?.type).toBe('open');
      
      // Next open should skip Christmas (12/25) and go to 12/26
      const nextEventDate = event?.time;
      expect(nextEventDate?.getDate()).toBeGreaterThan(25);

      vi.useRealTimers();
    });

    it('should format countdown correctly for hours and minutes', () => {
      // Mock a time where we can predict the countdown
      vi.setSystemTime(new Date('2025-01-06T15:00:00Z')); // Monday 10:00 AM ET

      const event = service.getNextMarketEvent('US');

      expect(event?.countdown).toBeDefined();
      // Countdown should be in hours format (market closes at some point in the future)
      expect(event?.countdown).toMatch(/\d+h/);

      vi.useRealTimers();
    });

    it('should format countdown correctly for minutes only', () => {
      // Mock a time close to market close
      vi.setSystemTime(new Date('2025-01-06T20:30:00Z')); // Monday 3:30 PM ET

      const event = service.getNextMarketEvent('US');

      expect(event?.countdown).toBeDefined();
      // Should be around 30 minutes to close
      expect(event?.countdown).toMatch(/\d+m/);

      vi.useRealTimers();
    });

    it('should return null for invalid market', () => {
      const event = service.getNextMarketEvent('INVALID');
      expect(event).toBeNull();
    });

    it('should handle EU market next event correctly', () => {
      // Mock a weekday at 10:00 AM CET (09:00 UTC) - market is open
      vi.setSystemTime(new Date('2025-01-06T09:00:00Z')); // Monday 10:00 AM CET

      const event = service.getNextMarketEvent('EU');

      expect(event).toBeDefined();
      expect(event?.type).toBe('close');
      expect(event?.time).toBeInstanceOf(Date);

      vi.useRealTimers();
    });

    it('should handle ASIA market next event correctly', () => {
      // Mock a weekday at 10:00 AM JST (01:00 UTC) - market is open
      vi.setSystemTime(new Date('2025-01-06T01:00:00Z')); // Monday 10:00 AM JST

      const event = service.getNextMarketEvent('ASIA');

      expect(event).toBeDefined();
      expect(event?.type).toBe('close');
      expect(event?.time).toBeInstanceOf(Date);

      vi.useRealTimers();
    });
  });

  describe('isMarketOpen', () => {
    it('should return true when US market is open', () => {
      // Mock a weekday at 10:00 AM ET (15:00 UTC)
      vi.setSystemTime(new Date('2025-01-06T15:00:00Z')); // Monday 10:00 AM ET

      const isOpen = service.isMarketOpen('US');
      expect(isOpen).toBe(true);

      vi.useRealTimers();
    });

    it('should return false when US market is closed', () => {
      // Mock a weekday at 11:00 PM ET (04:00 UTC next day)
      vi.setSystemTime(new Date('2025-01-07T04:00:00Z')); // Monday 11:00 PM ET

      const isOpen = service.isMarketOpen('US');
      expect(isOpen).toBe(false);

      vi.useRealTimers();
    });

    it('should return false on weekends', () => {
      // Mock a Saturday
      vi.setSystemTime(new Date('2025-01-04T15:00:00Z')); // Saturday

      const isOpen = service.isMarketOpen('US');
      expect(isOpen).toBe(false);

      vi.useRealTimers();
    });

    it('should return false on holidays', () => {
      // Mock New Year's Day 2025
      vi.setSystemTime(new Date('2025-01-01T15:00:00Z'));

      const isOpen = service.isMarketOpen('US');
      expect(isOpen).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('timezone handling', () => {
    it('should correctly handle US Eastern Time', () => {
      // Test during daylight saving time and standard time
      // This is a basic test - full timezone testing would require more complex mocking
      
      const hours = service.getMarketHours('US');
      expect(hours?.timezone).toBe('America/New_York');
    });

    it('should correctly handle European Central Time', () => {
      const hours = service.getMarketHours('EU');
      expect(hours?.timezone).toBe('Europe/Paris');
    });

    it('should correctly handle Japan Standard Time', () => {
      const hours = service.getMarketHours('ASIA');
      expect(hours?.timezone).toBe('Asia/Tokyo');
    });
  });

  describe('holiday coverage', () => {
    it('should include 2025 holidays', () => {
      const usHours = service.getMarketHours('US');
      const has2025Holidays = usHours?.holidays.some(h => h.startsWith('2025'));
      expect(has2025Holidays).toBe(true);
    });

    it('should include 2026 holidays', () => {
      const usHours = service.getMarketHours('US');
      const has2026Holidays = usHours?.holidays.some(h => h.startsWith('2026'));
      expect(has2026Holidays).toBe(true);
    });

    it('should have at least 10 holidays per market', () => {
      const usHours = service.getMarketHours('US');
      const euHours = service.getMarketHours('EU');
      const asiaHours = service.getMarketHours('ASIA');

      expect(usHours?.holidays.length).toBeGreaterThanOrEqual(10);
      expect(euHours?.holidays.length).toBeGreaterThanOrEqual(10);
      expect(asiaHours?.holidays.length).toBeGreaterThanOrEqual(10);
    });
  });
});
