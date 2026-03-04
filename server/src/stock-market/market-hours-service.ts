/**
 * Market Hours Service for Live Stock Market Tab
 * 
 * Calculates market session times and status for different global markets,
 * handling timezones and holidays.
 * 
 * Supports:
 * - US markets (NYSE/NASDAQ)
 * - European markets (Euronext)
 * - Asian markets (TSE - Tokyo Stock Exchange)
 */

/**
 * Market session status
 */
export type MarketSession = 'regular' | 'pre-market' | 'after-hours' | 'closed';

/**
 * Market status interface
 */
export interface MarketSessionStatus {
  isOpen: boolean;
  session: MarketSession;
}

/**
 * Market event interface
 */
export interface MarketEvent {
  type: 'open' | 'close';
  time: Date;
  countdown?: string;
}

/**
 * Market hours definition
 */
export interface MarketHours {
  market: string;
  timezone: string;
  regularHours: { open: string; close: string };
  preMarket?: { open: string; close: string };
  afterHours?: { open: string; close: string };
  holidays: string[];
}

/**
 * Market definitions with hours in their local timezones
 */
const MARKET_DEFINITIONS: Record<string, MarketHours> = {
  US: {
    market: 'US',
    timezone: 'America/New_York',
    regularHours: { open: '09:30', close: '16:00' },
    preMarket: { open: '04:00', close: '09:30' },
    afterHours: { open: '16:00', close: '20:00' },
    holidays: [
      // 2025 US Market Holidays
      '2025-01-01', // New Year's Day
      '2025-01-20', // Martin Luther King Jr. Day
      '2025-02-17', // Presidents' Day
      '2025-04-18', // Good Friday
      '2025-05-26', // Memorial Day
      '2025-06-19', // Juneteenth
      '2025-07-04', // Independence Day
      '2025-09-01', // Labor Day
      '2025-11-27', // Thanksgiving
      '2025-12-25', // Christmas
      // 2026 US Market Holidays
      '2026-01-01', // New Year's Day
      '2026-01-19', // Martin Luther King Jr. Day
      '2026-02-16', // Presidents' Day
      '2026-04-03', // Good Friday
      '2026-05-25', // Memorial Day
      '2026-06-19', // Juneteenth
      '2026-07-03', // Independence Day (observed)
      '2026-09-07', // Labor Day
      '2026-11-26', // Thanksgiving
      '2026-12-25', // Christmas
    ],
  },
  EU: {
    market: 'EU',
    timezone: 'Europe/Paris',
    regularHours: { open: '09:00', close: '17:30' },
    holidays: [
      // 2025 Euronext Holidays
      '2025-01-01', // New Year's Day
      '2025-04-18', // Good Friday
      '2025-04-21', // Easter Monday
      '2025-05-01', // Labour Day
      '2025-12-25', // Christmas Day
      '2025-12-26', // Boxing Day
      // 2026 Euronext Holidays
      '2026-01-01', // New Year's Day
      '2026-04-03', // Good Friday
      '2026-04-06', // Easter Monday
      '2026-05-01', // Labour Day
      '2026-12-25', // Christmas Day
      '2026-12-28', // Boxing Day (observed)
    ],
  },
  ASIA: {
    market: 'ASIA',
    timezone: 'Asia/Tokyo',
    regularHours: { open: '09:00', close: '15:00' },
    holidays: [
      // 2025 TSE Holidays
      '2025-01-01', // New Year's Day
      '2025-01-02', // Bank Holiday
      '2025-01-03', // Bank Holiday
      '2025-01-13', // Coming of Age Day
      '2025-02-11', // National Foundation Day
      '2025-02-23', // Emperor's Birthday
      '2025-02-24', // Emperor's Birthday (observed)
      '2025-03-20', // Vernal Equinox Day
      '2025-04-29', // Showa Day
      '2025-05-03', // Constitution Day
      '2025-05-04', // Greenery Day
      '2025-05-05', // Children's Day
      '2025-05-06', // Constitution Day (observed)
      '2025-07-21', // Marine Day
      '2025-08-11', // Mountain Day
      '2025-09-15', // Respect for the Aged Day
      '2025-09-23', // Autumnal Equinox Day
      '2025-10-13', // Sports Day
      '2025-11-03', // Culture Day
      '2025-11-23', // Labor Thanksgiving Day
      '2025-11-24', // Labor Thanksgiving Day (observed)
      '2025-12-31', // New Year's Eve
      // 2026 TSE Holidays
      '2026-01-01', // New Year's Day
      '2026-01-02', // Bank Holiday
      '2026-01-12', // Coming of Age Day
      '2026-02-11', // National Foundation Day
      '2026-02-23', // Emperor's Birthday
      '2026-03-20', // Vernal Equinox Day
      '2026-04-29', // Showa Day
      '2026-05-03', // Constitution Day
      '2026-05-04', // Greenery Day
      '2026-05-05', // Children's Day
      '2026-05-06', // Constitution Day (observed)
      '2026-07-20', // Marine Day
      '2026-08-11', // Mountain Day
      '2026-09-21', // Respect for the Aged Day
      '2026-09-22', // Autumnal Equinox Day
      '2026-10-12', // Sports Day
      '2026-11-03', // Culture Day
      '2026-11-23', // Labor Thanksgiving Day
      '2026-12-31', // New Year's Eve
    ],
  },
};

