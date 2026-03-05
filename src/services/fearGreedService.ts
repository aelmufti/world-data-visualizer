const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface FearGreedIndex {
  value: number;
  classification: string;
  color: string;
  timestamp: string;
  source: string;
  vix?: number;
  note?: string;
  valueClassification?: string;
}

export interface FearGreedData {
  crypto: FearGreedIndex | null;
  stock: FearGreedIndex | null;
  timestamp: string;
}

class FearGreedService {
  async getCryptoIndex(): Promise<FearGreedIndex> {
    const response = await fetch(`${API_BASE}/api/fear-greed/crypto`);
    if (!response.ok) {
      throw new Error('Failed to fetch crypto fear & greed index');
    }
    return response.json();
  }

  async getStockIndex(): Promise<FearGreedIndex> {
    const response = await fetch(`${API_BASE}/api/fear-greed/stock`);
    if (!response.ok) {
      throw new Error('Failed to fetch stock fear & greed index');
    }
    return response.json();
  }

  async getBothIndices(): Promise<FearGreedData> {
    const response = await fetch(`${API_BASE}/api/fear-greed/both`);
    if (!response.ok) {
      throw new Error('Failed to fetch fear & greed indices');
    }
    return response.json();
  }

  getGaugeColor(value: number): string {
    if (value <= 25) return '#EF4444';
    if (value <= 45) return '#F97316';
    if (value <= 55) return '#64748B';
    if (value <= 75) return '#10B981';
    return '#22C55E';
  }

  getGaugeGradient(value: number): string {
    // Create a gradient from red (0) to green (100)
    return `linear-gradient(90deg, 
      #EF4444 0%, 
      #F97316 25%, 
      #64748B 50%, 
      #10B981 75%, 
      #22C55E 100%)`;
  }
}

export const fearGreedService = new FearGreedService();
