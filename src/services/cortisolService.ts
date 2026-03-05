const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CortisolFactor {
  value: number | null;
  weight: number;
  contribution: number;
}

export interface CortisolData {
  level: number;
  classification: string;
  color: string;
  factors: {
    fearGreed: CortisolFactor;
    newsSentiment: CortisolFactor;
    marketVolatility: CortisolFactor;
    newsVolume: CortisolFactor;
  };
  timestamp: string;
}

class CortisolService {
  async getCortisolLevel(): Promise<CortisolData> {
    const response = await fetch(`${API_BASE}/api/cortisol`);
    if (!response.ok) {
      throw new Error('Failed to fetch cortisol level');
    }
    return response.json();
  }

  getGaugeColor(level: number): string {
    if (level <= 20) return '#22C55E'; // Green - Zen
    if (level <= 40) return '#10B981'; // Light green - Calm
    if (level <= 60) return '#F59E0B'; // Yellow - Alert
    if (level <= 80) return '#F97316'; // Orange - Stressed
    return '#EF4444'; // Red - Panic
  }

  getEmoji(level: number): string {
    if (level <= 20) return '😌';
    if (level <= 40) return '🙂';
    if (level <= 60) return '😐';
    if (level <= 80) return '😰';
    return '😱';
  }
}

export const cortisolService = new CortisolService();
