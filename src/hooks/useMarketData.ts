import { useState, useEffect } from 'react';

interface MacroIndicator {
  label: string;
  value: string;
  delta: string;
  up: boolean | null;
}

interface MarketDataResponse {
  sector: string;
  indicators: MacroIndicator[];
  timestamp: string;
}

export function useMarketData(sectorId: string) {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchMarketData() {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/market-data/${sectorId}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: MarketDataResponse = await response.json();

        if (mounted) {
          setIndicators(data.indicators);
        }
      } catch (err: any) {
        console.error('Error fetching market data:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchMarketData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [sectorId]);

  return { indicators, loading, error };
}
