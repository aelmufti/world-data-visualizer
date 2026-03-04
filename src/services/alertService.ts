/**
 * Alert Monitoring Service
 * 
 * Monitors watchlist stock prices against active alerts and triggers
 * browser notifications when alert conditions are met.
 * 
 * Features:
 * - Real-time price monitoring via WebSocket
 * - Browser notification integration
 * - Auto-disable alerts after triggering
 * - Permission request handling
 * - Integration with stockStorage for persistence
 */

import type { PriceAlert, StockQuote } from '../types/stock-market';
import { getStockWebSocketClient } from './stockWebSocket';
import { stockStorage } from './stockStorage';

type AlertCallback = (alert: PriceAlert, currentPrice: number) => void;

export class AlertService {
  private alerts: PriceAlert[] = [];
  private monitoredSymbols = new Set<string>();
  private isMonitoring = false;
  private wsClient = getStockWebSocketClient();
  private alertCallbacks = new Set<AlertCallback>();
  private notificationPermission: NotificationPermission = 'default';

  constructor() {
    // Load initial notification permission state
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
  }

  /**
   * Start monitoring alerts
   * Subscribes to WebSocket updates for stocks with active alerts
   */
  startMonitoring(alerts: PriceAlert[]): void {
    if (this.isMonitoring) {
      console.warn('Alert monitoring already started');
      return;
    }

    this.alerts = alerts;
    this.isMonitoring = true;

    // Get symbols that need monitoring (enabled alerts only)
    const symbolsToMonitor = this.getSymbolsToMonitor();

    if (symbolsToMonitor.length === 0) {
      console.log('No active alerts to monitor');
      return;
    }

    // Subscribe to WebSocket updates
    this.monitoredSymbols = new Set(symbolsToMonitor);
    this.wsClient.subscribe(symbolsToMonitor);

    // Register message handler
    this.wsClient.onMessage(this.handlePriceUpdate);

    console.log(`Alert monitoring started for ${symbolsToMonitor.length} symbols`);
  }

  /**
   * Stop monitoring alerts
   * Unsubscribes from WebSocket updates
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    // Unsubscribe from all monitored symbols
    if (this.monitoredSymbols.size > 0) {
      this.wsClient.unsubscribe(Array.from(this.monitoredSymbols));
    }

    this.monitoredSymbols.clear();
    this.isMonitoring = false;

    console.log('Alert monitoring stopped');
  }

  /**
   * Update the list of alerts being monitored
   * Adjusts WebSocket subscriptions as needed
   */
  updateAlerts(alerts: PriceAlert[]): void {
    this.alerts = alerts;

    if (!this.isMonitoring) {
      return;
    }

    // Calculate new symbols to monitor
    const newSymbols = this.getSymbolsToMonitor();
    const newSymbolsSet = new Set(newSymbols);

    // Find symbols to unsubscribe (no longer have active alerts)
    const toUnsubscribe = Array.from(this.monitoredSymbols).filter(
      symbol => !newSymbolsSet.has(symbol)
    );

    // Find symbols to subscribe (new active alerts)
    const toSubscribe = newSymbols.filter(
      symbol => !this.monitoredSymbols.has(symbol)
    );

    // Update subscriptions
    if (toUnsubscribe.length > 0) {
      this.wsClient.unsubscribe(toUnsubscribe);
      toUnsubscribe.forEach(symbol => this.monitoredSymbols.delete(symbol));
    }

    if (toSubscribe.length > 0) {
      this.wsClient.subscribe(toSubscribe);
      toSubscribe.forEach(symbol => this.monitoredSymbols.add(symbol));
    }

    console.log(`Alert monitoring updated: +${toSubscribe.length} -${toUnsubscribe.length} symbols`);
  }

