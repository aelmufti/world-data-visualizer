/**
 * Market Alert System for Live Stock Market Tab
 * 
 * Monitors market opening/closing events and provides notifications
 * for market status changes across US, EU, and ASIA markets.
 * 
 * Features:
 * - Monitors market opening/closing events
 * - Displays in-app notifications
 * - Sends browser notifications (when permissions granted)
 * - Provides countdown timers for next market events
 * - Timezone-aware calculations
 */

import type { MarketSessionStatus, MarketEvent } from '../types/stock-market';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type MarketIdentifier = 'US' | 'EU' | 'ASIA';

export interface MarketStatusResponse {
  market: string;
  isOpen: boolean;
  session: 'regular' | 'pre-market' | 'after-hours' | 'closed';
  nextEvent: {
    type: 'open' | 'close';
    time: string; // ISO date string
    countdown: string;
  };
}

export interface MarketAlertCallback {
  (market: MarketIdentifier, event: 'open' | 'close', time: Date): void;
}

/**
 * Market Alert System
 * 
 * Monitors market hours and notifies users of market opening/closing events
 */
export class MarketAlertSystem {
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL = 60000; // Poll every 60 seconds
  private marketStates: Map<MarketIdentifier, MarketSessionStatus> = new Map();
  private callbacks: Set<MarketAlertCallback> = new Set();
  private notificationsEnabled: boolean = false;

  constructor() {
    this.checkNotificationPermission();
  }

  /**
   * Start monitoring market events
   */
  async start(): Promise<void> {
    // Initial fetch
    await this.updateMarketStatuses();

    // Start polling
    this.pollingInterval = setInterval(() => {
      this.updateMarketStatuses();
    }, this.POLL_INTERVAL);
  }

  /**
   * Stop monitoring market events
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Get current market status for a specific market
   */
  async getMarketStatus(market: MarketIdentifier): Promise<MarketStatusResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/market-status/${market}`);
      
      if (!response.ok) {
        console.error(`Failed to fetch market status for ${market}:`, response.statusText);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching market status for ${market}:`, error);
      return null;
    }
  }

  /**
   * Get next market event for a specific market
   */
  async getNextEvent(market: MarketIdentifier): Promise<MarketEvent | null> {
    const status = await this.getMarketStatus(market);
    
    if (!status || !status.nextEvent) {
      return null;
    }

    return {
      type: status.nextEvent.type,
      time: new Date(status.nextEvent.time),
      countdown: status.nextEvent.countdown,
    };
  }

  /**
   * Register a callback for market events
   */
  onMarketEvent(callback: MarketAlertCallback): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Request browser notification permissions
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.notificationsEnabled = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationsEnabled = permission === 'granted';
      return this.notificationsEnabled;
    }

    return false;
  }

  /**
   * Check current notification permission status
   */
  private checkNotificationPermission(): void {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      this.notificationsEnabled = true;
    }
  }

  /**
   * Update market statuses for all markets
   */
  private async updateMarketStatuses(): Promise<void> {
    const markets: MarketIdentifier[] = ['US', 'EU', 'ASIA'];

    for (const market of markets) {
      const status = await this.getMarketStatus(market);
      
      if (!status) {
        continue;
      }

      const previousState = this.marketStates.get(market);
      const currentState: MarketSessionStatus = {
        isOpen: status.isOpen,
        session: status.session,
      };

      // Detect market opening/closing transitions
      if (previousState) {
        // Market just opened
        if (!previousState.isOpen && currentState.isOpen) {
          this.notifyMarketEvent(market, 'open', new Date());
        }
        // Market just closed
        else if (previousState.isOpen && !currentState.isOpen) {
          this.notifyMarketEvent(market, 'close', new Date());
        }
      }

      // Update state
      this.marketStates.set(market, currentState);
    }
  }

  /**
   * Notify about a market event
   */
  private notifyMarketEvent(
    market: MarketIdentifier,
    event: 'open' | 'close',
    time: Date
  ): void {
    const marketName = this.getMarketName(market);
    const eventText = event === 'open' ? 'opened' : 'closed';
    const message = `${marketName} market has ${eventText}`;

    // Send browser notification if enabled
    if (this.notificationsEnabled) {
      this.sendBrowserNotification(marketName, message, event);
    }

    // Call registered callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(market, event, time);
      } catch (error) {
        console.error('Error in market event callback:', error);
      }
    });
  }

  /**
   * Send browser notification
   */
  private sendBrowserNotification(
    marketName: string,
    message: string,
    event: 'open' | 'close'
  ): void {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(`Market ${event === 'open' ? 'Open' : 'Close'}`, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `market-${event}`,
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Error sending browser notification:', error);
    }
  }

  /**
   * Get human-readable market name
   */
  private getMarketName(market: MarketIdentifier): string {
    const names: Record<MarketIdentifier, string> = {
      US: 'US (NYSE/NASDAQ)',
      EU: 'European (Euronext)',
      ASIA: 'Asian (TSE)',
    };
    return names[market];
  }

  /**
   * Format countdown string for display
   */
  formatCountdown(targetTime: Date): string {
    const now = new Date();
    const diffMs = targetTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Now';
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      return remainingHours > 0 
        ? `${diffDays}d ${remainingHours}h`
        : `${diffDays}d`;
    }

    if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      return remainingMinutes > 0
        ? `${diffHours}h ${remainingMinutes}m`
        : `${diffHours}h`;
    }

    return `${diffMinutes}m`;
  }
}

// Export singleton instance
export const marketAlertSystem = new MarketAlertSystem();
