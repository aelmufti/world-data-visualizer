const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ServiceStatus {
  status: 'operational' | 'down' | 'degraded';
  name: string;
  icon: string;
}

export interface BackendStatus {
  overall: 'operational' | 'degraded' | 'down';
  timestamp: string;
  services: {
    [key: string]: ServiceStatus;
  };
}

class BackendStatusService {
  private cache: BackendStatus | null = null;
  private lastFetch: number = 0;
  private cacheDuration = 5000; // 5 seconds

  async getStatus(): Promise<BackendStatus> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.cache && (now - this.lastFetch) < this.cacheDuration) {
      return this.cache;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch backend status');
      }

      const data = await response.json();
      this.cache = data;
      this.lastFetch = now;
      
      return data;
    } catch (error) {
      console.error('Error fetching backend status:', error);
      
      // Return degraded status on error
      return {
        overall: 'down',
        timestamp: new Date().toISOString(),
        services: {
          error: {
            status: 'down',
            name: 'Backend Unavailable',
            icon: '❌'
          }
        }
      };
    }
  }

  clearCache() {
    this.cache = null;
    this.lastFetch = 0;
  }
}

export const backendStatusService = new BackendStatusService();
