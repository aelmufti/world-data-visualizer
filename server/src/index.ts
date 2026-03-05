import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initDatabase, getDatabase, collections } from './database.js';
import NodeCache from 'node-cache';
import aggregationRouter from './aggregation-endpoint.js';
import marketDataRouter from './market-data-endpoint.js';
import historicalDataRouter from './stock-market/historical-data-endpoint.js';
import searchRouter from './stock-market/search-endpoint.js';
import marketStatusRouter from './stock-market/market-status-endpoint.js';
import quoteRouter from './stock-market/quote-endpoint.js';
import companyRouter from './company-endpoint.js';
import politicianTradingRouter from './politician-trading-endpoint.js';
import congressRouter from './congress-tracker/endpoints.js';
import fearGreedRouter from './fear-greed-endpoint.js';
import cortisolRouter from './cortisol-endpoint.js';
import { setupAISProxy } from './ais-proxy.js';
import { StockWebSocketServer } from './stock-market/websocket-server.js';
import { RSSWorker } from './rss-worker-duckdb.js';
import { NewsWebSocketServer } from './news-websocket-server.js';
import { congressPipeline } from './congress-tracker/pipeline.js';
import { congressPoller } from './congress-tracker/poller.js';

const app = express();
const PORT = process.env.PORT || 8000;
const cache = new NodeCache({ stdTTL: 60 });

// Créer un serveur HTTP pour supporter WebSocket
const server = createServer(app);

// Initialize Stock Market WebSocket Server on port 8001
let stockWsServer: StockWebSocketServer | null = null;
let newsWsServer: NewsWebSocketServer | null = null;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      database: db ? 'connected' : 'disconnected',
      websocket: stockWsServer ? 'running' : 'stopped',
      newsWebsocket: newsWsServer ? 'running' : 'stopped',
      rssWorker: rssWorker ? 'running' : 'stopped',
      congressTracker: congressPipeline ? 'running' : 'stopped'
    }
  });
});

