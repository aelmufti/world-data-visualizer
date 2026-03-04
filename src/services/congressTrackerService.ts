// Service for Congress & Senate trade tracker API
export interface CongressTrade {
  id: string;
  filing_id: string;
  politician: string;
  full_name: string;
  party: 'D' | 'R';
  state: string;
  chamber: 'house' | 'senate';
  ticker: string;
  asset_name: string;
  asset_type: string;
  action: string;
  transaction_date: string;
  notification_date: string;
  amount_min: number;
  amount_max: number;
  amount_label: string;
  notes: string;
  owner: string;
  partial: boolean;
  pdf_url: string;
  inserted_at: string;
  priceAtTrade?: number | null;
  priceNow?: number | null;
  returnPct?: number | null;
  isWin?: boolean | null;
}

export interface Politician {
  lastName: string;
  fullName: string;
  party: 'D' | 'R';
  state: string;
  chamber: 'house' | 'senate';
  winRate: number | null;
  totalTrades: number;
  resolvedTrades: number;
}

export interface CongressAlert {
  id: string;
  trade_id: string;
  detected_at: string;
  read: boolean;
  // Trade data included
  [key: string]: any;
}

export interface SystemStatus {
  lastPollTime: string | null;
  isPolling: boolean;
  totalFilings: number;
  totalTrades: number;
  unreadAlerts: number;
  pdfToTextAvailable: boolean;
  pdfToTextInstall: string;
  trackedPoliticians: number;
}

class CongressTrackerService {
  private baseUrl = 'http://localhost:8000/api/congress';
  private eventSource: EventSource | null = null;

  async getTrades(filters?: {
    politician?: string;
    ticker?: string;
    action?: string;
    chamber?: string;
  }): Promise<CongressTrade[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.politician) params.set('politician', filters.politician);
      if (filters?.ticker) params.set('ticker', filters.ticker);
      if (filters?.action) params.set('action', filters.action);
      if (filters?.chamber) params.set('chamber', filters.chamber);

      const url = `${this.baseUrl}/trades${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.trades || [];
    } catch (error) {
      console.error('Error fetching trades:', error);
      return [];
    }
  }

  async getTradesByPolitician(lastName: string): Promise<CongressTrade[]> {
    try {
      const response = await fetch(`${this.baseUrl}/trades/${lastName}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.trades || [];
    } catch (error) {
      console.error('Error fetching politician trades:', error);
      return [];
    }
  }

  async getPoliticians(): Promise<Politician[]> {
    try {
      const response = await fetch(`${this.baseUrl}/politicians`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.politicians || [];
    } catch (error) {
      console.error('Error fetching politicians:', error);
      return [];
    }
  }

  async getAlerts(unreadOnly: boolean = false): Promise<CongressAlert[]> {
    try {
      const url = `${this.baseUrl}/alerts${unreadOnly ? '?unread=true' : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.alerts || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  async markAlertRead(alertId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/alerts/${alertId}/read`, {
        method: 'PATCH'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error marking alert read:', error);
      return false;
    }
  }

  async markAllAlertsRead(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/alerts/read-all`, {
        method: 'PATCH'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error marking all alerts read:', error);
      return false;
    }
  }

  async getStatus(): Promise<SystemStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching status:', error);
      return null;
    }
  }

  // Real-time alert stream
  subscribeToAlerts(onNewTrade: (trade: CongressTrade) => void): () => void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`${this.baseUrl}/alerts/stream`);

    this.eventSource.addEventListener('new-trade', (event) => {
      try {
        const trade = JSON.parse(event.data);
        onNewTrade(trade);
      } catch (error) {
        console.error('Error parsing trade event:', error);
      }
    });

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    // Return cleanup function
    return () => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatAmount(min: number, max: number): string {
    const format = (n: number) => {
      if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
      return `$${n}`;
    };

    if (min === max) return format(min);
    return `${format(min)} – ${format(max)}`;
  }
}

export const congressTrackerService = new CongressTrackerService();