  /**
   * Check alerts against current price
   * Called when price updates are received
   */
  checkAlerts(symbol: string, currentPrice: number): PriceAlert[] {
    const triggeredAlerts: PriceAlert[] = [];

    // Find all enabled alerts for this symbol
    const symbolAlerts = this.alerts.filter(
      alert => alert.symbol === symbol && alert.enabled && !alert.triggeredAt
    );

    for (const alert of symbolAlerts) {
      let isTriggered = false;

      if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
        isTriggered = true;
      }

      if (isTriggered) {
        triggeredAlerts.push(alert);
        
        // Trigger notification
        this.triggerNotification(alert, currentPrice);
        
        // Auto-disable alert
        this.disableAlert(alert);
        
        // Notify callbacks
        this.notifyCallbacks(alert, currentPrice);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Request notification permissions
   * Should be called on first alert creation
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (this.notificationPermission === 'granted') {
      return true;
    }

    if (this.notificationPermission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else {
        console.warn('Notification permission denied by user');
        return false;
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Register a callback for alert triggers
   */
  onAlertTriggered(callback: AlertCallback): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get current notification permission status
   */
  getNotificationPermission(): NotificationPermission {
    return this.notificationPermission;
  }

  // Private methods

  /**
   * Get list of symbols that need monitoring
   * Only includes symbols with enabled, non-triggered alerts
   */
  private getSymbolsToMonitor(): string[] {
    const symbols = new Set<string>();
    
    for (const alert of this.alerts) {
      if (alert.enabled && !alert.triggeredAt) {
        symbols.add(alert.symbol);
      }
    }
    
    return Array.from(symbols);
  }

  /**
   * Handle price update from WebSocket
   */
  private handlePriceUpdate = (quote: StockQuote): void => {
    if (!this.isMonitoring) {
      return;
    }

    // Check alerts for this symbol
    this.checkAlerts(quote.symbol, quote.price);
  };

  /**
   * Trigger browser notification for alert
   */
  private triggerNotification(alert: PriceAlert, currentPrice: number): void {
    if (!('Notification' in window)) {
      return;
    }

    if (this.notificationPermission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    try {
      const title = `Price Alert: ${alert.symbol}`;
      const body = `${alert.symbol} is now ${alert.condition} $${alert.targetPrice.toFixed(2)} (Current: $${currentPrice.toFixed(2)})`;
      
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `alert-${alert.id}`,
        requireInteraction: false,
        silent: false
      });

      // Auto-close notification after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      console.log(`Notification triggered for ${alert.symbol}`);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Auto-disable alert after triggering
   */
  private disableAlert(alert: PriceAlert): void {
    // Update alert state
    const updatedAlert: PriceAlert = {
      ...alert,
      enabled: false,
      triggeredAt: new Date().toISOString()
    };

    // Update in local alerts array
    const index = this.alerts.findIndex(a => a.id === alert.id);
    if (index !== -1) {
      this.alerts[index] = updatedAlert;
    }

    // Persist to localStorage
    stockStorage.saveAlerts(this.alerts);

    console.log(`Alert ${alert.id} auto-disabled after triggering`);
  }

  /**
   * Notify registered callbacks
   */
  private notifyCallbacks(alert: PriceAlert, currentPrice: number): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert, currentPrice);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }
}

// Singleton instance
let alertServiceInstance: AlertService | null = null;

/**
 * Get or create the AlertService instance
 */
export function getAlertService(): AlertService {
  if (!alertServiceInstance) {
    alertServiceInstance = new AlertService();
  }
  return alertServiceInstance;
}

// Export a simple interface for components
export const alertService = {
  start: (alerts: PriceAlert[]) => getAlertService().startMonitoring(alerts),
  stop: () => getAlertService().stopMonitoring(),
  update: (alerts: PriceAlert[]) => getAlertService().updateAlerts(alerts),
  check: (symbol: string, price: number) => getAlertService().checkAlerts(symbol, price),
  requestPermission: () => getAlertService().requestNotificationPermission(),
  onTriggered: (callback: AlertCallback) => getAlertService().onAlertTriggered(callback),
  isActive: () => getAlertService().isActive(),
  getPermission: () => getAlertService().getNotificationPermission()
};
