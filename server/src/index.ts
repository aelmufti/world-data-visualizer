import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { db, collections } from './firebase.js';
import { nlpProcessor } from './nlp.js';
import NodeCache from 'node-cache';
import aggregationRouter from './aggregation-endpoint.js';
import marketDataRouter from './market-data-endpoint.js';
import { setupAISProxy } from './ais-proxy.js';

const app = express();
const PORT = process.env.PORT || 8000;
const cache = new NodeCache({ stdTTL: 60 });

// Créer un serveur HTTP pour supporter WebSocket
const server = createServer(app);

app.use(cors());
app.use(express.json());

// Setup AIS WebSocket proxy
setupAISProxy(server);

// Routes d'agrégation intelligente
app.use('/api/aggregated', aggregationRouter);

// Routes de données de marché
app.use('/api', marketDataRouter);

// Middleware: API Key verification
const verifyApiKey = async (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const keyDoc = await db.collection(collections.apiKeys)
    .where('key', '==', apiKey)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (keyDoc.empty) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.apiKey = keyDoc.docs[0].data();
  next();
};

// Middleware: Rate limiting
const rateLimiter = (req: any, res: any, next: any) => {
  const key = `rate:${req.apiKey.key}`;
  const current = cache.get<number>(key) || 0;

  if (current >= req.apiKey.rateLimit) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  cache.set(key, current + 1, 60);
  next();
};

app.get('/', (req, res) => {
  res.json({ message: 'Financial News API', version: '1.0.0' });
});

// GET /articles
app.get('/articles', verifyApiKey, rateLimiter, async (req, res) => {
  try {
    const { ticker, event_type, sentiment_min, sentiment_max, from_date, to_date, limit = 20, offset = 0, sort_by = 'publishedAt' } = req.query;

    let query: any = db.collection(collections.articles);

    if (from_date) {
      query = query.where('publishedAt', '>=', new Date(from_date as string));
    }
    if (to_date) {
      query = query.where('publishedAt', '<=', new Date(to_date as string));
    }
    if (sentiment_min) {
      query = query.where('rawSentiment', '>=', parseFloat(sentiment_min as string));
    }
    if (sentiment_max) {
      query = query.where('rawSentiment', '<=', parseFloat(sentiment_max as string));
    }

    query = query.orderBy(sort_by as string, 'desc').limit(parseInt(limit as string));

    const snapshot = await query.get();
    const articles = [];

    for (const doc of snapshot.docs) {
      const article = doc.data();
      
      // Get mentions
      const mentionsSnapshot = await db.collection(collections.mentions)
        .where('articleId', '==', doc.id)
        .get();

      const companies = mentionsSnapshot.docs.map(m => m.data());

      // Filter by ticker if specified
      if (ticker) {
        const tickers = (ticker as string).split(',').map(t => t.trim().toUpperCase());
        if (!companies.some(c => tickers.includes(c.ticker))) {
          continue;
        }
      }

      const latency = (article.ingestedAt.toDate().getTime() - article.publishedAt.toDate().getTime()) / 1000;

      articles.push({
        id: doc.id,
        title: article.title,
        url: article.url,
        publishedAt: article.publishedAt.toDate().toISOString(),
        ingestedAt: article.ingestedAt.toDate().toISOString(),
        latencySeconds: latency,
        source: article.sourceDomain,
        companies: companies.map(c => ({
          ticker: c.ticker,
          mentionCount: c.mentionCount,
          entitySentiment: c.entitySentiment,
          isPrimarySubject: c.isPrimarySubject,
          eventTags: c.eventTags || [],
        })),
      });
    }

    res.json(articles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /companies/:ticker/summary
app.get('/companies/:ticker/summary', verifyApiKey, rateLimiter, async (req, res) => {
  try {
    const { ticker } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;

    const companySnapshot = await db.collection(collections.companies)
      .where('ticker', '==', ticker.toUpperCase())
      .limit(1)
      .get();

    if (companySnapshot.empty) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = companySnapshot.docs[0];
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get mentions
    const mentionsSnapshot = await db.collection(collections.mentions)
      .where('companyId', '==', company.id)
      .get();

    const mentions = mentionsSnapshot.docs.map(d => d.data());
    const articleCount = mentions.length;
    const avgSentiment = mentions.length > 0
      ? mentions.reduce((sum, m) => sum + m.entitySentiment, 0) / mentions.length
      : 0;

    // Get recent events
    const eventsSnapshot = await db.collection(collections.events)
      .where('companyId', '==', company.id)
      .where('detectedAt', '>=', since)
      .orderBy('detectedAt', 'desc')
      .limit(10)
      .get();

    const recentEvents = eventsSnapshot.docs.map(d => {
      const e = d.data();
      return {
        eventType: e.eventType,
        confidence: e.confidence,
        detectedAt: e.detectedAt.toDate().toISOString(),
      };
    });

    res.json({
      ticker: ticker.toUpperCase(),
      articleCount24h: articleCount,
      avgSentiment,
      recentEvents,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /events
app.get('/events', verifyApiKey, rateLimiter, async (req, res) => {
  try {
    const { ticker, event_type, confidence_min = 0, from_date, limit = 50 } = req.query;

    let query: any = db.collection(collections.events)
      .where('confidence', '>=', parseFloat(confidence_min as string));

    if (ticker) {
      query = query.where('ticker', '==', (ticker as string).toUpperCase());
    }
    if (event_type) {
      query = query.where('eventType', '==', event_type);
    }
    if (from_date) {
      query = query.where('detectedAt', '>=', new Date(from_date as string));
    }

    query = query.orderBy('detectedAt', 'desc').limit(parseInt(limit as string));

    const snapshot = await query.get();
    const events = snapshot.docs.map((doc: any) => {
      const e = doc.data();
      return {
        id: doc.id,
        ticker: e.ticker,
        eventType: e.eventType,
        confidence: e.confidence,
        detectedAt: e.detectedAt.toDate().toISOString(),
        articleUrl: e.articleUrl,
      };
    });

    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /trending
app.get('/trending', verifyApiKey, rateLimiter, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const limit = parseInt(req.query.limit as string) || 20;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const mentionsSnapshot = await db.collection(collections.mentions).get();
    const mentions = mentionsSnapshot.docs.map(d => d.data());

    // Aggregate by ticker
    const tickerStats: Record<string, { count: number; sentiments: number[] }> = {};

    for (const mention of mentions) {
      if (!tickerStats[mention.ticker]) {
        tickerStats[mention.ticker] = { count: 0, sentiments: [] };
      }
      tickerStats[mention.ticker].count++;
      tickerStats[mention.ticker].sentiments.push(mention.entitySentiment);
    }

    const trending = Object.entries(tickerStats)
      .map(([ticker, stats]) => ({
        ticker,
        mentionCount: stats.count,
        avgSentiment: stats.sentiments.reduce((a, b) => a + b, 0) / stats.sentiments.length,
      }))
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, limit);

    res.json({ trending });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Financial News API running on port ${PORT}`);
});
