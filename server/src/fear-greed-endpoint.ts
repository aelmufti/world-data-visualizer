import express from 'express';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// Fear & Greed Index values and classifications
const getClassification = (value: number) => {
  if (value <= 25) return { label: 'Extreme Fear', color: '#EF4444' };
  if (value <= 45) return { label: 'Fear', color: '#F97316' };
  if (value <= 55) return { label: 'Neutral', color: '#64748B' };
  if (value <= 75) return { label: 'Greed', color: '#10B981' };
  return { label: 'Extreme Greed', color: '#22C55E' };
};

// GET /api/fear-greed/crypto
router.get('/crypto', async (req, res) => {
  try {
    const cached = cache.get<any>('crypto-fear-greed');
    if (cached) {
      return res.json(cached);
    }

    // Fetch from Alternative.me Crypto Fear & Greed Index API
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const latest = data.data[0];
      const value = parseInt(latest.value);
      const classification = getClassification(value);

      const result = {
        value,
        classification: classification.label,
        color: classification.color,
        timestamp: new Date(parseInt(latest.timestamp) * 1000).toISOString(),
        valueClassification: latest.value_classification,
        source: 'Alternative.me'
      };

      // Cache for 1 hour to reduce API calls
      cache.set('crypto-fear-greed', result, 3600);
      return res.json(result);
    }

    throw new Error('No data available');
  } catch (error: any) {
    console.error('Error fetching crypto fear & greed index:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fear-greed/stock
router.get('/stock', async (req, res) => {
  try {
    const cached = cache.get<any>('stock-fear-greed');
    if (cached) {
      return res.json(cached);
    }

    // Fetch from CNN Fear & Greed Index (via scraping or alternative source)
    // Since CNN doesn't have a public API, we'll use a calculated approximation
    // based on VIX, market breadth, and other indicators
    
    // For now, we'll use a mock calculation based on VIX
    // In production, you'd want to implement proper calculation or use a paid API
    
    try {
      const vixResponse = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!vixResponse.ok) {
        throw new Error(`Yahoo Finance returned ${vixResponse.status}`);
      }
      
      const vixData = await vixResponse.json();
      
      if (vixData.chart?.result?.[0]?.meta?.regularMarketPrice) {
        const vix = vixData.chart.result[0].meta.regularMarketPrice;
        
        // Simple approximation: VIX inversely correlates with Fear & Greed
        // VIX < 12 = Extreme Greed (80-100)
        // VIX 12-20 = Greed/Neutral (50-80)
        // VIX 20-30 = Fear (25-50)
        // VIX > 30 = Extreme Fear (0-25)
        
        let value: number;
        if (vix < 12) {
          value = 80 + (12 - vix) * 2;
        } else if (vix < 20) {
          value = 50 + (20 - vix) * 3.75;
        } else if (vix < 30) {
          value = 25 + (30 - vix) * 2.5;
        } else {
          value = Math.max(0, 25 - (vix - 30) * 1.5);
        }
        
        value = Math.round(Math.max(0, Math.min(100, value)));
        const classification = getClassification(value);

        const result = {
          value,
          classification: classification.label,
          color: classification.color,
          timestamp: new Date().toISOString(),
          vix: Math.round(vix * 100) / 100,
          source: 'Calculated from VIX',
          note: 'Approximation based on VIX volatility index'
        };

        // Cache for longer (2 hours) to avoid rate limiting
        cache.set('stock-fear-greed', result, 7200);
        return res.json(result);
      }
    } catch (fetchError: any) {
      console.warn('Failed to fetch VIX data:', fetchError.message);
      
      // Return a fallback neutral value when API fails
      const fallbackResult = {
        value: 50,
        classification: 'Neutral',
        color: '#64748B',
        timestamp: new Date().toISOString(),
        vix: null,
        source: 'Fallback (API unavailable)',
        note: 'Using neutral value due to API rate limiting'
      };
      
      // Cache fallback for 30 minutes
      cache.set('stock-fear-greed', fallbackResult, 1800);
      return res.json(fallbackResult);
    }

    throw new Error('Unable to calculate stock fear & greed index');
  } catch (error: any) {
    console.error('Error fetching stock fear & greed index:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fear-greed/both
router.get('/both', async (req, res) => {
  try {
    const [cryptoResponse, stockResponse] = await Promise.allSettled([
      fetch(`http://localhost:${process.env.PORT || 8000}/api/fear-greed/crypto`).then(r => r.json()),
      fetch(`http://localhost:${process.env.PORT || 8000}/api/fear-greed/stock`).then(r => r.json())
    ]);

    const result: any = {
      crypto: cryptoResponse.status === 'fulfilled' ? cryptoResponse.value : null,
      stock: stockResponse.status === 'fulfilled' ? stockResponse.value : null,
      timestamp: new Date().toISOString()
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching fear & greed indices:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