/**
 * Market Hours Service
 */
export class MarketHoursService {
  /**
   * Get market hours definition for a specific market
   */
  getMarketHours(market: string): MarketHours | null {
    return MARKET_DEFINITIONS[market] || null;
  }

  /**
   * Check if a given date is a holiday for the specified market
   */
  isHoliday(market: string, date: Date): boolean {
    const marketDef = MARKET_DEFINITIONS[market];
    if (!marketDef) return false;

    const dateStr = this.formatDateToYYYYMMDD(date);
    return marketDef.holidays.includes(dateStr);
  }

  /**
   * Check if a given date is a weekend (Saturday or Sunday)
   */
  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }

  /**
   * Get the current market status for a specific market
   * @param market Market identifier (US, EU, ASIA)
   * @param timezone User's timezone (optional, defaults to market timezone)
   */
  getMarketStatus(market: string, timezone?: string): MarketSessionStatus {
    const marketDef = MARKET_DEFINITIONS[market];
    if (!marketDef) {
      return { isOpen: false, session: 'closed' };
    }

    const now = new Date();
    
    // Check if today is a holiday or weekend
    if (this.isHoliday(market, now) || this.isWeekend(now)) {
      return { isOpen: false, session: 'closed' };
    }

    // Get current time in market's timezone
    const marketTime = this.getTimeInTimezone(now, marketDef.timezone);
    const currentMinutes = marketTime.hours * 60 + marketTime.minutes;

    // Parse market hours
    const regularOpen = this.parseTime(marketDef.regularHours.open);
    const regularClose = this.parseTime(marketDef.regularHours.close);

    // Check regular hours
    if (currentMinutes >= regularOpen && currentMinutes < regularClose) {
      return { isOpen: true, session: 'regular' };
    }

    // Check pre-market hours
    if (marketDef.preMarket) {
      const preMarketOpen = this.parseTime(marketDef.preMarket.open);
      const preMarketClose = this.parseTime(marketDef.preMarket.close);
      
      if (currentMinutes >= preMarketOpen && currentMinutes < preMarketClose) {
        return { isOpen: false, session: 'pre-market' };
      }
    }

    // Check after-hours
    if (marketDef.afterHours) {
      const afterHoursOpen = this.parseTime(marketDef.afterHours.open);
      const afterHoursClose = this.parseTime(marketDef.afterHours.close);
      
      if (currentMinutes >= afterHoursOpen && currentMinutes < afterHoursClose) {
        return { isOpen: false, session: 'after-hours' };
      }
    }

    return { isOpen: false, session: 'closed' };
  }

  /**
   * Get the next market event (open or close) for a specific market
   * @param market Market identifier (US, EU, ASIA)
   * @param timezone User's timezone (optional, defaults to market timezone)
   */
  getNextMarketEvent(market: string, timezone?: string): MarketEvent | null {
    const marketDef = MARKET_DEFINITIONS[market];
    if (!marketDef) return null;

    const now = new Date();
    const status = this.getMarketStatus(market, timezone);

    // If market is open (regular session), next event is close
    if (status.isOpen && status.session === 'regular') {
      const closeTime = this.getNextOccurrence(
        now,
        marketDef.timezone,
        marketDef.regularHours.close,
        market
      );
      
      return {
        type: 'close',
        time: closeTime,
        countdown: this.formatCountdown(now, closeTime),
      };
    }

    // Otherwise, next event is open (next trading day)
    const openTime = this.getNextOccurrence(
      now,
      marketDef.timezone,
      marketDef.regularHours.open,
      market,
      true // Look for next trading day
    );

    return {
      type: 'open',
      time: openTime,
      countdown: this.formatCountdown(now, openTime),
    };
  }

  /**
   * Check if market is currently open
   */
  isMarketOpen(market: string): boolean {
    const status = this.getMarketStatus(market);
    return status.isOpen;
  }

  /**
   * Parse time string (HH:MM) to minutes since midnight
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get current time in a specific timezone
   */
  private getTimeInTimezone(date: Date, timezone: string): { hours: number; minutes: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0');

    return { hours, minutes };
  }

  /**
   * Get the next occurrence of a specific time
   */
  private getNextOccurrence(
    from: Date,
    timezone: string,
    timeStr: string,
    market: string,
    nextTradingDay: boolean = false
  ): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create a date in the market's timezone
    const marketDate = new Date(from.toLocaleString('en-US', { timeZone: timezone }));
    
    // Set the target time
    let targetDate = new Date(marketDate);
    targetDate.setHours(hours, minutes, 0, 0);

    // If we need next trading day or if target time has passed today
    if (nextTradingDay || targetDate <= from) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    // Skip weekends and holidays
    while (this.isWeekend(targetDate) || this.isHoliday(market, targetDate)) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    return targetDate;
  }

  /**
   * Format countdown string (e.g., "2h 30m", "45m", "5h 15m")
   */
  private formatCountdown(from: Date, to: Date): string {
    const diffMs = to.getTime() - from.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${minutes}m`;
  }

  /**
   * Format date to YYYY-MM-DD string
   */
  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// Export singleton instance
export const marketHoursService = new MarketHoursService();
