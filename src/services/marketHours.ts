/**
 * Market Hours Service
 * Calculates real market hours and status for different markets
 */

export interface MarketHours {
  market: 'US' | 'EU' | 'ASIA';
  isOpen: boolean;
  session: 'regular' | 'pre-market' | 'after-hours' | 'closed';
  nextEvent: {
    type: 'open' | 'close';
    time: Date;
    countdown: string;
  };
}

/**
 * Get current market status for a given market
 */
export function getMarketStatus(market: 'US' | 'EU' | 'ASIA'): MarketHours {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcTime = utcHours + utcMinutes / 60;

  let isOpen = false;
  let session: 'regular' | 'pre-market' | 'after-hours' | 'closed' = 'closed';
  let nextEventType: 'open' | 'close' = 'open';
  let nextEventTime: Date;

  switch (market) {
    case 'US':
      // US Market: 9:30 AM - 4:00 PM EST (14:30 - 21:00 UTC)
      // Pre-market: 4:00 AM - 9:30 AM EST (9:00 - 14:30 UTC)
      // After-hours: 4:00 PM - 8:00 PM EST (21:00 - 1:00 UTC next day)
      if (utcTime >= 14.5 && utcTime < 21) {
        isOpen = true;
        session = 'regular';
        nextEventType = 'close';
        nextEventTime = getNextTime(21, 0);
      } else if (utcTime >= 9 && utcTime < 14.5) {
        isOpen = true;
        session = 'pre-market';
        nextEventType = 'open';
        nextEventTime = getNextTime(14, 30);
      } else if (utcTime >= 21 || utcTime < 1) {
        isOpen = true;
        session = 'after-hours';
        nextEventType = 'close';
        nextEventTime = utcTime >= 21 ? getNextTime(1, 0) : getNextTime(1, 0);
      } else {
        isOpen = false;
        session = 'closed';
        nextEventType = 'open';
        nextEventTime = getNextTime(9, 0);
      }
      break;

    case 'EU':
      // EU Market: 9:00 AM - 5:30 PM CET (8:00 - 16:30 UTC)
      if (utcTime >= 8 && utcTime < 16.5) {
        isOpen = true;
        session = 'regular';
        nextEventType = 'close';
        nextEventTime = getNextTime(16, 30);
      } else {
        isOpen = false;
        session = 'closed';
        nextEventType = 'open';
        nextEventTime = getNextTime(8, 0);
      }
      break;

    case 'ASIA':
      // Asia Market (Tokyo): 9:00 AM - 3:00 PM JST (0:00 - 6:00 UTC)
      if (utcTime >= 0 && utcTime < 6) {
        isOpen = true;
        session = 'regular';
        nextEventType = 'close';
        nextEventTime = getNextTime(6, 0);
      } else {
        isOpen = false;
        session = 'closed';
        nextEventType = 'open';
        nextEventTime = getNextTime(0, 0);
      }
      break;
  }

  return {
    market,
    isOpen,
    session,
    nextEvent: {
      type: nextEventType,
      time: nextEventTime,
      countdown: '',
    },
  };
}

/**
 * Get the next occurrence of a specific UTC time
 */
function getNextTime(hours: number, minutes: number): Date {
  const now = new Date();
  const target = new Date(now);
  target.setUTCHours(hours, minutes, 0, 0);

  // If the target time has passed today, set it for tomorrow
  if (target <= now) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  return target;
}

/**
 * Format countdown time
 */
export function formatCountdown(targetTime: Date): string {
  const now = new Date();
  const diff = targetTime.getTime() - now.getTime();

  if (diff <= 0) return '0h 0m';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

/**
 * Get all market statuses
 */
export function getAllMarketStatuses(): MarketHours[] {
  return [
    getMarketStatus('US'),
    getMarketStatus('EU'),
    getMarketStatus('ASIA'),
  ];
}
