import { useState, useEffect } from 'react';
import { MarketIndex } from '../types/stock-market';

const API_BASE_URL = 'http://localhost:8000/api';

// Symboles des indices majeurs avec leurs noms
const INDEX_SYMBOLS = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'DOW Jones' },
  { symbol: '^RUT', name: 'Russell 2000' },
  { symbol: '^VIX', name: 'VIX' },
  { symbol: '^FCHI', name: 'CAC 40' },
  { symbol: '^GDAXI', name: 'DAX' },
  { symbol: '^FTSE', name: 'FTSE 100' },
  { symbol: '^N225', name: 'Nikkei 225' },
  { symbol: '000001.SS', name: 'Shanghai Composite' }
];

export function useMarketIndexes() {
  const [indexes, setIndexes] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchIndexes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les quotes pour tous les indices
        const symbols = INDEX_SYMBOLS.map(idx => idx.symbol).join(',');
        const response = await fetch(`${API_BASE_URL}/quotes?symbols=${symbols}`, {
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const quotes = await response.json();

        if (!mounted) return;

        // Transformer les quotes en MarketIndex
        const indexData: MarketIndex[] = INDEX_SYMBOLS.map(({ symbol, name }) => {
          const quote = quotes.find((q: any) => q.symbol === symbol);
          
          if (quote) {
            return {
              symbol,
              name,
              value: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              lastUpdate: quote.timestamp
            };
          }

          // Fallback si le quote n'est pas trouvé
          return {
            symbol,
            name,
            value: 0,
            change: 0,
            changePercent: 0,
            lastUpdate: new Date().toISOString()
          };
        });

        setIndexes(indexData);
      } catch (err: any) {
        if (!mounted) return;
        
        console.error('Error fetching market indexes:', err);
        setError(err.message || 'Failed to fetch market indexes');
        
        // Utiliser des valeurs par défaut en cas d'erreur
        setIndexes(INDEX_SYMBOLS.map(({ symbol, name }) => ({
          symbol,
          name,
          value: 0,
          change: 0,
          changePercent: 0,
          lastUpdate: new Date().toISOString()
        })));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchIndexes();

    // Rafraîchir toutes les 60 secondes
    const interval = setInterval(fetchIndexes, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { indexes, loading, error };
}
