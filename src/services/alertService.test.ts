/**
 * Unit tests for AlertService
 * Tests alert monitoring, notification triggering, and auto-disable functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlertService } from './alertService';
import type { PriceAlert } from '../types/stock-market';
import { stockStorage } from './stockStorage';

// Mock dependencies
vi.mock('./stockWebSocket', () => ({
  getStockWebSocketClient: () => ({
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    onMessage: vi.fn()
  })
}));

vi.mock('./stockStorage', () => ({
  stockStorage: {
    saveAlerts: vi.fn(),
    loadAlerts: vi.fn(() => [])
  }
}));

// Mock Notification API
const mockNotification = vi.fn();

beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();
  
  // Mock window object with Notification
  if (typeof window === 'undefined') {
    (global as any).window = {
      Notification: mockNotification
    };
  } else {
    (window as any).Notification = mockNotification;
  }
  
  // Mock Notification API
  global.Notification = mockNotification as any;
  Object.defineProperty(global.Notification, 'permission', {
    writable: true,
    value: 'granted'
  });
  global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
  
  // Ensure Notification is in window
  (global as any).window.Notification = global.Notification;
});

afterEach(() => {
  // Cleanup
});

describe('AlertService', () => {
  describe('startMonitoring', () => {
    it('should start monitoring enabled alerts', () => {
      const service = new AlertService();
      const alerts: PriceAlert[] = [
        {
          id: 'alert-1',
          symbol: 'AAPL',
          condition: 'above',
          targetPrice: 150,
          enabled: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'alert-2',
          symbol: 'GOOGL',
          condition: 'below',
          targetPrice: 100,
          enabled: true,
          createdAt: new Date().toISOString()
        }
      ];

      service.startMonitoring(alerts);

      expect(service.isActive()).toBe(true);
    });

    it('should not monitor disabled alerts', () => {
      const service = new AlertService();
      const alerts: PriceAlert[] = [
        {
          id: 'alert-1',
          symbol: 'AAPL',
          condition: 'above',
          targetPrice: 150,
          enabled: false,
          createdAt: new Date().toISOString()
        }
      ];

      service.startMonitoring(alerts);

      expect(service.isActive()).toBe(true);
    });

    it('should not start monitoring twice', () => {
      const service = new AlertService();
      const alerts: PriceAlert[] = [
        {
          id: 'alert-1',
          symbol: 'AAPL',
          condition: 'above',
          targetPrice: 150,
          enabled: true,
          createdAt: new Date().toISOString()
        }
      ];

      service.startMonitoring(alerts);
      const consoleSpy = vi.spyOn(console, 'warn');
      service.startMonitoring(alerts);

      expect(consoleSpy).toHaveBeenCalledWith('Alert monitoring already started');
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring and clear subscriptions', () => {
      const service = new AlertService();
      const alerts: PriceAlert[] = [
        {
          id: 'alert-1',
          symbol: 'AAPL',
          condition: 'above',
          targetPrice: 150,
          enabled: true,
          createdAt: new Date().toISOString()
        }
      ];

      service.startMonitoring(alerts);
      expect(service.isActive()).toBe(true);

      service.stopMonitoring();
      expect(service.isActive()).toBe(false);
    });
  });

  describe('checkAlerts', () => {
    it('should trigger alert when price goes above target', () => {
      const service = new AlertService();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      service.startMonitoring([alert]);

      const triggered = service.checkAlerts('AAPL', 151);

      expect(triggered).toHaveLength(1);
      expect(triggered[0].id).toBe('alert-1');
    });

    it('should trigger alert when price goes below target', () => {
      const service = new AlertService();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'below',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      service.startMonitoring([alert]);

      const triggered = service.checkAlerts('AAPL', 149);

      expect(triggered).toHaveLength(1);
      expect(triggered[0].id).toBe('alert-1');
    });

    it('should not trigger alert when condition not met', () => {
      const service = new AlertService();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      service.startMonitoring([alert]);

      const triggered = service.checkAlerts('AAPL', 149);

      expect(triggered).toHaveLength(0);
    });

    it('should not trigger disabled alerts', () => {
      const service = new AlertService();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 150,
        enabled: false,
        createdAt: new Date().toISOString()
      };

      service.startMonitoring([alert]);

      const triggered = service.checkAlerts('AAPL', 151);

      expect(triggered).toHaveLength(0);
    });

    it('should not trigger already triggered alerts', () => {
      const service = new AlertService();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString(),
        triggeredAt: new Date().toISOString()
      };

      service.startMonitoring([alert]);

      const triggered = service.checkAlerts('AAPL', 151);

      expect(triggered).toHaveLength(0);
    });

    it('should trigger alert at exact target price for above condition', () => {
      const service = new AlertService();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      service.startMonitoring([alert]);

      const triggered = service.checkAlerts('AAPL', 150);

      expect(triggered).toHaveLength(1);
    });

    it('should trigger alert at exact target price for below condition', () => {
      const service = new AlertService();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'below',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      service.startMonitoring([alert]);

      const triggered = service.checkAlerts('AAPL', 150);

      expect(triggered).toHaveLength(1);
    });

    it('should trigger multiple alerts for same symbol', () => {
      const service = new AlertService();
      const alerts: PriceAlert[] = [
        {
          id: 'alert-1',
          symbol: 'AAPL',
          condition: 'above',
          targetPrice: 150,
          enabled: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'alert-2',
          symbol: 'AAPL',
          condition: 'above',
          targetPrice: 145,
          enabled: true,
          createdAt: new Date().toISOString()
        }
      ];

      service.startMonitoring(alerts);

      const triggered = service.checkAlerts('AAPL', 151);

      expect(triggered).toHaveLength(2);
    });
  });

  describe('updateAlerts', () => {
    it('should update monitored symbols when alerts change', () => {
      const service = new AlertService();
      const initialAlerts: PriceAlert[] = [
        {
          id: 'alert-1',
          symbol: 'AAPL',
          condition: 'above',
          targetPrice: 150,
          enabled: true,
          createdAt: new Date().toISOString()
        }
      ];

      service.startMonitoring(initialAlerts);

      const updatedAlerts: PriceAlert[] = [
        {
          id: 'alert-1',
          symbol: 'AAPL',
          condition: 'above',
          targetPrice: 150,
          enabled: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'alert-2',
          symbol: 'GOOGL',
          condition: 'below',
          targetPrice: 100,
          enabled: true,
          createdAt: new Date().toISOString()
        }
      ];

      service.updateAlerts(updatedAlerts);

      // Should now monitor both symbols
      const triggeredAAPL = service.checkAlerts('AAPL', 151);
      const triggeredGOOGL = service.checkAlerts('GOOGL', 99);

      expect(triggeredAAPL).toHaveLength(1);
      expect(triggeredGOOGL).toHaveLength(1);
    });
  });

  describe('requestNotificationPermission', () => {
    it('should return true when permission is already granted', async () => {
      Object.defineProperty(global.Notification, 'permission', {
        writable: true,
        value: 'granted'
      });
      const service = new AlertService();

      const result = await service.requestNotificationPermission();

      expect(result).toBe(true);
    });

    it('should return false when permission is denied', async () => {
      Object.defineProperty(global.Notification, 'permission', {
        writable: true,
        value: 'denied'
      });
      const service = new AlertService();

      const result = await service.requestNotificationPermission();

      expect(result).toBe(false);
    });

    it('should request permission when default', async () => {
      Object.defineProperty(global.Notification, 'permission', {
        writable: true,
        value: 'default'
      });
      global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
      const service = new AlertService();

      const result = await service.requestNotificationPermission();

      expect(result).toBe(true);
      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });

    it('should return false when browser does not support notifications', async () => {
      const originalNotification = global.Notification;
      const originalWindowNotification = (global as any).window.Notification;
      
      // Remove Notification from both global and window
      // @ts-expect-error - Testing unsupported browser
      delete global.Notification;
      delete (global as any).window.Notification;

      const service = new AlertService();
      const result = await service.requestNotificationPermission();

      expect(result).toBe(false);

      // Restore
      global.Notification = originalNotification;
      (global as any).window.Notification = originalWindowNotification;
    });
  });

  describe('onAlertTriggered', () => {
    it('should call registered callbacks when alert triggers', () => {
      const service = new AlertService();
      const callback = vi.fn();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      service.onAlertTriggered(callback);
      service.startMonitoring([alert]);
      service.checkAlerts('AAPL', 151);

      expect(callback).toHaveBeenCalledWith(alert, 151);
    });

    it('should allow unregistering callbacks', () => {
      const service = new AlertService();
      const callback = vi.fn();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      const unregister = service.onAlertTriggered(callback);
      unregister();

      service.startMonitoring([alert]);
      service.checkAlerts('AAPL', 151);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('auto-disable after trigger', () => {
    it('should auto-disable alert after triggering', () => {
      const service = new AlertService();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      service.startMonitoring([alert]);
      service.checkAlerts('AAPL', 151);

      // Should save updated alerts to storage
      expect(stockStorage.saveAlerts).toHaveBeenCalled();
      
      // Check that the saved alerts have the alert disabled
      const savedAlerts = (stockStorage.saveAlerts as any).mock.calls[0][0];
      expect(savedAlerts[0].enabled).toBe(false);
      expect(savedAlerts[0].triggeredAt).toBeDefined();
    });

    it('should not trigger same alert twice', () => {
      const service = new AlertService();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      service.startMonitoring([alert]);
      
      // First trigger
      const triggered1 = service.checkAlerts('AAPL', 151);
      expect(triggered1).toHaveLength(1);

      // Second check should not trigger (alert is now disabled)
      const triggered2 = service.checkAlerts('AAPL', 152);
      expect(triggered2).toHaveLength(0);
    });
  });

  describe('notification triggering', () => {
    it('should create notification when alert triggers', () => {
      Object.defineProperty(global.Notification, 'permission', {
        writable: true,
        value: 'granted'
      });
      const service = new AlertService();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      service.startMonitoring([alert]);
      service.checkAlerts('AAPL', 151);

      expect(mockNotification).toHaveBeenCalledWith(
        'Price Alert: AAPL',
        expect.objectContaining({
          body: expect.stringContaining('AAPL is now above $150.00')
        })
      );
    });

    it('should not create notification when permission denied', () => {
      Object.defineProperty(global.Notification, 'permission', {
        writable: true,
        value: 'denied'
      });
      const service = new AlertService();
      const alert: PriceAlert = {
        id: 'alert-1',
        symbol: 'AAPL',
        condition: 'above',
        targetPrice: 150,
        enabled: true,
        createdAt: new Date().toISOString()
      };

      service.startMonitoring([alert]);
      service.checkAlerts('AAPL', 151);

      expect(mockNotification).not.toHaveBeenCalled();
    });
  });
});