// Backend status endpoint with detailed service information
app.get('/api/status', async (req, res) => {
  try {
    const services = {
      database: {
        status: db ? 'operational' : 'down',
        name: 'DuckDB',
        icon: '🗄️'
      },
      yahooFinance: {
        status: stockWsServer ? 'operational' : 'down',
        name: 'Yahoo Finance',
        icon: '📈'
      },
      newsWebSocket: {
        status: newsWsServer ? 'operational' : 'down',
        name: 'News Feed',
        icon: '📰'
      },
      rssWorker: {
        status: rssWorker ? 'operational' : 'down',
        name: 'RSS Worker',
        icon: '📡'
      },
      congressTracker: {
        status: congressPipeline ? 'operational' : 'down',
        name: 'Congress Tracker',
        icon: '🗳️'
      }
    };

    // Check if congress poller is running
    const congressPollerStatus = congressPoller ? 'operational' : 'down';
    
    res.json({
      overall: Object.values(services).every(s => s.status === 'operational') ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        ...services,
        congressPoller: {
          status: congressPollerStatus,
          name: 'Congress Poller',
          icon: '🔄'
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      overall: 'down',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize database
let db: any;
let rssWorker: RSSWorker | null = null;

initDatabase().then(async (database) => {
  db = database;
  console.log('✅ Database initialized');
  
  // Initialize Congress tracker pipeline
  await congressPipeline.initialize();
  
  // Start Congress poller
  await congressPoller.start();
  
  // Initialize WebSocket servers AFTER database is ready
  try {
    stockWsServer = new StockWebSocketServer(server, '/stock-prices');
    console.log(`📈 Stock Market WebSocket server initialized on ws://localhost:${PORT}/stock-prices`);
  } catch (error) {
    console.error('❌ Failed to initialize Stock Market WebSocket server:', error);
  }

  try {
    newsWsServer = new NewsWebSocketServer(server, '/news-updates');
    console.log(`📰 News WebSocket server initialized on ws://localhost:${PORT}/news-updates`);
  } catch (error) {
    console.error('❌ Failed to initialize News WebSocket server:', error);
  }
  
  // Start RSS worker after database is ready
  rssWorker = new RSSWorker();
  rssWorker.run().catch((error) => {
    console.error('❌ RSS Worker failed:', error);
  });
}).catch((error) => {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
});

// Setup AIS WebSocket proxy
setupAISProxy(server);

// Routes d'agrégation intelligente
app.use('/api/aggregated', aggregationRouter);

// Routes de données de marché
app.use('/api', marketDataRouter);

// Routes de quotes boursières
app.use('/api', quoteRouter);

// Routes de données historiques de marché boursier
app.use('/api', historicalDataRouter);

// Routes de recherche de symboles boursiers
app.use('/api', searchRouter);

// Routes de statut de marché
app.use('/api', marketStatusRouter);

// Routes de compagnies
app.use('/api/companies', companyRouter);

// Routes de trading politique
app.use('/api', politicianTradingRouter);

// Routes de Congress tracker
app.use('/api/congress', congressRouter);

// Routes de Fear & Greed Index
app.use('/api/fear-greed', fearGreedRouter);

// Cortisol Level endpoint
app.use('/api/cortisol', cortisolRouter);

// Database query endpoint (for development/debugging)
app.post('/api/db/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Only allow SELECT queries for safety
    if (!query.trim().toUpperCase().startsWith('SELECT')) {
      return res.status(400).json({ error: 'Only SELECT queries are allowed' });
    }

    const results = await getDatabase().all(query);
    res.json({ results, count: results.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware: API Key verification
const verifyApiKey = async (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const keyDoc = await getDatabase().all(`
    SELECT * FROM ${collections.apiKeys}
    WHERE key = ? AND is_active = TRUE
    LIMIT 1
  `, apiKey);

  if (keyDoc.length === 0) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.apiKey = keyDoc[0];
  next();
};

// Middleware: Rate limiting
const rateLimiter = (req: any, res: any, next: any) => {
  const key = `rate:${req.apiKey.key}`;
  const current = cache.get<number>(key) || 0;

  if (current >= req.apiKey.rate_limit) {
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
    const { ticker, sentiment_min, sentiment_max, from_date, to_date, limit = 20 } = req.query;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (from_date) {
      whereClauses.push('published_at >= ?');
      params.push(new Date(from_date as string).toISOString());
    }
    if (to_date) {
      whereClauses.push('published_at <= ?');
      params.push(new Date(to_date as string).toISOString());
    }
    if (sentiment_min) {
      whereClauses.push('raw_sentiment >= ?');
      params.push(parseFloat(sentiment_min as string));
    }
    if (sentiment_max) {
      whereClauses.push('raw_sentiment <= ?');
      params.push(parseFloat(sentiment_max as string));
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const articles = await getDatabase().all(`
      SELECT * FROM ${collections.articles}
      ${whereClause}
      ORDER BY published_at DESC
      LIMIT ?
    `, ...params, parseInt(limit as string));

    const result = [];

    for (const article of articles) {
      const mentions = await getDatabase().all(`
        SELECT * FROM ${collections.mentions} WHERE article_id = ?
      `, article.id);

      // Filter by ticker if specified
      if (ticker) {
        const tickers = (ticker as string).split(',').map((t: string) => t.trim().toUpperCase());
        if (!mentions.some((m: any) => tickers.includes(m.ticker))) {
          continue;
        }
      }

      const latency = (new Date(article.ingested_at).getTime() - new Date(article.published_at).getTime()) / 1000;

      result.push({
        id: article.id,
        title: article.title,
        url: article.url,
        publishedAt: article.published_at,
        ingestedAt: article.ingested_at,
        latencySeconds: latency,
        source: article.source_domain,
        companies: mentions.map((c: any) => ({
          ticker: c.ticker,
          mentionCount: c.mention_count,
          entitySentiment: c.entity_sentiment,
          isPrimarySubject: c.is_primary_subject,
          eventTags: c.event_tags || [],
        })),
      });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /companies/:ticker/summary
app.get('/companies/:ticker/summary', verifyApiKey, rateLimiter, async (req, res) => {
  try {
    const { ticker } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;

    const companies = await getDatabase().all(`
      SELECT * FROM ${collections.companies} 
      WHERE ticker = ? 
      LIMIT 1
    `, ticker.toUpperCase());

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = companies[0];
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const mentions = await getDatabase().all(`
      SELECT * FROM ${collections.mentions} WHERE company_id = ?
    `, company.id);

    const articleCount = mentions.length;
    const avgSentiment = mentions.length > 0
      ? mentions.reduce((sum: number, m: any) => sum + m.entity_sentiment, 0) / mentions.length
      : 0;

    const events = await getDatabase().all(`
      SELECT * FROM ${collections.events}
      WHERE company_id = ? AND detected_at >= ?
      ORDER BY detected_at DESC
      LIMIT 10
    `, company.id, since.toISOString());

    const recentEvents = events.map((e: any) => ({
      eventType: e.event_type,
      confidence: e.confidence,
      detectedAt: e.detected_at,
    }));

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

    let whereClauses: string[] = ['confidence >= ?'];
    let params: any[] = [parseFloat(confidence_min as string)];

    if (ticker) {
      whereClauses.push('ticker = ?');
      params.push((ticker as string).toUpperCase());
    }
    if (event_type) {
      whereClauses.push('event_type = ?');
      params.push(event_type);
    }
    if (from_date) {
      whereClauses.push('detected_at >= ?');
      params.push(new Date(from_date as string).toISOString());
    }

    const events = await getDatabase().all(`
      SELECT * FROM ${collections.events}
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY detected_at DESC
      LIMIT ?
    `, ...params, parseInt(limit as string));

    const result = events.map((e: any) => ({
      id: e.id,
      ticker: e.ticker,
      eventType: e.event_type,
      confidence: e.confidence,
      detectedAt: e.detected_at,
      articleUrl: e.article_url,
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /trending
app.get('/trending', verifyApiKey, rateLimiter, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const mentions = await getDatabase().all(`SELECT * FROM ${collections.mentions}`);

    // Aggregate by ticker
    const tickerStats: Record<string, { count: number; sentiments: number[] }> = {};

    for (const mention of mentions) {
      if (!tickerStats[mention.ticker]) {
        tickerStats[mention.ticker] = { count: 0, sentiments: [] };
      }
      tickerStats[mention.ticker].count++;
      tickerStats[mention.ticker].sentiments.push(mention.entity_sentiment);
    }

    const trending = Object.entries(tickerStats)
      .map(([ticker, stats]) => ({
        ticker,
        mentionCount: stats.count,
        avgSentiment: stats.sentiments.reduce((a: number, b: number) => a + b, 0) / stats.sentiments.length,
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
