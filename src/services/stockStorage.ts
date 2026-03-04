/**
 * LocalStorage service for persisting stock market data
 * Handles watchlist, alerts, preferences, and recent searches
 */

import type {
  WatchlistStorage,
  AlertsStorage,
  PreferencesStorage,
  RecentSearchesStorage,
  PriceAlert
} from '../types/stock-market';

// Storage keys
const STORAGE_KEYS = {
  WATCHLIST: 'stock-watchlist',
  ALERTS: 'stock-alerts',
  PREFERENCES: 'stock-preferences',
  RECENT_SEARCHES: 'stock-recent-searches'
} as const;

// Default values
const DEFAULT_PREFERENCES: PreferencesStorage = {
  version: 1,
  defaultTimeframe: '1d',
  defaultView: 'overview',
  chartTheme: 'dark',
  enableNotifications: false
};

class StockStorageService {
  /**
   * Save watchlist to localStorage
   */
  saveWatchlist(symbols: string[]): boolean {
    try {
      const data: WatchlistStorage = {
        version: 1,
        symbols,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(data));
      return true;
    } catch (error) {
      return this.handleStorageError(error, 'watchlist');
    }
  }

  /**
   * Load watchlist from localStorage
   */
  loadWatchlist(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      
      if (!stored) {
        return [];
      }

      const data: WatchlistStorage = JSON.parse(stored);
      
      // Validate version
      if (data.version !== 1) {
        console.warn('Watchlist version mismatch, resetting');
        return [];
      }

      return data.symbols || [];
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      return [];
    }
  }

  /**
   * Save alerts to localStorage
   */
  saveAlerts(alerts: PriceAlert[]): boolean {
    try {
      const data: AlertsStorage = {
        version: 1,
        alerts,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(data));
      return true;
    } catch (error) {
      return this.handleStorageError(error, 'alerts');
    }
  }

  /**
   * Load alerts from localStorage
   */
  loadAlerts(): PriceAlert[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ALERTS);
      
      if (!stored) {
        return [];
      }

      const data: AlertsStorage = JSON.parse(stored);
      
      // Validate version
      if (data.version !== 1) {
        console.warn('Alerts version mismatch, resetting');
        return [];
      }

      return data.alerts || [];
    } catch (error) {
      console.error('Failed to load alerts:', error);
      return [];
    }
  }

  /**
   * Save preferences to localStorage
   */
  savePreferences(preferences: Partial<Omit<PreferencesStorage, 'version'>>): boolean {
    try {
      const current = this.loadPreferences();
      const data: PreferencesStorage = {
        ...current,
        ...preferences,
        version: 1
      };
      
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(data));
      return true;
    } catch (error) {
      return this.handleStorageError(error, 'preferences');
    }
  }

  /**
   * Load preferences from localStorage
   */
  loadPreferences(): PreferencesStorage {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      
      if (!stored) {
        return DEFAULT_PREFERENCES;
      }

      const data: PreferencesStorage = JSON.parse(stored);
      
      // Validate version
      if (data.version !== 1) {
        console.warn('Preferences version mismatch, using defaults');
        return DEFAULT_PREFERENCES;
      }

      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_PREFERENCES,
        ...data
      };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Save recent searches to localStorage (max 10 items)
   */
  saveRecentSearches(searches: string[]): boolean {
    try {
      // Limit to 10 most recent
      const limitedSearches = searches.slice(0, 10);
      
      const data: RecentSearchesStorage = {
        version: 1,
        searches: limitedSearches,
        maxItems: 10
      };
      
      localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(data));
      return true;
    } catch (error) {
      return this.handleStorageError(error, 'recent searches');
    }
  }

  /**
   * Load recent searches from localStorage
   */
  loadRecentSearches(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      
      if (!stored) {
        return [];
      }

      const data: RecentSearchesStorage = JSON.parse(stored);
      
      // Validate version
      if (data.version !== 1) {
        console.warn('Recent searches version mismatch, resetting');
        return [];
      }

      return data.searches || [];
    } catch (error) {
      console.error('Failed to load recent searches:', error);
      return [];
    }
  }

  /**
   * Add a search to recent searches
   */
  addRecentSearch(search: string): boolean {
    const searches = this.loadRecentSearches();
    
    // Remove if already exists
    const filtered = searches.filter(s => s !== search);
    
    // Add to beginning
    const updated = [search, ...filtered].slice(0, 10);
    
    return this.saveRecentSearches(updated);
  }

  /**
   * Clear all stored data
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove ${key}:`, error);
      }
    });
  }

  /**
   * Clear specific storage key
   */
  clear(key: keyof typeof STORAGE_KEYS): void {
    try {
      localStorage.removeItem(STORAGE_KEYS[key]);
    } catch (error) {
      console.error(`Failed to clear ${key}:`, error);
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): {
    used: number;
    available: number;
    percentage: number;
  } {
    try {
      let used = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          used += item.length * 2; // UTF-16 encoding
        }
      });

      // Most browsers have 5-10MB limit, we'll use 5MB as conservative estimate
      const available = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = (used / available) * 100;

      return {
        used,
        available,
        percentage
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // Private methods

  private handleStorageError(error: unknown, dataType: string): boolean {
    if (error instanceof Error) {
      // Check for quota exceeded error
      if (
        error.name === 'QuotaExceededError' ||
        error.message.includes('quota') ||
        error.message.includes('storage')
      ) {
        console.error(`Storage quota exceeded while saving ${dataType}`);
        
        // Attempt to free up space by clearing old data
        this.clearOldData();
        
        return false;
      }
    }

    console.error(`Failed to save ${dataType}:`, error);
    return false;
  }

  private clearOldData(): void {
    // Clear recent searches first (least important)
    try {
      localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
      console.log('Cleared recent searches to free up space');
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }
}

// Singleton instance
export const stockStorage = new StockStorageService();
