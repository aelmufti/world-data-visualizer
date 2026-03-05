import express from 'express';
import NodeCache from 'node-cache';
import duckdb from 'duckdb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

interface CortisolData {
  level: number; // 0-100
  classification: string;
  color: string;
  factors: {
    fearGreed: { value: number; weight: number; contribution: number };
    newsSentiment: { value: number; weight: number; contribution: number };
    marketVolatility: { value: number | null; weight: number; contribution: number };
    newsVolume: { value: number; weight: number; contribution: number };
  };
  timestamp: string;
}

// Calculate cortisol level based on multiple factors
function calculateCortisolLevel(
  fearGreedStock: number,
  fearGreedCrypto: number,
  avgNewsSentiment: number,
  vix: number | null,
  newsCount: number
): CortisolData {
  // Weights for each factor (total = 1.0)
  const weights = {
    fearGreed: 0.35,
    newsSentiment: 0.30,
    marketVolatility: 0.25,
    newsVolume: 0.10
  };

  // 1. Fear & Greed contribution (inverted: high fear = high cortisol)
  const avgFearGreed = (fearGreedStock + fearGreedCrypto) / 2;
  const fearGreedStress = 100 - avgFearGreed; // Invert: fear = stress
  const fearGreedContribution = fearGreedStress * weights.fearGreed;

  // 2. News sentiment contribution (negative sentiment = high cortisol)
  // Sentiment ranges from -1 to 1, convert to 0-100 stress scale
  const sentimentStress = ((1 - avgNewsSentiment) / 2) * 100;
  const sentimentContribution = sentimentStress * weights.newsSentiment;

  // 3. Market volatility contribution (high VIX = high cortisol)
  let volatilityStress = 50; // Default neutral
  if (vix !== null) {
    // VIX typically ranges 10-80, normalize to 0-100
    volatilityStress = Math.min(100, Math.max(0, ((vix - 10) / 70) * 100));
  }
  const volatilityContribution = volatilityStress * weights.marketVolatility;

  // 4. News volume contribution (high volume = high stress)
  // Normalize news count (assume 0-200 articles is normal range)
  const newsVolumeStress = Math.min(100, (newsCount / 200) * 100);
  const newsVolumeContribution = newsVolumeStress * weights.newsVolume;

  // Calculate final cortisol level
  const cortisolLevel = Math.round(
    fearGreedContribution +
    sentimentContribution +
    volatilityContribution +
    newsVolumeContribution
  );

  // Determine classification
  let classification: string;
  let color: string;
  
  if (cortisolLevel <= 20) {
    classification = 'Zen';
    color = '#22C55E'; // Green
  } else if (cortisolLevel <= 40) {
    classification = 'Calm';
    color = '#10B981'; // Light green
  } else if (cortisolLevel <= 60) {
    classification = 'Alert';
    color = '#F59E0B'; // Yellow
  } else if (cortisolLevel <= 80) {
    classification = 'Stressed';
    color = '#F97316'; // Orange
  } else {
    classification = 'Panic';
    color = '#EF4444'; // Red
  }

  return {
    level: cortisolLevel,
    classification,
    color,
    factors: {
      fearGreed: {
        value: Math.round(avgFearGreed),
        weight: weights.fearGreed,
        contribution: Math.round(fearGreedContribution)
      },
      newsSentiment: {
        value: Math.round(avgNewsSentiment * 100) / 100,
        weight: weights.newsSentiment,
        contribution: Math.round(sentimentContribution)
      },
      marketVolatility: {
        value: vix !== null ? Math.round(vix * 100) / 100 : null,
        weight: weights.marketVolatility,
        contribution: Math.round(volatilityContribution)
      },
      newsVolume: {
        value: newsCount,
        weight: weights.newsVolume,
        contribution: Math.round(newsVolumeContribution)
      }
    },
    timestamp: new Date().toISOString()
  };
}

// GET /api/cortisol
router.get('/', async (req, res) => {
  try {
    const cached = cache.get<CortisolData>('cortisol-level');
    if (cached) {
      return res.json(cached);
    }

    // Fetch Fear & Greed indices
    const fearGreedResponse = await fetch(`http://localhost:${process.env.PORT || 8000}/api/fear-greed/both`);
    const fearGreedData = await fearGreedResponse.json();

    const stockValue = fearGreedData.stock?.value || 50;
    const cryptoValue = fearGreedData.crypto?.value || 50;
    const vix = fearGreedData.stock?.vix || null;

    // Fetch news sentiment from database
    const dbPath = path.join(__dirname, '../data/financial_news.duckdb');
    
    // Use DuckDB to query sentiment data
    const db = new duckdb.Database(dbPath, { readonly: true });
    
    const queryPromise = new Promise<{ avg_sentiment: number | null; count: number }>((resolve, reject) => {
      db.all(`
        SELECT AVG(sentiment) as avg_sentiment, COUNT(*) as count
        FROM articles
        WHERE publishedAt >= datetime('now', '-24 hours')
      `, (err: Error | null, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const result = rows[0] || { avg_sentiment: null, count: 0 };
          resolve(result);
        }
      });
    });

    try {
      const sentimentResult = await queryPromise;
      const avgSentiment = sentimentResult.avg_sentiment || 0;
      const newsCount = sentimentResult.count || 0;

      db.close();

      // Calculate cortisol level
      const cortisolData = calculateCortisolLevel(
        stockValue,
        cryptoValue,
        avgSentiment,
        vix,
        newsCount
      );

      // Cache for 10 minutes
      cache.set('cortisol-level', cortisolData, 600);
      
      res.json(cortisolData);
    } catch (dbError) {
      db.close();
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error calculating cortisol level:', error);
    
    // Return fallback data
    const fallback: CortisolData = {
      level: 50,
      classification: 'Alert',
      color: '#F59E0B',
      factors: {
        fearGreed: { value: 50, weight: 0.35, contribution: 18 },
        newsSentiment: { value: 0, weight: 0.30, contribution: 15 },
        marketVolatility: { value: null, weight: 0.25, contribution: 13 },
        newsVolume: { value: 0, weight: 0.10, contribution: 4 }
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(fallback);
  }
});

export default router;
